// apps/web/src/features/teams/use-saved-teams.ts
import * as React from "react";
import { useAuth } from "../auth";

export interface SavedTeamMember {
  slot: number;
  characterId: string;
}

export interface SavedTeam {
  id: string;
  userId: string;
  name: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
  members: SavedTeamMember[];
}

export function useSavedTeams() {
  const { status } = useAuth();
  const [teams, setTeams] = React.useState<SavedTeam[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchTeams = React.useCallback(async () => {
    if (status !== "authenticated") {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saved-teams", {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch saved teams: HTTP ${res.status}`);
      }

      const data = (await res.json()) as { teams: SavedTeam[] };
      setTeams(data.teams || []);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = React.useCallback(
    async (
      name: string,
      members: Array<{ slot: number; characterId: string }>,
      mode = "general"
    ): Promise<SavedTeam> => {
      const res = await fetch("/api/saved-teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, mode, members }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `Failed to create team: HTTP ${res.status}`);
      }

      const data = (await res.json()) as { success: boolean; team: SavedTeam };
      setTeams((prev) => [data.team, ...prev.filter((t) => t.id !== data.team.id)]);
      return data.team;
    },
    []
  );

  const updateTeam = React.useCallback(
    async (
      id: string,
      updates: {
        name?: string;
        mode?: string;
        members?: Array<{ slot: number; characterId: string }>;
      }
    ): Promise<SavedTeam> => {
      const res = await fetch(`/api/saved-teams/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `Failed to update team: HTTP ${res.status}`);
      }

      const data = (await res.json()) as { success: boolean; team: SavedTeam };
      setTeams((prev) => prev.map((t) => (t.id === id ? data.team : t)));
      return data.team;
    },
    []
  );

  const deleteTeam = React.useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/saved-teams/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `Failed to delete team: HTTP ${res.status}`);
      }

      setTeams((prev) => prev.filter((t) => t.id !== id));
    },
    []
  );

  return {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    refresh: fetchTeams,
  };
}
