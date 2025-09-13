//! Census Bureau API integration for series discovery
//!
//! This module implements dynamic discovery for the Census Bureau API, with a focus on
//! the Business Dynamics Statistics (BDS) dataset as the primary economic data source.
//!
//! Key features:
//! - Dynamic variable discovery from Census API endpoints
//! - BDS dataset integration with 50+ economic indicators
//! - Geographic parameter handling (us, state, county, metro, cbsa)
//! - Time series data extraction (1978-2022)
//! - Array response format conversion to structured data

use crate::database::DatabasePool;
use crate::error::{AppError, AppResult};
use crate::models::{DataSource, EconomicSeries, NewEconomicSeries};
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;
use uuid::Uuid;

/// Census API response for datasets
#[derive(Debug, Deserialize)]
pub struct CensusDatasetsResponse {
    pub dataset: Vec<CensusDataset>,
}

#[derive(Debug, Deserialize)]
pub struct CensusDataset {
    pub dataset_name: String,
    pub title: String,
    pub description: String,
    pub vintage: String,
    pub is_timeseries: bool,
    pub temporal: Option<String>,
}

/// Census series information structure
#[derive(Debug, Clone)]
pub struct CensusSeriesInfo {
    pub series_id: String,
    pub title: String,
    pub description: Option<String>,
    pub frequency: String,
    pub units: String,
    pub dataset: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

/// BDS (Business Dynamics Statistics) variable information
#[derive(Debug, Clone)]
pub struct BdsVariable {
    pub name: String,
    pub label: String,
    pub concept: String,
    pub predicate_type: String,
    pub group: String,
    pub limit: i32,
    pub predicate_only: Option<bool>,
}

/// BDS geographic level information
#[derive(Debug, Clone)]
pub struct BdsGeography {
    pub name: String,
    pub geo_level_display: String,
    pub reference_date: Option<String>,
}

/// BDS dataset response structure
#[derive(Debug, Deserialize)]
pub struct BdsVariablesResponse {
    pub variables: HashMap<String, BdsVariableInfo>,
}

#[derive(Debug, Deserialize)]
pub struct BdsVariableInfo {
    pub label: String,
    pub concept: String,
    #[serde(rename = "predicateType")]
    pub predicate_type: String,
    pub group: String,
    pub limit: i32,
    #[serde(rename = "predicateOnly")]
    pub predicate_only: Option<bool>,
}

/// BDS geography response structure
#[derive(Debug, Deserialize)]
pub struct BdsGeographyResponse {
    pub fips: Vec<BdsGeographyInfo>,
}

#[derive(Debug, Deserialize)]
pub struct BdsGeographyInfo {
    pub name: String,
    #[serde(rename = "geoLevelDisplay")]
    pub geo_level_display: String,
    #[serde(rename = "referenceDate")]
    pub reference_date: Option<String>,
}

/// BDS data point structure
#[derive(Debug, Clone)]
pub struct BdsDataPoint {
    pub year: i32,
    pub value: Option<f64>,
    pub geography: String,
    pub variable: String,
}

/// Census API query builder for BDS dataset
#[derive(Debug, Clone)]
pub struct CensusQueryBuilder {
    base_url: String,
    dataset_path: String,
    variables: Vec<String>,
    geography: Option<String>,
    time_range: Option<(i32, i32)>,
    api_key: Option<String>,
}

impl CensusQueryBuilder {
    /// Create a new query builder for BDS dataset
    pub fn new() -> Self {
        Self {
            base_url: "https://api.census.gov/data".to_string(),
            dataset_path: "timeseries/bds".to_string(),
            variables: Vec::new(),
            geography: None,
            time_range: None,
            api_key: None,
        }
    }

    /// Set the dataset path (default: timeseries/bds)
    pub fn dataset(mut self, path: &str) -> Self {
        self.dataset_path = path.to_string();
        self
    }

    /// Add variables to retrieve
    pub fn variables(mut self, vars: &[String]) -> Self {
        self.variables = vars.to_vec();
        self
    }

    /// Add a single variable
    pub fn variable(mut self, var: &str) -> Self {
        self.variables.push(var.to_string());
        self
    }

