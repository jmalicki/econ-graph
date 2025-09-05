use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::signal;
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::{info, warn};

mod config;
mod database;
mod error;
mod graphql;
mod handlers;
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

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub db_pool: DatabasePool,
    pub config: Arc<Config>,
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
    database::run_migrations(&db_pool).await?;
    
    // Create application state
    let state = AppState {
        db_pool,
        config: config.clone(),
    };

    // Build the application router
    let app = create_app(state);

    // Start the crawler service in the background
    let crawler_state = AppState {
        db_pool: state.db_pool.clone(),
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
fn create_app(state: AppState) -> Router {
    use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
    
    // Create GraphQL schema with data context
    let schema = graphql::create_schema_with_data(state.db_pool.clone());
    
    // GraphQL handler
    let graphql_handler = |req: GraphQLRequest| async move {
        let response = schema.execute(req.into_inner()).await;
        GraphQLResponse::from(response)
    };
    
    Router::new()
        // Health check endpoint
        .route("/health", get(health_check))
        
        // GraphQL endpoints
        .route("/graphql", post(graphql_handler.clone()).get(graphql_handler))
        
        // GraphQL Playground (development only)
        .route("/graphql/playground", get(graphql_playground))
        
        // Legacy REST endpoints (for backward compatibility during transition)
        .route("/api/admin/crawler/status", get(handlers::admin::crawler_status))
        .route("/api/admin/crawler/trigger", post(handlers::admin::trigger_crawl))
        
        // Add middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive()) // TODO: Configure CORS properly for production
        )
        .with_state(state)
}

/// GraphQL Playground handler (development only)
async fn graphql_playground() -> impl axum::response::IntoResponse {
    axum::response::Html(async_graphql::http::playground_source(
        async_graphql::http::GraphQLPlaygroundConfig::new("/graphql")
            .subscription_endpoint("/graphql/ws")
    ))
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
        let db_pool = database::create_test_pool().await.unwrap();
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
