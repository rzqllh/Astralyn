# Phase 4 — Authentication, Onboarding & User State

Status: COMPLETE. Target: Local Development. Completed: 2026-09-03.

---

## 1. Objectives

Phase 4 bridges the authenticated identity established in Phase 3B into the core Astralyn product experience. It turns an authenticated Google user into an onboarded Trailblazer with an Astralyn profile and an owned character roster.

Key goals:
1. **Client Auth Integration (`apps/web`):** Provide a typed React auth hook (`useAuth()`, `useSession()`) communicating with `/api/auth/*` via the Vite proxy, dynamically updating the navbar from `"Account unavailable"` to an active Trailblazer avatar/name with a sign-out trigger.
2. **First-Run Onboarding State Machine:** Enforce the documented user progression:
   `SIGNED_OUT` → `AUTHENTICATED_UNONBOARDED` → `ROSTER_SELECTION` → `ROSTER_CONFIRMATION` → `READY`.
3. **User Profile & Roster Persistence (`apps/worker`):**
   - Define Drizzle schemas for `profiles` and `user_roster` in Cloudflare D1.
   - Generate additive migration `0001_...sql` using `drizzle-kit generate`.
   - Implement server-side endpoints (`GET /api/me`, `PUT /api/onboarding/complete`, `GET /api/roster`, `PUT /api/roster`) guarded by strict `AuthContext` invariant authorization (HTTP 401 for unauthenticated callers).
4. **HSR-Native Onboarding & Roster UI (`apps/web`):**
   - High-contrast character selector connected to the local Dexie `AstralynKnowledgeCache` (filtering by 9 Combat Paths, 7 Combat Elements, 5★/4★ rarity).
   - Level (1–80) and Eidolon (0–6) configurators adhering to HSR visual conventions (`docs/10-DESIGN.md`).
   - In-app Roster Manager under Settings (`Settings → My Roster`) for post-onboarding character management.
5. **No Fake Data Invariant:** Zero mock characters, zero fabricated ownership, and zero sample KPI metrics. Unauthenticated users see honest guest state; new users start with an honest empty roster until they explicitly select their owned characters.

---

