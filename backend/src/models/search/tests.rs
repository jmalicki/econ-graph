// REQUIREMENT: Comprehensive tests for full-text search with PostgreSQL integration
// PURPOSE: Test full-text search, spelling correction, and synonym functionality
// This ensures the advanced search capabilities work correctly with real database

use std::sync::Arc;
use crate::db_test;
use crate::test_utils::{TestContainer, DatabaseTestExt};
use crate::services::search_service::SearchService;
use crate::models::search::{SearchParams, SearchSortOrder};

db_test!(test_fulltext_search_basic, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test basic full-text search functionality
    // PURPOSE: Verify that PostgreSQL full-text search finds relevant series
    // This tests the core search functionality with tsvector indexing
    
    let pool = Arc::new(container.pool().clone());
    let search_service = SearchService::new(pool);
    
    // Seed test data
    container.seed_test_data().await;
    
    // Test exact match search
    let params = SearchParams::simple("Test Economic Series");
    let results = search_service.search_series(&params).await.expect("Search should succeed");
    
    assert!(!results.is_empty(), "Should find exact match for series title");
    assert!(results[0].rank > 0.0, "Results should have relevance ranking");
    
    // Test partial word search
    let params = SearchParams::simple("Economic");
    let results = search_service.search_series(&params).await.expect("Search should succeed");
    
    assert!(!results.is_empty(), "Should find partial word matches");
    
    // Test case insensitive search
    let params = SearchParams::simple("ECONOMIC");
    let results = search_service.search_series(&params).await.expect("Search should succeed");
    
    assert!(!results.is_empty(), "Search should be case insensitive");
});

db_test!(test_fulltext_search_with_synonyms, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test synonym expansion in full-text search
    // PURPOSE: Verify that economic synonyms are properly expanded
    // This tests the custom text search configuration with synonym dictionary
    
    let pool = Arc::new(container.pool().clone());
    let search_service = SearchService::new(pool);
    
    // Create test data with economic terms that have synonyms
    container.clean_database().await;
    
    // Create test series with synonymous terms
    let conn = container.pool().get().await.expect("Failed to get connection");
    
    use crate::models::{
        data_source::{DataSource, NewDataSource},
        economic_series::{EconomicSeries, NewEconomicSeries, SeriesFrequency},
    };
    use crate::schema::{data_sources, economic_series};
    use diesel::prelude::*;
    
    let test_source = NewDataSource {
        name: "Synonym Test Source".to_string(),
        description: "Source for testing synonym expansion".to_string(),
        base_url: "https://synonym.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&test_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create series with terms that should match synonyms
    let test_series = vec![
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: source.id,
            external_id: "GDP_001".to_string(),
            title: "Gross Domestic Product".to_string(), // Should match "GDP"
            description: Some("Total economic output of the country".to_string()),
            frequency: SeriesFrequency::Quarterly,
            units: "Billions USD".to_string(),
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: source.id,
            external_id: "UNEMPLOYMENT_001".to_string(),
            title: "Unemployment Rate".to_string(), // Should match "jobless rate"
            description: Some("Percentage of workforce without employment".to_string()),
            frequency: SeriesFrequency::Monthly,
            units: "Percent".to_string(),
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
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
    
    // Test synonym expansion - search for "GDP" should find "Gross Domestic Product"
    let params = SearchParams::simple("GDP");
    let results = search_service.search_series(&params).await.expect("GDP search should succeed");
    
    // Should find the GDP series through synonym matching
    let gdp_found = results.iter().any(|r| r.title.contains("Gross Domestic Product"));
    assert!(gdp_found, "Should find GDP series through synonym expansion");
    
    // Test synonym expansion - search for "jobless rate" should find "Unemployment Rate"
    let params = SearchParams::simple("jobless rate");
    let results = search_service.search_series(&params).await.expect("Jobless rate search should succeed");
    
    // Should find unemployment series through synonym matching
    let unemployment_found = results.iter().any(|r| r.title.contains("Unemployment"));
    assert!(unemployment_found, "Should find unemployment series through synonym expansion");
});

db_test!(test_spelling_correction_with_trigrams, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test spelling correction using trigram similarity
    // PURPOSE: Verify that misspelled queries still return relevant results
    // This tests the fuzzy matching capabilities using pg_trgm extension
    
    let pool = Arc::new(container.pool().clone());
    let search_service = SearchService::new(pool);
    
    // Seed test data
    container.seed_test_data().await;
    
    // Test spelling correction with moderate similarity threshold
    let params = SearchParams::with_similarity("Economc Sries", 0.3); // Typos in "Economic Series"
    let results = search_service.search_series(&params).await.expect("Fuzzy search should succeed");
    
    assert!(!results.is_empty(), "Should find results despite spelling errors");
    
    // At least one result should have similarity score > 0 (indicating trigram matching)
    let has_fuzzy_match = results.iter().any(|r| r.similarity_score > 0.0);
    assert!(has_fuzzy_match, "Should use trigram similarity for spelling correction");
    
    // Test with more severe typos
    let params = SearchParams::with_similarity("Ecnmc", 0.2); // More severe typos
    let results = search_service.search_series(&params).await.expect("Severe typo search should succeed");
    
    // May or may not find results depending on similarity threshold
    // This tests the boundary conditions of fuzzy matching
    println!("Severe typo search found {} results", results.len());
    
    // Test with very low similarity threshold (should be more permissive)
    let params = SearchParams::with_similarity("Ecnmc", 0.1);
    let results = search_service.search_series(&params).await.expect("Low threshold search should succeed");
    
    // Should potentially find more results with lower threshold
    println!("Low threshold search found {} results", results.len());
});

