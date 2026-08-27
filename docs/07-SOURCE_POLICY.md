# Astralyn — Source & Provenance Policy

## Source classes

### Tier A — official factual
Examples: official HSR website and official HoYoLAB HSR updates/game information.

Use for patch version, mechanics, official names and release information.

### Tier B — established editorial
Recognized build/theorycraft guide services where ingestion/curation is permitted.

Use for builds, teams, Light Cone priority, Relics and tier opinions.

### Tier C — community evidence
Community guides, Reddit and creator/theorycrafter material.

Use for emergent strategy, DU-specific tricks and experience-based context.

Tier C never silently overrides Tier A mechanics.

---

## Visual Game Asset Provenance & Licensing Policy

Game factual knowledge and visual game assets are strictly separate domains.

### 1. Fundamental Legal Distinction: Repository License vs. Underlying Artwork
- **Source-code repository license != copyright ownership of underlying game artwork.**
- For example, while `Mar-7th/StarRailRes` distributes its repository automation scripts and metadata definitions under `AGPL-3.0`, the underlying character illustrations, icons, element symbols, and audio-visual assets remain the exclusive intellectual property of **© COGNOSPHERE / HoYoverse**.
- Astralyn treats all game visuals conservatively under the **HoYoverse Fan Content Policy & Fair Use**.
- In the asset manifest (`manifest.json`), external game assets are marked with:
  ```json
  "source": "StarRailRes",
  "repositoryLicense": "AGPL-3.0",
  "license": "HoYoverse Fan Content Policy & Fair Use",
  "copyrightOwner": "COGNOSPHERE / HoYoverse",
  "usageStatus": "manual_review"
  ```

### 2. Structured Asset Sources Evaluation

| Source | Maintenance Status | Coverage | License | Copyright Caveat | Classification |
|---|---|---|---|---|---|
| **Mar-7th/StarRailRes** | Active (updated per HSR patch) | Characters, Light Cones, Relics, Paths, Elements, DU Items (High-res PNG) | AGPL-3.0 (code/metadata) | Visuals © COGNOSPHERE / HoYoverse | **PRIMARY** |
| **Dimbreath/StarRailData** | Active (per-patch data dumps) | Raw internal client JSON/hashes, skill parameters, avatar configs | Unlicensed / Public Dump | Game configs © COGNOSPHERE / HoYoverse | **FALLBACK** (ID/text mapping) |
| **Fortex66/Honkai-Star-Rail-Assets (Yatta-top)** | Active (curated with Yatta.top) | Clean renders of characters, weapons, items, equipment | Open / Community | Game art © COGNOSPHERE / HoYoverse | **FALLBACK** (Alternative CDN assets) |
| **Pinterest / DeviantArt** | Unmanaged aggregation | Variable / uncurated | Mixed / Unlicensed | Uploader != copyright owner | **MANUAL-ONLY** (Strictly excluded from automation) |

### 3. Policy on Art Platforms (Pinterest, DeviantArt, Uncredited Reposts)
- Art aggregation platforms are **MANUAL-ONLY** and strictly forbidden from automated crawlers, scrapers, or bot ingestion.
- Reposted images do not convey copyright or permission from uploaders.
- Any future bespoke community artwork requires explicit creator consent, documented author attribution, manual review, and recorded license metadata before inclusion.

### 4. Zero Runtime Third-Party Hotlinking
- The frontend client must **never** load images directly from third-party remote origins (e.g. GitHub raw URLs, third-party wikis) during runtime user sessions.
- All production asset requests are served from versioned static asset storage (`/game-assets/<release>/...`).

### 5. Graceful Fallback Guarantee
- If an asset is missing, unapproved, or corrupted, the client `<GameAssetImage>` component renders a high-contrast Astralyn vector fallback silhouette without throwing exceptions, shifting layout, or leaking browser broken image icons.

---

## Recommendation display

Target at least three independent editorial sources where trustworthy/current data is available.

Each source exposes:
- source name;
- last update;
- patch;
- Top 1–3;
- optional short normalized notes.

If fewer than three suitable sources exist, show the available sources and label coverage incomplete. Do not invent a third source.

## Astralyn Verdict

Inputs:
- source ranks;
- freshness;
- trust weight;
- official mechanic compatibility;
- roster availability;
- game mode/stage context;
- engine rules.

The result may combine compatible components from multiple sources. The UI labels this clearly as an Astralyn-derived verdict.

## Consensus baseline

Initial rank weights:
- #1 = 1.00
- #2 = 0.70
- #3 = 0.45

Adjust by freshness, patch compatibility, source confidence and mechanic compatibility. All weights are regression-tested configuration.

## Freshness states

- current;
- compatible but older;
- stale;
- incompatible.

Do not merge incompatible patch recommendations without an explicit compatibility rule.

## Attribution

Every source-derived recommendation retains source identity.

Astralyn does not copy long guide text, hide sources, or present editorial opinions as official fact.

Store structured ranks, entities and short normalized notes instead of reproducing full pages.

## Access policy

Every automated source adapter has `terms_review_status`:
- approved;
- manual-only;
- blocked;
- review-needed.

A technically scrapeable page is not automatically approved for automated ingestion.

## Disagreement

If sources strongly disagree:
- lower confidence;
- surface disagreement;
- use mechanics/context to break ties;
- never pretend consensus exists.

## Best Characters

Ranking pages are contextual. Required dimensions where applicable: patch, role, game mode and assumptions.
