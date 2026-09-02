# Phase 3A — D1 + Drizzle Foundation

## 1. Objective

Establish the minimum production-grade persistence foundation for Astralyn using Cloudflare D1 (SQLite) and Drizzle ORM within `@astralyn/worker` and `@astralyn/shared`.

This phase delivers:
1. Typed Cloudflare D1 environment binding in Cloudflare Worker.
2. Drizzle ORM integration with a single source of truth schema.
3. Declarative migration tooling (`drizzle-kit`) with local execution workflows and schema drift validation.
4. Minimal non-speculative foundational data model and typed repository data-access layer.
5. Worker database readiness/health probe returning truthful connectivity states without synthetic data.
6. Zero-leakage testing harness verifying database queries, constraint violations, and disconnected error states.

---

## 2. Current Verified State

The following repository facts have been directly verified under Node `v24.19.0`:

- **Monorepo & Package Structure:**
  - `apps/web`: React 19 + Vite client (100 Vitest unit/integration tests passing; 9 Playwright E2E/a11y tests passing).
  - `apps/worker`: Cloudflare Worker application (`wrangler.jsonc`, `compatibility_date: "2025-02-24"`, `compatibility_flags: ["nodejs_compat"]`, 2 health tests passing).
  - `packages/shared`: Shared TypeScript types, Zod 4 schemas, and health contracts.
  - `tools/`: Build, benchmark, asset validation, and boundary verification CLI scripts (26 unit tests passing).
- **Production Data Boundary:**
  - Zero mock fixtures, fake user rosters, or dev assets reachable from production web bundles.
  - `pnpm data:check` passes with 28 production source files and 24 reachable modules verified.
- **Game Knowledge & Asset State:**
  - Canonical knowledge release `v1.0.0` (36 canonical entities across 8 stores, Version 4.5 baseline) verified with bit-for-bit checksums and benchmark budgets met.
  - 0 production-approved game assets; 52 valid PNG candidate assets quarantined strictly under `apps/web/src/dev/game-assets/v1.0.0/` with `usageStatus: "manual_review"`.
- **Worker State:**
  - `apps/worker/src/index.ts` currently defines `interface Env { DB?: unknown; }` with a basic static `GET /api/health` route returning JSON.
  - No database dependencies (`drizzle-orm`, `drizzle-kit`) are currently installed in `package.json` or `apps/worker/package.json`.
  - `pnpm-lock.yaml` is clean and unmutated.

---

## 3. Phase Boundary

### In Scope
- Adding `drizzle-orm` to `packages/shared` and `apps/worker`.
- Adding `drizzle-kit` to root / `apps/worker` devDependencies.
- Configuring Cloudflare D1 binding (`DB`) in `apps/worker/wrangler.jsonc` and `apps/worker/src/index.ts`.
- Defining foundational Drizzle ORM schema under `packages/shared/src/db/schema.ts` (system metadata and health verification table; explicit foreign-key seam for future user tables).
- Configuring Drizzle migration pipeline (`apps/worker/drizzle.config.ts`, `apps/worker/drizzle/migrations/`).
- Implementing typed database client factory and repository access layer (`apps/worker/src/db/client.ts`).
- Implementing `/api/health` database readiness check reporting live D1 connectivity status (`connected`, `disconnected`, `unconfigured`).
- Writing migration drift validation tool (`tools/check-migrations.ts` and `pnpm db:check`).
- Adding automated tests covering database queries, transaction rollbacks, foreign-key constraints, and disconnected error states.

### Out of Scope
- Better Auth configuration, endpoints, and OAuth flows (Deferred to Phase 3B).
- User tables (`user`, `session`, `account`, `verification`) (Deferred to Phase 3B).
- User roster management and profiles (`profiles`, `user_roster`, `saved_teams`) (Deferred to Phase 4).
- Static knowledge publication to D1 (Deferred to Phase 8 ingestion pipeline).
- Frontend UI integration or roster components.
- Live OCR or recommendation engine execution.
- Downloading or modifying game visual assets.

---

## 4. Architecture

