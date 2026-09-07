# Astralyn: data ingestion and publication

## Current status

The repository has deterministic snapshot build and validation tools, source adapter interfaces, persistence schemas, a protected export endpoint, and ingestion orchestration scaffolding.

It does **not** currently ship configured real production adapters or a GitHub Actions workflow. The scheduled Worker path intentionally performs no ingestion when no real adapters are configured. Documentation and UI must not describe automated current-patch publication as active production behavior.

## Trust boundary

- Tier A official facts may define canonical game mechanics and metadata.
- Tier B structured community data may provide IDs, mappings, and source material that requires validation.
- Tier C editorial data may inform recommendation comparisons when explicitly available.
- Astralyn roles and mechanic tags are internal mappings derived from stored kit facts, not official HoYoverse classifications.

See [Source policy](07-SOURCE_POLICY.md) and [Character taxonomy](15-CHARACTER_TAXONOMY.md).

## Implemented publication path

```text
canonical fixtures and taxonomy overlay
  |
  | pnpm knowledge:build
  v
schema validation and deterministic ID ordering
  |
  v
versioned JSON files and SHA-256 release manifest
  |
  | pnpm knowledge:check
  v
file, hash, schema, duplicate, and reference verification
  |
  v
apps/web/public/data/<knowledge-version>/
```

`pnpm knowledge:build` is a write operation. Run it only for an intentional data release and review every generated change. `pnpm knowledge:check` is read-only validation.

## Implemented ingestion foundations

- Shared `SourceAdapter` contracts.
- D1 tables for sources, snapshots, recommendation sets, and items.
- Adapter isolation so one failure does not automatically abort every source.
- Protected `GET /api/_internal/export-release` using `INTERNAL_BUILDER_SECRET`.
- Build tooling support for fetching an export when the explicit secret and endpoint are supplied.
- Safe scheduled-handler no-op when production adapters are absent.

## Known production gaps

- No committed real official or editorial adapter configuration.
- No committed scheduled CI workflow.
- The orchestrator content hash helper is scaffolding, not a production cryptographic hash contract.
- No deployed Worker, remote D1 verification, or production secret provisioning.
- No automated patch-transition exercise against a live release.

## Publication rules

1. Never fetch official or community sources per user request.
2. Never publish a partially validated release.
3. Never let editorial data overwrite official fact fields.
4. Never infer the active patch from the browser clock.
5. Keep source URL, source ID, authority tier, game version, and verification time with evidence.
6. Preserve the previous published release when fetching, parsing, validation, or checksum generation fails.
7. Review source terms and access policy before enabling automation.

## Release layout

```text
/data/manifest.json
/data/<knowledge-version>/release.json
/data/<knowledge-version>/characters.json
/data/<knowledge-version>/light-cones.json
/data/<knowledge-version>/relics.json
/data/<knowledge-version>/enemies.json
/data/<knowledge-version>/stages.json
/data/<knowledge-version>/divergent-universe.json
```

The root manifest selects the active immutable release. The client verifies release hashes before replacing its local cache.
