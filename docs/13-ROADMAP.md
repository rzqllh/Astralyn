# Astralyn — Roadmap & Phasing Architecture

## Project Phasing Sequence

The implementation of Astralyn follows a strict, sequential 9-phase dependency model. Earlier phases provide architectural contracts and foundational layers required by downstream features.

```text
Phase 0: Tooling & Monorepo Baseline (Verified)
  ↓
Phase 1: Design Tokens & Primitive Foundation (Complete)
  ↓
Phase 1.1: Visual Asset & Design Foundation Closure (Current)
  ↓
Phase 2: Canonical Knowledge Schemas, Static Knowledge Fixtures, Snapshot Contracts, Dexie Client Knowledge Cache
  ↓
Phase 3: Cloudflare Worker, D1, Drizzle ORM, Better Auth Foundation
  ↓
Phase 4: Authentication-Driven Onboarding, Roster Management, User State Synchronization
  ↓
Phase 5: Deterministic Recommendation Engine & Multi-Source Consensus Core
  ↓
Phase 6: Character, Build & Source Comparison Surfaces, Team Recommender
  ↓
Phase 7: Client OCR Pipeline, Divergent Universe Live Decision Assistant
  ↓
Phase 8: Automated Scheduled Ingestion & Knowledge Publishing Pipeline
  ↓
Phase 9: End-to-End Testing, Security, Accessibility Audit, Free-Tier Quota Validation, Production Deployment
```

---

## Detailed Phase Breakdown

### Phase 0 — Tooling & Monorepo Baseline (Verified)
- Node.js LTS + pnpm monorepo workspace (`apps/web`, `apps/worker`, `packages/shared`, `tools/`);
- TypeScript composite project reference configuration (`tsconfig.json`, `tsconfig.base.json`);
- ESLint, Prettier, Vitest, and Playwright baseline test runners.

### Phase 1 — Design Tokens & Primitive Foundation (Complete)
- HSR-native design token system (Cosmic Void surfaces, celestial parchment contrast, astral gold split tokens);
- Headless accessible UI primitives (Radix UI + Tailwind CSS v4);
- Domain component foundations (`CharacterTile`, `RecommendationPanel`, `SourceRankPanel`, `DecisionCard`);
- 8-link locked production navigation contract + developer inspection showcase (`/design-system`).

### Phase 1.1 — Visual Asset & Design Foundation Closure (Current)
- Versioned static game asset architecture (`/game-assets/<release>/...`) decoupled from knowledge domain;
- Data-driven sync pipeline (`tools/sync-assets.ts`) with proven full catalog capability and curated dev snapshot;
- Conservative legal provenance metadata (repository automation license != game artwork copyright);
- Zero runtime third-party hotlinking and resilient vector fallback silhouettes (`<GameAssetImage>`);
- Responsive layout verification at 1440px (desktop companion rail), 768px (tablet reflow), and 390px (dense mobile drawer & stacked components).

### Phase 2 — Canonical Knowledge Foundation
- Strongly typed Zod schemas for all HSR entities (Characters, Light Cones, Relics, Paths, Elements, DU Blessings/Curios/Equations);
- Canonical static knowledge fixtures and snapshot versioning contracts (`/data/<knowledge-version>/...`);
- Client-side IndexedDB caching layer via Dexie for zero-latency local-first reads;
- Immutable knowledge release manifest contracts.

### Phase 3 — Cloudflare Workers, D1 & Better Auth Foundation
- Cloudflare Workers API backend (`apps/worker`);
- Cloudflare D1 (SQLite) relational persistence using Drizzle ORM;
- Better Auth setup with Google OAuth integration;
- Worker-level invariant authorization middleware (`session.user.id`).

### Phase 4 — Authentication, Onboarding & User State
- Authentication-driven onboarding flow;
- User roster selection, light cone ownership, and eidolon level management;
- User state cloud synchronization between IndexedDB local cache and Cloudflare D1 database.

### Phase 5 — Deterministic Recommendation Engine
- Core deterministic recommendation scoring algorithm (role coverage, tag synergy, speed tuning, anti-synergy rules);
- Multi-source weighted consensus calculation (Prydwen, Game8, theorycraft guides);
- Astralyn Verdict synthesis rules with transparent reason codes and confidence weighting;
- Golden recommendation regression test suite.

### Phase 6 — Character, Build & Team Recommender Surfaces
- Character detail views with 3-source side-by-side comparison;
- Best-in-slot build recommendations (Light Cones, Relics, Planar Ornaments, Stat priorities);
- "Best Team From My Roster" personalization engine and teammate synergy evaluator;
- Meta character tier rankings with contextual role and game mode dimensions.

### Phase 7 — Client OCR & Divergent Universe Assistant
- In-browser Web Worker OCR pipeline using PaddleOCR.js / PP-OCRv5;
- Local screenshot processing with zero server-side image upload;
- Real-time Divergent Universe blessing, curio, and equation pick recommender with immediate trade-off analysis.

### Phase 8 — Ingestion & Publishing Pipeline
- Automated scheduled adapters for official HoYoLAB / HSR game updates and approved editorial sources;
- Multi-stage validation, normalization, and consensus precomputation;
- Privileged D1 ingestion and versioned static snapshot builder (`/public/data/<version>/...`).

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
