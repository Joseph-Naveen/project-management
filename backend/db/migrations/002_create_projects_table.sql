-- Migration: 002_create_projects_table.sql
-- Description: Create projects table with all required fields

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX projects_owner_id_idx ON projects(owner_id);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX projects_priority_idx ON projects(priority);
CREATE INDEX projects_start_date_idx ON projects(start_date);
CREATE INDEX projects_end_date_idx ON projects(end_date);
CREATE INDEX projects_name_idx ON projects(name);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 