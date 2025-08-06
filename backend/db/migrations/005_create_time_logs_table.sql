-- Migration: 005_create_time_logs_table.sql
-- Description: Create time_logs table with all required fields

CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    duration DECIMAL(5,2) NOT NULL CHECK (duration >= 0),
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    billable BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(8,2) CHECK (hourly_rate >= 0),
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX time_logs_user_id_idx ON time_logs(user_id);
CREATE INDEX time_logs_task_id_idx ON time_logs(task_id);
CREATE INDEX time_logs_project_id_idx ON time_logs(project_id);
CREATE INDEX time_logs_date_idx ON time_logs(date);
CREATE INDEX time_logs_billable_idx ON time_logs(billable);
CREATE INDEX time_logs_approved_idx ON time_logs(approved);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_time_logs_updated_at BEFORE UPDATE ON time_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 