// REQUIREMENT: Comprehensive database integration tests for economic series
// PURPOSE: Test economic series operations with real PostgreSQL database
// This ensures time series data management works correctly with actual database

use std::sync::Arc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use chrono::NaiveDate;
use uuid::Uuid;
use crate::db_test;
use crate::test_utils::{TestContainer, DatabaseTestExt};
use crate::models::{
    data_source::{DataSource, NewDataSource},
    economic_series::{EconomicSeries, NewEconomicSeries, SeriesFrequency},
};
use crate::schema::{data_sources, economic_series};

db_test!(test_create_economic_series, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test economic series creation with database persistence
    // PURPOSE: Verify that new time series can be created and stored correctly
    // This tests the core functionality of adding economic indicators to the system
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // First create a data source
    let new_source = NewDataSource {
        name: "Test Data Source".to_string(),
        description: "Source for testing".to_string(),
        base_url: "https://test.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create economic series
    let series_id = Uuid::new_v4();
    let new_series = NewEconomicSeries {
        id: series_id,
        source_id: source.id,
        external_id: "GDP_REAL_Q".to_string(),
        title: "Real Gross Domestic Product".to_string(),
        description: Some("Inflation-adjusted GDP in billions of chained 2017 dollars".to_string()),
        frequency: SeriesFrequency::Quarterly,
        units: "Billions of Chained 2017 Dollars".to_string(),
        seasonal_adjustment: Some("Seasonally Adjusted Annual Rate".to_string()),
        start_date: NaiveDate::from_ymd_opt(1947, 1, 1).unwrap(),
        end_date: Some(NaiveDate::from_ymd_opt(2024, 12, 31).unwrap()),
        last_updated: chrono::Utc::now().naive_utc(),
        is_active: true,
    };
    
    // Test insertion
    let created_series: EconomicSeries = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&new_series)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create economic series");
    
    // Verify created series has correct data
    assert_eq!(created_series.id, series_id);
    assert_eq!(created_series.source_id, source.id);
    assert_eq!(created_series.external_id, "GDP_REAL_Q");
    assert_eq!(created_series.title, "Real Gross Domestic Product");
    assert_eq!(created_series.frequency, SeriesFrequency::Quarterly);
    assert_eq!(created_series.units, "Billions of Chained 2017 Dollars");
    assert_eq!(created_series.is_active, true);
    assert!(created_series.description.is_some());
    assert!(created_series.seasonal_adjustment.is_some());
    assert!(created_series.end_date.is_some());
    
    // Verify database persistence
    let count = pool.table_row_count("economic_series").await;
    assert_eq!(count, 1, "Should have exactly one economic series in database");
});

db_test!(test_find_series_by_external_id, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test economic series lookup by external identifier
    // PURPOSE: Verify that series can be found by their source-specific IDs
    // This tests the ability to map external data source IDs to internal series
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Test finding by external ID
    let found_series: Option<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::external_id.eq("TEST_SERIES_001"))
            .first(conn)
            .optional()
    }).await.expect("Failed to interact").expect("Failed to find series by external ID");
    
    // Verify found series
    assert!(found_series.is_some(), "Should find series by external ID");
    let series = found_series.unwrap();
    assert_eq!(series.external_id, "TEST_SERIES_001");
    assert_eq!(series.title, "Test Economic Series");
});

db_test!(test_series_with_frequency_filtering, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test filtering economic series by frequency
    // PURPOSE: Verify that series can be filtered by their data frequency
    // This supports user filtering of time series by update frequency
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create data source
    let new_source = NewDataSource {
        name: "Multi-Frequency Source".to_string(),
        description: "Source with multiple frequencies".to_string(),
        base_url: "https://multi.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create series with different frequencies
    let test_series = vec![
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "MONTHLY_001".to_string(),
            title: "Monthly Indicator 1".to_string(),
            description: None,
            frequency: SeriesFrequency::Monthly,
            units: "Index".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "QUARTERLY_001".to_string(),
            title: "Quarterly Indicator 1".to_string(),
            description: None,
            frequency: SeriesFrequency::Quarterly,
            units: "Percent".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "ANNUAL_001".to_string(),
            title: "Annual Indicator 1".to_string(),
            description: None,
            frequency: SeriesFrequency::Annual,
            units: "Dollars".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
    ];
    
    let _created_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&test_series)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create test series");
    
    // Test filtering by monthly frequency
    let monthly_series: Vec<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::frequency.eq(SeriesFrequency::Monthly))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to filter monthly series");
    
    assert_eq!(monthly_series.len(), 1);
    assert_eq!(monthly_series[0].external_id, "MONTHLY_001");
    assert_eq!(monthly_series[0].frequency, SeriesFrequency::Monthly);
    
    // Test filtering by quarterly frequency
    let quarterly_series: Vec<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::frequency.eq(SeriesFrequency::Quarterly))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to filter quarterly series");
    
    assert_eq!(quarterly_series.len(), 1);
    assert_eq!(quarterly_series[0].external_id, "QUARTERLY_001");
    assert_eq!(quarterly_series[0].frequency, SeriesFrequency::Quarterly);
});

