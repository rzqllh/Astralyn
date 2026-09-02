# Phase 2.5 Production Data Readiness

Status: implementation plan; no Phase 2.5 code has been implemented by this document.  
Executor: Gemini 3.7 Flash High.  
Required runtime for execution and final validation: Node 24.19.x, pnpm 10.20.0.  
Audit baseline: `master` at `98b0085`, inspected 2026-09-02.

## 1. Objective

Make the existing pre-Phase-3 application fail honestly when production data is absent and make synthetic or development data structurally unreachable from the production runtime and build.

The gate is narrow: it closes current production-data integrity gaps. It does not add accounts, persistence, recommendations, OCR, ingestion automation, or product modules.

Production Data Readiness Gate passes only when:

- the production entry graph contains no test or development fixtures;
- Home and the application shell contain no fabricated account, roster, recommendation, source, or gameplay state;
- the current development asset snapshot and its generated placeholders are absent from the production artifact;
- unavailable knowledge, cache, repository, and asset states remain distinguishable from a valid empty result;
- asset tooling never claims a full catalog when it has only a representative snapshot and never writes a generated placeholder as a fetched game asset;
- static production data has an explicit version and provenance path;
- existing test fixtures remain usable inside test/development test infrastructure;
- automated checks fail on a future boundary regression.

## 2. Current Verified State

### Repository and phase

- Workspace packages are `apps/web`, `apps/worker`, and `packages/shared`; root `tools/` contains repository CLIs and is not a pnpm workspace package.
- `apps/web` is React 19 + Vite 8 + TanStack Router + Dexie. `apps/worker` is still a health-only Cloudflare Worker. `packages/shared` owns Zod schemas and shared data contracts.
- Phase 2 knowledge-integrity closure changes are present but uncommitted. Phase 3 dependencies and implementations are absent.
- Current Git baseline is dirty. Before this plan was written, modified files included the Phase 2 release manifests, knowledge loader/syncer/tests, shared release/version contracts, and knowledge tools. Those changes are user work and must be preserved.
- The required engine is Node `>=24.19.0 <25`; the audit shell reports Node `v22.19.0`. Therefore the audit did not make an authoritative full-suite or build claim.

### Canonical knowledge

- `tools/build-knowledge.ts` builds `apps/web/public/data/v1.0.0/**` from `CANONICAL_*` constants.
- The published root and release manifests declare knowledge release `v1.0.0`, game version `4.5`, six required payload files, per-file counts, byte sizes, SHA-256 checksums, a combined source snapshot hash, and minimum app version `0.0.1`.
- Current published counts are 9 characters, 9 light cones, 6 relic sets, 4 enemies, 4 stages, and 7 combined Divergent Universe entities.
- `KnowledgeSnapshotLoader` validates release metadata, raw byte sizes/checksums, schemas, counts, and compatibility before acceptance.
- `KnowledgeCacheSyncer` validates the local Dexie cache and retains only a previously validated cache on update failure.
- None of `apps/web/src/lib/knowledge/**` is currently reachable from `apps/web/src/main.tsx`; Home bypasses the repository and renders `FIXTURE_*` data directly.

### Current production entry graph

A TypeScript AST import walk from `apps/web/src/main.tsx`, excluding type-only imports, found 29 reachable local modules/data files. It includes:

- `apps/web/src/routes/home-view.tsx`;
- `apps/web/src/routes/design-system-view.tsx`;
- `apps/web/src/lib/fixtures.ts`;
- `apps/web/src/lib/assets.ts`;
- `apps/web/public/game-assets/v1.0.0/manifest.json`.

The `/design-system` component returns a not-found state in production, but its static import still places the module and fixtures in the production module graph. A render-time guard is not an import/build boundary.

### Assets and tooling

- The asset manifest declares release `v1.0.0`, game version `3.0.x`, 55 assets, and `usageStatus: "manual_review"` for all 55.
- The sync catalog labels `aventurine-waveflair` as Version 4.5 while `GAME_VERSION` remains `3.0.x`; the emitted manifest has no per-record version field, so it cannot truthfully describe the mixed snapshot's coverage.
- `apps/web/src/lib/assets.ts` imports that manifest synchronously, casts it without Zod runtime validation, and permits every status except `blocked`; consequently all `manual_review` records are eligible.
- Three committed `.png` paths are SVG text produced by `generatePlaceholderSvg()`: `du/blessing_fuli.png`, `du/blessing_annihilation.png`, and `du/curio_rubert.png`.
- `pnpm assets:check` exits 0 for this state because it validates existence, schema, and checksums but not media signatures, production eligibility, or snapshot channel. The command was observed under Node 22.19.0 and is evidence of checker coverage only, not an authoritative Node 24 gate.
- `syncAssets({ fullCatalog: true })` still assigns `REPRESENTATIVE_DEV_SNAPSHOT` to `targets`. Failed discovery requests substitute hard-coded entity counts, and failed asset downloads can generate SVG placeholders that are recorded as downloaded game assets.

### Repository/API truthfulness gaps

- `KnowledgeRepository.initialize()` sets `initialized = true` after every non-throwing sync result, including `status: "unavailable"`.
- Knowledge read hooks catch Dexie/repository failures and return empty arrays or `null` without an error field.
- `SearchResultItem.entityType` advertises eight entity types, while `searchEntities()` searches only characters, light cones, and relic sets.
- Search additionally consumes a hard-coded community/acronym alias catalog that is outside the versioned release and has no per-entry provenance.
- All non-Home product routes are placeholders. They are explicit scheduled/unavailable states rather than fabricated datasets, but their milestone wording is stale and must not be converted into invented content.

### Documented-state mismatches relevant to this gate

- `docs/10-DESIGN.md` and `docs/13-ROADMAP.md` claim proven full-catalog asset capability. `--full` does not perform a full sync.
- `docs/10-DESIGN.md` still cites 51 assets and 8 paths; the manifest has 55 assets and 9 paths.
- `docs/10-DESIGN.md` and D-022 describe a strict production/development fixture boundary; the current static import graph contradicts it.
- `docs/10-DESIGN.md` permits labelled fixture content on Home. The production-data rule in this plan supersedes that behavior: disclosure does not make fabricated production data valid.
- `docs/13-ROADMAP.md` still labels Phase 1.1 as current near its header while its detailed sections mark Phase 1.1 and Phase 2 complete.
- These existing docs are evidence, not Phase 2.5 edit targets. Documentation cleanup is deferred.

## 3. Production Data Policy

### Production Canonical Data

Production canonical data must be immutable, schema-valid, version-owned, provenance-bearing where factual, and published through an integrity-checked manifest.

Repository examples:

- Allowed: `apps/web/public/data/<knowledge-version>/*.json` only after `knowledge:build` and `knowledge:check` agree on schemas, counts, sizes, hashes, release metadata, and app compatibility.
- Allowed source input: `CANONICAL_*` data in `packages/shared/src/knowledge/fixtures/canonical-fixtures.ts`. Despite the historical `fixtures` path, these records are current canonical build inputs with `FactProvenance`; they are not synthetic test fixtures. Do not classify by filename alone.
- Not allowed: treating the nine-record canonical character baseline as a complete player roster or a complete live character catalog. Canonical facts are not user ownership data.

### External Source Data

External data is accepted only after a real successful fetch, source identity check, expected media/content validation, schema validation, and integrity recording. A source URL in a manifest is not proof that the current bytes were fetched from it.

Repository examples:

- `StarRailRes` records may remain development candidates while marked `manual_review`.
- A failed upstream index request must return `unavailable`/non-zero, not guessed counts such as 97 characters or 169 light cones.
- A failed image request must not create an Astralyn SVG and register it as an upstream PNG.