    /// Set geography level (us, state, county, metro, cbsa)
    pub fn geography(mut self, geo: &str) -> Self {
        self.geography = Some(geo.to_string());
        self
    }

    /// Set time range (start_year, end_year)
    pub fn time_range(mut self, start_year: i32, end_year: i32) -> Self {
        self.time_range = Some((start_year, end_year));
        self
    }

    /// Set API key (optional for most Census endpoints)
    pub fn api_key(mut self, key: &str) -> Self {
        self.api_key = Some(key.to_string());
        self
    }

    /// Build the final query URL
    pub fn build_url(&self) -> AppResult<String> {
        if self.variables.is_empty() {
            return Err(AppError::ValidationError(
                "At least one variable must be specified".to_string(),
            ));
        }

        let mut url = format!("{}/{}", self.base_url, self.dataset_path);
        let mut params = Vec::new();

        // Add variables (required)
        let get_params = self.variables.join(",");
        params.push(format!("get={}", get_params));

        // Add geography (required for BDS)
        if let Some(geo) = &self.geography {
            params.push(format!("for={}", geo));
        } else {
            // Default to US level for BDS
            params.push("for=us".to_string());
        }

        // Add time range if specified
        if let Some((start_year, end_year)) = &self.time_range {
            params.push(format!("YEAR={}:{}", start_year, end_year));
        } else {
            // Default to recent years for BDS
            params.push("YEAR=2020:2022".to_string());
        }

        // Add API key if provided
        if let Some(key) = &self.api_key {
            params.push(format!("key={}", key));
        }

        url.push('?');
        url.push_str(&params.join("&"));

        Ok(url)
    }

    /// Execute the query and return raw response
    pub async fn execute(&self, client: &Client) -> AppResult<Vec<Vec<String>>> {
        let url = self.build_url()?;

        let response = client.get(&url).send().await.map_err(|e| {
            AppError::ExternalApiError(format!("Census query request failed: {}", e))
        })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::ExternalApiError(format!(
                "Census API returned status {}: {}",
                status, error_text
            )));
        }

        let data: Vec<Vec<String>> = response.json().await.map_err(|e| {
            AppError::ExternalApiError(format!("Failed to parse Census response: {}", e))
        })?;

        Ok(data)
    }

    /// Execute query and parse into structured BDS data points
    pub async fn execute_structured(&self, client: &Client) -> AppResult<Vec<BdsDataPoint>> {
        let raw_data = self.execute(client).await?;

        if raw_data.len() < 2 {
            return Err(AppError::ExternalApiError(
                "Invalid Census response: expected at least header and data rows".to_string(),
            ));
        }

        let headers = &raw_data[0];
        let data_rows = &raw_data[1..];

        // Find indices of key columns - handle Census API quirks
        let year_idx = headers
            .iter()
            .position(|h| h.to_lowercase() == "year")
            .ok_or_else(|| {
                AppError::ExternalApiError("YEAR column not found in response".to_string())
            })?;

        // Census API returns geography as the last column with numeric codes
        let geo_idx = headers.len() - 1;

        let mut data_points = Vec::new();

        for row in data_rows {
            if row.len() != headers.len() {
                continue; // Skip malformed rows
            }

            // Parse year
            let year = row[year_idx].parse::<i32>().unwrap_or(0);

            // Map geography code to text (Census API returns numeric codes)
            let geography_code = &row[geo_idx];
            let geography = match geography_code.as_str() {
                "1" => "us",
                "2" => "state",
                "3" => "county",
                "4" => "metro",
                "5" => "cbsa",
                _ => geography_code, // Use the code as-is if unknown
            };

            // Parse each variable column (skip YEAR and geography columns)
            for (i, header) in headers.iter().enumerate() {
                if i == year_idx || i == geo_idx {
                    continue; // Skip year and geography columns
                }

                // Skip duplicate YEAR columns (Census API sometimes returns multiple YEAR columns)
                if header.to_lowercase() == "year" {
                    continue;
                }

                let value = if row[i].is_empty() || row[i] == "null" {
                    None
                } else {
                    row[i].parse::<f64>().ok()
                };

                data_points.push(BdsDataPoint {
                    year,
                    value,
                    geography: geography.to_string(),
                    variable: header.clone(),
                });
            }
        }

        Ok(data_points)
    }
}

