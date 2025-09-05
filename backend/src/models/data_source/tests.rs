// REQUIREMENT: Comprehensive database integration tests for data sources
// PURPOSE: Test data source operations with real PostgreSQL database
// This ensures data source CRUD operations work correctly with actual database

use std::sync::Arc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use crate::db_test;
use crate::test_utils::{TestContainer, DatabaseTestExt};
use crate::models::data_source::{DataSource, NewDataSource, UpdateDataSource};
use crate::schema::data_sources;

db_test!(test_create_data_source, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data source creation with database persistence
    // PURPOSE: Verify that new data sources can be created and stored correctly
    // This tests the core functionality of adding new economic data providers
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    let new_source = NewDataSource {
        name: "Federal Reserve Economic Data".to_string(),
        description: "Economic time series data from the Federal Reserve Bank of St. Louis".to_string(),
        base_url: "https://api.stlouisfed.org/fred".to_string(),
        api_key_required: true,
        rate_limit_per_minute: 120,
    };
    
    // Test insertion
    let created_source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Verify created source has correct data
    assert_eq!(created_source.name, "Federal Reserve Economic Data");
    assert_eq!(created_source.base_url, "https://api.stlouisfed.org/fred");
    assert_eq!(created_source.api_key_required, true);
    assert_eq!(created_source.rate_limit_per_minute, 120);
    assert!(created_source.id > 0);
    assert!(created_source.created_at.timestamp() > 0);
    assert!(created_source.updated_at.timestamp() > 0);
    
    // Verify database persistence
    let count = pool.table_row_count("data_sources").await;
    assert_eq!(count, 1, "Should have exactly one data source in database");
});

db_test!(test_find_data_source_by_id, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data source retrieval by ID
    // PURPOSE: Verify that data sources can be found by their unique identifier
    // This tests the ability to look up specific data providers
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create test data source
    let new_source = NewDataSource {
        name: "Bureau of Labor Statistics".to_string(),
        description: "Labor market and economic statistics".to_string(),
        base_url: "https://api.bls.gov/publicAPI/v2".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 500,
    };
    
    let created_source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Test finding by ID
    let found_source: Option<DataSource> = conn.interact(move |conn| {
        data_sources::table
            .find(created_source.id)
            .first(conn)
            .optional()
    }).await.expect("Failed to interact").expect("Failed to find data source");
    
    // Verify found source matches created source
    assert!(found_source.is_some(), "Should find the created data source");
    let found_source = found_source.unwrap();
    assert_eq!(found_source.id, created_source.id);
    assert_eq!(found_source.name, "Bureau of Labor Statistics");
    assert_eq!(found_source.base_url, "https://api.bls.gov/publicAPI/v2");
});

