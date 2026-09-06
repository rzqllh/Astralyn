# Astralyn — Roadmap & Phasing Architecture

## Project Phasing Sequence

The implementation of Astralyn follows a strict, sequential 9-phase dependency model. Earlier phases provide architectural contracts and foundational layers required by downstream features.

```text
Phase 0: Tooling & Monorepo Baseline (Complete)
  ↓
Phase 1: Design Tokens & Primitive Foundation (Complete)
  ↓
Phase 1.1: Visual Asset & Design Foundation Closure (Complete)
  ↓
Phase 2: Canonical Knowledge Schemas, Static Knowledge Fixtures, Snapshot Contracts, Dexie Client Knowledge Cache (Complete)
  ↓
Phase 2.5: Production Data Readiness, Asset Quarantine & Build-Time Boundary Enforcement (Complete)
  ↓
Phase 3A: Cloudflare Worker, D1 Database, Drizzle ORM Persistence Foundation (Complete)
  ↓
Phase 3B: Better Auth, Google OAuth & Session Management (Complete)
  ↓
Phase 4: Authentication-Driven Onboarding, Roster Management, User State Synchronization (Complete)
  ↓
Phase 5: Deterministic Recommendation Engine & Multi-Source Consensus Core (Complete)
  ↓
Phase 6: Character, Build & Source Comparison Surfaces, Team Recommender (Complete)
  ↓
Phase 7: Client OCR Pipeline, Divergent Universe Live Decision Assistant (Complete)
  ↓
Phase 8: Automated Scheduled Ingestion & Knowledge Publishing Pipeline (Complete)
  ↓
Phase 9: End-to-End Testing, Security, Accessibility Audit, Free-Tier Quota Validation, Production Deployment
```

---

## Detailed Phase Breakdown

### Phase 0 — Tooling & Monorepo Baseline (Complete)
- Node.js LTS (24.19.x) + pnpm monorepo workspace (`apps/web`, `apps/worker`, `packages/shared`, `tools/`);
- TypeScript composite project reference configuration (`tsconfig.json`, `tsconfig.base.json`);
- ESLint, Prettier, Vitest, and Playwright baseline test runners.

### Phase 1 — Design Tokens & Primitive Foundation (Complete)
- HSR-native design token system (Cosmic Void surfaces, celestial parchment contrast, astral gold split tokens);
- Headless accessible UI primitives (Radix UI + Tailwind CSS v4);
- Domain component foundations (`CharacterTile`, `RecommendationPanel`, `SourceRankPanel`, `DecisionCard`);
- 8-link locked production navigation contract.

### Phase 1.1 — Visual Asset & Design Foundation Closure (Complete)
- Versioned static game asset architecture decoupled from knowledge domain;
- Data-driven sync pipeline (`tools/sync-assets.ts`) with proven full catalog capability and curated dev snapshot;
- Conservative legal provenance metadata (repository automation license != game artwork copyright);
- Zero runtime third-party hotlinking and resilient vector fallback silhouettes (`<GameAssetImage>`);
- Responsive layout verification at 1440px (desktop companion rail), 768px (tablet reflow), and 390px (dense mobile drawer & stacked components).

### Phase 2 — Canonical Knowledge Foundation & Factual Integrity (Complete)
- Strongly typed Zod 4 runtime schemas for all HSR entities (Characters, Light Cones, Relics, Enemies, Stages, Divergent Universe Blessings/Curios/Equations, Game Versions, Release Manifests);
- Authoritative Version 4.5 baseline alignment ("To Roll the Stars in Astropolis", active Aug 26, 2026);
- 9 official playable Combat Paths including Path of Elation and Version 4.5 representative fixtures (*Aventurine • Waveflair*, *Flame of Carnival*);
- Accurate canonical kit mechanics (Castorice Memosprite: Netherwing, The Herta: Interpretation & Inspiration Erudition synergy, Firefly: Complete Combustion Super Break, Acheron: Slashed Dream non-energy resource);
- Divergent Universe Path grounding (Celestial Annihilation verified under The Hunt);
- Stage rotation temporality with `rotationId` preventing collision across rotating cycles;
- Strongly typed Tier A `FactProvenance` metadata on every canonical fixture;
- Canonical static knowledge fixtures and snapshot versioning contracts (`/data/<knowledge-version>/...`);
- Pre-publication integrity verification tooling (`pnpm knowledge:build`, `pnpm knowledge:check`);
- Client-side IndexedDB caching layer via Dexie (`AstralynKnowledgeCache`) with pre-decode raw SHA-256 byte checksum validation, transactional atomic population, version upgrade state machine, fail-safe rollback protection, and offline fallback;
- KnowledgeRepository query abstraction with search normalization across all 8 canonical entity stores;
- Reproducible performance benchmark suite (`tools/benchmark-knowledge.ts` via `pnpm knowledge:benchmark`).
- 100% test coverage for schema acceptance, negative rejection, cache lifecycle, and asset interoperability.

