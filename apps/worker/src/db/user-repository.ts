// apps/worker/src/db/user-repository.ts
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { createDbClient } from "./client";
import { profiles, userRoster, savedTeams, savedTeamMembers } from "./schema";

export interface ProfileRecord {
  userId: string;
  displayName: string | null;
  preferredLanguage: string;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRosterItem {
  characterId: string;
  level: number;
  eidolon: number;
  isOwned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingRosterInput {
  characterId: string;
  level?: number;
  eidolon?: number;
}

export class UserRepository {
  constructor(private readonly d1: D1Database) {}

  private get db() {
    return createDbClient(this.d1);
  }

  /**
   * Fetches the user profile. If it doesn't exist yet, idempotently creates a default profile.
   */
  async getOrCreateProfile(
    userId: string,
    defaultDisplayName?: string
  ): Promise<ProfileRecord> {
    const existing = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .get();

    if (existing) {
      return {
        userId: existing.userId,
        displayName: existing.displayName,
        preferredLanguage: existing.preferredLanguage,
        onboardingCompletedAt: existing.onboardingCompletedAt,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

    const now = new Date().toISOString();
    const newProfile = {
      userId,
      displayName: defaultDisplayName ?? null,
      preferredLanguage: "en",
      onboardingCompletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(profiles).values(newProfile).run();
    return newProfile;
  }

  /**
   * Completes the onboarding flow:
   * 1. Idempotently cleans any existing initial roster rows for the user.
   * 2. Inserts selected characters with specified level/eidolon.
   * 3. Sets onboardingCompletedAt timestamp on profiles.
   * Executes as an atomic D1 batch operation.
   */
  async completeOnboarding(
    userId: string,
    roster: OnboardingRosterInput[]
  ): Promise<{ onboardingCompletedAt: string }> {
    const now = new Date().toISOString();
    const batchStatements: D1PreparedStatement[] = [];

    // 1. Ensure profile exists and mark onboarding complete
    batchStatements.push(
      this.d1
        .prepare(
          `INSERT INTO profiles (user_id, display_name, preferred_language, onboarding_completed_at, created_at, updated_at)
           VALUES (?, NULL, 'en', ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             onboarding_completed_at = excluded.onboarding_completed_at,
             updated_at = excluded.updated_at`
        )
        .bind(userId, now, now, now)
    );

    // 2. Clear prior roster if any (re-entrant/idempotent setup)
    batchStatements.push(
      this.d1.prepare(`DELETE FROM user_roster WHERE user_id = ?`).bind(userId)
    );

    // 3. Insert each selected character
    for (const char of roster) {
      const level = Math.max(1, Math.min(80, Math.floor(char.level ?? 1)));
      const eidolon = Math.max(0, Math.min(6, Math.floor(char.eidolon ?? 0)));

      batchStatements.push(
        this.d1
          .prepare(
            `INSERT INTO user_roster (user_id, character_id, level, eidolon, is_owned, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, ?, ?)`
          )
          .bind(userId, char.characterId, level, eidolon, now, now)
      );
    }

    await this.d1.batch(batchStatements);
    return { onboardingCompletedAt: now };
  }

  /**
   * Returns all roster entries for the specified user.
   */
  async getRoster(userId: string): Promise<UserRosterItem[]> {
    const rows = await this.db
      .select()
      .from(userRoster)
      .where(eq(userRoster.userId, userId))
      .all();

    return rows.map((r) => ({
      characterId: r.characterId,
      level: r.level,
      eidolon: r.eidolon,
      isOwned: r.isOwned === 1,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Upserts a single character entry in the user's roster.
   */
  async upsertRosterCharacter(
    userId: string,
    entry: {
      characterId: string;
      level?: number;
      eidolon?: number;
      isOwned?: boolean;
    }
  ): Promise<UserRosterItem> {
    const now = new Date().toISOString();
    const level = Math.max(1, Math.min(80, Math.floor(entry.level ?? 80)));
    const eidolon = Math.max(0, Math.min(6, Math.floor(entry.eidolon ?? 0)));
    const isOwned = entry.isOwned !== false ? 1 : 0;

    await this.d1
      .prepare(
        `INSERT INTO user_roster (user_id, character_id, level, eidolon, is_owned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, character_id) DO UPDATE SET
           level = excluded.level,
           eidolon = excluded.eidolon,
           is_owned = excluded.is_owned,
           updated_at = excluded.updated_at`
      )
      .bind(userId, entry.characterId, level, eidolon, isOwned, now, now)
      .run();

    return {
      characterId: entry.characterId,
      level,
      eidolon,
      isOwned: isOwned === 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Removes a character entry from the user's roster.
   */
  async deleteRosterCharacter(userId: string, characterId: string): Promise<void> {
    await this.db
      .delete(userRoster)
      .where(
        and(eq(userRoster.userId, userId), eq(userRoster.characterId, characterId))
      )
      .run();
  }

  // ==========================================================================
  // SAVED TEAMS (Phase 6 D1 Persistence)
  // ==========================================================================

  /**
   * Returns all saved teams for the authenticated user ordered by updatedAt DESC.
   */
  async getSavedTeams(userId: string): Promise<SavedTeamRecord[]> {
    const teams = await this.db
      .select()
      .from(savedTeams)
      .where(eq(savedTeams.userId, userId))
      .orderBy(desc(savedTeams.updatedAt))
      .all();

    if (teams.length === 0) {
      return [];
    }

    const teamIds = teams.map((t) => t.id);
    const members = await this.db
      .select()
      .from(savedTeamMembers)
      .where(inArray(savedTeamMembers.teamId, teamIds))
      .orderBy(asc(savedTeamMembers.slot))
      .all();

    const membersByTeam = new Map<string, Array<{ slot: number; characterId: string }>>();
    for (const m of members) {
      const list = membersByTeam.get(m.teamId) ?? [];
      list.push({ slot: m.slot, characterId: m.characterId });
      membersByTeam.set(m.teamId, list);
    }

    return teams.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.name,
      mode: t.mode,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      members: membersByTeam.get(t.id) ?? [],
    }));
  }

  /**
   * Returns a single saved team by ID if owned by userId.
   */
  async getSavedTeamById(userId: string, teamId: string): Promise<SavedTeamRecord | null> {
    const team = await this.db
      .select()
      .from(savedTeams)
      .where(and(eq(savedTeams.id, teamId), eq(savedTeams.userId, userId)))
      .get();

    if (!team) {
      return null;
    }

    const members = await this.db
      .select()
      .from(savedTeamMembers)
      .where(eq(savedTeamMembers.teamId, teamId))
      .orderBy(asc(savedTeamMembers.slot))
      .all();

    return {
      id: team.id,
      userId: team.userId,
      name: team.name,
      mode: team.mode,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      members: members.map((m) => ({ slot: m.slot, characterId: m.characterId })),
    };
  }

  /**
   * Atomically creates a 4-member saved team using D1 batch execution.
   */
  async createSavedTeam(
    userId: string,
    input: {
      name: string;
      mode?: string;
      members: Array<{ slot: number; characterId: string }>;
    }
  ): Promise<SavedTeamRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const mode = input.mode ?? "general";
    const name = input.name.trim();

    const batchStatements: D1PreparedStatement[] = [];

    // 1. Insert saved_teams row
    batchStatements.push(
      this.d1
        .prepare(
          `INSERT INTO saved_teams (id, user_id, name, mode, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(id, userId, name, mode, now, now)
    );

    // 2. Insert exactly 4 member rows
    for (const m of input.members) {
      batchStatements.push(
        this.d1
          .prepare(
            `INSERT INTO saved_team_members (team_id, slot, character_id)
             VALUES (?, ?, ?)`
          )
          .bind(id, m.slot, m.characterId)
      );
    }

    await this.d1.batch(batchStatements);

    return {
      id,
      userId,
      name,
      mode,
      createdAt: now,
      updatedAt: now,
      members: [...input.members].sort((a, b) => a.slot - b.slot),
    };
  }

  /**
   * Atomically updates a saved team and its members using D1 batch execution.
   */
  async updateSavedTeam(
    userId: string,
    teamId: string,
    input: {
      name?: string;
      mode?: string;
      members?: Array<{ slot: number; characterId: string }>;
    }
  ): Promise<SavedTeamRecord | null> {
    const existing = await this.getSavedTeamById(userId, teamId);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const newName = input.name !== undefined ? input.name.trim() : existing.name;
    const newMode = input.mode !== undefined ? input.mode.trim() : existing.mode;
    const newMembers = input.members !== undefined ? input.members : existing.members;

    const batchStatements: D1PreparedStatement[] = [];

    batchStatements.push(
      this.d1
        .prepare(
          `UPDATE saved_teams SET name = ?, mode = ?, updated_at = ? WHERE id = ? AND user_id = ?`
        )
        .bind(newName, newMode, now, teamId, userId)
    );

    if (input.members !== undefined) {
      batchStatements.push(
        this.d1.prepare(`DELETE FROM saved_team_members WHERE team_id = ?`).bind(teamId)
      );
      for (const m of newMembers) {
        batchStatements.push(
          this.d1
            .prepare(
              `INSERT INTO saved_team_members (team_id, slot, character_id) VALUES (?, ?, ?)`
            )
            .bind(teamId, m.slot, m.characterId)
        );
      }
    }

    await this.d1.batch(batchStatements);

    return {
      id: teamId,
      userId,
      name: newName,
      mode: newMode,
      createdAt: existing.createdAt,
      updatedAt: now,
      members: [...newMembers].sort((a, b) => a.slot - b.slot),
    };
  }

  /**
   * Deletes a saved team and cascades to members.
   */
  async deleteSavedTeam(userId: string, teamId: string): Promise<boolean> {
    const existing = await this.db
      .select({ id: savedTeams.id })
      .from(savedTeams)
      .where(and(eq(savedTeams.id, teamId), eq(savedTeams.userId, userId)))
      .get();

    if (!existing) {
      return false;
    }

    await this.db
      .delete(savedTeams)
      .where(and(eq(savedTeams.id, teamId), eq(savedTeams.userId, userId)))
      .run();

    return true;
  }
}

export interface SavedTeamRecord {
  id: string;
  userId: string;
  name: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{ slot: number; characterId: string }>;
}
