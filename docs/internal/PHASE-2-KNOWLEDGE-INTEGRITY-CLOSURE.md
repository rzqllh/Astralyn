# Phase 2 Knowledge Integrity Closure

## 1. Objective

Close the gap between the Phase 2 integrity claims and the behavior currently enforced by the repository. The finished work must make malformed, incomplete, incompatible, or over-budget knowledge releases fail closed in shared schemas, pre-publication tooling, browser loading, local cache reuse, and benchmark execution.

This closure must happen before Phase 3 because D1, Drizzle, and authentication would otherwise build on a release contract that can accept an incomplete manifest, skip a missing checksum, reuse a partial cache, or print a successful benchmark after a failed criterion.

No Phase 3 feature belongs in this plan.

## 2. Current Verified State

Facts below were verified directly from the current worktree at commit `98b0085`.

- Root workspace version and all package versions are `0.0.1`. `package.json` requires Node `>=24.19.0 <25` and pnpm `>=10.0.0`; `.node-version` pins `24.19.0`.
- Current shell uses Node `22.19.0` and pnpm `10.20.0`. Commands run, but pnpm prints an unsupported-engine warning. Final implementation validation therefore requires Node 24.19.x.
- `packages/shared/src/knowledge/version.ts` defines `KnowledgeFileEntrySchema`, `KnowledgeReleaseManifestSchema`, and `RootKnowledgeManifestSchema`. All relevant strings are currently unrestricted, `files` may be empty, and `checksums` may be empty.
- A direct `safeParse` probe confirmed that the release schema accepts `files: []`, `checksums: {}`, a non-hash `sourceSnapshotHash`, and a non-SemVer `minAppVersion`. The root schema also accepts a current version missing from both `availableReleases` and `releases`, with mismatched root game/schema versions.
- `packages/shared/src/knowledge/release.ts` defines `KnowledgeReleaseBundleSchema`, but it does not compare root metadata, release metadata, file metadata, entity counts, or application compatibility.
- `tools/build-knowledge.ts` owns the canonical six-file build order:
  1. `characters.json`
  2. `light-cones.json`
  3. `relics.json`
  4. `enemies.json`
  5. `stages.json`
  6. `divergent-universe.json`
- `tools/build-knowledge.ts` hard-codes `MIN_APP_VERSION = "0.1.0"`, while `apps/web/package.json` is `0.0.1`. The generated release therefore declares the current application incompatible with its own snapshot.
- Current published data is otherwise internally healthy: all six files exist; root current version is `v1.0.0`; root and release metadata match; counts are 9 characters, 9 light cones, 6 relic sets, 4 enemies, 4 stages, and 7 combined Divergent Universe entities; declared sizes and both checksum copies match the files on disk.
- `tools/check-knowledge.ts` iterates only `releaseManifest.files`. A required file omitted from that array is never required. The checker does not compare `entityCount`, `sizeBytes`, `relPath`, root embedded release metadata, root/release game/schema metadata, or `sourceSnapshotHash` derivation.
- `tools/check-knowledge.ts` returns `{ success, errors }` and already exits with code 1 when `success` is false. Preserve this interface and fail behavior while strengthening what contributes errors.
- `apps/web/src/lib/knowledge/loader.ts` verifies a checksum only when one is present. `loadFullRelease()` directly indexes `releaseManifest.checksums`, fetches all six hard-coded files, and validates entity schemas, but it does not validate required manifest entries, entity counts, byte sizes, root/release agreement, source snapshot hash, or `minAppVersion`.
- `apps/web/src/lib/knowledge/syncer.ts` considers a local cache valid when `activeKnowledgeVersion` exists and the character table contains at least one row. Other tables, source metadata, and row schemas are not checked before returning `fresh` or `offline_cache_active`.
- Transactional replacement in `KnowledgeCacheSyncer.sync()` already preserves a previously accepted cache when a new release load throws. This rollback behavior is correct and must remain.
- `tools/benchmark-knowledge.ts` hard-codes release directory `v1.0.0`, logs missing files and continues, renders each budget as PASS/FAIL text, then unconditionally prints `ALL BENCHMARK CRITERIA MET (PASS)`. Only thrown exceptions reach `process.exit(1)`.
- Fresh baseline commands under the unsupported Node 22 runtime produced:
  - `pnpm knowledge:check`: exit 0.
  - `pnpm knowledge:benchmark`: exit 0 and unconditional final PASS.
  - Focused Phase 2 Vitest files: 3 files and 33 tests passed.
- Existing tests live under `apps/web/tests/` and use Vitest with jsdom. Root already depends on `tsx`; Node's built-in `node:test` can cover Node-only tools without another dependency.

Verified findings intentionally deferred from this closure appear in Section 13.

## 3. Success Criteria

Implementation is complete only when all criteria below are proven:

1. A release manifest is invalid unless it contains exactly the six canonical filenames, once each, in deterministic build order.
2. Every required file has a 64-character lowercase SHA-256 in both `files[].checksum` and `checksums[filename]`, and both values agree.
3. Each required `relPath` equals `<knowledgeVersion>/<filename>`.
4. Pre-publication checking compares each physical file's SHA-256 and byte length with release metadata.
5. Parsed entity totals match each file's declared `entityCount`; Divergent Universe count is the sum of blessings, equations, and curios.
6. `sourceSnapshotHash` equals SHA-256 of the six canonical file checksums concatenated in canonical order, matching the existing builder algorithm.
7. Root metadata references the current release, lists it as available, agrees on game/schema version, and embeds metadata identical to its `release.json` descriptor.
8. `minAppVersion` and application version use supported SemVer core format (`major.minor.patch`). Loading/checking rejects `appVersion < minAppVersion` and accepts equality or a newer application.
9. Generated `v1.0.0` metadata uses `apps/web/package.json` version `0.0.1` as its minimum application version. No package version is raised to `0.1.0`.
10. Runtime loading performs the same release/root/count/compatibility checks before returning a `LoadedKnowledgeRelease` for caching.
11. A cache missing required metadata, missing rows, containing wrong table counts, or containing schema-invalid rows is not returned as `fresh` or `offline_cache_active`.
12. A valid previous cache remains intact when a new release fails any integrity or compatibility check.
13. `pnpm knowledge:benchmark` exits non-zero when preflight integrity fails, a required file is missing, a budget is violated, or measurement cannot complete.
14. The benchmark prints final PASS only when every criterion passes; failure output lists each failed criterion.
15. Regression tests cover every new positive and negative path in Section 8.
16. No dependency is added, no lockfile changes, and no Phase 3 or UI code changes.
17. All required validation commands in Section 9 pass under Node 24.19.x.

