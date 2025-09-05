use chrono::{DateTime, NaiveDate, Utc};
use diesel::prelude::*;
use bigdecimal::{BigDecimal, Zero};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::schema::data_points;

/// Data point model representing a single observation in a time series
#[derive(Debug, Clone, Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = data_points)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct DataPoint {
    pub id: Uuid,
    pub series_id: Uuid,
    pub date: NaiveDate,
    pub value: Option<BigDecimal>,
    pub revision_date: NaiveDate,
    pub is_original_release: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// New data point for insertion
#[derive(Debug, Clone, Insertable, Validate, Deserialize)]
#[diesel(table_name = data_points)]
pub struct NewDataPoint {
    pub series_id: Uuid,
    pub date: NaiveDate,
    pub value: Option<BigDecimal>,
    pub revision_date: NaiveDate,
    pub is_original_release: bool,
}

/// Data point update model
#[derive(Debug, Clone, AsChangeset, Validate, Deserialize)]
#[diesel(table_name = data_points)]
pub struct UpdateDataPoint {
    pub value: Option<BigDecimal>,
    pub revision_date: Option<NaiveDate>,
    pub is_original_release: Option<bool>,
    pub updated_at: DateTime<Utc>,
}

/// Data point with series information for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPointWithSeries {
    pub id: Uuid,
    pub series_id: Uuid,
    pub series_title: String,
    pub date: NaiveDate,
    pub value: Option<BigDecimal>,
    pub revision_date: NaiveDate,
    pub is_original_release: bool,
    pub units: Option<String>,
}

/// Data query parameters
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct DataQueryParams {
    pub series_id: Uuid,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub original_only: Option<bool>,
    pub latest_revision_only: Option<bool>,
    #[validate(range(min = 1, max = 10000))]
    pub limit: Option<i64>,
    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

/// Data transformation types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataTransformation {
    None,
    YearOverYear,
    QuarterOverQuarter,
    MonthOverMonth,
    PercentChange,
    LogDifference,
}

impl std::fmt::Display for DataTransformation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataTransformation::None => write!(f, "None"),
            DataTransformation::YearOverYear => write!(f, "Year-over-Year"),
            DataTransformation::QuarterOverQuarter => write!(f, "Quarter-over-Quarter"),
            DataTransformation::MonthOverMonth => write!(f, "Month-over-Month"),
            DataTransformation::PercentChange => write!(f, "Percent Change"),
            DataTransformation::LogDifference => write!(f, "Log Difference"),
        }
    }
}

impl From<String> for DataTransformation {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "yoy" | "year_over_year" | "year-over-year" => DataTransformation::YearOverYear,
            "qoq" | "quarter_over_quarter" | "quarter-over-quarter" => DataTransformation::QuarterOverQuarter,
            "mom" | "month_over_month" | "month-over-month" => DataTransformation::MonthOverMonth,
            "pct" | "percent" | "percent_change" => DataTransformation::PercentChange,
            "log" | "log_diff" | "log_difference" => DataTransformation::LogDifference,
            _ => DataTransformation::None,
        }
    }
}

/// Transformed data point for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformedDataPoint {
    pub date: NaiveDate,
    pub original_value: Option<BigDecimal>,
    pub transformed_value: Option<BigDecimal>,
    pub transformation: DataTransformation,
    pub revision_date: NaiveDate,
    pub is_original_release: bool,
}

impl DataPoint {
    /// Calculate year-over-year change
    pub fn calculate_yoy_change(&self, previous_year_value: Option<BigDecimal>) -> Option<BigDecimal> {
        match (&self.value, &previous_year_value) {
            (Some(current), Some(previous)) if *previous != BigDecimal::from(0) => {
                Some(((current - previous) / previous) * BigDecimal::from(100))
            }
            _ => None,
        }
    }

    /// Calculate quarter-over-quarter change
    pub fn calculate_qoq_change(&self, previous_quarter_value: Option<&BigDecimal>) -> Option<BigDecimal> {
        match (&self.value, previous_quarter_value) {
            (Some(current), Some(previous)) if !previous.is_zero() => {
                Some(((current - previous) / previous) * BigDecimal::from(100))
            }
            _ => None,
        }
    }

    /// Calculate month-over-month change
    pub fn calculate_mom_change(&self, previous_month_value: Option<&BigDecimal>) -> Option<BigDecimal> {
        match (&self.value, previous_month_value) {
            (Some(current), Some(previous)) if !previous.is_zero() => {
                Some(((current - previous) / previous) * BigDecimal::from(100))
            }
            _ => None,
        }
    }
}

impl Default for NewDataPoint {
    fn default() -> Self {
        Self {
            series_id: Uuid::new_v4(),
            date: chrono::Utc::now().date_naive(),
            value: None,
            revision_date: chrono::Utc::now().date_naive(),
            is_original_release: true,
        }
    }
}

impl Default for UpdateDataPoint {
    fn default() -> Self {
        Self {
            value: None,
            revision_date: None,
            is_original_release: None,
            updated_at: Utc::now(),
        }
    }
}

