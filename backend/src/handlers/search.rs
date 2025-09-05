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
    
    // Convert handler SearchParams to model SearchParams
    let model_params = crate::models::search::SearchParams {
        query: params.q.clone(),
        similarity_threshold: Some(0.3),
        limit: params.per_page.map(|p| p as i32),
        offset: params.page.map(|p| ((p - 1) * params.per_page.unwrap_or(20)) as i32),
        source_id: params.source.and_then(|s| s.parse::<i32>().ok()),
        frequency: params.frequency.clone(),
        include_inactive: Some(false),
        sort_by: Some(crate::models::search::SearchSortOrder::Relevance),
    };
    
    let results = search_service::search_series(&state.db_pool, &model_params).await?;
    
    Ok(Json(json!({
        "data": results,
        "total_count": results.len(),
        "page": 1,
        "per_page": results.len(),
        "total_pages": 1,
        "query": params.q,
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
