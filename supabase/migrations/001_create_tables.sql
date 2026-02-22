-- Support Emails: managed mailboxes to watch
CREATE TABLE support_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_address TEXT NOT NULL UNIQUE,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    watch_expiration TIMESTAMPTZ,
    watch_history_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_support_emails_active ON support_emails (is_active) WHERE is_active = true;

-- Emails: ingested messages
CREATE TABLE emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    support_email_id UUID REFERENCES support_emails(id) ON DELETE CASCADE,
    gmail_message_id TEXT NOT NULL UNIQUE,
    thread_id TEXT,
    history_id TEXT,
    from_address TEXT NOT NULL,
    from_name TEXT,
    to_addresses TEXT[] DEFAULT '{}',
    cc_addresses TEXT[] DEFAULT '{}',
    bcc_addresses TEXT[] DEFAULT '{}',
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    snippet TEXT,
    label_ids TEXT[] DEFAULT '{}',
    has_attachments BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    internal_date TIMESTAMPTZ,
    received_at TIMESTAMPTZ DEFAULT now(),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_emails_support_email ON emails (support_email_id);
CREATE INDEX idx_emails_gmail_message ON emails (gmail_message_id);
CREATE INDEX idx_emails_thread ON emails (thread_id);
CREATE INDEX idx_emails_from ON emails (from_address);
CREATE INDEX idx_emails_received ON emails (received_at DESC);
