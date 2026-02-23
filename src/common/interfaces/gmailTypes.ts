export interface AttachmentMeta {
  attachment_id: string;
  filename: string;
  mime_type: string;
  size: number;
}

export interface ParsedEmail {
  message_id: string;
  thread_id: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  has_attachments: boolean;
  attachments: AttachmentMeta[];
  internal_date: Date | null;
}

export interface SupportEmailRecord {
  id: string;
  email_address: string;
  display_name: string | null;
  is_active: boolean;
  imap_host: string;
  imap_port: number;
  imap_user: string | null;
  imap_password: string | null;
  last_synced_uid: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailRecord {
  id: string;
  support_email_id: string;
  message_id: string;
  thread_id: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  has_attachments: boolean;
  attachments: AttachmentMeta[];
  internal_date: string | null;
  received_at: string;
  is_read: boolean;
  summary: string | null;
  suggested_team: string | null;
  direction: string;
  agent_name: string | null;
  in_reply_to: string | null;
  created_at: string;
}
