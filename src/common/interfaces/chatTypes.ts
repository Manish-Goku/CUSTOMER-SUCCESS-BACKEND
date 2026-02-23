export interface ConversationRecord {
  id: string;
  phone_number: string;
  customer_name: string | null;
  status: 'open' | 'resolved' | 'archived';
  assigned_team: string | null;
  assigned_agent: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  interakt_message_id: string | null;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video';
  content: string | null;
  media_url: string | null;
  sender_type: 'customer' | 'agent';
  sender_name: string | null;
  agent_id: string | null;
  summary: string | null;
  suggested_team: string | null;
  is_read: boolean;
  created_at: string;
}
