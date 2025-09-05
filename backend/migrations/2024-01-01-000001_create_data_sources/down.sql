-- Drop data_sources table and related objects
DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
DROP INDEX IF EXISTS idx_data_sources_name;
DROP TABLE IF EXISTS data_sources;
DROP FUNCTION IF EXISTS update_updated_at_column();