impl DataPoint {
    /// Create a new data point
    pub async fn create(pool: &crate::database::DatabasePool, new_data_point: &NewDataPoint) -> crate::error::AppResult<Self> {
        use crate::schema::data_points::dsl;
        use diesel_async::RunQueryDsl;
        
        let mut conn = pool.get().await?;
        
        let data_point = diesel_async::RunQueryDsl::get_result(
            diesel::insert_into(dsl::data_points).values(new_data_point),
            &mut conn
        )
            .await?;
        
        Ok(data_point)
    }

    /// Create multiple data points in a batch
    pub async fn create_batch(pool: &crate::database::DatabasePool, new_data_points: &[NewDataPoint]) -> crate::error::AppResult<Vec<Self>> {
        use crate::schema::data_points::dsl;
        use diesel_async::RunQueryDsl;
        
        let mut conn = pool.get().await?;
        
        let data_points = diesel_async::RunQueryDsl::get_results(
            diesel::insert_into(dsl::data_points).values(new_data_points),
            &mut conn
        )
            .await?;
        
        Ok(data_points)
    }

    /// Find data points for a series within a date range
    pub async fn find_by_series_and_date_range(
        pool: &crate::database::DatabasePool,
        series_id: uuid::Uuid,
        start_date: chrono::NaiveDate,
        end_date: chrono::NaiveDate
    ) -> crate::error::AppResult<Vec<Self>> {
        use crate::schema::data_points::dsl;
        use diesel_async::RunQueryDsl;
        
        let mut conn = pool.get().await?;
        
        let data_points = diesel_async::RunQueryDsl::load(
            dsl::data_points
                .filter(dsl::series_id.eq(series_id))
                .filter(dsl::date.between(start_date, end_date))
                .order(dsl::date.asc()),
            &mut conn
        )
            .await?;
        
        Ok(data_points)
    }
}

// Inline tests moved to external test file
#[cfg(test)]
mod inline_tests {
    use super::*;
    use bigdecimal::BigDecimal;

    #[test]
    fn test_data_transformation_conversion() {
        // REQUIREMENT: Users should be able to select YoY, QoQ, MoM transformations
        // PURPOSE: Verify that transformation strings from the frontend are correctly parsed
        // This ensures the GraphQL API can handle transformation requests properly
        
        // Test year-over-year transformation - required for economic analysis
        assert_eq!(DataTransformation::from("yoy".to_string()), DataTransformation::YearOverYear);
        // Test quarter-over-quarter transformation - required for quarterly data analysis
        assert_eq!(DataTransformation::from("qoq".to_string()), DataTransformation::QuarterOverQuarter);
        // Test month-over-month transformation - required for monthly data analysis
        assert_eq!(DataTransformation::from("mom".to_string()), DataTransformation::MonthOverMonth);
        // Test unknown transformations default to None - handles invalid input gracefully
        assert_eq!(DataTransformation::from("unknown".to_string()), DataTransformation::None);
    }

    #[test]
    fn test_yoy_calculation() {
        // REQUIREMENT: The application should calculate year-over-year percentage changes
        // PURPOSE: Verify that YoY calculations produce correct percentage change values
        // This is essential for economic analysis and matches FRED's calculation methodology
        
        let data_point = DataPoint {
            id: Uuid::new_v4(),
            series_id: Uuid::new_v4(),
            date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
            value: Some(BigDecimal::from(110)),
            revision_date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
            is_original_release: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Test normal YoY calculation: (110-100)/100 * 100 = 10%
        let yoy_change = data_point.calculate_yoy_change(Some("100.0".parse().unwrap()));
        assert_eq!(yoy_change, Some("10.0".parse().unwrap()), "YoY calculation should return 10% increase");

        // Test division by zero protection - prevents runtime panics
        let yoy_change_zero = data_point.calculate_yoy_change(Some("0.0".parse().unwrap()));
        assert_eq!(yoy_change_zero, None, "YoY calculation should handle zero previous value");

        // Test missing data handling - common in economic time series
        let yoy_change_none = data_point.calculate_yoy_change(None);
        assert_eq!(yoy_change_none, None, "YoY calculation should handle missing previous value");
    }

    #[test]
    fn test_data_query_params_validation() {
        // REQUIREMENT: API should validate input parameters to prevent abuse and errors
        // PURPOSE: Verify that query parameter validation prevents excessive data requests
        // This protects the database from overload and ensures reasonable response times
        
        let valid_params = DataQueryParams {
            series_id: Uuid::new_v4(),
            start_date: None,
            end_date: None,
            original_only: None,
            latest_revision_only: None,
            limit: Some(100),
            offset: Some(0),
        };
        
        // Verify valid parameters pass validation - required for normal operation
        assert!(valid_params.validate().is_ok(), "Valid query parameters should pass validation");

        // Test limit validation to prevent excessive data requests
        let invalid_params = DataQueryParams {
            series_id: Uuid::new_v4(),
            start_date: None,
            end_date: None,
            original_only: None,
            latest_revision_only: None,
            limit: Some(20000), // Exceeds maximum allowed limit
            offset: Some(0),
        };
        
        // Verify excessive limits are rejected - required for system protection
        assert!(invalid_params.validate().is_err(), "Excessive limit should fail validation");
    }
}

#[cfg(test)]
mod tests;
