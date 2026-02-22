export interface AttachmentMeta {
  attachment_id: string;
  filename: string;
  mime_type: string;
  size: number;
}

export interface ParsedEmail {
  gmail_message_id: string;
  thread_id: string | null;
  history_id: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  label_ids: string[];
  has_attachments: boolean;
  attachments: AttachmentMeta[];
  internal_date: Date | null;
}

export interface SupportEmailRecord {
  id: string;
  email_address: string;
  display_name: string | null;
  is_active: boolean;
  watch_expiration: string | null;
  watch_history_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailRecord {
  id: string;
  support_email_id: string;
  gmail_message_id: string;
  thread_id: string | null;
  history_id: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  label_ids: string[];
  has_attachments: boolean;
  attachments: AttachmentMeta[];
  internal_date: string | null;
  received_at: string;
  is_read: boolean;
  created_at: string;
}
