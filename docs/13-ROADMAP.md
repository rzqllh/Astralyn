# Astralyn: roadmap

## Current position

Phases 0 through 10C are represented in the repository history. Local implementation and automated validation are substantially complete for the current MVP, but a public production release has not happened.

The roadmap is descriptive, not a promise of release dates.

## Completed foundations

### Phase 0 to 2.5: workspace, design, and knowledge

- Node 24 / pnpm monorepo with web, Worker, shared, and tooling packages.
- React/Tailwind/Radix interface foundations and production/dev data boundaries.
- Versioned Zod knowledge schemas, static releases, hashes, Dexie cache, and fallback behavior.
- Conservative separation of canonical facts, internal taxonomy, editorial data, and visual assets.

### Phase 3A to 4: D1, auth, and roster

- Drizzle migrations and D1 repositories.
- Better Auth Google OAuth integration for configured local environments.
- Session-scoped profile, onboarding, roster, and saved-team behavior.
- Roster add, update, remove, and persistence flows.

### Phase 5 to 7: recommendations and DU

- Deterministic team scoring, reason codes, focus handling, and golden fixtures.
- Character catalog, dossiers, role matrix, recommendations, and saved teams.
- Client-side Tesseract OCR, canonical entity matching, manual fallback, DU scoring, and local run persistence.

### Phase 8 to 9: tooling and hardening

- Ingestion interfaces, persistence, consensus scaffolding, protected release export, and safe no-op scheduled behavior.
- Unit/integration/E2E coverage, production-boundary checks, accessibility automation, and dry-run builds.

Production adapters, committed CI scheduling, and live deployment were not completed by these phases.

### Phase 10A: canonical roster expansion

- Expanded the published character catalog from the original curated nine to 92 HSR 4.5 character records.
- Preserved provenance and versioned static publication contracts.

### Phase 10B and 10B.1: full roster usability and bounded scope

- Made all 92 canonical records discoverable in catalog and roster workflows.
- Added explicit `all_characters` and `owned_only` recommendation scopes.
- Prevented canonical availability from becoming synthetic ownership.
- Added deterministic prefiltering with a 16-candidate and 1,820-team maximum.
- Preserved unknown-taxonomy Limited Data behavior and curated scoring regressions.

### Phase 10C: evidence-backed taxonomy

- Added official-kit evidence and character-specific provenance for 83 imported characters.
- Reached 92 complete Astralyn taxonomy mappings.
- Kept the distinction between verified source facts and Astralyn role/tag interpretation.
- Left scoring weights and evaluation bounds unchanged.

## Release blockers

1. Choose and commit a same-origin production topology for the static client and Worker API.
2. Provision production Worker secrets and Google OAuth configuration.
3. Apply and verify remote D1 migrations.
4. Run a production auth, roster, recommendation, navigation, cache, and DU smoke test.
5. Decide whether any game artwork is approved for production; fallback silhouettes remain safe.
6. Replace ingestion scaffolding with reviewed real adapters before claiming automated freshness.
7. Expand non-character knowledge before claiming broad HSR database coverage.

See [Deployment](16-DEPLOYMENT.md).

## Deferred product work

- Content Advisor for Memory of Chaos, Pure Fiction, and Apocalyptic Shadow.
- Settings UI and account deletion.
- Complete editorial source comparison and source-aware build rankings.
- Broader light cone, relic, enemy, stage, and DU coverage.
- Roster screenshot import and stage recognition.
- Rich build optimization, damage simulation, and cross-device DU sync.

These items are not part of the current runnable contract until separately specified and implemented.

## Production readiness criteria

- Verified public origin and deployment record.
- Production OAuth and D1 behavior tested end to end.
- No unbounded public compute path.
- Knowledge release checks and cache repair pass.
- Recommendation golden fixtures and deterministic repeat tests pass.
- Production bundle contains no dev-only fixtures or unapproved assets.
- Primary route accessibility and responsive behavior pass automated and manual checks.
- Documentation links to the actual live origin and states remaining limitations accurately.
