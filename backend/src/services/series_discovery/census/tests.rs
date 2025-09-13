//! Unit tests for Census Bureau API integration, focusing on BDS dataset

use crate::error::AppResult;
use crate::models::DataSource;
use crate::services::series_discovery::census::{
    discover_census_series, filter_economic_indicators, BdsVariable,
};
use crate::test_utils::TestContainer;
use reqwest::Client;
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_census_data_source_config() -> AppResult<()> {
    let container = TestContainer::new().await;
    let pool = container.pool().clone();

    // Test that Census data source can be created
    let census_source = DataSource::get_or_create(&pool, DataSource::census()).await?;

    assert_eq!(census_source.name, "U.S. Census Bureau");
    assert!(census_source.description.as_ref().unwrap().contains("Demographic and economic data"));
    assert_eq!(census_source.base_url, "https://api.census.gov/data");
    assert!(!census_source.api_key_required); // Census doesn't require API key

    Ok(())
}

#[tokio::test]
#[serial]
async fn test_filter_economic_indicators() -> AppResult<()> {
    // Create test variables
    let variables = vec![
        BdsVariable {
            name: "ESTAB".to_string(),
            label: "Establishments".to_string(),
            concept: "Business Counts".to_string(),
            predicate_type: "int".to_string(),
            group: "N/A".to_string(),
            limit: 0,
            predicate_only: Some(false),
        },
        BdsVariable {
            name: "FIRM".to_string(),
            label: "Firms".to_string(),
            concept: "Business Counts".to_string(),
            predicate_type: "int".to_string(),
            group: "N/A".to_string(),
            limit: 0,
            predicate_only: Some(false),
        },
        BdsVariable {
            name: "JOB_CREATION".to_string(),
            label: "Job Creation".to_string(),
            concept: "Employment".to_string(),
            predicate_type: "int".to_string(),
            group: "N/A".to_string(),
            limit: 0,
            predicate_only: Some(false),
        },
        BdsVariable {
            name: "YEAR".to_string(),
            label: "Year".to_string(),
            concept: "Time".to_string(),
            predicate_type: "int".to_string(),
            group: "N/A".to_string(),
            limit: 0,
            predicate_only: Some(true), // This is a predicate variable
        },
        BdsVariable {
            name: "for".to_string(),
            label: "Geography".to_string(),
            concept: "Geography".to_string(),
            predicate_type: "string".to_string(),
            group: "N/A".to_string(),
            limit: 0,
            predicate_only: Some(true), // This is a predicate variable
        },
        BdsVariable {
            name: "RANDOM_VAR".to_string(),
            label: "Random Variable".to_string(),
            concept: "Other".to_string(),
            predicate_type: "int".to_string(),
            group: "N/A".to_string(),
            limit: 0,
            predicate_only: Some(false),
        },
    ];

    // Filter economic indicators
    let economic_vars = filter_economic_indicators(&variables);

    // Should include economic indicators but exclude time/geography variables
    assert_eq!(economic_vars.len(), 3);

    let var_names: Vec<&String> = economic_vars.iter().map(|v| &v.name).collect();
    assert!(var_names.contains(&&"ESTAB".to_string()));
    assert!(var_names.contains(&&"FIRM".to_string()));
    assert!(var_names.contains(&&"JOB_CREATION".to_string()));

    // Should exclude time and geography variables
    assert!(!var_names.contains(&&"YEAR".to_string()));
    assert!(!var_names.contains(&&"for".to_string()));
    assert!(!var_names.contains(&&"RANDOM_VAR".to_string()));

    Ok(())
}

#[tokio::test]
#[serial]
async fn test_census_series_discovery_integration() -> AppResult<()> {
    let container = TestContainer::new().await;
    let pool = container.pool().clone();
    let client = Client::new();

    // Test Census series discovery (this will make real API calls)
    let discovered_series = discover_census_series(&client, &None, &pool).await?;

    // Should discover some series
    assert!(!discovered_series.is_empty());

    // Should include BDS series (they start with CENSUS_BDS_)
    let bds_series: Vec<&String> = discovered_series
        .iter()
        .filter(|s| s.starts_with("CENSUS_BDS_"))
        .collect();

    assert!(!bds_series.is_empty(), "Should discover BDS series");

    // Verify series are stored in database
    let census_source = DataSource::get_or_create(&pool, DataSource::census()).await?;
    let stored_series = crate::models::EconomicSeries::find_all(&pool).await?;

    let census_series: Vec<_> = stored_series
        .iter()
        .filter(|s| s.source_id == census_source.id)
        .collect();

    assert!(!census_series.is_empty(), "Should have stored Census series in database");

    // Verify BDS series have correct metadata
    let bds_series_in_db: Vec<_> = census_series
        .iter()
        .filter(|s| s.external_id.starts_with("CENSUS_BDS_"))
        .collect();

    assert!(!bds_series_in_db.is_empty(), "Should have BDS series in database");

    // Check that BDS series have expected metadata
    for series in bds_series_in_db {
        assert_eq!(series.frequency, "Annual");
        assert_eq!(series.units, Some("Count".to_string()));
        assert!(series.title.contains(" - ")); // Should have format "Variable - Geography"
        assert!(series.description.is_some());
        assert!(series.description.as_ref().unwrap().contains("Business Dynamics Statistics"));
    }

    Ok(())
}

#[tokio::test]
#[serial]
async fn test_census_series_metadata_storage() -> AppResult<()> {
    let container = TestContainer::new().await;
    let pool = container.pool().clone();

    // Create Census data source
    let census_source = DataSource::get_or_create(&pool, DataSource::census()).await?;

    // Verify data source properties
    assert_eq!(census_source.name, "U.S. Census Bureau");
    assert!(census_source.description.as_ref().unwrap().contains("Demographic and economic data"));
    assert_eq!(census_source.base_url, "https://api.census.gov/data");
    assert!(!census_source.api_key_required); // No API key required

    // Verify data source is enabled
    assert!(census_source.is_enabled);

    Ok(())
}
