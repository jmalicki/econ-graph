/**
 * REQUIREMENT: GraphQL API for statistical analysis features
 * PURPOSE: Expose statistical analysis capabilities through GraphQL interface
 * This enables frontend to access professional statistical tools
 */

use async_graphql::{Object, Result, Context, SimpleObject};
use std::collections::HashMap;
use crate::services::statistical_analysis::*;
use crate::graphql::types::EconomicSeriesData;

#[derive(SimpleObject)]
pub struct CorrelationAnalysisResult {
    pub correlation_coefficient: f64,
    pub p_value: f64,
    pub significance: String,
    pub sample_size: i32,
    pub series1_id: String,
    pub series2_id: String,
}

#[derive(SimpleObject)]
pub struct RegressionAnalysisResult {
    pub slope: f64,
    pub intercept: f64,
    pub r_squared: f64,
    pub standard_error: f64,
    pub series1_id: String, // Independent variable
    pub series2_id: String, // Dependent variable
    pub predicted_values: Vec<f64>,
}

#[derive(SimpleObject)]
pub struct TrendAnalysisResult {
    pub trend_direction: String,
    pub trend_strength: f64,
    pub slope: f64,
    pub average_change: f64,
    pub volatility: f64,
    pub series_id: String,
}

#[derive(SimpleObject)]
pub struct StatisticalSummaryResult {
    pub count: i32,
    pub mean: f64,
    pub median: f64,
    pub standard_deviation: f64,
    pub variance: f64,
    pub min: f64,
    pub max: f64,
    pub skewness: f64,
    pub kurtosis: f64,
    pub series_id: String,
}

#[derive(SimpleObject)]
pub struct CorrelationMatrixEntry {
    pub series1_id: String,
    pub series2_id: String,
    pub correlation: f64,
}

#[derive(SimpleObject)]
pub struct CorrelationMatrixResult {
    pub entries: Vec<CorrelationMatrixEntry>,
    pub series_count: i32,
}

#[derive(SimpleObject)]
pub struct MovingAverageResult {
    pub window_size: i32,
    pub values: Vec<DataPointResult>,
    pub crossover_dates: Vec<String>,
    pub series_id: String,
}

#[derive(SimpleObject)]
pub struct DataPointResult {
    pub date: String,
    pub value: f64,
}

/**
 * REQUIREMENT: Comprehensive statistical analysis GraphQL queries
 * PURPOSE: Provide frontend access to all statistical analysis capabilities
 * This creates a professional API for economic data analysis
 */
#[derive(Default)]
pub struct StatisticalAnalysisQuery;

