-- Migration: 010_create_teams_and_update_roles.sql
-- Description: Create teams table and update user roles

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for teams
CREATE INDEX teams_manager_id_idx ON teams(manager_id);
CREATE INDEX teams_name_idx ON teams(name);
CREATE INDEX teams_is_active_idx ON teams(is_active);

-- Create trigger to update teams.updated_at timestamp
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add team_id to projects table
ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX projects_team_id_idx ON projects(team_id);

-- Update user roles - first remove the existing constraint
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Add new role constraint with updated roles
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'developer', 'qa'));

-- Update existing role values to match new enum
UPDATE users SET role = 'manager' WHERE role = 'project_manager';
UPDATE users SET role = 'developer' WHERE role = 'team_member';
UPDATE users SET role = 'qa' WHERE role = 'viewer';

-- Note: 'admin' role stays the same