db_test!(test_search_ranking_and_relevance, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test search result ranking and relevance scoring
    // PURPOSE: Verify that more relevant results are ranked higher
    // This tests the ts_rank function and result ordering
    
    let pool = Arc::new(container.pool().clone());
    let search_service = SearchService::new(pool);
    
    container.clean_database().await;
    
    // Create test data with varying relevance
    let conn = container.pool().get().await.expect("Failed to get connection");
    
    use crate::models::{
        data_source::{DataSource, NewDataSource},
        economic_series::{EconomicSeries, NewEconomicSeries, SeriesFrequency},
    };
    use crate::schema::{data_sources, economic_series};
    use diesel::prelude::*;
    
    let test_source = NewDataSource {
        name: "Ranking Test Source".to_string(),
        description: "Source for testing search ranking".to_string(),
        base_url: "https://ranking.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&test_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create series with different relevance for "inflation" search
    let test_series = vec![
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: source.id,
            external_id: "HIGH_RELEVANCE".to_string(),
            title: "Inflation Rate".to_string(), // Exact match in title (highest weight)
            description: Some("Core inflation measurement".to_string()),
            frequency: SeriesFrequency::Monthly,
            units: "Percent".to_string(),
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: source.id,
            external_id: "MEDIUM_RELEVANCE".to_string(),
            title: "Consumer Price Index".to_string(), // Related but not exact match
            description: Some("Measure of inflation in consumer goods".to_string()), // Match in description
            frequency: SeriesFrequency::Monthly,
            units: "Index".to_string(),
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: source.id,
            external_id: "LOW_RELEVANCE".to_string(),
            title: "GDP Growth Rate".to_string(), // No direct match
            description: Some("Economic growth measurement".to_string()),
            frequency: SeriesFrequency::Quarterly,
            units: "Percent".to_string(),
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
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
    
    // Search for "inflation" and verify ranking
    let params = SearchParams::simple("inflation");
    let results = search_service.search_series(&params).await.expect("Inflation search should succeed");
    
    assert!(!results.is_empty(), "Should find inflation-related series");
    
    // Results should be ordered by relevance (rank DESC)
    for i in 1..results.len() {
        assert!(
            results[i-1].rank >= results[i].rank,
            "Results should be ordered by decreasing relevance rank"
        );
    }
    
    // The "Inflation Rate" series should rank highest
    if results.len() > 1 {
        let highest_ranked = &results[0];
        assert!(
            highest_ranked.title.contains("Inflation") || highest_ranked.rank > 0.5,
            "Most relevant result should be ranked highest"
        );
    }
});

db_test!(test_search_filtering_and_sorting, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test search filtering by source, frequency, and status
    // PURPOSE: Verify that search results can be properly filtered and sorted
    // This tests the WHERE clauses and ORDER BY functionality in search
    
    let pool = Arc::new(container.pool().clone());
    let search_service = SearchService::new(pool);
    
    container.clean_database().await;
    
    // Create multiple data sources and series for filtering
    let conn = container.pool().get().await.expect("Failed to get connection");
    
    use crate::models::{
        data_source::{DataSource, NewDataSource},
        economic_series::{EconomicSeries, NewEconomicSeries, SeriesFrequency},
    };
    use crate::schema::{data_sources, economic_series};
    use diesel::prelude::*;
    
    // Create two different sources
    let sources_data = vec![
        NewDataSource {
            name: "Source A".to_string(),
            description: "First test source".to_string(),
            base_url: "https://a.example.com/api".to_string(),
            api_key_required: false,
            rate_limit_per_minute: 100,
        },
        NewDataSource {
            name: "Source B".to_string(),
            description: "Second test source".to_string(),
            base_url: "https://b.example.com/api".to_string(),
            api_key_required: false,
            rate_limit_per_minute: 100,
        },
    ];
    
    let sources: Vec<DataSource> = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&sources_data)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create data sources");
    
    // Create series with different frequencies and sources
    let test_series = vec![
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: sources[0].id,
            external_id: "MONTHLY_A".to_string(),
            title: "Monthly Economic Indicator A".to_string(),
            description: Some("Monthly data from source A".to_string()),
            frequency: SeriesFrequency::Monthly,
            units: "Index".to_string(),
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        },
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: sources[1].id,
            external_id: "QUARTERLY_B".to_string(),
            title: "Quarterly Economic Indicator B".to_string(),
            description: Some("Quarterly data from source B".to_string()),
            frequency: SeriesFrequency::Quarterly,
            units: "Percent".to_string(),
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: false, // Inactive series
        },
    ];
    
    let _created_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&test_series)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create test series");
    
    // Test filtering by source
    let params = SearchParams {
        query: "Economic Indicator".to_string(),
        source_id: Some(sources[0].id),
        ..Default::default()
    };
    let results = search_service.search_series(&params).await.expect("Source filtered search should succeed");
    
    // All results should be from source A
    for result in &results {
        assert_eq!(result.source_id, sources[0].id, "All results should be from filtered source");
    }
    
    // Test filtering by frequency
    let params = SearchParams {
        query: "Economic".to_string(),
        frequency: Some("Monthly".to_string()),
        ..Default::default()
    };
    let results = search_service.search_series(&params).await.expect("Frequency filtered search should succeed");
    
    // All results should be monthly frequency
    for result in &results {
        assert_eq!(result.frequency, "Monthly", "All results should have filtered frequency");
    }
    
    // Test including inactive series
    let params = SearchParams {
        query: "Economic".to_string(),
        include_inactive: Some(true),
        ..Default::default()
    };
    let results_with_inactive = search_service.search_series(&params).await.expect("Search with inactive should succeed");
    
    let params = SearchParams {
        query: "Economic".to_string(),
        include_inactive: Some(false),
        ..Default::default()
    };
    let results_active_only = search_service.search_series(&params).await.expect("Active only search should succeed");
    
    // Should find more results when including inactive
    assert!(
        results_with_inactive.len() >= results_active_only.len(),
        "Including inactive should return same or more results"
    );
    
    // Test sorting by title
    let params = SearchParams {
        query: "Economic".to_string(),
        sort_by: Some(SearchSortOrder::Title),
        ..Default::default()
    };
    let results = search_service.search_series(&params).await.expect("Title sorted search should succeed");
    
    // Verify title sorting
    for i in 1..results.len() {
        assert!(
            results[i-1].title <= results[i].title,
            "Results should be sorted by title alphabetically"
        );
    }
});

