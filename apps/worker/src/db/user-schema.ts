// apps/worker/src/db/user-schema.ts
import { sqliteTable, text, integer, primaryKey, unique, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema.generated";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  onboardingCompletedAt: text("onboarding_completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userRoster = sqliteTable(
  "user_roster",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    characterId: text("character_id").notNull(),
    level: integer("level").notNull().default(1),
    eidolon: integer("eidolon").notNull().default(0),
    isOwned: integer("is_owned").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.characterId] }),
    index("user_roster_user_id_idx").on(table.userId),
  ]
);

export const savedTeams = sqliteTable(
  "saved_teams",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mode: text("mode").notNull().default("general"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("saved_teams_user_id_idx").on(table.userId),
    check(
      "saved_teams_name_length",
      sql`length(trim(${table.name})) between 1 and 50`
    ),
  ]
);

export const savedTeamMembers = sqliteTable(
  "saved_team_members",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => savedTeams.id, { onDelete: "cascade" }),
    slot: integer("slot").notNull(),
    characterId: text("character_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.slot] }),
    unique("saved_team_members_unique_char").on(table.teamId, table.characterId),
    index("saved_team_members_team_id_idx").on(table.teamId),
    check(
      "saved_team_members_slot_range",
      sql`${table.slot} between 1 and 4`
    ),
  ]
);
