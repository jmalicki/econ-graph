use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
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
    PoolError(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Internal server error: {0}")]
    Internal(String),
    
    #[error("External API error: {0}")]
    ExternalApi(String),
    
    #[error("Rate limit exceeded")]
    RateLimit,
    
    #[error("Unauthorized access")]
    Unauthorized,
    
    #[error("Authentication error: {0}")]
    AuthenticationError(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(String),
    
    #[error("Validation error: {0}")]
    ValidationError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message, error_code) = match &self {
            AppError::Database(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database error occurred",
                "DATABASE_ERROR",
            ),
            AppError::DatabasePool(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database connection error",
                "DATABASE_CONNECTION_ERROR",
            ),
            AppError::HttpClient(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "External service error",
                "EXTERNAL_SERVICE_ERROR",
            ),
            AppError::JsonSerialization(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Data serialization error",
                "SERIALIZATION_ERROR",
            ),
            AppError::Validation(msg) => (
                StatusCode::BAD_REQUEST,
                msg.as_str(),
                "VALIDATION_ERROR",
            ),
            AppError::NotFound(msg) => (
                StatusCode::NOT_FOUND,
                msg.as_str(),
                "NOT_FOUND",
            ),
            AppError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                msg.as_str(),
                "BAD_REQUEST",
            ),
            AppError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                msg.as_str(),
                "INTERNAL_ERROR",
            ),
            AppError::ExternalApi(msg) => (
                StatusCode::BAD_GATEWAY,
                msg.as_str(),
                "EXTERNAL_API_ERROR",
            ),
            AppError::RateLimit => (
                StatusCode::TOO_MANY_REQUESTS,
                "Rate limit exceeded",
                "RATE_LIMIT_EXCEEDED",
            ),
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "Unauthorized access",
                "UNAUTHORIZED",
            ),
            AppError::ValidationErrors(_) => (
                StatusCode::BAD_REQUEST,
                "Validation failed",
                "VALIDATION_ERROR",
            ),
            AppError::PoolError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database connection error",
                "POOL_ERROR",
            ),
            AppError::AuthenticationError(msg) => (
                StatusCode::UNAUTHORIZED,
                msg.as_str(),
                "AUTHENTICATION_ERROR",
            ),
            AppError::InternalError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                msg.as_str(),
                "INTERNAL_ERROR",
            ),
            AppError::DatabaseError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                msg.as_str(),
                "DATABASE_ERROR",
            ),
            AppError::ValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                msg.as_str(),
                "VALIDATION_ERROR",
            ),
        };

        // Log the error for debugging
        tracing::error!("Application error: {}", self);

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": error_message,
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }
        }));

        (status, body).into_response()
    }
}

/// Result type alias for application operations
pub type AppResult<T> = Result<T, AppError>;

/// Helper trait for converting validation errors
pub trait ValidationErrorExt<T> {
    fn validation_error(self, message: &str) -> AppResult<T>;
}

impl<T, E> ValidationErrorExt<T> for Result<T, E>
where
    E: std::fmt::Display,
{
    fn validation_error(self, message: &str) -> AppResult<T> {
        self.map_err(|e| AppError::Validation(format!("{}: {}", message, e)))
    }
}

// Pool error conversion for bb8
impl<E> From<bb8::RunError<E>> for AppError 
where 
    E: std::error::Error + Send + Sync + 'static
{
    fn from(err: bb8::RunError<E>) -> Self {
        AppError::PoolError(format!("Pool error: {}", err))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;

    #[test]
    fn test_app_error_response() {
        // REQUIREMENT: GraphQL and REST APIs should return consistent, well-structured error responses
        // PURPOSE: Verify that AppError converts to proper HTTP responses with correct status codes
        // This ensures clients receive predictable error formats for proper error handling
        
        let error = AppError::NotFound("Series not found".to_string());
        let response = error.into_response();
        
        // Verify HTTP 404 status for NotFound errors - required for RESTful error handling
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        // Note: Response body testing would require integration tests with actual HTTP server
    }

    #[test]
    fn test_validation_error_ext() {
        // REQUIREMENT: Input validation should provide clear error messages to users
        // PURPOSE: Verify that the ValidationErrorExt trait properly formats validation errors
        // This ensures users get helpful feedback when they provide invalid input
        
        let result: Result<i32, &str> = Err("invalid input");
        let app_result = result.validation_error("Test validation");
        
        // Verify validation error is properly wrapped
        assert!(app_result.is_err());
        match app_result.unwrap_err() {
            AppError::Validation(msg) => {
                // Verify error message includes context - required for user feedback
                assert!(msg.contains("Test validation"));
                // Verify error message includes original error - required for debugging
                assert!(msg.contains("invalid input"));
            }
            _ => panic!("Expected validation error, got different error type"),
        }
    }
}
