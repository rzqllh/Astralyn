# Astralyn domain glossary

This glossary defines terms used across code and public documentation. It describes the current HSR 4.5 / `v1.0.0` repository contract.

## Evidence domains

### Canonical game knowledge

Versioned facts about characters and other game entities. Records carry provenance and are published as immutable static JSON. Browser input cannot mutate them.

### Astralyn taxonomy

Internal `roles` and `mechanicTags` used for discovery and recommendation evidence. A Tier A official kit fact may justify a mapping, but the resulting Astralyn label is not an official HoYoverse classification.

### Editorial recommendations

Third-party build, ranking, or theorycraft opinions with source and patch context. Editorial records never override canonical mechanics. The current public UI reports this comparison as unavailable.

### Derived recommendation

Deterministic output from canonical facts, Astralyn taxonomy, explicit interactions, request context, and roster state. A result is not an editorial consensus unless a qualifying source set is actually attached.

### Visual game assets

Artwork and icons tracked independently from factual knowledge. The current 52 image records are development-only and marked `manual_review`; the production bundle uses fallback silhouettes.

## Core terms

- **Game version:** Official HSR patch associated with knowledge. The current snapshot declares `4.5`.
- **Knowledge version:** Astralyn release identifier. The current value is `v1.0.0`.
- **Root manifest:** `/data/manifest.json`, which selects the active knowledge release.
- **Release manifest:** `/data/<version>/release.json`, which records schema compatibility, entity files, counts, and SHA-256 hashes.
- **Fact provenance:** `sourceId`, `authorityTier`, `sourceUrl`, `gameVersion`, `verifiedAt`, and optional notes attached to sourced facts.
- **Taxonomy evidence:** Character-specific kit fact and provenance used by Astralyn to justify internal role/tag mappings.
- **Canonical scope:** All character records in the selected knowledge release. Current count: 92.
- **Scoring candidate pool:** Deterministic subset passed to full team scoring. Maximum count: 16.
- **Recommendation scope:** `all_characters` or `owned_only`.
- **Ownership:** Persisted user assertion in `user_roster`. Canonical presence does not imply ownership.
- **Focus character:** Explicit character pinned into candidate selection and every evaluated focused team.
- **Limited Data:** Existing state used when a team includes incomplete `roles` or `mechanicTags`.
- **Evaluation bound:** Maximum 1,820 four-character teams without focus and 455 with focus.
- **Insufficient roster:** Structured result when fewer than four eligible characters exist.
- **Reason code:** Machine-readable explanation for a score contribution or penalty.
- **Astralyn Verdict:** Product term for a derived recommendation. It must identify the inputs it actually used.
- **Client knowledge cache:** Dexie / IndexedDB copy of a verified static release.
- **Same-version repair:** Cache refresh when knowledge version matches but source snapshot hash differs.
- **DU run state:** Browser-local party, equation, path progress, choices, and committed selections.
- **Production data boundary:** Lint and build checks preventing development fixtures or unapproved assets from entering production source paths.
- **Trusted publisher:** Operator or protected process allowed to build and publish a new canonical release.

## Naming rules

- Use `all_characters` and `owned_only` in API and engine identifiers.
- UI may render them as **All Characters** and **My Roster**.
- Use **canonical** for published game records, not for user-owned records.
- Use **verified source fact** for sourced mechanics and **Astralyn mapping** for roles/tags.
- Do not use **complete HSR database**, **live consensus**, **production-ready**, or **deployed** unless the corresponding evidence exists.
