# Chat Ingestion Module — Session Doc
**Date:** 2026-02-23
**Commits:**
- `7366d0c` — Add WhatsApp/Interakt chat channel with bidirectional messaging
- `1d785d7` — Fix Interakt webhook to match real payload structure

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

### Webhook Flow (handles 2 event types)

**`message_received`** — single inbound message
1. Return `{ status: 'ok' }` immediately (fire-and-forget)
2. Extract name from `data.customer.traits.name`
3. Build phone as `country_code` + `phone_number` (e.g. `+91` + `9201053157` → `919201053157`)
4. Parse `message.message` — for `InteractiveListReply`/`InteractiveButtonReply`, extract `title` from JSON; plain text otherwise
5. Map `message_content_type` → `message_type` (`Image` → `image`, `InteractiveListReply` → `text`, etc.)
6. Dedup by `interakt_message_id` → find/create conversation → AI classify → insert → WebSocket emit

**`workflow_response_update`** — bot workflow Q&A completion
1. Extract phone from `data.customer_number` (strip `+`), name from `data.customer_name`
2. Iterate `data.data[]` (Q&A steps), each answer becomes a separate `chat_messages` record
3. Dedup key: `workflow_{workflow_id}_{answer_id}`
4. First answer gets AI classification using combined Q&A text as context
5. Supports media answers (images) — `message_type: "image"` with `media_url`
6. `unread_count` incremented per answer

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
- Real `message_received` payload (Praveen, InteractiveListReply) — phone `919201053157`, name from traits, title `{Others}` extracted from JSON
- Real `workflow_response_update` payload (Shankar Yadav) — 2 answers stored (image + button reply), combined Q&A summary on first message, `unread_count: 2`
- Filters tested: `?status=open`, `?team=general` return correct results; `?status=resolved`, `?team=finance` return empty

## Notes
- Interakt sends 2 webhook types: `message_received` (direct messages) and `workflow_response_update` (bot workflow completions)
- Real payload structure differs from Interakt docs: name in `traits.name`, phone without country code, message text in `message.message` (not `message.text`), type in `message_content_type`
- Interactive message types (`InteractiveListReply`, `InteractiveButtonReply`) have JSON-encoded `message` field — we parse and extract `title`
- Interakt API body format for sending: `countryCode` (+91), `phoneNumber` (without country code), `type: "Text"`, `data.message`
- AI classification shares same 7 teams as email: finance, support, dispatch, sales, technical, returns_refunds, general
- Migration must be run manually in Supabase SQL Editor (no CLI/psql connection configured)

## Netcore Integration (added 2026-02-23)
See `netcore-integration-module.md` for full details. Added:
- `POST /webhooks/netcore` endpoint
- `NetcoreService` for outbound messages (Bearer auth)
- `channel` column on `conversations`, `external_message_id` on `chat_messages`
- `send_reply()` routes through correct provider based on conversation channel
