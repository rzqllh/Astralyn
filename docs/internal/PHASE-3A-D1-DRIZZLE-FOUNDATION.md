# Phase 3A — D1 + Drizzle Foundation

## 1. Objective

Establish the minimum production-grade persistence foundation for Astralyn using Cloudflare D1 (SQLite) and Drizzle ORM within `@astralyn/worker`.

This phase delivers:
1. Typed Cloudflare D1 environment binding in Cloudflare Worker (`@astralyn/worker`).
2. Drizzle ORM integration owned entirely within `@astralyn/worker`, keeping `@astralyn/shared` and `@astralyn/web` decoupled from database ORM dependencies.
3. Declarative migration tooling (`drizzle-kit`) with a valid empty schema baseline (`0` production application tables), empirical migration layout detection, and zero-drift verification.
4. Single migration authority architecture (Drizzle generates SQL; Wrangler applies and tracks migration history in D1 when migrations exist).
5. Typed database client factory and read-only `/api/health` connectivity probe (`SELECT 1`) with strict readiness semantics (HTTP 200 when connected, HTTP 503 when unconfigured or disconnected).
6. Zero-leakage testing harness verifying database connectivity, error propagation, and disconnected states in local emulation.

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

## 3. Analysis of Existing SQL Artifact (`docs/d1/migrations/0001_initial.sql`)

### Classification: Documentation & Specification Artifact Only
`docs/d1/migrations/0001_initial.sql` was created during initial architectural design (August 2026) as a comprehensive database design reference.
- **Runtime Chain Status:** **No repository evidence identifies this file as part of the active runtime migration chain.**
- **Runtime Authority:** **NOT AUTHORITATIVE.** This file is a static specification artifact and must **NOT** be treated as a runtime migration file.
- **Tables Defined (28 total):**
  1. *Better Auth Domain (4 tables):* `user`, `session`, `account`, `verification`.
  2. *User Domain (5 tables):* `profiles`, `game_characters`, `user_roster`, `saved_teams`, `saved_team_members`.
  3. *Canonical Knowledge Mirror (11 tables):* `game_versions`, `knowledge_releases`, `character_knowledge`, `game_light_cones`, `light_cone_knowledge`, `game_relic_sets`, `relic_set_knowledge`, `game_enemies`, `enemy_knowledge`, `game_stages`, `stage_knowledge`.
  4. *Divergent Universe Domain (2 tables):* `du_entities`, `du_entity_knowledge`.
  5. *Provenance & Ingestion Snapshots (3 tables):* `knowledge_sources`, `source_snapshots`, `fact_provenance`.
  6. *Editorial & Consensus Domain (3 tables):* `recommendation_sets`, `recommendation_items`, `consensus_results`.

### Phase Allocation & Boundary Rule
- **Phase 3A Production Application Tables:** **0**. No application table is created before Phase 3B/4.
- **Phase 3B (Better Auth):** Better Auth will generate its own exact Drizzle schema for `user`, `session`, `account`, and `verification`.
- **Phase 4 (Roster & Onboarding):** `profiles`, `user_roster`, `saved_teams`, `saved_team_members`.
- **Phase 5 (Recommendation Engine):** `recommendation_sets`, `recommendation_items`, `consensus_results`.
- **Phase 7 (DU Assistant):** `du_entities`, `du_entity_knowledge`.
- **Phase 8 (Canonical Knowledge Ingestion):** `game_*`, `*_knowledge`, `knowledge_sources`, `source_snapshots`, `fact_provenance`.

**Rule:** Phase 3A runtime migrations are generated strictly by `drizzle-kit generate` from `apps/worker/src/db/schema.ts`. Only tables genuinely required by active runtime features may enter the migration chain.

---

## 4. Phase Boundary

