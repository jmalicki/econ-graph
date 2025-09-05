use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use bigdecimal::BigDecimal;
use serde_json::Value;

use crate::{
    database::DatabasePool,
    error::{AppError, AppResult},
    models::{
        DataPoint, DataQueryParams, DataTransformation, EconomicSeries, SeriesSearchParams,
        TransformedDataPoint,
    },
    schema::{data_points, economic_series},
};

/// List economic series with optional filtering
pub async fn list_series(
    pool: &DatabasePool,
    params: SeriesSearchParams,
) -> AppResult<Vec<EconomicSeries>> {
    let mut conn = pool.get().await?;
    
    let mut query = economic_series::table
        .filter(economic_series::is_active.eq(params.is_active.unwrap_or(true)))
        .into_boxed();
    
    // Apply filters
    if let Some(source_id) = params.source_id {
        query = query.filter(economic_series::source_id.eq(source_id));
    }
    
    if let Some(frequency) = params.frequency {
        query = query.filter(economic_series::frequency.eq(frequency));
    }
    
    if let Some(search_query) = params.query {
        // Use PostgreSQL full-text search
        let search_term = format!("%{}%", search_query);
        query = query.filter(
            economic_series::title.ilike(&search_term)
                .or(economic_series::description.ilike(&search_term))
        );
    }
    
    // Apply pagination
    let limit = params.limit.unwrap_or(50).min(1000);
    let offset = params.offset.unwrap_or(0);
    
    query = query.limit(limit).offset(offset);
    
    // Order by last_updated desc, then by title
    query = query
        .order_by(economic_series::last_updated.desc())
        .then_order_by(economic_series::title.asc());
    
    let series = query.load::<EconomicSeries>(&mut *conn).await?;
    
    Ok(series)
}

/// Get a specific economic series by ID
pub async fn get_series_by_id(
    pool: &DatabasePool,
    series_id: uuid::Uuid,
) -> AppResult<Option<EconomicSeries>> {
    let mut conn = pool.get().await?;
    
    let series = economic_series::table
        .filter(economic_series::id.eq(series_id))
        .first::<EconomicSeries>(&mut *conn)
        .await
        .optional()?;
    
    Ok(series)
}

/// Get data points for a specific series
pub async fn get_series_data(
    pool: &DatabasePool,
    params: DataQueryParams,
) -> AppResult<Vec<DataPoint>> {
    let mut conn = pool.get().await?;
    
    let mut query = data_points::table
        .filter(data_points::series_id.eq(params.series_id))
        .into_boxed();
    
    // Apply date range filters
    if let Some(start_date) = params.start_date {
        query = query.filter(data_points::date.ge(start_date));
    }
    
    if let Some(end_date) = params.end_date {
        query = query.filter(data_points::date.le(end_date));
    }
    
    // Apply revision filters
    if let Some(original_only) = params.original_only {
        if original_only {
            query = query.filter(data_points::is_original_release.eq(true));
        }
    }
    
    if let Some(latest_revision_only) = params.latest_revision_only {
        if latest_revision_only {
            // This is a complex query - for now, we'll handle it in the application layer
            // In production, this should be optimized with a proper SQL query
        }
    }
    
    // Apply pagination
    let limit = params.limit.unwrap_or(1000).min(10000);
    let offset = params.offset.unwrap_or(0);
    
    query = query.limit(limit).offset(offset);
    
    // Order by date
    query = query.order_by(data_points::date.asc());
    
    let mut data_points = query.load::<DataPoint>(&mut *conn).await?;
    
    // Post-process for latest revision only if requested
    if params.latest_revision_only.unwrap_or(false) {
        data_points = filter_latest_revisions(data_points);
    }
    
    Ok(data_points)
}

