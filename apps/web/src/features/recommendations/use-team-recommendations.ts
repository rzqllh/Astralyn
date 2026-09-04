import * as React from "react";
import {
  compareCodeUnits,
  type RecommendationContext,
  type RecommendationEngineResult,
  type TeamEvaluation,
} from "@astralyn/shared";
import { useAuth } from "../auth";

export interface UseTeamRecommendationsResult {
  teams: TeamEvaluation[];
  loading: boolean;
  error: Error | null;
  status: "idle" | "loading" | "success" | "insufficient_roster" | "error";
  missingKnowledgeCharacterIds?: string[];
  message?: string;
  refresh: () => Promise<void>;
}

export interface UseTeamRecommendationsOptions {
  roster?: Array<{
    characterId: string;
    level?: number;
    eidolon?: number;
    isOwned?: boolean;
  }>;
  rosterLoading?: boolean;
  knowledgeVersion?: string | null;
}

// In-memory client-side cache for recommendations (prevents redundant fetches on navigation/tab switches)
const recommendationCache = new Map<string, { data: RecommendationEngineResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export function clearRecommendationCache(): void {
  recommendationCache.clear();
}

export function getRecommendationCacheSize(): number {
  return recommendationCache.size;
}

export function computeRosterSignature(
  roster?: Array<{
    characterId: string;
    level?: number;
    eidolon?: number;
    isOwned?: boolean;
  }> | null
): string {
  if (!roster || roster.length === 0) return "empty";
  const sorted = [...roster].sort((a, b) => compareCodeUnits(a.characterId, b.characterId));
  return sorted
    .map((r) => {
      const isOwned = r.isOwned !== false ? 1 : 0;
      const level = typeof r.level === "number" ? r.level : 80;
      const eidolon = typeof r.eidolon === "number" ? r.eidolon : 0;
      return `${r.characterId}:${level}:${eidolon}:${isOwned}`;
    })
    .join(";");
}

export function useTeamRecommendations(
  context: RecommendationContext = {},
  options: UseTeamRecommendationsOptions = {}
): UseTeamRecommendationsResult {
  const { status: authStatus } = useAuth();
  const [teams, setTeams] = React.useState<TeamEvaluation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [engineStatus, setEngineStatus] = React.useState<
    "idle" | "loading" | "success" | "insufficient_roster" | "error"
  >("idle");
  const [missingKnowledgeCharacterIds, setMissingKnowledgeCharacterIds] = React.useState<
    string[] | undefined
  >();
  const [message, setMessage] = React.useState<string | undefined>();

  const normalizedWeaknesses = React.useMemo(() => {
    return context.targetWeaknesses ? [...context.targetWeaknesses].sort(compareCodeUnits) : undefined;
  }, [context.targetWeaknesses ? JSON.stringify([...context.targetWeaknesses].sort(compareCodeUnits)) : undefined]);

  const rosterSig = React.useMemo(() => {
    return computeRosterSignature(options.roster);
  }, [options.roster]);

  const knowledgeVer = options.knowledgeVersion || "canonical";

  const cacheKey = React.useMemo(() => {
    return JSON.stringify({
      kv: knowledgeVer,
      rs: rosterSig,
      ctx: {
        mode: context.mode,
        focusCharacterId: context.focusCharacterId,
        targetWeaknesses: normalizedWeaknesses,
        limit: context.limit,
      },
    });
  }, [
    knowledgeVer,
    rosterSig,
    context.mode,
    context.focusCharacterId,
    normalizedWeaknesses,
    context.limit,
  ]);

  const applyEngineResult = React.useCallback((data: RecommendationEngineResult) => {
    if (data.status === "insufficient_roster") {
      setTeams([]);
      setEngineStatus("insufficient_roster");
      setMessage(data.message);
      setMissingKnowledgeCharacterIds(data.missingKnowledgeCharacterIds);
    } else {
      setTeams(data.teams || []);
      setEngineStatus("success");
      setMessage(undefined);
      setMissingKnowledgeCharacterIds(data.missingKnowledgeCharacterIds);
    }
  }, []);

  const mode = context.mode;
  const focusCharacterId = context.focusCharacterId;
  const limit = context.limit;

  const inFlightKeyRef = React.useRef<string | null>(null);

  const fetchRecommendations = React.useCallback(
    async (bypassCache = false) => {
      if (authStatus !== "authenticated") {
        setTeams([]);
        setLoading(false);
        setEngineStatus("idle");
        return;
      }

      if (options.rosterLoading) {
        setLoading(true);
        return;
      }

      if (!bypassCache) {
        const cached = recommendationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          applyEngineResult(cached.data);
          setLoading(false);
          setError(null);
          return;
        }

        if (inFlightKeyRef.current === cacheKey) {
          return;
        }
      }

      inFlightKeyRef.current = cacheKey;
      setLoading(true);
      setError(null);
      setEngineStatus("loading");

      try {
        const res = await fetch("/api/recommendations/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            mode,
            focusCharacterId,
            targetWeaknesses: normalizedWeaknesses,
            limit,
          }),
        });

        if (!res.ok) {
          let errData: { error?: string; code?: string } = {};
          try {
            errData = (await res.json()) as { error?: string; code?: string };
          } catch {
            // ignore json parse error
          }
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as RecommendationEngineResult;

        // Save to cache with deterministic composite key
        recommendationCache.set(cacheKey, { data, timestamp: Date.now() });

        applyEngineResult(data);
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setEngineStatus("error");
      } finally {
        inFlightKeyRef.current = null;
        setLoading(false);
      }
    },
    [
      authStatus,
      options.rosterLoading,
      cacheKey,
      mode,
      focusCharacterId,
      limit,
      normalizedWeaknesses,
      applyEngineResult,
    ]
  );

  React.useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    teams,
    loading,
    error,
    status: engineStatus,
    missingKnowledgeCharacterIds,
    message,
    refresh: () => fetchRecommendations(true),
  };
}
