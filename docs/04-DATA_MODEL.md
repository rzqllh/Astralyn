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

## 3. Versioning & Release Contracts

### GameVersion
Represents official HSR client patches (e.g. `3.0.0`, `3.0`).
- `id` (string): e.g. `'3.0.0'`
- `versionNumber` (string): e.g. `'3.0'`
- `title` (string): e.g. `'Pinnacle of Glory & The Dahlia in the Dark'`
- `releasedAt` (ISO string)
- `isActive` (boolean)

### KnowledgeReleaseManifest
Immutable published knowledge release descriptor (`/data/<version>/release.json`).
- `knowledgeVersion` (string): e.g. `'v1.0.0'`
- `gameVersion` (string): e.g. `'3.0.x'`
- `schemaVersion` (string): e.g. `'1.0.0'`
- `generatedAt` (ISO string)
- `sourceSnapshotHash` (SHA-256 string)
- `status` (`'draft' | 'validated' | 'published' | 'superseded'`)
- `files` (array of `KnowledgeFileEntry`: filename, relPath, entityCount, sizeBytes, checksum)
- `checksums` (record of filename -> SHA-256 hash)
- `compatibility` (`minAppVersion`)

## 4. Canonical Game Knowledge Schemas (`packages/shared/src/knowledge/`)

Single source of truth runtime Zod 4 schemas:

- `CharacterKnowledge`: `id`, `gameId`, `name`, `localizedNames` (`en`, `id`, `ja`, `zh`), `rarity` (4 | 5), `path` (8 Paths), `element` (7 Elements), `releaseVersion`, `roles`, `mechanicTags`, `baseStats` (HP, ATK, DEF, SPD, Taunt, Crit Rate, Crit DMG, Max Energy), `specialResourceType`, `abilities` (Basic, Skill, Ultimate, Talent, Technique, Enhanced variants), `memosprite` (Polly/summon stats and abilities), `transformation` (Stance duration & enhanced abilities), `majorTraces` (A2, A4, A6), `minorTraces`, `eidolons` (E1–E6).
- `LightConeKnowledge`: `id`, `gameId`, `name`, `rarity` (3, 4, 5), `path`, `baseStats` (HP, ATK, DEF), `skill` (name, template, superimpositions 1–5), `releaseVersion`.
- `RelicSetKnowledge`: `id`, `gameId`, `name`, `type` (`cavern_relic` | `planar_ornament`), `twoPieceEffect`, `fourPieceEffect` (optional for planar), `pieces` (slots).
- `EnemyKnowledge`: `id`, `gameId`, `name`, `category` (`minion` | `elite` | `boss` | `weekly_boss`), `weaknesses` (array of Elements), `resistances` (Element -> % resistance), `skills`, `keyMechanics`.
- `StageKnowledge`: `id`, `name`, `stageType` (`memory_of_chaos` | `pure_fiction` | `apocalyptic_shadow` | `divergent_universe`), `floorNumber`, `buffName`, `buffDescription`, `recommendedElements`, `waves`.
- `DUBlessingKnowledge`: `id`, `gameId`, `name`, `path`, `rarity` (1, 2, 3), `effect`, `enhancedEffect`.
- `DUEquationKnowledge`: `id`, `gameId`, `name`, `rarity` (1, 2, 3), `primaryPath`, `secondaryPath`, `requiredBlessings` (`primaryCount`, `secondaryCount`), `effect`.
- `DUCurioKnowledge`: `id`, `gameId`, `name`, `rarity` (1, 2, 3), `category` (`normal` | `negative` | `weighted`), `effect`.

## 5. Dexie IndexedDB Client Knowledge Cache (`apps/web/src/lib/knowledge/`)

Local browser IndexedDB database (`AstralynKnowledgeCache`) mirroring the published static release:

- `metadata`: `key` (PK) -> `activeKnowledgeVersion`, `gameVersion`, `cachedAt`, `sourceSnapshotHash`
- `characters`: `id` (PK), `name`, `rarity`, `path`, `element`, `releaseVersion`, `*mechanicTags`
- `lightCones`: `id` (PK), `name`, `rarity`, `path`, `releaseVersion`
- `relicSets`: `id` (PK), `name`, `type`, `releaseVersion`
- `enemies`: `id` (PK), `name`, `category`, `*weaknesses`, `releaseVersion`
- `stages`: `id` (PK), `name`, `stageType`, `floorNumber`, `releaseVersion`
- `duBlessings`: `id` (PK), `name`, `path`, `rarity`, `releaseVersion`
- `duEquations`: `id` (PK), `name`, `rarity`, `primaryPath`, `secondaryPath`, `releaseVersion`
- `duCurios`: `id` (PK), `name`, `rarity`, `category`, `releaseVersion`

## 6. Editorial recommendations tables (Deferred to Phase 5)

- `source_adapters`
- `source_recommendations`

## 7. Generated Astralyn intelligence (Deferred to Phase 5)

- `consensus_recommendations`

## 8. Client snapshots

The client consumes denormalized static JSON snapshots (`/data/<knowledge-version>/...`) rather than querying the relational D1 database on every page.

Cloudflare D1 is the canonical relational store for user state; published static JSON is the product-serving format for Game Knowledge.

## 9. Visual Game Asset Manifest Model

Visual game assets are tracked in `packages/shared/src/assets.ts` and synced to `/game-assets/<release>/manifest.json`.

```ts
interface AssetRecord {
  id: string;
  entityType:
    | "character_icon"
    | "character_preview"
    | "character_portrait"
    | "path_icon"
    | "element_icon"
    | "light_cone_icon"
    | "relic_set_icon"
    | "relic_piece_icon"
    | "planar_ornament_icon"
    | "eidolon_icon"
    | "skill_icon"
    | "trace_icon"
    | "material_icon"
    | "enemy_icon"
    | "du_blessing_icon"
    | "du_equation_icon"
    | "du_curio_icon";
  entityId: string;
  variant: "icon" | "preview" | "portrait" | "full";
  localPath: string; // e.g. "/game-assets/v1.0.0/characters/acheron_icon.png"
  source: string; // e.g. "StarRailRes"
  sourceUrl?: string;
  repositoryLicense?: string; // e.g. "AGPL-3.0"
  license: string; // e.g. "HoYoverse Fan Content Policy (Subject to Manual Review)"
  copyrightOwner: string; // e.g. "COGNOSPHERE / HoYoverse"
  usageStatus: "approved" | "official_fan_use" | "manual_review" | "blocked" | "unknown";
  attribution: string;
  fallbackPriority?: number;
  approvedBy?: string;
  approvedAt?: string;
  checksum?: string; // SHA-256
}

interface AssetManifest {
  assetRelease: string; // e.g. "v1.0.0"
  gameVersion: string; // e.g. "3.0.x"
  generatedAt: string;
  assets: AssetRecord[];
}
```
