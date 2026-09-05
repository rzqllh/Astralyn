CREATE TABLE `character_knowledge` (
	`knowledge_release_id` text NOT NULL,
	`character_id` text NOT NULL,
	`path` text NOT NULL,
	`element` text NOT NULL,
	`roles_json` text DEFAULT '[]' NOT NULL,
	`mechanic_tags_json` text DEFAULT '[]' NOT NULL,
	`stats_json` text DEFAULT '{}' NOT NULL,
	`kit_json` text DEFAULT '{}' NOT NULL,
	`traces_json` text DEFAULT '{}' NOT NULL,
	`eidolons_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`knowledge_release_id`, `character_id`),
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `game_characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consensus_results` (
	`id` text PRIMARY KEY NOT NULL,
	`knowledge_release_id` text NOT NULL,
	`category` text NOT NULL,
	`subject_character_id` text,
	`game_mode` text,
	`stage_id` text,
	`context_hash` text NOT NULL,
	`result_payload_json` text NOT NULL,
	`score` real,
	`confidence` real,
	`reason_codes_json` text DEFAULT '[]' NOT NULL,
	`source_set_ids_json` text DEFAULT '[]' NOT NULL,
	`engine_version` text NOT NULL,
	`generated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_character_id`) REFERENCES `game_characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `game_stages`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "consensus_results_category_check" CHECK("consensus_results"."category" IN ('best_build', 'best_team', 'best_light_cone', 'best_relic', 'best_character', 'best_teammate')),
	CONSTRAINT "consensus_results_confidence_check" CHECK("consensus_results"."confidence" BETWEEN 0 AND 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `consensus_results_unique_idx` ON `consensus_results` (`knowledge_release_id`,`context_hash`,`engine_version`);--> statement-breakpoint
CREATE TABLE `du_entities` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`canonical_name` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "du_entities_type_check" CHECK("du_entities"."entity_type" IN ('mask', 'equation', 'blessing', 'curio', 'miracle', 'event', 'domain'))
);
--> statement-breakpoint
CREATE TABLE `du_entity_knowledge` (
	`knowledge_release_id` text NOT NULL,
	`du_entity_id` text NOT NULL,
	`paths_json` text DEFAULT '[]' NOT NULL,
	`rarity` text,
	`requirement_json` text DEFAULT '{}' NOT NULL,
	`effect_json` text DEFAULT '{}' NOT NULL,
	`mechanic_tags_json` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`knowledge_release_id`, `du_entity_id`),
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`du_entity_id`) REFERENCES `du_entities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `enemy_knowledge` (
	`knowledge_release_id` text NOT NULL,
	`enemy_id` text NOT NULL,
	`weaknesses_json` text DEFAULT '[]' NOT NULL,
	`resistances_json` text DEFAULT '{}' NOT NULL,
	`mechanic_tags_json` text DEFAULT '[]' NOT NULL,
	`mechanics_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`knowledge_release_id`, `enemy_id`),
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`enemy_id`) REFERENCES `game_enemies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fact_provenance` (
	`id` text PRIMARY KEY NOT NULL,
	`knowledge_release_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`field_path` text NOT NULL,
	`source_snapshot_id` text NOT NULL,
	`verification_status` text DEFAULT 'verified' NOT NULL,
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_snapshot_id`) REFERENCES `source_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fact_provenance_unique_idx` ON `fact_provenance` (`knowledge_release_id`,`entity_type`,`entity_id`,`field_path`,`source_snapshot_id`);--> statement-breakpoint
CREATE TABLE `game_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`official_key` text,
	`canonical_name` text NOT NULL,
	`rarity` integer,
	`release_version` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "game_characters_rarity_check" CHECK("game_characters"."rarity" IN (4, 5))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_characters_official_key_unique` ON `game_characters` (`official_key`);--> statement-breakpoint
CREATE TABLE `game_enemies` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_name` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_light_cones` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_name` text NOT NULL,
	`rarity` integer,
	`path` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "game_light_cones_rarity_check" CHECK("game_light_cones"."rarity" IN (3, 4, 5))
);
--> statement-breakpoint
CREATE TABLE `game_relic_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_name` text NOT NULL,
	`set_kind` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "game_relic_sets_kind_check" CHECK("game_relic_sets"."set_kind" IN ('relic', 'planar'))
);
--> statement-breakpoint
CREATE TABLE `game_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_name` text NOT NULL,
	`mode` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`title` text,
	`starts_at` text,
	`ends_at` text,
	`is_current` integer DEFAULT 0 NOT NULL,
	`official_source_url` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "game_versions_is_current_check" CHECK("game_versions"."is_current" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_versions_version_unique` ON `game_versions` (`version`);--> statement-breakpoint
