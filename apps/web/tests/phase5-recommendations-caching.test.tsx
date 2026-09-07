import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useTeamRecommendations,
  computeRosterSignature,
  clearRecommendationCache,
  getRecommendationCacheSize,
} from "../src/features/recommendations/use-team-recommendations";
import * as authModule from "../src/features/auth";
import type { RecommendationEngineResult } from "@astralyn/shared";

function mockAuth() {
  return {
    status: "authenticated",
    user: { id: "u1", name: "Trailblazer" },
    session: null,
    profile: null,
    needsOnboarding: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
  } as unknown as ReturnType<typeof authModule.useAuth>;
}

const dummyEngineResult: RecommendationEngineResult = {
  success: true,
  scope: "owned_only",
  gameVersion: "4.5",
  knowledgeVersion: "1.0.0",
  spStatus: "unavailable",
  consensusStatus: "mechanical_only",
  status: "ok",
  evaluation: {
    candidateCount: 4,
    evaluatedTeamCount: 1,
    maxCandidateCount: 16,
    maxTeamEvaluations: 1820,
  },
  teams: [
    {
      rank: 1,
      score: 85,
      roleScore: 90,
      synergyScore: 80,
      elementScore: 0,
      signature: "acheron:aventurine:castorice:tingyun",
      archetype: "Nihility Hypercarry",
      taxonomyStatus: "complete",
      slots: [
        { slot: 1, characterId: "acheron", role: "hypercarry_dps", isOwned: true, level: 80, eidolon: 0 },
        { slot: 2, characterId: "aventurine", role: "shielder", isOwned: true, level: 80, eidolon: 0 },
        { slot: 3, characterId: "castorice", role: "summon_dps", isOwned: true, level: 80, eidolon: 0 },
        { slot: 4, characterId: "tingyun", role: "buffer", isOwned: true, level: 75, eidolon: 2 },
      ],
      reasons: [],
    },
  ],
};

