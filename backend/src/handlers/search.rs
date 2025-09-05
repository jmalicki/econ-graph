use axum::{
    extract::{Query, State},
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use validator::Validate;

use crate::{
    error::{AppError, AppResult},
    services::search_service,
    AppState,
};

/// Search economic series
pub async fn search_series(
    State(state): State<AppState>,
    Query(params): Query<SearchParams>,
) -> AppResult<Json<Value>> {
    // Validate search parameters
    params.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let results = search_service::search_series(&state.db_pool, params).await?;
    
    Ok(Json(json!({
        "data": results.results,
        "total_count": results.total_count,
        "page": results.page,
        "per_page": results.per_page,
        "total_pages": results.total_pages,
        "query": results.query,
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

/// Search parameters
#[derive(Debug, Deserialize, Validate)]
pub struct SearchParams {
    #[validate(length(min = 1, max = 200))]
    pub q: String,
    pub source: Option<String>,
    pub frequency: Option<String>,
    pub category: Option<String>,
    #[validate(range(min = 1, max = 100))]
    pub per_page: Option<i64>,
    #[validate(range(min = 1))]
    pub page: Option<i64>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

impl Default for SearchParams {
    fn default() -> Self {
        Self {
            q: String::new(),
            source: None,
            frequency: None,
            category: None,
            per_page: Some(20),
            page: Some(1),
            sort_by: Some("relevance".to_string()),
            sort_order: Some("desc".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_params_validation() {
        let valid_params = SearchParams {
            q: "GDP".to_string(),
            source: Some("FRED".to_string()),
            per_page: Some(20),
            page: Some(1),
            ..Default::default()
        };
        
        assert!(valid_params.validate().is_ok());
        
        // Test empty query
        let empty_query = SearchParams {
            q: "".to_string(),
            ..Default::default()
        };
        
        assert!(empty_query.validate().is_err());
        
        // Test invalid per_page
        let invalid_per_page = SearchParams {
            q: "GDP".to_string(),
            per_page: Some(200), // Too large
            ..Default::default()
        };
        
        assert!(invalid_per_page.validate().is_err());
    }
}
