import { sql } from "drizzle-orm";
import type { DatabaseHealthInfo } from "@astralyn/shared";
import { createDbClient } from "./client";

export async function checkDatabaseHealth(db?: D1Database): Promise<DatabaseHealthInfo> {
  if (!db) {
    return {
      status: "unconfigured",
    };
  }

  const start = performance.now();
  try {
    const client = createDbClient(db);
    // Execute a read-only table-independent connectivity probe
    await client.run(sql`SELECT 1 as ready`);
    const latencyMs = Number((performance.now() - start).toFixed(2));

    return {
      status: "connected",
      latencyMs,
    };
  } catch (error) {
    // Sanitize error message to prevent leaking internal database paths or secrets
    let errorMessage = "Database query failed";
    if (error instanceof Error) {
      if (error.cause instanceof Error) {
        errorMessage = error.cause.message;
      } else if (typeof error.cause === "string") {
        errorMessage = error.cause;
      } else {
        errorMessage = error.message;
      }
    }

    return {
      status: "disconnected",
      error: errorMessage,
    };
  }
}