### User Data

Account identity, ownership, level, Eidolon, roster, saved teams, and preferences must come from persisted real user state. No such production data source exists before Phases 3 and 4.

Until then:

- the shell shows an explicit account-unavailable state or no account identity;
- Home shows roster and personalized recommendation modules as unavailable/unsupported;
- canonical characters must never be relabelled as an owned roster;
- values such as `Trailblazer`, `Lv. 80`, `E2`, and `owned` must not be defaulted.

### Test Synthetic Data

Synthetic data is allowed under test infrastructure only, including:

- `apps/web/tests/**`;
- `apps/web/e2e/**` when driving deterministic test states;
- `apps/worker/test/**`;
- `tools/tests/**`;
- dedicated test fixtures referenced only by those paths or by the isolated design-system test entry.

Fake hashes, corrupt snapshots, mock loaders, fake IndexedDB, random test database names, and generated missing-asset samples are valid there. They must not be imported by a production entry graph or copied to production static output.

### Dev-Only Data

Dev-only data must be real development input or test-showcase data, clearly classified and unreachable from the default production entry and public output.

Repository rules:

- the Design System uses a separate development HTML entry, not a production route with a render-time guard;
- the representative asset snapshot lives outside `apps/web/public/**` and outside the production entry graph;
- the default Vite production build must not emit the development HTML, dev snapshot, or dev manifest;
- production modules cannot import from `src/dev/**`, `tests/**`, `e2e/**`, or `tools/tests/**`.

### Forbidden Production Fallbacks

Forbidden:

- `FIXTURE_*`, mock, sample, representative, or generated gameplay/account values rendered on a production route;
- an empty array or `null` returned for a read error without a separate error/unavailable state;
- hard-coded discovery counts substituted for an unavailable external source;
- locally generated bytes registered as externally sourced game assets;
- `manual_review`, `unknown`, or `blocked` assets promoted to a production catalog;
- unversioned aliases, teams, scores, builds, or recommendations treated as canonical;
- replacing absent user data with canonical entities;
- keeping a stale local file after a failed fetch unless its prior manifest, checksum, and content type have been validated and the state is disclosed.

Allowed presentation fallback:

- an Astralyn-owned neutral vector may represent a missing image only when it is not entered in an asset manifest as game art and the UI explicitly says the asset is unavailable.

## 4. Repository Data-Flow Map

### Knowledge flow

```text
Tier-A-grounded CANONICAL_* source constants
  packages/shared/src/knowledge/fixtures/canonical-fixtures.ts
        ↓ schema + provenance + reference validation
  tools/build-knowledge.ts
        ↓ immutable files + counts + sizes + hashes
  apps/web/public/data/manifest.json
  apps/web/public/data/<knowledge-version>/release.json + six payloads
        ↓ raw-byte + schema + release compatibility validation
  KnowledgeSnapshotLoader
        ↓ valid release only
  KnowledgeCacheSyncer
        ↓ atomic Dexie replacement / validated old-cache retention
  AstralynKnowledgeDB
        ↓
  KnowledgeRepository
        ↓
  React knowledge hooks
        ↓
  production UI
```

Current breakpoints:

- the final arrow does not exist; Home imports `apps/web/src/lib/fixtures.ts` instead;
- repository initialization can claim readiness after `unavailable`;
- hooks can collapse read failures into empty data;
- search promises more entity coverage than it performs and reads unversioned aliases.

Phase 2.5 connects only release status metadata to Home. It must not render the representative canonical baseline as a complete catalog or user roster.

### Asset flow

```text
StarRailRes URLs + REPRESENTATIVE_DEV_SNAPSHOT
        ↓ tools/sync-assets.ts
  fetch/discovery
        ↓ currently: guessed counts or generated SVG on failure
  apps/web/public/game-assets/v1.0.0/**
        ↓ manifest cast, non-blocked status accepted
  apps/web/src/lib/assets.ts
        ↓
  GameAssetImage
        ↓
  Home and Design System
```

Required Phase 2.5 flow:

```text
representative/manual-review snapshot
        ↓
  apps/web/src/dev/game-assets/**
        ↓ isolated Design System test entry only
  no default production build edge

future approved production asset release
        ↓ explicit later promotion gate
  versioned production manifest
        ↓ approved/official_fan_use records only
  production asset resolver
```

The future production branch is intentionally absent in Phase 2.5 because no current asset record is approved. Runtime surfaces must show asset unavailable rather than promote the development snapshot.

## 5. Audit Findings

Counts in this section are grouped findings, not raw keyword occurrences: **11 production violations** and **4 harmless test/dev findings**.

| Finding | File / Symbol | Classification | Production Reachable? | Required Action |
|---|---|---|---:|---|
| PV-01: Home renders fabricated roster, account levels, recommendation, DU decision, and editorial comparison data | `apps/web/src/routes/home-view.tsx`; `FIXTURE_*` | D. PRODUCTION VIOLATION | Yes, `/` | Replace with real knowledge release status plus explicit unavailable/unsupported states. Do not render canonical entities as owned roster. |
| PV-02: Global shell renders fabricated `Trailblazer / FIXTURE` account state | `apps/web/src/components/layout/app-shell.tsx` | D. PRODUCTION VIOLATION | Yes, all routes | Remove the identity fiction; render a truthful account-unavailable state or omit identity. |
| PV-03: Design System and its fixtures are statically imported by the production router | `apps/web/src/router.tsx`; `DesignSystemView`; `apps/web/src/lib/fixtures.ts` | D. PRODUCTION VIOLATION | Yes, module graph | Move the showcase to a separate dev HTML entry and remove it from the production route tree/import graph. |
| PV-04: Production-located HSR components import fixture contracts and always present demo semantics | `apps/web/src/components/hsr/**` | D. PRODUCTION VIOLATION | Yes through Home | Quarantine demo-only components with the showcase or replace fixture contracts with production-owned inputs when a real feature exists. Do not create Phase 5/6 components now. |
| PV-05: `--full` still syncs the representative snapshot; discovery substitutes guessed counts | `tools/sync-assets.ts`; `syncAssets`; `discoverUpstreamCatalog` | D. PRODUCTION VIOLATION | Tool can publish runtime files | Make `--full` fail explicitly as unsupported; remove guessed discovery values and false success language. |
| PV-06: failed asset downloads generate synthetic SVG and register it as upstream game art | `generatePlaceholderSvg`; `syncAssets` | D. PRODUCTION VIOLATION | Tool can publish runtime files | Remove generator/fallback publication; fail without writing a release. |
| PV-07: three generated SVGs are committed under `.png` paths and pass integrity checks | `du/blessing_fuli.png`; `du/blessing_annihilation.png`; `du/curio_rubert.png`; `checkAssetIntegrity` | D. PRODUCTION VIOLATION | Yes, public static output | Remove them from the dev manifest and retain them only as clearly named test fixtures if useful; add media-signature validation. |
| PV-08: mixed-version 55-record dev snapshot is in `public`, all records are `manual_review`, and runtime accepts them | asset manifest; `getAssetRecord`; `getAllAssets` | D. PRODUCTION VIOLATION | Yes | Move the snapshot outside `public`; no current record is production eligible. Do not relabel `3.0.x` to `4.5` without verified rebuild evidence. |
| PV-09: repository reports initialized after unavailable sync | `KnowledgeRepository.initialize()` | D. PRODUCTION VIOLATION | Not from current entry; production library path | Set readiness only when a validated active version exists; test all success/failure statuses. |
| PV-10: hooks convert read failures to empty data | `useCharacters`; `useCharacter`; `useLightCones`; `useRelicSets`; `useEntitySearch` | D. PRODUCTION VIOLATION | Not from current entry; production library path | Add explicit error state and keep valid empty results distinguishable. |
| PV-11: unified search exposes eight types, searches three, and uses unversioned aliases | `SearchResultItem`; `searchEntities`; `STRUCTURED_SEARCH_ALIASES` | D. PRODUCTION VIOLATION | Not from current entry; production library path | Search all eight existing tables using versioned entity fields; remove aliases until they have version/provenance ownership. |
| HT-01: synthetic knowledge manifests, loaders, hashes, corrupt bytes, and fake IndexedDB | `apps/web/tests/**` | A. TEST-ONLY | No production import today | Keep. Update only assertions that encode current violations. |
| HT-02: temporary filesystem releases and corrupt benchmark/checker inputs | `tools/tests/**` | A. TEST-ONLY | No | Keep and reuse for fail-closed tool tests. |
| HT-03: E2E/component tests assert visible fixtures | `apps/web/e2e/smoke.spec.ts`; `apps/web/tests/components.test.tsx`; `root.test.tsx` | A. TEST-ONLY | Tests only | Test data may remain, but production assertions must change to truthful states. |
| HD-01: benchmark uses fake IndexedDB and a mock loader around canonical arrays | `tools/benchmark-knowledge.ts` | B. DEV-ONLY | CLI only | Keep. The benchmark is not a runtime data source. |
| PC-01: historically named canonical fixtures are validated build inputs with Tier A provenance | `packages/shared/src/knowledge/fixtures/canonical-fixtures.ts` | C. PRODUCTION CANONICAL | Through build output, not direct UI | Keep; do not move into test infrastructure or reject it by keyword. |
| PC-02: published knowledge release is versioned and integrity checked | `apps/web/public/data/**`; loader/syncer | C. PRODUCTION CANONICAL | Static runtime files; not yet consumed by UI | Keep unchanged except deterministic regeneration required by existing Phase 2 gates. |
| DF-01: seven non-Home product routes are placeholders | `PlaceholderView`; route definitions in `router.tsx` | E. DEFERRED | Yes | Keep as explicit unsupported states; make wording phase-agnostic. Do not invent feature data. |
| DF-02: automated ingestion, approved production asset promotion, and full catalog breadth do not exist | roadmap Phases 8/9 | E. DEFERRED | No | Do not implement. Phase 2.5 quarantines unavailable data instead. |

