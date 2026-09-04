import { betterAuth } from "better-auth";
import { AUTH_SCHEMA_OPTIONS } from "./schema-options";

/**
 * Tooling-only offline Better Auth configuration for CLI schema generation.
 *
 * Strict Rules:
 * - Offline schema generation only; never import into production runtime modules.
 * - No live database connection, env.DB, secrets, or fake credentials.
 */
export const auth = betterAuth({
  ...AUTH_SCHEMA_OPTIONS,
});

export default auth;