### In Scope
- Adding `drizzle-orm` as a runtime dependency to `apps/worker/package.json`.
- Adding `drizzle-kit` as a devDependency to `apps/worker/package.json`.
- Defining baseline Drizzle ORM schema file under `apps/worker/src/db/schema.ts` (established as the runtime source of truth, exporting 0 application tables for Phase 3A).
- Configuring Drizzle migration pipeline (`apps/worker/drizzle.config.ts`, `apps/worker/drizzle/migrations/`) and detecting migration layout.
- Configuring Cloudflare D1 binding in `apps/worker/wrangler.jsonc` and `apps/worker/src/index.ts` using real `database_id` from manual gate.
- Implementing typed database client factory (`apps/worker/src/db/client.ts`).
- Implementing read-only `/api/health` database readiness probe (`SELECT 1`) with strict readiness semantics (HTTP 200 when connected, HTTP 503 when unconfigured or disconnected).
- Writing migration drift validation tool (`tools/check-migrations.ts` and `pnpm db:check`) supporting clean zero-migration state.
- Adding automated tests covering database readiness probes, client initialization, query error propagation, and disconnected error states in local emulation.

### Out of Scope
- Adding `drizzle-orm` to `packages/shared` (Strictly decoupled).
- Creating temporary or speculative production tables (`app_metadata`, `system_audit_log`, `user`, `session`).
- Generating artificial or empty SQL migrations when no schema delta exists.
- Better Auth configuration, endpoints, and OAuth flows (Deferred to Phase 3B).
- User tables (`user`, `session`, `account`, `verification`) (Deferred to Phase 3B).
- User roster management and profiles (`profiles`, `user_roster`, `saved_teams`) (Deferred to Phase 4).
- Static knowledge publication to D1 (Deferred to Phase 8 ingestion pipeline).
- Frontend UI integration or roster components.
- Live OCR or recommendation engine execution.
- Downloading or modifying game visual assets.

---

## 5. Architecture & Drizzle Ownership

### Persistence Flow
```text
HTTP Request (GET /api/health)
      │
      ▼
Cloudflare Worker (apps/worker/src/index.ts)
      │
      ▼
Env Binding Validation (env.DB: D1Database)
      │
      ├─► [env.DB Missing/Null] ──► HTTP 503 (ok: false, db: "unconfigured")
      │
      ▼
Drizzle Client Factory (apps/worker/src/db/client.ts -> createDbClient(env.DB))
      │
      ▼
Read-Only Health Probe (apps/worker/src/db/health.ts -> sql`SELECT 1 as ready`)
      │
      ├─► [Query Success]       ──► HTTP 200 (ok: true, db: "connected", latencyMs)
      │
      └─► [Query Failure/Error] ──► HTTP 503 (ok: false, db: "disconnected", error)
```

### Readiness & Health Semantics
Once D1 is configured as required Phase 3A infrastructure:
- **Connected & Healthy:** HTTP `200 OK`, `{ ok: true, database: { status: "connected", latencyMs: number } }`.
- **Binding Missing / Unconfigured:** HTTP `503 Service Unavailable`, `{ ok: false, database: { status: "unconfigured" } }`.
- **Query Execution Failure / Disconnected:** HTTP `503 Service Unavailable`, `{ ok: false, database: { status: "disconnected", error: string } }`.

### Module & Package Ownership
| Package / Path | Responsibility | Boundary Rule |
| :--- | :--- | :--- |
| `apps/worker/src/db/schema.ts` | Single source of truth for D1 Drizzle table definitions (0 application tables in Phase 3A) | Worker-owned; pure schema definitions. |
| `apps/worker/src/db/client.ts` | Drizzle D1 client factory and typed database abstraction | Only initialized within Worker execution context with valid `D1Database`. |
| `apps/worker/src/db/health.ts` | Database ping and readiness verification probe (`SELECT 1`) | Read-only parameterized query; zero table dependencies; catches and formats D1 connection errors. |
| `apps/worker/drizzle.config.ts` | Drizzle Kit configuration pointing to Worker schema and migration output | Worker dev/build tool configuration only. |
| `apps/worker/drizzle/migrations/` | Generated versioned SQL migration directory | Empty in Phase 3A until real application tables are defined in Phase 3B+. |
| `packages/shared/src/health.ts` | Database-agnostic health check contract (`HealthCheckResponse`) | Clean TypeScript interface; zero ORM dependencies. |
| `tools/check-migrations.ts` | Build-time tool validating migration files match schema without uncommitted drift | CI/pre-commit gate; passes on clean zero-migration state; ignores `docs/d1/**`. |

