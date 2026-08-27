# Astralyn Domain Glossary & Context

## 1. Domain Boundaries

Astralyn separates game domain concerns into five strictly partitioned layers:

1. **Canonical Game Knowledge (Tier A - Official Factual Authority):**
   Official game mechanics, base multipliers, element designations, combat paths, traces, eidolons, light cones, relics, enemies, stages, and Divergent Universe entities. Normalized from trusted HoYoverse sources. Immutable from user input, prompts, AI responses, or OCR.

2. **Structured Community Mapping (Upstream Index):**
   Structured open data and asset archives (e.g. `StarRailRes`, `TurnBasedGameData`) used for asset file paths, internal game IDs, and texture mapping. Non-authoritative for factual balance or mechanics.

3. **Editorial Recommendations (Tier B - Multi-Source Theorycraft):**
   Independent third-party build guides, tier lists, and damage calculations (e.g. Prydwen, Game8, Guobie/Sheet Theory) with explicit provenance, last-updated timestamps, and patch freshness tags.

4. **Astralyn Verdict (Derived Intelligence):**
   Deterministic evaluation output synthesized from multi-source consensus, official mechanical rules, and user roster context.

5. **Visual Game Assets:**
   Versioned static game imagery (`/game-assets/<release>/...`) decoupled from knowledge domain, managed conservatively under the HoYoverse Fan Content Policy.

---

## 2. Core Domain Terminology

- **GameVersion:** Official Honkai: Star Rail client patch release (e.g. `3.0.0`, `3.0`).
- **KnowledgeRelease:** Immutable factual knowledge release snapshot identified by `knowledgeVersion` (e.g. `v1.0.0`), containing file checksums, source snapshot hash, and compatibility metadata.
- **KnowledgeReleaseManifest:** Strongly typed descriptor tracking all static data files, record counts, and SHA-256 hashes for a specific knowledge release.
- **RootKnowledgeManifest:** Global static index (`/data/manifest.json`) indicating the current published knowledge release and available historical releases.
- **Dexie Client Knowledge Cache:** Local browser IndexedDB cache mirroring the published static knowledge snapshot for offline fallback, search indexing, and zero-latency UI reads. Not a primary source of truth.
- **Fail-Safe Rollback:** Cache update invariant guaranteeing that if a newly published release fails network transmission or runtime schema validation, the client strictly preserves the previous valid cache.
- **Search Normalization:** Deterministic lowercased, diacritic-stripped, punctuation-free string representation with canonical alias mapping for robust entity lookup.
