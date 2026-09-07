# Astralyn documentation

This directory describes the repository as it exists today. Product requirements and roadmap files record intended scope; architecture, data, engine, security, and testing files document implemented contracts.

For the fastest evaluation path, begin with the root [README](../README.md), run the local app, then use the links below.

## Reading paths

### Evaluating the product

1. [README](../README.md): current capabilities, limits, setup, and public-demo status.
2. [MVP scope](02-MVP_SCOPE.md): implemented and deferred surface area.
3. [Recommendation engine](08-RECOMMENDATION_ENGINE.md): scope, bounded evaluation, taxonomy, and scoring behavior.
4. [OCR and DU flow](09-OCR_PIPELINE.md): local screenshot processing and manual fallback.
5. [Deployment](16-DEPLOYMENT.md): current release blockers and verification checklist.

### Contributing code or data

1. [Architecture](03-ARCHITECTURE.md)
2. [Domain glossary](../CONTEXT.md)
3. [Data model](04-DATA_MODEL.md)
4. [Source policy](07-SOURCE_POLICY.md)
5. [Testing strategy](12-TESTING_STRATEGY.md)
6. [Character taxonomy evidence](15-CHARACTER_TAXONOMY.md)

### Reviewing product direction

1. [Product requirements](01-PRD.md)
2. [MVP scope](02-MVP_SCOPE.md)
3. [Design and UX](10-DESIGN.md)
4. [Roadmap](13-ROADMAP.md)
5. [Decision log](14-DECISIONS.md)

## Document map

| Document | Purpose |
| --- | --- |
| [01: Product requirements](01-PRD.md) | Product goals and intended user flows |
| [02: MVP scope](02-MVP_SCOPE.md) | Current MVP boundary and explicit exclusions |
| [03: Architecture](03-ARCHITECTURE.md) | Runtime topology, packages, storage, and failure behavior |
| [04: Data model](04-DATA_MODEL.md) | D1 user data, static knowledge, provenance, and cache contracts |
| [05: Auth and onboarding](05-AUTH_ONBOARDING.md) | Google OAuth, local setup, roster lifecycle, and auth failure states |
| [06: Data ingestion](06-DATA_INGESTION.md) | Implemented tooling versus production adapter work |
| [07: Source policy](07-SOURCE_POLICY.md) | Authority tiers, evidence boundaries, and asset licensing policy |
| [08: Recommendation engine](08-RECOMMENDATION_ENGINE.md) | Deterministic scoring contract and evaluation bounds |
| [09: OCR pipeline](09-OCR_PIPELINE.md) | Tesseract worker, matching, privacy, and fallback behavior |
| [10: Design](10-DESIGN.md) | Current visual system, route states, responsiveness, and accessibility |
| [11: Security](11-SECURITY_HARNESS.md) | Trust boundaries, authorization invariants, and secrets |
| [12: Testing](12-TESTING_STRATEGY.md) | Validation commands and critical regression coverage |
| [13: Roadmap](13-ROADMAP.md) | Completed phases, present gaps, and future work |
| [14: Decisions](14-DECISIONS.md) | Append-only ADR-lite history; newer decisions supersede older ones |
| [15: Character taxonomy](15-CHARACTER_TAXONOMY.md) | Evidence behind Astralyn role and mechanic-tag mappings |
| [16: Deployment](16-DEPLOYMENT.md) | Public status link and production release requirements |

## Current repository facts

- Knowledge release: HSR 4.5 / `v1.0.0`.
- Canonical characters: 92.
- Recommendation taxonomy coverage: 92 complete, 0 partial, 0 unknown.
- Maximum recommendation candidates: 16.
- Maximum unanchored team evaluations: 1,820.
- Public deployment: none at the time of this documentation update.
- Production game artwork: none approved; runtime fallback art remains the production-safe behavior.

The [deployment status page](https://github.com/rzqllh/Astralyn/deployments) is the public source for future deployment records. A live application URL should only be added after a successful deployment and production smoke test.