## 2. Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        apps/web (Client)                               │
│                                                                        │
│  ┌──────────────┐     ┌──────────────────────┐     ┌────────────────┐  │
│  │ useSession() │ ──> │  OnboardingWizard    │ ──> │ RosterManager  │  │
│  └──────┬───────┘     └──────────┬───────────┘     └───────┬────────┘  │
│         │                        │                         │           │
│         │                        │ Dexie Knowledge Cache   │           │
│         │                        ▼ (Canonical 4.5 Data)    │           │
│         │             ┌──────────────────────┐             │           │
│         │             │ AstralynKnowledge    │             │           │
│         │             │ Cache (IndexedDB)    │             │           │
│         │             └──────────────────────┘             │           │
└─────────┼────────────────────────┼─────────────────────────┼───────────┘
          │ (Vite Proxy /api/*)     │                         │
          ▼                        ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       apps/worker (Server)                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     AuthContext Invariant                        │  │
│  │          (Checks signed session token via Better Auth)           │  │
│  └──────────────────┬───────────────────────────────┬───────────────┘  │
│                     │                               │                  │
│                     ▼                               ▼                  │
│  ┌──────────────────────────────────┐   ┌───────────────────────────┐  │
│  │  GET /api/me                     │   │ GET /api/roster           │  │
│  │  PUT /api/onboarding/complete    │   │ PUT /api/roster           │  │
│  └──────────────────┬───────────────┘   └───────────┬───────────────┘  │
│                     │                               │                  │
│                     ▼                               ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Cloudflare D1 (SQLite)                       │  │
│  │  ┌─────────────┐     ┌───────────────┐     ┌──────────────────┐  │  │
│  │  │ user (auth) │ <── │   profiles    │ <── │   user_roster    │  │  │
│  │  └─────────────┘     └───────────────┘     └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model & Schema (`apps/worker`)

Per [`docs/04-DATA_MODEL.md`](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/04-DATA_MODEL.md), Phase 4 creates two user-bound tables referencing Better Auth's `user.id`:

### `profiles` Table
```sql
CREATE TABLE `profiles` (
  `user_id` TEXT PRIMARY KEY NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `display_name` TEXT,
  `preferred_language` TEXT NOT NULL DEFAULT 'en',
  `onboarding_completed_at` TEXT,
  `created_at` TEXT NOT NULL,
  `updated_at` TEXT NOT NULL
);
```

### `user_roster` Table
```sql
CREATE TABLE `user_roster` (
  `user_id` TEXT NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `character_id` TEXT NOT NULL,
  `level` INTEGER NOT NULL DEFAULT 1,
  `eidolon` INTEGER NOT NULL DEFAULT 0,
  `is_owned` INTEGER NOT NULL DEFAULT 1,
  `created_at` TEXT NOT NULL,
  `updated_at` TEXT NOT NULL,
  PRIMARY KEY (`user_id`, `character_id`)
);

CREATE INDEX `user_roster_user_id_idx` ON `user_roster` (`user_id`);
```

---

## 4. Implementation Tasks in Order

### Task 1: Drizzle Persistence Schemas & Migration Generation
- Create `apps/worker/src/db/user-schema.ts` defining `profiles` and `userRoster` using Drizzle SQLite primitives.
- Export definitions through `apps/worker/src/db/schema.ts`.
- Run `pnpm --filter @astralyn/worker db:generate` to produce `0001_<name>.sql`.
- Verify `pnpm db:check` confirms zero uncommitted schema drift and clean migration journal.
- Apply locally: `pnpm db:migrate:local`.

### Task 2: Worker Repository & Service Layer
- Create `apps/worker/src/db/user-repository.ts`:
  - `getProfile(userId: string)`: fetches profile or creates default if missing.
  - `completeOnboarding(userId: string, roster: Array<{ characterId: string, level: number, eidolon: number }>)`: executes atomic D1 `batch()` inserting roster rows and setting `onboarding_completed_at`.
  - `getRoster(userId: string)`: returns all owned characters for user.
  - `updateRosterCharacter(userId: string, entry: { characterId: string, level: number, eidolon: number, isOwned: boolean })`: upserts or removes character entry.

### Task 3: Worker User & Onboarding API Routes
- Extend `apps/worker/src/index.ts` with authenticated routes:
  - `GET /api/me`: Returns `{ user, profile, needsOnboarding: profile.onboardingCompletedAt === null }`.
  - `PUT /api/onboarding/complete`: Validates request body with Zod schema, calls repository, returns `{ success: true }`.
  - `GET /api/roster`: Returns array of owned characters.
  - `PUT /api/roster`: Updates roster entries.
- Add unit and route tests under `apps/worker/test/user.test.ts`.

### Task 4: Client Auth Layer & App Header Identity
- Create `apps/web/src/features/auth/`:
  - `useSession()` / `useAuth()` hook for fetching session and user state.
  - `signIn()` and `signOut()` handlers.
- Update `apps/web/src/components/layout/Header.tsx`:
  - Replace static `"Account unavailable"` badge with:
    - Signed out: `"Sign in with Google"` button using gold action styling.
    - Signed in: User profile menu showing avatar, display name, and Sign Out button.

### Task 5: Onboarding Wizard Surface (`apps/web`)
- Create `apps/web/src/features/onboarding/`:
  - Step 1: Character Grid:
    - Queries Dexie `AstralynKnowledgeCache` for canonical characters.
    - Path and Combat Element filter badges.
    - Search input for character names.
    - Visual selection toggles with gold border indicators.
  - Step 2: Confirmation & Stats:
    - Level slider/stepper (1–80).
    - Eidolon selector (E0–E6).
  - Step 3: Finish Setup:
    - Calls `PUT /api/onboarding/complete`.
    - Updates local Dexie `user_roster` cache.
    - Redirects to Home view with personalized roster state.

### Task 6: Roster Management Surface (`apps/web`)
- Create `apps/web/src/features/roster/RosterManager.tsx`:
  - Accessible via `Settings → My Roster` (or `/settings/roster`).
  - View all owned characters grouped by Path or Combat Element.
  - Quick Eidolon increment/decrement.
  - Add character button opening modal to select unowned characters.
  - Remove character button with confirmation.

### Task 7: Full Automated Regression & Verification
- Execute full test suites:
  - `pnpm --filter @astralyn/worker test`
  - `pnpm --filter @astralyn/web test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm data:check`
  - `pnpm db:check`
  - `pnpm auth:schema:check`
  - `git diff --check`

---

## 5. Validation Gates

| Gate | Command | Acceptance Criteria |
|---|---|---|
| Migration Integrity | `pnpm db:check` | Zero schema drift, journal updated cleanly |
| Worker Tests | `pnpm --filter @astralyn/worker test` | All auth, profile, and roster tests pass |
| Web Tests | `pnpm --filter @astralyn/web test` | All component and hook tests pass |
| Type Safety | `pnpm typecheck` | 0 TypeScript errors across all workspaces |
| Code Hygiene | `pnpm lint` | 0 ESLint errors or warnings |
| Production Boundary | `pnpm data:check` | 0 dev/test fixtures in production graphs |
| Auth Schema | `pnpm auth:schema:check` | Better Auth schema remains 100% in sync |
| Git Hygiene | `git diff --check` | 0 whitespace or formatting anomalies |

---

## 6. Manual Smoke Gates (Local Development) — ALL PASSED

1. **Manual Gate 1 (Onboarding Flow) — [PASS]**:
   - Started fresh local user session.
   - Header shows `"Sign in with Google"`.
   - Signed in via local OAuth.
   - Redirection to Onboarding Wizard (`/onboarding`).
   - Selected canonical characters (Castorice, Tingyun) and configured levels/Eidolons.
   - Clicked "Finish setup" and verified redirection to `/roster`.
   - Verified local D1 database: `profiles` has `onboarding_completed_at` populated and `user_roster` rows exist.

2. **Manual Gate 2 (Roster Management) — [PASS]**:
   - Navigated to `Settings → My Roster`.
   - Added characters via modal; verified owned characters are dynamically excluded from Add modal.
   - Mutated Level and Eidolon (Tingyun Lv 75, E2); confirmed persistence after hard reload (F5).
   - Deleted character; confirmed removal from UI and local D1 database, and verified character immediately becomes addable again in the modal.

---

## 7. Explicit Out-of-Scope Items

The following are strictly deferred to subsequent phases and must NOT be implemented in Phase 4:
- **Phase 5:** Deterministic recommendation engine calculations, tier rankings, team scoring algorithms.
- **Phase 6:** Best-in-slot build recommendations, Light Cone recommendation engine, Saved Teams.
- **Phase 7:** Client-side PaddleOCR screenshot scanner and Divergent Universe assistant.
- **Phase 9:** Production deployment, remote Cloudflare D1 migrations, remote secrets configuration, production OAuth smoke.
- **Strictly Prohibited:** Hardcoded sample rosters, fake users, demo KPI cards, third-party hotlinking.