## 4. Scope

### In Scope

- Strengthen existing shared release schemas and add pure consistency/version helpers inside the existing knowledge module.
- Make the six-file contract a shared constant used by build, check, and runtime loading paths.
- Derive minimum app compatibility from `apps/web/package.json` during snapshot generation.
- Validate root/release/file/count/checksum/size/source-hash agreement.
- Enforce compatibility in the CLI checker and browser loader.
- Strengthen local cache acceptance using stored expected table counts plus schema validation.
- Make benchmark results structured and fail closed.
- Add Vitest coverage for shared/runtime/cache behavior and `node:test` coverage for Node-only tooling.
- Regenerate only metadata that must change because `minAppVersion` becomes `0.0.1`.

### Out of Scope

- Cloudflare Worker, D1, Drizzle, Better Auth, OAuth, or any Phase 3 work.
- UI routes, React components, fixtures displayed by the UI, OCR, recommendations, roster state, or search expansion.
- Canonical gameplay fact changes, source ingestion adapters, source reclassification, or provenance rewriting.
- Asset synchronization, asset legal status, or asset metadata corrections.
- Editing existing roadmap, policy, design, testing, or decision documents.
- Package version bump to `0.1.0`.
- Dependency additions or lockfile updates.
- Atomic filesystem publication redesign. Existing build output flow remains.

## 5. Technical Decisions

### Decision 1: Deepen existing knowledge contract modules

- **Decision:** Put canonical filenames, checksum schemas, SemVer comparison, and manifest refinements in `packages/shared/src/knowledge/version.ts`. Put cross-document and entity-count comparison in `packages/shared/src/knowledge/release.ts`.
- **Reasoning:** These files already own release interfaces. One shared contract prevents build, check, and runtime code from drifting while avoiding a new package or abstraction layer.
- **Existing pattern:** All shared runtime contracts use Zod and are re-exported through `packages/shared/src/knowledge/index.ts`.
- **Trade-off:** `version.ts` and `release.ts` become larger, but integrity knowledge stays local to the established seam.

### Decision 2: Exact six-file manifest contract

- **Decision:** Export an ordered `REQUIRED_KNOWLEDGE_FILENAMES` tuple and require `files` plus `checksums` to cover that exact set. Reject missing, duplicate, and unknown manifest filenames.
- **Reasoning:** Optional iteration over a publisher-controlled list cannot prove completeness. Fixed order also makes `sourceSnapshotHash` deterministic.
- **Existing pattern:** `tools/build-knowledge.ts` already emits these exact six files in this order.
- **Trade-off:** Adding a seventh canonical file becomes a deliberate schema change instead of silently passing old validation.

### Decision 3: Shared pure consistency function

- **Decision:** Add a pure interface similar to:

  ```ts
  validateKnowledgeReleaseConsistency(input: {
    rootManifest: RootKnowledgeManifest;
    releaseManifest: KnowledgeReleaseManifest;
    entityCounts: Record<RequiredKnowledgeFilename, number>;
    appVersion: string;
  }): string[];
  ```

  Add an asserting wrapper that throws one typed `KnowledgeReleaseIntegrityError` containing all violations.
- **Reasoning:** CLI tools need accumulated errors; runtime needs one rejection that the existing syncer can handle. Both cross the same small interface.
- **Existing pattern:** `checkKnowledgeIntegrity()` already accumulates strings, while loader/syncer already treat thrown validation errors as rejected releases.
- **Trade-off:** Physical file hashes and sizes stay in Node/browser adapters because the shared module must remain environment-neutral.

### Decision 4: SemVer core without a dependency

- **Decision:** Support and compare only numeric `major.minor.patch` for application compatibility. Reject prefixes, missing segments, negative values, and prerelease/build suffixes for this Phase 2 contract.
- **Reasoning:** All current package and minimum versions use simple SemVer core. A small comparator avoids a dependency and removes lexicographic comparison bugs.
- **Existing pattern:** Current repository versions are `0.0.1`; release knowledge versions remain separately formatted as `v1.0.0`.
- **Trade-off:** A future prerelease version requires an explicit contract extension and tests.

### Decision 5: Web package version is compatibility authority

- **Decision:** `tools/build-knowledge.ts` reads and validates `apps/web/package.json.version`; `KnowledgeSnapshotLoader` imports that same package version as its default `appVersion`. Tests may inject another version.
- **Reasoning:** Compatibility governs the browser consumer, not the workspace shell or worker. Derivation removes the current hard-coded drift.
- **Existing pattern:** `apps/web/package.json` already declares the deployed application version and TypeScript enables JSON modules.
- **Trade-off:** A schema-breaking client change must bump the web package version before rebuilding a release.

### Decision 6: Enforce compatibility at publish and consume seams

