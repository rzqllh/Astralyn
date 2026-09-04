import { describe, it, expect, vi, beforeEach } from "vitest";
// @ts-expect-error node:sqlite is a built-in module in Node test environment
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index";
import * as serverModule from "../src/auth/server";

function createTestD1(): D1Database {
  const mem = new DatabaseSync(":memory:");

  mem.exec(`
    CREATE TABLE user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER DEFAULT 0 NOT NULL,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE profiles (
      user_id TEXT PRIMARY KEY NOT NULL,
      display_name TEXT,
      preferred_language TEXT DEFAULT 'en' NOT NULL,
      onboarding_completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE user_roster (
      user_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      level INTEGER DEFAULT 1 NOT NULL,
      eidolon INTEGER DEFAULT 0 NOT NULL,
      is_owned INTEGER DEFAULT 1 NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, character_id),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE saved_teams (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      mode TEXT DEFAULT 'general' NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      CONSTRAINT saved_teams_name_length CHECK(length(trim(name)) between 1 and 50)
    );

    CREATE TABLE saved_team_members (
      team_id TEXT NOT NULL,
      slot INTEGER NOT NULL,
      character_id TEXT NOT NULL,
      PRIMARY KEY (team_id, slot),
      FOREIGN KEY (team_id) REFERENCES saved_teams(id) ON DELETE CASCADE,
      CONSTRAINT saved_team_members_slot_range CHECK(slot between 1 and 4)
    );

    CREATE UNIQUE INDEX saved_team_members_unique_char ON saved_team_members(team_id, character_id);
  `);

  return {
    prepare(query: string) {
      let boundParams: unknown[] = [];
      return {
        bind(...params: unknown[]) {
          boundParams = params;
          return this;
        },
        async all() {
          const stmt = mem.prepare(query);
          const results = stmt.all(...boundParams);
          return { results, success: true, meta: {} };
        },
        async run() {
          const stmt = mem.prepare(query);
          const info = stmt.run(...boundParams);
          return {
            results: [],
            success: true,
            meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) },
          };
        },
        async first() {
          const stmt = mem.prepare(query);
          const row = stmt.get(...boundParams);
          return row ?? null;
        },
        async raw() {
          const stmt = mem.prepare(query);
          const all = stmt.all(...boundParams);
          return all.map((r: unknown) => Object.values(r as Record<string, unknown>));
        },
      };
    },
    async batch(statements: Array<{ run: () => Promise<unknown> }>) {
      const results = [];
      mem.exec("BEGIN TRANSACTION;");
      try {
        for (const s of statements) {
          const res = await s.run();
          results.push(res);
        }
        mem.exec("COMMIT;");
        return results;
      } catch (err) {
        mem.exec("ROLLBACK;");
        throw err;
      }
    },
    exec(query: string) {
      mem.exec(query);
      return Promise.resolve({ count: 0, duration: 0 });
    },
  } as unknown as D1Database;
}

