# Astralyn: testing strategy

## Validation baseline

Use Node 24.19.x and the pinned pnpm version.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm knowledge:check
pnpm data:check
pnpm assets:check
pnpm build
git diff --check
```

`pnpm test` already runs migration, production-data, asset, tooling, and workspace test suites. The explicit checks remain useful in release reports because they identify which contract failed.

`pnpm knowledge:build` is not a routine read-only gate. It regenerates published data and should run only when a knowledge change is intended, followed by `pnpm knowledge:check` and diff review.

## Recommendation regressions

The shared and Worker suites cover:

- unchanged score weights and curated Top 3 fixtures;
- deterministic code-unit ordering and repeated equivalent requests;
- `all_characters` for guests and authenticated users;
- `owned_only` authorization and persisted roster use;
- empty and fewer-than-four owned rosters;
- explicit focus characters, including limited taxonomy fallback;
- 16-candidate, 1,820-team upper bound;
- Limited Data propagation and exclusion of unsupported taxonomy evidence;
- no recommendation-side ownership writes.

Golden fixtures change only when the scoring contract or reviewed canonical evidence changes. A timeout increase is not an acceptable substitute for bounding work.

## Knowledge and cache tests

- Zod acceptance and rejection for canonical entities and manifests.
- Static file existence, duplicate IDs, references, and SHA-256 hashes.
- Dexie initialization and transactional population.
- Offline fallback and previous-cache retention.
- Same-version source-hash mismatch repair.
- Repository search and filters across knowledge stores.
- Production source isolation from dev fixtures and manual-review assets.

## Auth and persistence tests

- Missing auth configuration and missing session behavior.
- Better Auth route handling and sanitized failures.
- Profile/onboarding creation.
- Roster validation, persistence, updates, deletion, and user scoping.
- Saved-team validation, ownership, four-slot integrity, and cascade deletion.
- Protected export endpoint authorization.

## DU and OCR tests

- Blessing, equation, and curio ranking.
- Equation progress and party-context scoring.
- Stable tie-breaking.
- OCR preprocessing and worker lifecycle.
- Input sanitization, fuzzy matching, confidence, and manual override.
- Local run hydration, persistence, commit, and reset.

OCR fixtures demonstrate covered cases. They do not support a claim of universal accuracy for every resolution, language, crop, or compression level.

## Playwright coverage

The E2E suite covers primary navigation, production route guards, responsive shell behavior, automated Axe checks, onboarding, roster operations, recommendations, saved teams, DU manual flow, reload persistence, and selected offline/cache behavior.

Google's external OAuth screen and a live Cloudflare deployment are environment-dependent manual gates. Tests that mock session state do not replace production OAuth smoke testing.

## Release evidence

A release report records each command, exit code, relevant test count, and any skipped environment-specific check. Do not claim full accessibility, production deployment, source freshness, or OAuth readiness from unit tests alone.
