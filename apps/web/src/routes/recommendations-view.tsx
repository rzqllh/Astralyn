import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../features/auth";
import { useRoster } from "../features/roster/use-roster";
import { useCharacters, useKnowledgeInit } from "../lib/knowledge/use-knowledge";
import { useTeamRecommendations } from "../features/recommendations/use-team-recommendations";
import { CharacterAvatar, ElementIcon, PathIcon } from "../components/ui/game-asset";
import { Button } from "../components/ui/button";
import { Shield, Sparkles, AlertCircle, RefreshCw, ArrowRight, CheckCircle2, BookmarkPlus, Check } from "lucide-react";
import { useSavedTeams } from "../features/teams";
import type { CombatElement } from "@astralyn/shared";

const COMBAT_ELEMENTS: CombatElement[] = [
  "Physical",
  "Fire",
  "Ice",
  "Lightning",
  "Wind",
  "Quantum",
  "Imaginary",
];

const ELEMENT_STYLES: Record<
  CombatElement,
  { activeBorder: string; activeBg: string; activeText: string; ring: string }
> = {
  Physical: {
    activeBorder: "border-[#abb2bf]",
    activeBg: "bg-[#abb2bf]/20",
    activeText: "text-[#abb2bf]",
    ring: "ring-[#abb2bf]/40",
  },
  Fire: {
    activeBorder: "border-[#f87171]",
    activeBg: "bg-[#f87171]/20",
    activeText: "text-[#f87171]",
    ring: "ring-[#f87171]/40",
  },
  Ice: {
    activeBorder: "border-[#38bdf8]",
    activeBg: "bg-[#38bdf8]/20",
    activeText: "text-[#38bdf8]",
    ring: "ring-[#38bdf8]/40",
  },
  Lightning: {
    activeBorder: "border-[#c084fc]",
    activeBg: "bg-[#c084fc]/20",
    activeText: "text-[#c084fc]",
    ring: "ring-[#c084fc]/40",
  },
  Wind: {
    activeBorder: "border-[#34d399]",
    activeBg: "bg-[#34d399]/20",
    activeText: "text-[#34d399]",
    ring: "ring-[#34d399]/40",
  },
  Quantum: {
    activeBorder: "border-[#818cf8]",
    activeBg: "bg-[#818cf8]/20",
    activeText: "text-[#818cf8]",
    ring: "ring-[#818cf8]/40",
  },
  Imaginary: {
    activeBorder: "border-[#fbbf24]",
    activeBg: "bg-[#fbbf24]/20",
    activeText: "text-[#fbbf24]",
    ring: "ring-[#fbbf24]/40",
  },
};

