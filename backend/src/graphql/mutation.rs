use async_graphql::*;

use crate::{
    database::DatabasePool,
    graphql::types::*,
};

/// Root mutation object
pub struct Mutation;

#[Object]
impl Mutation {
    /// Trigger a manual crawl for specific sources or series
    async fn trigger_crawl(
        &self,
        ctx: &Context<'_>,
        input: TriggerCrawlInput,
    ) -> Result<CrawlerStatusType> {
        let pool = ctx.data::<DatabasePool>()?;
        
        let _queued_items = crate::services::crawler_service::trigger_manual_crawl(
            pool,
            input.sources,
            input.series_ids,
            input.priority.unwrap_or(5),
        ).await?;
        
        // Return updated crawler status
        Ok(CrawlerStatusType {
            is_running: true,
            active_workers: 5,
            last_crawl: Some(chrono::Utc::now()),
            next_scheduled_crawl: Some(chrono::Utc::now() + chrono::Duration::hours(4)),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trigger_crawl_input() {
        // Test that the input type can be created
        let input = TriggerCrawlInput {
            sources: Some(vec!["FRED".to_string()]),
            series_ids: Some(vec!["GDP".to_string()]),
            priority: Some(8),
        };
        
        assert_eq!(input.sources, Some(vec!["FRED".to_string()]));
        assert_eq!(input.priority, Some(8));
    }
}
