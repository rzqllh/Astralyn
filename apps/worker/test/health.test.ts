import { describe, it, expect } from "vitest";
import worker from "../src/index";
import { ASTRALYN_SERVICE_NAME, type HealthCheckResponse } from "@astralyn/shared";

function createMockD1(options?: { shouldFail?: boolean }): D1Database {
  return {
    prepare(_query: string) {
      return {
        bind(..._params: unknown[]) {
          return this;
        },
        async all() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: connection timeout");
          }
          return { results: [{ ready: 1 }], success: true, meta: {} };
        },
        async run() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: connection timeout");
          }
          return { results: [{ ready: 1 }], success: true, meta: {} };
        },
        async raw() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: connection timeout");
          }
          return [[1]];
        },
        async first() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: connection timeout");
          }
          return { ready: 1 };
        },
      };
    },
    async batch() {
      return [];
    },
    async exec() {
      return { count: 0, duration: 0 };
    },
    async dump() {
      return new ArrayBuffer(0);
    },
  } as unknown as D1Database;
}

describe("Worker Health Endpoint", () => {
  it("returns HTTP 200 and connected status when D1 database is healthy", async () => {
    const mockDb = createMockD1();
    const request = new Request("http://localhost/api/health", { method: "GET" });
    const response = await worker.fetch(request, { DB: mockDb }, {} as ExecutionContext);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");

    const json = (await response.json()) as HealthCheckResponse;
    expect(json.ok).toBe(true);
    expect(json.service).toBe(ASTRALYN_SERVICE_NAME);
    expect(typeof json.timestamp).toBe("string");
    expect(json.version).toBe("0.0.1");
    expect(json.database).toBeDefined();
    expect(json.database?.status).toBe("connected");
    expect(typeof json.database?.latencyMs).toBe("number");
  });

  it("returns HTTP 503 and unconfigured status when DB binding is missing", async () => {
    const request = new Request("http://localhost/api/health", { method: "GET" });
    const response = await worker.fetch(request, {}, {} as ExecutionContext);

    expect(response.status).toBe(503);
    const json = (await response.json()) as HealthCheckResponse;
    expect(json.ok).toBe(false);
    expect(json.service).toBe(ASTRALYN_SERVICE_NAME);
    expect(json.database?.status).toBe("unconfigured");
  });

  it("returns HTTP 503 and disconnected status when DB query execution fails", async () => {
    const failingDb = createMockD1({ shouldFail: true });
    const request = new Request("http://localhost/api/health", { method: "GET" });
    const response = await worker.fetch(
      request,
      { DB: failingDb },
      {} as ExecutionContext
    );

    expect(response.status).toBe(503);
    const json = (await response.json()) as HealthCheckResponse;
    expect(json.ok).toBe(false);
    expect(json.service).toBe(ASTRALYN_SERVICE_NAME);
    expect(json.database?.status).toBe("disconnected");
    expect(json.database?.error).toContain("D1 execution error");
  });

  it("returns 404 for unknown endpoints", async () => {
    const request = new Request("http://localhost/api/unknown", { method: "GET" });
    const response = await worker.fetch(request, {}, {} as ExecutionContext);

    expect(response.status).toBe(404);
  });
});
