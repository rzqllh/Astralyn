# Astralyn — Decision Log

Use this as ADR-lite. Major changes get a new numbered decision instead of silently rewriting the project's intent.

## D-001 — Product name
**Decision:** Astralyn.  
**Status:** Accepted.

## D-002 — Product scope
**Decision:** General HSR assistant. Divergent Universe is one module, not the product identity.  
**Status:** Accepted.

## D-003 — Personalization
**Decision:** Account is in MVP. Roster is chosen immediately after account creation; later edits live in Settings.  
**Status:** Accepted.

## D-004 — Recommendation style
**Decision:** Top 1–3, concise reasons, roster/context aware.  
**Status:** Accepted.

## D-005 — Source requirement
**Decision:** Editorial surfaces target at least three independent sources; each may expose Top 1–3; Astralyn produces one derived Verdict.  
**Status:** Accepted.

## D-006 — Recommendation authority
**Decision:** Deterministic scoring/consensus ranks; AI may explain but not independently override ranking.  
**Status:** Accepted.

## D-007 — Game Knowledge mutation
**Decision:** Trusted ingestion only. Prompt/OCR/client cannot mutate canonical knowledge.  
**Status:** Accepted.

## D-008 — Official data source
**Decision:** Approved official HoYoverse-source adapters; do not assume a public complete HSR database API.  
**Status:** Accepted.

## D-009 — Ingestion frequency
**Decision:** Central scheduled ingestion with conditional requests/hashing; never fetch official sources per user request.  
**Status:** Accepted.

## D-010 — Frontend
**Decision:** React + Vite + TypeScript.  
**Reason:** Client-heavy/static product; no SSR requirement for MVP.  
**Status:** Accepted.

## D-011 — Account backend (Supabase)
**Decision:** Supabase Auth + Postgres + RLS primary; Cloudflare D1 remains alternative.  
**Status:** Superseded by D-018.

## D-012 — Hosting
**Decision:** Cloudflare static hosting primary.  
**Status:** Accepted.

## D-013 — OCR
**Decision:** PaddleOCR.js / PP-OCRv5 client-side first.  
**Status:** Accepted.

## D-014 — Screenshot privacy
**Decision:** Local processing by default; no screenshot storage in MVP.  
**Status:** Accepted.

## D-015 — Design
**Decision:** Strongly HSR-native visual/UX language while retaining Astralyn branding, implementation and original UI assets.  
**Status:** Accepted.

## D-016 — AI cost
**Decision:** No paid AI dependency. Optional free provider may synthesize explanations/fallback.  
**Status:** Accepted.

## D-017 — Versioned knowledge
**Decision:** Canonical relational storage + immutable published releases + static client snapshots.  
**Status:** Accepted.

## D-018 — Replace Supabase with Cloudflare D1 + Better Auth
**Decision:** Migrate account backend and canonical database from Supabase (PostgreSQL + RLS) to Cloudflare Workers + Cloudflare D1 (SQLite) with Better Auth (Google OAuth) and Worker-level invariant authorization.  
**Reason:** 
1. Strict adherence to the free-first principle without risking free-tier idle project pause behavior associated with external database services.
2. Direct consolidation into the Cloudflare ecosystem (Workers + D1 + Static Assets / CDN).
3. D1 provides true serverless scale-to-zero compute with zero idle cost and 5M rows read/day on the free tier.
4. MVP workload is static-heavy and client-evaluated; PostgreSQL-specific extensions are unnecessary.  
**Status:** Accepted.

## D-019 — Adopt Drizzle ORM for D1 Querying & Migrations
**Decision:** Use Drizzle ORM with the official `@cloudflare/workers` D1 driver for backend schema definition, type-safe queries, and migration management via `drizzle-kit`.  
**Reason:**
1. Zero-overhead lightweight SQL builder compiling directly to D1 prepared statements.
2. Provides TypeScript schema typing shared between backend routes and frontend types.
3. First-class integration with Better Auth (`@better-auth/drizzle-adapter`).
4. Type-safe migrations without the heavy runtime overhead of Prisma.  
**Status:** Accepted.