db_test!(test_update_data_source, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data source updates with validation
    // PURPOSE: Verify that data source information can be modified correctly
    // This tests the ability to update data provider configurations
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create initial data source
    let new_source = NewDataSource {
        name: "World Bank Open Data".to_string(),
        description: "Global development data".to_string(),
        base_url: "https://api.worldbank.org/v2".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 1000,
    };
    
    let created_source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Test update
    let update_data = UpdateDataSource {
        name: Some("World Bank Open Data (Updated)".to_string()),
        description: Some("Updated global development data with new features".to_string()),
        base_url: Some("https://api.worldbank.org/v3".to_string()),
        api_key_required: Some(true), // Changed to require API key
        rate_limit_per_minute: Some(500), // Reduced rate limit
    };
    
    let source_id = created_source.id;
    let updated_source: DataSource = conn.interact(move |conn| {
        diesel::update(data_sources::table.find(source_id))
            .set(&update_data)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to update data source");
    
    // Verify updates were applied
    assert_eq!(updated_source.name, "World Bank Open Data (Updated)");
    assert_eq!(updated_source.description, "Updated global development data with new features");
    assert_eq!(updated_source.base_url, "https://api.worldbank.org/v3");
    assert_eq!(updated_source.api_key_required, true);
    assert_eq!(updated_source.rate_limit_per_minute, 500);
    
    // Verify updated_at timestamp changed
    assert!(updated_source.updated_at > created_source.updated_at);
    
    // Verify ID and created_at remain unchanged
    assert_eq!(updated_source.id, created_source.id);
    assert_eq!(updated_source.created_at, created_source.created_at);
});

db_test!(test_delete_data_source, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data source deletion
    // PURPOSE: Verify that data sources can be removed from the system
    // This tests cleanup functionality for obsolete data providers
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create test data source
    let new_source = NewDataSource {
        name: "Test Data Source for Deletion".to_string(),
        description: "This source will be deleted".to_string(),
        base_url: "https://test.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let created_source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Verify source exists
    let count_before = pool.table_row_count("data_sources").await;
    assert_eq!(count_before, 1);
    
    // Delete the source
    let source_id = created_source.id;
    let deleted_count: usize = conn.interact(move |conn| {
        diesel::delete(data_sources::table.find(source_id))
            .execute(conn)
    }).await.expect("Failed to interact").expect("Failed to delete data source");
    
    // Verify deletion
    assert_eq!(deleted_count, 1, "Should delete exactly one record");
    
    let count_after = pool.table_row_count("data_sources").await;
    assert_eq!(count_after, 0, "Should have no data sources after deletion");
    
    // Verify source cannot be found
    let found_source: Option<DataSource> = conn.interact(move |conn| {
        data_sources::table
            .find(created_source.id)
            .first(conn)
            .optional()
    }).await.expect("Failed to interact").expect("Failed to query data source");
    
    assert!(found_source.is_none(), "Deleted source should not be found");
});

db_test!(test_list_data_sources, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data source listing functionality
    // PURPOSE: Verify that all data sources can be retrieved efficiently
    // This tests the ability to display available data providers to users
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create multiple test data sources
    let test_sources = vec![
        NewDataSource {
            name: "Source A".to_string(),
            description: "First test source".to_string(),
            base_url: "https://a.example.com/api".to_string(),
            api_key_required: true,
            rate_limit_per_minute: 100,
        },
        NewDataSource {
            name: "Source B".to_string(),
            description: "Second test source".to_string(),
            base_url: "https://b.example.com/api".to_string(),
            api_key_required: false,
            rate_limit_per_minute: 200,
        },
        NewDataSource {
            name: "Source C".to_string(),
            description: "Third test source".to_string(),
            base_url: "https://c.example.com/api".to_string(),
            api_key_required: true,
            rate_limit_per_minute: 300,
        },
    ];
    
    // Insert all sources
    let _created_sources: Vec<DataSource> = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&test_sources)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create data sources");
    
    // Test listing all sources
    let all_sources: Vec<DataSource> = conn.interact(|conn| {
        data_sources::table
            .order(data_sources::name.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to load data sources");
    
    // Verify all sources are returned in correct order
    assert_eq!(all_sources.len(), 3, "Should return all three sources");
    assert_eq!(all_sources[0].name, "Source A");
    assert_eq!(all_sources[1].name, "Source B");
    assert_eq!(all_sources[2].name, "Source C");
    
    // Test filtering by API key requirement
    let api_key_sources: Vec<DataSource> = conn.interact(|conn| {
        data_sources::table
            .filter(data_sources::api_key_required.eq(true))
            .order(data_sources::name.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to filter data sources");
    
    assert_eq!(api_key_sources.len(), 2, "Should return two sources requiring API keys");
    assert_eq!(api_key_sources[0].name, "Source A");
    assert_eq!(api_key_sources[1].name, "Source C");
});

db_test!(test_data_source_constraints, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test database constraints and validation
    // PURPOSE: Verify that database enforces data integrity rules
    // This ensures data quality and prevents invalid configurations
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Test unique name constraint
    let source1 = NewDataSource {
        name: "Duplicate Name Source".to_string(),
        description: "First source with this name".to_string(),
        base_url: "https://first.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let _created1: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&source1)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create first data source");
    
    // Try to create another source with the same name
    let source2 = NewDataSource {
        name: "Duplicate Name Source".to_string(), // Same name
        description: "Second source with duplicate name".to_string(),
        base_url: "https://second.example.com/api".to_string(),
        api_key_required: true,
        rate_limit_per_minute: 200,
    };
    
    let duplicate_result = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&source2)
            .get_result::<DataSource>(conn)
    }).await.expect("Failed to interact");
    
    // Should fail due to unique constraint
    assert!(duplicate_result.is_err(), "Should fail to create duplicate name");
    
    // Verify only one source exists
    let count = pool.table_row_count("data_sources").await;
    assert_eq!(count, 1, "Should have only one data source after constraint violation");
});

db_test!(test_data_source_search, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data source search functionality
    // PURPOSE: Verify that data sources can be searched by name and description
    // This supports user discovery of available data providers
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create test sources with searchable content
    let test_sources = vec![
        NewDataSource {
            name: "Federal Reserve Economic Data".to_string(),
            description: "Comprehensive economic time series from the Fed".to_string(),
            base_url: "https://fred.stlouisfed.org/api".to_string(),
            api_key_required: true,
            rate_limit_per_minute: 120,
        },
        NewDataSource {
            name: "Bureau of Labor Statistics".to_string(),
            description: "Employment and labor market data".to_string(),
            base_url: "https://api.bls.gov".to_string(),
            api_key_required: false,
            rate_limit_per_minute: 500,
        },
        NewDataSource {
            name: "World Bank Open Data".to_string(),
            description: "Global economic development indicators".to_string(),
            base_url: "https://api.worldbank.org".to_string(),
            api_key_required: false,
            rate_limit_per_minute: 1000,
        },
    ];
    
    let _created_sources: Vec<DataSource> = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&test_sources)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create test sources");
    
    // Test search by name (case-insensitive)
    let fed_sources: Vec<DataSource> = conn.interact(|conn| {
        data_sources::table
            .filter(data_sources::name.ilike("%federal%"))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to search by name");
    
    assert_eq!(fed_sources.len(), 1);
    assert_eq!(fed_sources[0].name, "Federal Reserve Economic Data");
    
    // Test search by description
    let labor_sources: Vec<DataSource> = conn.interact(|conn| {
        data_sources::table
            .filter(data_sources::description.ilike("%labor%"))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to search by description");
    
    assert_eq!(labor_sources.len(), 1);
    assert_eq!(labor_sources[0].name, "Bureau of Labor Statistics");
    
    // Test search across name and description
    let economic_sources: Vec<DataSource> = conn.interact(|conn| {
        data_sources::table
            .filter(
                data_sources::name.ilike("%economic%")
                    .or(data_sources::description.ilike("%economic%"))
            )
            .order(data_sources::name.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to search across fields");
    
    assert_eq!(economic_sources.len(), 2);
    assert_eq!(economic_sources[0].name, "Federal Reserve Economic Data");
    assert_eq!(economic_sources[1].name, "World Bank Open Data");
});
