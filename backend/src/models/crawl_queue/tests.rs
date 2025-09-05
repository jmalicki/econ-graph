// REQUIREMENT: Comprehensive database integration tests for crawl queue
// PURPOSE: Test queue operations with real PostgreSQL database including SKIP LOCKED
// This ensures the crawler queue system works correctly with concurrent processing

use std::sync::Arc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use chrono::{NaiveDateTime, Utc};
use uuid::Uuid;
use crate::db_test;
use crate::test_utils::{TestContainer, DatabaseTestExt};
use crate::models::{
    data_source::{DataSource, NewDataSource},
    crawl_queue::{CrawlQueueItem, NewCrawlQueueItem, QueueStatus, QueuePriority},
};
use crate::schema::{data_sources, crawl_queue};

db_test!(test_create_crawl_queue_items, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test crawl queue item creation with database persistence
    // PURPOSE: Verify that crawler tasks can be queued for processing
    // This tests the core functionality of the background job queue system
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Create test data source
    let new_source = NewDataSource {
        name: "Queue Test Source".to_string(),
        description: "Source for testing queue operations".to_string(),
        base_url: "https://queue.example.com/api".to_string(),
        api_key_required: false,
        rate_limit_per_minute: 100,
    };
    
    let source: DataSource = conn.interact(move |conn| {
        diesel::insert_into(data_sources::table)
            .values(&new_source)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create data source");
    
    // Create queue items with different priorities
    let queue_items = vec![
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "HIGH_PRIORITY_001".to_string(),
            url: "https://api.example.com/series/high1".to_string(),
            priority: QueuePriority::High,
            scheduled_for: Some(Utc::now().naive_utc()),
            metadata: Some(serde_json::json!({
                "series_type": "key_indicator",
                "update_frequency": "daily"
            })),
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "NORMAL_PRIORITY_001".to_string(),
            url: "https://api.example.com/series/normal1".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: None,
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "LOW_PRIORITY_001".to_string(),
            url: "https://api.example.com/series/low1".to_string(),
            priority: QueuePriority::Low,
            scheduled_for: Some(Utc::now().naive_utc() + chrono::Duration::hours(1)),
            metadata: Some(serde_json::json!({
                "series_type": "supplementary",
                "batch_size": 100
            })),
        },
    ];
    
    // Test bulk insertion
    let created_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        diesel::insert_into(crawl_queue::table)
            .values(&queue_items)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create queue items");
    
    // Verify created items
    assert_eq!(created_items.len(), 3);
    
    let high_priority_item = &created_items[0];
    assert_eq!(high_priority_item.source_id, source.id);
    assert_eq!(high_priority_item.series_external_id, "HIGH_PRIORITY_001");
    assert_eq!(high_priority_item.priority, QueuePriority::High);
    assert_eq!(high_priority_item.status, QueueStatus::Pending);
    assert!(high_priority_item.metadata.is_some());
    assert!(high_priority_item.scheduled_for.is_some());
    
    // Verify database persistence
    let count = pool.table_row_count("crawl_queue").await;
    assert_eq!(count, 3, "Should have 3 queue items in database");
});

db_test!(test_queue_priority_ordering, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test queue item retrieval by priority order
    // PURPOSE: Verify that high-priority items are processed before low-priority ones
    // This ensures critical economic indicators are updated first
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test data source
    let source: DataSource = conn.interact(|conn| {
        data_sources::table.first(conn)
    }).await.expect("Failed to interact").expect("Failed to find data source");
    
    // Create items with mixed priorities
    let mixed_priority_items = vec![
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "LOW_001".to_string(),
            url: "https://api.example.com/low1".to_string(),
            priority: QueuePriority::Low,
            scheduled_for: None,
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "HIGH_001".to_string(),
            url: "https://api.example.com/high1".to_string(),
            priority: QueuePriority::High,
            scheduled_for: None,
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "NORMAL_001".to_string(),
            url: "https://api.example.com/normal1".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: None,
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "HIGH_002".to_string(),
            url: "https://api.example.com/high2".to_string(),
            priority: QueuePriority::High,
            scheduled_for: None,
            metadata: None,
        },
    ];
    
    let _created_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        diesel::insert_into(crawl_queue::table)
            .values(&mixed_priority_items)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create mixed priority items");
    
    // Test priority ordering (High = 3, Normal = 2, Low = 1)
    let ordered_items: Vec<CrawlQueueItem> = conn.interact(|conn| {
        crawl_queue::table
            .filter(crawl_queue::status.eq(QueueStatus::Pending))
            .order((
                crawl_queue::priority.desc(), // Higher priority first
                crawl_queue::created_at.asc(), // Then by creation time
            ))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query ordered items");
    
    // Verify ordering: High priority items first, then Normal, then Low
    assert!(ordered_items.len() >= 4);
    assert_eq!(ordered_items[0].priority, QueuePriority::High);
    assert_eq!(ordered_items[1].priority, QueuePriority::High);
    
    // Find normal and low priority items
    let normal_index = ordered_items.iter().position(|item| item.priority == QueuePriority::Normal);
    let low_index = ordered_items.iter().position(|item| item.priority == QueuePriority::Low);
    
    assert!(normal_index.is_some());
    assert!(low_index.is_some());
    assert!(normal_index.unwrap() < low_index.unwrap(), "Normal priority should come before Low priority");
});