## D-020 — Phase 1 HSR-Native Design System & Primitive Architecture
**Decision:** Standardize Astralyn's frontend visual language and component architecture around an HSR-native design token system, Radix UI headless accessible primitives, Tailwind CSS v4 geometric utilities, and dedicated domain components (`CharacterTile`, `RecommendationPanel`, `SourceRankPanel`, `DecisionCard`).  
**Reason:**
1. Replaces generic SaaS tropes with distinct HSR information hierarchy, deep cosmic navy/charcoal surfaces (`#090C13`/`#101524`), warm parchment contrast panels (`#EEE8DC`), and astral gold metallic accents (`#DFB86C`).
2. Ensures WCAG 2.2 AA accessibility via keyboard navigation, visible focus rings, tabular numerals, and multi-modal state feedback (color + text + icon).
3. Provides responsive ergonomics across desktop companion rail (1440px), tablet (768px), and mobile single-column drawer (390px) without viewport jumping or layout shift (`min-h-[100dvh]`).  
**Status:** Accepted.

## D-021 — Versioned Game Asset Snapshot & Provenance Layer
**Decision:** Decouple visual game assets from factual knowledge storage by introducing a versioned static asset pipeline (`tools/sync-assets.ts`), static manifest schema (`AssetManifest`), and local CDN hosting (`/game-assets/<release>/`) with graceful vector fallback `<GameAssetImage>`.
**Reason:**
1. Prevents runtime hotlinking to third-party repositories, ensuring uptime, zero CORS issues, and deterministic asset caching on Cloudflare Static Assets.
2. Separates game factual knowledge (D1 database, patch notes, multi-source tiering) from visual game artwork (icons, portraits, element badges).
3. Enforces strict asset provenance and licensing compliance: primary assets derived from community-maintained static archives (e.g. `Mar-7th/StarRailRes` under HoYoverse Fan Content Policy subject to manual review), while maintaining strict exclusion of uncredited art platforms and explicitly distinguishing repository code licenses from game artwork copyright.
4. Guaranteed error resilience: missing or broken asset URLs resolve to high-contrast Astralyn vector silhouettes without layout shift or browser alt-text leakage.  
**Status:** Accepted.

## D-022 — Asset Pipeline Architecture, Conservative Provenance & UI Boundaries
**Decision:** Formalize a three-tier asset architecture (Full Catalog Model, Data-Driven Sync Capability, Curated Dev Snapshot), conservative provenance classification (repository automation license != game artwork ownership), and strict separation between production UI and development/demo fixtures.  
**Reason:**
1. Full Catalog support ensures Astralyn scales to all 17 entity types without bloating Git repository size with complete game archives during development.
2. Conservative legal provenance protects the project by distinguishing repository code licenses (e.g. AGPL-3.0) from underlying HoYoverse visual copyrights (© COGNOSPHERE / HoYoverse), classifying uncredited platforms (Pinterest, DeviantArt) as strictly manual-only.
3. Production/Dev boundary guarantees that internal tools (`/design-system`), mock state (`8 Owned`), and sample metrics are never presented to end-users as real persisted engine outputs.  
**Status:** Accepted.

## D-023 — Phase 2 Canonical Knowledge Schema Architecture & Zod 4 Authority
**Decision:** Establish Zod 4 runtime schemas under `packages/shared/src/knowledge/` as the single source of truth for canonical Honkai: Star Rail entity contracts (Characters, Light Cones, Relics, Enemies, Stages, Divergent Universe Blessings, Equations, Curios, Game Versions, and Release Manifests).  
**Reason:**
1. Eliminates manual interface duplication by deriving all TypeScript types directly via `z.infer<typeof Schema>`.
2. Extensible typed modeling natively supports modern Honkai: Star Rail combat archetypes (Memosprite summons, stance transformations, Super Break conversion, special non-energy ultimate resources) without dozens of nullable ad-hoc properties.
3. Enforces strict factual immutability: canonical game facts cannot be mutated by user input, LLM prompts, OCR payloads, or client writes.  
**Status:** Accepted.