export function RecommendationsView() {
  const { status: authStatus } = useAuth();
  const { roster, loading: rosterLoading } = useRoster();
  const { characters } = useCharacters();
  const { syncResult } = useKnowledgeInit();

  const [focusCharId, setFocusCharId] = React.useState<string>("");
  const [selectedWeaknesses, setSelectedWeaknesses] = React.useState<Set<CombatElement>>(new Set());

  const context = React.useMemo(() => {
    return {
      focusCharacterId: focusCharId || undefined,
      targetWeaknesses: selectedWeaknesses.size > 0 ? Array.from(selectedWeaknesses).sort() : undefined,
      limit: 3,
    };
  }, [focusCharId, selectedWeaknesses]);

  const {
    teams,
    loading: recLoading,
    error,
    status: engineStatus,
    missingKnowledgeCharacterIds,
    message,
    refresh,
  } = useTeamRecommendations(context, {
    roster,
    rosterLoading,
    knowledgeVersion: syncResult?.activeKnowledgeVersion ?? "1.0.0",
  });

  const { createTeam } = useSavedTeams();
  const [savingSignatures, setSavingSignatures] = React.useState<Record<string, "saving" | "saved" | "error">>({});

  const handleSaveTeam = async (team: (typeof teams)[number]) => {
    if (savingSignatures[team.signature] === "saving" || savingSignatures[team.signature] === "saved") return;

    setSavingSignatures((prev) => ({ ...prev, [team.signature]: "saving" }));
    try {
      const defaultName = team.archetype || `Recommended Team #${team.rank}`;
      const members = team.slots.map((s, idx) => ({
        slot: s.slot || idx + 1,
        characterId: s.characterId,
      }));
      await createTeam(defaultName, members, "general");
      setSavingSignatures((prev) => ({ ...prev, [team.signature]: "saved" }));
      setTimeout(() => {
        setSavingSignatures((prev) => {
          const next = { ...prev };
          delete next[team.signature];
          return next;
        });
      }, 4000);
    } catch {
      setSavingSignatures((prev) => ({ ...prev, [team.signature]: "error" }));
      setTimeout(() => {
        setSavingSignatures((prev) => {
          const next = { ...prev };
          delete next[team.signature];
          return next;
        });
      }, 4000);
    }
  };

  const loading = recLoading || rosterLoading;

  const characterMap = React.useMemo(() => {
    return new Map(characters.map((c) => [c.id, c]));
  }, [characters]);

  const ownedCharacterIds = React.useMemo(() => {
    return roster.filter((r) => r.isOwned).map((r) => r.characterId);
  }, [roster]);

  const toggleWeakness = (el: CombatElement) => {
    setSelectedWeaknesses((prev) => {
      const next = new Set(prev);
      if (next.has(el)) {
        next.delete(el);
      } else {
        next.add(el);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-[#1a2338] pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#f0f3fa] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#dfb86c]" />
              Team Recommendations
            </h1>
            <p className="text-sm text-[#9ba5be] mt-1">
              Source-grounded, 100% deterministic team calculations evaluated directly from your owned roster.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-xs bg-[#101524] border border-[#1f2940] text-[#9ba5be] font-mono">
              Engine: Pure Integer Fixed-Point (D-028)
            </span>
            <span className="text-xs px-2.5 py-1 rounded-xs bg-[#101524] border border-[#1f2940] text-[#9ba5be] font-mono">
              Consensus: Mechanical-Only
            </span>
            <span className="text-xs px-2.5 py-1 rounded-xs bg-[#101524] border border-[#1f2940] text-[#9ba5be] font-mono">
              SP Model: Unavailable
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
          {/* Missing Knowledge Warning Banner */}
          {missingKnowledgeCharacterIds && missingKnowledgeCharacterIds.length > 0 && (
            <div className="rounded-sm border border-[#fbbf24]/40 bg-[#fbbf24]/10 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-[#fbbf24]">Unrecognized Roster Entries Excluded</p>
                <p className="text-[#9ba5be] mt-0.5">
                  The following characters are not recognized in the current canonical knowledge release and were
                  excluded from calculation:{" "}
                  <code className="bg-[#090c13] px-1 py-0.5 rounded text-[#f0f3fa] font-mono text-xs border border-[#1f2940]">
                    {missingKnowledgeCharacterIds.join(", ")}
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Context Filter Bar */}
          <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Focus Character Anchor */}
                <div className="space-y-1">
                  <label htmlFor="focus-character-select" className="text-xs font-medium text-[#9ba5be] block">
                    Anchor / Focus Character
                  </label>
                  <select
                    id="focus-character-select"
                    value={focusCharId}
                    onChange={(e) => setFocusCharId(e.target.value)}
                    className="block min-w-[240px] text-sm rounded-sm border border-[#1f2940] bg-[#0a0e1a] px-3.5 py-2 text-[#f0f3fa] hover:border-[#303f5e] focus:border-[#dfb86c] focus:outline-hidden focus:ring-1 focus:ring-[#dfb86c] [color-scheme:dark] cursor-pointer"
                  >
                    <option value="" className="bg-[#0a0e1a] text-[#f0f3fa]">
                      Auto-Discover (Best Team)
                    </option>
                    {ownedCharacterIds.map((id) => {
                      const c = characterMap.get(id);
                      return (
                        <option key={id} value={id} className="bg-[#0a0e1a] text-[#f0f3fa]">
                          {c ? c.name : id}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Target Weaknesses */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#9ba5be] block">Target Enemy Weaknesses</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMBAT_ELEMENTS.map((elem) => {
                      const active = selectedWeaknesses.has(elem);
                      const style = ELEMENT_STYLES[elem];
                      return (
                        <button
                          key={elem}
                          type="button"
                          onClick={() => toggleWeakness(elem)}
                          aria-pressed={active}
                          className={`text-xs px-2.5 py-1 rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                            active
                              ? `${style.activeBorder} ${style.activeBg} ${style.activeText} font-semibold shadow-[0_0_8px_rgba(223,184,108,0.2)] ring-1 ${style.ring}`
                              : "border-[#1f2940] bg-[#0a0e1a] text-[#9ba5be] hover:border-[#303f5e] hover:text-[#f0f3fa]"
                          }`}
                        >
                          <ElementIcon element={elem} size={14} />
                          <span>{elem}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={loading}
                className="gap-2 shrink-0 self-end sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Recalculate
              </Button>
            </div>
          </div>

          {/* Note when roster has exactly 4 characters */}
          {ownedCharacterIds.length === 4 && (
            <div className="rounded-sm border border-[#303f5e]/60 bg-[#101524] px-4 py-3 flex items-start sm:items-center gap-3 text-xs text-[#9ba5be]">
              <Sparkles className="w-4 h-4 text-[#dfb86c] shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Your roster currently has <strong className="text-[#f0f3fa]">4 owned characters</strong> (exactly 1 possible 4-person combination). All focus selections will recommend this core team. Add more characters via{" "}
                <Link to="/roster" className="text-[#dfb86c] underline hover:text-[#f4d38f] font-semibold">
                  Roster Manager
                </Link>{" "}
                to unlock alternative combinations.
              </span>
            </div>
          )}

          {/* Engine States */}
          {loading ? (
            <div className="py-16 text-center text-[#9ba5be] space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#dfb86c]" />
              <p className="text-sm font-medium">Evaluating deterministic 4-character combinations...</p>
            </div>
          ) : error ? (
            <div className="rounded-sm border border-[#f87171]/40 bg-[#f87171]/10 p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#f87171] mx-auto" />
              <h3 className="font-semibold text-[#f87171]">Evaluation Failed</h3>
              <p className="text-sm text-[#9ba5be]">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refresh()}>
                Retry
              </Button>
            </div>
          ) : engineStatus === "insufficient_roster" ? (
            <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#161e32] text-[#9ba5be] flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#f0f3fa]">Insufficient Roster</h3>
              <p className="text-sm text-[#9ba5be]">
                {message || "At least 4 owned characters are required to generate full team recommendations."}
              </p>
              <Link to="/roster">
                <Button className="gap-2">
                  <span>Manage Roster</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-12 text-center space-y-3">
              <p className="text-sm text-[#9ba5be]">No valid combinations found matching the given criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {teams.map((team) => (
                <div
                  key={team.signature}
                  className="rounded-sm border border-[#1f2940] bg-[#101524] overflow-hidden shadow-sm hover:border-[#303f5e] transition-colors"
                >
                  {/* Team Card Header */}
                  <div className="p-5 border-b border-[#1f2940] bg-[#0c101c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#dfb86c] text-[#090c13] font-bold flex items-center justify-center text-sm">
                        #{team.rank}
                      </span>
                      <div>
                        <h3 className="font-semibold text-[#f0f3fa]">{team.archetype}</h3>
                        <p className="text-xs text-[#9ba5be] font-mono mt-0.5">
                          Signature: {team.signature}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-[#f0f3fa]">{team.score}</span>
                        <span className="text-xs text-[#9ba5be]"> / 100</span>
                        <div className="text-[10px] text-[#9ba5be]">
                          Role: {team.roleScore} • Syn: {team.synergyScore}
                          {selectedWeaknesses.size > 0 ? ` • Elem: ${team.elementScore}` : ""}
                        </div>
                      </div>
                      {authStatus === "authenticated" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSaveTeam(team)}
                          disabled={savingSignatures[team.signature] === "saving"}
                          className="gap-1.5 shrink-0"
                          data-testid={`save-team-button-${team.rank}`}
                        >
                          {savingSignatures[team.signature] === "saved" ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[#34d399]" />
                              Saved
                            </>
                          ) : savingSignatures[team.signature] === "saving" ? (
                            "Saving..."
                          ) : (
                            <>
                              <BookmarkPlus className="h-3.5 w-3.5 text-[#dfb86c]" />
                              Save Team
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Character Slots */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {team.slots.map((slot) => {
                      const charKnowledge = characterMap.get(slot.characterId);
                      const isFocusAnchor = Boolean(focusCharId && slot.characterId === focusCharId);
                      return (
                        <div
                          key={slot.characterId}
                          className={`rounded-sm border p-3 flex items-center gap-3 transition-colors ${
                            isFocusAnchor
                              ? "border-[#dfb86c] bg-[#1a160a] shadow-[0_0_12px_rgba(223,184,108,0.15)] ring-1 ring-[#dfb86c]/60"
                              : "border-[#1f2940] bg-[#090c13]"
                          }`}
                        >
                          <CharacterAvatar characterId={slot.characterId} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold truncate text-[#f0f3fa]">
                                {charKnowledge ? charKnowledge.name : slot.characterId}
                              </span>
                              {charKnowledge && (
                                <>
                                  <ElementIcon element={charKnowledge.element} size={14} />
                                  <PathIcon path={charKnowledge.path} size={14} />
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {slot.role === "unknown" ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/50 font-mono font-bold uppercase tracking-wider">
                                  Limited Data
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-[#1f2940] text-[#f0f3fa] border border-[#303f5e] capitalize font-mono">
                                  {slot.role.replace(/_/g, " ")}
                                </span>
                              )}
                              <span className="text-[11px] text-[#9ba5be] font-mono">
                                Lv.{slot.level} E{slot.eidolon}
                              </span>
                              {isFocusAnchor && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-[#dfb86c]/20 text-[#dfb86c] border border-[#dfb86c]/50 font-mono font-bold uppercase tracking-wider">
                                  Focus
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Structured Reasons */}
                  {team.reasons && team.reasons.length > 0 && (
                    <div className="px-5 pb-5 pt-1 space-y-2 border-t border-[#1f2940] bg-[#0c101c]/50">
                      <p className="text-xs font-medium text-[#9ba5be] mt-3">Evaluation Reasons:</p>
                      <div className="flex flex-wrap gap-2">
                        {team.reasons.map((r, idx) => {
                          const isPenalty = r.type === "penalty";
                          return (
                            <div
                              key={idx}
                              className={`text-xs px-3 py-1.5 rounded-xs border flex items-start gap-2 max-w-full ${
                                isPenalty
                                  ? "border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171]"
                                  : "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
                              }`}
                            >
                              {isPenalty ? (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-semibold mr-1">{r.code.replace(/_/g, " ")}:</span>
                                <span className="opacity-90">{r.message}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
