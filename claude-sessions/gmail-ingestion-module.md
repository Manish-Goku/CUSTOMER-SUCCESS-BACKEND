# Gmail Ingestion Module — Session Doc
**Date:** 2026-02-23
**Status:** Complete (read-only review)

## What Was Built
IMAP-based email monitoring system — polls Gmail mailboxes on a 1-minute cron, ingests emails into Supabase, classifies with Gemini 2.0 Flash AI, emits real-time WebSocket events.

## Files (11)

### Interfaces
- `src/common/interfaces/gmailTypes.ts` — `ParsedEmail`, `AttachmentMeta`, `SupportEmailRecord`, `EmailRecord`

### DTOs (5)
- `src/gmailIngestion/dto/addSupportEmail.dto.ts` — Add mailbox input (email_address, imap_password, display_name)
- `src/gmailIngestion/dto/updateSupportEmail.dto.ts` — PATCH (display_name, is_active, imap_password)
- `src/gmailIngestion/dto/supportEmailResponse.dto.ts` — Mailbox output shape
- `src/gmailIngestion/dto/emailResponse.dto.ts` — Email output shape
- `src/gmailIngestion/dto/getEmails.dto.ts` — List query (support_email_id, page, limit)

### Services (3)
- `src/gmailIngestion/imap.service.ts` — ImapFlow wrapper: connect, fetch new emails by UID range, parse with `mailparser`, extract addresses/attachments/thread IDs
- `src/gmailIngestion/emailAi.service.ts` — Gemini 2.0 Flash: summarize + classify into 7 teams (finance, support, dispatch, sales, technical, returns_refunds, general). Graceful fallback on failure.
- `src/gmailIngestion/emailPoll.service.ts` — Cron every 1 min: polls all active mailboxes, dedup by `message_id`, AI classify, insert to Supabase, WebSocket emit, update `last_synced_uid` cursor

### Controllers (2 in 1 file)
- `src/gmailIngestion/gmailIngestion.controller.ts`
  - `GmailIngestionController` (`/support-emails`) — CRUD + manual sync
  - `EmailsController` (`/emails`) — paginated email listing + single email

### Service
- `src/gmailIngestion/gmailIngestion.service.ts` — Core logic: support email CRUD (with encrypted IMAP passwords), manual sync trigger, email queries with pagination

### Module
- `src/gmailIngestion/gmailIngestion.module.ts`

## Database Schema

**support_emails** — monitored mailboxes
- `id` UUID PK, `email_address` TEXT UNIQUE, `display_name`, `is_active` BOOLEAN
- `imap_host`, `imap_port`, `imap_user`, `imap_password` (encrypted)
- `last_synced_uid` INT (cursor), `last_synced_at`, `created_at`, `updated_at`

**emails** — ingested emails
- `id` UUID PK, `support_email_id` FK, `message_id` TEXT UNIQUE (dedup key)
- `thread_id`, `from_address`, `from_name`, `to_addresses`, `cc_addresses`, `bcc_addresses`
- `subject`, `body_text`, `body_html`, `snippet`, `has_attachments`, `attachments` JSONB
- `internal_date`, `received_at`, `is_read`, `summary` (AI), `suggested_team` (AI)

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /support-emails | Add mailbox to monitor |
| GET | /support-emails | List all monitored mailboxes |
| GET | /support-emails/:id | Get single mailbox |
| PATCH | /support-emails/:id | Update mailbox (toggle active, change creds) |
| DELETE | /support-emails/:id | Remove mailbox, stop monitoring |
| POST | /support-emails/:id/sync | Manual IMAP sync trigger |
| GET | /emails | List emails (paginated, filter by mailbox) |
| GET | /emails/:id | Get full email details |

## Key Logic
- IMAP polling uses UID-based cursor (`last_synced_uid`) — only fetches new emails since last sync
- Passwords encrypted at rest via `common/crypto.ts` `encrypt()`/`decrypt()`
- Dedup by `message_id` header — prevents duplicate ingestion
- Thread grouping via `In-Reply-To` / `References` headers → `thread_id`
- AI classification runs per-email during ingestion; fallback to subject/general on failure
