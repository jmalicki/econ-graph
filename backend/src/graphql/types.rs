use async_graphql::*;
use chrono::{DateTime, NaiveDate, Utc};
use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::{DataPoint, DataSource, EconomicSeries, SeriesSearchResult, SearchSuggestion, SearchStatistics, SuggestionType, SearchSortOrder};

/// GraphQL representation of an economic series
#[derive(Clone)]
pub struct EconomicSeriesType {
    pub id: ID,
    pub source_id: ID,
    pub external_id: String,
    pub title: String,
    pub description: Option<String>,
    pub units: Option<String>,
    pub frequency: String,
    pub seasonal_adjustment: Option<String>,
    pub last_updated: Option<DateTime<Utc>>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[Object]
impl EconomicSeriesType {
    async fn id(&self) -> &ID {
        &self.id
    }
    
    async fn source_id(&self) -> &ID {
        &self.source_id
    }
    
    async fn external_id(&self) -> &str {
        &self.external_id
    }
    
    async fn title(&self) -> &str {
        &self.title
    }
    
    async fn description(&self) -> &Option<String> {
        &self.description
    }
    
    async fn units(&self) -> &Option<String> {
        &self.units
    }
    
    async fn frequency(&self) -> &str {
        &self.frequency
    }
    
    async fn seasonal_adjustment(&self) -> &Option<String> {
        &self.seasonal_adjustment
    }
    
    async fn last_updated(&self) -> &Option<DateTime<Utc>> {
        &self.last_updated
    }
    
    async fn start_date(&self) -> &Option<NaiveDate> {
        &self.start_date
    }
    
    async fn end_date(&self) -> &Option<NaiveDate> {
        &self.end_date
    }
    
    async fn is_active(&self) -> bool {
        self.is_active
    }
    
    async fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }
    
    async fn updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
    
    /// Fetch the data source using DataLoader to prevent N+1 queries
    async fn source(&self, ctx: &Context<'_>) -> Result<Option<DataSourceType>> {
        let loaders = ctx.data::<crate::graphql::dataloaders::DataLoaders>()?;
        let source_uuid = Uuid::parse_str(&self.source_id)?;
        
        match loaders.data_source_loader.load_one(source_uuid).await? {
            Some(source) => Ok(Some(source.into())),
            None => Ok(None),
        }
    }
    
    /// Fetch recent data points using DataLoader
    async fn recent_data_points(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 100)] limit: i32,
    ) -> Result<Vec<DataPointType>> {
        let loaders = ctx.data::<crate::graphql::dataloaders::DataLoaders>()?;
        let series_uuid = Uuid::parse_str(&self.id)?;
        
        let data_points = loaders
            .latest_data_points_loader
            .load_one(series_uuid)
            .await?
            .unwrap_or_default();
        
        let limited_points = data_points
            .into_iter()
            .take(limit as usize)
            .map(DataPointType::from)
            .collect();
        
        Ok(limited_points)
    }
    
    /// Get data point count using DataLoader
    async fn data_point_count(&self, ctx: &Context<'_>) -> Result<i32> {
        let loaders = ctx.data::<crate::graphql::dataloaders::DataLoaders>()?;
        let series_uuid = Uuid::parse_str(&self.id)?;
        
        let count = loaders
            .data_point_count_loader
            .load_one(series_uuid)
            .await?
            .unwrap_or(0);
        
        Ok(count as i32)
    }
    
    /// Fetch data points with filters using a custom DataLoader
    async fn data_points(
        &self,
        ctx: &Context<'_>,
        filter: Option<DataFilterInput>,
        transformation: Option<DataTransformationType>,
    ) -> Result<Vec<DataPointType>> {
        use crate::database::DatabasePool;
        
        let pool = ctx.data::<DatabasePool>()?;
        let series_uuid = Uuid::parse_str(&self.id)?;
        
        let filter = filter.unwrap_or_default();
        
        // Create a custom data loader for this specific query
        let loaders = ctx.data::<crate::graphql::dataloaders::DataLoaders>()?;
        let date_range_loader = loaders.create_date_range_loader(
            pool.clone(),
            filter.start_date,
            filter.end_date,
            filter.original_only.unwrap_or(false),
            filter.latest_revision_only.unwrap_or(false),
        );
        
        let data_points = date_range_loader
            .load_one(series_uuid)
            .await?
            .unwrap_or_default();
        
        // Apply transformation if requested
        if let Some(transformation) = transformation {
            // Transform the data points
            let transformed = crate::services::series_service::transform_data_points(
                data_points,
                transformation.into(),
            ).await?;
            
            // Convert to GraphQL types (this is a simplified version)
            // In practice, you'd want a proper TransformedDataPoint type
            Ok(Vec::new()) // TODO: Implement proper transformation return
        } else {
            Ok(data_points.into_iter().map(DataPointType::from).collect())
        }
    }
}

