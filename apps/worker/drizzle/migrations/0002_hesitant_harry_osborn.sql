CREATE TABLE `saved_team_members` (
	`team_id` text NOT NULL,
	`slot` integer NOT NULL,
	`character_id` text NOT NULL,
	PRIMARY KEY(`team_id`, `slot`),
	FOREIGN KEY (`team_id`) REFERENCES `saved_teams`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "saved_team_members_slot_range" CHECK("saved_team_members"."slot" between 1 and 4)
);
--> statement-breakpoint
CREATE INDEX `saved_team_members_team_id_idx` ON `saved_team_members` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `saved_team_members_unique_char` ON `saved_team_members` (`team_id`,`character_id`);--> statement-breakpoint
CREATE TABLE `saved_teams` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`mode` text DEFAULT 'general' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "saved_teams_name_length" CHECK(length(trim("saved_teams"."name")) between 1 and 50)
);
--> statement-breakpoint
CREATE INDEX `saved_teams_user_id_idx` ON `saved_teams` (`user_id`);