### Architectural Decoupling Rationale
`packages/shared` remains 100% free of database ORM dependencies (`drizzle-orm`). Database persistence is a backend Worker concern. Shared packages only export domain types and API wire contracts.

---

## 6. Single Migration Authority

Astralyn adopts a strict single-authority migration pipeline:

```text
Drizzle TypeScript Schema (apps/worker/src/db/schema.ts)
      │
      ▼ (pnpm --filter @astralyn/worker db:generate)
drizzle-kit generate (Evaluates schema delta against meta journal)
      │
      ▼
Committed SQL Migration Files (apps/worker/drizzle/migrations/*.sql - populated when tables exist)
      │
      ▼ (pnpm --filter @astralyn/worker exec wrangler d1 migrations apply astralyn-db --local / --remote)
Wrangler D1 CLI
      │
      ▼
Cloudflare D1 Database (Tracks applied state in d1_migrations table)
```

### Decision Rules:
1. **Drizzle Kit generates SQL:** Drizzle Kit acts purely as an offline compiler converting TypeScript table definitions into versioned `.sql` files with journal metadata (`meta/_journal.json`).
2. **Zero Delta Behavior:** When `apps/worker/src/db/schema.ts` defines 0 tables and no migration history exists, `drizzle-kit generate` produces no new SQL files. This is a valid, clean baseline state.
3. **Migration Layout Detection:** During Task 3 execution, inspect the actual layout generated by the repository-pinned `drizzle-kit` version. Task 4 will configure `migrations_dir` (and `migrations_pattern` if necessary) based on the proven layout.
4. **Wrangler applies and owns migration state:** Cloudflare Wrangler manages the D1 execution lifecycle and maintains the `d1_migrations` table in D1.
5. **Never mix migration runners:** `drizzle-kit migrate` is **FORBIDDEN** on Astralyn databases to eliminate dual-journaling conflicts and state desynchronization.

---

## 7. Data Model for Phase 3A

In accordance with strict production data rules, Phase 3A implements **zero** application tables.

| Table | Phase 3A Status | Rationale |
| :--- | :--- | :--- |
| *(None)* | **0 Tables** | A production table may exist only if current Phase 3A runtime behavior genuinely requires persisted application data. An empty production database is the correct state before Phase 3B/4. |

### Schema Baseline (`apps/worker/src/db/schema.ts`)
```ts
// apps/worker/src/db/schema.ts
// Single source of truth for Cloudflare D1 Drizzle schema.
// Phase 3A establishes the persistence foundation with 0 application tables.
// Production user tables are added in Phase 3B (Better Auth) and Phase 4 (Roster).

export {};
```

---

## 8. Technical Decisions

### Decision 1: Drizzle ORM with `drizzle-orm/d1` inside `@astralyn/worker`
- **Reasoning:** Zero runtime compilation overhead; executes directly against D1's native prepared statement API without heavy abstraction layers or node-specific binaries. Keeping it in `@astralyn/worker` prevents ORM leakage into shared or web packages.
- **Existing pattern reused:** Standard Cloudflare Workers D1 architecture recommended by Cloudflare and Drizzle.
- **Alternatives rejected:** Prisma (large bundle size and cold-start penalty on Workers), Kysely (lacks declarative migration generation tooling comparable to `drizzle-kit`).
- **Trade-off:** Requires separate migration generation invocation (`drizzle-kit generate`) during development.

### Decision 2: Single Migration Authority (Drizzle Generate + Wrangler Apply)
- **Reasoning:** Cloudflare D1 has first-class migration tracking built into Wrangler (`d1_migrations`). Using Wrangler to apply SQL ensures parity between local emulation (`--local`) and remote Cloudflare environments (`--remote`).
- **Existing pattern reused:** Cloudflare Workers official persistence workflow.
- **Alternatives rejected:** `drizzle-kit migrate` (bypasses Wrangler D1 state tracking and causes migration desync).
- **Trade-off:** Migration directory must match Wrangler's expected layout (`drizzle/migrations`).

