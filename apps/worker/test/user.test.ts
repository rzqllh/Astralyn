import { describe, it, expect, vi, beforeEach } from "vitest";
// @ts-expect-error node:sqlite is a built-in module in Node v24 test environment
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
    async exec(query: string) {
      mem.exec(query);
      return { count: 0, duration: 0 };
    },
  } as unknown as D1Database;
}

describe("Worker Authenticated APIs (User Profile & Roster)", () => {
  let db: D1Database;
  const mockUser = {
    id: "usr_test_trailblazer_1",
    name: "Trailblazer Caelus",
    email: "caelus@astralyn.dev",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockSession = {
    id: "sess_test_123",
    userId: "usr_test_trailblazer_1",
    expiresAt: new Date(Date.now() + 604800000),
    token: "valid-session-token",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const env = {
    DB: {} as D1Database,
    BETTER_AUTH_SECRET: "test-secret-at-least-32-chars-long-for-security",
    BETTER_AUTH_URL: "http://localhost:5173",
    GOOGLE_CLIENT_ID: "test-google-id",
    GOOGLE_CLIENT_SECRET: "test-google-secret",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    db = createTestD1();
    env.DB = db;

    // Seed the user record into the mock database
    db.prepare(
      "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)"
    )
      .bind(mockUser.id, mockUser.name, mockUser.email, Date.now(), Date.now())
      .run();
  });

  function mockAuthenticated() {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: mockUser,
          session: mockSession,
        }),
      },
    };
    vi.spyOn(serverModule, "createAuth").mockReturnValue(
      mockAuth as unknown as serverModule.AuthInstance
    );
  }

  function mockUnauthenticated() {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    };
    vi.spyOn(serverModule, "createAuth").mockReturnValue(
      mockAuth as unknown as serverModule.AuthInstance
    );
  }

  // 1. Authentication Invariants
  it("rejects unauthorized calls to /api/me with HTTP 401", async () => {
    mockUnauthenticated();
    const req = new Request("http://localhost:5173/api/me", { method: "GET" });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("rejects unauthorized calls to /api/roster with HTTP 401", async () => {
    mockUnauthenticated();
    const req = new Request("http://localhost:5173/api/roster", { method: "GET" });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(401);
  });

  // 2. Profile Provisioning & GET /api/me
  it("GET /api/me creates initial profile and indicates needsOnboarding: true", async () => {
    mockAuthenticated();
    const req = new Request("http://localhost:5173/api/me", { method: "GET" });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      user: { id: string };
      profile: { userId: string; displayName: string | null };
      needsOnboarding: boolean;
    };
    expect(data.user.id).toBe(mockUser.id);
    expect(data.profile.userId).toBe(mockUser.id);
    expect(data.profile.displayName).toBe("Trailblazer Caelus");
    expect(data.needsOnboarding).toBe(true);
  });

  // 3. Onboarding Completion (PUT /api/onboarding/complete)
  it("PUT /api/onboarding/complete rejects empty roster with HTTP 400", async () => {
    mockAuthenticated();
    const req = new Request("http://localhost:5173/api/onboarding/complete", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roster: [] }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("ROSTER_EMPTY");
  });

  it("PUT /api/onboarding/complete saves roster, sets onboardingCompletedAt, and transitions needsOnboarding to false", async () => {
    mockAuthenticated();
    const rosterPayload = [
      { characterId: "archer_acheron", level: 80, eidolon: 2 },
      { characterId: "firefly", level: 80, eidolon: 1 },
      { characterId: "aventurine", level: 80, eidolon: 0 },
    ];

    const req = new Request("http://localhost:5173/api/onboarding/complete", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roster: rosterPayload }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(200);
    const result = (await res.json()) as { success: boolean; onboardingCompletedAt: string };
    expect(result.success).toBe(true);
    expect(typeof result.onboardingCompletedAt).toBe("string");

    // Verify subsequent GET /api/me reflects needsOnboarding: false
    const meReq = new Request("http://localhost:5173/api/me", { method: "GET" });
    const meRes = await worker.fetch(meReq, env, {} as ExecutionContext);
    const meData = (await meRes.json()) as {
      needsOnboarding: boolean;
      profile: { onboardingCompletedAt: string | null };
    };
    expect(meData.needsOnboarding).toBe(false);
    expect(meData.profile.onboardingCompletedAt).toBe(result.onboardingCompletedAt);

    // Verify GET /api/roster returns the 3 characters
    const rosterReq = new Request("http://localhost:5173/api/roster", { method: "GET" });
    const rosterRes = await worker.fetch(rosterReq, env, {} as ExecutionContext);
    const rosterData = (await rosterRes.json()) as {
      roster: Array<{ characterId: string; level: number; eidolon: number }>;
    };
    expect(rosterData.roster).toHaveLength(3);
    const acheron = rosterData.roster.find((r) => r.characterId === "archer_acheron");
    expect(acheron).toBeDefined();
    expect(acheron?.level).toBe(80);
    expect(acheron?.eidolon).toBe(2);
  });

  // 4. Roster Mutations (PUT & DELETE)
  it("PUT /api/roster upserts a character, and DELETE /api/roster/:id removes it", async () => {
    mockAuthenticated();

    // 1. Add character
    const addReq = new Request("http://localhost:5173/api/roster", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: "the-herta", level: 80, eidolon: 0 }),
    });
    const addRes = await worker.fetch(addReq, env, {} as ExecutionContext);
    expect(addRes.status).toBe(200);

    // Verify it appears in roster
    const listRes = await worker.fetch(new Request("http://localhost:5173/api/roster"), env, {} as ExecutionContext);
    const listData = (await listRes.json()) as { roster: Array<{ characterId: string; eidolon: number }> };
    expect(listData.roster.some((r) => r.characterId === "the-herta")).toBe(true);

    // 2. Update eidolon to 2
    const updateReq = new Request("http://localhost:5173/api/roster", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: "the-herta", level: 80, eidolon: 2 }),
    });
    await worker.fetch(updateReq, env, {} as ExecutionContext);

    const listRes2 = await worker.fetch(new Request("http://localhost:5173/api/roster"), env, {} as ExecutionContext);
    const listData2 = (await listRes2.json()) as { roster: Array<{ characterId: string; eidolon: number }> };
    const herta = listData2.roster.find((r) => r.characterId === "the-herta");
    expect(herta?.eidolon).toBe(2);

    // 3. Delete character
    const delReq = new Request("http://localhost:5173/api/roster/the-herta", { method: "DELETE" });
    const delRes = await worker.fetch(delReq, env, {} as ExecutionContext);
    expect(delRes.status).toBe(200);

    const listRes3 = await worker.fetch(new Request("http://localhost:5173/api/roster"), env, {} as ExecutionContext);
    const listData3 = (await listRes3.json()) as { roster: Array<{ characterId: string }> };
    expect(listData3.roster.some((r) => r.characterId === "the-herta")).toBe(false);
  });
});
