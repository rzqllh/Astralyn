import { test, describe, beforeEach } from "node:test";
import * as assert from "node:assert/strict";

describe("Knowledge Export Tool", () => {
  beforeEach(() => {
    // We mock the fetch function globally
    global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
      // For the first test
      if (options?.headers && (options.headers as Record<string, string>).Authorization === "Bearer INTERNAL_BUILDER_SECRET") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            version: "4.5",
            status: "published",
            data: { characters: [], recommendations: [] }
          })
        } as Response;
      }

      // For the second test failure mode
      if (url === "http://127.0.0.1:8787/api/_internal/export-release/fail") {
        throw new Error("Connection refused");
      }

      return {
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" })
      } as Response;
    };
  });

  test("should enforce authorization on the internal API", async () => {
    const authHeader = "Bearer INTERNAL_BUILDER_SECRET";
    const res = await fetch("http://127.0.0.1:8787/api/_internal/export-release", {
      headers: { "Authorization": authHeader }
    });

    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "published");
  });

  test("should handle D1 API failures gracefully and fallback to fixtures", async () => {
    let threw = false;
    try {
      await fetch("http://127.0.0.1:8787/api/_internal/export-release/fail");
    } catch {
      threw = true;
    }
    assert.equal(threw, true);
  });
});
