# Astralyn — Data Model

## 1. Data domains

Astralyn separates four domains:

A. Identity and user data — authenticated user domain (Better Auth + Astralyn user tables in Cloudflare D1).  
B. Canonical Game Knowledge — official facts normalized from trusted HoYoverse sources.  
C. Editorial recommendations — source-specific guide/ranking data with provenance.  
D. Generated Astralyn intelligence — consensus, scores, reason codes and publishable snapshots.

A user write must never cross into B/C/D canonical tables.

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
Represents official HSR versions such as `4.4`.

Fields:
- `id`
- `version`
- `title`
- `starts_at`
- `ends_at`
- `is_current`
- `official_source_url`

### knowledge_releases
Represents one published Astralyn knowledge snapshot.

Fields:
- `id`
- `game_version_id`
- `knowledge_version`
- `status`
- `source_snapshot_hash`
- `published_at`
- `created_at`

A published knowledge release is immutable. Corrections create another release.

## 4. Stable game identities + versioned facts

### game_characters
Stable character identity:
- slug ID;
- official key when available;
- canonical name;
- rarity;
- release version.

### character_knowledge
Versioned facts:
- Path;
- element;
- stats;
- role tags;
- mechanic tags;
- kit JSON;
- traces JSON;
- Eidolons JSON.

Repeat the same stable-identity + versioned-facts pattern for:
- Light Cones;
- Relic/Planar sets;
- enemies;
- stages.

## 5. Divergent Universe

MVP uses a generic DU entity model to avoid premature over-normalization.

### du_entities
- `id`
- `entity_type`: mask/equation/blessing/curio/miracle/event/domain
- canonical name

### du_entity_knowledge
Versioned:
- Paths;
- rarity;
- requirements;
- effect;
- mechanic tags;
- structured mechanics JSON.

Split into dedicated tables later only when real query needs justify it.

## 6. Provenance

### knowledge_sources
- `id`
- `slug`
- `name`
- `source_kind`: official/editorial/community
- `trust_tier`
- `base_url`
- `enabled`
- `terms_review_status`

### source_snapshots
- `id`
- `source_id`
- `game_version_id`
- `fetched_at`
- `etag`
- `last_modified`
- `content_hash`
- `parser_version`
- `status`

### fact_provenance
Maps canonical fields to the source snapshot used to verify them.

This makes factual origin auditable.

## 7. Editorial recommendation model

### recommendation_sets
Represents one source's recommendation set.

Example: `Source X → Castorice → Best Teams → patch 4.4`.

Fields:
- `id`
- `source_id`
- `knowledge_release_id`
- `category`
- `subject_character_id`
- optional `game_mode`
- optional `stage_id`
- `source_updated_at`
- `verified_at`
- `confidence`
- `status`

Categories:
- `best_build`
- `best_team`
- `best_light_cone`
- `best_relic`
- `best_character`
- `best_teammate`

### recommendation_items
- `recommendation_set_id`
- `rank` 1–3
- `payload` JSONB
- optional source score
- normalized notes/tags

Team payload:

```json
{
  "members": ["castorice", "cyrene", "evernight", "hyacine"]
}
```

Build payload:

```json
{
  "lightCone": "example-lc",
  "relicSet": "example-relic",
  "planarSet": "example-planar",
  "mainStats": {"body": "crit_rate"},
  "substatPriority": ["crit_rate", "crit_dmg", "spd"]
}
```

## 8. Generated intelligence

### consensus_results
Optional persisted/prebuilt cache:
- knowledge release;
- category;
- subject/context;
- result payload;
- score;
- confidence;
- reason codes;
- source set IDs;
- engine version;
- generated timestamp.

LLMs never write this table directly. Only the trusted consensus job may persist it.

## 9. DU runtime

For MVP, current DU state remains primarily in IndexedDB.

Potential server sync later:
- `du_runs`
- `du_run_party`
- `du_run_choices`
- `du_run_inventory`

Core recommendation code must not require cloud persistence.

## 10. Versioning rule
 
Bad:
 
```text
characters.effect = overwrite each patch
```
 
Preferred:
 
```text
game_characters
  └── character_knowledge @ knowledge_release
```
 
Benefits: rollback, history, reproducible recommendations and regression testing.
 
## 11. Client snapshots
 
The client consumes denormalized static JSON snapshots rather than querying the relational D1 database on every page.
 
Example:
 
```json
{
  "id": "castorice",
  "name": "Castorice",
  "patch": "4.4",
  "mechanics": ["memosprite", "hp_fluctuation"],
  "roles": ["dps"],
  "recommendations": {
    "teams": {},
    "builds": {}
  }
}
```
 
Cloudflare D1 is the canonical relational store; published static JSON is the product-serving format.