## D-024 — Static Knowledge Release Format, Checksum Verification & Dexie Client Cache
**Decision:** Deliver canonical game knowledge via immutable versioned static JSON files (`/data/<knowledge-version>/...`), root manifest version negotiation (`/data/manifest.json`), SHA-256 integrity validation (`tools/check-knowledge.ts`), and local client caching via Dexie IndexedDB with transactional updates and fail-safe rollback protection.  
**Reason:**
1. Keeps public game knowledge delivery 100% free-first: static CDN edge assets serve all users with zero database reads on Cloudflare D1.
2. Dexie IndexedDB cache enables instantaneous zero-latency client queries, indexed entity search, and reliable offline companion operation.
3. Transactional cache syncer guarantees atomic replacement and never wipes or corrupts an existing valid local cache if a newly published release fails network transmission or schema validation.  
**Status:** Accepted.

## D-025 — Version 4.5 Factual Integrity, Fact Provenance, 9 Combat Paths & Runtime Byte Checksums
**Decision:** Ground the canonical knowledge foundation strictly in official Tier A HoYoverse sources for Version 4.5 ("To Roll the Stars in Astropolis", released Aug 26, 2026), expanding the Combat Path model to 9 official playable Paths (including Elation), attaching strongly typed `FactProvenance` to every entity, modeling stage temporality with `rotationId`, enforcing browser-side SHA-256 byte verification prior to JSON decoding, and establishing a reproducible benchmark suite.  
**Reason:**
1. Factual integrity is the foundation of Astralyn: inaccurate multipliers, outdated archetypes, or hallucinated mechanics pollute downstream recommendation algorithms.
2. Path of Elation and Version 4.5 character/weapon kits (*Aventurine • Waveflair*, *Flame of Carnival*) are canonical facts in HSR 4.5 and must be first-class citizens in schemas and indexes.
3. Correcting known kit mechanics (Castorice Memosprite: Netherwing, The Herta: Interpretation & Inspiration Erudition synergy, Celestial Annihilation: Path of The Hunt) ensures true source grounding.
4. Runtime cryptographic verification validates payload integrity before any untrusted JSON decode, preventing corrupted data from entering the client cache.
5. Strict separation between official kit facts and Astralyn deterministic taxonomy (`roles`, `mechanicTags`, `archetypes`) preserves clean architectural boundaries.  
**Status:** Accepted.

## D-026 — Phase 2.5 Production Data Readiness, Asset Quarantine & Build-Time Boundary Enforcement
**Decision:** Fully isolate development-only fixtures and showcase components from the production bundle graph, quarantine unapproved candidate game assets (52 PNGs preserved as dev-only data under `src/dev/game-assets/`; 3 disguised SVGs renamed and quarantined under test fixtures), enforce zero reachability via ESLint restricted imports and `tools/check-production-data.ts`, implement magic file header sniffing in asset tooling (`tools/check-assets.ts`, `tools/sync-assets.ts`), and establish truthful fallback states (`Asset unavailable`, `Account unavailable`, live knowledge sync status).  
**Reason:**
1. Production runtime must never simulate or fabricate account state, character ownership, recommendation scores, or asset availability.
2. Eliminates disguised raster formats (SVGs masked as PNGs) and prevents unapproved manual-review visual assets from leaking into production web bundles.
3. Preserves developer showcase capabilities via an isolated multi-page entry (`design-system.html`) without exposing dev routes on the production router.
4. Guaranteed automated enforcement via CI boundary checks (`pnpm data:check`, `pnpm assets:check`) ensuring future development cannot accidentally violate the production data boundary.  
**Status:** Accepted.

## D-027 — Phase 3B Local Better Auth Identity & Deferred Deployment Gates
**Decision:** Complete Phase 3B identity foundation locally using Better Auth 1.7.2 native Cloudflare D1 integration with shared canonical schema options (`apps/worker/src/auth/schema-options.ts`), generating a clean 4-table persistence baseline (`0000_high_shape.sql`), while deferring all production-only deployment tasks (production origin, production Google OAuth client credentials, remote secrets via `wrangler secret put`, remote D1 migration execution, and remote OAuth smoke) to the pre-release deployment gate (Phase 9).
**Reason:**
1. Astralyn is in active local development without an active production deployment or fixed production URL.
2. Local OAuth and session verification are 100% complete and passing (Google login, session persistence, logout/revocation, cancel/deny).
3. Deferring remote deployment gates keeps local development agile while ensuring remote D1 remains pristine with zero unverified schema drift.
4. Unblocks Phase 4 local user onboarding, profile provisioning, and roster development without fabricating a production environment.
**Status:** Accepted.

