-- Drop economic_series table and related objects
DROP TRIGGER IF EXISTS update_economic_series_updated_at ON economic_series;
DROP INDEX IF EXISTS idx_economic_series_source_id;
DROP INDEX IF EXISTS idx_economic_series_external_id;
DROP INDEX IF EXISTS idx_economic_series_title;
DROP INDEX IF EXISTS idx_economic_series_description;
DROP INDEX IF EXISTS idx_economic_series_frequency;
DROP INDEX IF EXISTS idx_economic_series_is_active;
DROP INDEX IF EXISTS idx_economic_series_last_updated;
DROP TABLE IF EXISTS economic_series;