db_test!(test_series_by_data_source, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test retrieving series by data source
    // PURPOSE: Verify that series can be grouped and filtered by their data source
    // This supports displaying all series from a specific data provider
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create multiple data sources
    let source1_data = NewDataSource {
        name: "Source One".to_string(),
        description: "First data source".to_string(),
        base_url: "https://one.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source2_data = NewDataSource {
        name: "Source Two".to_string(),
        description: "Second data source".to_string(),
        base_url: "https://two.example.com/api".to_string(),
        api_key_required: true,
        rate_limit_per_minute: 200,
    };
    
    let sources: Vec<DataSource> = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&vec![source1_data, source2_data])
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create data sources");
    
    let source1 = &sources[0];
    let source2 = &sources[1];
    
    // Create series for each source
    let test_series = vec![
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source1.id,
            external_id: "S1_SERIES_001".to_string(),
            title: "Source 1 Series 1".to_string(),
            description: None,
            frequency: SeriesFrequency::Monthly,
            units: "Index".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source1.id,
            external_id: "S1_SERIES_002".to_string(),
            title: "Source 1 Series 2".to_string(),
            description: None,
            frequency: SeriesFrequency::Quarterly,
            units: "Percent".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source2.id,
            external_id: "S2_SERIES_001".to_string(),
            title: "Source 2 Series 1".to_string(),
            description: None,
            frequency: SeriesFrequency::Annual,
            units: "Dollars".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
    ];
    
    let _created_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&test_series)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create test series");
    
    // Test filtering by source 1
    let source1_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        economic_series::table
            .filter(economic_series::source_id.eq(source1.id))
            .order(economic_series::external_id.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to filter by source 1");
    
    assert_eq!(source1_series.len(), 2);
    assert_eq!(source1_series[0].external_id, "S1_SERIES_001");
    assert_eq!(source1_series[1].external_id, "S1_SERIES_002");
    assert!(source1_series.iter().all(|s| s.source_id == source1.id));
    
    // Test filtering by source 2
    let source2_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        economic_series::table
            .filter(economic_series::source_id.eq(source2.id))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to filter by source 2");
    
    assert_eq!(source2_series.len(), 1);
    assert_eq!(source2_series[0].external_id, "S2_SERIES_001");
    assert_eq!(source2_series[0].source_id, source2.id);
});

db_test!(test_active_inactive_series, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test filtering series by active status
    // PURPOSE: Verify that inactive series can be filtered out from user views
    // This supports hiding discontinued or obsolete time series
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create data source
    let new_source = NewDataSource {
        name: "Status Test Source".to_string(),
        description: "Source for testing active/inactive".to_string(),
        base_url: "https://status.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create series with different active status
    let test_series = vec![
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "ACTIVE_SERIES".to_string(),
            title: "Active Series".to_string(),
            description: None,
            frequency: SeriesFrequency::Monthly,
            units: "Index".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true, // Active series
        },
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "INACTIVE_SERIES".to_string(),
            title: "Inactive Series".to_string(),
            description: None,
            frequency: SeriesFrequency::Monthly,
            units: "Index".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: Some(NaiveDate::from_ymd_opt(2023, 12, 31).unwrap()),
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: false, // Inactive series
        },
    ];
    
    let _created_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&test_series)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create test series");
    
    // Test filtering active series only
    let active_series: Vec<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::is_active.eq(true))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to filter active series");
    
    assert_eq!(active_series.len(), 1);
    assert_eq!(active_series[0].external_id, "ACTIVE_SERIES");
    assert_eq!(active_series[0].is_active, true);
    
    // Test filtering inactive series
    let inactive_series: Vec<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::is_active.eq(false))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to filter inactive series");
    
    assert_eq!(inactive_series.len(), 1);
    assert_eq!(inactive_series[0].external_id, "INACTIVE_SERIES");
    assert_eq!(inactive_series[0].is_active, false);
    assert!(inactive_series[0].end_date.is_some());
});