## 6. Success Criteria

1. A runtime import-graph test starting from `apps/web/src/main.tsx` finds no path into test fixtures, `src/dev/**`, Design System code, or representative asset data.
2. Default `pnpm build` emits neither the development Design System entry nor the representative asset snapshot.
3. Home contains no hard-coded gameplay entity, owned roster, level/Eidolon, score, build/team, editorial source, or DU choice data.
4. Home visibly distinguishes loading, validated current/cache-backed knowledge, rejected-update-with-valid-cache, and unavailable knowledge.
5. Account, roster, recommendation, and unimplemented route states are explicit unavailable/unsupported states.
6. Repository `isInitialized()` is false whenever no validated active knowledge version exists.
7. Every read hook exposes an error distinct from a valid empty result.
8. Unified search returns results from all eight existing Dexie entity stores and consumes no unversioned alias catalog.
9. `assets:sync --full` exits non-zero with a precise unsupported message and writes nothing.
10. External discovery failure produces unavailable/non-zero, never a guessed count.
11. Asset download failure produces no generated game asset and no published manifest entry.
12. Asset checks reject SVG text stored under `.png` paths and reject any attempt to treat the development snapshot as a production release.
13. The 52 non-placeholder `manual_review` assets remain usable only by the isolated development/test asset harness.
14. The three generated placeholders, if retained, exist only under test fixtures with truthful `.svg` names.
15. Existing canonical knowledge release files and Phase 2 behavior remain unchanged after deterministic rebuild/check.
16. Lint, typecheck, unit/tool tests, knowledge checks, build, production-data checker, and E2E pass under Node 24.19.x.
17. No dependency, lockfile, worker, D1, auth, roster persistence, OCR, recommendation engine, or new product surface change occurs.

## 7. Scope

### In Scope

- production/test/dev import and build boundaries;
- Home and shell removal of fabricated data;
- phase-agnostic explicit unsupported route copy;
- repository initialization truthfulness;
- hook error states;
- existing eight-table search truthfulness and removal of unversioned aliases;
- representative asset snapshot quarantine;
- generated placeholder isolation;
- fail-closed asset sync/discovery/check tooling;
- boundary and build regression checks using installed tooling;
- updates to tests that currently require production fixtures.

### Out of Scope

- D1, Drizzle, Better Auth, OAuth, sessions, onboarding, or roster persistence;
- real account/roster data or a guest roster;
- recommendation scoring, source consensus ingestion, team generation, or DU decision logic;
- OCR, screenshot upload, or entity matching UI;
- full asset catalog implementation or speculative game-version relabelling;
- new canonical gameplay facts or edits to the current release payload;
- scheduled external ingestion and publishing;
- new product pages or a UI redesign;
- dependency installation;
- updates to `docs/00-README.md` through `docs/14-DECISIONS.md` or `CONTEXT.md`.

## 8. Technical Decisions

### Decision 1 — Truthful Home status, not a substitute roster

- **Decision:** Home consumes only knowledge synchronization metadata and renders unavailable states for account-dependent or engine-dependent modules.
- **Reasoning:** The canonical nine-character baseline is factual data, not the user's roster and not proof of complete catalog breadth.
- **Existing architecture reused:** `useKnowledgeInit`, `KnowledgeSyncResult`, `Skeleton`, `EmptyState`, `Panel`.
- **Trade-off:** Home is less visually dense until later phases, but every visible state is true.

### Decision 2 — Separate dev entry instead of a guarded production route

- **Decision:** Move the Design System to `design-system.html` with a dedicated dev entry; remove its route and import from `router.tsx`.
- **Reasoning:** `import.meta.env.DEV` inside a statically imported component protects rendering, not module reachability.
- **Existing architecture reused:** Vite's native multi-page dev serving, React root, existing providers and showcase.
- **Trade-off:** The dev URL changes; production `/design-system` remains a normal not-found route.

### Decision 3 — Quarantine demo components; do not prematurely productionize them

- **Decision:** Move the four fixture-shaped HSR showcase components and their data under the dev/test harness.
- **Reasoning:** Their current contracts encode fabricated ownership and recommendation output. Designing final Phase 5/6 contracts now would exceed this closure.
- **Existing architecture reused:** Components and tests remain available to the isolated Design System.
- **Trade-off:** Later product phases must introduce production-owned domain component contracts deliberately.

### Decision 4 — Existing status objects remain the failure contract

- **Decision:** Reuse `KnowledgeSyncResult`; add only `Error | null` to read hooks and correct `isInitialized()`.
- **Reasoning:** A provider/state framework is unnecessary. The current status machine already distinguishes valid cache, rejected update, and unavailable.
- **Existing architecture reused:** `KnowledgeCacheSyncer`, Dexie repository, React hooks.
- **Trade-off:** Individual hooks retain their current shapes instead of a new generic query abstraction.

### Decision 5 — Search only version-owned entity fields

