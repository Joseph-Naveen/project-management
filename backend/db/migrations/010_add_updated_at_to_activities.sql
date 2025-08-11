-- Add updated_at column to activities table if it doesn't already exist
DO $$
BEGIN
  BEGIN
    ALTER TABLE activities 
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
  EXCEPTION
    WHEN duplicate_column THEN
      -- column already exists, do nothing
      NULL;
  END;
END$$;

-- Create index for updated_at column for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS activities_updated_at_idx ON activities(updated_at);

-- Update existing records to have updated_at = created_at
UPDATE activities SET updated_at = created_at WHERE updated_at IS NULL;
