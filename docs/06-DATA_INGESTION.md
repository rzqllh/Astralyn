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

## Static publication

Example release:

```text
/data/4.4/2026.08.26.1/...
```

`manifest.json` points clients to the active release. Older releases remain for rollback according to retention policy.

## Failure policy

If ingestion fails, keep the last published release and never replace valid knowledge with a partial release.

If official facts conflict with an editorial source, official facts win and affected recommendations must be recomputed.
