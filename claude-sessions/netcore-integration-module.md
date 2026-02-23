# Netcore WhatsApp Integration — Session Doc
**Date:** 2026-02-23

## What Was Built
Added Netcore Cloud as a second WhatsApp provider alongside Interakt. Both channels funnel through the same shared `ingest_inbound_message()` pipeline — dedup, conversation management, AI classification, WebSocket emit.

## DB Migration
- `conversations` → added `channel` column (text, default 'interakt')
- `chat_messages` → added `external_message_id` column (text, indexed) for provider-agnostic dedup
- Backfilled `external_message_id` from `interakt_message_id` for existing rows

## Files Created
- `src/chatIngestion/dto/netcoreWebhook.dto.ts` — DTO for Netcore `incoming_message[]` payload (text, image, document types)
- `src/chatIngestion/netcore.service.ts` — Outbound send via Netcore API (Bearer auth), graceful fallback when credentials not set

## Files Modified
- `src/chatIngestion/chatWebhook.controller.ts` — Added `POST /webhooks/netcore` endpoint (fire-and-forget pattern)
- `src/chatIngestion/chatIngestion.service.ts` — Added `process_netcore_webhook()`, updated `ingest_inbound_message()` to accept `channel` + `external_message_id`, updated `send_reply()` to route through correct provider based on conversation channel
- `src/chatIngestion/chatIngestion.module.ts` — Registered `NetcoreService` provider
- `src/common/interfaces/chatTypes.ts` — Added `channel` to ConversationRecord, `external_message_id` to ChatMessageRecord
- `.env.example` — Added `NETCORE_API_URL`, `NETCORE_API_KEY`

## Netcore Webhook Payload
```json
{
  "incoming_message": [{
    "from": "919201053157",
    "from_name": "Customer Name",
    "message_id": "wamid.XXXX",
    "message_type": "text",
    "text_type": { "text": "Message content" },
    "to": "912249757556"
  }]
}
```

## Netcore Send API
- URL: `https://waapi.pepipost.com/api/v2/message/` (configurable via NETCORE_API_URL)
- Auth: `Authorization: Bearer <NETCORE_API_KEY>`
- Body: WhatsApp Cloud API format (messaging_product, recipient_type, to, type, text.body)

## Key Design Decisions
- Same conversation per phone_number regardless of channel — customer gets one thread
- New conversations created from Netcore get `channel='netcore'`, `send_reply()` uses this to pick the provider
- Dedup checks both `external_message_id` and `interakt_message_id` columns (OR query)
- NetcoreService uses `get()` with defaults instead of `getOrThrow()` — server starts even without Netcore credentials

## Testing
- `tsc --noEmit` — 0 errors
- POST /webhooks/netcore: text message → conversation created (channel=netcore), message inserted, WebSocket events emitted
- Dedup: same message_id sent twice → second ignored
- Image message: media_url + caption correctly extracted
- Existing Interakt conversation reused when same phone_number messages from Netcore
- Test data cleaned up after verification

## Webhook URL for Netcore Dashboard
`POST https://<your-domain>/webhooks/netcore` — no auth required
