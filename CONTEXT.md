# Astralyn Domain Glossary & Context

## 1. Domain Boundaries

Astralyn separates game domain concerns into five strictly partitioned layers:

1. **Canonical Game Knowledge (Tier A - Official Factual Authority):**
   Official game mechanics, base multipliers, element designations, 9 combat paths (including playable Path of Elation), traces, eidolons, light cones, relics, enemies, stage rotations, and Divergent Universe entities. Normalized from authoritative HoYoverse sources (HSR 4.5 Official Notices, HoYoWiki, HoYoLAB). Immutable from user input, prompts, AI responses, or OCR.

2. **Structured Community Mapping (Upstream Index):**
   Structured open data and asset archives (e.g. `StarRailRes`, `TurnBasedGameData`) used for asset file paths, internal game IDs, and texture mapping. Non-authoritative for factual balance or mechanics.

3. **Editorial Recommendations (Tier C - Multi-Source Theorycraft):**
   Independent third-party build guides, tier lists, and damage calculations (e.g. Prydwen, Game8, Guobie/Sheet Theory) with explicit provenance, last-updated timestamps, and patch freshness tags. Must never silently override Tier A facts.

4. **Astralyn Verdict (Derived Intelligence):**
   Deterministic evaluation output synthesized from multi-source consensus, official mechanical rules, and user roster context.

5. **Visual Game Assets:**
   Versioned static game imagery decoupled from knowledge domain, managed conservatively under the HoYoverse Fan Content Policy. In the current verified repository state, 52 candidate PNG assets are quarantined strictly as dev-only data (`/src/dev/game-assets/<release>/...`) with `usageStatus: "manual_review"`, while 0 assets are approved for production bundles (which render accessible vector fallback silhouettes).

---

## 2. Core Domain Terminology

- **GameVersion:** Official Honkai: Star Rail client patch release (Baseline: Version 4.5 "To Roll the Stars in Astropolis", active as of August 26, 2026).
- **CombatPath:** 9 official playable Paths in HSR: `Destruction`, `Hunt`, `Erudition`, `Harmony`, `Nihility`, `Preservation`, `Abundance`, `Remembrance`, `Elation`.
- **FactProvenance:** Strongly typed provenance record (`sourceId`, `authorityTier`, `sourceUrl`, `gameVersion`, `verifiedAt`) attached to every canonical knowledge entity.
- **StageTemporality:** Strict rotation identifier (`rotationId`, `cycle`) on stage knowledge preventing collision between rotating seasons of MoC, Pure Fiction, and Apocalyptic Shadow.
- **KnowledgeRelease:** Immutable factual knowledge release snapshot identified by `knowledgeVersion` (e.g. `v1.0.0`), containing file checksums, source snapshot hash, and compatibility metadata.
- **KnowledgeReleaseManifest:** Strongly typed descriptor tracking all static data files, record counts, and SHA-256 hashes for a specific knowledge release.
- **RootKnowledgeManifest:** Global static index (`/data/manifest.json`) indicating the current published knowledge release and available historical releases.
- **Dexie Client Knowledge Cache:** Local browser IndexedDB cache mirroring the published static knowledge snapshot for offline fallback, search indexing, and sub-millisecond UI reads. Not a primary source of truth.
- **Runtime Checksum Verification:** Pre-decode byte hash verification in client loaders ensuring raw JSON matches the release manifest SHA-256 before decoding and caching.
- **Fail-Safe Rollback:** Cache update invariant guaranteeing that if a newly published release fails network transmission or runtime schema validation, the client strictly preserves the previous valid cache.
- **Search Normalization & Alias Boundary:** Deterministic lowercased, diacritic-stripped string representation separating official localized names from classified community/acronym aliases.
- **Production Data Boundary:** Build-time and lint-enforced boundary guaranteeing zero reachability of dev/fixture assets or test mock states from production web bundles.
- **Fail-Closed Asset Pipeline:** Binary header sniffing and integrity verification (`tools/check-assets.ts`) rejecting disguised formats and preventing unapproved assets from leaking into production.
