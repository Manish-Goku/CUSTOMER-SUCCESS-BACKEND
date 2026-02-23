-- Conversations: one thread per phone number (WhatsApp/Interakt)
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'archived')),
    assigned_team TEXT,
    assigned_agent TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_status ON conversations (status);
CREATE INDEX idx_conversations_team ON conversations (assigned_team) WHERE assigned_team IS NOT NULL;
CREATE INDEX idx_conversations_last_msg ON conversations (last_message_at DESC);

-- Chat Messages: individual messages within a conversation
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    interakt_message_id TEXT UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'text'
        CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video')),
    content TEXT,
    media_url TEXT,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent')),
    sender_name TEXT,
    agent_id TEXT,
    summary TEXT,
    suggested_team TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages (conversation_id);
CREATE INDEX idx_chat_messages_interakt ON chat_messages (interakt_message_id) WHERE interakt_message_id IS NOT NULL;
CREATE INDEX idx_chat_messages_created ON chat_messages (created_at DESC);
CREATE INDEX idx_chat_messages_direction ON chat_messages (direction);
