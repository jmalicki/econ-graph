-- Drop crawl_queue table and related objects
DROP TRIGGER IF EXISTS update_crawl_queue_updated_at ON crawl_queue;
DROP INDEX IF EXISTS idx_crawl_queue_status;
DROP INDEX IF EXISTS idx_crawl_queue_priority;
DROP INDEX IF EXISTS idx_crawl_queue_scheduled_for;
DROP INDEX IF EXISTS idx_crawl_queue_locked_by;
DROP INDEX IF EXISTS idx_crawl_queue_source;
DROP INDEX IF EXISTS idx_crawl_queue_created_at;
DROP INDEX IF EXISTS idx_crawl_queue_processing;
DROP TABLE IF EXISTS crawl_queue;
