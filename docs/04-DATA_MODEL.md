# Astralyn: data model

This document describes the implemented persistence, static knowledge, provenance, and browser-cache contracts. The current published snapshot is HSR 4.5 / `v1.0.0`: 92 characters, 9 light cones, 6 relic sets, 4 enemies, 4 stages, and 7 Divergent Universe records.

## 1. Data domains

Astralyn separates five domains:

A. Identity and user data — authenticated user domain (Better Auth + Astralyn user tables in Cloudflare D1).  
B. Canonical Game Knowledge — official facts normalized from authoritative Tier A HoYoverse sources with strongly typed `FactProvenance`.  
C. Editorial recommendations — source-specific guide/ranking data with provenance (Tier C).  
D. Generated Astralyn intelligence — consensus, scores, reason codes and publishable snapshots.  
E. Visual Game Assets: versioned manifest and 52 development-only manual-review PNG records in `apps/web/src/dev/game-assets/`; 0 production-approved assets currently shipped.

A user write must never cross into B/C/D/E canonical tables or static assets.

## 2. Migration Policy

- **Authoritative Baseline**: The Drizzle migration chain in `apps/worker/drizzle/migrations/` is the single source of truth for all schemas. Fresh databases MUST be initialized using this chain.
- **Obsolete Baseline**: The old `docs/d1/migrations/0001_initial.sql` file is completely obsolete.
- **Legacy Database Reset**: Databases initialized from the obsolete `docs/d1` baseline contain incompatible legacy auth tables (pre-Phase 3B Better Auth schema). These legacy development databases **must be recreated/reset** before applying the current migration chain. Dropping auth tables is intended for local dev reset only and is never a safe production upgrade strategy.

## 3. Identity tables

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

## 4. Versioning and release contracts

### GameVersion
Represents official HSR client patches (Baseline: Version 4.5 "To Roll the Stars in Astropolis").
- `id` (string): e.g. `'4.5.0'`
- `versionNumber` (string): e.g. `'4.5'`
- `title` (string): e.g. `'To Roll the Stars in Astropolis'`
- `releasedAt` (ISO string): e.g. `'2026-08-26T00:00:00.000Z'`
- `isActive` (boolean)

### FactProvenance
Lightweight provenance tracking attached to every canonical knowledge entity:
- `sourceId` (string): e.g. `'hoyolab_acheron_official'`
- `authorityTier` (`'tier_a_official' | 'tier_b_structured_community' | 'tier_c_editorial'`)
- `sourceUrl` (string)
- `gameVersion` (string): e.g. `'4.5'`
- `verifiedAt` (ISO string)
- `notes` (optional string)

### KnowledgeReleaseManifest
Immutable published knowledge release descriptor (`/data/<version>/release.json`).
- `knowledgeVersion` (string): e.g. `'v1.0.0'`
- `gameVersion` (string): e.g. `'4.5'`
- `schemaVersion` (string): e.g. `'1.0.0'`
- `generatedAt` (ISO string)
- `sourceSnapshotHash` (SHA-256 string)
- `status` (`'draft' | 'validated' | 'published' | 'superseded'`)
- `files` (array of `KnowledgeFileEntry`: filename, relPath, entityCount, sizeBytes, checksum)
- `checksums` (record of filename -> SHA-256 hash)
- `compatibility` (`minAppVersion`)

## 5. Canonical game knowledge schemas (`packages/shared/src/knowledge/`)

Single source of truth runtime Zod 4 schemas:

- `CombatPath`: 9 official playable Paths (`Destruction`, `Hunt`, `Erudition`, `Harmony`, `Nihility`, `Preservation`, `Abundance`, `Remembrance`, `Elation`).
- `CharacterKnowledge`: `id`, `gameId`, `name`, `localizedNames` (`en`, `id`, `ja`, `zh`), `rarity` (4 | 5), `path` (9 Paths), `element` (7 Elements), `releaseVersion`, `roles` (Astralyn taxonomy), `mechanicTags` (Astralyn taxonomy), optional `taxonomyEvidence` (mechanic-specific source facts plus Tier A `FactProvenance`), `baseStats` (HP, ATK, DEF, SPD, Taunt, Crit Rate, Crit DMG, Max Energy), `specialResourceType` (e.g. Slashed Dream, Punchline/Fervor), `abilities` (Basic, Skill, Ultimate, Talent, Technique, Enhanced variants, Memosprite skills, Elation skills), `memosprite` (e.g. Netherwing stats and abilities), `transformation` (Stance duration & enhanced abilities, e.g. Complete Combustion), `majorTraces` (A2, A4, A6), `minorTraces`, `eidolons` (E1–E6), `provenance` (`FactProvenance`). `authorityTier` classifies the source of the facts; it does not classify Astralyn's role or mechanic-tag mapping. Entity provenance and taxonomy provenance remain separate.
- `LightConeKnowledge`: `id`, `gameId`, `name`, `rarity` (3, 4, 5), `path` (9 Paths), `baseStats` (HP, ATK, DEF), `skill` (name, template, superimpositions 1–5), `releaseVersion`, `provenance`.
- `RelicSetKnowledge`: `id`, `gameId`, `name`, `type` (`cavern_relic` | `planar_ornament`), `twoPieceEffect`, `fourPieceEffect` (optional for planar), `pieces` (slots), `provenance`.
- `EnemyKnowledge`: `id`, `gameId`, `name`, `category` (`minion` | `elite` | `boss` | `weekly_boss`), `weaknesses` (array of Elements), `resistances` (Element -> % resistance), `skills`, `keyMechanics`, `provenance`.
- `StageKnowledge`: `id`, `name`, `stageType` (`memory_of_chaos` | `pure_fiction` | `apocalyptic_shadow` | `divergent_universe`), `floorNumber`, `rotationId` (temporality cycle tag), `cycle` (optional integer), `validFrom`/`validTo` (optional ISO strings), `buffName`, `buffDescription`, `recommendedElements`, `waves`, `provenance`.
- `DUBlessingKnowledge`: `id`, `gameId`, `name`, `path` (9 Paths, e.g. Celestial Annihilation under The Hunt), `rarity` (1, 2, 3), `effect`, `enhancedEffect`, `provenance`.
- `DUEquationKnowledge`: `id`, `gameId`, `name`, `rarity` (1, 2, 3), `primaryPath`, `secondaryPath`, `requiredBlessings` (`primaryCount`, `secondaryCount`), `effect`, `provenance`.
- `DUCurioKnowledge`: `id`, `gameId`, `name`, `rarity` (1, 2, 3), `category` (`normal` | `negative` | `weighted`), `effect`, `provenance`.

## 6. Dexie IndexedDB client knowledge cache (`apps/web/src/lib/knowledge/`)

Local browser IndexedDB database (`AstralynKnowledgeCache`) mirroring the published static release:

- `metadata`: `key` (PK) -> `activeKnowledgeVersion`, `gameVersion`, `cachedAt`, `sourceSnapshotHash`
- `characters`: `id` (PK), `name`, `rarity`, `path`, `element`, `releaseVersion`, `*mechanicTags`
- `lightCones`: `id` (PK), `name`, `rarity`, `path`, `releaseVersion`
- `relicSets`: `id` (PK), `name`, `type`, `releaseVersion`
- `enemies`: `id` (PK), `name`, `category`, `*weaknesses`, `releaseVersion`
- `stages`: `id` (PK), `name`, `stageType`, `floorNumber`, `rotationId`, `releaseVersion`
- `duBlessings`: `id` (PK), `name`, `path`, `rarity`, `releaseVersion`
- `duEquations`: `id` (PK), `name`, `rarity`, `primaryPath`, `secondaryPath`, `releaseVersion`
- `duCurios`: `id` (PK), `name`, `rarity`, `category`, `releaseVersion`

## 7. Client snapshots and runtime cryptographic integrity

The client consumes immutable static JSON snapshots (`/data/<knowledge-version>/...`).
Before parsing and caching into Dexie, `KnowledgeSnapshotLoader` computes the SHA-256 digest of the raw response bytes and verifies it against `release.json.checksums[file]`. If a hash mismatch or corrupt payload is detected, it immediately throws `ChecksumMismatchError` and triggers the fail-safe rollback preserving the previous verified cache.

## 8. Visual game asset manifest model

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
  gameVersion: string; // e.g. "4.5"
  generatedAt: string;
  assets: AssetRecord[];
}
```
