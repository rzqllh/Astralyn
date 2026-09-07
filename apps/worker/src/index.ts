import {
  ASTRALYN_SERVICE_NAME,
  type HealthCheckResponse,
  CANONICAL_CHARACTERS,
  generateTeamRecommendations,
  type RecommendationMode,
  type RecommendationScope,
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

const VALID_RECOMMENDATION_SCOPES = new Set<RecommendationScope>([
  "all_characters",
  "owned_only",
]);

export interface Env extends AuthEnv {
  DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  INTERNAL_BUILDER_SECRET?: string;
}

function validateTeamMembers(
  members: unknown
):
  | { valid: true; members: Array<{ slot: number; characterId: string }> }
  | { valid: false; error: string; code: string } {
  if (!Array.isArray(members) || members.length !== 4) {
    return {
      valid: false,
      error: "Saved team must contain exactly 4 members",
      code: "INVALID_MEMBERS_COUNT",
    };
  }

  const slotsSeen = new Set<number>();
  const charsSeen = new Set<string>();
  const parsedMembers: Array<{ slot: number; characterId: string }> = [];

  for (const item of members) {
    if (!item || typeof item !== "object") {
      return { valid: false, error: "Invalid member object", code: "INVALID_MEMBER" };
    }
    const slot = (item as Record<string, unknown>).slot;
    const characterId = (item as Record<string, unknown>).characterId;
    if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 1 || slot > 4) {
      return {
        valid: false,
        error: "Slot must be an integer between 1 and 4",
        code: "INVALID_SLOT",
      };
    }
    if (typeof characterId !== "string" || !characterId.trim()) {
      return {
        valid: false,
        error: "Missing or invalid characterId",
        code: "INVALID_CHARACTER",
      };
    }
    const cleanCharId = characterId.trim();
    if (!CANONICAL_CHARACTERS.some((c) => c.id === cleanCharId)) {
      return {
        valid: false,
        error: `Character ID '${cleanCharId}' is not recognized in canonical knowledge`,
        code: "UNKNOWN_CHARACTER_ID",
      };
    }
    if (slotsSeen.has(slot)) {
      return {
        valid: false,
        error: `Duplicate slot '${slot}' in team members`,
        code: "DUPLICATE_SLOT",
      };
    }
    if (charsSeen.has(cleanCharId)) {
      return {
        valid: false,
        error: `Duplicate character '${cleanCharId}' in team members`,
        code: "DUPLICATE_MEMBERS",
      };
    }
    slotsSeen.add(slot);
    charsSeen.add(cleanCharId);
    parsedMembers.push({ slot, characterId: cleanCharId });
  }

  for (let s = 1; s <= 4; s++) {
    if (!slotsSeen.has(s)) {
      return { valid: false, error: `Missing required slot ${s}`, code: "MISSING_SLOT" };
    }
  }

  return { valid: true, members: parsedMembers.sort((a, b) => a.slot - b.slot) };
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
        if (
          authResponse.status >= 500 &&
          (!authResponse.body || authResponse.headers.get("content-length") === "0")
        ) {
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
        return jsonResponse(
          { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
          405
        );
      }
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse(
          { error: "Database unavailable", code: "DB_UNAVAILABLE" },
          503
        );
      }
      const userRepo = new UserRepository(env.DB);
      const profile = await userRepo.getOrCreateProfile(auth.userId, auth.user.name);
      return jsonResponse({
        user: auth.user,
        profile,
        needsOnboarding: profile.onboardingCompletedAt === null,
      });
    }

    if (
      url.pathname === "/api/onboarding/complete" ||
      url.pathname === "/api/onboarding/complete/"
    ) {
      if (request.method !== "PUT") {
        return jsonResponse(
          { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
          405
        );
      }
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse(
          { error: "Database unavailable", code: "DB_UNAVAILABLE" },
          503
        );
      }
      let rawBody: Record<string, unknown>;
      try {
        rawBody = (await request.json()) as Record<string, unknown>;
      } catch {
        return jsonResponse({ error: "Invalid JSON payload", code: "INVALID_BODY" }, 400);
      }
      const rosterList =
        rawBody && Array.isArray(rawBody.roster)
          ? (rawBody.roster as Array<Record<string, unknown>>)
          : null;
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
        return jsonResponse(
          { error: "Database unavailable", code: "DB_UNAVAILABLE" },
          503
        );
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
          return jsonResponse(
            { error: "Invalid JSON payload", code: "INVALID_BODY" },
            400
          );
        }
        if (
          !rawBody ||
          typeof rawBody.characterId !== "string" ||
          !rawBody.characterId.trim()
        ) {
          return jsonResponse(
            { error: "Missing characterId", code: "INVALID_CHARACTER" },
            400
          );
        }
        const item = await userRepo.upsertRosterCharacter(auth.userId, {
          characterId: rawBody.characterId,
          level: typeof rawBody.level === "number" ? rawBody.level : undefined,
          eidolon: typeof rawBody.eidolon === "number" ? rawBody.eidolon : undefined,
          isOwned: typeof rawBody.isOwned === "boolean" ? rawBody.isOwned : undefined,
        });
        return jsonResponse({ success: true, item });
      }

      return jsonResponse(
        { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
        405
      );
    }

    if (url.pathname.startsWith("/api/roster/")) {
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse(
          { error: "Database unavailable", code: "DB_UNAVAILABLE" },
          503
        );
      }
      const characterId = decodeURIComponent(
        url.pathname.substring("/api/roster/".length)
      ).trim();
      if (!characterId) {
        return jsonResponse(
          { error: "Missing characterId", code: "INVALID_CHARACTER" },
          400
        );
      }
      const userRepo = new UserRepository(env.DB);

      if (request.method === "DELETE") {
        await userRepo.deleteRosterCharacter(auth.userId, characterId);
        return jsonResponse({ success: true, deleted: characterId });
      }

      return jsonResponse(
        { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
        405
      );
    }

    // 5. Saved Teams APIs (/api/saved-teams, /api/saved-teams/:id)
    if (url.pathname === "/api/saved-teams" || url.pathname === "/api/saved-teams/") {
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse(
          { error: "Database unavailable", code: "DB_UNAVAILABLE" },
          503
        );
      }
      const userRepo = new UserRepository(env.DB);

      if (request.method === "GET") {
        const teams = await userRepo.getSavedTeams(auth.userId);
        return jsonResponse({ teams });
      }

      if (request.method === "POST") {
        let rawBody: Record<string, unknown>;
        try {
          rawBody = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonResponse(
            { error: "Invalid JSON payload", code: "INVALID_BODY" },
            400
          );
        }

        if (
          !rawBody ||
          typeof rawBody.name !== "string" ||
          !rawBody.name.trim() ||
          rawBody.name.trim().length > 50
        ) {
          return jsonResponse(
            {
              error: "Team name must be between 1 and 50 characters",
              code: "INVALID_NAME",
            },
            400
          );
        }

        const memberValidation = validateTeamMembers(rawBody.members);
        if (!memberValidation.valid) {
          return jsonResponse(
            { error: memberValidation.error, code: memberValidation.code },
            400
          );
        }

        const team = await userRepo.createSavedTeam(auth.userId, {
          name: rawBody.name.trim(),
          mode: typeof rawBody.mode === "string" ? rawBody.mode.trim() : undefined,
          members: memberValidation.members,
        });

        return jsonResponse({ success: true, team }, 201);
      }

      return jsonResponse(
        { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
        405
      );
    }

    if (url.pathname.startsWith("/api/saved-teams/")) {
      const auth = await resolveAuthContext(request, env);
      if (auth.status !== "authenticated") {
        return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
      }
      if (!env.DB) {
        return jsonResponse(
          { error: "Database unavailable", code: "DB_UNAVAILABLE" },
          503
        );
      }
      const teamId = decodeURIComponent(
        url.pathname.substring("/api/saved-teams/".length)
      ).trim();
      if (!teamId) {
        return jsonResponse({ error: "Missing teamId", code: "INVALID_TEAM_ID" }, 400);
      }
      const userRepo = new UserRepository(env.DB);

      if (request.method === "GET") {
        const team = await userRepo.getSavedTeamById(auth.userId, teamId);
        if (!team) {
          return jsonResponse({ error: "Saved team not found", code: "NOT_FOUND" }, 404);
        }
        return jsonResponse({ team });
      }

      if (request.method === "PUT") {
        let rawBody: Record<string, unknown>;
        try {
          rawBody = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonResponse(
            { error: "Invalid JSON payload", code: "INVALID_BODY" },
            400
          );
        }

        if (rawBody.name !== undefined) {
          if (
            typeof rawBody.name !== "string" ||
            !rawBody.name.trim() ||
            rawBody.name.trim().length > 50
          ) {
            return jsonResponse(
              {
                error: "Team name must be between 1 and 50 characters",
                code: "INVALID_NAME",
              },
              400
            );
          }
        }

        let validatedMembers: Array<{ slot: number; characterId: string }> | undefined =
          undefined;
        if (rawBody.members !== undefined) {
          const memberValidation = validateTeamMembers(rawBody.members);
          if (!memberValidation.valid) {
            return jsonResponse(
              { error: memberValidation.error, code: memberValidation.code },
              400
            );
          }
          validatedMembers = memberValidation.members;
        }

        const updated = await userRepo.updateSavedTeam(auth.userId, teamId, {
          name: typeof rawBody.name === "string" ? rawBody.name.trim() : undefined,
          mode: typeof rawBody.mode === "string" ? rawBody.mode.trim() : undefined,
          members: validatedMembers,
        });

        if (!updated) {
          return jsonResponse({ error: "Saved team not found", code: "NOT_FOUND" }, 404);
        }

        return jsonResponse({ success: true, team: updated });
      }

      if (request.method === "DELETE") {
        const deleted = await userRepo.deleteSavedTeam(auth.userId, teamId);
        if (!deleted) {
          return jsonResponse({ error: "Saved team not found", code: "NOT_FOUND" }, 404);
        }
        return jsonResponse({ success: true, deleted: teamId });
      }

      return jsonResponse(
        { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
        405
      );
    }

    // 5. Team Recommendation API (/api/recommendations/teams)
    if (
      url.pathname === "/api/recommendations/teams" ||
      url.pathname === "/api/recommendations/teams/"
    ) {
      if (request.method !== "POST") {
        return jsonResponse(
          { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
          405
        );
      }

      const auth = await resolveAuthContext(request, env);

      let rawBody: Record<string, unknown>;
      try {
        const parsedBody: unknown = await request.json();
        if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
          return jsonResponse({ error: "Invalid JSON payload", code: "INVALID_BODY" }, 400);
        }
        rawBody = parsedBody as Record<string, unknown>;
      } catch {
        return jsonResponse({ error: "Invalid JSON payload", code: "INVALID_BODY" }, 400);
      }

      if (
        typeof rawBody.scope !== "string" ||
        !VALID_RECOMMENDATION_SCOPES.has(rawBody.scope as RecommendationScope)
      ) {
        return jsonResponse(
          {
            error: "scope must be either 'all_characters' or 'owned_only'",
            code: "INVALID_SCOPE",
          },
          400
        );
      }
      const scope = rawBody.scope as RecommendationScope;

      if (scope === "owned_only" && auth.status !== "authenticated") {
        return jsonResponse(
          { error: "Sign in to use your owned roster", code: "UNAUTHORIZED" },
          401
        );
      }
      if (scope === "owned_only" && !env.DB) {
        return jsonResponse(
          { error: "Database unavailable", code: "DB_UNAVAILABLE" },
          503
        );
      }

      // Validate focusCharacterId canonical existence if provided
      if (rawBody.focusCharacterId !== undefined) {
        if (
          typeof rawBody.focusCharacterId !== "string" ||
          !rawBody.focusCharacterId.trim()
        ) {
          return jsonResponse(
            { error: "Invalid focusCharacterId", code: "UNKNOWN_CHARACTER_ID" },
            400
          );
        }
        const isKnown = CANONICAL_CHARACTERS.some(
          (c) => c.id === rawBody.focusCharacterId
        );
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
            {
              error: "targetWeaknesses must be an array",
              code: "INVALID_TARGET_WEAKNESS",
            },
            400
          );
        }
        for (const elem of rawBody.targetWeaknesses) {
          if (
            typeof elem !== "string" ||
            !VALID_COMBAT_ELEMENTS.has(elem as CombatElement)
          ) {
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

      let userRoster: Array<{
        characterId: string;
        level: number;
        eidolon: number;
        isOwned: boolean;
      }> = [];

      if (auth.status === "authenticated" && env.DB) {
        const userRepo = new UserRepository(env.DB);
        userRoster = await userRepo.getRoster(auth.userId);
      }

      // Validate focus character ownership
      if (scope === "owned_only" && rawBody.focusCharacterId !== undefined) {
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
          scope,
          mode:
            typeof rawBody.mode === "string"
              ? (rawBody.mode as RecommendationMode)
              : undefined,
          focusCharacterId:
            typeof rawBody.focusCharacterId === "string"
              ? rawBody.focusCharacterId
              : undefined,
          targetWeaknesses: Array.isArray(rawBody.targetWeaknesses)
            ? (rawBody.targetWeaknesses as CombatElement[])
            : undefined,
          limit: typeof rawBody.limit === "number" ? rawBody.limit : undefined,
        },
      });

      return jsonResponse(recommendationResult, 200);
    }

    // 6. Internal Export API for CLI
    if (url.pathname === "/api/_internal/export-release") {
      if (!env.INTERNAL_BUILDER_SECRET) {
        return jsonResponse(
          { error: "Internal export is disabled (missing secret)" },
          503
        );
      }

      const auth = request.headers.get("Authorization");
      if (!auth || auth !== `Bearer ${env.INTERNAL_BUILDER_SECRET}`) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      if (!env.DB) {
        return jsonResponse({ error: "Database unavailable" }, 503);
      }

      // In a full implementation, we'd query the actual latest published release.
      // For this architecture proof, we return a mock payload that matches the schema requirements.
      // But we MUST enforce the "only published releases may be exported" policy conceptually.

      const payload = {
        version: "4.5",
        status: "published",
        data: {
          characters: [],
          recommendations: [],
        },
      };

      return jsonResponse(payload);
    }

    // 7. Fallback 404
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

  async scheduled(_event: unknown, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log("[Worker] Scheduled ingestion started");

    if (!env.DB) {
      console.error("[Worker] Database binding unavailable during scheduled ingestion");
      return;
    }

    // Dynamic import to avoid loading ingestion code in normal request path if possible
    const { IngestionOrchestrator } = await import("./ingestion/orchestrator");
    const { ReleaseManager } = await import("./ingestion/release-manager");
    const { ConsensusEngine } = await import("./ingestion/consensus");
    const { drizzle } = await import("drizzle-orm/d1");

    // Required behavior:
    // - mocks are test-only
    // - production cron uses explicitly configured real adapters
    // - since real adapters do not exist yet, production scheduled ingestion must safely NO-OP
    // - no mock source, dummy recommendation, fixture character, or fake fact may be persisted into D1 by default
    const adapters: unknown[] = [];

    if (adapters.length === 0) {
      console.log(
        "[Worker] No production adapters configured. Scheduled ingestion safely NO-OPing."
      );
      return;
    }

    const db = drizzle(env.DB);
    const releaseManager = new ReleaseManager(db);
    // @ts-expect-error Safe assumption for now since it's NO-OP anyway
    const orchestrator = new IngestionOrchestrator(db, adapters);
    const consensusEngine = new ConsensusEngine(db);

    try {
      const gameVersionId = await releaseManager.getGameVersionId("4.5");
      const releaseId = await releaseManager.createDraftRelease(gameVersionId);

      const allSets = await orchestrator.runIngestion(gameVersionId, releaseId);

      await releaseManager.markAsConsensusReady(releaseId, "snapshot-hash-placeholder");

      await consensusEngine.computeAndStoreConsensus(releaseId, allSets);

      await releaseManager.publishRelease(releaseId, "v1.0.1-ingested");

      console.log("[Worker] Scheduled ingestion completed successfully");
    } catch (err) {
      console.error("[Worker] Scheduled ingestion failed:", err);
    }
  },
};

function jsonResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>
): Response {
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
