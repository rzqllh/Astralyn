import { describe, it, expect, vi, afterEach } from "vitest";
import worker from "../src/index";
import * as serverModule from "../src/auth/server";
import { AUTH_SCHEMA_OPTIONS } from "../src/auth/schema-options";

describe("Worker Auth Route (/api/auth/*)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const completeEnv: serverModule.AuthEnv = {
    DB: {} as D1Database,
    BETTER_AUTH_SECRET: "test-secret-at-least-32-chars-long-for-security",
    BETTER_AUTH_URL: "http://localhost:5173",
    GOOGLE_CLIENT_ID: "test-google-id",
    GOOGLE_CLIENT_SECRET: "test-google-secret",
  };

  it("explicitly configures provider-id identityStrategy and security options in shared config", () => {
    expect(AUTH_SCHEMA_OPTIONS.account.identityStrategy).toBe("provider-id");
    expect(AUTH_SCHEMA_OPTIONS.account.encryptOAuthTokens).toBe(true);
    expect(AUTH_SCHEMA_OPTIONS.account.accountLinking.disableImplicitLinking).toBe(true);
  });

  it("returns HTTP 503 with AUTH_UNCONFIGURED when auth bindings are missing", async () => {
    const request = new Request("http://localhost:5173/api/auth/get-session", {
      method: "GET",
    });
    const response = await worker.fetch(request, {}, {} as ExecutionContext);

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");

    const body = (await response.json()) as {
      code: string;
      error: string;
      missing: string[];
    };
    expect(body.code).toBe("AUTH_UNCONFIGURED");
    expect(body.missing).toContain("DB");
    expect(body.missing).toContain("BETTER_AUTH_SECRET");
  });

  it("forwards /api/auth/* requests to Better Auth handler and sets Cache-Control: no-store", async () => {
    const mockResponse = new Response(JSON.stringify({ session: null }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie":
          "better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      },
    });

    const mockAuth = {
      handler: vi.fn().mockResolvedValue(mockResponse),
    };
    vi.spyOn(serverModule, "createAuth").mockReturnValue(
      mockAuth as unknown as serverModule.AuthInstance
    );

    const request = new Request("http://localhost:5173/api/auth/get-session", {
      method: "GET",
    });
    const response = await worker.fetch(request, completeEnv, {} as ExecutionContext);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Set-Cookie")).toContain("better-auth.session_token");
  });

  it("returns HTTP 500 with sanitized code when Better Auth handler throws an error", async () => {
    const mockAuth = {
      handler: vi.fn().mockRejectedValue(new Error("Internal SQLite lock")),
    };
    vi.spyOn(serverModule, "createAuth").mockReturnValue(
      mockAuth as unknown as serverModule.AuthInstance
    );

    const request = new Request("http://localhost:5173/api/auth/callback/google", {
      method: "GET",
    });
    const response = await worker.fetch(request, completeEnv, {} as ExecutionContext);

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as { code: string; error: string };
    expect(body.code).toBe("AUTH_HANDLER_ERROR");
    expect(body.error).toBe("Authentication request failed");
  });
});

describe("Regression: Phase 3B Local OAuth & Runtime D1 Column Mapping", () => {
  function createD1Mock(): D1Database {
    const tableData = new Map<string, unknown[]>();
    tableData.set("verification", []);

    return {
      prepare: (query: string) => {
        return {
          bind: (...args: unknown[]) => ({
            first: async () => null,
            all: async () => {
              const lower = query.toLowerCase();
              if (lower.includes("insert into \"verification\"")) {
                const row = {
                  id: args[5] ?? "mock-verification-id",
                  identifier: args[0],
                  value: args[1],
                  expires_at: args[2],
                  created_at: args[3],
                  updated_at: args[4],
                };
                tableData.get("verification")!.push(row);
                return {
                  results: [row],
                  meta: { changes: 1, last_row_id: 1 },
                };
              }
              return { results: [], meta: { changes: 0 } };
            },
            run: async () => ({ success: true, meta: { changes: 1, last_row_id: 1 } }),
          }),
        };
      },
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    } as unknown as D1Database;
  }

  const validEnv: serverModule.AuthEnv = {
    DB: createD1Mock(),
    BETTER_AUTH_SECRET: "test-secret-at-least-32-chars-long-for-security",
    BETTER_AUTH_URL: "http://localhost:5173",
    GOOGLE_CLIENT_ID: "test-google-client-id-123.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret-xyz",
  };

  it("anonymous get-session succeeds against real Better Auth runtime", async () => {
    const request = new Request("http://localhost:5173/api/auth/get-session", {
      method: "GET",
    });
    const response = await worker.fetch(request, validEnv, {} as ExecutionContext);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.text();
    expect(body).toBe("null");
  });

  it("correctly configured Google social sign-in reaches Better Auth redirect contract without throwing", async () => {
    const request = new Request("http://localhost:5173/api/auth/sign-in/social", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
      },
      body: JSON.stringify({
        provider: "google",
        callbackURL: "/",
      }),
    });

    const response = await worker.fetch(request, validEnv, {} as ExecutionContext);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const json = (await response.json()) as { url?: string; redirect?: boolean };
    expect(json.redirect).toBe(true);
    expect(typeof json.url).toBe("string");
    expect(json.url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(json.url).toContain("client_id=test-google-client-id-123.apps.googleusercontent.com");
    expect(json.url).toContain("scope=email+profile+openid");

    // Cookie and redirect Location headers
    expect(response.headers.get("Location")).toBe(json.url);
    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("better-auth.state=");

    // Ensure secrets never leak in response payload or headers
    const rawHeaders = JSON.stringify(Object.fromEntries(response.headers.entries()));
    expect(rawHeaders).not.toContain("test-secret-at-least-32-chars-long-for-security");
    expect(rawHeaders).not.toContain("test-google-client-secret-xyz");
    expect(JSON.stringify(json)).not.toContain("test-secret-at-least-32-chars-long-for-security");
    expect(JSON.stringify(json)).not.toContain("test-google-client-secret-xyz");
  });

  it("invalid provider fails cleanly with 404 rather than generic empty 500", async () => {
    const request = new Request("http://localhost:5173/api/auth/sign-in/social", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
      },
      body: JSON.stringify({
        provider: "__invalid_provider__",
        callbackURL: "/",
      }),
    });

    const response = await worker.fetch(request, validEnv, {} as ExecutionContext);

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const json = (await response.json()) as { message?: string; code?: string };
    expect(json.code).toBe("PROVIDER_NOT_FOUND");
    expect(json.message).toBe("Provider not found");
  });

  it("missing provider configuration fails explicitly and sanitized with 503", async () => {
    const envMissingGoogle: serverModule.AuthEnv = {
      DB: createD1Mock(),
      BETTER_AUTH_SECRET: "test-secret-at-least-32-chars-long-for-security",
      BETTER_AUTH_URL: "http://localhost:5173",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    };

    const request = new Request("http://localhost:5173/api/auth/sign-in/social", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
      },
      body: JSON.stringify({
        provider: "google",
        callbackURL: "/",
      }),
    });

    const response = await worker.fetch(request, envMissingGoogle, {} as ExecutionContext);

    expect(response.status).toBe(503);
    const json = (await response.json()) as { code: string; missing: string[] };
    expect(json.code).toBe("AUTH_UNCONFIGURED");
    expect(json.missing).toContain("GOOGLE_CLIENT_ID");
    expect(json.missing).toContain("GOOGLE_CLIENT_SECRET");
  });
});

