-- Migration: 004_create_comments_table.sql
-- Description: Create comments table with all required fields

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT false,
    mentions JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX comments_author_id_idx ON comments(author_id);
CREATE INDEX comments_task_id_idx ON comments(task_id);
CREATE INDEX comments_project_id_idx ON comments(project_id);
CREATE INDEX comments_parent_id_idx ON comments(parent_id);
CREATE INDEX comments_created_at_idx ON comments(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 