impl Default for CensusQueryBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Convenience function to fetch BDS data using the query builder
pub async fn fetch_bds_data(
    client: &Client,
    variables: &[String],
    geography: &str,
    start_year: i32,
    end_year: i32,
    api_key: &Option<String>,
) -> AppResult<Vec<BdsDataPoint>> {
    let mut query = CensusQueryBuilder::new()
        .variables(variables)
        .geography(geography)
        .time_range(start_year, end_year);

    if let Some(key) = api_key {
        query = query.api_key(key);
    }

    query.execute_structured(client).await
}

/// Fetch sample BDS data for testing and validation
pub async fn fetch_bds_sample_data(client: &Client) -> AppResult<Vec<BdsDataPoint>> {
    let variables = vec![
        "ESTAB".to_string(), // Establishments
        "FIRM".to_string(),  // Firms
        "YEAR".to_string(),  // Year (required)
    ];

    fetch_bds_data(client, &variables, "us", 2020, 2022, &None).await
}

/// Discover Census series using the Census Data API with BDS focus
pub async fn discover_census_series(
    client: &Client,
    census_api_key: &Option<String>,
    pool: &DatabasePool,
) -> AppResult<Vec<String>> {
    let census_source = DataSource::get_or_create(pool, DataSource::census()).await?;
    let mut discovered_series = Vec::new();

    // Primary focus: BDS (Business Dynamics Statistics) dataset
    println!("🔍 Discovering BDS (Business Dynamics Statistics) series...");
    let bds_series = discover_bds_series(client, pool, &census_source.id).await?;
    discovered_series.extend(bds_series);

    // Secondary: Other economic datasets (fallback to existing approach)
    println!("🔍 Discovering other Census economic datasets...");
    let datasets = fetch_census_economic_datasets(client, census_api_key).await?;
    println!("Found {} Census economic datasets", datasets.len());

    for dataset in datasets {
        // Skip BDS as it's already handled above
        if dataset.dataset_name.contains("bds") {
            continue;
        }

        println!(
            "Discovering series for dataset: {} ({})",
            dataset.title, dataset.dataset_name
        );

        let dataset_series = get_known_census_series_by_dataset(&dataset.dataset_name);

        for series_info in dataset_series {
            // Store series metadata in database
            store_census_series(pool, &census_source.id, &series_info).await?;
            discovered_series.push(series_info.series_id);
        }
    }

    println!(
        "✅ Discovered {} Census series total",
        discovered_series.len()
    );
    Ok(discovered_series)
}

/// Discover BDS (Business Dynamics Statistics) series dynamically
async fn discover_bds_series(
    client: &Client,
    pool: &DatabasePool,
    source_id: &Uuid,
) -> AppResult<Vec<String>> {
    let base_url = "https://api.census.gov/data";
    let dataset_path = "timeseries/bds";

    println!("📊 Fetching BDS variables...");
    let variables = fetch_bds_variables(client, &format!("{}/{}", base_url, dataset_path)).await?;

    println!("🗺️ Fetching BDS geography levels...");
    let geography = fetch_bds_geography(client, &format!("{}/{}", base_url, dataset_path)).await?;

    println!("🔍 Filtering economic indicators...");
    let economic_variables = filter_economic_indicators(&variables);

    println!(
        "📈 Creating series for {} economic indicators across {} geographic levels",
        economic_variables.len(),
        geography.len()
    );

    let mut discovered_series = Vec::new();

    // Create series for each economic variable and geographic level combination
    for variable in &economic_variables {
        for geo in &geography {
            let series_id = format!("CENSUS_BDS_{}_{}", variable.name, geo.name.to_uppercase());
            let title = format!("{} - {}", variable.label, geo.name.to_uppercase());
            let description = Some(format!(
                "{} from Census Bureau Business Dynamics Statistics. Geographic level: {}. Concept: {}",
                variable.label, geo.name, variable.concept
            ));

            let series_info = CensusSeriesInfo {
                series_id: series_id.clone(),
                title,
                description,
                frequency: "Annual".to_string(),
                units: "Count".to_string(), // BDS data is typically counts
                dataset: dataset_path.to_string(),
                start_date: Some("1978-01-01".to_string()),
                end_date: Some("2022-12-31".to_string()),
            };

            // Store series metadata in database
            store_census_series(pool, source_id, &series_info).await?;
            discovered_series.push(series_id);
        }
    }

    println!("✅ Created {} BDS series", discovered_series.len());
    Ok(discovered_series)
}

