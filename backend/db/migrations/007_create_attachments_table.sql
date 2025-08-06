-- Migration: 007_create_attachments_table.sql
-- Description: Create attachments table with all required fields

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL CHECK (size >= 0),
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX attachments_uploaded_by_idx ON attachments(uploaded_by);
CREATE INDEX attachments_task_id_idx ON attachments(task_id);
CREATE INDEX attachments_project_id_idx ON attachments(project_id);
CREATE INDEX attachments_comment_id_idx ON attachments(comment_id);
CREATE INDEX attachments_mime_type_idx ON attachments(mime_type);
CREATE INDEX attachments_created_at_idx ON attachments(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 