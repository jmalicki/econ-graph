// REQUIREMENT: Comprehensive integration test suite with testcontainers
// PURPOSE: Demonstrate database integration testing capabilities
// This module showcases the full testing infrastructure with real PostgreSQL

// NOTE: Integration tests temporarily disabled during refactoring
// TODO: Update integration tests for new async diesel patterns

#[cfg(test)]
#[cfg(feature = "integration-tests")]
mod tests {
    use std::sync::Arc;
    use crate::db_test;
    use crate::test_utils::{TestContainer, DatabaseTestExt};
    
    db_test!(test_full_integration_scenario, |container: Arc<TestContainer>| async move {
        // REQUIREMENT: End-to-end integration test with all components
        // PURPOSE: Verify that the complete system works together correctly
        // This tests the full workflow from data source to queue processing
        
        let pool = container.pool();
        
        // Start with clean database
        container.clean_database().await;
        
        // Seed comprehensive test data
        container.seed_test_data().await;
        
        // Verify all tables have expected data
        let data_source_count = pool.table_row_count("data_sources").await;
        let series_count = pool.table_row_count("economic_series").await;
        let data_point_count = pool.table_row_count("data_points").await;
        
        assert_eq!(data_source_count, 1, "Should have 1 data source");
        assert_eq!(series_count, 1, "Should have 1 economic series");
        assert_eq!(data_point_count, 12, "Should have 12 data points");
        
        // Test cross-table relationships work correctly
        let conn = pool.get().await.expect("Failed to get connection");
        
        // Verify foreign key relationships
        let relationship_check: (i64,) = conn.interact(|conn| {
            diesel::sql_query(
                "SELECT COUNT(*) FROM economic_series es 
                 INNER JOIN data_sources ds ON es.source_id = ds.id
                 INNER JOIN data_points dp ON dp.series_id = es.id"
            ).get_result(conn)
        }).await.expect("Failed to interact").expect("Failed to check relationships");
        
        assert_eq!(relationship_check.0, 12, "All data points should have valid relationships");
        
        // Test that database constraints are working
        let constraint_test = conn.interact(|conn| {
            use crate::models::economic_series::{NewEconomicSeries, SeriesFrequency};
            use crate::schema::economic_series;
            use diesel::prelude::*;
            
            // Try to create a series with invalid source_id
            let invalid_series = NewEconomicSeries {
                id: uuid::Uuid::new_v4(),
                source_id: 99999, // Non-existent source
                external_id: "INVALID_TEST".to_string(),
                title: "Invalid Series".to_string(),
                description: None,
                frequency: SeriesFrequency::Monthly,
                units: "Test".to_string(),
                seasonal_adjustment: None,
                start_date: chrono::NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
                end_date: None,
                last_updated: chrono::Utc::now().naive_utc(),
                is_active: true,
            };
            
            diesel::insert_into(economic_series::table)
                .values(&invalid_series)
                .execute(conn)
        }).await.expect("Failed to interact");
        
        // Should fail due to foreign key constraint
        assert!(constraint_test.is_err(), "Invalid foreign key should be rejected");
        
        println!("✅ Full integration test completed successfully!");
        println!("   - Database setup and migrations: ✅");
        println!("   - Test data seeding: ✅");
        println!("   - Cross-table relationships: ✅");
        println!("   - Foreign key constraints: ✅");
        println!("   - Data integrity checks: ✅");
    });
    
    db_test!(test_concurrent_database_access, |container: Arc<TestContainer>| async move {
        // REQUIREMENT: Test concurrent database access patterns
        // PURPOSE: Verify that the database handles concurrent operations correctly
        // This simulates multiple API requests or crawler workers accessing data simultaneously
        
        let pool = container.pool();
        container.seed_test_data().await;
        
        // Simulate concurrent read operations
        let read_tasks: Vec<_> = (0..5).map(|i| {
            let pool_clone = pool.clone();
            tokio::spawn(async move {
                let conn = pool_clone.get().await.expect("Failed to get connection");
                
                let count: i64 = conn.interact(move |conn| {
                    diesel::sql_query(&format!(
                        "SELECT COUNT(*) FROM data_points WHERE EXTRACT(month FROM date) = {}",
                        (i % 12) + 1
                    )).get_result::<(i64,)>(conn).map(|(count,)| count)
                }).await.expect("Failed to interact").expect("Failed to count data points");
                
                (i, count)
            })
        }).collect();
        
        // Wait for all concurrent reads to complete
        let results = futures::future::join_all(read_tasks).await;
        
        // Verify all reads succeeded
        for result in results {
            let (task_id, count) = result.expect("Task should complete successfully");
            assert!(count >= 0, "Task {} should return valid count", task_id);
        }
        
        println!("✅ Concurrent database access test completed successfully!");
    });
    