/// Transform data points according to the specified transformation
pub async fn transform_data_points(
    data_points: Vec<DataPoint>,
    transformation: DataTransformation,
) -> AppResult<Vec<Value>> {
    match transformation {
        DataTransformation::None => {
            Ok(data_points.into_iter().map(|dp| {
                serde_json::json!({
                    "date": dp.date,
                    "value": dp.value,
                    "revision_date": dp.revision_date,
                    "is_original_release": dp.is_original_release
                })
            }).collect())
        }
        DataTransformation::YearOverYear => {
            Ok(calculate_yoy_changes(data_points).into_iter().map(|tdp| {
                serde_json::json!({
                    "date": tdp.date,
                    "original_value": tdp.original_value,
                    "transformed_value": tdp.transformed_value,
                    "transformation": tdp.transformation,
                    "revision_date": tdp.revision_date,
                    "is_original_release": tdp.is_original_release
                })
            }).collect())
        }
        DataTransformation::QuarterOverQuarter => {
            Ok(calculate_qoq_changes(data_points).into_iter().map(|tdp| {
                serde_json::json!({
                    "date": tdp.date,
                    "original_value": tdp.original_value,
                    "transformed_value": tdp.transformed_value,
                    "transformation": tdp.transformation,
                    "revision_date": tdp.revision_date,
                    "is_original_release": tdp.is_original_release
                })
            }).collect())
        }
        DataTransformation::MonthOverMonth => {
            Ok(calculate_mom_changes(data_points).into_iter().map(|tdp| {
                serde_json::json!({
                    "date": tdp.date,
                    "original_value": tdp.original_value,
                    "transformed_value": tdp.transformed_value,
                    "transformation": tdp.transformation,
                    "revision_date": tdp.revision_date,
                    "is_original_release": tdp.is_original_release
                })
            }).collect())
        }
        _ => Err(AppError::BadRequest("Unsupported transformation".to_string())),
    }
}

/// Filter data points to keep only the latest revision for each date
fn filter_latest_revisions(data_points: Vec<DataPoint>) -> Vec<DataPoint> {
    use std::collections::HashMap;
    
    let mut latest_revisions: HashMap<chrono::NaiveDate, DataPoint> = HashMap::new();
    
    for data_point in data_points {
        let date = data_point.date;
        
        match latest_revisions.get(&date) {
            Some(existing) => {
                if data_point.revision_date > existing.revision_date {
                    latest_revisions.insert(date, data_point);
                }
            }
            None => {
                latest_revisions.insert(date, data_point);
            }
        }
    }
    
    let mut result: Vec<DataPoint> = latest_revisions.into_values().collect();
    result.sort_by(|a, b| a.date.cmp(&b.date));
    
    result
}

/// Calculate year-over-year changes
fn calculate_yoy_changes(data_points: Vec<DataPoint>) -> Vec<TransformedDataPoint> {
    let mut result = Vec::new();
    let mut previous_year_values: std::collections::HashMap<(i32, u32, u32), bigdecimal::BigDecimal> = 
        std::collections::HashMap::new();
    
    for data_point in data_points {
        let date = data_point.date;
        let previous_year = date.year() - 1;
        let key = (previous_year, date.month(), date.day());
        
        let transformed_value = if let (Some(current_value), Some(previous_value)) = 
            (data_point.value, previous_year_values.get(&(date.year(), date.month(), date.day()))) {
            data_point.calculate_yoy_change(Some(*previous_value))
        } else {
            None
        };
        
        // Store current value for next year's calculation
        if let Some(value) = data_point.value {
            previous_year_values.insert((date.year(), date.month(), date.day()), value);
        }
        
        result.push(TransformedDataPoint {
            date: data_point.date,
            original_value: data_point.value,
            transformed_value,
            transformation: DataTransformation::YearOverYear,
            revision_date: data_point.revision_date,
            is_original_release: data_point.is_original_release,
        });
    }
    
    result
}