### Persistence Flow
```text
HTTP Request (e.g. GET /api/health)
      │
      ▼
Cloudflare Worker (apps/worker/src/index.ts)
      │
      ▼
Env Binding Validation (env.DB: D1Database)
      │
      ├─► [env.DB Missing/Null] ──► Truthful Disconnected State (db: "unconfigured")
      │
      ▼
Drizzle Client Factory (createDbClient(env.DB))
      │
      ▼
Typed Repository / Access Layer (apps/worker/src/db/*)
      │
      ▼
Drizzle ORM (drizzle-orm/d1)
      │
      ▼
Cloudflare D1 SQLite Engine (Parameterized Prepared Statements)
```

### Module & Package Ownership
| Package / Path | Responsibility | Boundary Rule |
| :--- | :--- | :--- |
| `packages/shared/src/db/schema.ts` | Single source of truth for Drizzle table definitions and column types | Pure schema; zero runtime DB connections or environment dependencies. |
| `packages/shared/src/db/types.ts` | Inferred TypeScript types (`SelectAppMeta`, `InsertAppMeta`) | Derived via `typeof table.$inferSelect` / `inferInsert`. |
| `apps/worker/drizzle.config.ts` | Drizzle Kit configuration pointing to shared schema and local migration output | Worker dev/build tool configuration only. |
| `apps/worker/drizzle/migrations/` | Generated versioned SQL migration files (`0000_*.sql`) | Generated exclusively via `drizzle-kit generate`. Never manually edited. |
| `apps/worker/src/db/client.ts` | Drizzle D1 client factory and typed database abstraction | Only initialized within Worker execution context with valid `D1Database`. |
| `apps/worker/src/db/health.ts` | Database ping and migration readiness verification query | Parameterized query; catches and formats D1 connection errors. |
| `tools/check-migrations.ts` | Build-time tool validating migration files match schema without uncommitted drift | CI/pre-commit gate; fails closed on schema drift. |

---

## 5. Data Model for Phase 3A

In accordance with strict production data rules, Phase 3A implements **only** the foundational infrastructure tables required to verify persistence, schema migrations, and database readiness. Speculative user and auth tables are deferred until their consuming engines are implemented.

| Table | Purpose | Why Needed Now | Deferred Relationship |
| :--- | :--- | :--- | :--- |
| `app_metadata` | Stores key-value system parameters (schema version, initialized timestamp, migration milestone). | Required to verify D1 read/write operations, migration execution, and database readiness probe. | Will store system-level flags used by future background migrations and auth version tags. |
| `system_audit_log` | Records infrastructure events (migration execution, maintenance windows, health check probes). | Proves indexed timestamp queries, auto-generated IDs, and constraint enforcement in D1. | Future admin and ingestion audit logging in Phase 8 will write to this audit domain. |

### Schema Definitions (`packages/shared/src/db/schema.ts`)
```ts
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const appMetadata = sqliteTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const systemAuditLog = sqliteTable(
  "system_audit_log",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    severity: text("severity", { enum: ["info", "warn", "error"] }).notNull().default("info"),
    detailsJson: text("details_json").notNull().default("{}"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("system_audit_log_created_at_idx").on(table.createdAt),
    index("system_audit_log_event_type_idx").on(table.eventType),
  ]
);
```

---

## 6. Technical Decisions

### Decision 1: Drizzle ORM with `drizzle-orm/d1`
- **Reasoning:** Zero runtime compilation overhead; executes directly against D1's native prepared statement API without heavy abstraction layers or node-specific binaries.
- **Existing pattern reused:** Standard Cloudflare Workers D1 architecture recommended by Cloudflare and Drizzle.
- **Alternatives rejected:** Prisma (large bundle size and cold-start penalty on Workers), Kysely (lacks first-class declarative migration generation tooling comparable to `drizzle-kit`).
- **Trade-off:** Requires separate migration tooling invocation (`drizzle-kit`) during development.

### Decision 2: Shared Schema in `@astralyn/shared` vs Worker-Only
- **Reasoning:** Schema definitions and derived inferred types (`SelectAppMeta`) can be shared across Worker route handlers, test suites, and future ingestion CLI tools without cyclic dependencies.
- **Existing pattern reused:** Pattern established by `packages/shared/src/knowledge/` and `packages/shared/src/assets.ts`.
- **Alternatives rejected:** Putting schema inside `apps/worker/src/db/schema.ts` exclusively (prevents CLI tools or shared packages from importing types without depending on `@astralyn/worker`).
- **Trade-off:** `packages/shared` adds `drizzle-orm` as a peer/direct dependency for schema declarations.

