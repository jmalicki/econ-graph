use axum::{
    extract::State,
    response::Json,
};
use serde_json::{json, Value};

use crate::{
    error::AppResult,
    services::{crawler_service, queue_service},
    AppState,
};

/// Get crawler status and statistics
pub async fn crawler_status(
    State(state): State<AppState>,
) -> AppResult<Json<Value>> {
    let queue_stats = queue_service::get_queue_statistics(&state.db_pool).await?;
    let crawler_status = crawler_service::get_crawler_status().await?;
    
    Ok(Json(json!({
        "crawler": crawler_status,
        "queue": queue_stats,
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

/// Manually trigger a crawl for specific sources or series
pub async fn trigger_crawl(
    State(state): State<AppState>,
    Json(request): Json<TriggerCrawlRequest>,
) -> AppResult<Json<Value>> {
    let queued_items = crawler_service::trigger_manual_crawl(
        &state.db_pool,
        request.sources,
        request.series_ids,
        request.priority.unwrap_or(5),
    ).await?;
    
    Ok(Json(json!({
        "message": "Crawl triggered successfully",
        "queued_items": queued_items,
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

/// Request body for triggering crawls
#[derive(serde::Deserialize)]
pub struct TriggerCrawlRequest {
    pub sources: Option<Vec<String>>,
    pub series_ids: Option<Vec<String>>,
    pub priority: Option<i32>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trigger_crawl_request_deserialize() {
        let json_str = r#"{
            "sources": ["FRED", "BLS"],
            "series_ids": ["GDP", "UNRATE"],
            "priority": 8
        }"#;
        
        let request: TriggerCrawlRequest = serde_json::from_str(json_str).unwrap();
        
        assert_eq!(request.sources, Some(vec!["FRED".to_string(), "BLS".to_string()]));
        assert_eq!(request.series_ids, Some(vec!["GDP".to_string(), "UNRATE".to_string()]));
        assert_eq!(request.priority, Some(8));
    }
    
    #[test]
    fn test_trigger_crawl_request_minimal() {
        let json_str = r#"{}"#;
        
        let request: TriggerCrawlRequest = serde_json::from_str(json_str).unwrap();
        
        assert_eq!(request.sources, None);
        assert_eq!(request.series_ids, None);
        assert_eq!(request.priority, None);
    }
}