#[Object]
impl StatisticalAnalysisQuery {
    /// Calculate correlation between two economic series
    /// REQUIREMENT: Correlation analysis via GraphQL API
    /// PURPOSE: Enable frontend to analyze relationships between indicators
    async fn calculate_series_correlation(
        &self,
        ctx: &Context<'_>,
        series1_id: String,
        series2_id: String,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<CorrelationAnalysisResult> {
        // In real implementation, would fetch series data from database
        let series1_data = Self::mock_series_data(&series1_id);
        let series2_data = Self::mock_series_data(&series2_id);

        let correlation_result = StatisticalAnalyzer::calculate_correlation(&series1_data, &series2_data)
            .map_err(|e| async_graphql::Error::new(format!("Correlation calculation error: {}", e)))?;

        Ok(CorrelationAnalysisResult {
            correlation_coefficient: correlation_result.correlation_coefficient,
            p_value: correlation_result.p_value,
            significance: correlation_result.significance,
            sample_size: correlation_result.sample_size as i32,
            series1_id,
            series2_id,
        })
    }

    /// Perform linear regression analysis between two series
    /// REQUIREMENT: Regression analysis via GraphQL API  
    /// PURPOSE: Enable predictive modeling and relationship quantification
    async fn linear_regression_analysis(
        &self,
        ctx: &Context<'_>,
        independent_series_id: String,
        dependent_series_id: String,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<RegressionAnalysisResult> {
        let x_series = Self::mock_series_data(&independent_series_id);
        let y_series = Self::mock_series_data(&dependent_series_id);

        let regression_result = StatisticalAnalyzer::linear_regression(&x_series, &y_series)
            .map_err(|e| async_graphql::Error::new(format!("Regression analysis error: {}", e)))?;

        Ok(RegressionAnalysisResult {
            slope: regression_result.slope,
            intercept: regression_result.intercept,
            r_squared: regression_result.r_squared,
            standard_error: regression_result.standard_error,
            series1_id: independent_series_id,
            series2_id: dependent_series_id,
            predicted_values: regression_result.predicted_values,
        })
    }

    /// Analyze trends in a time series
    /// REQUIREMENT: Trend analysis via GraphQL API
    /// PURPOSE: Identify and quantify directional movements
    async fn analyze_series_trends(
        &self,
        ctx: &Context<'_>,
        series_id: String,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<TrendAnalysisResult> {
        let series_data = Self::mock_series_data(&series_id);

        let trend_result = StatisticalAnalyzer::analyze_trends(&series_data)
            .map_err(|e| async_graphql::Error::new(format!("Trend analysis error: {}", e)))?;

        Ok(TrendAnalysisResult {
            trend_direction: trend_result.trend_direction,
            trend_strength: trend_result.trend_strength,
            slope: trend_result.slope,
            average_change: trend_result.average_change,
            volatility: trend_result.volatility,
            series_id,
        })
    }

    /// Generate statistical summary for a series
    /// REQUIREMENT: Descriptive statistics via GraphQL API
    /// PURPOSE: Provide comprehensive statistical overview
    async fn series_statistical_summary(
        &self,
        ctx: &Context<'_>,
        series_id: String,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<StatisticalSummaryResult> {
        let series_data = Self::mock_series_data(&series_id);

        let summary_result = StatisticalAnalyzer::generate_summary(&series_data)
            .map_err(|e| async_graphql::Error::new(format!("Statistical summary error: {}", e)))?;

        Ok(StatisticalSummaryResult {
            count: summary_result.count as i32,
            mean: summary_result.mean,
            median: summary_result.median,
            standard_deviation: summary_result.standard_deviation,
            variance: summary_result.variance,
            min: summary_result.min,
            max: summary_result.max,
            skewness: summary_result.skewness,
            kurtosis: summary_result.kurtosis,
            series_id,
        })
    }

    /// Generate correlation matrix for multiple series
    /// REQUIREMENT: Multi-variate correlation analysis via GraphQL
    /// PURPOSE: Analyze relationships between multiple economic indicators
    async fn correlation_matrix(
        &self,
        ctx: &Context<'_>,
        series_ids: Vec<String>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<CorrelationMatrixResult> {
        let mut series_map = HashMap::new();
        
        // In real implementation, would fetch from database
        for series_id in &series_ids {
            series_map.insert(series_id.clone(), Self::mock_series_data(series_id));
        }

        let matrix = MultiSeriesAnalyzer::correlation_matrix(&series_map)
            .map_err(|e| async_graphql::Error::new(format!("Correlation matrix error: {}", e)))?;

        let mut entries = Vec::new();
        for (series1, correlations) in matrix {
            for (series2, correlation) in correlations {
                entries.push(CorrelationMatrixEntry {
                    series1_id: series1.clone(),
                    series2_id: series2,
                    correlation,
                });
            }
        }

        Ok(CorrelationMatrixResult {
            entries,
            series_count: series_ids.len() as i32,
        })
    }

    /// Calculate moving averages for a series
    /// REQUIREMENT: Moving average analysis via GraphQL
    /// PURPOSE: Provide trend smoothing and technical analysis
    async fn calculate_moving_averages(
        &self,
        ctx: &Context<'_>,
        series_id: String,
        window_sizes: Vec<i32>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<Vec<MovingAverageResult>> {
        let series_data = Self::mock_series_data(&series_id);
        let window_sizes_usize: Vec<usize> = window_sizes.into_iter().map(|w| w as usize).collect();

        let moving_avg_results = StatisticalAnalyzer::calculate_moving_averages(&series_data, &window_sizes_usize)
            .map_err(|e| async_graphql::Error::new(format!("Moving averages error: {}", e)))?;

        let mut results = Vec::new();
        for (window_size, result) in moving_avg_results {
            results.push(MovingAverageResult {
                window_size: window_size as i32,
                values: result.values.into_iter().map(|dp| DataPointResult {
                    date: dp.date,
                    value: dp.value,
                }).collect(),
                crossover_dates: result.crossovers,
                series_id: series_id.clone(),
            });
        }

        Ok(results)
    }

    /// Mock series data for testing - in real implementation would fetch from database
    /// REQUIREMENT: Test data provider for statistical analysis development
    /// PURPOSE: Enable development and testing without database dependency
    fn mock_series_data(series_id: &str) -> Vec<DataPoint> {
        match series_id {
            "gdp-real" => {
                vec![
                    DataPoint { date: "2023-Q1".to_string(), value: 25000.0 },
                    DataPoint { date: "2023-Q2".to_string(), value: 25200.0 },
                    DataPoint { date: "2023-Q3".to_string(), value: 25400.0 },
                    DataPoint { date: "2023-Q4".to_string(), value: 25600.0 },
                    DataPoint { date: "2024-Q1".to_string(), value: 25800.0 },
                ]
            },
            "unemployment-rate" => {
                vec![
                    DataPoint { date: "2023-Q1".to_string(), value: 3.5 },
                    DataPoint { date: "2023-Q2".to_string(), value: 3.4 },
                    DataPoint { date: "2023-Q3".to_string(), value: 3.6 },
                    DataPoint { date: "2023-Q4".to_string(), value: 3.7 },
                    DataPoint { date: "2024-Q1".to_string(), value: 3.8 },
                ]
            },
            "inflation-rate" => {
                vec![
                    DataPoint { date: "2023-Q1".to_string(), value: 3.2 },
                    DataPoint { date: "2023-Q2".to_string(), value: 3.0 },
                    DataPoint { date: "2023-Q3".to_string(), value: 2.8 },
                    DataPoint { date: "2023-Q4".to_string(), value: 2.5 },
                    DataPoint { date: "2024-Q1".to_string(), value: 2.3 },
                ]
            },
            "fed-funds-rate" => {
                vec![
                    DataPoint { date: "2023-Q1".to_string(), value: 4.5 },
                    DataPoint { date: "2023-Q2".to_string(), value: 5.0 },
                    DataPoint { date: "2023-Q3".to_string(), value: 5.25 },
                    DataPoint { date: "2023-Q4".to_string(), value: 5.5 },
                    DataPoint { date: "2024-Q1".to_string(), value: 5.5 },
                ]
            },
            _ => {
                // Default series for testing
                vec![
                    DataPoint { date: "2023-Q1".to_string(), value: 100.0 },
                    DataPoint { date: "2023-Q2".to_string(), value: 105.0 },
                    DataPoint { date: "2023-Q3".to_string(), value: 110.0 },
                    DataPoint { date: "2023-Q4".to_string(), value: 115.0 },
                ]
            }
        }
    }
}

/**
 * REQUIREMENT: Statistical analysis mutations for data processing
 * PURPOSE: Enable advanced statistical operations through GraphQL
 * This supports interactive statistical analysis workflows
 */
#[derive(Default)]
pub struct StatisticalAnalysisMutation;

#[Object]
impl StatisticalAnalysisMutation {
    /// Save statistical analysis results
    /// REQUIREMENT: Persistence for statistical analysis results
    /// PURPOSE: Allow users to save and share analysis results
    async fn save_statistical_analysis(
        &self,
        ctx: &Context<'_>,
        analysis_name: String,
        series_ids: Vec<String>,
        analysis_type: String,
        results: String, // JSON string of analysis results
    ) -> Result<bool> {
        // In real implementation, would save to database
        Ok(true)
    }

    /// Export statistical analysis to various formats
    /// REQUIREMENT: Export capabilities for statistical results
    /// PURPOSE: Enable professional reporting and sharing
    async fn export_statistical_analysis(
        &self,
        ctx: &Context<'_>,
        analysis_type: String,
        series_ids: Vec<String>,
        format: String, // "csv", "xlsx", "pdf"
    ) -> Result<String> {
        // In real implementation, would generate and return download URL
        Ok(format!("https://example.com/exports/analysis-{}-{}.{}", 
            analysis_type, 
            series_ids.join("-"),
            format
        ))
    }
}