### Decision 3: No Speculative Auth Tables in Phase 3A
- **Reasoning:** Better Auth generates and manages its own exact schema contracts (`user`, `session`, `account`, `verification`). Writing manual mock auth tables in Phase 3A would create schema mismatch risks when Better Auth's Drizzle adapter is initialized in Phase 3B.
- **Existing pattern reused:** Phase 2.5 principle: zero speculative or simulated structures.
- **Alternatives rejected:** Pre-creating `user` and `session` tables from `0001_initial.sql` (high risk of schema drift against Better Auth v1.x specifications).
- **Trade-off:** Authentication persistence is explicitly deferred to Phase 3B.

---

## 7. File Map

| File | Symbol / Area | Change | Reason |
| :--- | :--- | :--- | :--- |
| [`package.json`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/package.json) | Root scripts | Add `db:generate`, `db:check`, `db:migrate:local` | Central monorepo database management commands. |
| [`packages/shared/package.json`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/packages/shared/package.json) | `dependencies` | Add `drizzle-orm` | Allows shared package to declare typed table schemas. |
| [`packages/shared/src/db/schema.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/packages/shared/src/db/schema.ts) *(New)* | `appMetadata`, `systemAuditLog` | Create table schemas | Single source of truth for D1 tables. |
| [`packages/shared/src/db/types.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/packages/shared/src/db/types.ts) *(New)* | Type exports | Export inferred types | Type-safe query and insert contracts. |
| [`packages/shared/src/db/index.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/packages/shared/src/db/index.ts) *(New)* | Barrel export | Re-export schema & types | Clean package import path `@astralyn/shared/db`. |
| [`packages/shared/src/index.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/packages/shared/src/index.ts) | Exports | Export DB namespace | Expose shared persistence contracts. |
| [`apps/worker/package.json`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/package.json) | Dependencies | Add `drizzle-orm`, `drizzle-kit` | Worker runtime ORM and migration generator. |
| [`apps/worker/wrangler.jsonc`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/wrangler.jsonc) | `d1_databases` | Add D1 binding config | Binds `env.DB` to D1 database for local/prod. |
| [`apps/worker/drizzle.config.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/drizzle.config.ts) *(New)* | Drizzle Config | Configure SQLite dialect & migration output | Governs `drizzle-kit generate`. |
| [`apps/worker/drizzle/migrations/`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/drizzle/migrations/) *(New)* | SQL Migrations | Migration files & snapshot metadata | Versioned D1 database migrations. |
| [`apps/worker/src/db/client.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/db/client.ts) *(New)* | `createDbClient`, `DatabaseClient` | Typed client factory | Creates typed Drizzle client from `env.DB`. |
| [`apps/worker/src/db/health.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/db/health.ts) *(New)* | `checkDatabaseHealth` | Health query helper | Probes D1 connectivity with explicit error status. |
| [`apps/worker/src/index.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/index.ts) | `Env`, `fetch` handler | Update `Env` typing & `/api/health` | Connects health route to live DB check. |
| [`apps/worker/test/health.test.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/test/health.test.ts) | Unit tests | Update health tests | Covers connected and disconnected DB states. |
| [`apps/worker/test/db.test.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/test/db.test.ts) *(New)* | Integration tests | Database query & constraint tests | Verifies Drizzle queries and error handling. |
| [`tools/check-migrations.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/tools/check-migrations.ts) *(New)* | CLI validation | Verify migration sync | Fails if schema changes without generated migration. |

---

## 8. Migration Strategy

1. **Source of Truth:**
   `packages/shared/src/db/schema.ts` is the single source of truth for all database tables.
2. **Generation Workflow:**
   Running `pnpm --filter @astralyn/worker db:generate` invokes `drizzle-kit generate`, which compares the schema against `apps/worker/drizzle/migrations/meta/_journal.json` and outputs a numbered migration file (e.g. `0000_fluffy_spencer.sql`).
3. **Naming and Journaling:**
   Migrations use Drizzle Kit's standard zero-padded numbering and journal metadata.
4. **Local Execution:**
   Applied locally via `wrangler d1 migrations apply astralyn-db --local --persist-to=.wrangler/state/v3`.
5. **Production Execution:**
   Applied to Cloudflare D1 via CI/CD or explicit deployment script: `wrangler d1 migrations apply astralyn-db --remote`.
6. **No Automatic Startup Migrations:**
   Workers must **never** execute raw DDL (`CREATE TABLE`, `ALTER TABLE`) inside request handlers during normal runtime. Migrations are strictly executed via Wrangler CLI before deployment.
7. **Schema Drift Prevention:**
   `tools/check-migrations.ts` runs in CI via `pnpm db:check`, verifying that running `drizzle-kit generate` produces 0 new uncommitted migration files.

---

## 9. Environment & D1 Binding

### Wrangler Configuration (`apps/worker/wrangler.jsonc`)
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "astralyn-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-02-24",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "astralyn-db",
      "database_id": "00000000-0000-0000-0000-000000000000", // Replaced with user's real D1 database_id
      "migrations_dir": "drizzle/migrations"
    }
  ],
  "observability": {
    "enabled": true
  }
}
```

### Environment Separation
- **Local Development (`--local`):** Uses SQLite instance stored in `.wrangler/state/v3/d1`. Requires zero internet connection.
- **Preview / Staging:** Dedicated preview D1 database bound in preview environment.
- **Production (`--remote`):** Dedicated production D1 database deployed on Cloudflare Global Network.

---

## 10. Implementation Tasks

### Task 1 — Add Drizzle Dependencies & Configure Monorepo
**Goal:** Add `drizzle-orm` and `drizzle-kit` to workspace packages and create root package scripts.
**Files:**
- `packages/shared/package.json`
- `apps/worker/package.json`
- `package.json`
**Changes:**
- Add `drizzle-orm` to `packages/shared` dependencies.
- Add `drizzle-orm` to `apps/worker` dependencies.
- Add `drizzle-kit` to `apps/worker` devDependencies.
- Add `db:generate`, `db:check`, `db:migrate:local` scripts in root and `apps/worker`.
**Do not:**
- Install unrelated dependencies (e.g. Prisma, Better Auth before Phase 3B).
- Modify `pnpm-lock.yaml` manually.
**Validation:** `pnpm install` succeeds and `pnpm -r typecheck` passes.
**Done when:** All packages resolve `drizzle-orm` imports without type errors.

---

### Task 2 — Define Phase 3A Drizzle Schema & Type Contracts
**Goal:** Create declarative Drizzle schema for foundational tables in `@astralyn/shared`.
**Files:**
- `packages/shared/src/db/schema.ts` (New)
- `packages/shared/src/db/types.ts` (New)
- `packages/shared/src/db/index.ts` (New)
- `packages/shared/src/index.ts`
**Changes:**
- Define `appMetadata` and `systemAuditLog` tables with primary keys, non-null constraints, default timestamps, and indexes.
- Export inferred types `AppMetadataRecord`, `SystemAuditLogRecord`, `NewAppMetadataRecord`, `NewSystemAuditLogRecord`.
- Re-export `db` module from `packages/shared/src/index.ts`.
**Do not:**
- Include speculative user tables or mock data.
- Use raw SQLite types without Drizzle helpers.
**Validation:** `pnpm --filter @astralyn/shared typecheck` passes.
**Done when:** Schema is exportable and type-safe.

---

### Task 3 — Configure Drizzle Kit & Generate Baseline Migration
**Goal:** Configure Drizzle Kit in `apps/worker` and generate migration `0000`.
**Files:**
- `apps/worker/drizzle.config.ts` (New)
- `apps/worker/drizzle/migrations/0000_*.sql` (Generated)
- `apps/worker/drizzle/migrations/meta/_journal.json` (Generated)
**Changes:**
- Create `apps/worker/drizzle.config.ts` with `dialect: "sqlite"`, `schema: "../../packages/shared/src/db/schema.ts"`, `out: "./drizzle/migrations"`.
- Run `pnpm --filter @astralyn/worker db:generate` to generate initial migration.
**Do not:**
- Hand-write SQL migration files.
- Put migrations in an un-journaled directory.
**Validation:** Migration file contains valid SQLite DDL (`CREATE TABLE app_metadata...`, `CREATE TABLE system_audit_log...`).
**Done when:** `drizzle/migrations` contains valid generated migration and journal.

---

### Task 4 — Configure Cloudflare D1 Binding in Worker
**Goal:** Add D1 binding to `wrangler.jsonc` and define strongly typed `Env` interface.
**Files:**
- `apps/worker/wrangler.jsonc`
- `apps/worker/src/index.ts`
**Changes:**
- Add `d1_databases` array to `wrangler.jsonc` with binding `DB`, database name `astralyn-db`, and `migrations_dir: "drizzle/migrations"`.
- Update `export interface Env { DB?: D1Database; }` in `apps/worker/src/index.ts`.
**Do not:**
- Hardcode real production database credentials into `wrangler.jsonc`.
- Make `env.DB` required at compile-time without handling undefined in tests.
**Validation:** `pnpm --filter @astralyn/worker typecheck` passes.
**Done when:** `Env` interface accurately types `env.DB` as `D1Database | undefined`.

---

### Task 5 — Implement Typed Drizzle Client & Database Health Helper
**Goal:** Create typed Drizzle D1 client factory and database readiness probe.
**Files:**
- `apps/worker/src/db/client.ts` (New)
- `apps/worker/src/db/health.ts` (New)
- `apps/worker/src/index.ts`
- `packages/shared/src/health.ts`
**Changes:**
- In `apps/worker/src/db/client.ts`, export `createDbClient(d1: D1Database)` returning `drizzle(d1, { schema })`.
- In `apps/worker/src/db/health.ts`, implement `checkDatabaseHealth(db?: D1Database)` probing `app_metadata` with fallback error capture.
- In `packages/shared/src/health.ts`, extend `HealthCheckResponse` with optional `database: { status: "connected" | "disconnected" | "unconfigured"; latencyMs?: number; error?: string }`.
- Update `apps/worker/src/index.ts` to call `checkDatabaseHealth(env.DB)` on `GET /api/health`.
**Do not:**
- Throw unhandled exceptions on `/api/health` when DB is disconnected; return 200/503 with explicit error metadata.
- Log raw connection secrets.
**Validation:** `pnpm --filter @astralyn/worker test` passes with updated health tests.
**Done when:** `/api/health` accurately reports database connectivity status.

---

### Task 6 — Create Build-Time Migration Drift Validator
**Goal:** Create tool enforcing that TypeScript schema and SQL migrations are 100% in sync.
**Files:**
- `tools/check-migrations.ts` (New)
- `package.json`
**Changes:**
- Implement `tools/check-migrations.ts` that checks whether `drizzle-kit generate` produces pending uncommitted migrations.
- Add `pnpm db:check` script to root `package.json`.
- Add `pnpm db:check` to root `pnpm test` sequence.
**Do not:**
- Allow CI to pass when schema is modified without running `db:generate`.
**Validation:** `pnpm db:check` passes with exit code 0.
**Done when:** Drift validator detects any modified schema column without migration.

---

### Task 7 — Add Database Integration & Error Handling Tests
**Goal:** Implement comprehensive test suite covering D1 queries, constraints, and failure modes.
**Files:**
- `apps/worker/test/db.test.ts` (New)
- `apps/worker/test/health.test.ts`
**Changes:**
- Add tests in `apps/worker/test/db.test.ts` validating:
  1. Inserting and querying `app_metadata` rows.
  2. Inserting and querying `system_audit_log` rows with JSON details and indexed filtering.
  3. Unique constraint enforcement on primary keys.
  4. Non-null column constraint enforcement.
  5. Error propagation when database query fails.
  6. Empty database behavior (returns empty arrays / null, never synthesizes rows).
- Update `apps/worker/test/health.test.ts` to test unconfigured, connected, and disconnected DB states.
**Do not:**
- Insert fake user accounts or mock game data in database tests.
**Validation:** `pnpm --filter @astralyn/worker test` passes 100%.
**Done when:** Full worker test suite passes with 0 failures.

---

### Task 8 — End-to-End Workspace Closure Verification
**Goal:** Re-verify all project quality gates and ensure zero regressions across web, worker, and tools.
**Files:** None (Execution & Verification only).
**Changes:** Run complete monorepo verification pipeline under Node 24.19.x.
**Validation Commands:**
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm db:check`
- `pnpm data:check`
- `pnpm assets:check`
- `pnpm knowledge:check`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
**Done when:** All commands return exit code 0.

---

## 11. Test Matrix

| Scenario | Test Location | Expected Behavior |
| :--- | :--- | :--- |
| **DB Unconfigured (`env.DB = undefined`)** | `apps/worker/test/health.test.ts` | `/api/health` returns `ok: true`, `database.status: "unconfigured"`. |
| **DB Connected & Healthy** | `apps/worker/test/health.test.ts` | `/api/health` returns `ok: true`, `database.status: "connected"`, `latencyMs > 0`. |
| **DB Error / Connection Failure** | `apps/worker/test/health.test.ts` | `/api/health` returns `ok: false` or `database.status: "disconnected"`, `database.error` populated. |
| **Empty Database Query** | `apps/worker/test/db.test.ts` | `SELECT` on empty table returns `[]` or `null`; zero synthetic rows. |
| **Typed Insert & Read** | `apps/worker/test/db.test.ts` | Row inserted via Drizzle matches expected types and values bit-for-bit. |
| **Primary Key Collision** | `apps/worker/test/db.test.ts` | Duplicate insert on `app_metadata.key` throws unique constraint error. |
| **Non-Null Constraint Violation** | `apps/worker/test/db.test.ts` | Inserting null into required column throws SQLite constraint exception. |
| **Migration Drift Check** | `tools/check-migrations.ts` | Exits 0 when schema matches migration files; exits 1 on uncommitted drift. |

---

## 12. Security / Integrity

1. **SQL Parameterization:**
   All queries generated by Drizzle ORM compile to prepared statements with bound parameters (`?`). No raw SQL string concatenation is permitted.
2. **Worker-Only Access:**
   The D1 binding (`env.DB`) is accessible exclusively within Cloudflare Worker execution context. Browser clients have zero direct D1 credentials or network visibility to the database.
3. **Migration Immutability:**
   Generated migration files are version-controlled in Git. Migrations are never generated or modified dynamically at runtime.
4. **No Secret Logging:**
   Health checks and error handlers log sanitized error messages and never print connection strings, session tokens, or API keys.
5. **Future User Isolation Seam:**
   The persistence foundation enforces that all future user-owned tables will require a non-nullable `user_id` foreign key bound to the verified `session.user.id` in Worker middleware.

---

## 13. Production Data Rules

Phase 3A strictly adheres to the Astralyn Production Data Readiness invariants established in Phase 2.5:

- **No Fake Production Users:** The database must never contain synthetic or placeholder user records (`user_001`, `demo_user`).
- **No Seed Accounts or Rosters:** Production database starts completely empty.
- **Empty Database is Valid:** All repository methods must handle 0-row results truthfully, returning empty arrays (`[]`) or `null` without synthesizing fallback data.
- **Isolated Test Fixtures:** Any test database records must exist only within ephemeral in-memory test databases and be discarded immediately after test execution.

---

## 14. Validation Sequence

The executor must run the following exact commands in strict sequence under Node `24.19.x`:

```powershell
$env:PATH = "C:\Users\Hafizh Rizqullah\.nodejs\node-v24.19.0-win-x64;" + $env:PATH
node --version # Must be v24.19.0

# 1. Monorepo code style
pnpm format:check

# 2. Static analysis
pnpm lint

# 3. TypeScript compilation across all 3 packages
pnpm typecheck

# 4. Database migration drift check
pnpm db:check

# 5. Production data boundary verification
pnpm data:check

# 6. Asset pipeline integrity check
pnpm assets:check

# 7. Knowledge release verification
pnpm knowledge:check

# 8. Full unit & integration test suites
pnpm test

# 9. Production build verification
pnpm build

# 10. Playwright E2E & WCAG 2.2 AA accessibility suite
pnpm test:e2e
```

---

## 15. Manual Actions / Gates

Before executing production deployments or testing with remote Cloudflare D1 databases, the following manual steps are required:

### Manual Gate 1: Create Cloudflare D1 Database
Execute via Cloudflare Dashboard or Wrangler CLI:
```bash
npx wrangler d1 create astralyn-db
```
**Output required:** Note the generated `database_id` (UUID format).

### Manual Gate 2: Update `wrangler.jsonc` Database ID
In `apps/worker/wrangler.jsonc`, replace placeholder `database_id` with the real UUID generated in Gate 1:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "astralyn-db",
    "database_id": "<REAL_DATABASE_ID_FROM_GATE_1>",
    "migrations_dir": "drizzle/migrations"
  }
]
```

### Manual Gate 3: Apply Production Migrations
When deploying to Cloudflare, execute:
```bash
npx wrangler d1 migrations apply astralyn-db --remote
```

*Note: For local development and automated testing (`pnpm test`, `wrangler dev`), Cloudflare D1 runs in local SQLite emulation (`--local`) and does not require active Cloudflare credentials.*

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Schema Drift between Drizzle and SQL Migrations** | Deployment failure or runtime SQL error in production D1. | `tools/check-migrations.ts` runs on every `pnpm test` and CI build, failing if schema and migrations diverge. |
| **Worker Cold-Start Latency from ORM Initialization** | Slow first-request response times on edge workers. | Drizzle ORM client is lightweight and instantiated per-request or cached in execution context with zero schema compilation latency. |
| **D1 Concurrent Write Locking** | SQLite write serialization bottlenecks during high write concurrency. | MVP architecture is client-cached and read-heavy; writes occur only during user onboarding and settings saves. |

---

## 17. Deferred Findings

The following capabilities are intentionally deferred to subsequent roadmap phases:
- **Phase 3B:** Better Auth configuration, Google OAuth credentials, session cookies, and authorization middleware (`session.user.id`).
- **Phase 4:** User profile persistence (`profiles`), roster ownership (`user_roster`), and saved team management (`saved_teams`).
- **Phase 5:** Recommendation scoring rules and multi-source consensus calculation.
- **Phase 7:** PaddleOCR.js client pipeline and Divergent Universe interactive guidance.
- **Phase 8:** Upstream HoYoLAB automated ingestion and D1 canonical snapshot publishing.

---

## 18. Definition of Done

- [ ] `drizzle-orm` and `drizzle-kit` installed in `@astralyn/shared` and `@astralyn/worker`.
- [ ] Single source of truth schema defined under `packages/shared/src/db/schema.ts` (`appMetadata`, `systemAuditLog`).
- [ ] Initial migration `0000_*.sql` generated via `drizzle-kit` and version-controlled.
- [ ] `wrangler.jsonc` configured with D1 binding `DB` and `migrations_dir`.
- [ ] Typed database client factory `createDbClient(env.DB)` implemented in `apps/worker/src/db/client.ts`.
- [ ] `/api/health` enhanced with live D1 connectivity probe reporting truthful status (`connected`, `disconnected`, `unconfigured`).
- [ ] `tools/check-migrations.ts` and `pnpm db:check` script implemented and passing.
- [ ] Unit and integration tests in `apps/worker/test/` passing for all scenarios in the Test Matrix.
- [ ] Zero mock user records, fake rosters, or synthetic seed data in production code or migrations.
- [ ] All verification commands in Section 14 return exit code 0 under Node `24.19.0`.

---

## 19. Executor Handoff

- **Target Executor:** Gemini 3.7 Flash High
- **Files to read first:**
  1. `docs/internal/PHASE-3A-D1-DRIZZLE-FOUNDATION.md` (this plan)
  2. `apps/worker/package.json` and `apps/worker/wrangler.jsonc`
  3. `apps/worker/src/index.ts`
  4. `packages/shared/src/index.ts`
- **Execution Rules:**
  - Execute Task 1 through Task 8 in strict sequence.
  - Run Node `24.19.0` via `$env:PATH = "C:\Users\Hafizh Rizqullah\.nodejs\node-v24.19.0-win-x64;" + $env:PATH`.
  - Do not implement Better Auth, OAuth, or user tables in Phase 3A.
  - Do not fabricate production seed rows or test accounts.
  - Stop and report immediately if any gate fails.
