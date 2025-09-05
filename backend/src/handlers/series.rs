use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    error::{AppError, AppResult},
    models::{DataQueryParams, SeriesSearchParams},
    services::series_service,
    AppState,
};

/// List economic series with optional filtering
pub async fn list_series(
    State(state): State<AppState>,
    Query(params): Query<SeriesSearchParams>,
) -> AppResult<Json<Value>> {
    // Validate query parameters
    params.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let series = series_service::list_series(&state.db_pool, params).await?;
    
    Ok(Json(json!({
        "data": series,
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

/// Get a specific economic series by ID
pub async fn get_series(
    State(state): State<AppState>,
    Path(series_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let series = series_service::get_series_by_id(&state.db_pool, series_id).await?;
    
    match series {
        Some(series) => Ok(Json(json!({
            "data": series,
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))),
        None => Err(AppError::NotFound(format!("Series with ID {} not found", series_id))),
    }
}

/// Get data points for a specific series
pub async fn get_series_data(
    State(state): State<AppState>,
    Path(series_id): Path<Uuid>,
    Query(params): Query<DataRequestParams>,
) -> AppResult<Json<Value>> {
    // Validate query parameters
    params.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    // Convert to internal query params
    let query_params = DataQueryParams {
        series_id,
        start_date: params.start_date,
        end_date: params.end_date,
        original_only: params.original_only,
        latest_revision_only: params.latest_revision_only,
        limit: params.limit,
        offset: params.offset,
    };
    
    let data_points = series_service::get_series_data(&state.db_pool, query_params).await?;
    
    // Store transformation for response
    let transformation_name = params.transformation.as_ref().map(|t| t.clone()).unwrap_or_else(|| "none".to_string());
    
    // Apply transformation if requested
    let transformed_data = if let Some(transformation) = params.transformation {
        series_service::transform_data_points(data_points, transformation.into()).await?
    } else {
        data_points.into_iter().map(|dp| {
            json!({
                "date": dp.date,
                "value": dp.value,
                "revision_date": dp.revision_date,
                "is_original_release": dp.is_original_release
            })
        }).collect()
    };
    
    Ok(Json(json!({
        "data": transformed_data,
        "series_id": series_id,
        "transformation": transformation_name,
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

/// Request parameters for series data
#[derive(Debug, Deserialize, Validate)]
pub struct DataRequestParams {
    pub start_date: Option<chrono::NaiveDate>,
    pub end_date: Option<chrono::NaiveDate>,
    pub original_only: Option<bool>,
    pub latest_revision_only: Option<bool>,
    pub transformation: Option<String>,
    #[validate(range(min = 1, max = 10000))]
    pub limit: Option<i64>,
    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum_test::TestServer;
    use serde_json::Value;
    
    // Note: These tests would require a test database setup
    // For now, they serve as examples of how to structure tests
    
    #[tokio::test]
    async fn test_data_request_params_validation() {
        let valid_params = DataRequestParams {
            start_date: Some(chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap()),
            end_date: Some(chrono::NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            original_only: Some(true),
            latest_revision_only: None,
            transformation: Some("yoy".to_string()),
            limit: Some(1000),
            offset: Some(0),
        };
        
        assert!(valid_params.validate().is_ok());
        
        // Test invalid limit
        let invalid_params = DataRequestParams {
            limit: Some(20000), // Too large
            ..valid_params
        };
        
        assert!(invalid_params.validate().is_err());
    }
}