CREATE UNIQUE INDEX `game_versions_one_current_idx` ON `game_versions` (`is_current`) WHERE is_current = 1;--> statement-breakpoint
CREATE TABLE `knowledge_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`game_version_id` text NOT NULL,
	`knowledge_version` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`source_snapshot_hash` text NOT NULL,
	`minimum_app_version` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`published_at` text,
	FOREIGN KEY (`game_version_id`) REFERENCES `game_versions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "knowledge_releases_status_check" CHECK("knowledge_releases"."status" IN ('draft', 'published', 'retired', 'rejected'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_releases_knowledge_version_unique` ON `knowledge_releases` (`knowledge_version`);--> statement-breakpoint
CREATE INDEX `knowledge_releases_version_status_idx` ON `knowledge_releases` (`knowledge_version`,`status`);--> statement-breakpoint
CREATE TABLE `knowledge_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`source_kind` text NOT NULL,
	`trust_tier` integer NOT NULL,
	`base_url` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`terms_review_status` text DEFAULT 'review_needed' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "knowledge_sources_kind_check" CHECK("knowledge_sources"."source_kind" IN ('official', 'editorial', 'community')),
	CONSTRAINT "knowledge_sources_tier_check" CHECK("knowledge_sources"."trust_tier" BETWEEN 1 AND 3),
	CONSTRAINT "knowledge_sources_enabled_check" CHECK("knowledge_sources"."enabled" IN (0, 1)),
	CONSTRAINT "knowledge_sources_review_check" CHECK("knowledge_sources"."terms_review_status" IN ('approved', 'manual_only', 'blocked', 'review_needed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_sources_slug_unique` ON `knowledge_sources` (`slug`);--> statement-breakpoint
CREATE TABLE `light_cone_knowledge` (
	`knowledge_release_id` text NOT NULL,
	`light_cone_id` text NOT NULL,
	`effect_json` text DEFAULT '{}' NOT NULL,
	`stats_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`knowledge_release_id`, `light_cone_id`),
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`light_cone_id`) REFERENCES `game_light_cones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recommendation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`recommendation_set_id` text NOT NULL,
	`rank` integer NOT NULL,
	`payload_json` text NOT NULL,
	`source_score` real,
	`notes_json` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`recommendation_set_id`) REFERENCES `recommendation_sets`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendation_items_rank_check" CHECK("recommendation_items"."rank" BETWEEN 1 AND 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_items_unique_rank` ON `recommendation_items` (`recommendation_set_id`,`rank`);--> statement-breakpoint
CREATE TABLE `recommendation_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`knowledge_release_id` text NOT NULL,
	`category` text NOT NULL,
	`subject_character_id` text,
	`game_mode` text,
	`stage_id` text,
	`source_updated_at` text,
	`verified_at` text DEFAULT (datetime('now')) NOT NULL,
	`confidence` real,
	`status` text DEFAULT 'active' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_character_id`) REFERENCES `game_characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `game_stages`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "recommendation_sets_category_check" CHECK("recommendation_sets"."category" IN ('best_build', 'best_team', 'best_light_cone', 'best_relic', 'best_character', 'best_teammate')),
	CONSTRAINT "recommendation_sets_confidence_check" CHECK("recommendation_sets"."confidence" BETWEEN 0 AND 1)
);
--> statement-breakpoint
CREATE INDEX `recommendation_sets_lookup_idx` ON `recommendation_sets` (`knowledge_release_id`,`category`,`subject_character_id`,`game_mode`);--> statement-breakpoint
CREATE TABLE `relic_set_knowledge` (
	`knowledge_release_id` text NOT NULL,
	`relic_set_id` text NOT NULL,
	`effects_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`knowledge_release_id`, `relic_set_id`),
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`relic_set_id`) REFERENCES `game_relic_sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `source_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`game_version_id` text,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL,
	`etag` text,
	`last_modified` text,
	`content_hash` text NOT NULL,
	`parser_version` text NOT NULL,
	`status` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game_version_id`) REFERENCES `game_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `source_snapshots_source_fetched_idx` ON `source_snapshots` (`source_id`,`fetched_at`);--> statement-breakpoint
CREATE TABLE `stage_knowledge` (
	`knowledge_release_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`enemy_ids_json` text DEFAULT '[]' NOT NULL,
	`modifiers_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`knowledge_release_id`, `stage_id`),
	FOREIGN KEY (`knowledge_release_id`) REFERENCES `knowledge_releases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `game_stages`(`id`) ON UPDATE no action ON DELETE no action
);