- **Decision:** `knowledge:check` and runtime `loadFullRelease()` both reject incompatible releases. Runtime checks happen after parsing root/release metadata and before accepting canonical content.
- **Reasoning:** CI protects publication, while runtime protects clients from externally published or stale metadata.
- **Existing pattern:** Loader validation failures already feed `update_rejected_previous_retained` or `unavailable` through the syncer.
- **Trade-off:** An incompatible client cannot use the new release, even if payload schemas happen to parse.

### Decision 7: Validate cache completeness with persisted expected counts

- **Decision:** Inside the successful Dexie transaction, persist a JSON record containing expected counts for all eight tables. Before cache reuse, require core metadata, parse the count record, compare all table counts, and schema-validate cached rows.
- **Reasoning:** `characters.count() > 0` cannot justify calling the entire cache validated. Exact table counts support legitimately empty collections and detect partial deletion.
- **Existing pattern:** `activeKnowledgeVersion`, `gameVersion`, `cachedAt`, and `sourceSnapshotHash` are already written atomically with table population.
- **Trade-off:** Legacy Phase 2 caches lack the count record. Online clients perform one repair sync; offline clients do not receive an unproven cache.

### Decision 8: Benchmark returns evidence and CLI maps it to an exit code

- **Decision:** Make benchmark execution return structured measurements/failures or throw a typed benchmark failure. Add a small CLI executor that maps success to 0 and any failure to 1. Run `checkKnowledgeIntegrity()` as preflight and derive the active release from its validated root manifest instead of hard-coding `v1.0.0`.
- **Reasoning:** Formatting PASS/FAIL strings is not a gate. A structured result is directly testable and keeps output separate from decision logic.
- **Existing pattern:** Current direct-entry guards already map thrown errors to process failure.
- **Trade-off:** Benchmark tests need injectable directories, budgets, and iteration counts to remain deterministic and fast.

### Decision 9: Use existing test technology only

- **Decision:** Keep shared/runtime/cache tests in web Vitest. Test Node tools with `node:test` through existing `tsx --test`.
- **Reasoning:** Tool tests need temporary filesystem fixtures and Node APIs; no Vitest reconfiguration or new package is required.
- **Existing pattern:** Root already owns `tsx`; web already owns Vitest and fake IndexedDB.
- **Trade-off:** Full test orchestration must explicitly run both suites.

## 6. Implementation File Map

| File | Symbol / Area | Required Change | Why |
|---|---|---|---|
| `packages/shared/src/knowledge/version.ts` | Manifest schemas, filename/checksum schemas, SemVer helpers | Define exact file contract, strengthen manifest/root refinements, add compatibility comparison | Single shared structural contract |
| `packages/shared/src/knowledge/release.ts` | `KnowledgeReleaseBundleSchema`; new consistency helpers | Compute canonical counts; compare root, release, counts, and compatibility; expose typed integrity error | Shared deep validation seam for tools and runtime |
| `tools/build-knowledge.ts` | Build constants and `filesPayloads` | Use shared ordered filenames, derive minimum app version from web package, assert generated metadata consistency | Prevent newly generated invalid metadata |
| `tools/check-knowledge.ts` | `checkKnowledgeIntegrity` | Add injectable options; require six physical files; validate hashes, sizes, counts, source hash, metadata agreement, compatibility | Make pre-publication validation complete and testable |
| `tools/benchmark-knowledge.ts` | `TARGET_BUDGETS`, `runKnowledgeBenchmark`, direct-entry block | Add integrity preflight, active-version discovery, failure aggregation, structured result, deterministic test options, exit-code adapter | Make benchmark a real gate |
| `tools/tests/knowledge-test-fixtures.ts` | New filesystem fixture helper | Copy a valid release into OS temp storage and provide controlled mutation helpers with cleanup | Test failures without touching tracked snapshots |
| `tools/tests/check-knowledge.test.ts` | New Node tool tests | Cover required files, checksum, size/count/source hash, root/release agreement, compatibility | Regression coverage for checker failures |
| `tools/tests/knowledge-benchmark.test.ts` | New Node tool tests | Cover preflight failure, missing file, budget pass/fail, measurement failure, and CLI exit mapping | Regression coverage for benchmark exit semantics |
| `apps/web/src/lib/knowledge/loader.ts` | `KnowledgeSnapshotLoader`, `fetchVerifiedJson`, `loadFullRelease` | Require file entries, verify checksum/size/source hash, validate root/release/counts/app compatibility | Reject unsafe releases before caching |
| `apps/web/src/lib/knowledge/syncer.ts` | `KnowledgeCacheSyncer.sync`; new internal cache inspection | Persist expected counts and validate every cache table plus required metadata before reuse | Prevent partial/corrupt offline cache acceptance |
| `apps/web/tests/helpers/knowledge-fixtures.ts` | New manifest/release fixture builders | Create structurally valid root, release, and loaded-release fixtures with override points | Keep stricter tests readable and DRY |
| `apps/web/tests/knowledge-schemas.test.ts` | Manifest/schema negative tests | Add exact-file, checksum, path, root consistency, and SemVer cases | Prove shared contract rejects malformed metadata |
| `apps/web/tests/knowledge-cache.test.ts` | Loader and syncer suites | Use valid fixtures; add compatibility, count, metadata disagreement, partial cache, invalid cache, and rollback cases | Prove runtime and cache behavior |
| `apps/web/public/data/v1.0.0/release.json` | Generated compatibility metadata | Regenerate with `minAppVersion: "0.0.1"` | Make current app/release compatible |
| `apps/web/public/data/manifest.json` | Embedded generated release metadata | Regenerate embedded release with the same minimum version | Keep root and release descriptors identical |
| `package.json` | Test scripts only | Add `test:knowledge-tools`; make full `test` run tool, web, and worker tests | Ensure new regression suite is part of normal validation |

Expected implementation must not alter `pnpm-lock.yaml`, the six canonical entity JSON files, application UI files, worker files, or existing documentation.

## 7. Implementation Steps

