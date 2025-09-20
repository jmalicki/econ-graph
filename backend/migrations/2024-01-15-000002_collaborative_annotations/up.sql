-- Migration: Add collaborative annotation system for financial statements
-- This migration adds tables for collaborative analysis, annotations, and team workflows

-- Create financial annotations table for collaborative analysis
CREATE TABLE financial_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID NOT NULL REFERENCES financial_statements(id) ON DELETE CASCADE,
    line_item_id UUID REFERENCES financial_line_items(id) ON DELETE CASCADE, -- Optional for statement-level annotations
    author_id UUID NOT NULL, -- References user/analyst who created annotation
    content TEXT NOT NULL, -- Annotation content
    annotation_type VARCHAR(50) NOT NULL, -- comment, question, concern, insight, risk, opportunity, etc.
    tags TEXT[], -- Array of tags for categorization
    highlights JSONB, -- Highlight ranges and colors
    mentions UUID[], -- Array of user IDs mentioned in annotation
    parent_annotation_id UUID REFERENCES financial_annotations(id) ON DELETE CASCADE, -- For threaded discussions
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, archived
    is_private BOOLEAN DEFAULT FALSE, -- Private annotations visible only to author
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create annotation replies table for threaded discussions
CREATE TABLE annotation_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID NOT NULL REFERENCES financial_annotations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL, -- References user/analyst who created reply
    content TEXT NOT NULL, -- Reply content
    mentions UUID[], -- Array of user IDs mentioned in reply
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create annotation assignments table for team workflow
CREATE TABLE annotation_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID NOT NULL REFERENCES financial_statements(id) ON DELETE CASCADE,
    line_item_id UUID REFERENCES financial_line_items(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL, -- User assigned to analyze this item
    assigner_id UUID NOT NULL, -- User who made the assignment
    assignment_type VARCHAR(50) NOT NULL, -- review, analyze, verify, etc.
    due_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, overdue
    notes TEXT, -- Assignment notes or instructions
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create annotation templates table for reusable annotation patterns
CREATE TABLE annotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_content TEXT NOT NULL, -- Template annotation content
    annotation_type VARCHAR(50) NOT NULL,
    tags TEXT[], -- Default tags for this template
    is_public BOOLEAN DEFAULT FALSE, -- Public templates available to all users
    created_by UUID NOT NULL, -- User who created the template
    usage_count INTEGER DEFAULT 0, -- How many times this template has been used
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_financial_annotations_statement_id ON financial_annotations(statement_id);
CREATE INDEX idx_financial_annotations_line_item_id ON financial_annotations(line_item_id);
CREATE INDEX idx_financial_annotations_author_id ON financial_annotations(author_id);
CREATE INDEX idx_financial_annotations_type ON financial_annotations(annotation_type);
CREATE INDEX idx_financial_annotations_status ON financial_annotations(status);
CREATE INDEX idx_financial_annotations_created_at ON financial_annotations(created_at);
CREATE INDEX idx_financial_annotations_parent_id ON financial_annotations(parent_annotation_id);

CREATE INDEX idx_annotation_replies_annotation_id ON annotation_replies(annotation_id);
CREATE INDEX idx_annotation_replies_author_id ON annotation_replies(author_id);
CREATE INDEX idx_annotation_replies_created_at ON annotation_replies(created_at);

CREATE INDEX idx_annotation_assignments_statement_id ON annotation_assignments(statement_id);
CREATE INDEX idx_annotation_assignments_line_item_id ON annotation_assignments(line_item_id);
CREATE INDEX idx_annotation_assignments_assignee_id ON annotation_assignments(assignee_id);
CREATE INDEX idx_annotation_assignments_status ON annotation_assignments(status);
CREATE INDEX idx_annotation_assignments_due_date ON annotation_assignments(due_date);

CREATE INDEX idx_annotation_templates_created_by ON annotation_templates(created_by);
CREATE INDEX idx_annotation_templates_is_public ON annotation_templates(is_public);
CREATE INDEX idx_annotation_templates_type ON annotation_templates(annotation_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_financial_annotations_updated_at
    BEFORE UPDATE ON financial_annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotation_replies_updated_at
    BEFORE UPDATE ON annotation_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotation_assignments_updated_at
    BEFORE UPDATE ON annotation_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotation_templates_updated_at
    BEFORE UPDATE ON annotation_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