- **Decision:** Complete search across all eight existing tables using IDs, names, localized names where available, and typed entity metadata. Remove `STRUCTURED_SEARCH_ALIASES`/`CANONICAL_ALIASES` from runtime search.
- **Reasoning:** Implementing existing table coverage is smaller and more truthful than advertising unsupported types. Current aliases have no release/provenance owner.
- **Existing architecture reused:** `normalizeSearchString`, Dexie stores, `SearchResultItem`.
- **Trade-off:** Community shorthand matches regress until a later versioned alias dataset is sourced and published.

### Decision 6 — Quarantine the asset snapshot; do not promote it

- **Decision:** Move the 52 real-format `manual_review` files and their corrected dev manifest from `apps/web/public` to `apps/web/src/dev/game-assets`; retain the three generated SVGs only as named test fixtures if still useful.
- **Reasoning:** No current record is production-approved, the manifest version is mixed/incoherent, and the release includes generated stand-ins. Relabelling would invent approval/version truth.
- **Existing architecture reused:** existing manifest schema, dev asset resolver, Design System, integrity checker.
- **Trade-off:** Production displays no game artwork in Phase 2.5. That is an allowed unavailable state.

### Decision 7 — Disable false full sync instead of implementing Phase 8 early

- **Decision:** `--full` fails unsupported and writes nothing. Default sync is explicitly development-snapshot only.
- **Reasoning:** A genuine full-catalog mapper does not exist and building one is automated-ingestion scope.
- **Existing architecture reused:** current CLI and discovery functions after removing guessed fallbacks.
- **Trade-off:** The CLI exposes less capability but tells the truth.

### Decision 8 — Structural checks, not keyword policing

- **Decision:** Enforce import roots, production entry reachability, asset location/status/media validity, and built artifact contents. Do not reject files merely because their names contain `fixture` or text contains `fallback`.
- **Reasoning:** Canonical build inputs and legitimate tests use those words.
- **Existing architecture reused:** TypeScript compiler API, ESLint, Node `fs`, Vitest/node:test, Vite build.
- **Trade-off:** The checker has a small maintained list of production entries and forbidden directory boundaries.

## 9. Implementation File Map

| File | Symbol / Area | Required Change | Reason |
|---|---|---|---|
| `apps/web/design-system.html` (create) | dev HTML entry | Load the dedicated dev React entry; not a production Rollup input | Structural dev boundary |
| `apps/web/src/dev/design-system-main.tsx` (create) | dev root | Mount providers and showcase | Preserve dev inspection without router import |
| `apps/web/src/routes/design-system-view.tsx` | entire file | Move to `apps/web/src/dev/design-system-view.tsx` | Remove route semantics/production graph |
| `apps/web/src/lib/fixtures.ts` | all `FIXTURE_*` | Move to `apps/web/tests/fixtures/ui-fixtures.ts` | Synthetic data stays in test infrastructure |
| `apps/web/src/components/hsr/character-tile.tsx` | entire file | Move under `apps/web/src/dev/components/hsr/` | Fixture-shaped visual harness only |
| `apps/web/src/components/hsr/recommendation-panel.tsx` | entire file | Move under dev components | Do not productionize Phase 5 output |
| `apps/web/src/components/hsr/source-rank-panel.tsx` | entire file | Move under dev components | Do not productionize editorial samples |
| `apps/web/src/components/hsr/decision-card.tsx` | entire file | Move under dev components | Do not productionize Phase 7 output |
| `apps/web/src/router.tsx` | imports, `designSystemRoute`, `PlaceholderView` | Remove dev route; make placeholders explicitly unavailable and phase-agnostic | Production route truthfulness |
| `apps/web/src/components/layout/app-shell.tsx` | dev link; identity chip | Link dev HTML only in dev; remove fabricated account identity | No fake account state |
| `apps/web/src/routes/home-view.tsx` | entire data/render path | Replace fixtures with release status and unsupported states | No fabricated user/game/recommendation data |
| `apps/web/src/lib/knowledge/repository.ts` | `initialize`, `SearchResultItem`, `searchEntities` | Correct readiness; search all stores from canonical fields | Truthful repository behavior |
| `apps/web/src/lib/knowledge/search.ts` | alias constants | Retain normalization; remove unversioned aliases | No unowned static data |
| `apps/web/src/lib/knowledge/use-knowledge.ts` | all hooks | Expose explicit errors; preserve valid empty state | No silent error-to-empty conversion |
| `apps/web/src/lib/assets.ts` | entire file | Move to `apps/web/src/dev/assets.ts`; point only at dev manifest | No production resolver for unapproved data |
| `apps/web/src/components/ui/game-asset-image.tsx` | entire file | Move to dev component area; make missing state explicit | Current asset component is dev-only |
| `apps/web/public/game-assets/v1.0.0/**` | manifest + 55 files | Move 52 real-format candidates to `apps/web/src/dev/game-assets/v1.0.0/**`; remove all game assets from public | Default build cannot ship dev snapshot |
| `apps/web/public/game-assets/v1.0.0/du/blessing_fuli.png` | generated SVG | Move/rename to test fixtures only if retained | Synthetic asset cannot masquerade as PNG |
| `apps/web/public/game-assets/v1.0.0/du/blessing_annihilation.png` | generated SVG | Move/rename to test fixtures only if retained | Same |
| `apps/web/public/game-assets/v1.0.0/du/curio_rubert.png` | generated SVG | Move/rename to test fixtures only if retained | Same |
| `tools/sync-assets.ts` | paths, discovery, fallback, CLI | Dev-only output; no guessed counts/placeholders; `--full` unsupported | Fail closed |
| `tools/check-assets.ts` | `checkAssetIntegrity` | Check dev channel explicitly and validate media signatures | Current checker gives false PASS |
| `apps/web/tests/assets.test.tsx` | asset resolver/component tests | Point to dev/test harness; assert explicit unavailable behavior | Preserve tests without production dependency |
| `apps/web/tests/knowledge-interop.test.ts` | manifest path/assertions | Reclassify as dev snapshot interoperability test | No production coverage claim |
| `apps/web/tests/components.test.tsx` | imports and shell assertions | Use test fixtures/dev components; remove production fixture expectations | Test isolation |
| `apps/web/tests/root.test.tsx` | Home and Design System assertions | Test truthful Home; test dev showcase outside production router | Runtime truthfulness |
| `apps/web/tests/knowledge-cache.test.ts` | repository initialization/search cases | Add unavailable initialization and eight-store search coverage | Repository regressions |
| `apps/web/tests/knowledge-hooks.test.tsx` (create) | hook error tests | Distinguish failure from valid empty data | Hook regression |
| `apps/web/tests/production-data-boundary.test.ts` (create) | source graph | Verify forbidden roots are unreachable from production entries | Automatic import boundary |
| `apps/web/e2e/smoke.spec.ts` | Home/shell assertions | Remove fixture assertions; assert explicit runtime states | Browser proof |
| `apps/web/e2e/a11y.spec.ts` | Design System case | Keep production `/design-system` as not-found; audit new Home states | Preserve accessibility gate |
| `tools/tests/asset-pipeline.test.ts` (create) | CLI/discovery/download failures | Prove non-zero/no-write behavior and media checks | Tool regression |
| `tools/check-production-data.ts` (create) | repository/build checker | Check production entries, public roots, and `dist` exclusions | Production gate |
| `tools/tests/production-data-check.test.ts` (create) | checker fixtures | Prove forbidden graph/artifact cases fail | Checker reliability |
| `eslint.config.mjs` | production-source override | Restrict direct imports from test/dev roots | Fast local feedback |
| `package.json` | scripts | Integrate tool tests/checker into existing `test` and `build` gates | Automatic regression prevention |