impl From<EconomicSeries> for EconomicSeriesType {
    fn from(series: EconomicSeries) -> Self {
        Self {
            id: ID::from(series.id.to_string()),
            source_id: ID::from(series.source_id.to_string()),
            external_id: series.external_id,
            title: series.title,
            description: series.description,
            units: series.units,
            frequency: series.frequency,
            seasonal_adjustment: series.seasonal_adjustment,
            last_updated: series.last_updated,
            start_date: series.start_date,
            end_date: series.end_date,
            is_active: series.is_active,
            created_at: series.created_at,
            updated_at: series.updated_at,
        }
    }
}

/// GraphQL representation of a data point
#[derive(SimpleObject, Clone)]
#[graphql(name = "DataPoint")]
pub struct DataPointType {
    pub id: ID,
    pub series_id: ID,
    pub date: NaiveDate,
    pub value: Option<BigDecimal>,
    pub revision_date: NaiveDate,
    pub is_original_release: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<DataPoint> for DataPointType {
    fn from(data_point: DataPoint) -> Self {
        Self {
            id: ID::from(data_point.id.to_string()),
            series_id: ID::from(data_point.series_id.to_string()),
            date: data_point.date,
            value: data_point.value,
            revision_date: data_point.revision_date,
            is_original_release: data_point.is_original_release,
            created_at: data_point.created_at,
            updated_at: data_point.updated_at,
        }
    }
}

/// GraphQL representation of a data source
#[derive(Clone)]
pub struct DataSourceType {
    pub id: ID,
    pub name: String,
    pub description: Option<String>,
    pub base_url: String,
    pub api_key_required: bool,
    pub rate_limit_per_minute: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[Object]
impl DataSourceType {
    async fn id(&self) -> &ID {
        &self.id
    }
    
    async fn name(&self) -> &str {
        &self.name
    }
    
    async fn description(&self) -> &Option<String> {
        &self.description
    }
    
    async fn base_url(&self) -> &str {
        &self.base_url
    }
    
    async fn api_key_required(&self) -> bool {
        self.api_key_required
    }
    
    async fn rate_limit_per_minute(&self) -> i32 {
        self.rate_limit_per_minute
    }
    
    async fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }
    
    async fn updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
    
    /// Fetch all series for this data source using DataLoader
    async fn series(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 50)] first: i32,
        after: Option<String>,
    ) -> Result<SeriesConnection> {
        let loaders = ctx.data::<crate::graphql::dataloaders::DataLoaders>()?;
        let source_uuid = Uuid::parse_str(&self.id)?;
        
        let all_series = loaders
            .series_by_source_loader
            .load_one(source_uuid)
            .await?
            .unwrap_or_default();
        
        // Apply pagination (simplified - in production you'd want cursor-based pagination)
        let start_index = after
            .and_then(|cursor| cursor.parse::<usize>().ok())
            .unwrap_or(0);
        
        let end_index = (start_index + first as usize).min(all_series.len());
        let series_page = all_series[start_index..end_index].to_vec();
        
        let has_next_page = end_index < all_series.len();
        let has_previous_page = start_index > 0;
        
        Ok(SeriesConnection {
            nodes: series_page.into_iter().map(EconomicSeriesType::from).collect(),
            total_count: all_series.len() as i32,
            page_info: PageInfo {
                has_next_page,
                has_previous_page,
                start_cursor: if start_index > 0 { Some(start_index.to_string()) } else { None },
                end_cursor: if has_next_page { Some(end_index.to_string()) } else { None },
            },
        })
    }
    
    /// Get count of active series for this data source
    async fn series_count(&self, ctx: &Context<'_>) -> Result<i32> {
        let loaders = ctx.data::<crate::graphql::dataloaders::DataLoaders>()?;
        let source_uuid = Uuid::parse_str(&self.id)?;
        
        let series = loaders
            .series_by_source_loader
            .load_one(source_uuid)
            .await?
            .unwrap_or_default();
        
        Ok(series.len() as i32)
    }
}

impl From<DataSource> for DataSourceType {
    fn from(source: DataSource) -> Self {
        Self {
            id: ID::from(source.id.to_string()),
            name: source.name,
            description: source.description,
            base_url: source.base_url,
            api_key_required: source.api_key_required,
            rate_limit_per_minute: source.rate_limit_per_minute,
            created_at: source.created_at,
            updated_at: source.updated_at,
        }
    }
}

/// Transformed data point for GraphQL responses
#[derive(SimpleObject, Clone)]
#[graphql(name = "TransformedDataPoint")]
pub struct TransformedDataPointType {
    pub date: NaiveDate,
    pub original_value: Option<BigDecimal>,
    pub transformed_value: Option<BigDecimal>,
    pub transformation: DataTransformationType,
    pub revision_date: NaiveDate,
    pub is_original_release: bool,
}