### Phase 2.5 — Production Data Readiness & Build-Time Boundary Isolation (Complete)
- Complete isolation of dev-only design system showcase into standalone multi-page HTML entry (`design-system.html`);
- Removal of `/design-system` route and mock fixture data from production runtime;
- Honest production UI states: `HomeView` synchronized with live `useKnowledgeInit()` status + static unsupported module cards; `Account unavailable` header identity;
- Knowledge hooks error-state discrimination (`error: Error | null`) distinguishing valid empty data from read failures;
- Asset snapshot quarantine: 52 valid PNG candidate assets moved to `src/dev/game-assets/v1.0.0/` with `usageStatus: "manual_review"`; 3 disguised SVG placeholders renamed to truthful `.svg` fixtures in `tests/fixtures/assets/`;
- Deletion of `apps/web/public/game-assets` from production tree (0 production-approved game assets);
- Fail-closed asset tools (`tools/check-assets.ts`, `tools/sync-assets.ts`) with magic binary header sniffing and fail-closed validation;
- Build-time production boundary validator (`tools/check-production-data.ts`, `pnpm data:check`) and ESLint `no-restricted-imports` rule;
- 100% test pass rate across unit, boundary, asset integrity, and Playwright E2E suites.

### Phase 3A — Cloudflare Worker D1 + Drizzle Persistence Foundation (Complete)
- Cloudflare D1 (SQLite) binding configuration in Worker (`apps/worker`);
- Drizzle ORM integration and typed repository data-access boundary;
- Migration tooling, migration generation, and migration safety validation (`tools/check-migrations.ts`, `pnpm db:check`);
- Minimal persistence schema foundation with future auth foreign-key seam;
- Local development & testing database isolation;
- Zero fake production seed data.

### Phase 3B — Better Auth, Google OAuth & Session Management (Local Implementation Complete)
- Better Auth 1.7.2 native Cloudflare D1 runtime integration with shared canonical schema options (`apps/worker/src/auth/schema-options.ts`);
- Canonical 4-table persistence baseline (`user`, `session`, `account`, `verification`) generated via `auth generate` and `drizzle-kit generate` (`0000_high_shape.sql`);
- Worker-level Better Auth handler (`/api/auth/*`) and typed `AuthContext` resolver with sanitized error boundaries;
- Local Google OAuth end-to-end smoke verification (Google login, session persistence, logout/revocation, cancel/deny all PASS);
- Local test suites, schema integrity gates (`pnpm auth:schema:check`), and migration integrity gates (`pnpm db:check`) 100% PASS;
- *Note:* Production deployment gates (production origin, production Google OAuth credentials, remote secrets, remote D1 migration, and remote OAuth smoke) are intentionally deferred to the pre-release deployment gate (Phase 9) since the project is in active local development without an existing production deployment. Phase 4 local development proceeds unblocked.

### Phase 4 — Authentication, Onboarding & User State (Complete)
- Typed client auth integration (`useAuth()`, `useSession()`) with live header identity and reactive sign-in/out states;
- Profile and user roster persistence foundation in Cloudflare D1 (`profiles`, `user_roster`, migration `0001_wonderful_rocket_raccoon.sql`);
- Worker authenticated endpoints (`GET /api/me`, `PUT /api/onboarding/complete`, `GET /api/roster`, `PUT /api/roster`, `DELETE /api/roster/:id`) guarded by strict `AuthContext` invariant (HTTP 401 for unauthenticated callers);
- Multi-step onboarding wizard (`/onboarding`) enforcing selection before configuration, with Level (1–80) and Eidolon (0–6) configurators and atomic D1 batch persistence;
- In-app Roster Manager (`/roster`) with dynamic candidate exclusion (owned characters excluded, reactive addition/deletion, search, element, and path filters);
- Local manual smoke gates (Gate 1: Onboarding Flow, Gate 2: Roster Management) 100% PASS with verified D1 persistence;
- 100% automated test pass rate across unit, boundary, lint, typecheck, and git whitespace checks.
- *Note:* Production deployment gates (remote D1 migrations, remote secrets, production OAuth origins) remain intentionally deferred to the pre-release deployment gate (Phase 9). Local foundation is fully ready for Phase 5.

