import { ASTRALYN_SERVICE_NAME, type HealthCheckResponse } from "@astralyn/shared";
import { checkDatabaseHealth } from "./db/health";

export interface Env {
  DB?: D1Database;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method === "GET" &&
      (url.pathname === "/api/health" || url.pathname === "/api/health/")
    ) {
      const dbHealth = await checkDatabaseHealth(env.DB);
      const ok = dbHealth.status === "connected";

      const responseBody: HealthCheckResponse = {
        ok,
        service: ASTRALYN_SERVICE_NAME,
        timestamp: new Date().toISOString(),
        version: "0.0.1",
        database: dbHealth,
      };

      return new Response(JSON.stringify(responseBody), {
        status: ok ? 200 : 503,
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
