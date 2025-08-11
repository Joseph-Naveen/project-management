-- Ensure updated_at column exists and is indexed; safe to re-run
DO $$
BEGIN
  BEGIN
    ALTER TABLE activities 
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;
END$$;

CREATE INDEX IF NOT EXISTS activities_updated_at_idx ON activities(updated_at);

UPDATE activities SET updated_at = created_at WHERE updated_at IS NULL;
