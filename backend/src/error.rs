use warp::{http::StatusCode, reject::Reject, Reply};
use serde_json::json;
use thiserror::Error;

/// Application-specific error types
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] diesel::result::Error),
    
    #[error("Database pool error: {0}")]
    DatabasePool(String),
    
    #[error("HTTP client error: {0}")]
    HttpClient(#[from] reqwest::Error),
    
    #[error("JSON serialization error: {0}")]
    JsonSerialization(#[from] serde_json::Error),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Validation errors: {0}")]
    ValidationErrors(#[from] validator::ValidationErrors),
    
    #[error("Connection pool error: {0}")]
    ConnectionPool(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Authentication error: {0}")]
    AuthenticationError(String),
    
    #[error("Internal server error: {0}")]
    InternalError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(String),
    
    #[error("Validation error: {0}")]
    ValidationError(String),
    
    #[error("Series not found: {0}")]
    SeriesNotFound(String),
    
    #[error("Data source not found: {0}")]
    DataSourceNotFound(String),
    
    #[error("Invalid date format: {0}")]
    InvalidDateFormat(String),
    
    #[error("Invalid transformation: {0}")]
    InvalidTransformation(String),
    
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[error("External API error: {0}")]
    ExternalApiError(String),
    
    #[error("Parser error: {0}")]
    ParserError(String),
    
    #[error("Migration error: {0}")]
    MigrationError(String),
    
    #[error("Crawler error: {0}")]
    CrawlerError(String),
    
    #[error("Search error: {0}")]
    SearchError(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("Forbidden: {0}")]
    Forbidden(String),
    
    #[error("Conflict: {0}")]
    Conflict(String),
    
    #[error("Unprocessable entity: {0}")]
    UnprocessableEntity(String),
    
    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
}

impl Reject for AppError {}

/// Convert AppError to HTTP response
pub fn handle_rejection(err: warp::Rejection) -> Result<impl Reply, std::convert::Infallible> {
    let (code, message) = if err.is_not_found() {
        (StatusCode::NOT_FOUND, "Not Found".to_string())
    } else if let Some(app_error) = err.find::<AppError>() {
        match app_error {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string()),
            AppError::DatabasePool(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database connection error".to_string()),
            AppError::HttpClient(_) => (StatusCode::BAD_GATEWAY, "External service error".to_string()),
            AppError::JsonSerialization(_) => (StatusCode::BAD_REQUEST, "Invalid JSON".to_string()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::ValidationErrors(_) => (StatusCode::BAD_REQUEST, "Validation failed".to_string()),
            AppError::ConnectionPool(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Connection pool error".to_string()),
            AppError::ConfigError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error".to_string()),
            AppError::Io(_) => (StatusCode::INTERNAL_SERVER_ERROR, "I/O error".to_string()),
            AppError::AuthenticationError(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            AppError::InternalError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string()),
            AppError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string()),
            AppError::ValidationError(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::SeriesNotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::DataSourceNotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::InvalidDateFormat(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::InvalidTransformation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::RateLimitExceeded => (StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded".to_string()),
            AppError::ExternalApiError(_) => (StatusCode::BAD_GATEWAY, "External API error".to_string()),
            AppError::ParserError(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::MigrationError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Migration error".to_string()),
            AppError::CrawlerError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Crawler error".to_string()),
            AppError::SearchError(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::PermissionDenied(msg) => (StatusCode::FORBIDDEN, msg.clone()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            AppError::UnprocessableEntity(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg.clone()),
            AppError::ServiceUnavailable(msg) => (StatusCode::SERVICE_UNAVAILABLE, msg.clone()),
        }
    } else if err.find::<warp::filters::body::BodyDeserializeError>().is_some() {
        (StatusCode::BAD_REQUEST, "Invalid request body".to_string())
    } else if err.find::<warp::reject::MethodNotAllowed>().is_some() {
        (StatusCode::METHOD_NOT_ALLOWED, "Method not allowed".to_string())
    } else {
        tracing::error!("Unhandled rejection: {:?}", err);
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    };

    let json = warp::reply::json(&json!({
        "error": message,
        "code": code.as_u16()
    }));

    Ok(warp::reply::with_status(json, code))
}

/// Result type alias for convenience
pub type AppResult<T> = Result<T, AppError>;

/// Convert from bb8 pool error
impl From<bb8::RunError<diesel_async::pooled_connection::PoolError>> for AppError {
    fn from(err: bb8::RunError<diesel_async::pooled_connection::PoolError>) -> Self {
        AppError::ConnectionPool(err.to_string())
    }
}

/// Convert from diesel migration error
impl From<diesel_migrations::MigrationError> for AppError {
    fn from(err: diesel_migrations::MigrationError) -> Self {
        AppError::MigrationError(err.to_string())
    }
}

/// Convert from chrono parse error
impl From<chrono::ParseError> for AppError {
    fn from(err: chrono::ParseError) -> Self {
        AppError::InvalidDateFormat(err.to_string())
    }
}

/// Convert from uuid parse error
impl From<uuid::Error> for AppError {
    fn from(err: uuid::Error) -> Self {
        AppError::ValidationError(format!("Invalid UUID: {}", err))
    }
}

/// Convert from bigdecimal parse error
impl From<bigdecimal::ParseBigDecimalError> for AppError {
    fn from(err: bigdecimal::ParseBigDecimalError) -> Self {
        AppError::ValidationError(format!("Invalid decimal: {}", err))
    }
}

/// Convert from config error
impl From<config::ConfigError> for AppError {
    fn from(err: config::ConfigError) -> Self {
        AppError::ConfigError(err.to_string())
    }
}

/// Convert from async-graphql error
impl From<async_graphql::Error> for AppError {
    fn from(err: async_graphql::Error) -> Self {
        AppError::ValidationError(err.message)
    }
}

/// Convert from JWT errors
impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AppError::AuthenticationError(format!("JWT error: {}", err))
    }
}

/// Convert from bcrypt errors
impl From<bcrypt::BcryptError> for AppError {
    fn from(err: bcrypt::BcryptError) -> Self {
        AppError::AuthenticationError(format!("Password hashing error: {}", err))
    }
}

/// Utility functions for common error scenarios
impl AppError {
    pub fn not_found<T: std::fmt::Display>(resource: T) -> Self {
        AppError::NotFound(format!("{} not found", resource))
    }

    pub fn bad_request<T: std::fmt::Display>(message: T) -> Self {
        AppError::BadRequest(message.to_string())
    }

    pub fn unauthorized<T: std::fmt::Display>(message: T) -> Self {
        AppError::Unauthorized(message.to_string())
    }

    pub fn forbidden<T: std::fmt::Display>(message: T) -> Self {
        AppError::Forbidden(message.to_string())
    }

    pub fn internal_error<T: std::fmt::Display>(message: T) -> Self {
        AppError::InternalError(message.to_string())
    }

    pub fn validation_error<T: std::fmt::Display>(message: T) -> Self {
        AppError::ValidationError(message.to_string())
    }

    pub fn database_error<T: std::fmt::Display>(message: T) -> Self {
        AppError::DatabaseError(message.to_string())
    }

    pub fn authentication_error<T: std::fmt::Display>(message: T) -> Self {
        AppError::AuthenticationError(message.to_string())
    }
}