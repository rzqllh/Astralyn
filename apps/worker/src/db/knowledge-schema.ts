import { sqliteTable, text, integer, primaryKey, uniqueIndex, index, check, real, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const gameCharacters = sqliteTable(
  "game_characters",
  {
    id: text("id").primaryKey(),
    officialKey: text("official_key").unique(),
    canonicalName: text("canonical_name").notNull(),
    rarity: integer("rarity"),
    releaseVersion: text("release_version"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    check("game_characters_rarity_check", sql`${table.rarity} IN (4, 5)`),
  ]
);

export const gameVersions = sqliteTable(
  "game_versions",
  {
    id: text("id").primaryKey(),
    version: text("version").notNull().unique(),
    title: text("title"),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    isCurrent: integer("is_current").notNull().default(0),
    officialSourceUrl: text("official_source_url"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    check("game_versions_is_current_check", sql`${table.isCurrent} IN (0, 1)`),
    uniqueIndex("game_versions_one_current_idx").on(table.isCurrent).where(sql`is_current = 1`),
  ]
);

export const knowledgeReleases = sqliteTable(
  "knowledge_releases",
  {
    id: text("id").primaryKey(),
    gameVersionId: text("game_version_id").notNull().references(() => gameVersions.id),
    knowledgeVersion: text("knowledge_version").notNull().unique(),
    status: text("status").notNull().default("draft"),
    sourceSnapshotHash: text("source_snapshot_hash").notNull(),
    minimumAppVersion: text("minimum_app_version"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    publishedAt: text("published_at"),
  },
  (table) => [
    check("knowledge_releases_status_check", sql`${table.status} IN ('draft', 'published', 'retired', 'rejected')`),
    index("knowledge_releases_version_status_idx").on(table.knowledgeVersion, table.status),
  ]
);

export const characterKnowledge = sqliteTable(
  "character_knowledge",
  {
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    characterId: text("character_id").notNull().references(() => gameCharacters.id),
    path: text("path").notNull(),
    element: text("element").notNull(),
    rolesJson: text("roles_json").notNull().default("[]"),
    mechanicTagsJson: text("mechanic_tags_json").notNull().default("[]"),
    statsJson: text("stats_json").notNull().default("{}"),
    kitJson: text("kit_json").notNull().default("{}"),
    tracesJson: text("traces_json").notNull().default("{}"),
    eidolonsJson: text("eidolons_json").notNull().default("{}"),
  },
  (table) => [
    primaryKey({ columns: [table.knowledgeReleaseId, table.characterId] }),
  ]
);

export const gameLightCones = sqliteTable(
  "game_light_cones",
  {
    id: text("id").primaryKey(),
    canonicalName: text("canonical_name").notNull(),
    rarity: integer("rarity"),
    path: text("path"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    check("game_light_cones_rarity_check", sql`${table.rarity} IN (3, 4, 5)`),
  ]
);

export const lightConeKnowledge = sqliteTable(
  "light_cone_knowledge",
  {
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    lightConeId: text("light_cone_id").notNull().references(() => gameLightCones.id),
    effectJson: text("effect_json").notNull().default("{}"),
    statsJson: text("stats_json").notNull().default("{}"),
  },
  (table) => [
    primaryKey({ columns: [table.knowledgeReleaseId, table.lightConeId] }),
  ]
);

export const gameRelicSets = sqliteTable(
  "game_relic_sets",
  {
    id: text("id").primaryKey(),
    canonicalName: text("canonical_name").notNull(),
    setKind: text("set_kind").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    check("game_relic_sets_kind_check", sql`${table.setKind} IN ('relic', 'planar')`),
  ]
);

export const relicSetKnowledge = sqliteTable(
  "relic_set_knowledge",
  {
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    relicSetId: text("relic_set_id").notNull().references(() => gameRelicSets.id),
    effectsJson: text("effects_json").notNull().default("{}"),
  },
  (table) => [
    primaryKey({ columns: [table.knowledgeReleaseId, table.relicSetId] }),
  ]
);

export const gameEnemies = sqliteTable(
  "game_enemies",
  {
    id: text("id").primaryKey(),
    canonicalName: text("canonical_name").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  }
);

export const enemyKnowledge = sqliteTable(
  "enemy_knowledge",
  {
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    enemyId: text("enemy_id").notNull().references(() => gameEnemies.id),
    weaknessesJson: text("weaknesses_json").notNull().default("[]"),
    resistancesJson: text("resistances_json").notNull().default("{}"),
    mechanicTagsJson: text("mechanic_tags_json").notNull().default("[]"),
    mechanicsJson: text("mechanics_json").notNull().default("{}"),
  },
  (table) => [
    primaryKey({ columns: [table.knowledgeReleaseId, table.enemyId] }),
  ]
);

export const gameStages = sqliteTable(
  "game_stages",
  {
    id: text("id").primaryKey(),
    canonicalName: text("canonical_name").notNull(),
    mode: text("mode").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  }
);

export const stageKnowledge = sqliteTable(
  "stage_knowledge",
  {
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    stageId: text("stage_id").notNull().references(() => gameStages.id),
    enemyIdsJson: text("enemy_ids_json").notNull().default("[]"),
    modifiersJson: text("modifiers_json").notNull().default("{}"),
  },
  (table) => [
    primaryKey({ columns: [table.knowledgeReleaseId, table.stageId] }),
  ]
);

export const duEntities = sqliteTable(
  "du_entities",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    canonicalName: text("canonical_name").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    check("du_entities_type_check", sql`${table.entityType} IN ('mask', 'equation', 'blessing', 'curio', 'miracle', 'event', 'domain')`),
  ]
);

export const duEntityKnowledge = sqliteTable(
  "du_entity_knowledge",
  {
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    duEntityId: text("du_entity_id").notNull().references(() => duEntities.id),
    pathsJson: text("paths_json").notNull().default("[]"),
    rarity: text("rarity"),
    requirementJson: text("requirement_json").notNull().default("{}"),
    effectJson: text("effect_json").notNull().default("{}"),
    mechanicTagsJson: text("mechanic_tags_json").notNull().default("[]"),
  },
  (table) => [
    primaryKey({ columns: [table.knowledgeReleaseId, table.duEntityId] }),
  ]
);

export const knowledgeSources = sqliteTable(
  "knowledge_sources",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    sourceKind: text("source_kind").notNull(),
    trustTier: integer("trust_tier").notNull(),
    baseUrl: text("base_url"),
    enabled: integer("enabled").notNull().default(1),
    termsReviewStatus: text("terms_review_status").notNull().default("review_needed"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    check("knowledge_sources_kind_check", sql`${table.sourceKind} IN ('official', 'editorial', 'community')`),
    check("knowledge_sources_tier_check", sql`${table.trustTier} BETWEEN 1 AND 3`),
    check("knowledge_sources_enabled_check", sql`${table.enabled} IN (0, 1)`),
    check("knowledge_sources_review_check", sql`${table.termsReviewStatus} IN ('approved', 'manual_only', 'blocked', 'review_needed')`),
  ]
);

export const sourceSnapshots = sqliteTable(
  "source_snapshots",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id").notNull().references(() => knowledgeSources.id),
    gameVersionId: text("game_version_id").references(() => gameVersions.id),
    fetchedAt: text("fetched_at").notNull().default(sql`(datetime('now'))`),
    etag: text("etag"),
    lastModified: text("last_modified"),
    contentHash: text("content_hash").notNull(),
    parserVersion: text("parser_version").notNull(),
    status: text("status").notNull(),
    metadataJson: text("metadata_json").notNull().default("{}"),
  },
  (table) => [
    index("source_snapshots_source_fetched_idx").on(table.sourceId, table.fetchedAt), // DESC order not natively supported in drizzle sqlite index creation helper without raw sql, but we can omit DESC
  ]
);

export const factProvenance = sqliteTable(
  "fact_provenance",
  {
    id: text("id").primaryKey(),
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    fieldPath: text("field_path").notNull(),
    sourceSnapshotId: text("source_snapshot_id").notNull().references(() => sourceSnapshots.id),
    verificationStatus: text("verification_status").notNull().default("verified"),
  },
  (table) => [
    unique("fact_provenance_unique_idx").on(
      table.knowledgeReleaseId,
      table.entityType,
      table.entityId,
      table.fieldPath,
      table.sourceSnapshotId
    ),
  ]
);

export const recommendationSets = sqliteTable(
  "recommendation_sets",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id").notNull().references(() => knowledgeSources.id),
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    subjectCharacterId: text("subject_character_id").references(() => gameCharacters.id),
    gameMode: text("game_mode"),
    stageId: text("stage_id").references(() => gameStages.id),
    sourceUpdatedAt: text("source_updated_at"),
    verifiedAt: text("verified_at").notNull().default(sql`(datetime('now'))`),
    confidence: real("confidence"),
    status: text("status").notNull().default("active"),
    metadataJson: text("metadata_json").notNull().default("{}"),
  },
  (table) => [
    check("recommendation_sets_category_check", sql`${table.category} IN ('best_build', 'best_team', 'best_light_cone', 'best_relic', 'best_character', 'best_teammate')`),
    check("recommendation_sets_confidence_check", sql`${table.confidence} BETWEEN 0 AND 1`),
    index("recommendation_sets_lookup_idx").on(table.knowledgeReleaseId, table.category, table.subjectCharacterId, table.gameMode),
  ]
);

export const recommendationItems = sqliteTable(
  "recommendation_items",
  {
    id: text("id").primaryKey(),
    recommendationSetId: text("recommendation_set_id").notNull().references(() => recommendationSets.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    payloadJson: text("payload_json").notNull(),
    sourceScore: real("source_score"),
    notesJson: text("notes_json").notNull().default("{}"),
  },
  (table) => [
    check("recommendation_items_rank_check", sql`${table.rank} BETWEEN 1 AND 3`),
    unique("recommendation_items_unique_rank").on(table.recommendationSetId, table.rank),
  ]
);

export const consensusResults = sqliteTable(
  "consensus_results",
  {
    id: text("id").primaryKey(),
    knowledgeReleaseId: text("knowledge_release_id").notNull().references(() => knowledgeReleases.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    subjectCharacterId: text("subject_character_id").references(() => gameCharacters.id),
    gameMode: text("game_mode"),
    stageId: text("stage_id").references(() => gameStages.id),
    contextHash: text("context_hash").notNull(),
    resultPayloadJson: text("result_payload_json").notNull(),
    score: real("score"),
    confidence: real("confidence"),
    reasonCodesJson: text("reason_codes_json").notNull().default("[]"),
    sourceSetIdsJson: text("source_set_ids_json").notNull().default("[]"),
    engineVersion: text("engine_version").notNull(),
    generatedAt: text("generated_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    check("consensus_results_category_check", sql`${table.category} IN ('best_build', 'best_team', 'best_light_cone', 'best_relic', 'best_character', 'best_teammate')`),
    check("consensus_results_confidence_check", sql`${table.confidence} BETWEEN 0 AND 1`),
    unique("consensus_results_unique_idx").on(table.knowledgeReleaseId, table.contextHash, table.engineVersion),
  ]
);