describe("Phase 5: Recommendation Caching & Roster Invalidation Regression Tests", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearRecommendationCache();
    vi.spyOn(authModule, "useAuth").mockReturnValue(mockAuth());

    fetchSpy = vi.fn().mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => dummyEngineResult,
    }));
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearRecommendationCache();
  });

  describe("computeRosterSignature", () => {
    it("returns 'empty' for null, undefined, or empty arrays", () => {
      expect(computeRosterSignature(null)).toBe("empty");
      expect(computeRosterSignature(undefined)).toBe("empty");
      expect(computeRosterSignature([])).toBe("empty");
    });

    it("sorts deterministically regardless of input order", () => {
      const rosterA = [
        { characterId: "tingyun", level: 75, eidolon: 2, isOwned: true },
        { characterId: "acheron", level: 80, eidolon: 0, isOwned: true },
      ];
      const rosterB = [
        { characterId: "acheron", level: 80, eidolon: 0, isOwned: true },
        { characterId: "tingyun", level: 75, eidolon: 2, isOwned: true },
      ];

      expect(computeRosterSignature(rosterA)).toBe("acheron:80:0:1;tingyun:75:2:1");
      expect(computeRosterSignature(rosterA)).toBe(computeRosterSignature(rosterB));
    });

    it("reflects configuration changes (level, eidolon, ownership)", () => {
      const base = [{ characterId: "acheron", level: 80, eidolon: 0, isOwned: true }];
      const eidolonChanged = [{ characterId: "acheron", level: 80, eidolon: 2, isOwned: true }];
      const levelChanged = [{ characterId: "acheron", level: 70, eidolon: 0, isOwned: true }];
      const unowned = [{ characterId: "acheron", level: 80, eidolon: 0, isOwned: false }];

      expect(computeRosterSignature(base)).toBe("acheron:80:0:1");
      expect(computeRosterSignature(eidolonChanged)).toBe("acheron:80:2:1");
      expect(computeRosterSignature(levelChanged)).toBe("acheron:70:0:1");
      expect(computeRosterSignature(unowned)).toBe("acheron:80:0:0");

      expect(computeRosterSignature(base)).not.toBe(computeRosterSignature(eidolonChanged));
      expect(computeRosterSignature(base)).not.toBe(computeRosterSignature(unowned));
    });
  });

  describe("useTeamRecommendations Caching & Invalidation", () => {
    const baseRoster = [
      { characterId: "acheron", level: 80, eidolon: 0, isOwned: true },
      { characterId: "aventurine", level: 80, eidolon: 0, isOwned: true },
      { characterId: "castorice", level: 80, eidolon: 0, isOwned: true },
      { characterId: "tingyun", level: 75, eidolon: 2, isOwned: true },
    ];

    it("reuses cache on identical roster + knowledge release + context", async () => {
      const { result, rerender } = renderHook(
        ({ roster }) =>
          useTeamRecommendations(
            { mode: "general", limit: 3 },
            { roster, knowledgeVersion: "1.0.0" }
          ),
        { initialProps: { roster: baseRoster } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchSpy.mock.calls[0][1].body as string)).toMatchObject({
        scope: "owned_only",
      });
      expect(getRecommendationCacheSize()).toBe(1);

      // Rerender with identical roster and context
      rerender({ roster: [...baseRoster] });

      await waitFor(() => expect(result.current.loading).toBe(false));
      // Fetch should NOT be called again (cache hit!)
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("uses scope as part of the request and cache identity", async () => {
      const { result, rerender } = renderHook(
        ({ scope }) =>
          useTeamRecommendations(
            { scope, mode: "general", limit: 3 },
            { roster: baseRoster, knowledgeVersion: "1.0.0" }
          ),
        { initialProps: { scope: "all_characters" as "all_characters" | "owned_only" } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(JSON.parse(fetchSpy.mock.calls[0][1].body as string)).toMatchObject({
        scope: "all_characters",
      });

      rerender({ scope: "owned_only" });
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
      expect(JSON.parse(fetchSpy.mock.calls[1][1].body as string)).toMatchObject({
        scope: "owned_only",
      });
      expect(getRecommendationCacheSize()).toBe(2);
    });

    it("invalidates and recomputes immediately when adding a character to roster", async () => {
      const { result, rerender } = renderHook(
        ({ roster }) =>
          useTeamRecommendations(
            { mode: "general", limit: 3 },
            { roster, knowledgeVersion: "1.0.0" }
          ),
        { initialProps: { roster: baseRoster } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Add canonical character 'gallagher'
      const updatedRoster = [
        ...baseRoster,
        { characterId: "gallagher", level: 80, eidolon: 0, isOwned: true },
      ];

      rerender({ roster: updatedRoster });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
      expect(getRecommendationCacheSize()).toBe(2);
    });

    it("invalidates and recomputes immediately when editing character configuration or ownership", async () => {
      const { result, rerender } = renderHook(
        ({ roster }) =>
          useTeamRecommendations(
            { mode: "general", limit: 3 },
            { roster, knowledgeVersion: "1.0.0" }
          ),
        { initialProps: { roster: baseRoster } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Edit Acheron to E2
      const modifiedConfigRoster = baseRoster.map((r) =>
        r.characterId === "acheron" ? { ...r, eidolon: 2 } : r
      );

      rerender({ roster: modifiedConfigRoster });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    });

    it("invalidates and recomputes immediately when deleting a character from roster", async () => {
      const fiveCharRoster = [
        ...baseRoster,
        { characterId: "gallagher", level: 80, eidolon: 0, isOwned: true },
      ];

      const { result, rerender } = renderHook(
        ({ roster }) =>
          useTeamRecommendations(
            { mode: "general", limit: 3 },
            { roster, knowledgeVersion: "1.0.0" }
          ),
        { initialProps: { roster: fiveCharRoster } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Delete gallagher
      rerender({ roster: baseRoster });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    });

    it("invalidates and recomputes when knowledgeVersion changes", async () => {
      const { result, rerender } = renderHook(
        ({ kv }) =>
          useTeamRecommendations(
            { mode: "general", limit: 3 },
            { roster: baseRoster, knowledgeVersion: kv }
          ),
        { initialProps: { kv: "1.0.0" } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Update knowledge version release
      rerender({ kv: "1.1.0" });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    });

    it("explicitly bypasses cache when refresh() is invoked (Recalculate button)", async () => {
      const { result } = renderHook(() =>
        useTeamRecommendations(
          { mode: "general", limit: 3 },
          { roster: baseRoster, knowledgeVersion: "1.0.0" }
        )
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Explicitly recalculate
      await act(async () => {
        await result.current.refresh();
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("waits when rosterLoading is true to avoid stale initial cache key", async () => {
      const { result, rerender } = renderHook(
        ({ rosterLoading, roster }) =>
          useTeamRecommendations(
            { mode: "general", limit: 3 },
            { roster, rosterLoading, knowledgeVersion: "1.0.0" }
          ),
        { initialProps: { rosterLoading: true, roster: [] as typeof baseRoster } }
      );

      // Should not fetch while roster is loading
      expect(fetchSpy).not.toHaveBeenCalled();

      // Roster finishes loading with 4 characters
      rerender({ rosterLoading: false, roster: baseRoster });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
