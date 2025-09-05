// REQUIREMENT: Comprehensive database integration tests for data points
// PURPOSE: Test data point operations with real PostgreSQL database
// This ensures time series data storage and retrieval works correctly with actual database

use std::sync::Arc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use chrono::NaiveDate;
use uuid::Uuid;
use rust_decimal::Decimal;
use crate::db_test;
use crate::test_utils::{TestContainer, DatabaseTestExt};
use crate::models::{
    data_source::{DataSource, NewDataSource},
    economic_series::{EconomicSeries, NewEconomicSeries, SeriesFrequency},
    data_point::{DataPoint, NewDataPoint, DataTransformation},
};
use crate::schema::{data_sources, economic_series, data_points};

db_test!(test_create_data_points, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data point creation with database persistence
    // PURPOSE: Verify that time series data points can be stored correctly
    // This tests the core functionality of storing economic indicator values
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test series
    container.seed_test_data().await;
    
    // Get the test series
    let series: EconomicSeries = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::external_id.eq("TEST_SERIES_001"))
            .first(conn)
    }).await.expect("Failed to interact").expect("Failed to find test series");
    
    // Create additional data points
    let new_data_points = vec![
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 6, 1).unwrap(),
            value: Some(Decimal::new(1250, 2)), // 12.50
            revision_date: NaiveDate::from_ymd_opt(2024, 6, 15).unwrap(),
            is_original_release: true,
        },
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 6, 1).unwrap(),
            value: Some(Decimal::new(1255, 2)), // 12.55 (revision)
            revision_date: NaiveDate::from_ymd_opt(2024, 7, 1).unwrap(),
            is_original_release: false,
        },
    ];
    
    // Test bulk insertion
    let created_points: Vec<DataPoint> = conn.interact(move |conn| {
        diesel::insert_into(data_points::table)
            .values(&new_data_points)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create data points");
    
    // Verify created data points
    assert_eq!(created_points.len(), 2);
    
    let original_point = &created_points[0];
    assert_eq!(original_point.series_id, series.id);
    assert_eq!(original_point.date, NaiveDate::from_ymd_opt(2024, 6, 1).unwrap());
    assert_eq!(original_point.value, Some(Decimal::new(1250, 2)));
    assert_eq!(original_point.is_original_release, true);
    
    let revised_point = &created_points[1];
    assert_eq!(revised_point.series_id, series.id);
    assert_eq!(revised_point.date, NaiveDate::from_ymd_opt(2024, 6, 1).unwrap());
    assert_eq!(revised_point.value, Some(Decimal::new(1255, 2)));
    assert_eq!(revised_point.is_original_release, false);
    
    // Verify database persistence (12 from seed + 2 new = 14 total)
    let count = pool.table_row_count("data_points").await;
    assert_eq!(count, 14, "Should have 14 data points in database");
});

db_test!(test_query_data_points_by_date_range, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test querying data points within date ranges
    // PURPOSE: Verify that time series data can be filtered by date periods
    // This supports chart rendering and data analysis for specific time periods
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test series
    let series: EconomicSeries = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::external_id.eq("TEST_SERIES_001"))
            .first(conn)
    }).await.expect("Failed to interact").expect("Failed to find test series");
    
    // Test querying Q1 2024 data (Jan-Mar)
    let q1_start = NaiveDate::from_ymd_opt(2024, 1, 1).unwrap();
    let q1_end = NaiveDate::from_ymd_opt(2024, 3, 31).unwrap();
    
    let q1_points: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::date.ge(q1_start))
            .filter(data_points::date.le(q1_end))
            .order(data_points::date.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query Q1 data");
    
    // Should have 3 points (Jan, Feb, Mar)
    assert_eq!(q1_points.len(), 3);
    assert_eq!(q1_points[0].date, NaiveDate::from_ymd_opt(2024, 1, 1).unwrap());
    assert_eq!(q1_points[1].date, NaiveDate::from_ymd_opt(2024, 2, 1).unwrap());
    assert_eq!(q1_points[2].date, NaiveDate::from_ymd_opt(2024, 3, 1).unwrap());
    
    // Test querying single month
    let june_points: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::date.ge(NaiveDate::from_ymd_opt(2024, 6, 1).unwrap()))
            .filter(data_points::date.lt(NaiveDate::from_ymd_opt(2024, 7, 1).unwrap()))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query June data");
    
    assert_eq!(june_points.len(), 1);
    assert_eq!(june_points[0].date, NaiveDate::from_ymd_opt(2024, 6, 1).unwrap());
});

