# Query Assignments Module — Session Doc
**Date:** 2026-02-23
**Commits:** Pending (not committed yet)

## What Was Built
Full CRUD backend + bulk assign + frontend integration for query assignments (hangup calls + chats). Replaced mock data with real Supabase.

## Backend Files Created (4)

- `src/queryAssignments/dto/queryAssignment.dto.ts` — Create, Update, Get (with search/filter/pagination), BulkAssign, Response DTOs
- `src/queryAssignments/queryAssignments.service.ts` — CRUD + bulk assign + auto-complete timestamp
- `src/queryAssignments/queryAssignments.controller.ts` — 6 endpoints under `/query-assignments`
- `src/queryAssignments/queryAssignments.module.ts`

## Backend Files Modified (2)
- `src/app.module.ts` — Added `QueryAssignmentsModule` import
- `src/main.ts` — Added Swagger tag `query-assignments`

## Frontend Files Created (1)
- `src/hooks/useQueryAssignments.ts` — Supabase hook with real-time subscription, CRUD, bulk assign, agent list fetch

## Frontend Files Modified (1)
- `src/pages/QueryAssignment.tsx` — Replaced `mockAssignments` and mock `agents` import with `useQueryAssignments()` hook, real agents from Supabase

## Database
**Table:** `query_assignments`
- `id` UUID PK, `type` TEXT (hangup/chat), `customer_phone` TEXT, `customer_name` TEXT
- `channel` TEXT, `state` TEXT, `received_at` TIMESTAMPTZ
- `status` TEXT (pending/assigned/in_progress/completed)
- `priority` TEXT (high/normal/low)
- `assigned_to` TEXT, `assigned_to_name` TEXT, `completed_at` TIMESTAMPTZ
- `created_at`, `updated_at`
- Indexes: status, type, assigned_to, received_at
- RLS enabled with permissive policy
- Seeded with 5 default items

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /query-assignments | Create assignment |
| GET | /query-assignments | List (search, type/status filter, pagination) |
| GET | /query-assignments/:id | Get single |
| PATCH | /query-assignments/:id | Update (status, priority, assigned_to) |
| DELETE | /query-assignments/:id | Delete |
| POST | /query-assignments/bulk-assign | Bulk assign pending items to agent |

## Testing (all passed)
- `tsc --noEmit` — 0 errors (both backend and frontend)
- 5 assignments seeded in Supabase
- Agents fetched from existing `agents` table (22 rows) for BulkAssignDialog
- GET all — 5 items returned
- GET ?type=hangup — 3 filtered, ?type=chat — 2 filtered
- GET ?status=pending — 3 filtered
- GET ?search=Ramesh — 1 result
- GET /:id — single item returned
- POST create — new item with auto pending status + priority
- PATCH update — status/assigned_to updated, completed_at auto-set on status=completed
- POST bulk-assign — 2 items assigned in one call
- DELETE — removed, 404 on re-fetch confirmed