## D-028 — Phase 5 Deterministic Scoring Policy & Versioned Engineering Heuristics
**Decision:** Formalize Astralyn's deterministic recommendation engine under strict mathematical determinism, explicit separation between canonical game facts and engineering heuristics, pure fixed-point integer arithmetic, and locale-independent code-unit tie-breaking.
**Key Tenets:**
1. Scoring parameters (weights, synergy bonuses, anti-synergy deductions) are engineering policy and heuristics, NOT canonical game facts. They are versioned, documented, and explicitly distinct from Tier A official mechanics.
2. Current weights and constants are provisional tuning parameters subject to golden fixture calibration. Weights must never be tuned ad-hoc merely to force a preconceived team ranking.
3. Golden regression tests freeze approved engine behavior across code changes; they do not prove in-game meta truth. Canonical mechanics and reason-code unit tests remain strictly decoupled from ranking regression tests.
4. Pure fixed-point integer math: all weighted contributions use integer multiplication and explicit half-up integer division (`Math.floor((weighted + 50) / 100)`), clamped to `[0, 100]`. Zero floating-point arithmetic is permitted in engine scoring.
5. Deterministic tie-breaking uses code-unit lexical comparison (`<` and `>`), strictly avoiding `String.prototype.localeCompare()` to guarantee identical results across all operating systems, runtimes, and system locales.
6. Zero recommendation persistence: recommendations are computed purely in-memory as derived projections of the live roster and static knowledge snapshots, introducing zero new D1 tables and zero database quota overhead.
**Status:** Accepted.

## D-029 — Phase 6 Deterministic Build Association, Saved Teams Persistence & Truthful Editorial Boundaries
**Decision:** Establish Phase 6 analytical, UI, and persistence contracts:
1. **Truthful Build Association Policy:** Prohibit "Best-in-Slot" (BiS) labels and fabricated numeric ranking hierarchies in the absence of ingested editorial ranking datasets. Because canonical fixtures lack machine-readable signature relationship fields, all compatible light cones are labeled strictly as "Path-Compatible Light Cones" (filtered by character Path restriction `wearer.path === cone.path`). Relic sets are labeled "Mechanically Synergistic Relics" (associated deterministically via shared mechanic tags).
2. **Mode-Neutral Role Taxonomy:** Exclude unverified game mode (MoC/PF/AS) suitability scores and fabricated S/S+/A tiers. Present mode-neutral combat role taxonomies (Sustain, Primary Carry, Amplifier) grounded in canonical tags (`roles`, `path`, `element`) with live owned-roster readiness.
3. **Synergy Engine Reuse:** Teammate synergies on character detail views reuse the exported Phase 5 deterministic recommendation and scoring APIs from `@astralyn/shared` (`packages/shared/src/recommendation/`), preventing divergent or hidden scoring rules.
4. **Truthful Editorial Unavailable State:** Multi-source editorial comparison renders a single consolidated unavailable notice acknowledging that external editorial source ingestion (Prydwen, Game8, Guobie) is scheduled for Phase 8. Do not render fabricated empty 3-source rank cards.
5. **Saved Teams Persistence & Cardinality:** Explicit user-curated team bookmarks (`saved_teams`, `saved_team_members`) are persisted in Cloudflare D1 with an authenticated CRUD API, foreign-key cascade, 1–50 char trimmed name validation, and EXACTLY 4 unique canonical character members (slots 1–4). Schema enforces `PRIMARY KEY(team_id, slot)` and `UNIQUE(team_id, character_id)`. Mutations use D1 atomic batch operations (`db.batch`). In-memory recommendation generation remains strictly zero-persistence per D-028.
6. **Generic Vector Visual Fallback:** Production visual views strictly use generic geometric/silhouette fallback icons (`<GameAssetImage>`), maintaining quarantine of dev-only candidate assets (`usageStatus: "manual_review"`).
**Status:** Accepted.
