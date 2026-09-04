// apps/web/src/routes/saved-teams-view.tsx
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../features/auth";
import { useSavedTeams, type SavedTeam } from "../features/teams";
import { useCharacters } from "../lib/knowledge/use-knowledge";
import { useRoster } from "../features/roster";
import { CharacterAvatar, ElementIcon, PathIcon } from "../components/ui/game-asset";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Swords,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  AlertCircle,
  LogIn,
  RefreshCw,
  Clock,
} from "lucide-react";

export function SavedTeamsView() {
  const { status: authStatus, signIn } = useAuth();
  const { teams, loading, error, createTeam, updateTeam, deleteTeam, refresh } =
    useSavedTeams();
  const { characters } = useCharacters();
  const { roster } = useRoster();

  // Create / Edit modal state
  const [modalMode, setModalMode] = React.useState<"create" | "edit" | null>(null);
  const [editingTeam, setEditingTeam] = React.useState<SavedTeam | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formMode, setFormMode] = React.useState("general");
  const [formSlots, setFormSlots] = React.useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Delete modal state
  const [teamToDelete, setTeamToDelete] = React.useState<SavedTeam | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Map of canonical characters for quick lookup
  const charMap = React.useMemo(() => {
    const map = new Map<string, (typeof characters)[number]>();
    for (const c of characters) {
      map.set(c.id, c);
    }
    return map;
  }, [characters]);

  // Owned character IDs
  const ownedSet = React.useMemo(() => {
    return new Set(roster.filter((r) => r.isOwned !== false).map((r) => r.characterId));
  }, [roster]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingTeam(null);
    setFormName("");
    setFormMode("general");
    // Pre-populate with first 4 available characters or empty
    const available = characters.map((c) => c.id);
    setFormSlots([
      available[0] || "",
      available[1] || "",
      available[2] || "",
      available[3] || "",
    ]);
    setFormError(null);
  };

  const openEditModal = (team: SavedTeam) => {
    setModalMode("edit");
    setEditingTeam(team);
    setFormName(team.name);
    setFormMode(team.mode || "general");

    const sortedMembers = [...team.members].sort((a, b) => a.slot - b.slot);
    setFormSlots([
      sortedMembers[0]?.characterId || "",
      sortedMembers[1]?.characterId || "",
      sortedMembers[2]?.characterId || "",
      sortedMembers[3]?.characterId || "",
    ]);
    setFormError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTeam(null);
    setFormError(null);
    setSubmitting(false);
  };

  const handleSlotChange = (slotIndex: 0 | 1 | 2 | 3, charId: string) => {
    setFormSlots((prev) => {
      const next = [...prev] as [string, string, string, string];
      next[slotIndex] = charId;
      return next;
    });
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 50) {
      setFormError("Team name must be between 1 and 50 characters.");
      return;
    }

    // Verify exactly 4 selected slots
    if (formSlots.some((id) => !id)) {
      setFormError("All 4 character slots must be filled.");
      return;
    }

    // Verify 4 unique characters
    const uniqueIds = new Set(formSlots);
    if (uniqueIds.size !== 4) {
      setFormError("All 4 characters in the team must be unique.");
      return;
    }

    const members = formSlots.map((charId, idx) => ({
      slot: idx + 1,
      characterId: charId,
    }));

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        await createTeam(trimmedName, members, formMode);
      } else if (modalMode === "edit" && editingTeam) {
        await updateTeam(editingTeam.id, {
          name: trimmedName,
          mode: formMode,
          members,
        });
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save team";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    setDeleting(true);
    try {
      await deleteTeam(teamToDelete.id);
      setTeamToDelete(null);
    } catch {
      // Error handled by hook
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl" data-testid="saved-teams-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1a2338] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
              User Vault
            </span>
            <span className="text-[10px] font-mono text-[#9ba5be]">• Cloudflare D1 Persisted</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa] mt-1 flex items-center gap-2">
            <Swords className="h-6 w-6 text-[#dfb86c]" />
            Saved Teams
          </h1>
          <p className="text-xs text-[#9ba5be] mt-1">
            Curated 4-member squad configurations persisted to your personal account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/recommendations">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#dfb86c]" />
              Find Best Teams
            </Button>
          </Link>
          {authStatus === "authenticated" && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="gap-1.5"
              data-testid="create-team-button"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Unauthenticated State */}
      {authStatus !== "authenticated" && (
        <div className="p-6 rounded-xs border border-[#25324e] bg-[#0c101a] text-center space-y-3">
          <LogIn className="h-8 w-8 text-[#dfb86c] mx-auto opacity-80" />
          <h2 className="text-sm font-bold text-[#f0f3fa]">Authentication Required</h2>
          <p className="text-xs text-[#9ba5be] max-w-md mx-auto">
            Saved teams are stored securely in your private cloud vault. Sign in to create, edit, and access your custom team compositions.
          </p>
          <Button variant="primary" size="sm" onClick={() => signIn()}>
            Sign In with Google
          </Button>
        </div>
      )}

      {/* Authenticated Flow */}
      {authStatus === "authenticated" && (
        <>
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xs border border-[#f87171]/40 bg-[#f87171]/10 text-xs text-[#f87171] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error.message}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={refresh} className="gap-1 text-[#f87171]">
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && teams.length === 0 && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-xs border border-[#1f2940] bg-[#0d121f] animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && teams.length === 0 && (
            <div className="p-10 rounded-xs border border-dashed border-[#1f2940] bg-[#0c101c]/50 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#151c2e] flex items-center justify-center mx-auto text-[#9ba5be]">
                <Swords className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#f0f3fa]">No Saved Teams</h3>
                <p className="text-xs text-[#9ba5be] max-w-sm mx-auto">
                  You haven&apos;t saved any team compositions yet. Create a custom 4-member squad or save recommendations from the engine.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Create Team
                </Button>
                <Link to="/recommendations">
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#dfb86c]" />
                    Explore Recommendations
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Saved Teams List */}
          {!loading && teams.length > 0 && (
            <div className="space-y-4" data-testid="saved-teams-list">
              {teams.map((team) => {
                const sortedMembers = [...team.members].sort((a, b) => a.slot - b.slot);
                return (
                  <div
                    key={team.id}
                    className="rounded-xs border border-[#1f2940] bg-[#0d121f] p-5 space-y-4 transition-colors hover:border-[#25324e]"
                    data-testid={`saved-team-card-${team.id}`}
                  >
                    {/* Team Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#172033] pb-3">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-bold text-[#f0f3fa]">{team.name}</h2>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#1f2940] text-[#9ba5be] border border-[#25324e] uppercase">
                          {team.mode || "general"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#9ba5be] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(team.updatedAt || team.createdAt).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(team)}
                          className="h-7 px-2 text-xs text-[#9ba5be] hover:text-[#f0f3fa]"
                          data-testid={`edit-team-${team.id}`}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTeamToDelete(team)}
                          className="h-7 px-2 text-xs text-[#f87171] hover:text-[#f87171] hover:bg-[#f87171]/10"
                          data-testid={`delete-team-${team.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Team Slots Grid (Strictly 4 members) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {sortedMembers.map((member) => {
                        const char = charMap.get(member.characterId);
                        const isOwned = ownedSet.has(member.characterId);

                        return (
                          <div
                            key={member.slot}
                            className="p-3 rounded-xs border border-[#172033] bg-[#0a0e1a] flex items-center gap-3 relative"
                          >
                            <span className="absolute top-1.5 right-2 text-[10px] font-mono text-[#9ba5be]">
                              Slot {member.slot}
                            </span>
                            <div className="relative shrink-0">
                              <CharacterAvatar
                                characterId={member.characterId}
                                rarity={char?.rarity || 5}
                                size="md"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-[#f0f3fa] truncate">
                                  {char?.name || member.characterId}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {char && (
                                  <>
                                    <ElementIcon element={char.element} size={12} />
                                    <PathIcon path={char.path} size={12} />
                                    <span className="text-[10px] text-[#9ba5be] truncate">
                                      {char.path}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                {isOwned ? (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40">
                                    Owned
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#9ba5be]/10 text-[#9ba5be] border border-[#9ba5be]/30">
                                    Unowned
                                  </span>
                                )}
                                {char?.roles?.[0] && (
                                  <span className="text-[9px] font-mono text-[#9ba5be] truncate">
                                    {char.roles[0].replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Team Dialog */}
      <Dialog open={modalMode !== null} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Create Saved Team" : "Edit Saved Team"}
            </DialogTitle>
            <DialogDescription>
              A saved team must contain exactly 4 unique canonical characters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="team-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#9ba5be]"
              >
                Team Name (1–50 characters)
              </label>
              <Input
                id="team-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Acheron Nihility Hypercarry"
                maxLength={50}
                required
              />
            </div>

            {/* Mode Tag */}
            <div className="space-y-1.5">
              <label
                htmlFor="team-mode"
                className="block text-xs font-semibold uppercase tracking-wider text-[#9ba5be]"
              >
                Target Mode (Metadata)
              </label>
              <select
                id="team-mode"
                value={formMode}
                onChange={(e) => setFormMode(e.target.value)}
                className="w-full h-10 rounded-sm bg-[#0a0e1a] px-3 py-2 text-sm text-[#f0f3fa] border border-[#1f2940] focus:border-[#dfb86c] focus:outline-hidden"
              >
                <option value="general">General Combat</option>
                <option value="moc">Memory of Chaos</option>
                <option value="pure_fiction">Pure Fiction</option>
                <option value="apocalyptic_shadow">Apocalyptic Shadow</option>
              </select>
            </div>

            {/* 4 Member Slots Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9ba5be]">
                Composition Slots (Exactly 4 Unique Characters)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([0, 1, 2, 3] as const).map((idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xs border border-[#1f2940] bg-[#0a0e1a] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-[#dfb86c]">
                        Slot {idx + 1}
                      </span>
                      {formSlots[idx] && charMap.get(formSlots[idx]) && (
                        <div className="flex items-center gap-1">
                          <ElementIcon
                            element={charMap.get(formSlots[idx])!.element}
                            size={12}
                          />
                          <PathIcon
                            path={charMap.get(formSlots[idx])!.path}
                            size={12}
                          />
                        </div>
                      )}
                    </div>
                    <select
                      value={formSlots[idx]}
                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                      className="w-full h-9 rounded-xs bg-[#0f1422] px-2.5 py-1 text-xs text-[#f0f3fa] border border-[#1f2940] focus:border-[#dfb86c] focus:outline-hidden"
                      data-testid={`slot-${idx + 1}-select`}
                    >
                      <option value="">Select Character...</option>
                      {characters.map((c) => {
                        const isSelectedElsewhere = formSlots.some(
                          (id, sIdx) => sIdx !== idx && id === c.id
                        );
                        return (
                          <option
                            key={c.id}
                            value={c.id}
                            disabled={isSelectedElsewhere}
                          >
                            {c.name} ({c.path} • {c.element})
                            {isSelectedElsewhere ? " - (Selected)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Validation Error */}
            {formError && (
              <div className="p-3 rounded-xs border border-[#f87171]/40 bg-[#f87171]/10 text-xs text-[#f87171] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting}
                data-testid="submit-team-button"
              >
                {submitting ? "Saving..." : modalMode === "create" ? "Create Team" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={teamToDelete !== null} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Saved Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{teamToDelete?.name}&quot;? This action will remove the team composition from your personal vault.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTeamToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              data-testid="confirm-delete-button"
            >
              {deleting ? "Deleting..." : "Delete Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
