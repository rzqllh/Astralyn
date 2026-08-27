# Astralyn — Data Ingestion

## Purpose

Keep canonical Game Knowledge aligned with the latest official HSR patch without hitting official sources on every user request.

## Critical rule

Do not assume a single public complete “HoYoverse HSR database API” exists.

The ingestion layer uses **approved official HoYoverse-source adapters**. Each adapter has a documented source, parser, validation contract and access policy.

Official factual sources have priority over guide/community sources.

## Pipeline

```text
Official sources
      ↓
Change detection
      ↓
Fetch only when needed
      ↓
Parse
      ↓
Normalize
      ↓
Schema validation
      ↓
Cross-field validation
      ↓
Draft knowledge release
      ↓
Regression tests
      ↓
Publish
      ↓
Generate static snapshots
```

## Cadence

### Normal period
- lightweight source/version check roughly once per day.

### Patch window
- increase checks around expected patch release;
- manual workflow dispatch allowed.

### User traffic
- must not affect source polling frequency.

Ten users and one hundred thousand users should produce roughly the same official-source ingestion traffic.

## Change detection

Use when available:
- `ETag`;
- `Last-Modified`;
- content hash;
- official version/update identifier.

Flow:
1. cheapest metadata/conditional check;
2. unchanged → stop;
3. changed → fetch and parse;
4. normalized hash unchanged → do not publish.

## Official source allowlist

Keep it in config, not scattered through code.

```yaml
official_sources:
  - id: hsr_official_site
    domain: hsr.hoyoverse.com
  - id: hoyolab_official_hsr
    domain: hoyolab.com
```

Every adapter documents accepted URLs, extracted fields, access/ToS review status, change detection, parser owner and fixtures.

## Patch awareness

Every record/snapshot carries:
- game version;
- knowledge version;
- source snapshot hash;
- verified timestamp.

Never infer “latest patch” solely from the client clock. The ingestion/publishing pipeline determines the current release.

## Draft vs publish

States:

```text
fetched
parsed
validated
draft
published
rejected
```

Never write fetched data straight into the active published snapshot.

Publish requires schema validation, entity/reference checks, regression tests, and manual approval when a major parser/source contract changes.

## Factual vs editorial ingestion

Factual data: official mechanics, identities, skill/content rules. Official source wins.

Editorial data: builds, teams, rankings. Multiple independent sources feed Astralyn consensus.

Editorial data can never overwrite factual fields.

## Rate limiting

Per source:
- minimum check interval;
- maximum checks/day;
- exponential backoff;
- retry ceiling;
- respect `Retry-After` where relevant.

Never bypass explicit anti-bot controls.

If reliable automation is disallowed or unstable, use curated/manual adapter input with provenance instead of aggressive scraping.

## Static publication & Tooling

Static snapshots are compiled deterministically and verified with dedicated CI tools:

- `pnpm knowledge:build` (`tools/build-knowledge.ts`):
  - Validates all source fixtures against Zod 4 runtime schemas.
  - Sorts entities deterministically by ID.
  - Writes static files to `apps/web/public/data/<knowledge-version>/`.
  - Computes SHA-256 hashes and generates `release.json` and root `manifest.json`.
- `pnpm knowledge:check` (`tools/check-knowledge.ts`):
  - Validates root manifest and release descriptors.
  - Verifies disk file existence and SHA-256 bit-for-bit checksum matches.
  - Enforces schema validation, referential integrity (stage enemies), and duplicate ID rejection.
  - Checks ID interoperability with visual asset manifests.

Published release layout:

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

`manifest.json` points clients to the active release. Older releases remain for rollback according to retention policy.

## Failure policy

If ingestion or validation fails, keep the last published release and never replace valid knowledge with a partial release. Dexie client cache atomically guarantees that local clients retain their previous valid cache if a newly published release fails transmission or runtime validation.

If official facts conflict with an editorial source, official facts win and affected recommendations must be recomputed.

