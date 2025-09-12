-- Comprehensive Crawler Enhancements Migration - Rollback
-- This migration rolls back all crawler-related enhancements

-- ============================================================================
-- 1. REMOVE CRAWL ATTEMPTS TRACKING
-- ============================================================================

-- Drop crawl_attempts table and related objects
DROP TRIGGER IF EXISTS set_crawl_attempts_updated_at ON crawl_attempts;
DROP TABLE IF EXISTS crawl_attempts;

-- ============================================================================
-- 2. REMOVE SERIES-LEVEL CRAWL TRACKING
-- ============================================================================

-- Remove series-level crawl tracking fields from economic_series table
ALTER TABLE economic_series DROP COLUMN IF EXISTS first_discovered_at;
ALTER TABLE economic_series DROP COLUMN IF EXISTS last_crawled_at;
ALTER TABLE economic_series DROP COLUMN IF EXISTS first_missing_date;
ALTER TABLE economic_series DROP COLUMN IF EXISTS crawl_status;
ALTER TABLE economic_series DROP COLUMN IF EXISTS crawl_error_message;

-- ============================================================================
-- 3. REMOVE DATA SOURCE VISIBILITY CONTROLS
-- ============================================================================

-- Drop user preferences table and related objects
DROP TRIGGER IF EXISTS update_user_data_source_preferences_updated_at ON user_data_source_preferences;
DROP TABLE IF EXISTS user_data_source_preferences;

-- Remove visibility and admin controls from data_sources table
ALTER TABLE data_sources DROP COLUMN IF EXISTS is_visible;
ALTER TABLE data_sources DROP COLUMN IF EXISTS is_enabled;
ALTER TABLE data_sources DROP COLUMN IF EXISTS requires_admin_approval;
ALTER TABLE data_sources DROP COLUMN IF EXISTS crawl_frequency_hours;
ALTER TABLE data_sources DROP COLUMN IF EXISTS last_crawl_at;
ALTER TABLE data_sources DROP COLUMN IF EXISTS crawl_status;
ALTER TABLE data_sources DROP COLUMN IF EXISTS crawl_error_message;

-- ============================================================================
-- 4. REMOVE ADDITIONAL DATA SOURCES
-- ============================================================================

-- Remove IMF and BEA data sources if they were added
DELETE FROM data_sources WHERE name IN (
    'International Monetary Fund (IMF)',
    'Bureau of Economic Analysis (BEA)'
);
