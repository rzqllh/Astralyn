import {
  ASTRALYN_SERVICE_NAME,
  type HealthCheckResponse,
  CANONICAL_CHARACTERS,
  generateTeamRecommendations,
  type RecommendationMode,
  type CombatElement,
} from "@astralyn/shared";
import { checkDatabaseHealth } from "./db/health";
import { createAuth, validateAuthEnv, resolveAuthContext, type AuthEnv } from "./auth";
import { UserRepository } from "./db/user-repository";

const VALID_COMBAT_ELEMENTS = new Set<CombatElement>([
  "Physical",
  "Fire",
  "Ice",
  "Lightning",
  "Wind",
  "Quantum",
  "Imaginary",
]);

export interface Env extends AuthEnv {
  DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Health check endpoint
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

    // 2. Better Auth catch-all routing (/api/auth/*)
    if (url.pathname.startsWith("/api/auth")) {
      const validation = validateAuthEnv(env);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            error: "Authentication service unavailable",
            code: "AUTH_UNCONFIGURED",
            missing: validation.missing,
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
              Pragma: "no-cache",
            },
          }
        );
      }

      try {
        const auth = createAuth(env);
        const authResponse = await auth.handler(request);

        // If Better Auth returned an internal 500 with an empty body, enforce sanitized JSON
        if (authResponse.status >= 500 && (!authResponse.body || authResponse.headers.get("content-length") === "0")) {
          return new Response(
            JSON.stringify({
              error: "Authentication request failed",
              code: "AUTH_HANDLER_ERROR",
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
                Pragma: "no-cache",
              },
            }
          );
        }

        // Preserve all response properties, status, headers, and set-cookies while enforcing no-store
        const headers = new Headers(authResponse.headers);
        headers.set("Cache-Control", "no-store");
        headers.set("Pragma", "no-cache");

        return new Response(authResponse.body, {
          status: authResponse.status,
          statusText: authResponse.statusText,
          headers,
        });
      } catch (err: unknown) {
        const errName = err instanceof Error ? err.name : "UnknownError";
        const rawMsg = err instanceof Error ? err.message : String(err);
        const sanitizedMsg = rawMsg.replace(
          /([?&](code|token|state|secret|access_token|id_token)=)[^&]*/gi,
          "$1[REDACTED]"
        );
        console.error(`[AUTH_HANDLER_ERROR] [${errName}] ${sanitizedMsg}`);

        return new Response(
          JSON.stringify({
            error: "Authentication request failed",
            code: "AUTH_HANDLER_ERROR",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
              Pragma: "no-cache",
            },
          }
        );
      }
    }

    // 3. User Profile & Onboarding (/api/me, /api/onboarding/complete)
    if (url.pathname === "/api/me" || url.pathname === "/api/me/") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
      }
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse({ error: "Database unavailable", code: "DB_UNAVAILABLE" }, 503);
      }
      const userRepo = new UserRepository(env.DB);
      const profile = await userRepo.getOrCreateProfile(auth.userId, auth.user.name);
      return jsonResponse({
        user: auth.user,
        profile,
        needsOnboarding: profile.onboardingCompletedAt === null,
      });
    }

    if (url.pathname === "/api/onboarding/complete" || url.pathname === "/api/onboarding/complete/") {
      if (request.method !== "PUT") {
        return jsonResponse({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
      }
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse({ error: "Database unavailable", code: "DB_UNAVAILABLE" }, 503);
      }
      let rawBody: Record<string, unknown>;
      try {
        rawBody = (await request.json()) as Record<string, unknown>;
      } catch {
        return jsonResponse({ error: "Invalid JSON payload", code: "INVALID_BODY" }, 400);
      }
      const rosterList = rawBody && Array.isArray(rawBody.roster) ? (rawBody.roster as Array<Record<string, unknown>>) : null;
      if (!rosterList || rosterList.length === 0) {
        return jsonResponse(
          {
            error: "At least one character is required to complete onboarding",
            code: "ROSTER_EMPTY",
          },
          400
        );
      }
      for (const item of rosterList) {
        if (!item || typeof item.characterId !== "string" || !item.characterId.trim()) {
          return jsonResponse(
            { error: "Invalid character in roster", code: "INVALID_CHARACTER" },
            400
          );
        }
      }
      const userRepo = new UserRepository(env.DB);
      const result = await userRepo.completeOnboarding(
        auth.userId,
        rosterList.map((r) => ({
          characterId: String(r.characterId),
          level: typeof r.level === "number" ? r.level : undefined,
          eidolon: typeof r.eidolon === "number" ? r.eidolon : undefined,
        }))
      );
      return jsonResponse({ success: true, ...result });
    }

    // 4. Roster Management APIs (/api/roster, /api/roster/:id)
    if (url.pathname === "/api/roster" || url.pathname === "/api/roster/") {
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse({ error: "Database unavailable", code: "DB_UNAVAILABLE" }, 503);
      }
      const userRepo = new UserRepository(env.DB);

      if (request.method === "GET") {
        const roster = await userRepo.getRoster(auth.userId);
        return jsonResponse({ roster });
      }

      if (request.method === "PUT") {
        let rawBody: Record<string, unknown>;
        try {
          rawBody = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonResponse({ error: "Invalid JSON payload", code: "INVALID_BODY" }, 400);
        }
        if (!rawBody || typeof rawBody.characterId !== "string" || !rawBody.characterId.trim()) {
          return jsonResponse({ error: "Missing characterId", code: "INVALID_CHARACTER" }, 400);
        }
        const item = await userRepo.upsertRosterCharacter(auth.userId, {
          characterId: rawBody.characterId,
          level: typeof rawBody.level === "number" ? rawBody.level : undefined,
          eidolon: typeof rawBody.eidolon === "number" ? rawBody.eidolon : undefined,
          isOwned: typeof rawBody.isOwned === "boolean" ? rawBody.isOwned : undefined,
        });
        return jsonResponse({ success: true, item });
      }

      return jsonResponse({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
    }

    if (url.pathname.startsWith("/api/roster/")) {
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse({ error: "Database unavailable", code: "DB_UNAVAILABLE" }, 503);
      }
      const characterId = decodeURIComponent(url.pathname.substring("/api/roster/".length)).trim();
      if (!characterId) {
        return jsonResponse({ error: "Missing characterId", code: "INVALID_CHARACTER" }, 400);
      }
      const userRepo = new UserRepository(env.DB);

      if (request.method === "DELETE") {
        await userRepo.deleteRosterCharacter(auth.userId, characterId);
        return jsonResponse({ success: true, deleted: characterId });
      }

      return jsonResponse({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
    }

    // 5. Team Recommendation API (/api/recommendations/teams)
    if (
      url.pathname === "/api/recommendations/teams" ||
      url.pathname === "/api/recommendations/teams/"
    ) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
      }

      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse({ error: "Database unavailable", code: "DB_UNAVAILABLE" }, 503);
      }

      let rawBody: Record<string, unknown> = {};
      try {
        rawBody = (await request.json()) as Record<string, unknown>;
      } catch {
        return jsonResponse({ error: "Invalid JSON payload", code: "INVALID_BODY" }, 400);
      }

      // Validate focusCharacterId canonical existence if provided
      if (rawBody.focusCharacterId !== undefined) {
        if (typeof rawBody.focusCharacterId !== "string" || !rawBody.focusCharacterId.trim()) {
          return jsonResponse({ error: "Invalid focusCharacterId", code: "UNKNOWN_CHARACTER_ID" }, 400);
        }
        const isKnown = CANONICAL_CHARACTERS.some((c) => c.id === rawBody.focusCharacterId);
        if (!isKnown) {
          return jsonResponse(
            {
              error: `Character ID '${rawBody.focusCharacterId}' is not recognized in canonical knowledge`,
              code: "UNKNOWN_CHARACTER_ID",
            },
            400
          );
        }
      }

      // Validate targetWeaknesses if provided
      if (rawBody.targetWeaknesses !== undefined) {
        if (!Array.isArray(rawBody.targetWeaknesses)) {
          return jsonResponse(
            { error: "targetWeaknesses must be an array", code: "INVALID_TARGET_WEAKNESS" },
            400
          );
        }
        for (const elem of rawBody.targetWeaknesses) {
          if (typeof elem !== "string" || !VALID_COMBAT_ELEMENTS.has(elem as CombatElement)) {
            return jsonResponse(
              {
                error: `Invalid combat element in targetWeaknesses: '${String(elem)}'`,
                code: "INVALID_TARGET_WEAKNESS",
              },
              400
            );
          }
        }
      }

      // Validate limit if provided
      if (rawBody.limit !== undefined) {
        if (
          typeof rawBody.limit !== "number" ||
          !Number.isInteger(rawBody.limit) ||
          rawBody.limit < 1 ||
          rawBody.limit > 10
        ) {
          return jsonResponse(
            { error: "Limit must be an integer between 1 and 10", code: "INVALID_LIMIT" },
            400
          );
        }
      }

      // Fetch user's live roster from local D1
      const userRepo = new UserRepository(env.DB);
      const userRoster = await userRepo.getRoster(auth.userId);

      // Validate focus character ownership
      if (rawBody.focusCharacterId !== undefined) {
        const isOwned = userRoster.some(
          (r) => r.characterId === rawBody.focusCharacterId && r.isOwned
        );
        if (!isOwned) {
          return jsonResponse(
            {
              error: `Focus character '${rawBody.focusCharacterId}' is not present in owned roster`,
              code: "FOCUS_CHARACTER_NOT_OWNED",
            },
            400
          );
        }
      }

      // Execute deterministic recommendation engine
      const recommendationResult = generateTeamRecommendations({
        roster: userRoster.map((r) => ({
          characterId: r.characterId,
          level: r.level,
          eidolon: r.eidolon,
          isOwned: r.isOwned,
        })),
        knowledgeCharacters: CANONICAL_CHARACTERS,
        context: {
          mode: typeof rawBody.mode === "string" ? (rawBody.mode as RecommendationMode) : undefined,
          focusCharacterId:
            typeof rawBody.focusCharacterId === "string" ? rawBody.focusCharacterId : undefined,
          targetWeaknesses: Array.isArray(rawBody.targetWeaknesses)
            ? (rawBody.targetWeaknesses as CombatElement[])
            : undefined,
          limit: typeof rawBody.limit === "number" ? rawBody.limit : undefined,
        },
      });

      return jsonResponse(recommendationResult, 200);
    }

    // 6. Fallback 404
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

function jsonResponse(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      ...headers,
    },
  });
}
