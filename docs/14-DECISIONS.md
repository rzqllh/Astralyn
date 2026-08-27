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
3. Enforces strict asset provenance and licensing compliance: primary assets derived from community-maintained static archives (e.g. `Mar-7th/StarRailRes` under Fair Use / Fan Content Policy), while maintaining strict exclusion of uncredited art platforms.
4. Guaranteed error resilience: missing or broken asset URLs resolve to high-contrast Astralyn vector silhouettes without layout shift or browser alt-text leakage.  
**Status:** Accepted.

## D-022 — Asset Pipeline Architecture, Conservative Provenance & UI Boundaries
**Decision:** Formalize a three-tier asset architecture (Full Catalog Model, Data-Driven Sync Capability, Curated Dev Snapshot), conservative provenance classification (repository automation license != game artwork ownership), and strict separation between production UI and development/demo fixtures.
**Reason:**
1. Full Catalog support ensures Astralyn scales to all 17 entity types without bloating Git repository size with complete game archives during development.
2. Conservative legal provenance protects the project by distinguishing repository code licenses (e.g. AGPL-3.0) from underlying HoYoverse visual copyrights (© COGNOSPHERE / HoYoverse), classifying uncredited platforms (Pinterest, DeviantArt) as strictly manual-only.
3. Production/Dev boundary guarantees that internal tools (`/design-system`), mock state (`8 Owned`), and sample metrics are never presented to end-users as real persisted engine outputs.  
**Status:** Accepted.
