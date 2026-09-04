// apps/worker/src/db/user-schema.ts
import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
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
