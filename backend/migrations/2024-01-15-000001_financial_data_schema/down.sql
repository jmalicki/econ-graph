-- Financial Data Schema Migration Rollback
-- Drops all financial data tables and related objects

-- Drop views first
DROP VIEW IF EXISTS financial_ratios_detailed;
DROP VIEW IF EXISTS financial_line_items_detailed;
DROP VIEW IF EXISTS company_financial_statements;

-- Drop triggers
DROP TRIGGER IF EXISTS update_xbrl_taxonomy_concepts_updated_at ON xbrl_taxonomy_concepts;
DROP TRIGGER IF EXISTS update_company_comparisons_updated_at ON company_comparisons;
DROP TRIGGER IF EXISTS update_financial_ratios_updated_at ON financial_ratios;
DROP TRIGGER IF EXISTS update_financial_line_items_updated_at ON financial_line_items;
DROP TRIGGER IF EXISTS update_financial_statements_updated_at ON financial_statements;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS xbrl_processing_logs;
DROP TABLE IF EXISTS xbrl_taxonomy_concepts;
DROP TABLE IF EXISTS company_comparisons;
DROP TABLE IF EXISTS financial_ratios;
DROP TABLE IF EXISTS financial_line_items;
DROP TABLE IF EXISTS financial_statements;
DROP TABLE IF EXISTS companies;

-- Remove SEC EDGAR data source
DELETE FROM data_sources WHERE name = 'SEC EDGAR';