db_test!(test_series_search_by_title, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test economic series search functionality
    // PURPOSE: Verify that series can be searched by title and description
    // This supports user discovery of relevant economic indicators
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create data source
    let new_source = NewDataSource {
        name: "Search Test Source".to_string(),
        description: "Source for testing search".to_string(),
        base_url: "https://search.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create searchable series
    let test_series = vec![
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "GDP_001".to_string(),
            title: "Gross Domestic Product".to_string(),
            description: Some("Total economic output of the country".to_string()),
            frequency: SeriesFrequency::Quarterly,
            units: "Billions USD".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "UNEMPLOYMENT_001".to_string(),
            title: "Unemployment Rate".to_string(),
            description: Some("Percentage of workforce without employment".to_string()),
            frequency: SeriesFrequency::Monthly,
            units: "Percent".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: Uuid::new_v4(),
            source_id: source.id,
            external_id: "INFLATION_001".to_string(),
            title: "Consumer Price Index".to_string(),
            description: Some("Measure of inflation in consumer goods".to_string()),
            frequency: SeriesFrequency::Monthly,
            units: "Index".to_string(),
            seasonal_adjustment: None,
            start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
    ];
    
    let _created_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&test_series)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create test series");
    
    // Test search by title (case-insensitive)
    let gdp_series: Vec<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::title.ilike("%gross domestic%"))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to search by title");
    
    assert_eq!(gdp_series.len(), 1);
    assert_eq!(gdp_series[0].external_id, "GDP_001");
    
    // Test search by description
    let employment_series: Vec<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::description.ilike("%employment%"))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to search by description");
    
    assert_eq!(employment_series.len(), 1);
    assert_eq!(employment_series[0].external_id, "UNEMPLOYMENT_001");
    
    // Test combined search across title and description
    let consumer_series: Vec<EconomicSeries> = conn.interact(|conn| {
        economic_series::table
            .filter(
                economic_series::title.ilike("%consumer%")
                    .or(economic_series::description.ilike("%consumer%"))
            )
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to search across fields");
    
    assert_eq!(consumer_series.len(), 1);
    assert_eq!(consumer_series[0].external_id, "INFLATION_001");
});

db_test!(test_series_unique_constraints, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test database constraints for economic series
    // PURPOSE: Verify that unique constraints prevent duplicate series
    // This ensures data integrity and prevents conflicting series definitions
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create data source
    let new_source = NewDataSource {
        name: "Constraint Test Source".to_string(),
        description: "Source for testing constraints".to_string(),
        base_url: "https://constraint.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create first series
    let series1 = NewEconomicSeries {
        id: Uuid::new_v4(),
        source_id: source.id,
        external_id: "UNIQUE_SERIES_001".to_string(),
        title: "First Unique Series".to_string(),
        description: None,
        frequency: SeriesFrequency::Monthly,
        units: "Index".to_string(),
        seasonal_adjustment: None,
        start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
        end_date: None,
        last_updated: chrono::Utc::now().naive_utc(),
        is_active: true,
    };
    
    let _created1: EconomicSeries = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&series1)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create first series");
    
    // Try to create second series with same source_id + external_id
    let series2 = NewEconomicSeries {
        id: Uuid::new_v4(), // Different UUID
        source_id: source.id, // Same source
        external_id: "UNIQUE_SERIES_001".to_string(), // Same external ID
        title: "Duplicate External ID Series".to_string(),
        description: None,
        frequency: SeriesFrequency::Quarterly, // Different frequency
        units: "Percent".to_string(),
        seasonal_adjustment: None,
        start_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
        end_date: None,
        last_updated: chrono::Utc::now().naive_utc(),
        is_active: true,
    };
    
    let duplicate_result = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&series2)
            .get_result::<EconomicSeries>(conn)
    }).await.expect("Failed to interact");
    
    // Should fail due to unique constraint on (source_id, external_id)
    assert!(duplicate_result.is_err(), "Should fail to create duplicate external_id for same source");
    
    // Verify only one series exists
    let count = pool.table_row_count("economic_series").await;
    assert_eq!(count, 1, "Should have only one series after constraint violation");
});
