import { describe, it, expect } from "vitest";
import worker from "../src/index";

describe("Export Endpoint (/api/_internal/export-release)", () => {
  it("fails closed when INTERNAL_BUILDER_SECRET is missing from environment", async () => {
    const env = { DB: {} as Record<string, unknown> };
    const request = new Request("http://localhost/api/_internal/export-release", {
      method: "GET",
    });

    const response = await worker.fetch(request, env as unknown as import("../src/index").Env, {} as unknown as import("@cloudflare/workers-types").ExecutionContext);
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("missing secret");
  });

  it("denies access when Authorization header is missing", async () => {
    const env = { DB: {} as Record<string, unknown>, INTERNAL_BUILDER_SECRET: "test-secret" };
    const request = new Request("http://localhost/api/_internal/export-release", {
      method: "GET",
    });

    const response = await worker.fetch(request, env as unknown as import("../src/index").Env, {} as unknown as import("@cloudflare/workers-types").ExecutionContext);
    expect(response.status).toBe(401);
  });

  it("denies access when Authorization header is malformed", async () => {
    const env = { DB: {} as Record<string, unknown>, INTERNAL_BUILDER_SECRET: "test-secret" };
    const request = new Request("http://localhost/api/_internal/export-release", {
      method: "GET",
      headers: { Authorization: "Bearer" },
    });

    const response = await worker.fetch(request, env as unknown as import("../src/index").Env, {} as unknown as import("@cloudflare/workers-types").ExecutionContext);
    expect(response.status).toBe(401);
  });

  it("denies access when Bearer token is wrong", async () => {
    const env = { DB: {} as Record<string, unknown>, INTERNAL_BUILDER_SECRET: "test-secret" };
    const request = new Request("http://localhost/api/_internal/export-release", {
      method: "GET",
      headers: { Authorization: "Bearer wrong-secret" },
    });

    const response = await worker.fetch(request, env as unknown as import("../src/index").Env, {} as unknown as import("@cloudflare/workers-types").ExecutionContext);
    expect(response.status).toBe(401);
  });

  it("allows access and returns only published data when token is correct", async () => {
    const env = { DB: {} as Record<string, unknown>, INTERNAL_BUILDER_SECRET: "test-secret" };
    const request = new Request("http://localhost/api/_internal/export-release", {
      method: "GET",
      headers: { Authorization: "Bearer test-secret" },
    });

    const response = await worker.fetch(request, env as unknown as import("../src/index").Env, {} as unknown as import("@cloudflare/workers-types").ExecutionContext);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };

    // Test that the mock implementation conceptually returns published
    expect(body.status).toBe("published");
    // Ensure the secret is NOT leaked in the payload
    expect(JSON.stringify(body)).not.toContain("test-secret");
  });
});