### Decision 3: Zero Speculative Tables in Phase 3A
- **Reasoning:** No application tables are created solely to test D1 connectivity, indexes, auto-generated IDs, or constraints. Database readiness is verified using a table-independent query (`SELECT 1`). Better Auth (Phase 3B) and Roster (Phase 4) will introduce real, necessary tables.
- **Existing pattern reused:** Phase 2.5 principle: zero speculative or simulated structures.
- **Alternatives rejected:** Pre-creating `app_metadata` or `user` tables (unnecessary maintenance overhead and speculative schema risk).
- **Trade-off:** Production database begins with 0 tables.

---

## 9. File Map

| File | Symbol / Area | Change | Reason |
| :--- | :--- | :--- | :--- |
| [`package.json`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/package.json) | Root scripts | Add `db:generate`, `db:check`, `db:migrate:local` | Central monorepo database management commands delegating to worker package. |
| [`apps/worker/package.json`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/package.json) | Dependencies | Add `drizzle-orm` to dependencies; `drizzle-kit` to devDependencies | Worker runtime ORM and migration generator. |
| [`apps/worker/wrangler.jsonc`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/wrangler.jsonc) | `d1_databases` | Add D1 binding config with real `database_id` | Binds `env.DB` to D1 database for local/prod. |
| [`apps/worker/drizzle.config.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/drizzle.config.ts) *(New)* | Drizzle Config | Configure SQLite dialect & migration output | Governs `drizzle-kit generate`. |
| [`apps/worker/src/db/schema.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/db/schema.ts) *(New)* | Schema baseline | Create empty schema baseline | Single source of truth for D1 tables (0 application tables in Phase 3A). |
| [`apps/worker/src/db/client.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/db/client.ts) *(New)* | `createDbClient`, `DatabaseClient` | Typed client factory | Creates typed Drizzle client from `env.DB`. |
| [`apps/worker/src/db/health.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/db/health.ts) *(New)* | `checkDatabaseHealth` | Health query helper (`SELECT 1`) | Probes D1 connectivity with explicit error status; read-only. |
| [`apps/worker/src/db/index.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/db/index.ts) *(New)* | Barrel export | Re-export schema, client, and health helpers | Internal Worker DB interface. |
| [`apps/worker/drizzle/migrations/`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/drizzle/migrations/) *(New)* | SQL Migrations | Directory baseline | Versioned D1 database migrations (empty in Phase 3A). |
| [`apps/worker/src/index.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/src/index.ts) | `Env`, `fetch` handler | Update `Env` typing & `/api/health` | Connects health route to live DB check with 200/503 semantics. |
| [`packages/shared/src/health.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/packages/shared/src/health.ts) | `HealthCheckResponse` | Add optional database status typing | Database-independent health wire contract. |
| [`apps/worker/test/health.test.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/test/health.test.ts) | Unit tests | Update health tests | Covers connected (200), disconnected (503), and unconfigured (503) DB states. |
| [`apps/worker/test/db.test.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/apps/worker/test/db.test.ts) *(New)* | Integration tests | Client initialization & error handling | Verifies Drizzle client factory and error capture in local emulation. |
| [`tools/check-migrations.ts`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/tools/check-migrations.ts) *(New)* | CLI validation | Verify migration sync | Validates zero-drift; ignores `docs/d1/**`. |

---

## 10. Migration Strategy & Safety

1. **Source of Truth:**
   `apps/worker/src/db/schema.ts` is the single source of truth for all database tables.
2. **Generation Workflow:**
   Running `pnpm --filter @astralyn/worker db:generate` invokes `drizzle-kit generate`. With 0 tables defined in Phase 3A, it completes cleanly without generating unneeded SQL files.
3. **Local Execution (Repository Controlled):**
   When migrations exist in future phases: `pnpm --filter @astralyn/worker exec wrangler d1 migrations apply astralyn-db --local --persist-to=.wrangler/state/v3`.
4. **Production Execution (Manual Gate):**
   When migrations exist in future phases: `pnpm --filter @astralyn/worker exec wrangler d1 migrations apply astralyn-db --remote`.
5. **No Automatic Startup Migrations:**
   Workers must **never** execute raw DDL (`CREATE TABLE`, `ALTER TABLE`) inside request handlers during normal runtime. Migrations are strictly executed via Wrangler CLI before deployment.
6. **Schema Drift Prevention:**
   `tools/check-migrations.ts` runs in CI via `pnpm db:check`, verifying that:
   - Clean schema with no migration required $\rightarrow$ **PASS**.
   - Schema changed but generated migration missing $\rightarrow$ **FAIL**.
   - Committed migration files differ from expected Drizzle output $\rightarrow$ **FAIL**.
   - Untracked/spec SQL under `docs/d1/**` is ignored as runtime migration input.
7. **Rollback & Disaster Recovery:**
   SQLite/D1 does not safely support arbitrary down-migrations. Rollback strategy relies on Cloudflare D1 Time Travel (`wrangler d1 time-travel restore astralyn-db --timestamp=...`) and automated snapshot backups.

---

## 11. Environment & D1 Binding Policy

Astralyn strictly forbids fake or simulated infrastructure identifiers (e.g. `00000000-0000-0000-0000-000000000000`).

`apps/worker/wrangler.jsonc` contains the real Cloudflare D1 database configuration created via repository Wrangler:
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
      "database_id": "35c47a27-8cd4-4b9b-aa06-8bbc53a9e165",
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

## 12. Implementation Tasks & Execution Order

```text
Task 1: Add Drizzle Dependencies & Configure Monorepo
  ↓
Task 2: Define Phase 3A Baseline Drizzle Schema
  ↓
Task 3: Configure Drizzle Kit & Inspect Migration Output Layout
  ↓
============================================================
MANUAL STOP GATE:
  1. User runs: pnpm --filter @astralyn/worker exec wrangler d1 create astralyn-db
  2. User provides/configures real database_id in apps/worker/wrangler.jsonc
============================================================
  ↓
Task 4: Configure Cloudflare D1 Binding in Worker
  ↓
Task 5: Implement Typed Drizzle Client & Database Health Helper
  ↓
Task 6: Create Build-Time Migration Drift Validator
  ↓
Task 7: Add Database Integration & Error Handling Tests
  ↓
Task 8: End-to-End Workspace Closure Verification
```

---

### Task 1 — Add Drizzle Dependencies & Configure Monorepo
**Goal:** Add `drizzle-orm` and `drizzle-kit` to `@astralyn/worker` and create root package scripts.
**Files:**
- `apps/worker/package.json`
- `package.json`
**Changes:**
- Add `drizzle-orm` to `apps/worker` dependencies.
- Add `drizzle-kit` to `apps/worker` devDependencies.
- Add `db:generate`, `db:check`, `db:migrate:local` scripts in root `package.json` and `apps/worker/package.json`.
**Do not:**
- Add Drizzle dependencies to `packages/shared`.
- Install unrelated dependencies (e.g. Prisma, Better Auth before Phase 3B).
- Modify `pnpm-lock.yaml` manually.
**Validation:** `pnpm install` succeeds and `pnpm -r typecheck` passes.
**Done when:** `apps/worker` resolves `drizzle-orm` imports without type errors.

---

### Task 2 — Define Phase 3A Baseline Drizzle Schema
**Goal:** Create declarative Drizzle schema baseline in `@astralyn/worker` exporting 0 application tables.
**Files:**
- `apps/worker/src/db/schema.ts` (New)
- `apps/worker/src/db/index.ts` (New)
**Changes:**
- Create `apps/worker/src/db/schema.ts` documenting baseline state with 0 application tables.
- Re-export schema in `apps/worker/src/db/index.ts`.
**Do not:**
- Include speculative user tables, infrastructure tables, or mock data.
**Validation:** `pnpm --filter @astralyn/worker typecheck` passes.
**Done when:** Schema module is cleanly exportable and type-safe.

---

### Task 3 — Configure Drizzle Kit & Inspect Migration Output Layout
**Goal:** Configure Drizzle Kit in `apps/worker`, execute zero-delta generation, and empirically inspect migration output conventions.
**Files:**
- `apps/worker/drizzle.config.ts` (New)
- `apps/worker/drizzle/migrations/` (New directory)
**Changes:**
- Create `apps/worker/drizzle.config.ts` with `dialect: "sqlite"`, `schema: "./src/db/schema.ts"`, `out: "./drizzle/migrations"`.
- Ensure directory `apps/worker/drizzle/migrations/` exists.
- Run `pnpm --filter @astralyn/worker db:generate` using the repository-pinned `drizzle-kit` version.
- Inspect the resulting migration layout and journal output convention.
**Do not:**
- Hand-write dummy SQL migration files.
- Copy `docs/d1/**` SQL into runtime migration directory.
- Prescribe a glob pattern until execution proves the layout.
**Validation:** `pnpm --filter @astralyn/worker db:generate` exits 0 without error.
**Done when:** Migration generation pipeline is verified and directory layout is recorded.

---

### MANUAL STOP GATE
**Before proceeding to Task 4:**
1. The executor verifies whether `apps/worker/wrangler.jsonc` contains a real Cloudflare D1 `database_id`.
2. If unconfigured, the executor **MUST STOP** and prompt the user to execute:
   ```bash
   pnpm --filter @astralyn/worker exec wrangler d1 create astralyn-db
   ```
   and configure the resulting `database_id` in `apps/worker/wrangler.jsonc`.
3. The executor must **never** insert a fake UUID to bypass this gate.

---

### Task 4 — Configure Cloudflare D1 Binding in Worker
**Goal:** Configure truthful D1 binding in `wrangler.jsonc` and define strongly typed `Env` interface.
**Files:**
- `apps/worker/wrangler.jsonc`
- `apps/worker/src/index.ts`
**Changes:**
- Ensure `d1_databases` array in `wrangler.jsonc` uses binding `DB`, database name `astralyn-db`, the verified `database_id`, `migrations_dir: "drizzle/migrations"`, and `migrations_pattern` only if required by the actual Drizzle output layout detected in Task 3.
- Update `export interface Env { DB?: D1Database; }` in `apps/worker/src/index.ts`.
**Do not:**
- Use a fake UUID.
- Make `env.DB` required at compile-time without handling undefined in tests.
**Validation:** `pnpm --filter @astralyn/worker typecheck` passes.
**Done when:** `Env` interface accurately types `env.DB` as `D1Database | undefined` with truthful configuration.

---

### Task 5 — Implement Typed Drizzle Client & Database Health Helper
**Goal:** Create typed Drizzle D1 client factory and table-independent database readiness probe (`SELECT 1`) with strict 200/503 semantics.
**Files:**
- `apps/worker/src/db/client.ts` (New)
- `apps/worker/src/db/health.ts` (New)
- `apps/worker/src/index.ts`
- `packages/shared/src/health.ts`
**Changes:**
- In `apps/worker/src/db/client.ts`, export `createDbClient(d1: D1Database)` returning `drizzle(d1, { schema })`.
- In `apps/worker/src/db/health.ts`, implement `checkDatabaseHealth(db?: D1Database)` executing a read-only `sql\`SELECT 1 as ready\`` query with fallback error capture.
- In `packages/shared/src/health.ts`, extend `HealthCheckResponse` with optional `database: { status: "connected" | "disconnected" | "unconfigured"; latencyMs?: number; error?: string }`.
- Update `apps/worker/src/index.ts` to call `checkDatabaseHealth(env.DB)` on `GET /api/health`, returning HTTP 200 when `status === "connected"`, and HTTP 503 with `ok: false` when `status === "unconfigured"` or `status === "disconnected"`.
**Do not:**
- Return HTTP 200 when the database binding is missing or the readiness query fails.
- Write or insert data during health probes.
- Log raw connection secrets.
**Validation:** `pnpm --filter @astralyn/worker test` passes with updated health tests.
**Done when:** `/api/health` accurately reports database connectivity status with correct HTTP status codes.

---

### Task 6 — Create Build-Time Migration Drift Validator
**Goal:** Create tool enforcing that TypeScript schema and SQL migrations are 100% in sync, supporting zero-migration baseline.
**Files:**
- `tools/check-migrations.ts` (New)
- `package.json`
**Changes:**
- Implement `tools/check-migrations.ts` verifying that `drizzle-kit generate` produces no uncommitted migration files and that runtime migrations match schema.
- Add `pnpm db:check` script to root `package.json`.
- Add `pnpm db:check` to root `pnpm test` sequence.
**Do not:**
- Treat documentation SQL in `docs/d1/**` as runtime migration input.
**Validation:** `pnpm db:check` passes with exit code 0 on clean baseline.
**Done when:** Drift validator verifies zero-drift state.

---

### Task 7 — Add Database Integration & Error Handling Tests
**Goal:** Implement test suite covering D1 client initialization, `/api/health` readiness semantics, and failure modes.
**Files:**
- `apps/worker/test/db.test.ts` (New)
- `apps/worker/test/health.test.ts`
**Changes:**
- Add tests in `apps/worker/test/db.test.ts` validating:
  1. `createDbClient` creates a valid Drizzle instance from a mock/emulated D1 database.
  2. Executing `SELECT 1` through Drizzle succeeds and measures latency.
  3. Query error propagation when D1 execution throws (e.g. timeout or syntax failure).
- Update `apps/worker/test/health.test.ts` to test:
  1. DB connected: HTTP 200, `ok: true`, `database.status: "connected"`.
  2. DB unconfigured (`env.DB = undefined`): HTTP 503, `ok: false`, `database.status: "unconfigured"`.
  3. DB query error / disconnected: HTTP 503, `ok: false`, `database.status: "disconnected"`.
**Do not:**
- Insert fake user accounts or mock game data in database tests.
- Leave temporary test tables in production schema or migrations.
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

## 13. Test Matrix

| Scenario | Test Location | Expected Behavior |
| :--- | :--- | :--- |
| **DB Unconfigured (`env.DB = undefined`)** | `apps/worker/test/health.test.ts` | `/api/health` returns HTTP 503, `ok: false`, `database.status: "unconfigured"`. |
| **DB Connected & Healthy** | `apps/worker/test/health.test.ts` | `/api/health` returns HTTP 200, `ok: true`, `database.status: "connected"`, `latencyMs > 0`. |
| **DB Error / Connection Failure** | `apps/worker/test/health.test.ts` | `/api/health` returns HTTP 503, `ok: false`, `database.status: "disconnected"`, `database.error` populated. |
| **Read-Only Probe (`SELECT 1`)** | `apps/worker/test/db.test.ts` | Executes table-independent query; zero rows created or mutated. |
| **D1 Client Factory** | `apps/worker/test/db.test.ts` | Instantiates Drizzle client and executes parameterized query. |
| **Migration Drift Check (Clean 0-Migration)** | `tools/check-migrations.ts` | Exits 0 on clean baseline; ignores `docs/d1/**`. |

---

## 14. Security / Integrity

1. **SQL Parameterization:**
   All queries generated by Drizzle ORM compile to prepared statements with bound parameters (`?`). No raw SQL string concatenation is permitted.
2. **Worker-Only Access:**
   The D1 binding (`env.DB`) is accessible exclusively within Cloudflare Worker execution context. Browser clients have zero direct D1 credentials or network visibility to the database.
3. **Migration Immutability:**
   Generated migration files (when created in Phase 3B+) are version-controlled in Git. Migrations are never generated or modified dynamically at runtime.
4. **No Secret Logging:**
   Health checks and error handlers log sanitized error messages and never print connection strings, session tokens, or API keys.
5. **Future User Isolation Seam:**
   The persistence foundation enforces that all future user-owned tables will require a non-nullable `user_id` foreign key bound to the verified `session.user.id` in Worker middleware.

---

## 15. Production Data Rules

Phase 3A strictly adheres to the Astralyn Production Data Readiness invariants established in Phase 2.5:

- **0 Production Application Tables:** No speculative tables, mock rows, or artificial metadata rows exist in Phase 3A.
- **No Fake Production Users:** The database must never contain synthetic or placeholder user records (`user_001`, `demo_user`).
- **No Seed Accounts or Rosters:** Production database starts completely empty.
- **Read-Only Health Probes:** Database readiness check executes table-independent `SELECT 1` queries and never writes records.
- **Isolated Test Fixtures:** Any test-only schemas or temporary data must be strictly test-local and never emitted into production Drizzle schema or migrations.

---

## 16. Validation Sequence

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

## 17. Manual Actions / Gates

Before executing production deployments or testing with remote Cloudflare D1 databases, the following manual steps are required:

### Manual Gate: Create Cloudflare D1 Database (Prior to Task 4)
Execute using repository-installed Wrangler:
```bash
pnpm --filter @astralyn/worker exec wrangler d1 create astralyn-db
```
**Output required:** Note the generated `database_id` (UUID format) and insert it into `apps/worker/wrangler.jsonc`.

### Production Deployment Migration Gate (When Migrations Exist in Phase 3B+)
When deploying to Cloudflare:
```bash
pnpm --filter @astralyn/worker exec wrangler d1 migrations apply astralyn-db --remote
```

*Note: For local development and automated testing (`pnpm test`, `pnpm --filter @astralyn/worker dev`), Cloudflare D1 runs in local SQLite emulation (`--local`) and does not require active Cloudflare credentials.*

---

## 18. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Schema Drift between Drizzle and SQL Migrations** | Deployment failure or runtime SQL error in production D1. | `tools/check-migrations.ts` runs on every `pnpm test` and CI build, failing if schema and migrations diverge. |
| **Worker Cold-Start Latency from ORM Initialization** | Slow first-request response times on edge workers. | Drizzle ORM client is lightweight and instantiated per-request or cached in execution context with zero schema compilation latency. |
| **D1 Concurrent Write Locking** | SQLite write serialization bottlenecks during high write concurrency. | MVP architecture is client-cached and read-heavy; writes occur only during user onboarding and settings saves. |

---

## 19. Deferred Findings

The following capabilities are intentionally deferred to subsequent roadmap phases:
- **Phase 3B:** Better Auth configuration, Google OAuth credentials, session cookies, and authorization middleware (`session.user.id`).
- **Phase 4:** User profile persistence (`profiles`), roster ownership (`user_roster`), and saved team management (`saved_teams`).
- **Phase 5:** Recommendation scoring rules and multi-source consensus calculation.
- **Phase 7:** PaddleOCR.js client pipeline and Divergent Universe interactive guidance.
- **Phase 8:** Upstream HoYoLAB automated ingestion and D1 canonical snapshot publishing.

---

## 20. Definition of Done

- [ ] `drizzle-orm` and `drizzle-kit` installed in `@astralyn/worker`.
- [ ] Single source of truth schema defined under `apps/worker/src/db/schema.ts` (0 application tables in Phase 3A).
- [ ] `drizzle.config.ts` configured in `apps/worker`, zero-delta generation runs cleanly, and migration layout is empirically inspected.
- [ ] `wrangler.jsonc` configured with D1 binding `DB`, real `database_id`, and `migrations_dir: "drizzle/migrations"`.
- [ ] Typed database client factory `createDbClient(env.DB)` implemented in `apps/worker/src/db/client.ts`.
- [ ] `/api/health` enhanced with table-independent `SELECT 1` readiness probe reporting truthful status with strict 200/503 semantics.
- [ ] `tools/check-migrations.ts` and `pnpm db:check` script implemented and passing on clean baseline.
- [ ] Unit and integration tests in `apps/worker/test/` passing for all scenarios in the Test Matrix under local emulation.
- [ ] Zero mock user records, fake rosters, or synthetic seed data in production code or migrations.
- [ ] All verification commands in Section 16 return exit code 0 under Node `24.19.0`.

---

## 21. Executor Handoff

- **Target Executor:** Gemini 3.7 Flash High
- **Files to read first:**
  1. `docs/internal/PHASE-3A-D1-DRIZZLE-FOUNDATION.md` (this plan)
  2. `apps/worker/package.json` and `apps/worker/wrangler.jsonc`
  3. `apps/worker/src/index.ts`
  4. `packages/shared/src/index.ts`
- **Execution Rules:**
  - Execute Task 1 through Task 8 in strict sequence.
  - Run Node `24.19.0` via `$env:PATH = "C:\Users\Hafizh Rizqullah\.nodejs\node-v24.19.0-win-x64;" + $env:PATH`.
  - Use repository-controlled pnpm commands (`pnpm --filter @astralyn/worker ...`). Never use bare `npx`.
  - **MANUAL STOP GATE:** Stop between Task 3 and Task 4 to verify real Cloudflare D1 `database_id` in `wrangler.jsonc`.
  - Do not create speculative production tables or fake migrations in Phase 3A.
  - Do not fabricate production seed rows or test accounts.