Files under `packages/shared/src/knowledge/**`, `apps/web/public/data/**`, and the current Phase 2 closure changes are read-only for this phase unless a task-specific test import requires a non-behavioral adjustment. Any canonical payload change is a stop condition.

## 10. Implementation Tasks

### Task 1 — Isolate the Design System and UI fixtures

**Goal**

Remove Design System/test data from the production route graph while preserving the visual harness.

**Files**

- `apps/web/design-system.html` (create)
- `apps/web/src/dev/design-system-main.tsx` (create)
- `apps/web/src/routes/design-system-view.tsx` → `apps/web/src/dev/design-system-view.tsx`
- `apps/web/src/lib/fixtures.ts` → `apps/web/tests/fixtures/ui-fixtures.ts`
- `apps/web/src/components/hsr/*.tsx` → `apps/web/src/dev/components/hsr/*.tsx`
- `apps/web/src/router.tsx`
- `apps/web/src/components/layout/app-shell.tsx`
- `apps/web/tests/components.test.tsx`
- `apps/web/tests/root.test.tsx`

**Changes**

1. Preserve current showcase fixtures verbatim in the test fixture destination; do not reinterpret any values as real data.
2. Move the four demo domain components and `DesignSystemView` under `src/dev` and repair imports only.
3. Create a dedicated dev React root wrapping the showcase in its existing toast/tooltip providers and importing `index.css`.
4. Add `design-system.html` for Vite development serving. Do not add it to production Rollup inputs.
5. Delete the `DesignSystemView` static import and `designSystemRoute` from `router.tsx`.
6. In development only, use a normal anchor from `AppShell` to `/design-system.html`. Production must render no link.
7. Test the showcase directly through its dev entry/component; do not re-add it to `createAppRouter()` for tests.

**Production Data Rule**

Synthetic showcase state may exist only in isolated test/dev-test paths and may not be reachable from `src/main.tsx`.

**Do not**

- Do not redesign the components.
- Do not replace sample values with canonical values and call them production data.
- Do not add a second production router.

**Validation**

- `pnpm --filter @astralyn/web exec vitest run tests/components.test.tsx tests/root.test.tsx`
- `rg -n "DesignSystemView|lib/fixtures" apps/web/src/router.tsx apps/web/src/main.tsx apps/web/src/App.tsx` must return no match.

**Done when**

The showcase still runs from its dev HTML entry, while the production router has no import or route edge to it.

### Task 2 — Make repository readiness and search truthful

**Goal**

Ensure repository state and search results represent only validated data actually read from all existing stores.

**Files**

- `apps/web/src/lib/knowledge/repository.ts`
- `apps/web/src/lib/knowledge/search.ts`
- `apps/web/tests/knowledge-cache.test.ts`

**Changes**

1. Write tests for `unavailable` initialization and one match from each of the eight stores before changing implementation.
2. Set `initialized` true only when `KnowledgeSyncResult` has a non-null validated `activeKnowledgeVersion` and status is one of `fresh`, `updated`, `offline_cache_active`, or `update_rejected_previous_retained`.
3. Leave it false on `unavailable` and on thrown sync errors.
4. Extend `searchEntities()` to characters, light cones, relic sets, enemies, stages, DU blessings, DU equations, and DU curios.
5. Apply the existing exact/prefix/contains scoring consistently to normalized `id` and `name`; include localized character names because they are inside the release.
6. Return the already-declared entity type and available typed metadata for each result. Do not synthesize missing metadata.
7. Remove runtime use and exports of `STRUCTURED_SEARCH_ALIASES` and `CANONICAL_ALIASES`. Keep `normalizeSearchString`.
8. Replace old alias-match tests with canonical-field and eight-store coverage. A query with no canonical match is a valid empty result.

**Production Data Rule**

Search uses only records loaded from the validated versioned release; no unversioned community alias map supplies application data.

**Do not**

- Do not add Fuse.js integration, a search UI, or a generic indexing framework.
- Do not add alias provenance fields or edit canonical payloads in this phase.
- Do not mark initialization successful merely because `sync()` resolved.

**Validation**

- `pnpm --filter @astralyn/web exec vitest run tests/knowledge-cache.test.ts`

**Done when**

No unavailable repository is initialized, and every advertised search entity type is backed by a tested store query.

### Task 3 — Expose knowledge hook failures

**Goal**

Make read failure, loading, no match, and valid empty data distinct to every hook consumer.

**Files**

- `apps/web/src/lib/knowledge/use-knowledge.ts`
- `apps/web/tests/knowledge-hooks.test.tsx` (create)

**Changes**

1. Add `error: Error | null` to `useKnowledgeInit`, `useCharacters`, `useCharacter`, `useLightCones`, `useRelicSets`, and `useEntitySearch` results.
2. Reset error at the start of each request and after successful resolution.
3. Preserve existing named data fields to avoid a generic query abstraction.
4. On rejection, clear stale data, preserve the correct empty value, set the normalized `Error`, and end loading.
5. For initialization, preserve the full `KnowledgeSyncResult`; `status: "unavailable"` is a handled unavailable result, while a thrown failure also populates `error`.
6. Add tests for a valid empty response, a rejected read, an unavailable sync result, and a thrown initialization failure.

**Production Data Rule**

An empty collection is valid only when the read succeeded. Failure cannot masquerade as an empty real dataset.

**Do not**

- Do not add React Query, Suspense, context providers, retries, or new dependencies.
- Do not manufacture cached results in a catch block.

**Validation**

- `pnpm --filter @astralyn/web exec vitest run tests/knowledge-hooks.test.tsx`
- `pnpm --filter @astralyn/web exec vitest run tests/knowledge-cache.test.ts`

**Done when**

Every hook has a tested error channel and valid-empty/error states cannot be confused.

### Task 4 — Replace fabricated production UI with explicit states

**Goal**

Make Home, shell identity, and placeholder routes honest without implementing later-phase features.

**Files**

- `apps/web/src/routes/home-view.tsx`
- `apps/web/src/components/layout/app-shell.tsx`
- `apps/web/src/router.tsx`
- `apps/web/tests/root.test.tsx`
- `apps/web/tests/components.test.tsx`
- `apps/web/e2e/smoke.spec.ts`
- `apps/web/e2e/a11y.spec.ts`

**Changes**

1. Remove every `FIXTURE_*`, demo HSR component, game asset, selected character, and fake toast path from Home.
2. Call `useKnowledgeInit()` once and render:
   - loading: existing skeleton/progress presentation;
   - `fresh` or `updated`: release/game version and cache timestamp from the real result;
   - `offline_cache_active`: real cached metadata plus an offline warning;
   - `update_rejected_previous_retained`: real retained version plus a rejection warning;
   - `unavailable` or thrown error: explicit Knowledge Unavailable state and safe error summary.
3. Add static unsupported states for account/roster, personalized recommendations, source consensus, and DU assistance. These cards contain no game entities, scores, or implied user state.
4. Remove `Trailblazer` and `FIXTURE` from the global header. Use `Account unavailable` only if a visible header state is needed; otherwise omit the chip.
5. Change `PlaceholderView` copy to `Unavailable in this build`/equivalent and remove stale phase promises. Keep all seven feature routes as placeholders.
6. Update unit/E2E assertions to prove fixture strings and sample gameplay values are absent and each unavailable state is visible.

**Production Data Rule**

No production UI may infer account, roster, recommendation, or gameplay state from fixtures or canonical reference entities.

**Do not**

- Do not create guest/local roster state.
- Do not display all nine canonical characters as a catalog or owned roster.
- Do not implement any placeholder feature or redesign navigation.
- Do not expose raw stack traces or internal errors.

**Validation**

