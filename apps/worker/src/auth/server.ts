import { betterAuth } from "better-auth";
import { AUTH_SCHEMA_OPTIONS } from "./schema-options";

export interface AuthEnv {
  DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  [key: string]: unknown;
}

export type AuthInstance = ReturnType<typeof createAuth>;

export interface AuthEnvValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateAuthEnv(env: AuthEnv): AuthEnvValidationResult {
  const missing: string[] = [];

  if (!env.DB) missing.push("DB");
  if (!env.BETTER_AUTH_SECRET) missing.push("BETTER_AUTH_SECRET");
  if (!env.BETTER_AUTH_URL) missing.push("BETTER_AUTH_URL");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function createAuth(env: AuthEnv) {
  const validation = validateAuthEnv(env);
  if (!validation.valid) {
    throw new Error(
      `Auth environment configuration invalid. Missing required bindings: ${validation.missing.join(", ")}`
    );
  }

  const baseURL = env.BETTER_AUTH_URL!;
  const isHttps = baseURL.startsWith("https://");
  const trustedOrigins = [baseURL];
  if (!isHttps && (baseURL.includes("localhost") || baseURL.includes("127.0.0.1"))) {
    trustedOrigins.push(
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:8787",
      "http://127.0.0.1:8787"
    );
  }

  return betterAuth({
    ...AUTH_SCHEMA_OPTIONS,
    database: env.DB!,
    secret: env.BETTER_AUTH_SECRET!,
    baseURL,
    basePath: "/api/auth",
    trustedOrigins,
    session: {
      ...AUTH_SCHEMA_OPTIONS.session,
      expiresIn: 60 * 60 * 24 * 7, // 7 days (604800s)
      updateAge: 60 * 60 * 24, // 1 day (86400s)
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      useSecureCookies: isHttps,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        redirectURI: `${baseURL}/api/auth/callback/google`,
      },
    },
    onAPIError: {
      throw: true,
    },
  });
}