/// Calculate quarter-over-quarter changes
fn calculate_qoq_changes(data_points: Vec<DataPoint>) -> Vec<TransformedDataPoint> {
    let mut result = Vec::new();
    let mut previous_quarter_value: Option<bigdecimal::BigDecimal> = None;
    
    for data_point in data_points {
        let transformed_value = if let Some(current_value) = data_point.value {
            data_point.calculate_qoq_change(previous_quarter_value)
        } else {
            None
        };
        
        previous_quarter_value = data_point.value;
        
        result.push(TransformedDataPoint {
            date: data_point.date,
            original_value: data_point.value,
            transformed_value,
            transformation: DataTransformation::QuarterOverQuarter,
            revision_date: data_point.revision_date,
            is_original_release: data_point.is_original_release,
        });
    }
    
    result
}

/// Calculate month-over-month changes
fn calculate_mom_changes(data_points: Vec<DataPoint>) -> Vec<TransformedDataPoint> {
    let mut result = Vec::new();
    let mut previous_month_value: Option<bigdecimal::BigDecimal> = None;
    
    for data_point in data_points {
        let transformed_value = if let Some(current_value) = data_point.value {
            data_point.calculate_mom_change(previous_month_value)
        } else {
            None
        };
        
        previous_month_value = data_point.value;
        
        result.push(TransformedDataPoint {
            date: data_point.date,
            original_value: data_point.value,
            transformed_value,
            transformation: DataTransformation::MonthOverMonth,
            revision_date: data_point.revision_date,
            is_original_release: data_point.is_original_release,
        });
    }
    
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;
    use rust_decimal_macros::dec;
    use uuid::Uuid;

    #[test]
    fn test_filter_latest_revisions() {
        // REQUIREMENT: Support plotting both original releases and later corrections
        // PURPOSE: Verify that latest revision filtering works correctly for data analysis
        // This ensures users can choose between original and revised data for analysis
        
        let data_points = vec![
            DataPoint {
                id: Uuid::new_v4(),
                series_id: Uuid::new_v4(),
                date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
                value: Some(dec!(100.0)),
                revision_date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
                is_original_release: true,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            },
            DataPoint {
                id: Uuid::new_v4(),
                series_id: Uuid::new_v4(),
                date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
                value: Some(dec!(101.0)),
                revision_date: NaiveDate::from_ymd_opt(2024, 2, 1).unwrap(), // Later revision
                is_original_release: false,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            },
        ];
        
        let filtered = filter_latest_revisions(data_points);
        
        // Verify only latest revision is kept - important for accurate current analysis
        assert_eq!(filtered.len(), 1, "Should filter to only latest revision per date");
        // Verify correct revision value is preserved - ensures data accuracy
        assert_eq!(filtered[0].value, Some(dec!(101.0)), "Should keep the later revision value");
        // Verify revision metadata is maintained - important for data provenance
        assert!(!filtered[0].is_original_release, "Should preserve revision metadata");
    }

    #[test]
    fn test_calculate_yoy_changes() {
        // REQUIREMENT: Calculate year-over-year percentage changes for economic analysis
        // PURPOSE: Verify that YoY transformation calculations are mathematically correct
        // This is essential for economic analysis and matches standard industry practices
        
        let data_points = vec![
            DataPoint {
                id: Uuid::new_v4(),
                series_id: Uuid::new_v4(),
                date: NaiveDate::from_ymd_opt(2023, 1, 1).unwrap(),
                value: Some(dec!(100.0)),
                revision_date: NaiveDate::from_ymd_opt(2023, 1, 1).unwrap(),
                is_original_release: true,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            },
            DataPoint {
                id: Uuid::new_v4(),
                series_id: Uuid::new_v4(),
                date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
                value: Some(dec!(110.0)),
                revision_date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
                is_original_release: true,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            },
        ];
        
        let transformed = calculate_yoy_changes(data_points);
        
        // Verify correct number of transformed points - should match input
        assert_eq!(transformed.len(), 2, "Should transform all input data points");
        // Verify first point has no YoY value - no previous year data available
        assert_eq!(transformed[0].transformed_value, None, "First point should have no YoY calculation");
        // Verify second point has correct YoY calculation: (110-100)/100 * 100 = 10%
        assert_eq!(transformed[1].transformed_value, Some(dec!(10.0)), "YoY should be 10% increase");
    }
}