- `pnpm --filter @astralyn/web exec vitest run tests/root.test.tsx tests/components.test.tsx tests/knowledge-hooks.test.tsx`
- `rg -n "FIXTURE_|Trailblazer|Sample Output|Demo Output" apps/web/src/routes/home-view.tsx apps/web/src/components/layout/app-shell.tsx` must return no match.

**Done when**

Every production surface uses real release metadata or an explicit unavailable/unsupported state, with no fabricated data.

### Task 5 — Quarantine the current asset snapshot

**Goal**

Remove all representative/manual-review and generated asset data from production static output while retaining useful development/test evidence.

**Files**

- `apps/web/public/game-assets/v1.0.0/**`
- `apps/web/src/dev/game-assets/v1.0.0/**` (create by relocation)
- `apps/web/tests/fixtures/assets/**` (create only if retaining generated placeholders)
- `apps/web/src/lib/assets.ts` → `apps/web/src/dev/assets.ts`
- `apps/web/src/components/ui/game-asset-image.tsx` → `apps/web/src/dev/components/game-asset-image.tsx`
- `apps/web/src/dev/design-system-view.tsx`
- `apps/web/src/dev/components/hsr/character-tile.tsx`
- `apps/web/tests/assets.test.tsx`
- `apps/web/tests/knowledge-interop.test.ts`

**Changes**

1. Obtain the manual relocation gate in Section 18 before moving tracked binaries.
2. Identify files by media signature, not extension. Preserve the 52 PNG-signature files in the dev snapshot; this does not grant production approval.
3. Remove the three generated SVG records from the dev asset manifest. If useful for fallback tests, move them to `apps/web/tests/fixtures/assets/` and rename with `.svg`; otherwise request explicit deletion approval.
4. Move the corrected dev manifest and its 52 candidates under `apps/web/src/dev/game-assets/v1.0.0/` and update only dev-local paths.
5. Move the resolver and image component under `src/dev`, repair showcase/tests imports, and label its missing/error rendering as `Asset unavailable` both visually and accessibly.
6. Remove `apps/web/public/game-assets/**` completely. Do not create an empty or falsely versioned production asset release.
7. Reframe interoperability tests as development-snapshot tests. They may verify IDs, checksums, and schema, but must not claim production eligibility or complete coverage.

**Production Data Rule**

`manual_review` and generated assets cannot exist in production public roots or production import graphs. Missing production art is an explicit unavailable state.

**Do not**

- Do not change any `usageStatus` to `approved` or `official_fan_use`.
- Do not change `gameVersion` to `4.5` by assumption.
- Do not download replacements manually or invent provenance.
- Do not remove useful synthetic fixtures without the manual gate.

**Validation**

- `pnpm --filter @astralyn/web exec vitest run tests/assets.test.tsx tests/knowledge-interop.test.ts`
- `Test-Path apps/web/public/game-assets` must print `False`.
- A media-signature inventory of `apps/web/src/dev/game-assets/v1.0.0/**` must report 52 PNG and 0 SVG/other files.

**Done when**

The default production public root has no dev asset snapshot, all current manual-review art is dev-only, and generated stand-ins are test-only or explicitly removed.

### Task 6 — Make asset tooling fail closed

**Goal**

Ensure asset sync/discovery/check commands tell the truth and cannot recreate the violation.

**Files**

- `tools/sync-assets.ts`
- `tools/check-assets.ts`
- `tools/tests/asset-pipeline.test.ts` (create)
- `package.json`

**Changes**

1. Write deterministic tests using temporary directories and injected fetch responses before changing behavior.
2. Change the default output root to the dev snapshot location from Task 5 and label all output `DEVELOPMENT SNAPSHOT`.
3. Remove `ASSET_CATALOG`, `generatePlaceholderSvg`, guessed discovery counts, and false `verified/full` banners.
4. Make `--full` return a non-zero exit code with `Full production asset sync is unsupported` and perform zero writes.
5. Represent each unavailable upstream index explicitly. No failed fetch may become a numeric discovered count.
6. On any required download failure, reject the sync and do not write a new manifest. If preserving a prior local file is retained, accept it only after its previous manifest checksum and expected media signature pass; disclose reuse in the result.
7. Stage a dev sync and publish its manifest only after every selected target succeeds, so a partial attempt is not reported as a completed snapshot.
8. Update `checkAssetIntegrity()` to verify extension/media signature, checksum, path containment, and development channel wording. It must reject SVG-as-PNG.
9. Export CLI runners that return an exit code; direct invocation assigns `process.exitCode`.
10. Add tests for `--full`, unavailable discovery, failed download with no valid prior file, valid prior-file reuse if supported, SVG-as-PNG, path traversal, and successful 1–2 item dev sync.

**Production Data Rule**

Tool failure must remain failure. The tool may not fabricate source results, asset bytes, catalog completeness, or production status.

**Do not**

- Do not implement dynamic full-catalog mapping.
- Do not call live upstream services in tests.
- Do not add a package or weaken existing checksum checks.
- Do not write to `apps/web/public/**`.

**Validation**

- `pnpm exec tsx --test tools/tests/asset-pipeline.test.ts`
- `pnpm assets:check`
- `pnpm assets:sync -- --full` must exit non-zero and leave `git status --short` unchanged.

**Done when**

No asset command can turn unavailable external data or a representative snapshot into an apparent production catalog.

### Task 7 — Automate the production-data boundary gate

**Goal**

Prevent fixture, dev asset, and test-helper regressions without fragile global keyword scans.

**Files**

- `apps/web/tests/production-data-boundary.test.ts` (create)
- `tools/check-production-data.ts` (create)
- `tools/tests/production-data-check.test.ts` (create)
- `eslint.config.mjs`
- `package.json`

**Changes**

1. Build a small TypeScript-AST dependency walk from the real production entries: `apps/web/src/main.tsx` and `apps/worker/src/index.ts`.
2. Ignore type-only imports for bundle reachability, but separately reject direct production-source imports from `tests/**`, `e2e/**`, `tools/tests/**`, and `apps/web/src/dev/**` including type-only imports.
3. Fail when the web production graph reaches the dev Design System, UI fixture module, dev asset resolver, or dev asset manifest.
4. Check production static roots: `apps/web/public/**` may contain the validated knowledge release, but must not contain the quarantined representative asset snapshot or generated placeholders.
5. In `--dist` mode, fail if the default build emits `design-system.html`, `game-assets/**`, or a module traced to a forbidden dev/test source.
6. Add narrow ESLint `no-restricted-imports` rules for production web/worker source; exclude `src/dev/**` from that production override.
7. Add `production-data:check` and `test:production-data` scripts. Include tool tests in `pnpm test`; make root `pnpm build` run the checker in `--dist` mode after workspace builds.
8. Test the checker with temporary miniature graphs/artifacts. Include positive cases proving test fixtures are allowed and the canonical `packages/shared/src/knowledge/fixtures` name is not rejected merely by keyword.

**Production Data Rule**

Production/test isolation is proven by dependency and artifact boundaries, not by conventions or disclosure labels.

**Do not**

- Do not scan all source text for words such as `fixture`, `fallback`, `sample`, or `mock`.
- Do not reject canonical knowledge because its historical source path contains `fixtures`.
- Do not add a dependency graph package.

**Validation**

- `pnpm test:production-data`
- `pnpm production-data:check`
- `pnpm lint`
- `pnpm build`
- `pnpm production-data:check -- --dist`

**Done when**

Known forbidden imports/public files/build artifacts fail tests, legitimate test/canonical data passes, and the checks run through normal root gates.

### Task 8 — Run the integrated readiness gate

**Goal**

