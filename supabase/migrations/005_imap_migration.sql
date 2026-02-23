-- Migration: Replace Gmail Watch with IMAP polling

-- support_emails: Remove Gmail Watch columns, add IMAP columns
ALTER TABLE support_emails DROP COLUMN IF EXISTS watch_expiration;
ALTER TABLE support_emails DROP COLUMN IF EXISTS watch_history_id;

ALTER TABLE support_emails ADD COLUMN imap_host TEXT NOT NULL DEFAULT 'imap.gmail.com';
ALTER TABLE support_emails ADD COLUMN imap_port INTEGER NOT NULL DEFAULT 993;
ALTER TABLE support_emails ADD COLUMN imap_user TEXT;
ALTER TABLE support_emails ADD COLUMN imap_password TEXT;  -- encrypted at app level
ALTER TABLE support_emails ADD COLUMN last_synced_uid INTEGER DEFAULT 0;
ALTER TABLE support_emails ADD COLUMN last_synced_at TIMESTAMPTZ;

-- emails: Rename Gmail-specific columns to generic
ALTER TABLE emails RENAME COLUMN gmail_message_id TO message_id;
ALTER TABLE emails DROP COLUMN IF EXISTS history_id;
ALTER TABLE emails DROP COLUMN IF EXISTS label_ids;

-- Update index for renamed column
DROP INDEX IF EXISTS idx_emails_gmail_message;
CREATE UNIQUE INDEX idx_emails_message_id ON emails (message_id);
