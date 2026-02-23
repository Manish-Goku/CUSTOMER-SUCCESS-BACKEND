# Chat Ingestion Module — Session Doc
**Date:** 2026-02-23
**Commit:** `7366d0c` — Add WhatsApp/Interakt chat channel with bidirectional messaging

## What Was Built
WhatsApp/Interakt chat channel — bidirectional, threaded by phone number. Receives incoming WhatsApp messages via Interakt webhooks, classifies with Gemini AI, lets agents reply from dashboard.

## Files Created (15)

### Migration
- `supabase/migrations/004_chat_tables.sql` — `conversations` + `chat_messages` tables

### Interfaces
- `src/common/interfaces/chatTypes.ts` — `ConversationRecord`, `ChatMessageRecord`

### DTOs (6)
- `src/chatIngestion/dto/interaktWebhook.dto.ts` — Webhook payload (nested: customer, message)
- `src/chatIngestion/dto/sendMessage.dto.ts` — Agent reply input (content, agent_id, agent_name)
- `src/chatIngestion/dto/getConversations.dto.ts` — List query (status, team, page, limit)
- `src/chatIngestion/dto/updateConversation.dto.ts` — PATCH (status, assigned_team, assigned_agent)
- `src/chatIngestion/dto/conversationResponse.dto.ts` — Conversation output shape
- `src/chatIngestion/dto/chatMessageResponse.dto.ts` — Message output shape

### Services (3)
- `src/chatIngestion/interakt.service.ts` — Interakt API wrapper (native `fetch`, Basic auth, POST to `message/`)
- `src/chatIngestion/chatAi.service.ts` — Gemini 2.0 Flash summarize + classify (mirrors `emailAi.service.ts`)
- `src/chatIngestion/chatIngestion.service.ts` — Core logic: webhook processing, CRUD, reply, mark-read

### Gateway
- `src/chatIngestion/chatGateway.gateway.ts` — WebSocket `/chats` namespace (join/leave conversation rooms)

### Controllers (2)
- `src/chatIngestion/chatWebhook.controller.ts` — `POST /webhooks/interakt` (fire-and-forget)
- `src/chatIngestion/chatIngestion.controller.ts` — `ConversationsController` + `ChatMessagesController`

### Module
- `src/chatIngestion/chatIngestion.module.ts`

## Files Modified (3)
- `src/app.module.ts` — Added `ChatIngestionModule` import
- `src/main.ts` — Added Swagger tags: `conversations`, `chat-messages`
- `.env.example` — Added `INTERAKT_API_URL`, `INTERAKT_API_KEY`

## Database Schema

**conversations** — one thread per phone number
- `id` UUID PK, `phone_number` TEXT UNIQUE, `customer_name`, `status` (open/resolved/archived)
- `assigned_team`, `assigned_agent`, `last_message_at`, `unread_count`
- Indexes: status, team (partial), last_message_at DESC

**chat_messages** — messages within a conversation
- `id` UUID PK, `conversation_id` FK CASCADE, `interakt_message_id` UNIQUE (dedup key)
- `direction` (inbound/outbound), `message_type` (text/image/document/audio/video)
- `content`, `media_url`, `sender_type` (customer/agent), `sender_name`, `agent_id`
- `summary`, `suggested_team` (AI), `is_read`
- Indexes: conversation_id, interakt_message_id (partial), created_at DESC, direction

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /conversations | List (paginated, filter by status/team) |
| GET | /conversations/:id | Single conversation |
| PATCH | /conversations/:id | Update status/team/agent |
| GET | /conversations/:id/messages | Messages (chronological, paginated) |
| POST | /conversations/:id/reply | Agent reply via Interakt API |
| PATCH | /messages/:id/read | Mark read, decrement unread_count |
| POST | /webhooks/interakt | Interakt webhook receiver |

## WebSocket (`/chats` namespace)
- `new_message` — broadcast + room-targeted on new message
- `conversation_updated` — broadcast on status/team/agent change
- `join_conversation` / `leave_conversation` — client subscribes/unsubscribes

## Key Logic

### Webhook Flow
1. Return `{ status: 'ok' }` immediately (fire-and-forget)
2. Ignore non-`message_received` events
3. Dedup by `interakt_message_id`
4. Find or create conversation by phone_number (reopen if resolved)
5. AI classify first inbound of new/reopened conversation only
6. Insert message → update conversation metadata → WebSocket emit

### Agent Reply Flow
1. Fetch conversation → get phone_number
2. POST to Interakt API (Basic auth)
3. Insert outbound message → update last_message_at → WebSocket emit

## Env Vars Added
- `INTERAKT_API_URL` — default `https://api.interakt.ai/v1/public/`
- `INTERAKT_API_KEY` — Base64 API key for Basic auth header

## Testing Done
- `npm run build` — 0 errors
- `npm run start:dev` — server starts, all routes registered
- Webhook curl test — conversation created, message stored, WebSocket events fired
- Dedup test — same `interakt_message_id` ignored (message count stayed at 1)
- AI fallback works — no GEMINI_API_KEY → graceful fallback to `general` team

## Notes
- Interakt API body format: `countryCode` (+91), `phoneNumber` (without country code), `type: "Text"`, `data.message`
- AI classification shares same 7 teams as email: finance, support, dispatch, sales, technical, returns_refunds, general
- Migration must be run manually in Supabase SQL Editor (no CLI/psql connection configured)