### Phase 5 — Deterministic Recommendation Engine (Complete)
- 100% deterministic pure integer fixed-point recommendation scoring algorithm in `@astralyn/shared` (Decision D-028);
- Role coverage evaluation (sustain, carry, amplifier presence/deficit and penalty constraints);
- Canonical mechanic cross-tag synergy modeling (Super Break, Memosprite acceleration, Slashed Dream debuff feeding, Energy battery);
- Kit-verified trace and Eidolon constraints (Acheron Trace A4 Nihility deficit penalty, relaxed by Eidolon 2);
- Roster-aware combination search generating deterministic 4-character teams exclusively from authenticated user's D1 roster;
- Deterministic UTF-16 code-unit tie-breaking policy (`compareCodeUnits`, `buildTeamSignature`);
- Structured explainability with machine-readable reason codes, category labels, score deltas, and human explanations;
- User UI surfaces in Web HUD (`/recommendations` and `/teams`) with interactive elemental weakness toggling and focus character anchor badge;
- Client-side recommendation caching keyed by deterministic composite tuple `(knowledgeVersion, rosterSignature, context)` with automatic invalidation on roster additions/updates/deletions and manual bypass via Recalculate;
- Local manual smoke gates (Gate 1: Recommendation Engine, Gate 2: Navigation & Invalidation) PASS;
- 100% automated test pass rate (119 web tests, 34 worker tests, 14 shared golden regression tests).
- *Note:* Production deployment gates remain deferred to Phase 9. Local Phase 5 foundation complete.

### Phase 6 — Character, Build & Team Recommender Surfaces (Complete)
- Interactive Character Database (`/characters`) supporting all 9 verified canonical characters with live D1 roster ownership badges, search, and Path/Element/Rarity/Ownership filters;
- Comprehensive Character Detail & Build Dossiers (`/characters/:characterId`) with Lv.80 base attributes, complete kit mechanics, Major Traces (A2/A4/A6), and Eidolons (E1–E6);
- Truthful engineering associations: "Path-Compatible Light Cones" strictly filtered by wearer Combat Path, and "Mechanically Synergistic Relics" matched deterministically by canonical mechanic tags;
- Single honest editorial unavailable notice confirming third-party consensus is scheduled for Phase 8; zero fabricated BiS rankings or simulated 3-source rank cards;
- "Best Team From My Roster" personalized focus anchor recommendation powered directly by exported Phase 5 deterministic engine (`generateTeamRecommendations`);
- Non-scoring kit synergy teammate cards exposing verified kit interactions sorted deterministically by ID; zero secondary scoring engines or point weight duplication;
- Mode-neutral Meta Character Role Matrix (`/best-characters`) categorizing canonical characters into Sustain Specialists, Primary Carries, and Amplifiers with owned roster coverage; zero fabricated S/S+/A tiers or unverified MoC/PF/AS scores;
- User-curated Saved Teams management (`/teams`) with authenticated Cloudflare D1 CRUD API (`saved_teams`, `saved_team_members`), Drizzle SQLite table-level CHECK constraints (slot 1..4, trimmed name length 1..50), atomic 4-member batch operations, and cascade deletion;
- Local manual smoke gates (Gate 1: Character Catalog, Gate 2: Character Dossier, Gate 3: Save Recommended Team, Gate 4: Best Characters, Gate 5: Saved Teams CRUD) 100% PASS;
- Saved Teams Local D1 persistence verified via `wrangler d1 execute` with clean cascade deletion proof;
- Migration `0002_hesitant_harry_osborn.sql` applied locally only; remote migration deferred to pre-release deployment gate (Phase 9);
- 100% automated validation pass rate across typecheck, ESLint, data boundary (`pnpm data:check`, 59 production files intact), auth schema, db drift check, and 186 unit/integration tests (128 web, 41 worker, 17 shared);
- Production asset boundary completely preserved with generic vector fallback icons. Phase 6 complete.

