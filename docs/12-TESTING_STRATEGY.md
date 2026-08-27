# Astralyn — Testing Strategy

## Goal

Recommendation correctness and knowledge freshness are first-class quality targets. A pretty interface recommending nonsense is merely a more expensive form of nonsense.

## Unit tests

### Scoring
- role coverage;
- tag synergy;
- anti-synergy;
- source weighting;
- freshness weighting;
- confidence.

### Reason codes
Every meaningful contribution/penalty should emit expected reasons.

### Availability
- owned;
- trial;
- unavailable.

## Golden recommendation fixtures

Example:

```json
{
  "name": "castorice-core-owned-plus-trial",
  "patch": "4.4",
  "roster": ["castorice", "cyrene", "luocha"],
  "trial": ["evernight", "hyacine"],
  "request": {"type": "team", "subject": "castorice"},
  "expectedTopContains": [
    ["castorice", "cyrene", "evernight", "hyacine"]
  ]
}
```

Review fixtures when mechanics, engine weights or source consensus changes.

## Ingestion tests

Per adapter:
- source fixture;
- parser snapshot;
- missing fields;
- layout change;
- malformed source;
- stale source;
- unchanged hash.

Never test only against live websites.

## Knowledge validation & Snapshot Tests (Phase 2)

Automated tests in `apps/web/tests/`:
- `knowledge-schemas.test.ts`:
  - 100% acceptance of all canonical fixtures across all entity types.
  - Verification of archetype mechanics: Memosprite summons (`Castorice` / `Polly`), Stance transformation (`Firefly` / `Complete Combustion`), and Special Non-Energy Resources (`Acheron` / `Slashed Dream`).
  - Strict negative testing: rejection of negative base stats, invalid element/path enums, missing eidolons (< 6), invalid superimpositions (< 5), and malformed manifests.
- `knowledge-cache.test.ts`:
  - Dexie schema indexes and table initialization.
  - Transactional bulk population across all collections with atomic metadata updates.
  - Release upgrade state machine: version detection, download, and atomic replacement.
  - Cache freshness verification (`status: fresh` on subsequent identical checks).
  - Fail-safe rollback protection: if an incoming release fails validation, previous valid cache is strictly preserved and marked `update_rejected_previous_retained`.
  - Offline fallback verification: serving queries from local cache when network is offline (`status: offline_cache_active`).
  - Repository read queries and filter combinations (`path`, `element`, `rarity`, `role`, `tag`, `type`, `weakness`, `stageType`).
  - Search normalization, punctuation/diacritic stripping, and canonical alias matching (e.g. `sam` -> `firefly`, `polly` -> `castorice`, `madam herta` -> `the-herta`).
- `knowledge-interop.test.ts`:
  - Referential integrity check verifying all canonical character IDs, elements, paths, and representative light cones/relics match corresponding entity IDs in visual asset manifest.

Pre-publication CLI checks:
- `pnpm knowledge:build`: Compiles fixtures into static release directory (`apps/web/public/data/v1.0.0/`) and computes SHA-256 checksums.
- `pnpm knowledge:check`: Validates manifest structure, file existence, bit-for-bit SHA-256 hash match, schema conformity, duplicate ID rejection, and referential integrity.

## OCR tests

Fixtures:
- 1080p;
- resized mobile;
- compressed JPEG;
- Indonesian UI;
- English UI if supported;
- cropped DU cards;
- low contrast;
- common OCR substitutions.

Track exact match accuracy, top-3 candidate accuracy and processing time.

## E2E critical path

1. login;
2. roster onboarding;
3. edit roster in Settings;
4. view character + source comparison;
5. get personalized Top 1–3 team;
6. create DU run;
7. paste screenshot;
8. choose recommendation;
9. reload and preserve run.

## Security tests

- Worker authorization tests: authenticated user cannot read or edit another user's roster or saved teams;
- unauthenticated API calls return 401 Unauthorized;
- client-supplied `user_id` in request body/query is rejected/ignored in favor of `session.user.id`;
- client endpoints cannot execute writes on canonical Game Knowledge tables;
- screenshot OCR text cannot trigger privileged backend actions;
- secrets (`BETTER_AUTH_SECRET`, publishing tokens) absent from client bundles.

## Visual regression

Focus on structural contracts:
- nav;
- character header;
- source comparison;
- Astralyn Verdict;
- roster grid;
- DU recommendation.

## Game Asset Integrity Verification

Automated pipeline check via `pnpm assets:check`:
- Every asset record in `manifest.json` has a corresponding file on disk.
- File SHA-256 hash matches the manifest checksum.
- Zero runtime third-party URLs (no external CDN leaks).
- Representative character fixtures have verified icons and artwork.
- Combat elements (7/7) and combat paths (8/8) are completely verified.

## Accessibility Verification & Standards

- **Automated Scanning:** Axe-core integrated via `@axe-core/playwright` (`a11y.spec.ts`).
- **Claim Accuracy Standard:** Automated tests prove *0 automated Axe violations detected on the tested routes/states*. Full WCAG conformance requires continuous manual verification.
- **Manual Verification Gates:**
  - Keyboard navigation and visible focus rings (`:focus-visible` on tiles, tabs, buttons).
  - Dialog focus trap and escape handling.
  - Screen reader accessible names (`aria-label`, `aria-pressed`, `aria-describedby`).
  - Text contrast against dark cosmic surfaces and light celestial parchment surfaces.
  - Responsive reflow at 360px, 390px, 768px, 1280px, and 1440px with zero horizontal clipping.
  - `prefers-reduced-motion` respect for HUD animations.

## Destructive Git & Filesystem Safety Policy

- Never execute unguarded destructive operations (`git clean -fd`, `git reset --hard`, `bulk rm`).
- Prior to any cleanup, always inspect status via `git status` and dry-run `git clean -nd`.
- If untracked files contain user work or ambiguous state, halt and confirm before deletion.
