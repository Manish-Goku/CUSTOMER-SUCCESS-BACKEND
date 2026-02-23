# Customer Success Backend

NestJS backend for Customer Success operations at Katyayani Organics. Ingests customer communications (email, WhatsApp), classifies them with AI, and provides a unified dashboard for support teams.

## Stack

| Component | Technology |
|-----------|------------|
| Framework | NestJS 11, TypeScript |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini 2.0 Flash |
| Real-time | Socket.io (WebSocket) |
| Port | 3002 |

## Modules

### Gmail Ingestion
Monitors Gmail/Workspace mailboxes via Pub/Sub push notifications. Ingests emails, summarizes with Gemini AI, and classifies to teams.

- **Routes:** `/support-emails`, `/emails`, `/webhooks/gmail`
- **WebSocket:** `/emails` namespace

### Chat Ingestion (WhatsApp/Interakt)
Bidirectional WhatsApp messaging via Interakt. Receives inbound messages via webhook, classifies with AI, and lets agents reply from dashboard. Conversations threaded by phone number.

- **Routes:** `/conversations`, `/messages`, `/webhooks/interakt`
- **WebSocket:** `/chats` namespace

### Admin Dashboard
Analytics endpoints for email volume, team distribution, top senders, daily trends, and mailbox breakdown. Powered by PostgreSQL RPC functions.

- **Routes:** `/admin/dashboard/*`

## Setup

```bash
npm install
cp .env.example .env   # fill in values
npm run start:dev       # http://localhost:3002
```

## Commands

```bash
npm run start:dev    # nest start --watch (hot reload)
npm run build        # nest build -> dist/
npm run start:prod   # node dist/main
npm run lint         # eslint --fix
npm run test         # jest
```

## API Docs

Swagger UI available at `/api/docs` when server is running.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Gmail API service account |
| `GOOGLE_PRIVATE_KEY` | Service account private key |
| `GMAIL_PUBSUB_TOPIC` | Pub/Sub topic for Gmail push |
| `APP_PUBLIC_URL` | Public URL for Pub/Sub push endpoint |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `INTERAKT_API_URL` | Interakt API base URL |
| `INTERAKT_API_KEY` | Interakt API key (Basic auth) |

## Database Migrations

SQL files in `supabase/migrations/` — run in Supabase SQL Editor in order:

1. `001_create_tables.sql` — support_emails, emails
2. `002_add_ai_columns.sql` — summary, suggested_team on emails
3. `003_dashboard_rpc_functions.sql` — analytics RPC functions
4. `004_chat_tables.sql` — conversations, chat_messages