/// Fetch BDS variables from Census API
async fn fetch_bds_variables(client: &Client, base_url: &str) -> AppResult<Vec<BdsVariable>> {
    let url = format!("{}/variables.json", base_url);

    let response =
        client.get(&url).send().await.map_err(|e| {
            AppError::ExternalApiError(format!("BDS variables request failed: {}", e))
        })?;

    if !response.status().is_success() {
        return Err(AppError::ExternalApiError(format!(
            "BDS variables API returned status: {}",
            response.status()
        )));
    }

    let variables_response: BdsVariablesResponse = response.json().await.map_err(|e| {
        AppError::ExternalApiError(format!("Failed to parse BDS variables response: {}", e))
    })?;

    let variables: Vec<BdsVariable> = variables_response
        .variables
        .into_iter()
        .map(|(name, info)| BdsVariable {
            name,
            label: info.label,
            concept: info.concept,
            predicate_type: info.predicate_type,
            group: info.group,
            limit: info.limit,
            predicate_only: info.predicate_only,
        })
        .collect();

    Ok(variables)
}

/// Fetch BDS geography levels from Census API
async fn fetch_bds_geography(client: &Client, base_url: &str) -> AppResult<Vec<BdsGeography>> {
    let url = format!("{}/geography.json", base_url);

    let response =
        client.get(&url).send().await.map_err(|e| {
            AppError::ExternalApiError(format!("BDS geography request failed: {}", e))
        })?;

    if !response.status().is_success() {
        return Err(AppError::ExternalApiError(format!(
            "BDS geography API returned status: {}",
            response.status()
        )));
    }

    let geography_response: BdsGeographyResponse = response.json().await.map_err(|e| {
        AppError::ExternalApiError(format!("Failed to parse BDS geography response: {}", e))
    })?;

    let geography: Vec<BdsGeography> = geography_response
        .fips
        .into_iter()
        .map(|info| BdsGeography {
            name: info.name,
            geo_level_display: info.geo_level_display,
            reference_date: info.reference_date,
        })
        .collect();

    Ok(geography)
}

/// Filter BDS variables to economic indicators
fn filter_economic_indicators(variables: &[BdsVariable]) -> Vec<BdsVariable> {
    let economic_keywords = [
        "estab",
        "firm",
        "job",
        "emp",
        "creation",
        "destruction",
        "net",
        "reallocation",
        "birth",
        "death",
        "entry",
        "exit",
        "rate",
        "employment",
        "establishment",
    ];

    variables
        .iter()
        .filter(|var| {
            let name_lower = var.name.to_lowercase();
            let label_lower = var.label.to_lowercase();

            // Skip geographic and time variables
            if name_lower.contains("for")
                || name_lower.contains("in")
                || name_lower.contains("year")
                || name_lower.contains("time")
                || name_lower.contains("geo")
                || name_lower.contains("state")
                || name_lower.contains("county")
                || name_lower.contains("metro")
                || name_lower.contains("cbsa")
                || name_lower.contains("nation")
            {
                return false;
            }

            // Skip predicate-only variables (these are query parameters, not data)
            if var.predicate_only.unwrap_or(false) {
                return false;
            }

            // Check if it's an economic indicator
            economic_keywords
                .iter()
                .any(|keyword| name_lower.contains(keyword) || label_lower.contains(keyword))
        })
        .cloned()
        .collect()
}

