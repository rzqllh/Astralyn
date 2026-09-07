# Astralyn v0.1: MVP scope

## Scope statement

The local MVP proves four connected capabilities: versioned game knowledge, explicit roster ownership, bounded deterministic recommendations, and a browser-local Divergent Universe assistant.

Public deployment is a release gate, not a completed MVP capability. See [Deployment](16-DEPLOYMENT.md).

## Implemented

### Public knowledge

- 92-character HSR 4.5 catalog.
- Character search and Path, element, rarity, and ownership filters.
- Character kit, trace, Eidolon, provenance, and taxonomy evidence views.
- Versioned static release loading with SHA-256 verification.
- IndexedDB caching and safe same-version hash repair.

### Account and roster

- Better Auth with Google OAuth when local credentials are configured.
- D1-backed profile, roster, and saved-team data.
- First-run roster onboarding.
- Roster add, update, remove, and reload persistence at `/roster`.
- Four-member saved-team CRUD.

### Team recommendations

- Guest and authenticated `All Characters` scope.
- Authenticated `My Roster` scope.
- Optional focus character.
- Deterministic Top 3 results and reason codes.
- Explicit insufficient-roster response for fewer than four eligible characters.
- Maximum 16 scoring candidates and 1,820 unanchored evaluations.
- Limited-taxonomy fallback contract without fabricated role or tag evidence.

### Divergent Universe

- Local party and target-equation setup.
- Manual blessing, equation, and curio choices.
- Tesseract.js OCR in a Web Worker.
- Canonical fuzzy matching and manual correction.
- Ranked result and commit to persisted local run state.

### Quality controls

- Unit, integration, and Playwright E2E suites.
- Knowledge, migration, production-boundary, and asset checks.
- Dry-run Worker build and production web build.
- Automated Axe checks on covered routes and states.

## Partially implemented

- Build associations use deterministic Path and mechanic compatibility; they are not complete multi-source Best-in-Slot rankings.
- Static knowledge beyond characters is a curated subset.
- Ingestion, consensus, and export foundations exist, but real production adapters and scheduled CI execution are not configured.
- Development-only game assets exist for inspection; production uses fallback silhouettes.

## Not implemented

- Live public deployment and production OAuth.
- Content Advisor for Memory of Chaos, Pure Fiction, and Apocalyptic Shadow.
- Settings management UI.
- Complete editorial three-source comparison.
- Automatic account import or HoYoLAB session scraping.
- Roster screenshot batch import.
- Relic optimizer, damage simulator, warp history, achievements, or social features.
- Server-side screenshot storage or paid AI dependency.

## Scope guard

A change belongs in v0.1 only when it strengthens an existing knowledge, roster, recommendation, DU, security, or release contract. New modules require separate product approval.
