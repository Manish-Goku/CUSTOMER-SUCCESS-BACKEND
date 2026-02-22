# CLAUDE.md — Customer Success Backend

## Project Overview
NestJS backend for Customer Success operations at Katyayani Organics.

| Stack | Detail |
|-------|--------|
| Framework | NestJS 10, TypeScript |
| Database | Supabase (PostgreSQL) |
| Port | 3002 |
| Entry | `src/main.ts` |

## Commands
```bash
npm run start:dev    # nest start --watch (hot reload)
npm run build        # nest build → dist/
npm run start:prod   # node dist/main
npm run lint         # eslint --fix
npm run test         # jest
npm run test:e2e     # e2e tests
```

## Coding Rules

### 1. Naming Conventions
- **Variables & Functions:** `snake_case`
  ```typescript
  // correct
  const user_name = 'Manish';
  function get_active_users() {}

  // wrong
  const userName = 'Manish';
  function getActiveUsers() {}
  ```
- **Files & Folders:** `camelCase`
  ```
  // correct
  src/customerTickets/customerTickets.service.ts

  // wrong
  src/customer-tickets/customer-tickets.service.ts
  src/customer_tickets/customer_tickets.service.ts
  ```
- **Classes & Interfaces:** `PascalCase` (TypeScript standard)
  ```typescript
  class CustomerTicket {}
  interface TicketResponse {}
  ```
- **Constants:** `UPPER_SNAKE_CASE`
  ```typescript
  const MAX_RETRY_COUNT = 3;
  ```
- **Enums:** `PascalCase` name, `UPPER_SNAKE_CASE` values
  ```typescript
  enum TicketStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
  }
  ```

### 2. Project Structure
```
src/
├── supabase/              # Global Supabase client module
├── <moduleName>/          # Feature modules (camelCase folders)
│   ├── <moduleName>.module.ts
│   ├── <moduleName>.controller.ts
│   ├── <moduleName>.service.ts
│   └── dto/
│       └── <dtoName>.dto.ts
├── common/                # Shared guards, pipes, interceptors
├── app.module.ts
└── main.ts
```

### 3. Code Style
- Always use `strict` TypeScript — no `any` unless absolutely unavoidable
- Use DTOs for all request/response validation
- Keep controllers thin — business logic goes in services
- One module per feature domain
- Use `@nestjs/config` for all env access — never use `process.env` directly in services

### 4. Supabase Usage
- Always use `SupabaseService.getClient()` — never create clients manually
- Handle `error` from every Supabase query — never assume success
- Use `service_role` key (server-side only) — never expose `anon` key in responses

### 5. Git
- Do not commit `.env` files
- Write concise commit messages describing the "why"
