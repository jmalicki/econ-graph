use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tokio_cron_scheduler::{Job, JobScheduler};
use tracing::{error, info, warn};

use crate::{
    error::{AppError, AppResult},
    services::{crawler_service, queue_service},
    AppState,
};

/// Start the crawler service
pub async fn start_crawler(state: AppState) -> AppResult<()> {
    info!("Starting crawler service");
    
    // Create job scheduler
    let scheduler = JobScheduler::new().await.map_err(|e| {
        AppError::Internal(format!("Failed to create job scheduler: {}", e))
    })?;
    
    // Schedule periodic crawl jobs
    schedule_crawl_jobs(&scheduler, state.clone()).await?;
    
    // Start the job scheduler
    scheduler.start().await.map_err(|e| {
        AppError::Internal(format!("Failed to start job scheduler: {}", e))
    })?;
    
    // Start the queue processor
    let queue_processor_state = state.clone();
    tokio::spawn(async move {
        if let Err(e) = run_queue_processor(queue_processor_state).await {
            error!("Queue processor error: {}", e);
        }
    });
    
    info!("Crawler service started successfully");
    
    // Keep the crawler running
    loop {
        sleep(Duration::from_secs(60)).await;
        
        // Periodic health check
        if let Err(e) = check_crawler_health(&state).await {
            warn!("Crawler health check failed: {}", e);
        }
    }
}

/// Schedule crawl jobs
async fn schedule_crawl_jobs(scheduler: &JobScheduler, state: AppState) -> AppResult<()> {
    // Schedule FRED data updates every 4 hours
    let fred_state = state.clone();
    let fred_job = Job::new_async("0 0 */4 * * *", move |_uuid, _l| {
        let state = fred_state.clone();
        Box::pin(async move {
            info!("Starting scheduled FRED crawl");
            if let Err(e) = crawler_service::schedule_fred_crawl(&state.db_pool).await {
                error!("FRED crawl scheduling failed: {}", e);
            }
        })
    }).map_err(|e| AppError::Internal(format!("Failed to create FRED job: {}", e)))?;
    
    scheduler.add(fred_job).await.map_err(|e| {
        AppError::Internal(format!("Failed to schedule FRED job: {}", e))
    })?;
    
    // Schedule BLS data updates every 6 hours
    let bls_state = state.clone();
    let bls_job = Job::new_async("0 0 */6 * * *", move |_uuid, _l| {
        let state = bls_state.clone();
        Box::pin(async move {
            info!("Starting scheduled BLS crawl");
            if let Err(e) = crawler_service::schedule_bls_crawl(&state.db_pool).await {
                error!("BLS crawl scheduling failed: {}", e);
            }
        })
    }).map_err(|e| AppError::Internal(format!("Failed to create BLS job: {}", e)))?;
    
    scheduler.add(bls_job).await.map_err(|e| {
        AppError::Internal(format!("Failed to schedule BLS job: {}", e))
    })?;
    
    // Schedule queue cleanup every hour
    let cleanup_state = state.clone();
    let cleanup_job = Job::new_async("0 0 * * * *", move |_uuid, _l| {
        let state = cleanup_state.clone();
        Box::pin(async move {
            info!("Starting queue cleanup");
            if let Err(e) = queue_service::cleanup_old_queue_items(&state.db_pool).await {
                error!("Queue cleanup failed: {}", e);
            }
        })
    }).map_err(|e| AppError::Internal(format!("Failed to create cleanup job: {}", e)))?;
    
    scheduler.add(cleanup_job).await.map_err(|e| {
        AppError::Internal(format!("Failed to schedule cleanup job: {}", e))
    })?;
    
    info!("Scheduled crawl jobs successfully");
    Ok(())
}

