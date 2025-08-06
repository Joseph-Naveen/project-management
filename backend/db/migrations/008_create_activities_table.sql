-- Migration: 008_create_activities_table.sql
-- Description: Create activities table with all required fields

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('create', 'update', 'delete', 'comment', 'assign', 'complete')),
    entity VARCHAR(50) NOT NULL CHECK (entity IN ('project', 'task', 'comment', 'user')),
    entity_id UUID NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX activities_actor_id_idx ON activities(actor_id);
CREATE INDEX activities_entity_idx ON activities(entity);
CREATE INDEX activities_entity_id_idx ON activities(entity_id);
CREATE INDEX activities_type_idx ON activities(type);
CREATE INDEX activities_created_at_idx ON activities(created_at); 