db_test!(test_search_suggestions_functionality, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test search suggestions for query completion
    // PURPOSE: Verify that search suggestions help users discover relevant terms
    // This tests the suggestion generation from existing series data
    
    let pool = Arc::new(container.pool().clone());
    let search_service = SearchService::new(pool);
    
    // Seed test data
    container.seed_test_data().await;
    
    // Test getting suggestions for partial query
    let suggestions = search_service.get_suggestions("eco", 10).await.expect("Suggestions should succeed");
    
    // Should get some suggestions (may be empty depending on test data)
    println!("Found {} suggestions for 'eco'", suggestions.len());
    
    // Test suggestions for empty query (should return empty)
    let empty_suggestions = search_service.get_suggestions("", 10).await.expect("Empty query should succeed");
    assert!(empty_suggestions.is_empty(), "Empty query should return no suggestions");
    
    // Test suggestions for very short query (should return empty)
    let short_suggestions = search_service.get_suggestions("a", 10).await.expect("Short query should succeed");
    assert!(short_suggestions.is_empty(), "Very short query should return no suggestions");
    
    // Test suggestion limit enforcement
    let limited_suggestions = search_service.get_suggestions("test", 5).await.expect("Limited suggestions should succeed");
    assert!(limited_suggestions.len() <= 5, "Should respect suggestion limit");
});

