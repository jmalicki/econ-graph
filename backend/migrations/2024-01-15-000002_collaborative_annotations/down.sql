-- Migration: Remove collaborative annotation system
-- This migration removes tables for collaborative analysis, annotations, and team workflows

-- Drop triggers first
DROP TRIGGER IF EXISTS update_annotation_templates_updated_at ON annotation_templates;
DROP TRIGGER IF EXISTS update_annotation_assignments_updated_at ON annotation_assignments;
DROP TRIGGER IF EXISTS update_annotation_replies_updated_at ON annotation_replies;
DROP TRIGGER IF EXISTS update_financial_annotations_updated_at ON financial_annotations;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS annotation_templates;
DROP TABLE IF EXISTS annotation_assignments;
DROP TABLE IF EXISTS annotation_replies;
DROP TABLE IF EXISTS financial_annotations;