Prove Phase 2.5 without broadening scope or mutating canonical facts.

**Files**

- No new implementation files. Inspect the complete Phase 2.5 diff and the pre-existing dirty baseline.

**Changes**

1. Switch to Node 24.19.x.
2. Run Section 14 in order, stopping at the first non-zero result.
3. Compare `apps/web/public/data/**` after `knowledge:build` to the captured baseline. Any semantic payload change stops execution.
4. Inspect the production source dependency report and `apps/web/dist` contents.
5. Confirm the only moved gameplay binaries are the audited dev asset snapshot and three generated placeholders.
6. Confirm no dependency/lockfile, worker behavior, Phase 3 file, or unrelated user change was altered.

**Production Data Rule**

The gate is complete only with direct evidence that production paths fail visibly and contain no synthetic/dev data.

**Do not**

- Do not waive a failing command.
- Do not fix unrelated failures or rewrite existing docs.
- Do not run a real full asset sync or source data from memory.
- Do not commit or push unless separately requested.

**Validation**

- Every command and inspection in Section 14.

**Done when**

Every Section 17 checkbox has command, test, graph, manifest, artifact, or diff evidence.

## 11. Runtime Data Failure Matrix

| Condition | Required Runtime Behavior |
|---|---|
| Root canonical manifest unavailable; validated cache exists | Return `offline_cache_active`; show cached version/time and offline warning; use only validated cache. |
| Root canonical manifest unavailable; no validated cache | Return `unavailable`; `isInitialized()` stays false; show Knowledge Unavailable. |
| Current release corrupt/incompatible; validated old cache exists | Return `update_rejected_previous_retained`; show retained version plus rejection warning. |
| Current release corrupt/incompatible; no validated cache | Return `unavailable`; show error; never load partial entities. |
| Dexie/cache open or read failure | Hook returns `error`; UI shows unavailable/error, not a successful empty dataset. |
| Repository unavailable | Reads do not imply readiness; consumer receives explicit unavailable/error. |
| Valid query returns zero records | Successful empty state with `error: null`; no example entities inserted. |
| Supported entity exists in any of eight stores | Unified search can return it with its real entity type and canonical fields. |
| Unsupported entity type/request | Reject at the typed/schema boundary or show unsupported; never return an invented generic entity. |
| Account/roster unavailable | Show account/roster unavailable; never create Guest/Trailblazer ownership, levels, or Eidolons. |
| Recommendation/source/DU engine unavailable | Show unsupported/unavailable; never render a sample verdict, score, source matrix, or choice. |
| Production asset release absent | Do not request dev snapshot; show explicit asset-unavailable state where an image slot exists. |
| Asset ID missing or image decode fails | Render neutral Astralyn UI fallback labelled `Asset unavailable`; do not register it as game art. |
| Asset status is `manual_review`, `unknown`, or `blocked` | Never expose it through production catalog/resolver. |
| External source discovery unavailable | Tool returns unavailable/non-zero; no guessed counts or success banner. |
| External asset download unavailable | Sync fails without publishing; optional prior-file reuse requires verified prior manifest/hash/media and explicit disclosure. |
| `--full` requested before a real mapper exists | Tool exits non-zero as unsupported and writes nothing. |

## 12. Test Isolation Strategy

1. Keep deterministic synthetic knowledge and corrupt-data cases in `apps/web/tests/**` and `tools/tests/**`.
2. Move Home/Design System UI data into `apps/web/tests/fixtures/ui-fixtures.ts`; only test files and the isolated dev showcase may import it.
3. Keep generated missing-asset SVGs only in test fixtures with `.svg` extensions if they provide useful coverage.
4. Keep the 52 real-format but non-approved asset candidates under `apps/web/src/dev/game-assets/**`; they are development data, not test claims or production data.
5. Remove the dev showcase from `createAppRouter()` and production `index.html` dependency graph.
6. Enforce direct-import restrictions with ESLint and transitive runtime reachability with the TypeScript-AST checker.
7. Verify the default build artifact does not contain the dev HTML or dev asset tree.
8. Run the normal production build without test/dev assets available in `public`; successful build is required.
9. Do not use a global keyword denylist. Tests and canonical build inputs legitimately contain `fixture`, `mock`, `fallback`, and `representative`.

## 13. Production Data Regression Checks

| Existing capability | Phase 2.5 use |
|---|---|
| TypeScript | Parse imports for a small dependency walk; keep strict compile checks. |
| ESLint | Reject direct production imports from dev/test roots. |
| Vitest | Test repository statuses, hook errors, Home states, and web import boundaries. |
| `node:test` + `tsx` | Test asset and production-data CLIs with temporary directories. |
| `knowledge:check` | Preserve canonical release integrity and provenance gates. |
| `assets:check` | Validate only the quarantined dev snapshot; add media signature/path checks and honest labelling. |
| Vite build | Produce the artifact inspected by `production-data:check --dist`. |
| Playwright | Prove user-visible production states and `/design-system` not-found behavior. |

The production checker must fail on structural evidence:

- a forbidden import edge;
- a forbidden source node reachable from a production entry;
- dev/test data under a production public root;
- forbidden dev output in `dist`;
- invalid asset media signature or publication channel.

It must not fail merely because a valid test or canonical source file contains a suspicious word.

## 14. Validation Sequence

Run from repository root under Node 24.19.x. Every step is blocking. The baseline script names below were confirmed in the current packages. `production-data:check` is created by Task 7; confirm that new script exists in `package.json` before running steps 3 and 16.

1. `node --version`
   - Required: `v24.19.x` and `<25`.
2. `pnpm --version`
   - Required: `10.20.0` or another version satisfying `>=10.0.0`.
3. `pnpm production-data:check`
4. `pnpm --filter @astralyn/web exec vitest run tests/production-data-boundary.test.ts tests/knowledge-hooks.test.tsx tests/root.test.tsx tests/components.test.tsx tests/assets.test.tsx tests/knowledge-interop.test.ts tests/knowledge-cache.test.ts`
5. `pnpm exec tsx --test tools/tests/asset-pipeline.test.ts tools/tests/production-data-check.test.ts`
6. `pnpm typecheck`
7. `pnpm lint`
8. `pnpm test`
9. `pnpm knowledge:build`
10. `git diff -- apps/web/public/data`
    - Stop if the canonical entity payload or release meaning differs from the captured Phase 2 baseline. Deterministic formatting-only output still requires explanation.
11. `pnpm knowledge:check`
12. `pnpm knowledge:benchmark`
13. `pnpm assets:check`
    - Output must say development snapshot; it is not a production approval gate.
14. `pnpm format:check`
15. `pnpm build`
    - Root build must invoke `production-data:check --dist` after workspace builds.
16. `pnpm production-data:check -- --dist`
17. `pnpm test:e2e`
18. `git diff --check`
19. `git status --short --untracked-files=all`
20. Inspect `git diff --stat` and the full diff against the captured baseline. Stop on any file outside Section 9 or on any lost pre-existing change.

Do not use the audit's Node 22 `assets:check` result as final evidence.

## 15. Risks

