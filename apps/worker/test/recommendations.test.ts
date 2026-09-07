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

describe("Worker POST /api/recommendations/teams", () => {
  let db: D1Database;
  const mockUser = {
    id: "usr_rec_test_1",
    name: "Stelle Trailblazer",
    email: "stelle@astralyn.dev",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockSession = {
    id: "sess_rec_1",
    userId: "usr_rec_test_1",
    expiresAt: new Date(Date.now() + 604800000),
    token: "valid-session-token",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const env = {
    BETTER_AUTH_SECRET: "test-auth-secret-minimum-32-characters-long",
    BETTER_AUTH_URL: "http://localhost:8787",
    GOOGLE_CLIENT_ID: "mock-google-client-id",
    GOOGLE_CLIENT_SECRET: "mock-google-client-secret",
    get DB() {
      return db;
    },
  };

  beforeEach(async () => {
    db = createTestD1();
    vi.restoreAllMocks();

    await db
      .prepare(
        "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)"
      )
      .bind(mockUser.id, mockUser.name, mockUser.email, Date.now(), Date.now())
      .run();
  });

  function mockAuthenticatedSession() {
    vi.spyOn(serverModule, "createAuth").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          session: mockSession,
          user: mockUser,
        }),
      },
    } as unknown as ReturnType<typeof serverModule.createAuth>);
  }

  function mockUnauthenticatedSession() {
    vi.spyOn(serverModule, "createAuth").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    } as unknown as ReturnType<typeof serverModule.createAuth>);
  }

  it("returns bounded all-character recommendations without a session", async () => {
    mockUnauthenticatedSession();
    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "all_characters", limit: 2 }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      scope: string;
      status: string;
      teams: Array<{ slots: Array<{ isOwned: boolean; level?: number; eidolon?: number }> }>;
      evaluation: {
        candidateCount: number;
        evaluatedTeamCount: number;
        maxCandidateCount: number;
        maxTeamEvaluations: number;
      };
    };
    expect(body.scope).toBe("all_characters");
    expect(body.status).toBe("ok");
    expect(body.teams).toHaveLength(2);
    expect(body.evaluation).toEqual({
      candidateCount: 16,
      evaluatedTeamCount: 1820,
      maxCandidateCount: 16,
      maxTeamEvaluations: 1820,
    });
    expect(body.teams.every((team) => team.slots.every((slot) => slot.isOwned === false))).toBe(true);
    expect(body.teams.every((team) => team.slots.every((slot) => slot.level === undefined))).toBe(true);
  });

  it("returns bounded all-character recommendations for an authenticated empty roster without persisting fake ownership", async () => {
    mockAuthenticatedSession();
    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "all_characters", focusCharacterId: "firefly", limit: 2 }),
    });

    const first = await worker.fetch(req, env, {} as ExecutionContext);
    const firstBody = (await first.json()) as {
      status: string;
      evaluation: { candidateCount: number; evaluatedTeamCount: number };
      teams: unknown[];
    };
    const persisted = await db
      .prepare("SELECT COUNT(*) AS count FROM user_roster WHERE user_id = ?")
      .bind(mockUser.id)
      .first<{ count: number }>();

    expect(first.status).toBe(200);
    expect(firstBody.status).toBe("ok");
    expect(firstBody.teams).toHaveLength(2);
    expect(firstBody.evaluation).toMatchObject({ candidateCount: 16, evaluatedTeamCount: 455 });
    expect(persisted?.count).toBe(0);
  });

  it("rejects owned-only scope without authentication", async () => {
    mockUnauthenticatedSession();
    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "owned_only" }),
    });

    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a missing or invalid recommendation scope", async () => {
    mockUnauthenticatedSession();

    for (const body of [{}, { scope: "everything" }]) {
      const req = new Request("http://localhost:8787/api/recommendations/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const res = await worker.fetch(req, env, {} as ExecutionContext);

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toMatchObject({ code: "INVALID_SCOPE" });
    }
  });

  it("returns 405 Method Not Allowed on GET request", async () => {
    mockAuthenticatedSession();
    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "GET",
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(405);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("returns 400 UNKNOWN_CHARACTER_ID when focusCharacterId is invalid", async () => {
    mockAuthenticatedSession();
    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "all_characters", focusCharacterId: "completely-unknown-character" }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("UNKNOWN_CHARACTER_ID");
  });

  it("returns 400 INVALID_TARGET_WEAKNESS when weakness element is not a combat element", async () => {
    mockAuthenticatedSession();
    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "all_characters", targetWeaknesses: ["Fire", "InvalidElement"] }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("INVALID_TARGET_WEAKNESS");
  });

  it("returns 400 INVALID_LIMIT when limit is out of range", async () => {
    mockAuthenticatedSession();
    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "all_characters", limit: 0 }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("INVALID_LIMIT");
  });

  it("returns 400 FOCUS_CHARACTER_NOT_OWNED when focus character is not in user roster", async () => {
    mockAuthenticatedSession();
    // User only owns Gallagher and Firefly
    await db
      .prepare(
        "INSERT INTO user_roster (user_id, character_id, level, eidolon, is_owned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(mockUser.id, "gallagher", 80, 0, 1, new Date().toISOString(), new Date().toISOString())
      .run();

    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "owned_only", focusCharacterId: "firefly" }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("FOCUS_CHARACTER_NOT_OWNED");
  });

  it("returns 200 with status: 'insufficient_roster' when user has < 4 characters", async () => {
    mockAuthenticatedSession();
    // User has 2 characters
    await db
      .prepare(
        "INSERT INTO user_roster (user_id, character_id, level, eidolon, is_owned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(mockUser.id, "firefly", 80, 0, 1, new Date().toISOString(), new Date().toISOString())
      .run();
    await db
      .prepare(
        "INSERT INTO user_roster (user_id, character_id, level, eidolon, is_owned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(mockUser.id, "gallagher", 80, 0, 1, new Date().toISOString(), new Date().toISOString())
      .run();

    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "owned_only" }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; teams: unknown[] };
    expect(body.status).toBe("insufficient_roster");
    expect(body.teams).toHaveLength(0);
  });

  it("returns 200 with ranked recommendations when user has sufficient roster", async () => {
    mockAuthenticatedSession();
    // Insert 5 characters: firefly, gallagher, tingyun, robin, the-herta
    const chars = ["firefly", "gallagher", "tingyun", "robin", "the-herta"];
    for (const c of chars) {
      await db
        .prepare(
          "INSERT INTO user_roster (user_id, character_id, level, eidolon, is_owned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(mockUser.id, c, 80, 0, 1, new Date().toISOString(), new Date().toISOString())
        .run();
    }

    const req = new Request("http://localhost:8787/api/recommendations/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "owned_only", focusCharacterId: "firefly", limit: 2 }),
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      status: string;
      teams: Array<{ rank: number; signature: string; archetype: string; reasons: Array<{ code: string }> }>;
    };
    expect(body.success).toBe(true);
    expect(body.status).toBe("ok");
    expect(body.teams).toHaveLength(2);
    expect(body.teams[0].rank).toBe(1);
    expect(body.teams[0].signature).toBe("firefly:gallagher:robin:tingyun");
    expect(body.teams[0].reasons.some((r) => r.code === "SYNERGY_SUPER_BREAK_CORE")).toBe(true);
  });

  it("returns deterministic responses for repeated all-character requests", async () => {
    mockUnauthenticatedSession();
    const body = JSON.stringify({
      scope: "all_characters",
      targetWeaknesses: ["Fire", "Lightning"],
      limit: 3,
    });
    const createRequest = () =>
      new Request("http://localhost:8787/api/recommendations/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

    const first = await worker.fetch(createRequest(), env, {} as ExecutionContext);
    const second = await worker.fetch(createRequest(), env, {} as ExecutionContext);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await first.text()).toBe(await second.text());
  });
});
