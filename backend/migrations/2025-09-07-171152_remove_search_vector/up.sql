-- Remove search_vector columns from data_sources and economic_series tables
ALTER TABLE data_sources DROP COLUMN IF EXISTS search_vector CASCADE;
ALTER TABLE economic_series DROP COLUMN IF EXISTS search_vector CASCADE;