db_test!(test_search_performance_characteristics, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test search performance with realistic data volumes
    // PURPOSE: Verify that search performs well with larger datasets
    // This ensures the search indices and queries are optimized
    
    let pool = Arc::new(container.pool().clone());
    let search_service = SearchService::new(pool.clone());
    
    container.clean_database().await;
    
    // Create a larger dataset for performance testing
    let conn = container.pool().get().await.expect("Failed to get connection");
    
    use crate::models::{
        data_source::{DataSource, NewDataSource},
        economic_series::{EconomicSeries, NewEconomicSeries, SeriesFrequency},
    };
    use crate::schema::{data_sources, economic_series};
    use diesel::prelude::*;
    
    // Create performance test source
    let perf_source = NewDataSource {
        name: "Performance Test Source".to_string(),
        description: "Large dataset for search performance testing".to_string(),
        base_url: "https://perf.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 1000,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&perf_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create performance test source");
    
    // Create multiple series with searchable content
    let perf_series: Vec<NewEconomicSeries> = (1..=50).map(|i| {
        NewEconomicSeries {
            id: uuid::Uuid::new_v4(),
            source_id: source.id,
            external_id: format!("PERF_SERIES_{:03}", i),
            title: format!("Performance Test Series {} Economic Indicator", i),
            description: Some(format!("Test series {} for search performance evaluation with economic data", i)),
            frequency: if i % 2 == 0 { SeriesFrequency::Monthly } else { SeriesFrequency::Quarterly },
            units: if i % 3 == 0 { "Percent".to_string() } else { "Index".to_string() },
            seasonal_adjustment: None,
            start_date: chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            end_date: None,
            last_updated: chrono::Utc::now().naive_utc(),
            is_active: true,
        }
    }).collect();
    
    let _created_series: Vec<EconomicSeries> = conn.interact(move |conn| {
        diesel::insert_into(economic_series::table)
            .values(&perf_series)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create performance test series");
    
    // Test search performance
    let start_time = std::time::Instant::now();
    
    let params = SearchParams::simple("Performance Economic");
    let results = search_service.search_series(&params).await.expect("Performance search should succeed");
    
    let search_duration = start_time.elapsed();
    
    // Verify results
    assert!(!results.is_empty(), "Should find performance test series");
    assert!(results.len() <= 50, "Should not exceed expected result count");
    
    // Performance assertions (adjust based on your requirements)
    assert!(search_duration.as_millis() < 500, "Search should complete within 500ms");
    
    println!("✅ Search performance test completed:");
    println!("   - Found {} results in {:?}", results.len(), search_duration);
    println!("   - Average time per result: {:?}", search_duration / results.len() as u32);
    
    // Test fuzzy search performance
    let fuzzy_start = std::time::Instant::now();
    
    let fuzzy_params = SearchParams::with_similarity("Performnce Economc", 0.3); // Typos
    let fuzzy_results = search_service.search_series(&fuzzy_params).await.expect("Fuzzy search should succeed");
    
    let fuzzy_duration = fuzzy_start.elapsed();
    
    // Fuzzy search may be slower but should still be reasonable
    assert!(fuzzy_duration.as_millis() < 1000, "Fuzzy search should complete within 1 second");
    
    println!("   - Fuzzy search: {} results in {:?}", fuzzy_results.len(), fuzzy_duration);
});
