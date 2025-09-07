-- Add back search_vector columns (for rollback)
ALTER TABLE data_sources ADD COLUMN search_vector tsvector;
ALTER TABLE economic_series ADD COLUMN search_vector tsvector;