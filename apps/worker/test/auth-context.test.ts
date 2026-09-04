import { describe, it, expect, vi } from "vitest";
import { resolveAuthContext } from "../src/auth/context";
import * as serverModule from "../src/auth/server";

describe("AuthContext Seam (resolveAuthContext)", () => {
  const completeEnv: serverModule.AuthEnv = {
    DB: {} as D1Database,
    BETTER_AUTH_SECRET: "test-secret-at-least-32-chars-long-for-security",
    BETTER_AUTH_URL: "http://localhost:5173",
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
  };

  it("returns unavailable when auth environment bindings are missing", async () => {
    const request = new Request("http://localhost:5173/api/test");
    const result = await resolveAuthContext(request, {});

    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.code).toBe("AUTH_UNCONFIGURED");
      expect(result.message).toContain("unavailable");
    }
  });

  it("returns anonymous when no valid session is present in request headers", async () => {
    const request = new Request("http://localhost:5173/api/test");

    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    };
    vi.spyOn(serverModule, "createAuth").mockReturnValue(
      mockAuth as unknown as serverModule.AuthInstance
    );

    const result = await resolveAuthContext(request, completeEnv);

    expect(result.status).toBe("anonymous");
    expect("userId" in result).toBe(false);
    expect("user" in result).toBe(false);
  });

  it("returns authenticated with real userId, user, and session on valid session", async () => {
    const request = new Request("http://localhost:5173/api/test", {
      headers: {
        cookie: "better-auth.session_token=valid-token-123",
      },
    });

    const mockUser = {
      id: "usr_real_12345",
      name: "Astral Explorer",
      email: "explorer@astralyn.dev",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = {
      id: "sess_real_67890",
      userId: "usr_real_12345",
      expiresAt: new Date(Date.now() + 604800000),
      token: "valid-token-123",
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "Astralyn/Test",
    };

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

    const result = await resolveAuthContext(request, completeEnv);

    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.userId).toBe("usr_real_12345");
      expect(result.user.email).toBe("explorer@astralyn.dev");
      expect(result.session.token).toBe("valid-token-123");
    }
  });

  it("returns unavailable when auth session resolution throws an error", async () => {
    const request = new Request("http://localhost:5173/api/test");

    const mockAuth = {
      api: {
        getSession: vi.fn().mockRejectedValue(new Error("D1 connection lost")),
      },
    };
    vi.spyOn(serverModule, "createAuth").mockReturnValue(
      mockAuth as unknown as serverModule.AuthInstance
    );

    const result = await resolveAuthContext(request, completeEnv);

    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.message).toBe(
        "An error occurred while verifying authentication state."
      );
    }
  });
});