/// Data transformation enumeration for GraphQL
#[derive(Enum, Copy, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[graphql(name = "DataTransformation")]
pub enum DataTransformationType {
    None,
    YearOverYear,
    QuarterOverQuarter,
    MonthOverMonth,
    PercentChange,
    LogDifference,
}

impl From<crate::models::DataTransformation> for DataTransformationType {
    fn from(transformation: crate::models::DataTransformation) -> Self {
        match transformation {
            crate::models::DataTransformation::None => DataTransformationType::None,
            crate::models::DataTransformation::YearOverYear => DataTransformationType::YearOverYear,
            crate::models::DataTransformation::QuarterOverQuarter => DataTransformationType::QuarterOverQuarter,
            crate::models::DataTransformation::MonthOverMonth => DataTransformationType::MonthOverMonth,
            crate::models::DataTransformation::PercentChange => DataTransformationType::PercentChange,
            crate::models::DataTransformation::LogDifference => DataTransformationType::LogDifference,
        }
    }
}

impl From<DataTransformationType> for crate::models::DataTransformation {
    fn from(transformation: DataTransformationType) -> Self {
        match transformation {
            DataTransformationType::None => crate::models::DataTransformation::None,
            DataTransformationType::YearOverYear => crate::models::DataTransformation::YearOverYear,
            DataTransformationType::QuarterOverQuarter => crate::models::DataTransformation::QuarterOverQuarter,
            DataTransformationType::MonthOverMonth => crate::models::DataTransformation::MonthOverMonth,
            DataTransformationType::PercentChange => crate::models::DataTransformation::PercentChange,
            DataTransformationType::LogDifference => crate::models::DataTransformation::LogDifference,
        }
    }
}

/// Series frequency enumeration for GraphQL
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
#[graphql(name = "SeriesFrequency")]
#[derive(Debug)]
pub enum SeriesFrequencyType {
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Annual,
    Irregular,
}

/// Paginated result for series
#[derive(SimpleObject)]
#[graphql(name = "SeriesConnection")]
pub struct SeriesConnection {
    pub nodes: Vec<EconomicSeriesType>,
    pub total_count: i32,
    pub page_info: PageInfo,
}

/// Paginated result for data points
#[derive(SimpleObject)]
#[graphql(name = "DataPointConnection")]
pub struct DataPointConnection {
    pub nodes: Vec<DataPointType>,
    pub total_count: i32,
    pub page_info: PageInfo,
}

/// Page information for pagination
#[derive(SimpleObject)]
#[graphql(name = "PageInfo")]
pub struct PageInfo {
    pub has_next_page: bool,
    pub has_previous_page: bool,
    pub start_cursor: Option<String>,
    pub end_cursor: Option<String>,
}

/// Search result type
#[derive(SimpleObject)]
#[graphql(name = "SearchResult")]
pub struct SearchResult {
    pub series: Vec<EconomicSeriesType>,
    pub total_count: i32,
    pub query: String,
    pub took_ms: i32,
}

/// Queue statistics for monitoring
#[derive(SimpleObject)]
#[graphql(name = "QueueStatistics")]
pub struct QueueStatisticsType {
    pub total_items: i32,
    pub pending_items: i32,
    pub processing_items: i32,
    pub completed_items: i32,
    pub failed_items: i32,
    pub retrying_items: i32,
    pub oldest_pending: Option<DateTime<Utc>>,
    pub average_processing_time: Option<f64>,
}

/// Crawler status information
#[derive(SimpleObject)]
#[graphql(name = "CrawlerStatus")]
pub struct CrawlerStatusType {
    pub is_running: bool,
    pub active_workers: i32,
    pub last_crawl: Option<DateTime<Utc>>,
    pub next_scheduled_crawl: Option<DateTime<Utc>>,
}

/// Input types for mutations and complex queries
#[derive(InputObject)]
#[graphql(name = "SeriesFilter")]
pub struct SeriesFilterInput {
    pub source_id: Option<ID>,
    pub frequency: Option<SeriesFrequencyType>,
    pub is_active: Option<bool>,
    pub search_query: Option<String>,
}

#[derive(InputObject)]
#[graphql(name = "DataFilter")]
pub struct DataFilterInput {
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub original_only: Option<bool>,
    pub latest_revision_only: Option<bool>,
}

impl Default for DataFilterInput {
    fn default() -> Self {
        Self {
            start_date: None,
            end_date: None,
            original_only: Some(false),
            latest_revision_only: Some(false),
        }
    }
}

#[derive(InputObject)]
#[graphql(name = "PaginationInput")]
pub struct PaginationInput {
    pub first: Option<i32>,
    pub after: Option<String>,
    pub last: Option<i32>,
    pub before: Option<String>,
}