    db_test!(test_database_performance_characteristics, |container: Arc<TestContainer>| async move {
        // REQUIREMENT: Test database performance with larger datasets
        // PURPOSE: Verify that queries perform well with realistic data volumes
        // This ensures the system can handle production-scale data
        
        let pool = container.pool();
        let conn = pool.get().await.expect("Failed to get connection");
        
        // Create a larger dataset for performance testing
        use crate::models::{
            data_source::{DataSource, NewDataSource},
            economic_series::{EconomicSeries, NewEconomicSeries, SeriesFrequency},
            data_point::{DataPoint, NewDataPoint},
        };
        use crate::schema::{data_sources, economic_series, data_points};
        use diesel::prelude::*;
        
        // Create test data source
        let perf_source = NewDataSource {
            name: "Performance Test Source".to_string(),
            description: "Large dataset for performance testing".to_string(),
            base_url: "https://perf.example.com/api".to_string(),
            api_key_required: false,
            rate_limit_per_minute: 1000,
        };
        
        let source: DataSource = conn.interact(move |conn| {
            diesel::insert_into(data_sources::table)
                .values(&perf_source)
                .get_result(conn)
        }).await.expect("Failed to interact").expect("Failed to create performance test source");
        
        // Create multiple series
        let perf_series: Vec<NewEconomicSeries> = (1..=10).map(|i| {
            NewEconomicSeries {
                id: uuid::Uuid::new_v4(),
                source_id: source.id,
                external_id: format!("PERF_SERIES_{:03}", i),
                title: format!("Performance Test Series {}", i),
                description: Some(format!("Test series {} for performance evaluation", i)),
                frequency: SeriesFrequency::Monthly,
                units: "Index".to_string(),
                seasonal_adjustment: None,
                start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
                end_date: Some(chrono::NaiveDate::from_ymd_opt(2024, 12, 31).unwrap()),
                last_updated: chrono::Utc::now().naive_utc(),
                is_active: true,
            }
        }).collect();
        
        let created_series: Vec<EconomicSeries> = conn.interact(move |conn| {
            diesel::insert_into(economic_series::table)
                .values(&perf_series)
                .get_results(conn)
        }).await.expect("Failed to interact").expect("Failed to create performance test series");
        
        // Create data points for each series (5 years * 12 months = 60 points per series)
        let start_time = std::time::Instant::now();
        
        for series in &created_series {
            let data_points: Vec<NewDataPoint> = (0..60).map(|month_offset| {
                let date = chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap()
                    + chrono::Duration::days(month_offset * 30);
                
                NewDataPoint {
                    series_id: series.id,
                    date,
                    value: Some(rust_decimal::Decimal::new((1000 + month_offset) as i64, 2)),
                    revision_date: date + chrono::Duration::days(15),
                    is_original_release: month_offset % 3 == 0,
                }
            }).collect();
            
            let series_id = series.id;
            let _inserted_points: Vec<DataPoint> = conn.interact(move |conn| {
                diesel::insert_into(data_points::table)
                    .values(&data_points)
                    .get_results(conn)
            }).await.expect("Failed to interact").expect("Failed to create data points");
        }
        
        let insert_duration = start_time.elapsed();
        println!("📊 Inserted 600 data points in {:?}", insert_duration);
        
        // Test query performance
        let query_start = std::time::Instant::now();
        
        let aggregated_data: Vec<(String, i64)> = conn.interact(|conn| {
            diesel::sql_query(
                "SELECT es.title, COUNT(dp.id) as point_count
                 FROM economic_series es
                 LEFT JOIN data_points dp ON es.id = dp.series_id
                 WHERE es.external_id LIKE 'PERF_SERIES_%'
                 GROUP BY es.id, es.title
                 ORDER BY es.title"
            ).get_results(conn)
        }).await.expect("Failed to interact").expect("Failed to run aggregation query");
        
        let query_duration = query_start.elapsed();
        println!("📊 Aggregation query completed in {:?}", query_duration);
        
        // Verify results
        assert_eq!(aggregated_data.len(), 10, "Should have 10 series");
        for (title, count) in &aggregated_data {
            assert_eq!(*count, 60, "Series '{}' should have 60 data points", title);
        }
        
        // Test complex filtering query
        let filter_start = std::time::Instant::now();
        
        let filtered_count: i64 = conn.interact(|conn| {
            diesel::sql_query(
                "SELECT COUNT(*)
                 FROM data_points dp
                 JOIN economic_series es ON dp.series_id = es.id
                 WHERE es.external_id LIKE 'PERF_SERIES_%'
                   AND dp.date >= '2022-01-01'
                   AND dp.date <= '2023-12-31'
                   AND dp.value IS NOT NULL"
            ).get_result::<(i64,)>(conn).map(|(count,)| count)
        }).await.expect("Failed to interact").expect("Failed to run filter query");
        
        let filter_duration = filter_start.elapsed();
        println!("📊 Complex filter query completed in {:?}", filter_duration);
        
        // Should find 24 months * 10 series = 240 data points
        assert_eq!(filtered_count, 240, "Should find 240 data points in 2022-2023 range");
        
        // Performance assertions (adjust thresholds based on your requirements)
        assert!(insert_duration.as_millis() < 5000, "Bulk insert should complete within 5 seconds");
        assert!(query_duration.as_millis() < 100, "Aggregation query should complete within 100ms");
        assert!(filter_duration.as_millis() < 50, "Filter query should complete within 50ms");
        
        println!("✅ Database performance test completed successfully!");
        println!("   - Bulk insert performance: ✅ ({:?})", insert_duration);
        println!("   - Aggregation query performance: ✅ ({:?})", query_duration);
        println!("   - Complex filter performance: ✅ ({:?})", filter_duration);
    });
}

use diesel;
use futures;