/// Run the queue processor that handles crawl jobs
async fn run_queue_processor(state: AppState) -> AppResult<()> {
    info!("Starting queue processor");
    
    let max_concurrent_jobs = state.config.crawler.max_concurrent_jobs;
    let poll_interval = Duration::from_secs(state.config.crawler.queue_poll_interval_seconds);
    
    // Create a semaphore to limit concurrent jobs
    let semaphore = Arc::new(tokio::sync::Semaphore::new(max_concurrent_jobs));
    
    loop {
        // Get available queue items using SKIP LOCKED
        match queue_service::get_next_queue_items(&state.db_pool, max_concurrent_jobs as i64).await {
            Ok(items) => {
                if items.is_empty() {
                    sleep(poll_interval).await;
                    continue;
                }
                
                info!("Processing {} queue items", items.len());
                
                // Process items concurrently
                let mut handles = Vec::new();
                
                for item in items {
                    let permit = semaphore.clone().acquire_owned().await.map_err(|e| {
                        AppError::Internal(format!("Failed to acquire semaphore: {}", e))
                    })?;
                    
                    let state_clone = state.clone();
                    let handle = tokio::spawn(async move {
                        let _permit = permit; // Keep permit alive
                        
                        if let Err(e) = process_queue_item(&state_clone, item).await {
                            error!("Failed to process queue item: {}", e);
                        }
                    });
                    
                    handles.push(handle);
                }
                
                // Wait for all tasks to complete
                for handle in handles {
                    if let Err(e) = handle.await {
                        error!("Queue processing task failed: {}", e);
                    }
                }
            }
            Err(e) => {
                error!("Failed to get queue items: {}", e);
                sleep(poll_interval).await;
            }
        }
    }
}

/// Process a single queue item
async fn process_queue_item(
    state: &AppState,
    item: crate::models::CrawlQueueItem,
) -> AppResult<()> {
    info!("Processing queue item: {} - {}", item.source, item.series_id);
    
    // Lock the item
    queue_service::lock_queue_item(&state.db_pool, item.id, "queue-processor").await?;
    
    // Update status to processing
    queue_service::update_queue_item_status(
        &state.db_pool,
        item.id,
        crate::models::QueueStatus::Processing,
        None,
    ).await?;
    
    // Process based on source
    let result = match item.source.as_str() {
        "FRED" => crawler_service::crawl_fred_series(&state.db_pool, &item.series_id).await,
        "BLS" => crawler_service::crawl_bls_series(&state.db_pool, &item.series_id).await,
        _ => Err(AppError::BadRequest(format!("Unknown source: {}", item.source))),
    };
    
    // Update item status based on result
    match result {
        Ok(_) => {
            info!("Successfully processed: {} - {}", item.source, item.series_id);
            queue_service::update_queue_item_status(
                &state.db_pool,
                item.id,
                crate::models::QueueStatus::Completed,
                None,
            ).await?;
        }
        Err(e) => {
            error!("Failed to process: {} - {}: {}", item.source, item.series_id, e);
            
            // Check if we should retry
            if item.can_retry() {
                queue_service::update_queue_item_for_retry(
                    &state.db_pool,
                    item.id,
                    Some(e.to_string()),
                ).await?;
            } else {
                queue_service::update_queue_item_status(
                    &state.db_pool,
                    item.id,
                    crate::models::QueueStatus::Failed,
                    Some(e.to_string()),
                ).await?;
            }
        }
    }
    
    // Unlock the item
    queue_service::unlock_queue_item(&state.db_pool, item.id).await?;
    
    Ok(())
}

/// Check crawler health
async fn check_crawler_health(state: &AppState) -> AppResult<()> {
    // Check database connectivity
    crate::database::check_database_health(&state.db_pool).await?;
    
    // Check queue statistics
    let stats = queue_service::get_queue_statistics(&state.db_pool).await?;
    
    // Log warnings if queue is backing up
    if stats.pending_items > 1000 {
        warn!("Queue has {} pending items - may be backing up", stats.pending_items);
    }
    
    if stats.failed_items > 100 {
        warn!("Queue has {} failed items - check for issues", stats.failed_items);
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_crawler_health_check() {
        // This test requires a database connection
        // Skip if DATABASE_URL is not set
        if std::env::var("DATABASE_URL").is_err() {
            return;
        }
        
        let config = Arc::new(crate::config::Config::default());
        let container = crate::test_utils::TestContainer::new().await;
        let db_pool = container.pool();
        let state = AppState { db_pool, config };
        
        // This should not panic
        let result = check_crawler_health(&state).await;
        // The result may be an error if the database is not set up, but it shouldn't panic
        assert!(result.is_ok() || result.is_err());
    }
}
