-- Drop global economic network analysis schema
-- This removes all tables and indexes for global analysis

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS leading_indicators CASCADE;
DROP TABLE IF EXISTS event_country_impacts CASCADE;
DROP TABLE IF EXISTS global_economic_events CASCADE;
DROP TABLE IF EXISTS trade_relationships CASCADE;
DROP TABLE IF EXISTS country_correlations CASCADE;
DROP TABLE IF EXISTS global_indicator_data CASCADE;
DROP TABLE IF EXISTS global_economic_indicators CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
