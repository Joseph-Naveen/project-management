-- Migration: 010_add_dependencies_to_tasks.sql
-- Description: Add dependencies column to tasks table

-- Add dependencies column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'dependencies') THEN
        ALTER TABLE tasks ADD COLUMN dependencies JSONB DEFAULT '[]';
    END IF;
END $$;