| Risk | Mitigation |
|---|---|
| Existing dirty Phase 2 work overlaps repository/hook/test/package files | Capture hashes/status first; commit/stash only by owner choice; stop before overwriting unknown hunks. |
| Canonical nine-character release is mistaken for complete catalog/user roster | Home shows release metadata only; tests prohibit owned roster/entity samples. |
| Dev HTML accidentally becomes a production Rollup input | Source graph and `dist` checker both enforce absence. |
| Vite still emits dynamically referenced dev assets | Keep them outside `public`; inspect `dist` structurally. |
| Asset relocation loses tracked files | Use `git mv` only after manual approval; compare the exact 55-asset-plus-manifest inventory and hashes before/after. |
| Generated SVGs are mistaken for fetched images again | Rename test copies `.svg`; media-signature checker rejects mismatched extensions. |
| Removing aliases surprises existing search tests/users | Alias search is not currently reachable from production; document intentional regression and test canonical fields. |
| Completing search duplicates scoring loops | Keep one small internal matcher in `repository.ts`; do not create a search framework. |
| React StrictMode invokes initialization effects twice in development | Preserve idempotent sync behavior; test visible state, not call count, unless duplicate sync causes a verified bug. |
| Raw error strings expose internals | UI uses a safe summary; full error remains test/log detail only. |
| `--full` disablement contradicts stale docs | Runtime truth wins; docs cleanup remains a separate task. |
| No production game art remains | This is deliberate until a separately verified and approved asset release exists. |

## 16. Deferred Findings

- Phase 3 Worker/D1/Drizzle/Better Auth/OAuth foundation.
- Phase 4 onboarding, real account identity, roster persistence, and roster UI.
- Phase 5 deterministic recommendation engine and versioned editorial consensus data.
- Phase 6 character/build/team product surfaces.
- Phase 7 OCR and Divergent Universe assistant.
- Phase 8 automated canonical ingestion and genuine full asset/data catalog mapping.
- Phase 9 CDN header verification, deployment, and full production hardening.
- A production visual asset release. It requires separate source/version/legal approval; Phase 2.5 leaves assets unavailable.
- A versioned/provenance-bearing alias dataset and richer Fuse.js indexing.
- Existing UI/accessibility findings unrelated to fabricated data, including nested interactive controls.
- Stale statements in `docs/00-README.md` through `docs/14-DECISIONS.md` and `CONTEXT.md`.
- Expanding the current canonical representative baseline. No data is invented merely to increase counts.

## 17. Definition of Done

- [ ] No production module imports test fixtures.
- [ ] No production user-facing runtime uses synthetic fixture data.
- [ ] No fake fallback occurs when real data is unavailable.
- [ ] `--full` does not falsely mean representative/dev snapshot.
- [ ] Dev-only snapshots cannot accidentally become production catalog data.
- [ ] Test fixtures remain usable and isolated.
- [ ] Production build passes without synthetic runtime dependencies.
- [ ] All relevant regression tests pass.
- [ ] No Phase 3 feature implemented.
- [ ] Home contains no fake roster, recommendation, source, DU, or account data.
- [ ] Canonical knowledge status is visible as loading, valid, cache-backed warning, rejected-update warning, or unavailable.
- [ ] Repository unavailable state never sets initialized true.
- [ ] Read errors and valid empty results are distinct in every knowledge hook.
- [ ] Search behavior matches all advertised entity types and uses only version-owned entity fields.
- [ ] Current `manual_review` asset snapshot is absent from `apps/web/public` and production `dist`.
- [ ] Three generated SVG stand-ins are absent from dev/production manifests and exist only as named test fixtures if retained.
- [ ] Asset discovery/download failure exits non-zero and publishes nothing fabricated.
- [ ] `assets:check` rejects media/extension mismatch and does not claim production approval.
- [ ] Structural source and built-artifact checks run through normal test/build scripts.
- [ ] Canonical release payload and provenance remain unchanged.
- [ ] No dependency or lockfile change.
- [ ] Pre-existing user changes remain intact.
- [ ] Final validation runs under Node 24.19.x.

## 18. Executor Handoff

Target: Gemini 3.7 Flash High.

### Files to read first

1. `docs/internal/PHASE-2.5-PRODUCTION-DATA-READINESS.md`
2. `git status --short --untracked-files=all` and `git diff`
3. `package.json`, `apps/web/package.json`, `pnpm-workspace.yaml`
4. `docs/internal/PHASE-2-KNOWLEDGE-INTEGRITY-CLOSURE.md`
5. `CONTEXT.md`, `docs/03-ARCHITECTURE.md`, `docs/06-DATA_INGESTION.md`, `docs/07-SOURCE_POLICY.md`, `docs/12-TESTING_STRATEGY.md`, `docs/13-ROADMAP.md`, `docs/14-DECISIONS.md`
6. `apps/web/src/main.tsx`, `App.tsx`, `router.tsx`, `routes/home-view.tsx`, `components/layout/app-shell.tsx`
7. `apps/web/src/lib/fixtures.ts`, `routes/design-system-view.tsx`, `components/hsr/**`
8. `apps/web/src/lib/knowledge/repository.ts`, `search.ts`, `use-knowledge.ts`, `syncer.ts`, `loader.ts`
9. `tools/sync-assets.ts`, `tools/check-assets.ts`, `packages/shared/src/assets.ts`, current asset manifest
10. Existing web/tool/E2E tests named in Section 9

### Exact task order

Run Task 1 through Task 8 sequentially. Tasks 2–4 share knowledge/UI contracts; Tasks 5–7 depend on the isolation established earlier. Do not parallelize file moves or shared test changes.

### Per-task validation

Run each task's validation before continuing. A non-zero command or missing required assertion stops the sequence. Do not defer a red focused test to the final gate.

### Files/directories forbidden to change

- `pnpm-lock.yaml`
- `apps/worker/**`
- `docs/00-README.md` through `docs/14-DECISIONS.md`
- `CONTEXT.md`
- `docs/d1/**`
- `.env*`, secrets, credentials, or Cloudflare configuration
- `packages/shared/src/knowledge/**` canonical schemas/data
- canonical entity payloads under `apps/web/public/data/v1.0.0/*.json`
- any D1, Drizzle, Better Auth, OAuth, OCR, recommendation, roster, or new product-surface file
- any pre-existing user change not explicitly named in Section 9

`apps/web/public/data/manifest.json` and `release.json` may be deterministically regenerated only by the existing builder. Their semantic content must not change.

### Manual gates

1. **Node gate:** switch from current Node 22.19.0 to Node 24.19.x before authoritative execution/validation.
2. **Dirty-worktree gate:** owner should commit the completed Phase 2 closure or explicitly authorize execution on top of the captured dirty baseline. Never stash/reset user changes automatically.
3. **Asset relocation gate:** obtain approval to move the current 55-asset public snapshot and its manifest. Preserve the 52 PNG-signature files in dev; move/rename the three generated SVGs to tests or obtain deletion approval.
4. No external credentials or service setup is needed. Do not contact live sources merely to make this gate pass.

### Stop conditions

Stop and report exact evidence if:

- fixing a finding requires Phase 3 architecture;
- a new dependency appears necessary;
- real canonical data cannot be sourced or verified;
- replacing synthetic data would require inventing gameplay facts;
- an external source is unavailable and the only proposed workaround is fake data;
- canonical gameplay data would need speculative modification;
- production/test boundaries cannot be proven by source graph and build artifact;
- the owner does not approve the asset relocation/deletion choice;
- a current asset would need `approved`/`official_fan_use` without review evidence;
- Node 24.19.x is unavailable for final validation;
- unrelated user changes would be overwritten;
- `knowledge:build` changes canonical payload meaning;
- any required validation fails for an unrelated pre-existing reason.

### Final validation sequence

Use Section 14 exactly. Preserve command output for the final handoff. Report:

- production dependency-graph result;
- public-root and `dist` artifact result;
- asset inventory/media-signature result;
- focused and full test results;
- canonical knowledge diff result;
- final Git status against the captured baseline.

Do not begin Phase 3 after the gate passes. Stop and hand control back to the owner.