### Task 1 — Strengthen shared release contracts

**Goal**

Make malformed or incomplete release metadata unrepresentable after Zod parsing and provide one pure consistency interface for all consumers.

**Files**

- `packages/shared/src/knowledge/version.ts`
- `packages/shared/src/knowledge/release.ts`
- `apps/web/tests/knowledge-schemas.test.ts`
- `apps/web/tests/helpers/knowledge-fixtures.ts` (create)

**Changes**

- Add the failing schema tests first.
- Define `REQUIRED_KNOWLEDGE_FILENAMES` as the exact ordered six-file tuple from the builder.
- Define `RequiredKnowledgeFilenameSchema`, `RequiredKnowledgeFilename`, and a lowercase 64-hex SHA-256 schema.
- Change `KnowledgeFileEntrySchema.filename` to the filename enum. Require positive `sizeBytes`; retain nonnegative `entityCount` so a valid canonical collection may be empty.
- Refine `KnowledgeReleaseManifestSchema` so:
  - `files` contains exactly six entries in canonical order;
  - filenames are unique;
  - `checksums` contains exactly the six required keys;
  - every entry checksum equals `checksums[filename]`;
  - every `relPath` equals `${knowledgeVersion}/${filename}`;
  - `sourceSnapshotHash` is a valid SHA-256;
  - `compatibility.minAppVersion` is supported SemVer core.
- Refine `RootKnowledgeManifestSchema` so:
  - `availableReleases` has no duplicates;
  - its set matches `Object.keys(releases)`;
  - `currentKnowledgeVersion` is present in both;
  - current release status is `published`;
  - root game/schema versions equal current embedded release values.
- Add numeric SemVer parsing/comparison. Compare numeric segments, never strings.
- Add `getKnowledgeEntityCounts()`, `validateKnowledgeReleaseConsistency()`, and `assertKnowledgeReleaseConsistency()` in `release.ts`.
- Consistency validation must compare every release descriptor field and canonical file entry between `rootManifest.releases[currentKnowledgeVersion]` and fetched `releaseManifest`, compare six declared/actual entity counts, and enforce app compatibility.
- `KnowledgeReleaseIntegrityError` must retain the complete violation list for CLI output and focused runtime assertions.
- Build valid reusable fixtures in `apps/web/tests/helpers/knowledge-fixtures.ts`; defaults must use six entries, valid fake hashes, matching root/release metadata, and `minAppVersion: "0.0.1"`.

**Do not**

- Do not require entity `releaseVersion` or `provenance.gameVersion` to equal snapshot game version. Existing canonical entities legitimately originate from older game releases.
- Do not change gameplay schemas, fixtures, provenance tiers, or canonical data.
- Do not add a SemVer package.

**Validation**

- Run `pnpm --filter @astralyn/web exec vitest run tests/knowledge-schemas.test.ts`.
- Required proof: positive current-shape fixture passes; missing, duplicate, or unknown canonical filenames fail; missing/mismatched checksums fail; wrong `relPath` fails; inconsistent root fails; malformed SemVer fails; numeric compatibility cases pass/fail correctly.

**Done when**

- All shared contract cases pass through one exported interface, and existing canonical schema tests remain green.

### Task 2 — Align generated release compatibility metadata

**Goal**

Make new snapshots derive compatibility from the actual web application version and repair current generated metadata.

**Files**

- `tools/build-knowledge.ts`
- `apps/web/public/data/v1.0.0/release.json`
- `apps/web/public/data/manifest.json`

**Changes**

- Remove hard-coded `MIN_APP_VERSION`.
- Read `apps/web/package.json`, validate its `version` with the shared SemVer schema, and use that value for `compatibility.minAppVersion`.
- Type `filesPayloads` with `RequiredKnowledgeFilename` and construct it in `REQUIRED_KNOWLEDGE_FILENAMES` order.
- Compute `sourceSnapshotHash` from checksum values in that same fixed order.
- Before writing final manifests, run the shared consistency assertion using counts already calculated by the builder.
- Run the builder once. Expected semantic change is `minAppVersion` from `0.1.0` to `0.0.1` in release and root manifests.
- Inspect generated diff. The six canonical entity JSON files must remain byte-identical.

**Do not**

- Do not bump any package version.
- Do not edit generated JSON by hand.
- Do not change `generatedAt`, canonical fixtures, checksums, or source snapshot hash unless deterministic build output proves they must change.

**Validation**

- Run `pnpm knowledge:build`.
- Run `git diff -- apps/web/public/data`.
- Run `pnpm knowledge:check` as a smoke check; Task 3 will strengthen this command.
- Required proof: only both manifest files show the intended compatibility change; all six data payloads remain unchanged.

**Done when**

- Generated root and release metadata both state `minAppVersion: "0.0.1"` and still agree exactly.

### Task 3 — Harden pre-publication integrity checking

**Goal**

Make `knowledge:check` reject every incomplete or inconsistent release artifact required by this closure.

**Files**

- `tools/check-knowledge.ts`
- `tools/tests/knowledge-test-fixtures.ts` (create)
- `tools/tests/check-knowledge.test.ts` (create)

**Changes**

- Write failing Node tests before changing the checker.
- Add optional `dataDir`, `assetManifestPath`, and `appVersion` inputs to `checkKnowledgeIntegrity()`. Preserve current repository paths and web package version as defaults.
- Keep return shape `{ success, errors }`; add parsed active version/manifests only if the benchmark needs them, without exposing filesystem implementation details.
- Iterate `REQUIRED_KNOWLEDGE_FILENAMES`, not only publisher-provided entries.
- For each file:
  - require physical existence;
  - read a `Buffer`, hash the raw bytes, then decode as UTF-8 for JSON parsing;
  - compare actual byte length with `sizeBytes`;
  - compare actual SHA-256 with both checksum locations;
  - parse with the correct existing Zod schema;
  - calculate actual entity count and compare with `entityCount`.
