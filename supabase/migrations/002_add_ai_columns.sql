-- Add AI summary and team classification columns to emails
ALTER TABLE emails ADD COLUMN summary TEXT;
ALTER TABLE emails ADD COLUMN suggested_team TEXT;

CREATE INDEX idx_emails_suggested_team ON emails (suggested_team);
