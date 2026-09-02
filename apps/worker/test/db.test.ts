import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { createDbClient, checkDatabaseHealth } from "../src/db";

function createMockD1(options?: { shouldFail?: boolean }): D1Database {
  return {
    prepare(_query: string) {
      return {
        bind(..._params: unknown[]) {
          return this;
        },
        async all() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: query timeout");
          }
          return { results: [{ ready: 1 }], success: true, meta: {} };
        },
        async run() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: query timeout");
          }
          return { results: [{ ready: 1 }], success: true, meta: {} };
        },
        async raw() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: query timeout");
          }
          return [[1]];
        },
        async first() {
          if (options?.shouldFail) {
            throw new Error("D1 execution error: query timeout");
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

describe("Drizzle D1 Persistence Layer", () => {
  it("initializes a Drizzle client and executes a read-only SELECT 1 probe", async () => {
    const mockDb = createMockD1();
    const client = createDbClient(mockDb);

    const result = await client.run(sql`SELECT 1 as ready`);
    expect(result).toBeDefined();
  });

  it("checkDatabaseHealth returns connected and measures latency on healthy D1", async () => {
    const mockDb = createMockD1();
    const health = await checkDatabaseHealth(mockDb);

    expect(health.status).toBe("connected");
    expect(typeof health.latencyMs).toBe("number");
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.error).toBeUndefined();
  });

  it("checkDatabaseHealth returns unconfigured when db is undefined", async () => {
    const health = await checkDatabaseHealth(undefined);

    expect(health.status).toBe("unconfigured");
    expect(health.latencyMs).toBeUndefined();
    expect(health.error).toBeUndefined();
  });

  it("checkDatabaseHealth catches and surfaces error on D1 query failure", async () => {
    const failingDb = createMockD1({ shouldFail: true });
    const health = await checkDatabaseHealth(failingDb);

    expect(health.status).toBe("disconnected");
    expect(health.latencyMs).toBeUndefined();
    expect(health.error).toBe("D1 execution error: query timeout");
  });
});
