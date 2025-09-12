-- Down migration for admin audit and security tables
-- Drops all admin audit and security tables and functions

-- Drop functions
DROP FUNCTION IF EXISTS log_audit_event(UUID, VARCHAR(255), VARCHAR(100), VARCHAR(50), VARCHAR(255), TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_security_event(VARCHAR(50), UUID, VARCHAR(255), VARCHAR(20), TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_user_action();

-- Drop tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
