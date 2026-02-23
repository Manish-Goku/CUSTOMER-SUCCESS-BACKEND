# Agent Pages Module — Session Doc
**Date:** 2026-02-23
**Commits:** Pending (not committed yet)

## What Was Built
Wired 5 agent workspace pages to real Supabase data. Frontend-only hooks (no backend endpoints needed — reads existing tables directly).

## Data Sources
- `ivr_calls` table (10 rows) → AgentCalls, AgentHangups, AgentSLABreach, AgentCompleted
- `conversations` + `chat_messages` tables (3 + 4 rows) → AgentChats
- Data enrichment: marked 2 hangups as SLA breached, assigned agents to hangups, added resolution/sentiment to completed calls

## Frontend Files Created (5 hooks)
- `src/hooks/useAgentCalls.ts` — Fetches non-hangup ivr_calls, maps status (waiting→assigned, active→active, completed→resolved), calculates wait time
- `src/hooks/useAgentChats.ts` — Fetches conversations + last message per chat, maps status, includes fetch_messages() for chat window
- `src/hooks/useAgentHangups.ts` — Fetches hangup ivr_calls, maps status by attempts count (0→assigned, 1-2→in_progress, 3+→not_responded), includes update_hangup()
- `src/hooks/useAgentSLABreaches.ts` — Fetches is_sla_breached=true ivr_calls, calculates breach time
- `src/hooks/useAgentCompleted.ts` — Fetches completed ivr_calls, maps duration/sentiment/resolution

## Frontend Files Modified (5 pages)
- `src/pages/agent/AgentCalls.tsx` — Replaced mockCalls with useAgentCalls(), added refresh on call end
- `src/pages/agent/AgentChats.tsx` — Replaced mockChats+mockMessages with useAgentChats(), wired fetch_messages on chat select
- `src/pages/agent/AgentHangups.tsx` — Replaced mockHangups with useAgentHangups(), wired update_hangup for attempts/resolve
- `src/pages/agent/AgentSLABreach.tsx` — Replaced mockBreaches with useAgentSLABreaches()
- `src/pages/agent/AgentCompleted.tsx` — Replaced mockCompleted with useAgentCompleted()

## Key Design Decisions
- All hooks have real-time subscriptions via `postgres_changes`
- No auth/agent filtering yet (all data visible) — ready to add agent_id filter when auth is implemented
- AgentHangups writes back to ivr_calls (attempts increment, status changes)
- AgentChats loads messages on-demand per conversation (not all at once)

## Testing
- `tsc --noEmit` — 0 errors
- Existing seeded data: 2 active calls, 5 hangups (2 SLA breached), 3 completed, 3 conversations with messages
