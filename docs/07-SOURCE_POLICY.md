# Astralyn — Source & Provenance Policy

## 1. Source Classification Hierarchy

Game factual mechanics, editorial theorycraft guides, and visual game assets belong to distinct domains with clear tier boundaries:

### Tier A — Official Factual Mechanics & Metadata
- **Examples:** Official *Honkai: Star Rail* website, official HoYoLAB game notices, in-game client text mappings.
- **Role:** Canonical authority for patch versioning, official character names, element/path designations, base multipliers, and official mechanics.
- **Classification:** **OFFICIAL REFERENCE**

### Tier B — Established Editorial Guides & Theorycraft
- **Examples:** Recognized build repositories, verified theorycrafter damage calculation sheets, editorial guide services (e.g. Prydwen, Game8, sheet theory).
- **Role:** Input sources for light cone priority rankings, relic set rankings, main-stat priorities, team compositions, and tier evaluations.
- **Consensus Requirement:** Target at least three independent editorial sources where available.
- **Classification:** **EDITORIAL REFERENCE**

### Tier C — Community & Emergent Strategy
- **Examples:** Community guides, forum discussion threads, specialized Divergent Universe path/equation combinations.
- **Role:** Emergent gameplay tricks, niche synergy discoveries, and experience-based edge cases.
- **Boundary:** Tier C inputs never silently override Tier A official mechanics.

---

## 2. Visual Game Asset Provenance & Licensing Policy

Visual game assets (icons, character previews, portraits, element badges, path symbols) are decoupled from factual game knowledge.

### Fundamental Legal Distinction: Repository License vs. Underlying Artwork
- **Source-code repository license != copyright ownership of underlying game artwork.**
- An open-source license on an automation tool or metadata repository (such as AGPL-3.0 or MIT) applies strictly to the scraper scripts and generated index code. It does **not** relicense or grant intellectual property rights over the underlying game artwork.
- Character illustrations, weapon artwork, element emblems, and audio-visual assets remain the exclusive intellectual property of **© COGNOSPHERE / HoYoverse**.
- Astralyn treats all game visuals conservatively under the **HoYoverse Fan Content Policy (Subject to Manual Review)**.
- **Astralyn does NOT assert "fair use" or "used under fair use" as a settled legal conclusion.**
- All visual assets in the versioned asset manifest (`manifest.json`) are tagged with conservative, factual metadata:
  ```json
  "source": "StarRailRes",
  "repositoryLicense": "AGPL-3.0",
  "license": "HoYoverse Fan Content Policy (Subject to Manual Review)",
  "copyrightOwner": "COGNOSPHERE / HoYoverse",
  "usageStatus": "manual_review",
  "attribution": "Character: Acheron • © COGNOSPHERE / HoYoverse"
  ```
- *Disclaimer: This documentation is provenance and architecture policy, not formal legal advice.*

---

## 3. External Structured Asset Sources Revalidation

All external structured repositories evaluated for game assets and data mappings are audited and classified below:

| Source | Current Accessibility | Maintenance Status | Relationship to Primary | Repository License | Artwork Copyright Caveat | Final Classification | Evidence & Operational Notes |
|---|---|---|---|---|---|---|---|
| **Mar-7th/StarRailRes** | Accessible (`github.com/Mar-7th/StarRailRes`) | Active (updated per HSR patch) | **PRIMARY UPSTREAM** | AGPL-3.0 (scripts & indexes) | Visuals © COGNOSPHERE / HoYoverse | **PRIMARY UPSTREAM** | Verified primary upstream source for high-res transparent PNGs (characters, light cones, relics, paths, elements, DU icons). Used by `tools/sync-assets.ts`. |
| **VizualAbstract/StarRailStaticAPI** | Accessible (`github.com/VizualAbstract/StarRailStaticAPI`) | Active (static mirror) | **DERIVATIVE MIRROR** | MIT (wrapper code) | Visuals © COGNOSPHERE / HoYoverse | **DERIVATIVE MIRROR** | Useful operational mirror, but directly derives its static files from `StarRailRes`. Not an independent upstream fallback. |
| **Dimbreath/TurnBasedGameData** (GitLab) | Accessible (`gitlab.com/Dimbreath/TurnBasedGameData`) | Active (per-patch raw dumps) | **DATA-MAPPING FALLBACK** | Unlicensed / Data Dump | Game data © COGNOSPHERE / HoYoverse | **DATA-MAPPING FALLBACK** | Maintained successor to legacy StarRailData, hosted on GitLab. Primary value is internal TextMap hashes, skill params, and entity IDs (not curated visual assets). |
| **Dimbreath/StarRailData** (GitHub) | Inaccessible / Removed | Deprecated / Archived | N/A | Unlicensed | Game configs © COGNOSPHERE / HoYoverse | **HISTORICAL_REFERENCE** | Former GitHub repo subjected to DMCA enforcement and deprecated by maintainer. Replaced by GitLab `TurnBasedGameData`. Strictly retained for historical context only. |
| **Fortex66/Honkai-Star-Rail-Assets** | Inaccessible / Non-existent | Non-existent / Unverified | N/A | Unknown | Game art © COGNOSPHERE / HoYoverse | **REJECTED** | Repository does not exist as a verifiable public GitHub repo. Strictly rejected from current and future sync pipelines. |
| **umaichanuwu/StarRailTextures** | Accessible (`github.com/umaichanuwu/StarRailTextures`) | Irregular / Raw | Independent | Unlicensed / Community | Textures © COGNOSPHERE / HoYoverse | **REFERENCE_ONLY** | Uncurated raw texture dumps. Useful as diagnostic reference, not structured for automated application consumption. |
| **Official HoYoLAB / HSR Website** | Accessible (Official Web API/Portals) | Active (Maintained by HoYoverse) | **OFFICIAL REFERENCE** | Proprietary | © COGNOSPHERE / HoYoverse | **OFFICIAL REFERENCE** | Primary reference for official names, skill descriptions, release dates, and patch versioning (Tier A). |
| **Pinterest / DeviantArt / Art Reposts** | Accessible (Public Platforms) | Unmanaged aggregation | N/A | Mixed / Unlicensed | Uploader != copyright owner | **MANUAL-ONLY** | Art aggregation platforms are strictly excluded from automated sync. Any community art inclusion requires explicit creator consent, manual review, and individual provenance records. |

---

## 4. Source Independence & Fallback Rules

1. **No Circular or Derivative Fallbacks:** A derivative mirror (e.g. `StarRailStaticAPI`) must not be treated as an independent source of truth when evaluating consensus or upstream health.
2. **True Visual Asset Fallback:** In the event that the primary upstream (`StarRailRes`) becomes unavailable, Astralyn relies on:
   - The committed local development asset snapshot;
   - High-contrast accessible Astralyn vector fallback silhouettes (`<GameAssetImage>`);
   - Manually verified static releases stored in versioned release directories (`/game-assets/<release>/`).
3. **Zero Runtime Third-Party Hotlinking:**
   - The frontend application must **never** load images directly from third-party remote servers or GitHub raw URLs during runtime user sessions.
   - All production asset requests are served from same-origin versioned static storage (`/game-assets/<release>/...`).
4. **Asset Loading Semantics:**
   - Same-origin static image loading;
   - Reserved dimensions and aspect-ratio containers to guarantee zero layout shift;
   - In-memory manifest lookups via `getAssetUrl()` / `getAssetRecord()`;
   - Controlled asynchronous decode with automatic vector fallback rendering upon load error.

---

## 5. Recommendation Consensus Policy

### Multi-Source Target
- Editorial surfaces target at least three independent editorial sources (e.g. Source A, Source B, Source C) where trustworthy and current data is available.
- Each source exposes:
  - Source name;
  - Last updated timestamp;
  - Compatible game patch;
  - Top 1–3 ranked items;
  - Optional concise normalized notes.
- If fewer than three suitable sources exist for an entity, the UI displays the available sources and explicitly labels coverage as incomplete. Astralyn never invents a fictional source to meet the target.

### Astralyn Verdict
- The "Astralyn Verdict" is a derived recommendation produced by Astralyn's deterministic evaluation rules.
- Inputs into the Verdict:
  - Multi-source rank consensus;
  - Patch freshness and compatibility status;
  - Source confidence weights;
  - Official mechanical synergy rules;
  - User roster availability (in Phase 4+);
  - Game mode and challenge stage context.
- The UI transparently labels this output as an Astralyn-derived verdict and surfaces the underlying source consensus.

### Freshness States
- **Current:** Updated for the active game patch;
- **Compatible:** Published for an earlier patch but mechanically unchanged;
- **Stale:** Needs re-evaluation after major balance or mechanics changes;
- **Incompatible:** Contradicts current game mechanics (excluded from consensus calculations).

### Source Disagreement
- If independent sources strongly disagree:
  - Lower the composite confidence score;
  - Surface the disagreement explicitly in the UI;
  - Use mechanics and simulation context to explain trade-offs;
  - Never fabricate consensus where genuine theorycraft disagreement exists.
