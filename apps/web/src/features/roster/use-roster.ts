import * as React from "react";
import { useAuth } from "../auth";
import type { RosterCharacter } from "./types";
import { clearRecommendationCache } from "../recommendations/use-team-recommendations";

export function useRoster() {
  const { status } = useAuth();
  const [roster, setRoster] = React.useState<RosterCharacter[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchRoster = React.useCallback(async () => {
    if (status !== "authenticated") {
      setRoster([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/roster", {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch roster: HTTP ${res.status}`);
      }

      const data = (await res.json()) as { roster: RosterCharacter[] };
      setRoster(data.roster || []);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const upsertCharacter = React.useCallback(
    async (entry: { characterId: string; level?: number; eidolon?: number; isOwned?: boolean }) => {
      try {
        const res = await fetch("/api/roster", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(entry),
        });

        if (!res.ok) {
          throw new Error(`Failed to update roster: HTTP ${res.status}`);
        }

        const data = (await res.json()) as { success: boolean; item: RosterCharacter };
        if (data.item) {
          setRoster((prev) => {
            const index = prev.findIndex((c) => c.characterId === entry.characterId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data.item;
              return updated;
            }
            return [...prev, data.item];
          });
          clearRecommendationCache();
        }
        return data.item;
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    []
  );

  const removeCharacter = React.useCallback(async (characterId: string) => {
    try {
      const res = await fetch(`/api/roster/${encodeURIComponent(characterId)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to remove character: HTTP ${res.status}`);
      }

      setRoster((prev) => prev.filter((c) => c.characterId !== characterId));
      clearRecommendationCache();
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    }
  }, []);

  const isOwned = React.useCallback(
    (characterId: string) => {
      return roster.some((c) => c.characterId === characterId && c.isOwned);
    },
    [roster]
  );

  const getEntry = React.useCallback(
    (characterId: string) => {
      return roster.find((c) => c.characterId === characterId) || null;
    },
    [roster]
  );

  return {
    roster,
    loading,
    error,
    refreshRoster: fetchRoster,
    upsertCharacter,
    removeCharacter,
    isOwned,
    getEntry,
  };
}
