import { ASTRALYN_SERVICE_NAME, type HealthCheckResponse } from "@astralyn/shared";

export interface Env {
  // Placeholder for future bindings (e.g. DB: D1Database in Phase 3)
  DB?: unknown;
}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method === "GET" &&
      (url.pathname === "/api/health" || url.pathname === "/api/health/")
    ) {
      const responseBody: HealthCheckResponse = {
        ok: true,
        service: ASTRALYN_SERVICE_NAME,
        timestamp: new Date().toISOString(),
        version: "0.0.1",
      };

      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(
      JSON.stringify({
        error: "Not Found",
        path: url.pathname,
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },
};
