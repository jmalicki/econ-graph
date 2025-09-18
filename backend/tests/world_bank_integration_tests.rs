//! Integration tests for World Bank data source functionality
//!
//! These tests require database access and test the full integration
//! between World Bank data source configuration and database storage.

use econ_graph_core::models::DataSource;
use serial_test::serial;
use testcontainers::runners::AsyncRunner;
use testcontainers_modules::postgres::Postgres;
use diesel::Connection;

/// Test World Bank data source database integration
#[tokio::test]
#[serial]
async fn test_world_bank_data_source_database_integration() -> Result<(), Box<dyn std::error::Error>> {
    // Set up test database
    let postgres = Postgres::default()
        .with_db_name("econ_graph_test")
        .with_user("postgres")
        .with_password("password");

    let container = postgres.start().await;
    let connection_string = format!(
        "postgres://postgres:password@localhost:{}/econ_graph_test",
        container.get_host_port_ipv4(5432).await
    );

    // Create database pool
    let pool = econ_graph_core::database::DatabasePool::new(&connection_string).await?;

    // Run migrations
    let mut conn = pool.get().await?;
    diesel::migrations::run_pending_migrations(&mut conn)?;

    // Test creating and retrieving World Bank data source from database
    let world_bank_source = DataSource::get_or_create(&pool, DataSource::world_bank()).await?;

    // Verify World Bank data source configuration in database
    assert_eq!(world_bank_source.name, "World Bank Open Data");
    assert!(!world_bank_source.api_key_required);
    assert_eq!(world_bank_source.rate_limit_per_minute, 1000);
    assert_eq!(world_bank_source.base_url, "https://api.worldbank.org/v2");
    assert!(world_bank_source.description.is_some());
    assert!(world_bank_source
        .description
        .unwrap()
        .contains("Global economic"));

    // Test that the data source has a valid ID (was actually stored in database)
    assert!(!world_bank_source.id.is_nil());

    // Test that calling get_or_create again returns the same data source
    let world_bank_source_2 = DataSource::get_or_create(&pool, DataSource::world_bank()).await?;
    assert_eq!(world_bank_source.id, world_bank_source_2.id);
    assert_eq!(world_bank_source.name, world_bank_source_2.name);

    Ok(())
}

/// Test World Bank data source configuration persistence
#[tokio::test]
#[serial]
async fn test_world_bank_data_source_persistence() -> Result<(), Box<dyn std::error::Error>> {
    // Set up test database
    let postgres = Postgres::default()
        .with_db_name("econ_graph_test")
        .with_user("postgres")
        .with_password("password");

    let container = postgres.start().await;
    let connection_string = format!(
        "postgres://postgres:password@localhost:{}/econ_graph_test",
        container.get_host_port_ipv4(5432).await
    );

    // Create database pool
    let pool = econ_graph_core::database::DatabasePool::new(&connection_string).await?;

    // Run migrations
    let mut conn = pool.get().await?;
    diesel::migrations::run_pending_migrations(&mut conn)?;

    // Create World Bank data source
    let world_bank_source = DataSource::get_or_create(&pool, DataSource::world_bank()).await?;
    let source_id = world_bank_source.id;

    // Verify it can be retrieved by ID
    let retrieved_source = DataSource::get_by_id(&pool, source_id).await?;
    assert!(retrieved_source.is_some());

    let retrieved_source = retrieved_source.unwrap();
    assert_eq!(retrieved_source.id, source_id);
    assert_eq!(retrieved_source.name, "World Bank Open Data");
    assert_eq!(retrieved_source.base_url, "https://api.worldbank.org/v2");

    Ok(())
}
