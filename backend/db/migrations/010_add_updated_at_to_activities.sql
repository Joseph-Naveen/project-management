-- Migration: 010_add_updated_at_to_activities.sql
-- Description: Add missing updated_at column to activities table

-- Add updated_at column to activities table
ALTER TABLE activities 
ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for updated_at column for better query performance
CREATE INDEX activities_updated_at_idx ON activities(updated_at);

-- Update existing records to have updated_at = created_at
UPDATE activities SET updated_at = created_at WHERE updated_at IS NULL;
