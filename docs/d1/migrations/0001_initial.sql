-- Astralyn v0.1 Initial Schema Baseline
-- Cloudflare D1 / SQLite
-- Driver: Drizzle ORM + Better Auth + Cloudflare Workers

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. BETTER AUTH CORE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0 CHECK (emailVerified IN (0, 1)),
  image TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  idToken TEXT,
  password TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS session_userId_idx ON session(userId);
CREATE INDEX IF NOT EXISTS session_token_idx ON session(token);
CREATE INDEX IF NOT EXISTS account_userId_idx ON account(userId);

-- ============================================================================
-- 2. ASTRALYN USER DOMAIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'id')),
  onboarding_completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_characters (
  id TEXT PRIMARY KEY,
  official_key TEXT UNIQUE,
  canonical_name TEXT NOT NULL,
  rarity INTEGER CHECK (rarity IN (4, 5)),
  release_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_roster (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES game_characters(id),
  level INTEGER CHECK (level BETWEEN 1 AND 80),
  eidolon INTEGER NOT NULL DEFAULT 0 CHECK (eidolon BETWEEN 0 AND 6),
  is_owned INTEGER NOT NULL DEFAULT 1 CHECK (is_owned IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, character_id)
);

CREATE INDEX IF NOT EXISTS user_roster_user_id_idx ON user_roster(user_id);

CREATE TABLE IF NOT EXISTS saved_teams (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS saved_teams_user_id_idx ON saved_teams(user_id);

CREATE TABLE IF NOT EXISTS saved_team_members (
  team_id TEXT NOT NULL REFERENCES saved_teams(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 4),
  character_id TEXT NOT NULL REFERENCES game_characters(id),
  PRIMARY KEY (team_id, slot)
);

-- ============================================================================
-- 3. VERSIONING & CANONICAL GAME KNOWLEDGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_versions (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  title TEXT,
  starts_at TEXT,
  ends_at TEXT,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  official_source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS game_versions_one_current_idx
  ON game_versions (is_current) WHERE is_current = 1;

CREATE TABLE IF NOT EXISTS knowledge_releases (
  id TEXT PRIMARY KEY,
  game_version_id TEXT NOT NULL REFERENCES game_versions(id),
  knowledge_version TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired', 'rejected')),
  source_snapshot_hash TEXT NOT NULL,
  minimum_app_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS knowledge_releases_version_status_idx
  ON knowledge_releases(knowledge_version, status);

CREATE TABLE IF NOT EXISTS character_knowledge (
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES game_characters(id),
  path TEXT NOT NULL,
  element TEXT NOT NULL,
  roles_json TEXT NOT NULL DEFAULT '[]',
  mechanic_tags_json TEXT NOT NULL DEFAULT '[]',
  stats_json TEXT NOT NULL DEFAULT '{}',
  kit_json TEXT NOT NULL DEFAULT '{}',
  traces_json TEXT NOT NULL DEFAULT '{}',
  eidolons_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (knowledge_release_id, character_id)
);

CREATE TABLE IF NOT EXISTS game_light_cones (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  rarity INTEGER CHECK (rarity IN (3, 4, 5)),
  path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS light_cone_knowledge (
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  light_cone_id TEXT NOT NULL REFERENCES game_light_cones(id),
  effect_json TEXT NOT NULL DEFAULT '{}',
  stats_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (knowledge_release_id, light_cone_id)
);

CREATE TABLE IF NOT EXISTS game_relic_sets (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  set_kind TEXT NOT NULL CHECK (set_kind IN ('relic', 'planar')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS relic_set_knowledge (
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  relic_set_id TEXT NOT NULL REFERENCES game_relic_sets(id),
  effects_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (knowledge_release_id, relic_set_id)
);

CREATE TABLE IF NOT EXISTS game_enemies (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enemy_knowledge (
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  enemy_id TEXT NOT NULL REFERENCES game_enemies(id),
  weaknesses_json TEXT NOT NULL DEFAULT '[]',
  resistances_json TEXT NOT NULL DEFAULT '{}',
  mechanic_tags_json TEXT NOT NULL DEFAULT '[]',
  mechanics_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (knowledge_release_id, enemy_id)
);

CREATE TABLE IF NOT EXISTS game_stages (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stage_knowledge (
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES game_stages(id),
  enemy_ids_json TEXT NOT NULL DEFAULT '[]',
  modifiers_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (knowledge_release_id, stage_id)
);

-- ============================================================================
-- 4. DIVERGENT UNIVERSE ENTITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS du_entities (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mask', 'equation', 'blessing', 'curio', 'miracle', 'event', 'domain')),
  canonical_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS du_entity_knowledge (
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  du_entity_id TEXT NOT NULL REFERENCES du_entities(id),
  paths_json TEXT NOT NULL DEFAULT '[]',
  rarity TEXT,
  requirement_json TEXT NOT NULL DEFAULT '{}',
  effect_json TEXT NOT NULL DEFAULT '{}',
  mechanic_tags_json TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (knowledge_release_id, du_entity_id)
);

-- ============================================================================
-- 5. PROVENANCE & SOURCE SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('official', 'editorial', 'community')),
  trust_tier INTEGER NOT NULL CHECK (trust_tier BETWEEN 1 AND 3),
  base_url TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  terms_review_status TEXT NOT NULL DEFAULT 'review_needed' CHECK (terms_review_status IN ('approved', 'manual_only', 'blocked', 'review_needed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS source_snapshots (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES knowledge_sources(id),
  game_version_id TEXT REFERENCES game_versions(id),
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  etag TEXT,
  last_modified TEXT,
  content_hash TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS source_snapshots_source_fetched_idx
  ON source_snapshots (source_id, fetched_at DESC);

CREATE TABLE IF NOT EXISTS fact_provenance (
  id TEXT PRIMARY KEY,
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_path TEXT NOT NULL,
  source_snapshot_id TEXT NOT NULL REFERENCES source_snapshots(id),
  verification_status TEXT NOT NULL DEFAULT 'verified',
  UNIQUE (knowledge_release_id, entity_type, entity_id, field_path, source_snapshot_id)
);

-- ============================================================================
-- 6. EDITORIAL RECOMMENDATIONS & CONSENSUS CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_sets (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES knowledge_sources(id),
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('best_build', 'best_team', 'best_light_cone', 'best_relic', 'best_character', 'best_teammate')),
  subject_character_id TEXT REFERENCES game_characters(id),
  game_mode TEXT,
  stage_id TEXT REFERENCES game_stages(id),
  source_updated_at TEXT,
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  confidence REAL CHECK (confidence BETWEEN 0 AND 1),
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS recommendation_sets_lookup_idx
  ON recommendation_sets (knowledge_release_id, category, subject_character_id, game_mode);

CREATE TABLE IF NOT EXISTS recommendation_items (
  id TEXT PRIMARY KEY,
  recommendation_set_id TEXT NOT NULL REFERENCES recommendation_sets(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  payload_json TEXT NOT NULL,
  source_score REAL,
  notes_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE (recommendation_set_id, rank)
);

CREATE TABLE IF NOT EXISTS consensus_results (
  id TEXT PRIMARY KEY,
  knowledge_release_id TEXT NOT NULL REFERENCES knowledge_releases(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('best_build', 'best_team', 'best_light_cone', 'best_relic', 'best_character', 'best_teammate')),
  subject_character_id TEXT REFERENCES game_characters(id),
  game_mode TEXT,
  stage_id TEXT REFERENCES game_stages(id),
  context_hash TEXT NOT NULL,
  result_payload_json TEXT NOT NULL,
  score REAL,
  confidence REAL CHECK (confidence BETWEEN 0 AND 1),
  reason_codes_json TEXT NOT NULL DEFAULT '[]',
  source_set_ids_json TEXT NOT NULL DEFAULT '[]',
  engine_version TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (knowledge_release_id, context_hash, engine_version)
);
