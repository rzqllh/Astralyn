# Astralyn — Data Model

## 1. Data domains

Astralyn separates five domains:

A. Identity and user data — authenticated user domain (Better Auth + Astralyn user tables in Cloudflare D1).  
B. Canonical Game Knowledge — official facts normalized from trusted HoYoverse sources.  
C. Editorial recommendations — source-specific guide/ranking data with provenance.  
D. Generated Astralyn intelligence — consensus, scores, reason codes and publishable snapshots.  
E. Visual Game Assets — versioned static asset manifest and localized game imagery.

A user write must never cross into B/C/D/E canonical tables or static assets.

## 2. Identity tables

Better Auth manages core authentication (`user`, `session`, `account`, `verification`). Astralyn binds application domain tables to the authenticated user ID (`user.id`).

### user (Better Auth)
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `email` (TEXT UNIQUE)
- `emailVerified` (INTEGER)
- `image` (TEXT)
- timestamps

### profiles (Astralyn)
- `user_id` (TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE)
- `display_name` (TEXT)
- `preferred_language` (TEXT: 'en' | 'id')
- `onboarding_completed_at` (ISO timestamp TEXT)
- timestamps

### user_roster (Astralyn)
- `user_id` (TEXT REFERENCES user(id) ON DELETE CASCADE)
- `character_id` (TEXT REFERENCES game_characters(id))
- `level` (INTEGER: 1–80)
- `eidolon` (INTEGER: 0–6)
- `is_owned` (INTEGER: 0 | 1)
- timestamps
- `PRIMARY KEY (user_id, character_id)`

### saved_teams (Astralyn)
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT REFERENCES user(id) ON DELETE CASCADE)
- `name` (TEXT)
- `mode` (TEXT)
- timestamps

### saved_team_members (Astralyn)
- `team_id` (TEXT REFERENCES saved_teams(id) ON DELETE CASCADE)
- `slot` (INTEGER: 1–4)
- `character_id` (TEXT REFERENCES game_characters(id))
- `PRIMARY KEY (team_id, slot)`

## 3. Versioning

### game_versions
Represents official HSR versions such as `3.0`.

Fields:
- `id` (TEXT PRIMARY KEY)
- `version_number` (TEXT: '3.0')
- `released_at` (ISO timestamp TEXT)
- `is_active` (INTEGER: 0 | 1)

### knowledge_releases
Immutable published knowledge release hash.

Fields:
- `id` (TEXT PRIMARY KEY)
- `game_version_id` (TEXT REFERENCES game_versions(id))
- `release_tag` (TEXT)
- `published_at` (ISO timestamp TEXT)
- `checksum` (TEXT)

## 4. Game Knowledge tables

- `game_characters`
- `game_light_cones`
- `game_relic_sets`
- `game_planar_sets`
- `game_du_blessings`
- `game_du_curios`
- `game_du_equations`

## 5. Editorial recommendations tables

- `source_adapters`
- `source_recommendations`

## 6. Generated Astralyn intelligence

- `consensus_recommendations`

## 7. DU runtime

For MVP, current DU state remains primarily in IndexedDB.

Core recommendation code must not require cloud persistence.

## 8. Client snapshots

The client consumes denormalized static JSON snapshots rather than querying the relational D1 database on every page.

Cloudflare D1 is the canonical relational store; published static JSON is the product-serving format.

## 9. Visual Game Asset Manifest Model

Visual game assets are tracked in `packages/shared/src/assets.ts` and synced to `/game-assets/<release>/manifest.json`.

```ts
interface AssetRecord {
  id: string;
  entityType:
    | "character_icon"
    | "character_preview"
    | "character_portrait"
    | "element_icon"
    | "path_icon"
    | "light_cone_icon"
    | "relic_set_icon"
    | "planar_ornament_icon"
    | "du_blessing_icon"
    | "du_curio_icon"
    | "du_equation_icon"
    | "relic_slot_icon"
    | "item_icon"
    | "currency_icon"
    | "status_icon"
    | "background_art"
    | "ui_decor";
  entityId: string;
  variant?: "icon" | "preview" | "portrait" | "full" | "splash" | "card" | "banner";
  localPath: string; // e.g. "/game-assets/v1.0.0/characters/acheron_icon.png"
  source: string; // e.g. "Mar-7th/StarRailRes"
  sourceUrl?: string;
  license: string; // e.g. "AGPL-3.0 (Tooling) / Fair Use Fan Content (Imagery)"
  copyrightOwner: string; // e.g. "COGNOSPHERE / HoYoverse"
  usageStatus: "official_fan_use" | "curated_community" | "provisional_fallback" | "internal_original";
  attribution?: string;
  fallbackPriority: number;
  approvedBy: string;
  approvedAt: string;
  checksum?: string; // SHA-256
}

interface AssetManifest {
  assetRelease: string; // e.g. "v1.0.0"
  gameVersion: string; // e.g. "3.0.x"
  generatedAt: string;
  assets: AssetRecord[];
}
```
