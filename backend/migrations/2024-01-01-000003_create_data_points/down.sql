-- Drop data_points table and related objects
DROP TRIGGER IF EXISTS update_data_points_updated_at ON data_points;
DROP INDEX IF EXISTS idx_data_points_series_id;
DROP INDEX IF EXISTS idx_data_points_date;
DROP INDEX IF EXISTS idx_data_points_revision_date;
DROP INDEX IF EXISTS idx_data_points_is_original_release;
DROP INDEX IF EXISTS idx_data_points_series_date;
DROP INDEX IF EXISTS idx_data_points_series_date_revision;
DROP INDEX IF EXISTS idx_data_points_latest_revision;
DROP TABLE IF EXISTS data_points;