### Phase 7 — Client OCR & Divergent Universe Assistant (Complete)
- In-browser Web Worker OCR pipeline using client-side Tesseract.js engine (`apps/web/src/features/assistant/ocr/`);
- Local screenshot processing with zero server-side image upload (Decision D-030); OffscreenCanvas pre-processing with binarization and contrast adjustment;
- Fuzzy canonical entity matcher (`DUEntityMatcher`) leveraging Fuse.js with input sanitization (stripping HTML tags and control characters, 100-char cap) and confidence rating badges (High/Medium/Low);
- Deterministic DU recommendation engine in `@astralyn/shared` (`evaluateDUBlessingChoices`, `evaluateDUEquationChoices`, `evaluateDUCurioChoices`) with pure fixed-point scoring [0, 100], equation progress tracking, party synergy bonuses, rarity baselines, and code-unit tie-breaking;
- Local-first active run state persistence via Zustand `persist` middleware in localStorage (`du-run-store.ts`) with silent discard of malformed data and reset capabilities; zero D1 tables or migrations;
- Real-time Divergent Universe Live Decision Assistant at `/assistant` with Run Status bar, interactive Party / Target Equation setup, Drag-and-Drop / Clipboard Ingestion Zone, Manual Selection fallback, and Ranked Decision Cards (#1 Recommended, #2 Alternative, #3 Low Priority);
- Production asset boundary completely preserved with generic vector silhouettes (`<GameAssetImage>`);
- 100% automated validation pass rate across typecheck, ESLint, data boundary (`pnpm data:check`, 65 production files intact), and 260 unit/integration tests (172 web, 41 worker, 47 shared). Local Phase 7 foundation complete.

### Phase 8 — Ingestion & Publishing Pipeline (Complete)
- Automated scheduled adapters for official HoYoLAB / HSR game updates and approved editorial sources;
- Multi-stage validation, normalization, and consensus precomputation with 3-source minimum verification;
- Deterministic rank weighting and ambiguous tie-breaking deferrals;
- Privileged D1 ingestion and secured `/_internal/export-release` endpoint using `INTERNAL_BUILDER_SECRET`;
- Production cron NO-OP safety fallbacks to prevent mock data leak into production.

### Phase 9 — Hardening, Auditing & Production Release
- Full-path E2E smoke tests and visual regression suite;
- Security audits (Worker authorization, secret protection, SQL injection prevention, OCR input sanitization);
- WCAG 2.2 AA accessibility verification;
- Cloudflare free-tier quota containment stress tests;
- Production Cloudflare deployment.

---

## Semantic Version Milestones

### v0.0 — Foundation (Phases 0–3)
- Tooling, design system, static assets, knowledge schemas, D1 database, Workers API, Better Auth.
- *Exit Criteria:* Application boots, validates asset integrity, loads versioned knowledge release, and enforces server-controlled knowledge immutability.

### v0.1 — MVP (Phases 4–9)
- User account, roster management, Character database, 3-source consensus, Astralyn Verdict, personalized team recommender, DU OCR assistant, Cloudflare static deploy.
- *Exit Criteria:* Core loop (login -> roster -> character guidance -> DU assistant) fully functional and covered by automated regression tests.

### v0.2 — Content Advisor (Post-MVP)
- Memory of Chaos, Pure Fiction, and Apocalyptic Shadow stage-specific recommendations;
- Stage mechanic and boss weakness context;
- Screenshot recognition for endgame challenge stages.

### v0.3 — Richer Build Intelligence (Post-MVP)
- Speed breakpoint calculators and action advance rotation simulators;
- Main-stat and sub-stat variance weighting;
- User light cone substitution availability matrices.

### v0.4 — Sync & Convenience (Post-MVP)
- Enhanced PWA offline support;
- Cross-device Divergent Universe active run synchronization;
- Roster screenshot batch import.

---

## v1.0 Production Readiness Criteria

- Ingestion survives a complete Honkai: Star Rail patch transition;
- Source adapters degrade gracefully when third-party layouts change;
- All recommendation outputs are 100% deterministic, reproducible, and verifiable;
- Core companion features execute completely without paid third-party AI APIs;
- Zero automated Axe accessibility violations across all production routes;
- Responsive design verified across 360px, 390px, 768px, 1280px, and 1440px+ viewports;
- Source attribution and editorial disclaimers clearly visible on every derived recommendation.