- Recompute `sourceSnapshotHash` from verified checksums in canonical order.
- Invoke shared consistency validation for root/release/count/app agreement.
- Preserve duplicate ID, Tier A provenance, stage/enemy reference, and asset interoperability checks.
- Test fixtures must use `fs.mkdtemp()` under the OS temporary directory, copy the committed valid snapshot, apply one mutation per test, and clean up with `fs.rm(..., { recursive: true, force: true })` only for the resolved temp path.
- Add tests for:
  - valid snapshot;
  - omitted manifest entry;
  - missing physical file;
  - checksum mismatch in file entry;
  - checksum mismatch in checksum record;
  - byte-size mismatch;
  - entity-count mismatch;
  - source snapshot hash mismatch;
  - root/release version, game version, schema version, or embedded descriptor mismatch;
  - app below minimum;
  - app equal to and above minimum.

**Do not**

- Do not mutate tracked snapshot files during tests.
- Do not turn visual asset interoperability warnings into blocking knowledge failures in this task.
- Do not remove existing provenance or referential checks.

**Validation**

- Run `pnpm exec tsx --test tools/tests/check-knowledge.test.ts`.
- Run `pnpm knowledge:check`.
- Required proof: every single corruption fixture returns `success: false` with a specific error; committed release returns success.

**Done when**

- Omitting a canonical file from both manifest and disk can no longer produce a PASS, and every declared integrity field is verified against observed data.

### Task 4 — Enforce release integrity in browser loading

**Goal**

Prevent incompatible or metadata-inconsistent releases from becoming `LoadedKnowledgeRelease` values.

**Files**

- `apps/web/src/lib/knowledge/loader.ts`
- `apps/web/tests/knowledge-cache.test.ts`
- `apps/web/tests/helpers/knowledge-fixtures.ts`

**Changes**

- Write failing loader tests first using mocked raw responses and the valid fixture builders.
- Import `apps/web/package.json.version` as the default loader application version. Allow constructor injection for tests while preserving default `baseUrl = "/data"`.
- Change the internal verified-file interface to consume the full `KnowledgeFileEntry`, not an optional checksum string.
- Fetch canonical payloads as `ArrayBuffer`, hash the raw `Uint8Array` with `crypto.subtle`, compare `byteLength`, then decode once with a fatal UTF-8 `TextDecoder` for JSON parsing. Reject decode, size, or checksum mismatch with a typed integrity error.
- Build a filename-to-entry map only after release manifest parsing has proven the exact six-file contract.
- Fetch the six files through that map and existing entity schemas.
- Calculate actual entity counts after parsing and call shared consistency validation with root manifest, fetched release manifest, counts, and loader app version.
- Recompute and verify `sourceSnapshotHash` in canonical checksum order.
- Ensure app incompatibility is detected before returning data to the syncer. Error text must include current and required versions.
- Replace empty manifest mocks in `knowledge-cache.test.ts` with valid fixtures. Keep test overrides explicit.
- Add cases for:
  - app version equal to minimum;
  - app version newer than minimum;
  - app version lower than minimum;
  - missing required checksum/entry rejected during manifest parse;
  - byte/checksum mismatch rejected before JSON schema parse;
  - entity-count mismatch;
  - root/release embedded descriptor mismatch;
  - source snapshot hash mismatch;
  - valid current release returns all eight runtime collections.

**Do not**

- Do not fetch compatibility from a server endpoint or introduce Vite define globals.
- Do not weaken checksum verification to accommodate line-ending changes.
- Do not change sync status names or rollback semantics.

**Validation**

- Run `pnpm --filter @astralyn/web exec vitest run tests/knowledge-cache.test.ts`.
- Required proof: compatible fixture loads; every incompatible/inconsistent fixture rejects before cache population; existing checksum regression still passes.

**Done when**

- Runtime and CLI use the same shared consistency rules and cannot disagree about release compatibility or counts.

### Task 5 — Reject incomplete or corrupt local caches

**Goal**

Only reuse local data when all expected cache tables and integrity metadata are complete.

**Files**

- `apps/web/src/lib/knowledge/syncer.ts`
- `apps/web/tests/knowledge-cache.test.ts`

**Changes**

- Write failing cache tests first.
- Add one internal cache inspection method. It must read:
  - `activeKnowledgeVersion`;
  - `gameVersion`;
  - `cachedAt`;
  - `sourceSnapshotHash`;
  - new `entityCounts` JSON metadata.
- Define expected counts for all eight Dexie tables: characters, light cones, relic sets, enemies, stages, DU blessings, DU equations, and DU curios.
- During successful transactional population, derive those counts from `LoadedKnowledgeRelease` arrays and write `entityCounts` atomically with existing metadata.
- Before setting `hasValidLocalCache`, parse count metadata, compare every actual table count with its expected count, load rows, and validate them with existing entity schemas.
- Invalid local cache behavior:
  - network unavailable: return `unavailable`, not `offline_cache_active`;
  - same target version online: download and transactionally repair instead of returning `fresh`;
  - new release fails: do not describe invalid old data as retained valid cache.
- Valid local cache behavior must remain unchanged: same version returns `fresh`; offline returns `offline_cache_active`; failed update retains previous valid contents.
- Add cases for missing count metadata, one missing row in a non-character table, one schema-invalid cached row, online repair of same version, offline refusal, and rollback with a genuinely valid prior cache.

**Do not**

- Do not require every collection count to be greater than zero; exact expected zero is valid.
- Do not clear invalid cache outside the existing successful replacement transaction.
- Do not add a Dexie schema migration solely for metadata keys; the existing key/value table supports them.

**Validation**

