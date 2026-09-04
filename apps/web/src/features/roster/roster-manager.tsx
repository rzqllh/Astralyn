// apps/web/src/features/roster/roster-manager.tsx
import * as React from "react";
import { useRoster } from "./use-roster";
import { useAuth } from "../auth";
import { useCharacters } from "../../lib/knowledge/use-knowledge";
import { CharacterSelector } from "../onboarding/character-selector";
import { Plus, Trash2, Shield, Sparkles, Filter, LogIn } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Link } from "@tanstack/react-router";
import type { CombatPath, CombatElement } from "@astralyn/shared";
import { CharacterAvatar, ElementIcon, PathIcon } from "../../components/ui/game-asset";

const PATHS: CombatPath[] = [
  "Destruction",
  "Hunt",
  "Erudition",
  "Harmony",
  "Nihility",
  "Preservation",
  "Abundance",
  "Remembrance",
  "Elation",
];

const ELEMENTS: CombatElement[] = [
  "Physical",
  "Fire",
  "Ice",
  "Lightning",
  "Wind",
  "Quantum",
  "Imaginary",
];

export function RosterManager() {
  const { status, signIn, needsOnboarding } = useAuth();
  const { roster, loading, error, upsertCharacter, removeCharacter } = useRoster();
  const { characters } = useCharacters();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedToAdd, setSelectedToAdd] = React.useState<Set<string>>(new Set());
  const [filterPath, setFilterPath] = React.useState<CombatPath | "ALL">("ALL");
  const [filterElement, setFilterElement] = React.useState<CombatElement | "ALL">("ALL");

  const characterMap = React.useMemo(() => {
    return new Map(characters.map((c) => [c.id, c]));
  }, [characters]);

  const filteredRoster = React.useMemo(() => {
    return roster.filter((r) => {
      const char = characterMap.get(r.characterId);
      if (!char) return true;
      if (filterPath !== "ALL" && char.path !== filterPath) return false;
      if (filterElement !== "ALL" && char.element !== filterElement) return false;
      return true;
    });
  }, [roster, characterMap, filterPath, filterElement]);

  const existingRosterIds = React.useMemo(() => {
    return new Set(roster.map((r) => r.characterId));
  }, [roster]);

  const handleLevelChange = async (characterId: string, level: number) => {
    const entry = roster.find((r) => r.characterId === characterId);
    if (!entry) return;
    await upsertCharacter({
      characterId,
      level: Math.max(1, Math.min(80, level)),
      eidolon: entry.eidolon,
    });
  };

  const handleEidolonChange = async (characterId: string, eidolon: number) => {
    const entry = roster.find((r) => r.characterId === characterId);
    if (!entry) return;
    await upsertCharacter({
      characterId,
      level: entry.level,
      eidolon: Math.max(0, Math.min(6, eidolon)),
    });
  };

  const handleAddSelected = async () => {
    for (const charId of selectedToAdd) {
      await upsertCharacter({
        characterId: charId,
        level: 80,
        eidolon: 0,
      });
    }
    setSelectedToAdd(new Set());
    setShowAddModal(false);
  };

  if (status === "unauthenticated") {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-xs border border-[#1a2338] bg-[#0c101a] text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-[#dfb86c]/10 border border-[#dfb86c]/30 flex items-center justify-center mx-auto text-[#dfb86c]">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-[#f0f3fa]">Authentication Required</h2>
        <p className="text-xs text-[#9ba5be] max-w-md mx-auto">
          Sign in with your Google account to manage your Honkai: Star Rail character roster, track levels and Eidolons, and enable personalized team recommendations.
        </p>
        <Button variant="primary" onClick={() => void signIn()} className="flex items-center gap-2 mx-auto">
          <LogIn className="h-4 w-4" />
          <span>Sign in with Google</span>
        </Button>
      </div>
    );
  }

  if (status === "authenticated" && needsOnboarding && roster.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-xs border border-[#dfb86c]/30 bg-[#0c101a] text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-[#dfb86c]/20 border border-[#dfb86c]/40 flex items-center justify-center mx-auto text-[#dfb86c]">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-[#f0f3fa]">Welcome, Trailblazer!</h2>
        <p className="text-xs text-[#9ba5be] max-w-md mx-auto">
          Your account is ready, but your roster has not been initialized yet. Complete onboarding to select your owned characters.
        </p>
        <Link to="/onboarding">
          <Button variant="primary" className="mx-auto">
            Start Onboarding Setup
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2338] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
              Roster Management
            </span>
            <span className="text-[10px] font-mono text-[#9ba5be]">• {roster.length} Owned</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa] mt-1">
            My Character Roster
          </h1>
          <p className="text-xs text-[#9ba5be] mt-1">
            Configure levels and Eidolons for your owned characters. Your roster directly informs Astralyn's team recommendations.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Characters</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xs text-xs text-[#f87171]">
          {error.message}
        </div>
      )}

      {/* Filters */}
      {roster.length > 0 && (
        <div className="p-3 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-2.5 text-xs">
          {/* Element Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#9ba5be] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3" /> Element:
            </span>
            <button
              type="button"
              onClick={() => setFilterElement("ALL")}
              className={`px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                filterElement === "ALL"
                  ? "bg-[#dfb86c] text-[#090c13] font-bold"
                  : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa]"
              }`}
            >
              All
            </button>
            {ELEMENTS.map((elem) => (
              <button
                key={elem}
                type="button"
                onClick={() => setFilterElement(elem)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                  filterElement === elem
                    ? "bg-[#dfb86c] text-[#090c13] font-bold"
                    : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa]"
                }`}
              >
                <ElementIcon element={elem} size={11} />
                <span>{elem}</span>
              </button>
            ))}
          </div>

          {/* Path Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#9ba5be] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3" /> Path:
            </span>
            <button
              type="button"
              onClick={() => setFilterPath("ALL")}
              className={`px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                filterPath === "ALL"
                  ? "bg-[#dfb86c] text-[#090c13] font-bold"
                  : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa]"
              }`}
            >
              All
            </button>
            {PATHS.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => setFilterPath(path)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                  filterPath === path
                    ? "bg-[#dfb86c] text-[#090c13] font-bold"
                    : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa]"
                }`}
              >
                <PathIcon path={path} size={11} />
                <span>{path}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Roster Character List */}
      {loading && roster.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#9ba5be]">Loading roster...</div>
      ) : roster.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#9ba5be] border border-dashed border-[#1f2940] rounded-xs space-y-3">
          <p>No characters in your roster yet.</p>
          <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
            Add Your First Character
          </Button>
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#9ba5be] border border-dashed border-[#1f2940] rounded-xs">
          No owned characters match the selected filters.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRoster.map((item) => {
            const char = characterMap.get(item.characterId);
            const is5Star = char?.rarity === 5;

            return (
              <div
                key={item.characterId}
                className={`p-3.5 rounded-xs border border-[#1a2338] bg-[#0c101a] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#25324e] transition-all border-l-2 ${
                  is5Star ? "border-l-[#d89f37]" : "border-l-[#9d7fe6]"
                }`}
              >
                {/* Character Info */}
                <div className="flex items-center gap-3.5">
                  <CharacterAvatar
                    characterId={item.characterId}
                    name={char?.name || item.characterId}
                    rarity={(char?.rarity as 4 | 5) || 5}
                    size="md"
                  />

                  <div>
                    <h3 className="text-sm font-bold text-[#f0f3fa]">
                      {char?.name || item.characterId}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#9ba5be] font-mono mt-0.5">
                      <PathIcon path={char?.path || ""} size={12} />
                      <span>{char?.path}</span>
                      <span>•</span>
                      <ElementIcon element={char?.element || ""} size={12} />
                      <span>{char?.element}</span>
                    </div>
                  </div>
                </div>

                {/* Level & Eidolon Controls */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* Level Stepper */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#9ba5be] uppercase">Lv:</span>
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={item.level}
                      onChange={(e) =>
                        void handleLevelChange(item.characterId, parseInt(e.target.value, 10) || 1)
                      }
                      className="w-14 px-2 py-1 bg-[#101524] border border-[#1f2940] rounded-xs text-xs font-mono font-bold text-[#f0f3fa] text-center focus:border-[#dfb86c] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleLevelChange(item.characterId, 80)}
                      className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#1f2940] text-[#9ba5be] hover:text-[#dfb86c] cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>

                  {/* Eidolon Picker */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-[#9ba5be] uppercase mr-1">Eidolon:</span>
                    {[0, 1, 2, 3, 4, 5, 6].map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => void handleEidolonChange(item.characterId, e)}
                        className={`h-7 w-7 rounded-xs text-xs font-mono font-bold transition-all cursor-pointer ${
                          item.eidolon === e
                            ? "bg-[#dfb86c] text-[#090c13] shadow-[0_0_8px_rgba(223,184,108,0.4)]"
                            : "bg-[#101524] border border-[#1f2940] text-[#9ba5be] hover:text-[#f0f3fa]"
                        }`}
                      >
                        E{e}
                      </button>
                    ))}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => void removeCharacter(item.characterId)}
                    title="Remove from roster"
                    className="p-1.5 rounded-xs text-[#9ba5be] hover:text-[#f87171] hover:bg-[#1f2940]/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Characters Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#090c13]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0b0e17] border border-[#1a2338] rounded-xs p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1a2338] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#f0f3fa]">Add Characters to Roster</h3>
                <p className="text-xs text-[#9ba5be]">Select characters you have unlocked.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#9ba5be] hover:text-[#f0f3fa] text-xs font-mono p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <CharacterSelector
                selectedIds={selectedToAdd}
                excludedIds={existingRosterIds}
                onToggle={(id) => {
                  setSelectedToAdd((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1a2338]">
              <span className="text-xs text-[#9ba5be]">
                Selected to add: <strong className="text-[#dfb86c] font-mono">{selectedToAdd.size}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedToAdd.size === 0}
                  onClick={() => void handleAddSelected()}
                >
                  Add Selected ({selectedToAdd.size})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
