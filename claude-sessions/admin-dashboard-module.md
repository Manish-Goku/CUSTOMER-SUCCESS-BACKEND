# Admin Dashboard Module — Session Doc
**Date:** 2026-02-23
**Status:** Complete (read-only review)

## What Was Built
Analytics dashboard APIs for email metrics — all backed by Supabase RPC functions (server-side PostgreSQL).

## Files (5)

### DTOs
- `src/adminDashboard/dto/dashboardQuery.dto.ts` — Query input: `range` (today/7d/30d/custom), `start_date`, `end_date`, `top_senders_limit`
- `src/adminDashboard/dto/dashboardResponse.dto.ts` — Response shapes: `TeamCountDto`, `TopSenderDto`, `DailyVolumeDto`, `MailboxCountDto`, `DashboardOverviewDto`

### Service
- `src/adminDashboard/adminDashboard.service.ts` — 6 Supabase RPC wrappers + `get_overview()` that runs all 6 in parallel via `Promise.all`

### Controller
- `src/adminDashboard/adminDashboard.controller.ts` — 7 GET endpoints under `/admin/dashboard`

### Module
- `src/adminDashboard/adminDashboard.module.ts`

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /admin/dashboard/overview | All metrics combined (parallel) |
| GET | /admin/dashboard/email-volume | Total email count in range |
| GET | /admin/dashboard/emails-by-team | Grouped by AI-suggested team |
| GET | /admin/dashboard/unread-count | Unread email count |
| GET | /admin/dashboard/top-senders | Top N senders by volume |
| GET | /admin/dashboard/daily-volume | Daily trend (IST) |
| GET | /admin/dashboard/emails-by-mailbox | Per-mailbox count |

## Query Parameters
- `range`: `today` | `7d` | `30d` (default) | `custom`
- `start_date` / `end_date`: ISO 8601 (required when `range=custom`)
- `top_senders_limit`: 1-100 (default 10)

## Supabase RPC Functions Required
- `get_email_volume(start_date, end_date)` → integer
- `get_emails_by_team(start_date, end_date)` → `{ team, count }[]`
- `get_unread_count(start_date, end_date)` → integer
- `get_top_senders(start_date, end_date, sender_limit)` → `{ from_address, count }[]`
- `get_daily_volume(start_date, end_date)` → `{ date, count }[]`
- `get_emails_by_mailbox(start_date, end_date)` → `{ support_email_id, email_address, display_name, count }[]`
