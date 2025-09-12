-- Admin Audit and Security Tables Migration
-- Creates audit logs and security events tables to support admin UI functionality

-- Create audit_logs table for tracking admin actions and user changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL, -- Denormalized for performance
    action VARCHAR(100) NOT NULL, -- 'create_user', 'update_user', 'delete_user', 'suspend_user', etc.
    resource_type VARCHAR(50) NOT NULL, -- 'user', 'session', 'system', etc.
    resource_id VARCHAR(255), -- ID of the affected resource
    ip_address TEXT,
    user_agent TEXT,
    details JSONB, -- Additional action details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_events table for tracking security incidents
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- 'login_failed', 'unauthorized_access', 'suspicious_activity', etc.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional, for user-related events
    user_email VARCHAR(255), -- Denormalized for performance
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    ip_address TEXT,
    user_agent TEXT,
    description TEXT NOT NULL,
    metadata JSONB, -- Additional event metadata
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);

CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_ip_address ON security_events(ip_address);

-- Create composite indexes for common queries
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, created_at DESC);
CREATE INDEX idx_security_events_type_severity ON security_events(event_type, severity);
CREATE INDEX idx_security_events_user_created ON security_events(user_id, created_at DESC);

-- Create function to automatically log user actions
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by triggers to log user actions
    -- Implementation will be added when triggers are created
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'medium',
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type, user_id, user_email, severity,
        ip_address, user_agent, description, metadata
    ) VALUES (
        p_event_type, p_user_id, p_user_email, p_severity,
        p_ip_address, p_user_agent, p_description, p_metadata
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_user_name VARCHAR(255),
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id VARCHAR(255) DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, user_name, action, resource_type, resource_id,
        ip_address, user_agent, details
    ) VALUES (
        p_user_id, p_user_name, p_action, p_resource_type, p_resource_id,
        p_ip_address, p_user_agent, p_details
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;