- Run `pnpm --filter @astralyn/web exec vitest run tests/knowledge-cache.test.ts`.
- Required proof: partial/corrupt cache never returns `fresh` or `offline_cache_active`; valid rollback and offline fallback still pass.

**Done when**

- Every cache acceptance status is backed by complete metadata, exact table counts, and schema-valid rows.

### Task 6 — Make benchmark fail closed

**Goal**

Turn `knowledge:benchmark` from a report-only script into a reliable process gate.

**Files**

- `tools/benchmark-knowledge.ts`
- `tools/tests/knowledge-test-fixtures.ts`
- `tools/tests/knowledge-benchmark.test.ts` (create)
- `package.json`

**Changes**

- Write failing Node tests first.
- Add options for `dataDir`, partial budget overrides, sync iteration count, query iteration count, and a logger. Defaults must preserve current production command behavior and budgets.
- Run `checkKnowledgeIntegrity()` before any size or performance measurement. Treat unsuccessful or thrown validation as a benchmark failure.
- Derive active release directory from validated root metadata. Remove hard-coded `v1.0.0`.
- Measure exactly the six canonical files plus `release.json` and root `manifest.json`. Missing/read/compression failures must stop successful completion.
- Record every budget result in a structured failure list:
  - total gzip bytes;
  - average initial sync latency;
  - average single-item get latency;
  - average collection filter latency;
  - average normalized search latency.
- Preserve current strict `< budget` semantics unless an existing test documents otherwise.
- Move database cleanup into `finally` blocks so failed measurements do not leak benchmark databases.
- Print the final PASS banner only when failure list is empty. On failure, print one final FAIL summary and every failed criterion.
- Export a small executor that returns exit code `0` or `1`; direct invocation assigns that value to `process.exitCode`. Tests must assert this mapping rather than relying only on formatted output.
- Add tool tests for:
  - valid snapshot plus generous injected budgets returns exit code 0;
  - missing required file returns 1;
  - invalid release metadata/preflight inability returns 1;
  - zero gzip budget returns 1;
  - each synthetic performance measurement over its budget is included in failures;
  - thrown measurement error returns 1;
  - PASS banner is absent from failure output.
- Add root script:

  ```json
  "test:knowledge-tools": "tsx --test tools/tests/check-knowledge.test.ts tools/tests/knowledge-benchmark.test.ts"
  ```

- Change root `test` script so it runs `test:knowledge-tools`, `@astralyn/web` tests, then `@astralyn/worker` tests. Do not alter dependency declarations.

**Do not**

- Do not weaken budgets to stabilize tests. Inject deterministic measurements or generous test-only budgets.
- Do not test real wall-clock failure thresholds in regression tests.
- Do not add a benchmark package or test framework.

**Validation**

- Run `pnpm test:knowledge-tools`.
- Run `pnpm knowledge:benchmark`.
- Required proof: regression suite sees exit code 1 for every failure class; committed valid release prints one final PASS and command exits 0.

**Done when**

- No logged FAIL condition can coexist with process exit code 0 or the final PASS banner.

### Task 7 — Run integrated Phase 2 closure gate

**Goal**

Prove the complete implementation, generated artifacts, and repository scope under the required runtime.

**Files**

- No new files. Inspect all files in Section 6 and current Git diff.

**Changes**

- Switch to Node 24.19.x before validation.
- Run Section 9 in order and stop at the first failure.
- Inspect generated artifact diff after `knowledge:build`.
- Confirm no dependency or lockfile change.
- Confirm no file outside the Section 6 implementation map changed.
- Resolve task-related failures only. Report unrelated failures without expanding scope.

**Do not**

- Do not hide TypeScript, lint, test, benchmark, or build failures.
- Do not regenerate assets or run `assets:sync`.
- Do not edit existing documentation to make validation claims pass.

**Validation**

- Use every command in Section 9 with fresh output.
- Run `git status --short` and `git diff --check` last.

**Done when**

- Every Definition of Done checkbox has direct command, test, or diff evidence.

## 8. Test Matrix

| Scenario | Expected Result | Test Level | Target Test/File |
|---|---|---|---|
| Valid exact six-file release manifest | Schema accepts | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| Canonical file entry missing | Schema rejects | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| Duplicate or unknown canonical filename | Schema rejects | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| Required checksum key missing | Schema rejects | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| File entry/checksum record disagree | Schema rejects | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| Invalid SHA-256 or SemVer format | Schema rejects | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| Root current release absent/unavailable | Root schema rejects | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| Root and embedded current release game/schema differ | Root schema rejects | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| Physical canonical file missing | Checker fails with filename; benchmark exit 1 | Node integration | `tools/tests/check-knowledge.test.ts`, `tools/tests/knowledge-benchmark.test.ts` |
| Physical bytes differ from checksum | Checker and loader reject before acceptance | Node/runtime | `tools/tests/check-knowledge.test.ts`, `apps/web/tests/knowledge-cache.test.ts` |
| Declared size differs from UTF-8 bytes | Checker and loader reject | Node/runtime | Same files as above |
| Parsed entity count differs from metadata | Checker and loader reject | Node/runtime | Same files as above |
| Divergent Universe combined count wrong | Checker and loader reject | Node/runtime | Same files as above |
| Recomputed source snapshot hash differs | Checker and loader reject | Node/runtime | Same files as above |
| `release.json` differs from root embedded descriptor | Checker and loader reject | Node/runtime | Same files as above |
| App `0.0.0`, minimum `0.0.1` | Incompatible; checker/loader reject | Unit/integration | All three integrity test suites |
| App `0.0.1`, minimum `0.0.1` | Compatible | Unit/integration | All three integrity test suites |
| App `0.1.0`, minimum `0.0.1` | Compatible by numeric comparison | Unit | `apps/web/tests/knowledge-schemas.test.ts` |
| New incompatible release with valid old cache | New release rejected; old valid cache retained | Runtime integration | `apps/web/tests/knowledge-cache.test.ts` |
| Cache missing one non-character row | Not fresh; online repair or offline unavailable | Runtime integration | `apps/web/tests/knowledge-cache.test.ts` |
| Cache missing count metadata | Not accepted as valid | Runtime integration | `apps/web/tests/knowledge-cache.test.ts` |
| Cache contains schema-invalid row | Not accepted as valid | Runtime integration | `apps/web/tests/knowledge-cache.test.ts` |
| Complete cache, same version | `fresh` | Runtime integration | `apps/web/tests/knowledge-cache.test.ts` |
| Complete cache, network offline | `offline_cache_active` | Runtime integration | `apps/web/tests/knowledge-cache.test.ts` |
| Benchmark preflight cannot complete | Final FAIL, executor returns 1 | Node integration | `tools/tests/knowledge-benchmark.test.ts` |
| Benchmark gzip budget passes | Criterion PASS; final exit 0 when all pass | Node integration | `tools/tests/knowledge-benchmark.test.ts` |
| Benchmark gzip budget fails | Failure listed; no final PASS; exit 1 | Node integration | `tools/tests/knowledge-benchmark.test.ts` |
| Each performance budget fails synthetically | Each named criterion produces exit 1 | Unit | `tools/tests/knowledge-benchmark.test.ts` |
| Measurement throws | Final FAIL and exit 1; DB cleanup still runs | Node integration | `tools/tests/knowledge-benchmark.test.ts` |
| Current committed snapshot | Build/check/benchmark all exit 0 | CLI integration | Existing scripts plus Task 7 gate |