db_test!(test_original_vs_revised_data, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test querying original releases vs later corrections
    // PURPOSE: Verify that data revisions can be tracked and filtered
    // This supports analysis of how data changes over time due to revisions
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create test series
    let new_source = NewDataSource {
        name: "Revision Test Source".to_string(),
        description: "Source for testing revisions".to_string(),
        base_url: "https://revision.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    let series_id = Uuid::new_v4();
    let new_series = NewEconomicSeries {
        id: series_id,
        source_id: source.id,
        external_id: "REVISION_TEST_001".to_string(),
        title: "Revision Test Series".to_string(),
        description: None,
        frequency: SeriesFrequency::Monthly,
        units: "Index".to_string(),
        seasonal_adjustment: None,
        start_date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
        end_date: None,
        last_updated: chrono::Utc::now().naive_utc(),
        is_active: true,
    };
    
    let series: EconomicSeries = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&new_series)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create series");
    
    // Create data points with revisions
    let test_data = vec![
        // Original release for January
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
            value: Some(Decimal::new(10000, 2)), // 100.00
            revision_date: NaiveDate::from_ymd_opt(2024, 1, 15).unwrap(),
            is_original_release: true,
        },
        // Revised value for January
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
            value: Some(Decimal::new(10050, 2)), // 100.50
            revision_date: NaiveDate::from_ymd_opt(2024, 2, 15).unwrap(),
            is_original_release: false,
        },
        // Second revision for January
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
            value: Some(Decimal::new(10025, 2)), // 100.25
            revision_date: NaiveDate::from_ymd_opt(2024, 3, 15).unwrap(),
            is_original_release: false,
        },
    ];
    
    let _created_points: Vec<DataPoint> = conn.interact(move |conn| {
        diesel::insert_into(data_points::table)
            .values(&test_data)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create test data");
    
    // Test querying original releases only
    let original_points: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::is_original_release.eq(true))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query original releases");
    
    assert_eq!(original_points.len(), 1);
    assert_eq!(original_points[0].value, Some(Decimal::new(10000, 2)));
    assert_eq!(original_points[0].is_original_release, true);
    
    // Test querying all revisions for a specific date
    let all_revisions: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::date.eq(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()))
            .order(data_points::revision_date.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query all revisions");
    
    assert_eq!(all_revisions.len(), 3);
    // Values should be in revision order: 100.00, 100.50, 100.25
    assert_eq!(all_revisions[0].value, Some(Decimal::new(10000, 2)));
    assert_eq!(all_revisions[1].value, Some(Decimal::new(10050, 2)));
    assert_eq!(all_revisions[2].value, Some(Decimal::new(10025, 2)));
    
    // Test querying latest revision only
    let latest_revision: Option<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::date.eq(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()))
            .order(data_points::revision_date.desc())
            .first(conn)
            .optional()
    }).await.expect("Failed to interact").expect("Failed to query latest revision");
    
    assert!(latest_revision.is_some());
    let latest = latest_revision.unwrap();
    assert_eq!(latest.value, Some(Decimal::new(10025, 2))); // Latest revision
    assert_eq!(latest.is_original_release, false);
});

db_test!(test_data_point_null_values, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test handling of missing data points (null values)
    // PURPOSE: Verify that missing or unavailable data is handled correctly
    // This supports real-world scenarios where data may be temporarily unavailable
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test series
    let series: EconomicSeries = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::external_id.eq("TEST_SERIES_001"))
            .first(conn)
    }).await.expect("Failed to interact").expect("Failed to find test series");
    
    // Create data points with null values
    let null_data_points = vec![
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 7, 1).unwrap(),
            value: None, // Missing data
            revision_date: NaiveDate::from_ymd_opt(2024, 7, 15).unwrap(),
            is_original_release: true,
        },
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 8, 1).unwrap(),
            value: Some(Decimal::new(1300, 2)), // 13.00
            revision_date: NaiveDate::from_ymd_opt(2024, 8, 15).unwrap(),
            is_original_release: true,
        },
    ];
    
    let created_points: Vec<DataPoint> = conn.interact(move |conn| {
        diesel::insert_into(data_points::table)
            .values(&null_data_points)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create null value points");
    
    // Verify null value is stored correctly
    assert_eq!(created_points[0].value, None);
    assert_eq!(created_points[1].value, Some(Decimal::new(1300, 2)));
    
    // Test querying with null value filtering
    let non_null_points: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::value.is_not_null())
            .order(data_points::date.desc())
            .limit(5)
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query non-null points");
    
    // Should exclude the null value point
    assert!(non_null_points.iter().all(|p| p.value.is_some()));
    
    // Test querying null values specifically
    let null_points: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::value.is_null())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query null points");
    
    assert_eq!(null_points.len(), 1);
    assert_eq!(null_points[0].date, NaiveDate::from_ymd_opt(2024, 7, 1).unwrap());
    assert_eq!(null_points[0].value, None);
});

