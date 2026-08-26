import { describe, it, expect } from "vitest";
import worker from "../src/index";
import { ASTRALYN_SERVICE_NAME } from "@astralyn/shared";

describe("Worker Health Endpoint", () => {
  it("returns ok: true and service name on GET /api/health", async () => {
    const request = new Request("http://localhost/api/health", { method: "GET" });
    const response = await worker.fetch(request, {}, {} as ExecutionContext);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");

    const json = (await response.json()) as Record<string, unknown>;
    expect(json.ok).toBe(true);
    expect(json.service).toBe(ASTRALYN_SERVICE_NAME);
    expect(typeof json.timestamp).toBe("string");
    expect(json.version).toBe("0.0.1");
  });

  it("returns 404 for unknown endpoints", async () => {
    const request = new Request("http://localhost/api/unknown", { method: "GET" });
    const response = await worker.fetch(request, {}, {} as ExecutionContext);

    expect(response.status).toBe(404);
  });
});