## 9. Validation Sequence

Run from repository root with Node 24.19.x. Each command is a blocking gate: stop immediately if its exit code is non-zero.

### Runtime gate

1. `node --version`
   - Required: `v24.19.x` and `<25`.
2. `pnpm --version`
   - Required: `10.20.0` or another version satisfying `>=10.0.0`.

### Focused tests

3. `pnpm --filter @astralyn/web exec vitest run tests/knowledge-schemas.test.ts`
4. `pnpm --filter @astralyn/web exec vitest run tests/knowledge-cache.test.ts`
5. `pnpm --filter @astralyn/web exec vitest run tests/knowledge-interop.test.ts`
6. `pnpm test:knowledge-tools`

### Typecheck

7. `pnpm typecheck`

### Lint

8. `pnpm lint`

### Full tests

9. `pnpm test`

### Knowledge integrity gates

10. `pnpm knowledge:build`
11. `git diff -- apps/web/public/data`
    - Stop if any canonical entity JSON changes unexpectedly.
12. `pnpm knowledge:check`
13. `pnpm knowledge:benchmark`

### Adjacent regression gate

14. `pnpm assets:check`
    - Required because knowledge checker retains asset interoperability behavior. Do not run `assets:sync`.

### Formatting

15. `pnpm format:check`

### Build

16. `pnpm build`
    - Appropriate because shared types, browser imports, JSON module imports, and Node tools change.

### Final repository checks

17. `git diff --check`
18. `git status --short`
19. Inspect `git diff -- package.json packages/shared/src/knowledge apps/web/src/lib/knowledge apps/web/tests tools apps/web/public/data`.
    - Required: no `pnpm-lock.yaml`, UI, worker, asset, or existing docs changes.

`pnpm test:e2e` is not required for this closure because no route, component, or browser interaction changes. Run it only if project CI independently mandates all E2E suites.

## 10. Execution Order / Dependencies

1. Task 1 establishes filename, hash, SemVer, root, and consistency interfaces used everywhere else.
2. Task 2 consumes Task 1 and makes the current generated release compatible before stricter runtime/tool checks become the normal baseline.
3. Task 3 consumes Task 1 and the regenerated Task 2 release. It creates reusable filesystem fixtures used again by Task 6.
4. Task 4 consumes Task 1 and valid test fixture builders. It must complete before cache behavior is tightened.
5. Task 5 depends on Task 4 because only fully validated loaded releases may provide expected cache counts.
6. Task 6 depends on Task 3 because benchmark preflight reuses `checkKnowledgeIntegrity()` and its injectable paths.
7. Task 7 runs only after Tasks 1 through 6 pass their focused gates.

Do not parallelize Tasks 1 through 6. They modify shared contracts and fixtures with direct ordering dependencies.

## 11. Manual Actions / Gates

- Required manual gate: provide Node 24.19.x. Current environment is Node 22.19.0 and cannot supply authoritative final validation.
- No new dependency approval is needed.
- No D1 database, Cloudflare account, OAuth credential, secret, or external service is needed.
- No manual canonical-data or asset edit is needed.

## 12. Risks and Regression Watchlist

- **Legacy cache invalidation:** Existing browser caches lack `entityCounts`. Expected behavior is one online repair sync; offline use is denied until repaired.
- **Manifest strictness:** Any future canonical filename addition must update the shared tuple, builder, schemas, checker, loader, and tests together.
- **Root/release duplication:** Root embeds the full release descriptor. Strict comparison will reject publication drift that previously passed.
- **Line-ending sensitivity:** Checksums are byte-sensitive. Do not normalize fetched or on-disk JSON before hashing.
- **Browser byte integrity:** Hash and size the raw response `Uint8Array` before UTF-8 decoding. Re-encoding `response.text()` is not byte-for-byte evidence when BOM or invalid byte sequences are present.
- **SemVer scope:** Core numeric SemVer only. Do not accidentally accept lexicographic ordering or silently strip unsupported suffixes.
- **Cache scan cost:** Schema-validating cached rows adds startup work. Keep it inside cache inspection and verify benchmark/runtime impact without adding a second abstraction.
- **Benchmark flakiness:** Regression tests must inject measurements or generous budgets. Only the real CLI run evaluates current machine timing.
- **Generated artifacts:** Running `knowledge:build` must not rewrite canonical payloads. Unexpected payload diffs indicate nondeterminism or scope expansion and are a stop condition.
- **Fail-safe rollback:** New validation errors must flow through existing rejection states without clearing previously validated tables.