db_test!(test_data_point_aggregations, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test data point aggregation queries
    // PURPOSE: Verify that statistical operations can be performed on time series data
    // This supports analytical functions like averages, min/max, etc.
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test series
    let series: EconomicSeries = conn.interact(|conn| {
        economic_series::table
            .filter(economic_series::external_id.eq("TEST_SERIES_001"))
            .first(conn)
    }).await.expect("Failed to interact").expect("Failed to find test series");
    
    // Test count aggregation
    let point_count: i64 = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::value.is_not_null())
            .count()
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to count data points");
    
    assert_eq!(point_count, 12); // 12 months of test data
    
    // Test min/max queries using raw SQL for decimal aggregation
    let (min_value, max_value): (Option<String>, Option<String>) = conn.interact(move |conn| {
        diesel::sql_query(
            "SELECT MIN(value)::text, MAX(value)::text FROM data_points WHERE series_id = $1 AND value IS NOT NULL"
        )
        .bind::<diesel::sql_types::Uuid, _>(series.id)
        .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to get min/max values");
    
    assert!(min_value.is_some());
    assert!(max_value.is_some());
    
    // Verify min and max are reasonable (test data generates values 5.01 to 5.12)
    let min_decimal: Decimal = min_value.unwrap().parse().expect("Failed to parse min value");
    let max_decimal: Decimal = max_value.unwrap().parse().expect("Failed to parse max value");
    
    assert!(min_decimal >= Decimal::new(501, 2)); // 5.01
    assert!(max_decimal <= Decimal::new(512, 2)); // 5.12
    assert!(min_decimal < max_decimal);
});

db_test!(test_data_point_time_series_continuity, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test time series data continuity and gaps
    // PURPOSE: Verify detection of missing periods in time series data
    // This supports data quality monitoring and gap analysis
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create test series with gaps
    let new_source = NewDataSource {
        name: "Gap Test Source".to_string(),
        description: "Source for testing data gaps".to_string(),
        base_url: "https://gap.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    let series_id = Uuid::new_v4();
    let new_series = NewEconomicSeries {
        id: series_id,
        source_id: source.id,
        external_id: "GAP_TEST_001".to_string(),
        title: "Gap Test Series".to_string(),
        description: None,
        frequency: SeriesFrequency::Monthly,
        units: "Index".to_string(),
        seasonal_adjustment: None,
        start_date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
        end_date: None,
        last_updated: chrono::Utc::now().naive_utc(),
        is_active: true,
    };
    
    let series: EconomicSeries = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&new_series)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create series");
    
    // Create data with intentional gaps (missing February and April)
    let gapped_data = vec![
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(), // January
            value: Some(Decimal::new(100, 0)),
            revision_date: NaiveDate::from_ymd_opt(2024, 1, 15).unwrap(),
            is_original_release: true,
        },
        // February missing
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 3, 1).unwrap(), // March
            value: Some(Decimal::new(102, 0)),
            revision_date: NaiveDate::from_ymd_opt(2024, 3, 15).unwrap(),
            is_original_release: true,
        },
        // April missing
        NewDataPoint {
            series_id: series.id,
            date: NaiveDate::from_ymd_opt(2024, 5, 1).unwrap(), // May
            value: Some(Decimal::new(105, 0)),
            revision_date: NaiveDate::from_ymd_opt(2024, 5, 15).unwrap(),
            is_original_release: true,
        },
    ];
    
    let _created_points: Vec<DataPoint> = conn.interact(move |conn| {
        diesel::insert_into(data_points::table)
            .values(&gapped_data)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create gapped data");
    
    // Test querying ordered data to identify gaps
    let ordered_points: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .order(data_points::date.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query ordered points");
    
    assert_eq!(ordered_points.len(), 3);
    assert_eq!(ordered_points[0].date, NaiveDate::from_ymd_opt(2024, 1, 1).unwrap());
    assert_eq!(ordered_points[1].date, NaiveDate::from_ymd_opt(2024, 3, 1).unwrap());
    assert_eq!(ordered_points[2].date, NaiveDate::from_ymd_opt(2024, 5, 1).unwrap());
    
    // Test date range query that would reveal gaps
    let range_start = NaiveDate::from_ymd_opt(2024, 1, 1).unwrap();
    let range_end = NaiveDate::from_ymd_opt(2024, 5, 31).unwrap();
    
    let range_points: Vec<DataPoint> = conn.interact(move |conn| {
        data_points::table
            .filter(data_points::series_id.eq(series.id))
            .filter(data_points::date.ge(range_start))
            .filter(data_points::date.le(range_end))
            .order(data_points::date.asc())
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query range points");
    
    // Should still only have 3 points, indicating gaps
    assert_eq!(range_points.len(), 3);
    
    // Verify the gaps exist by checking consecutive months
    let jan_to_mar_gap = (range_points[1].date - range_points[0].date).num_days();
    assert!(jan_to_mar_gap > 31, "Should have gap between January and March");
    
    let mar_to_may_gap = (range_points[2].date - range_points[1].date).num_days();
    assert!(mar_to_may_gap > 31, "Should have gap between March and May");
});
