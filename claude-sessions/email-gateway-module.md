# Email Gateway Module — Session Doc
**Date:** 2026-02-23
**Status:** Complete (read-only review)

## What Was Built
Global WebSocket gateway on `/emails` namespace for real-time email notifications to the frontend dashboard.

## Files (2)

- `src/emailGateway/emailGateway.gateway.ts` — WebSocket gateway (socket.io, CORS: *)
- `src/emailGateway/emailGateway.module.ts` — Global module (exported to all modules)

## WebSocket Events

### Server → Client
- `new_email` — broadcast to all connected clients on new email ingestion
- `new_email` (room-targeted) — emitted to `inbox_{support_email_id}` room

### Client → Server
- `join_inbox` — subscribe to a mailbox room (`{ support_email_id }`)
- `leave_inbox` — unsubscribe from a mailbox room

## Key Details
- `@Global()` module — injected into `GmailIngestionModule` without explicit import
- Used by `EmailPollService` to emit events after email ingestion
- Namespace: `/emails`
- Room pattern: `inbox_{support_email_id}`