describe("Saved Teams Worker Endpoints (/api/saved-teams/*)", () => {
  let db: D1Database;
  const dummyCtx = {} as ExecutionContext;
  const env = {
    DB: {} as D1Database,
    BETTER_AUTH_SECRET: "test-secret-at-least-32-chars-long-for-security",
    BETTER_AUTH_URL: "http://localhost:5173",
    GOOGLE_CLIENT_ID: "test-google-id",
    GOOGLE_CLIENT_SECRET: "test-google-secret",
  };

  beforeEach(() => {
    db = createTestD1();
    env.DB = db;
    vi.restoreAllMocks();

    // Seed test users
    for (const u of ["user_1", "user_A", "user_B"]) {
      db.prepare(
        "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)"
      )
        .bind(u, `Name ${u}`, `${u}@example.com`, Date.now(), Date.now())
        .run();
    }
  });

  function mockAuth(userId: string) {
    vi.spyOn(serverModule, "createAuth").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: userId, email: `${userId}@example.com`, name: "Test User" },
          session: { id: "sess_1", userId, expiresAt: new Date(Date.now() + 86400000) },
        }),
      },
    } as unknown as ReturnType<typeof serverModule.createAuth>);
  }

  function mockUnauth() {
    vi.spyOn(serverModule, "createAuth").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    } as unknown as ReturnType<typeof serverModule.createAuth>);
  }

  it("rejects unauthenticated requests with 401", async () => {
    mockUnauth();
    const req = new Request("http://localhost/api/saved-teams");
    const res = await worker.fetch(req, env, dummyCtx);
    expect(res.status).toBe(401);
  });

  it("rejects creation with empty name or invalid member count", async () => {
    mockAuth("user_1");

    // Empty name
    const res1 = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          members: [
            { slot: 1, characterId: "acheron" },
            { slot: 2, characterId: "castorice" },
            { slot: 3, characterId: "aventurine" },
            { slot: 4, characterId: "tingyun" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(res1.status).toBe(400);
    const body1 = (await res1.json()) as { code: string };
    expect(body1.code).toBe("INVALID_NAME");

    // Only 3 members
    const res2 = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Incomplete Team",
          members: [
            { slot: 1, characterId: "acheron" },
            { slot: 2, characterId: "castorice" },
            { slot: 3, characterId: "aventurine" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(res2.status).toBe(400);
    const body2 = (await res2.json()) as { code: string };
    expect(body2.code).toBe("INVALID_MEMBERS_COUNT");
  });

  it("rejects duplicate characters in members", async () => {
    mockAuth("user_1");

    const res = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate Team",
          members: [
            { slot: 1, characterId: "acheron" },
            { slot: 2, characterId: "acheron" },
            { slot: 3, characterId: "aventurine" },
            { slot: 4, characterId: "tingyun" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("DUPLICATE_MEMBERS");
  });

  it("creates, retrieves, updates, and deletes a 4-member saved team", async () => {
    mockAuth("user_1");

    // 1. Create team
    const createRes = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Acheron Hypercarry",
          mode: "general",
          members: [
            { slot: 1, characterId: "acheron" },
            { slot: 2, characterId: "castorice" },
            { slot: 3, characterId: "aventurine" },
            { slot: 4, characterId: "tingyun" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(createRes.status).toBe(201);
    const createBody = (await createRes.json()) as {
      success: boolean;
      team: { id: string; name: string; members: Array<{ slot: number; characterId: string }> };
    };
    expect(createBody.success).toBe(true);
    expect(createBody.team.name).toBe("Acheron Hypercarry");
    expect(createBody.team.members.length).toBe(4);
    const teamId = createBody.team.id;

    // 2. List teams
    const listRes = await worker.fetch(new Request("http://localhost/api/saved-teams"), env, dummyCtx);
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as { teams: Array<{ id: string; name: string }> };
    expect(listBody.teams.length).toBe(1);
    expect(listBody.teams[0].id).toBe(teamId);

    // 3. Get team by ID
    const getRes = await worker.fetch(new Request(`http://localhost/api/saved-teams/${teamId}`), env, dummyCtx);
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as { team: { name: string } };
    expect(getBody.team.name).toBe("Acheron Hypercarry");

    // 4. Update team name and members
    const updateRes = await worker.fetch(
      new Request(`http://localhost/api/saved-teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Nihility Team",
          members: [
            { slot: 1, characterId: "acheron" },
            { slot: 2, characterId: "firefly" },
            { slot: 3, characterId: "gallagher" },
            { slot: 4, characterId: "robin" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(updateRes.status).toBe(200);
    const updateBody = (await updateRes.json()) as { team: { name: string; members: Array<{ characterId: string }> } };
    expect(updateBody.team.name).toBe("Updated Nihility Team");
    expect(updateBody.team.members[1].characterId).toBe("firefly");

    // 5. Delete team
    const deleteRes = await worker.fetch(
      new Request(`http://localhost/api/saved-teams/${teamId}`, { method: "DELETE" }),
      env,
      dummyCtx
    );
    expect(deleteRes.status).toBe(200);

    // Verify team is gone
    const getDeletedRes = await worker.fetch(new Request(`http://localhost/api/saved-teams/${teamId}`), env, dummyCtx);
    expect(getDeletedRes.status).toBe(404);
  });

  it("enforces tenant/user isolation: user cannot view or mutate another user's team", async () => {
    // User A creates team
    mockAuth("user_A");
    const createRes = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User A Private Team",
          members: [
            { slot: 1, characterId: "acheron" },
            { slot: 2, characterId: "castorice" },
            { slot: 3, characterId: "aventurine" },
            { slot: 4, characterId: "tingyun" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    const createBody = (await createRes.json()) as { team: { id: string } };
    const teamId = createBody.team.id;

    // User B tries to view
    mockAuth("user_B");
    const getRes = await worker.fetch(new Request(`http://localhost/api/saved-teams/${teamId}`), env, dummyCtx);
    expect(getRes.status).toBe(404);

    // User B tries to update
    const updateRes = await worker.fetch(
      new Request(`http://localhost/api/saved-teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacked" }),
      }),
      env,
      dummyCtx
    );
    expect(updateRes.status).toBe(404);

    // User B tries to delete
    const deleteRes = await worker.fetch(
      new Request(`http://localhost/api/saved-teams/${teamId}`, { method: "DELETE" }),
      env,
      dummyCtx
    );
    expect(deleteRes.status).toBe(404);
  });

  it("strictly enforces canonical character IDs without underscore aliases", async () => {
    mockAuth("user_1");

    // Rejects underscore alias 'the_herta'
    const resUnderscoreHerta = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Underscore Herta Team",
          members: [
            { slot: 1, characterId: "the_herta" },
            { slot: 2, characterId: "aventurine" },
            { slot: 3, characterId: "firefly" },
            { slot: 4, characterId: "gallagher" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(resUnderscoreHerta.status).toBe(400);
    const bodyHerta = (await resUnderscoreHerta.json()) as { code: string };
    expect(bodyHerta.code).toBe("UNKNOWN_CHARACTER_ID");

    // Rejects underscore alias 'aventurine_waveflair'
    const resUnderscoreWf = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Underscore Waveflair Team",
          members: [
            { slot: 1, characterId: "aventurine_waveflair" },
            { slot: 2, characterId: "robin" },
            { slot: 3, characterId: "firefly" },
            { slot: 4, characterId: "gallagher" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(resUnderscoreWf.status).toBe(400);
    const bodyWf = (await resUnderscoreWf.json()) as { code: string };
    expect(bodyWf.code).toBe("UNKNOWN_CHARACTER_ID");

    // Accepts exact verified canonical IDs: 'the-herta' and 'aventurine-waveflair'
    const resCanonical = await worker.fetch(
      new Request("http://localhost/api/saved-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Canonical IDs Team",
          members: [
            { slot: 1, characterId: "the-herta" },
            { slot: 2, characterId: "aventurine-waveflair" },
            { slot: 3, characterId: "robin" },
            { slot: 4, characterId: "gallagher" },
          ],
        }),
      }),
      env,
      dummyCtx
    );
    expect(resCanonical.status).toBe(201);
  });

  it("enforces SQLite DB CHECK constraints on slot range and trimmed name length", async () => {
    // 1. Direct insert violating slot CHECK constraint (slot = 5)
    await db.prepare("INSERT INTO saved_teams (id, user_id, name, created_at, updated_at) VALUES ('t1', 'user_1', 'Valid Team', 'now', 'now')").run();
    await expect(
      db.prepare("INSERT INTO saved_team_members (team_id, slot, character_id) VALUES ('t1', 5, 'acheron')").run()
    ).rejects.toThrow(/CHECK constraint failed/);

    // 2. Direct insert violating trimmed name CHECK constraint (name = '   ')
    await expect(
      db.prepare("INSERT INTO saved_teams (id, user_id, name, created_at, updated_at) VALUES ('t2', 'user_1', '   ', 'now', 'now')").run()
    ).rejects.toThrow(/CHECK constraint failed/);
  });
});