/// Fetch economic datasets from Census Data API
async fn fetch_census_economic_datasets(
    client: &Client,
    census_api_key: &Option<String>,
) -> AppResult<Vec<CensusDataset>> {
    let base_url = "https://api.census.gov/data";

    // Census API doesn't require authentication for most endpoints
    let url = format!("{}/timeseries", base_url);

    let response = client.get(&url).send().await.map_err(|e| {
        AppError::ExternalApiError(format!("Census datasets request failed: {}", e))
    })?;

    if !response.status().is_success() {
        return Err(AppError::ExternalApiError(format!(
            "Census API returned status: {}",
            response.status()
        )));
    }

    let datasets_response: CensusDatasetsResponse = response.json().await.map_err(|e| {
        AppError::ExternalApiError(format!("Failed to parse Census datasets response: {}", e))
    })?;

    // Filter for economic datasets
    let economic_datasets: Vec<CensusDataset> = datasets_response
        .dataset
        .into_iter()
        .filter(|dataset| {
            let name_lower = dataset.dataset_name.to_lowercase();
            let title_lower = dataset.title.to_lowercase();

            // Filter for key economic datasets
            name_lower.contains("economic")
                || name_lower.contains("business")
                || name_lower.contains("trade")
                || name_lower.contains("retail")
                || name_lower.contains("manufacturing")
                || title_lower.contains("economic")
                || title_lower.contains("business")
                || title_lower.contains("trade")
                || title_lower.contains("retail")
                || title_lower.contains("manufacturing")
        })
        .collect();

    Ok(economic_datasets)
}

/// Get known Census series organized by dataset
fn get_known_census_series_by_dataset(dataset_name: &str) -> Vec<CensusSeriesInfo> {
    match dataset_name {
        "timeseries/economic" => vec![
            CensusSeriesInfo {
                series_id: "CENSUS_ECON_RETAIL_SALES".to_string(),
                title: "Retail Sales".to_string(),
                description: Some("Monthly retail sales data from Census Bureau".to_string()),
                frequency: "Monthly".to_string(),
                units: "Millions of Dollars".to_string(),
                dataset: "timeseries/economic".to_string(),
                start_date: Some("1992-01-01".to_string()),
                end_date: None,
            },
            CensusSeriesInfo {
                series_id: "CENSUS_ECON_MANUFACTURING".to_string(),
                title: "Manufacturing Shipments".to_string(),
                description: Some(
                    "Monthly manufacturing shipments data from Census Bureau".to_string(),
                ),
                frequency: "Monthly".to_string(),
                units: "Millions of Dollars".to_string(),
                dataset: "timeseries/economic".to_string(),
                start_date: Some("1992-01-01".to_string()),
                end_date: None,
            },
        ],
        "timeseries/business" => vec![CensusSeriesInfo {
            series_id: "CENSUS_BUS_NEW_ORDERS".to_string(),
            title: "New Orders for Durable Goods".to_string(),
            description: Some("New orders for durable goods from Census Bureau".to_string()),
            frequency: "Monthly".to_string(),
            units: "Millions of Dollars".to_string(),
            dataset: "timeseries/business".to_string(),
            start_date: Some("1992-01-01".to_string()),
            end_date: None,
        }],
        // For other datasets, return empty vector for now
        // This can be expanded as we discover more series patterns
        _ => vec![],
    }
}

/// Store Census series metadata in database
async fn store_census_series(
    pool: &DatabasePool,
    source_id: &Uuid,
    series_info: &CensusSeriesInfo,
) -> AppResult<()> {
    let new_series = NewEconomicSeries {
        source_id: *source_id,
        external_id: series_info.series_id.clone(),
        title: series_info.title.clone(),
        description: series_info.description.clone(),
        units: Some(series_info.units.clone()),
        frequency: series_info.frequency.clone(),
        seasonal_adjustment: None, // Census data varies by series
        start_date: series_info
            .start_date
            .as_ref()
            .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()),
        end_date: series_info
            .end_date
            .as_ref()
            .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()),
        is_active: true,
        first_discovered_at: Some(chrono::Utc::now()),
        last_crawled_at: None,
        first_missing_date: None,
        crawl_status: None,
        crawl_error_message: None,
    };

    EconomicSeries::get_or_create(pool, &series_info.series_id, *source_id, &new_series).await?;
    Ok(())
}

#[cfg(test)]
mod tests;