db_test!(test_skip_locked_queue_processing, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test SKIP LOCKED functionality for concurrent queue processing
    // PURPOSE: Verify that multiple workers can process queue items without conflicts
    // This ensures the crawler can scale horizontally with multiple worker processes
    
    let pool = container.pool();
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test data source
    let source: DataSource = {
        let conn = pool.get().await.expect("Failed to get connection");
        conn.interact(|conn| {
            data_sources::table.first(conn)
        }).await.expect("Failed to interact").expect("Failed to find data source")
    };
    
    // Create multiple queue items for processing
    let queue_items: Vec<NewCrawlQueueItem> = (1..=10)
        .map(|i| NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: format!("CONCURRENT_ITEM_{:03}", i),
            url: format!("https://api.example.com/series/{}", i),
            priority: QueuePriority::Normal,
            scheduled_for: None,
            metadata: None,
        })
        .collect();
    
    let conn = pool.get().await.expect("Failed to get connection");
    let _created_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        diesel::insert_into(crawl_queue::table)
            .values(&queue_items)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create queue items");
    
    // Simulate concurrent worker processing using SKIP LOCKED
    // Worker 1: Get next available item
    let worker1_item: Option<CrawlQueueItem> = {
        let conn = pool.get().await.expect("Failed to get connection");
        conn.interact(|conn| {
            // REQUIREMENT: Use SKIP LOCKED for concurrent processing
            // This query simulates what a worker would do to claim a job
            diesel::sql_query(
                "UPDATE crawl_queue 
                 SET status = 'processing', 
                     processing_started_at = NOW(),
                     worker_id = 'worker1'
                 WHERE id = (
                     SELECT id FROM crawl_queue 
                     WHERE status = 'pending' 
                     ORDER BY priority DESC, created_at ASC 
                     FOR UPDATE SKIP LOCKED 
                     LIMIT 1
                 )
                 RETURNING *"
            ).get_result::<CrawlQueueItem>(conn).optional()
        }).await.expect("Failed to interact").expect("Failed to claim item for worker1")
    };
    
    // Worker 2: Get next available item (should get a different item)
    let worker2_item: Option<CrawlQueueItem> = {
        let conn = pool.get().await.expect("Failed to get connection");
        conn.interact(|conn| {
            diesel::sql_query(
                "UPDATE crawl_queue 
                 SET status = 'processing', 
                     processing_started_at = NOW(),
                     worker_id = 'worker2'
                 WHERE id = (
                     SELECT id FROM crawl_queue 
                     WHERE status = 'pending' 
                     ORDER BY priority DESC, created_at ASC 
                     FOR UPDATE SKIP LOCKED 
                     LIMIT 1
                 )
                 RETURNING *"
            ).get_result::<CrawlQueueItem>(conn).optional()
        }).await.expect("Failed to interact").expect("Failed to claim item for worker2")
    };
    
    // Verify both workers got different items
    assert!(worker1_item.is_some(), "Worker 1 should get an item");
    assert!(worker2_item.is_some(), "Worker 2 should get an item");
    
    let item1 = worker1_item.unwrap();
    let item2 = worker2_item.unwrap();
    
    assert_ne!(item1.id, item2.id, "Workers should get different items");
    assert_eq!(item1.status, QueueStatus::Processing);
    assert_eq!(item2.status, QueueStatus::Processing);
    assert_eq!(item1.worker_id, Some("worker1".to_string()));
    assert_eq!(item2.worker_id, Some("worker2".to_string()));
    
    // Verify remaining items are still pending
    let pending_count = pool.execute_count(
        "SELECT COUNT(*) FROM crawl_queue WHERE status = 'pending'"
    ).await;
    assert_eq!(pending_count, 8, "Should have 8 pending items remaining");
    
    let processing_count = pool.execute_count(
        "SELECT COUNT(*) FROM crawl_queue WHERE status = 'processing'"
    ).await;
    assert_eq!(processing_count, 2, "Should have 2 items being processed");
});