#[derive(InputObject)]
#[graphql(name = "TriggerCrawlInput")]
pub struct TriggerCrawlInput {
    pub sources: Option<Vec<String>>,
    pub series_ids: Option<Vec<String>>,
    pub priority: Option<i32>,
}

/// GraphQL representation of a search result
#[derive(Clone, SimpleObject)]
pub struct SeriesSearchResultType {
    /// Unique identifier for the series
    pub id: ID,
    /// Series title
    pub title: String,
    /// Series description
    pub description: Option<String>,
    /// External identifier from data source
    pub external_id: String,
    /// Data source ID
    pub source_id: ID,
    /// Data frequency (Monthly, Quarterly, etc.)
    pub frequency: String,
    /// Data units
    pub units: String,
    /// Series start date
    pub start_date: NaiveDate,
    /// Series end date (if applicable)
    pub end_date: Option<NaiveDate>,
    /// Last update timestamp
    pub last_updated: DateTime<Utc>,
    /// Whether the series is active
    pub is_active: bool,
    /// Search relevance ranking score
    pub rank: f32,
    /// Similarity score for fuzzy matching
    pub similarity_score: f32,
}

impl From<SeriesSearchResult> for SeriesSearchResultType {
    fn from(result: SeriesSearchResult) -> Self {
        Self {
            id: ID::from(result.id),
            title: result.title,
            description: result.description,
            external_id: result.external_id,
            source_id: ID::from(result.source_id),
            frequency: result.frequency,
            units: result.units,
            start_date: result.start_date,
            end_date: result.end_date,
            last_updated: DateTime::from_naive_utc_and_offset(result.last_updated, Utc),
            is_active: result.is_active,
            rank: result.rank,
            similarity_score: result.similarity_score,
        }
    }
}

/// GraphQL representation of search suggestions
#[derive(Clone, SimpleObject)]
pub struct SearchSuggestionType {
    /// Suggested query text
    pub suggestion: String,
    /// Number of matching series
    pub match_count: i32,
    /// Type of suggestion
    pub suggestion_type: SuggestionTypeEnum,
    /// Confidence score
    pub confidence: f32,
}

impl From<SearchSuggestion> for SearchSuggestionType {
    fn from(suggestion: SearchSuggestion) -> Self {
        Self {
            suggestion: suggestion.suggestion,
            match_count: suggestion.match_count,
            suggestion_type: suggestion.suggestion_type.into(),
            confidence: suggestion.confidence,
        }
    }
}

/// GraphQL enum for suggestion types
#[derive(Clone, Copy, Enum, Eq, PartialEq)]
pub enum SuggestionTypeEnum {
    /// Spelling correction
    Correction,
    /// Query completion
    Completion,
    /// Synonym expansion
    Synonym,
}

impl From<SuggestionType> for SuggestionTypeEnum {
    fn from(suggestion_type: SuggestionType) -> Self {
        match suggestion_type {
            SuggestionType::Correction => SuggestionTypeEnum::Correction,
            SuggestionType::Completion => SuggestionTypeEnum::Completion,
            SuggestionType::Synonym => SuggestionTypeEnum::Synonym,
        }
    }
}

/// GraphQL enum for search sort order
#[derive(Clone, Copy, Enum, Eq, PartialEq)]
pub enum SearchSortOrderEnum {
    /// Sort by relevance score
    Relevance,
    /// Sort by title alphabetically
    Title,
    /// Sort by last updated date
    LastUpdated,
    /// Sort by start date
    StartDate,
}

impl From<SearchSortOrderEnum> for SearchSortOrder {
    fn from(sort_order: SearchSortOrderEnum) -> Self {
        match sort_order {
            SearchSortOrderEnum::Relevance => SearchSortOrder::Relevance,
            SearchSortOrderEnum::Title => SearchSortOrder::Title,
            SearchSortOrderEnum::LastUpdated => SearchSortOrder::LastUpdated,
            SearchSortOrderEnum::StartDate => SearchSortOrder::StartDate,
        }
    }
}

/// GraphQL input for search parameters
#[derive(Clone, InputObject)]
pub struct SearchParamsInput {
    /// Search query text
    pub query: String,
    /// Minimum similarity threshold for fuzzy matching
    pub similarity_threshold: Option<f32>,
    /// Maximum number of results
    pub limit: Option<i32>,
    /// Offset for pagination
    pub offset: Option<i32>,
    /// Filter by data source ID
    pub source_id: Option<ID>,
    /// Filter by series frequency
    pub frequency: Option<String>,
    /// Include inactive series
    pub include_inactive: Option<bool>,
    /// Sort order for results
    pub sort_by: Option<SearchSortOrderEnum>,
}
