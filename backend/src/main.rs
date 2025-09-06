use axum::{
    extract::State,
    http::StatusCode,
    response::{Html, Json},
    routing::{get, post},
    Router,
};
use async_graphql::http::{playground_source, GraphQLPlaygroundConfig};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use std::sync::Arc;
use tokio::signal;
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::{info, warn};

mod config;
mod database;
mod error;
mod graphql;
mod models;
mod schema;
mod services;

#[cfg(test)]
mod test_utils;

#[cfg(test)]
mod integration_tests;

use config::Config;
use database::DatabasePool;
use error::AppError;

/// Configure CORS for production use
fn configure_cors() -> CorsLayer {
    use tower_http::cors::{Any, CorsLayer};
    use axum::http::{HeaderValue, Method};
    
    // Get allowed origins from environment variable, default to localhost for development
    let allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000".to_string());
    
    let origins: Vec<HeaderValue> = allowed_origins
        .split(',')
        .filter_map(|origin| {
            let trimmed = origin.trim();
            if trimmed.is_empty() {
                None
            } else {
                match trimmed.parse::<HeaderValue>() {
                    Ok(header_value) => {
                        tracing::info!("Allowing CORS origin: {}", trimmed);
                        Some(header_value)
                    }
                    Err(e) => {
                        tracing::warn!("Invalid CORS origin '{}': {}", trimmed, e);
                        None
                    }
                }
            }
        })
        .collect();
    
    // If no valid origins are provided, use permissive settings for development
    if origins.is_empty() {
        tracing::warn!("No valid CORS origins configured, using permissive CORS for development");
        return CorsLayer::permissive();
    }
    
    CorsLayer::new()
        // Allow specific origins
        .allow_origin(origins)
        // Allow specific methods
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::HEAD,
            Method::OPTIONS,
        ])
        // Allow specific headers
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::ACCEPT,
            axum::http::header::ACCEPT_LANGUAGE,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::CONTENT_LENGTH,
            axum::http::header::ORIGIN,
            axum::http::header::USER_AGENT,
            axum::http::header::REFERER,
        ])
        // Allow credentials (cookies, authorization headers)
        .allow_credentials(true)
        // Cache preflight requests for 1 hour
        .max_age(std::time::Duration::from_secs(3600))
}

/// GraphQL handler for processing GraphQL requests
async fn graphql_handler(
    State(state): State<AppState>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    state.schema.execute(req.into_inner()).await.into()
}

/// GraphQL Playground handler for development
async fn graphql_playground() -> Html<String> {
    Html(playground_source(GraphQLPlaygroundConfig::new("/graphql")))
}

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub db_pool: DatabasePool,
    pub config: Arc<Config>,
    pub schema: graphql::Schema<graphql::query::Query, graphql::mutation::Mutation, async_graphql::EmptySubscription>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    info!("Starting EconGraph backend server");

    // Load configuration
    let config = Arc::new(Config::from_env()?);
    
    // Initialize database pool
    let db_pool = database::create_pool(&config.database_url).await?;
    
    // Run database migrations
    database::run_migrations(&config.database_url).await?;
    
    // Create GraphQL schema with database pool
    let schema = graphql::create_schema_with_data(db_pool.clone());
    
    // Create application state
    let state = AppState {
        db_pool: db_pool.clone(),
        config: config.clone(),
        schema,
    };

    // Build the application router
    let app = create_app(state.clone());

    // Start the crawler service in the background
    let crawler_state = AppState {
        db_pool: db_pool.clone(),
        config: config.clone(),
    };
    tokio::spawn(services::crawler::start_crawler(crawler_state));

    // Create server address
    let addr = format!("{}:{}", config.server.host, config.server.port);
    info!("Server listening on {}", addr);

    // Start the server
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

/// Create the application router with all routes and middleware
pub fn create_app(state: AppState) -> Router {
    // Create GraphQL schema
    let schema = graphql::create_schema_with_data(state.db_pool.clone());
    
    Router::new()
        // Health check endpoint
        .route("/health", get(health_check))
        
        // GraphQL endpoints
        .route("/graphql", post(graphql_handler).get(graphql_handler))
        
        // GraphQL Playground (development only)
        .route("/graphql/playground", get(graphql_playground))
        
        .with_state(state)
        // Add middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(configure_cors())
        )
}


/// Simple health check endpoint
async fn health_check() -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

/// Graceful shutdown signal handler
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            warn!("Received Ctrl+C, shutting down gracefully");
        },
        _ = terminate => {
            warn!("Received terminate signal, shutting down gracefully");
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use axum_test::TestServer;

    #[tokio::test]
    async fn test_health_check() {
        // REQUIREMENT: The backend should provide a health check endpoint for monitoring
        // PURPOSE: Verify that the /health endpoint returns a 200 OK status with proper JSON response
        // This ensures that load balancers and monitoring systems can verify the service is running
        
        // Create a mock state for testing
        let config = Arc::new(Config::default());
        let container = crate::test_utils::TestContainer::new().await;
        let db_pool = container.pool();
        let state = AppState { db_pool, config };
        
        let app = create_app(state);
        let server = TestServer::new(app).unwrap();
        
        let response = server.get("/health").await;
        
        // Verify HTTP 200 OK status - required for health checks
        assert_eq!(response.status_code(), StatusCode::OK);
        
        let body: serde_json::Value = response.json();
        // Verify response contains "healthy" status - required for monitoring
        assert_eq!(body["status"], "healthy");
        // Verify timestamp is included - useful for debugging and monitoring
        assert!(body["timestamp"].is_string());
    }
}