db_test!(test_queue_status_transitions, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test queue item status transitions through processing lifecycle
    // PURPOSE: Verify that items move correctly through pending -> processing -> completed/failed
    // This ensures proper tracking of job processing states
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test data source
    let source: DataSource = conn.interact(|conn| {
        data_sources::table.first(conn)
    }).await.expect("Failed to interact").expect("Failed to find data source");
    
    // Create test queue item
    let new_item = NewCrawlQueueItem {
        source_id: source.id,
        series_external_id: "STATUS_TEST_001".to_string(),
        url: "https://api.example.com/status_test".to_string(),
        priority: QueuePriority::Normal,
        scheduled_for: None,
        metadata: None,
    };
    
    let created_item: CrawlQueueItem = conn.interact(move |conn| {
        diesel::insert_into(crawl_queue::table)
            .values(&new_item)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create test item");
    
    // Verify initial state
    assert_eq!(created_item.status, QueueStatus::Pending);
    assert!(created_item.processing_started_at.is_none());
    assert!(created_item.completed_at.is_none());
    assert!(created_item.worker_id.is_none());
    
    // Transition to Processing
    let processing_item: CrawlQueueItem = conn.interact(move |conn| {
        diesel::update(crawl_queue::table.find(created_item.id))
            .set((
                crawl_queue::status.eq(QueueStatus::Processing),
                crawl_queue::processing_started_at.eq(Some(Utc::now().naive_utc())),
                crawl_queue::worker_id.eq(Some("test_worker".to_string())),
            ))
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to update to processing");
    
    assert_eq!(processing_item.status, QueueStatus::Processing);
    assert!(processing_item.processing_started_at.is_some());
    assert!(processing_item.completed_at.is_none());
    assert_eq!(processing_item.worker_id, Some("test_worker".to_string()));
    
    // Transition to Completed
    let completed_item: CrawlQueueItem = conn.interact(move |conn| {
        diesel::update(crawl_queue::table.find(processing_item.id))
            .set((
                crawl_queue::status.eq(QueueStatus::Completed),
                crawl_queue::completed_at.eq(Some(Utc::now().naive_utc())),
                crawl_queue::result_summary.eq(Some("Successfully processed 150 data points".to_string())),
            ))
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to update to completed");
    
    assert_eq!(completed_item.status, QueueStatus::Completed);
    assert!(completed_item.processing_started_at.is_some());
    assert!(completed_item.completed_at.is_some());
    assert!(completed_item.result_summary.is_some());
    
    // Verify processing time calculation
    let processing_duration = completed_item.completed_at.unwrap() 
        - completed_item.processing_started_at.unwrap();
    assert!(processing_duration.num_seconds() >= 0);
});

db_test!(test_queue_retry_logic, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test queue item retry functionality for failed jobs
    // PURPOSE: Verify that failed items can be retried with backoff logic
    // This ensures resilience against temporary failures in data source APIs
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test data source
    let source: DataSource = conn.interact(|conn| {
        data_sources::table.first(conn)
    }).await.expect("Failed to interact").expect("Failed to find data source");
    
    // Create test item that will fail
    let new_item = NewCrawlQueueItem {
        source_id: source.id,
        series_external_id: "RETRY_TEST_001".to_string(),
        url: "https://api.example.com/retry_test".to_string(),
        priority: QueuePriority::Normal,
        scheduled_for: None,
        metadata: None,
    };
    
    let created_item: CrawlQueueItem = conn.interact(move |conn| {
        diesel::insert_into(crawl_queue::table)
            .values(&new_item)
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to create test item");
    
    // Simulate first failure
    let failed_item: CrawlQueueItem = conn.interact(move |conn| {
        diesel::update(crawl_queue::table.find(created_item.id))
            .set((
                crawl_queue::status.eq(QueueStatus::Failed),
                crawl_queue::processing_started_at.eq(Some(Utc::now().naive_utc())),
                crawl_queue::completed_at.eq(Some(Utc::now().naive_utc())),
                crawl_queue::retry_count.eq(1),
                crawl_queue::last_error.eq(Some("Connection timeout".to_string())),
                crawl_queue::worker_id.eq(Some("test_worker".to_string())),
            ))
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to mark as failed");
    
    assert_eq!(failed_item.status, QueueStatus::Failed);
    assert_eq!(failed_item.retry_count, 1);
    assert!(failed_item.last_error.is_some());
    
    // Simulate retry (reset to pending with incremented retry count)
    let retry_item: CrawlQueueItem = conn.interact(move |conn| {
        diesel::update(crawl_queue::table.find(failed_item.id))
            .set((
                crawl_queue::status.eq(QueueStatus::Retrying),
                crawl_queue::scheduled_for.eq(Some(Utc::now().naive_utc() + chrono::Duration::minutes(5))), // Backoff delay
                crawl_queue::processing_started_at.eq(None::<NaiveDateTime>),
                crawl_queue::completed_at.eq(None::<NaiveDateTime>),
                crawl_queue::worker_id.eq(None::<String>),
            ))
            .get_result(conn)
    }).await.expect("Failed to interact").expect("Failed to set for retry");
    
    assert_eq!(retry_item.status, QueueStatus::Retrying);
    assert_eq!(retry_item.retry_count, 1); // Remains same until next attempt
    assert!(retry_item.scheduled_for.is_some());
    assert!(retry_item.processing_started_at.is_none());
    assert!(retry_item.completed_at.is_none());
    assert!(retry_item.worker_id.is_none());
    
    // Verify retry is scheduled for future
    let now = Utc::now().naive_utc();
    assert!(retry_item.scheduled_for.unwrap() > now);
});

db_test!(test_queue_scheduled_items, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test scheduled queue items (future processing)
    // PURPOSE: Verify that items can be scheduled for future processing
    // This supports rate limiting and scheduled crawl operations
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test data source
    let source: DataSource = conn.interact(|conn| {
        data_sources::table.first(conn)
    }).await.expect("Failed to interact").expect("Failed to find data source");
    
    let now = Utc::now().naive_utc();
    let future_time = now + chrono::Duration::hours(2);
    let past_time = now - chrono::Duration::hours(1);
    
    // Create items with different scheduling
    let scheduled_items = vec![
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "IMMEDIATE_001".to_string(),
            url: "https://api.example.com/immediate".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: None, // Process immediately
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "FUTURE_001".to_string(),
            url: "https://api.example.com/future".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: Some(future_time), // Process in 2 hours
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "OVERDUE_001".to_string(),
            url: "https://api.example.com/overdue".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: Some(past_time), // Should have been processed 1 hour ago
            metadata: None,
        },
    ];
    
    let _created_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        diesel::insert_into(crawl_queue::table)
            .values(&scheduled_items)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create scheduled items");
    
    // Test querying items ready for processing (now or overdue)
    let ready_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        crawl_queue::table
            .filter(crawl_queue::status.eq(QueueStatus::Pending))
            .filter(
                crawl_queue::scheduled_for.is_null()
                    .or(crawl_queue::scheduled_for.le(now))
            )
            .order((
                crawl_queue::priority.desc(),
                crawl_queue::scheduled_for.asc().nulls_first(),
            ))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query ready items");
    
    // Should include immediate and overdue, but not future
    assert_eq!(ready_items.len(), 2);
    
    let immediate_item = ready_items.iter()
        .find(|item| item.series_external_id == "IMMEDIATE_001")
        .expect("Should find immediate item");
    assert!(immediate_item.scheduled_for.is_none());
    
    let overdue_item = ready_items.iter()
        .find(|item| item.series_external_id == "OVERDUE_001")
        .expect("Should find overdue item");
    assert!(overdue_item.scheduled_for.is_some());
    assert!(overdue_item.scheduled_for.unwrap() < now);
    
    // Test querying future items
    let future_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        crawl_queue::table
            .filter(crawl_queue::status.eq(QueueStatus::Pending))
            .filter(crawl_queue::scheduled_for.gt(now))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query future items");
    
    assert_eq!(future_items.len(), 1);
    assert_eq!(future_items[0].series_external_id, "FUTURE_001");
    assert!(future_items[0].scheduled_for.unwrap() > now);
});

db_test!(test_queue_cleanup_operations, |container: Arc<TestContainer>| async move {
    // REQUIREMENT: Test queue cleanup operations for maintenance
    // PURPOSE: Verify that old completed/failed items can be cleaned up
    // This prevents the queue table from growing indefinitely
    
    let pool = container.pool();
    let conn = pool.get().await.expect("Failed to get connection");
    
    // Setup test data
    container.seed_test_data().await;
    
    // Get the test data source
    let source: DataSource = conn.interact(|conn| {
        data_sources::table.first(conn)
    }).await.expect("Failed to interact").expect("Failed to find data source");
    
    let old_time = Utc::now().naive_utc() - chrono::Duration::days(30);
    let recent_time = Utc::now().naive_utc() - chrono::Duration::hours(1);
    
    // Create items with different ages and statuses
    let cleanup_test_items = vec![
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "OLD_COMPLETED_001".to_string(),
            url: "https://api.example.com/old_completed".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: None,
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "OLD_FAILED_001".to_string(),
            url: "https://api.example.com/old_failed".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: None,
            metadata: None,
        },
        NewCrawlQueueItem {
            source_id: source.id,
            series_external_id: "RECENT_COMPLETED_001".to_string(),
            url: "https://api.example.com/recent_completed".to_string(),
            priority: QueuePriority::Normal,
            scheduled_for: None,
            metadata: None,
        },
    ];
    
    let created_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        diesel::insert_into(crawl_queue::table)
            .values(&cleanup_test_items)
            .get_results(conn)
    }).await.expect("Failed to interact").expect("Failed to create cleanup test items");
    
    // Update items to simulate different completion times
    let old_completed_id = created_items[0].id;
    let old_failed_id = created_items[1].id;
    let recent_completed_id = created_items[2].id;
    
    // Mark old items as completed/failed with old timestamps
    conn.interact(move |conn| {
        diesel::update(crawl_queue::table.find(old_completed_id))
            .set((
                crawl_queue::status.eq(QueueStatus::Completed),
                crawl_queue::completed_at.eq(Some(old_time)),
            ))
            .execute(conn)?;
            
        diesel::update(crawl_queue::table.find(old_failed_id))
            .set((
                crawl_queue::status.eq(QueueStatus::Failed),
                crawl_queue::completed_at.eq(Some(old_time)),
            ))
            .execute(conn)?;
            
        diesel::update(crawl_queue::table.find(recent_completed_id))
            .set((
                crawl_queue::status.eq(QueueStatus::Completed),
                crawl_queue::completed_at.eq(Some(recent_time)),
            ))
            .execute(conn)?;
            
        Ok::<(), diesel::result::Error>(())
    }).await.expect("Failed to interact").expect("Failed to update item statuses");
    
    // Test cleanup query (delete items completed > 7 days ago)
    let cleanup_cutoff = Utc::now().naive_utc() - chrono::Duration::days(7);
    let deleted_count: usize = conn.interact(move |conn| {
        diesel::delete(
            crawl_queue::table
                .filter(crawl_queue::status.eq_any(vec![QueueStatus::Completed, QueueStatus::Failed]))
                .filter(crawl_queue::completed_at.lt(cleanup_cutoff))
        ).execute(conn)
    }).await.expect("Failed to interact").expect("Failed to cleanup old items");
    
    // Should delete 2 old items (completed and failed)
    assert_eq!(deleted_count, 2);
    
    // Verify recent completed item still exists
    let remaining_items: Vec<CrawlQueueItem> = conn.interact(move |conn| {
        crawl_queue::table
            .filter(crawl_queue::series_external_id.like("RECENT_%"))
            .load(conn)
    }).await.expect("Failed to interact").expect("Failed to query remaining items");
    
    assert_eq!(remaining_items.len(), 1);
    assert_eq!(remaining_items[0].series_external_id, "RECENT_COMPLETED_001");
});