## 13. Deferred / Follow-up Findings

These findings are verified but must not be fixed during this closure:

- `docs/00-README.md` still labels the pack as a planning baseline. `docs/13-ROADMAP.md` calls Phase 1.1 current while its detailed section and Phase 2 are marked complete.
- `docs/07-SOURCE_POLICY.md` defines Tier B as editorial and Tier C as community. `CONTEXT.md`, `docs/04-DATA_MODEL.md`, and `packages/shared/src/knowledge/provenance.ts` define Tier B as structured community and Tier C as editorial.
- `docs/12-TESTING_STRATEGY.md` says 8/8 combat paths; current schemas/assets contain 9 including Elation.
- `docs/10-DESIGN.md` says 51 assets and 8 paths; current asset manifest contains 55 assets and 9 paths.
- Asset manifest game version remains `3.0.x` while knowledge snapshot game version is `4.5`; every current asset remains `manual_review`.
- Docs claim `tools/sync-assets.ts --full` has proven full-catalog discovery, but implementation always assigns `REPRESENTATIVE_DEV_SNAPSHOT` to `targets`.
- `KnowledgeRepository.searchEntities()` advertises eight result entity types but currently searches only characters, light cones, and relic sets.
- `KnowledgeRepository.initialize()` sets `initialized = true` even when sync returns `unavailable`.
- Knowledge React hooks collapse read errors into empty data and do not expose error state.
- Missing favicon, nested interactive controls, and other UI audit findings belong to a separate UI/accessibility task.
- Phase 3 remains entirely out of scope.

## 14. Definition of Done

- [ ] Exact six-file manifest contract enforced by shared Zod schemas.
- [ ] Required checksums are exhaustive, valid SHA-256 values, and mutually consistent.
- [ ] Physical checksum and byte-size validation enforced in CLI and runtime.
- [ ] Entity counts enforced for every canonical file, including combined DU count.
- [ ] Root, embedded release, `release.json`, file metadata, and source snapshot hash agree.
- [ ] Numeric SemVer compatibility accepts equal/newer app and rejects older app.
- [ ] Builder derives minimum app version from `apps/web/package.json`.
- [ ] Generated root/release manifests use `minAppVersion: "0.0.1"`.
- [ ] Runtime loader rejects incomplete, corrupt, inconsistent, and incompatible releases.
- [ ] Cache reuse requires all metadata, exact eight-table counts, and schema-valid rows.
- [ ] Existing valid-cache rollback and offline fallback remain green.
- [ ] Benchmark preflight failure produces exit 1.
- [ ] Missing benchmark file produces exit 1.
- [ ] Every budget failure produces exit 1 and no PASS banner.
- [ ] Benchmark success produces exit 0 and one final PASS banner.
- [ ] Regression matrix implemented with Vitest plus `node:test`/`tsx` only.
- [ ] `pnpm test` includes tool, web, and worker test suites.
- [ ] Focused tests, typecheck, lint, full tests, knowledge checks, asset check, format check, and build pass under Node 24.19.x.
- [ ] No dependency or lockfile change.
- [ ] No application UI, worker, asset, Phase 3, or existing documentation change.
- [ ] Final Git diff contains only files listed in Section 6.

## 15. Executor Handoff

Executor target: Gemini 3.7 Flash High with no prior conversation context.

### Start here

1. Confirm `node --version` reports 24.19.x.
2. Read this plan completely.
3. Inspect current Git status. Preserve unrelated user changes.
4. Execute one task at a time with its focused test gate before continuing.

### Task execution order

`Task 1`, `Task 2`, `Task 3`, `Task 4`, `Task 5`, `Task 6`, then `Task 7`. Do not reorder or parallelize shared-contract work.

### Files that must be read first

- `package.json`
- `apps/web/package.json`
- `packages/shared/src/knowledge/version.ts`
- `packages/shared/src/knowledge/release.ts`
- `tools/build-knowledge.ts`
- `tools/check-knowledge.ts`
- `tools/benchmark-knowledge.ts`
- `apps/web/src/lib/knowledge/loader.ts`
- `apps/web/src/lib/knowledge/syncer.ts`
- `apps/web/tests/knowledge-schemas.test.ts`
- `apps/web/tests/knowledge-cache.test.ts`

### Commands to run

- Per-task focused commands are mandatory.
- Final command order is Section 9.
- Stop immediately on any non-zero exit code. Diagnose task-related failures before proceeding.

### Files that must NOT be touched

- `pnpm-lock.yaml`
- `apps/worker/**`
- `apps/web/src/components/**`
- `apps/web/src/routes/**`
- `apps/web/src/router.tsx`
- `apps/web/public/game-assets/**`
- `packages/shared/src/knowledge/fixtures/**`
- Existing files under `docs/**`, except this handoff document must remain unchanged during execution.
- Any D1, Drizzle, Better Auth, OCR, recommendation, or deployment file.

### Stop conditions

- Node is not 24.19.x.
- Any required fix needs a new dependency.
- A canonical gameplay fixture or any of the six data JSON payloads changes.
- `pnpm-lock.yaml` changes.
- Root/release compatibility cannot be repaired without a package version bump.
- A fix requires Phase 3, UI, asset, ingestion, or source-policy work.
- Existing rollback behavior cannot be preserved.
- A required validation command fails for an unrelated pre-existing reason. Report evidence instead of hiding or widening scope.

### Manual-action gates

Only Node 24.19.x is required. No credentials, services, dependency approval, or asset work is needed for this closure.
