// apps/web/src/routes/character-detail-view.tsx
import * as React from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  useCharacter,
  useCharacters,
  useLightCones,
  useRelicSets,
} from "../lib/knowledge/use-knowledge";
import { useRoster } from "../features/roster";
import { useTeamRecommendations } from "../features/recommendations/use-team-recommendations";
import { useSavedTeams } from "../features/teams";
import {
  getPathCompatibleLightCones,
  getRecommendedRelicSets,
  getCharacterTeammateSynergies,
} from "@astralyn/shared";
import { CharacterAvatar, ElementIcon, PathIcon } from "../components/ui/game-asset";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  Info,
} from "lucide-react";

export function CharacterDetailView() {
  const { characterId } = useParams({ from: "/characters/$characterId" });
  const { character, loading: charLoading } = useCharacter(characterId);
  const { characters } = useCharacters();
  const { lightCones } = useLightCones();
  const { relicSets } = useRelicSets();
  const { roster } = useRoster();
  const { createTeam } = useSavedTeams();

  const [activeTab, setActiveTab] = React.useState<"abilities" | "traces" | "eidolons">("abilities");
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");

  const rosterItem = React.useMemo(() => {
    return roster.find((r) => r.characterId === characterId && r.isOwned !== false);
  }, [roster, characterId]);

  const isOwned = rosterItem !== undefined;

  // Phase 5 recommendation engine integration
  const {
    teams,
    loading: recLoading,
    status: recStatus,
  } = useTeamRecommendations(
    { focusCharacterId: characterId, mode: "general" },
    { roster, rosterLoading: false }
  );

  const topTeam = teams[0];

  // Build associations
  const compatibleLightCones = React.useMemo(() => {
    if (!character) return [];
    return getPathCompatibleLightCones(character.path, lightCones);
  }, [character, lightCones]);

  const recommendedRelics = React.useMemo(() => {
    if (!character) return { cavernRelics: [], planarOrnaments: [] };
    return getRecommendedRelicSets(character, relicSets);
  }, [character, relicSets]);

  const teammateSynergies = React.useMemo(() => {
    if (!character) return [];
    return getCharacterTeammateSynergies(character, characters);
  }, [character, characters]);

  const handleSaveTopTeam = async () => {
    if (!topTeam || saveStatus === "saving" || saveStatus === "saved") return;

    setSaveStatus("saving");
    try {
      const defaultName = `${character?.name || "Focus"} Team`;
      const members = topTeam.slots.map((s, idx) => ({
        slot: s.slot || idx + 1,
        characterId: s.characterId,
      }));

      await createTeam(defaultName, members, "general");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 4000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  if (charLoading) {
    return (
      <div className="p-12 text-center text-xs text-[#9ba5be]">
        Loading character dossier...
      </div>
    );
  }

  if (!character) {
    return (
      <div className="p-8 border border-[#1a2338] bg-[#0c101a] rounded-xs text-center space-y-4 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-[#f0f3fa]">Character Not Found</h2>
        <p className="text-xs text-[#9ba5be]">
          The requested coordinate <span className="font-mono text-[#dfb86c]">"{characterId}"</span> is not recognized in the canonical Version 4.5 database.
        </p>
        <Link to="/characters">
          <Button variant="secondary" size="sm" className="mx-auto">
            Back to Database
          </Button>
        </Link>
      </div>
    );
  }

  const is5Star = character.rarity === 5;

  return (
    <div className="space-y-6 max-w-5xl" data-testid="character-detail-view">
      {/* Back Button */}
      <Link
        to="/characters"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#9ba5be] hover:text-[#dfb86c] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Return to Catalog</span>
      </Link>

      {/* Section A: Character Header & Lv.80 Base Stats */}
      <div
        className={`p-5 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-5 border-l-4 ${
          is5Star ? "border-l-[#d89f37]" : "border-l-[#9d7fe6]"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <CharacterAvatar
              characterId={character.id}
              name={character.name}
              rarity={character.rarity}
              size="lg"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#f0f3fa]">
                  {character.name}
                </h1>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-xs font-bold ${
                    is5Star ? "text-[#dfb86c] bg-[#dfb86c]/10" : "text-[#b096f2] bg-[#9d7fe6]/10"
                  }`}
                >
                  {character.rarity}★
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#9ba5be] font-mono">
                <div className="flex items-center gap-1">
                  <PathIcon path={character.path} size={14} />
                  <span>{character.path}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <ElementIcon element={character.element} size={14} />
                  <span>{character.element}</span>
                </div>
                <span>•</span>
                <span className="text-[#5c6882]">v{character.releaseVersion}</span>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {character.roles.map((r) => (
                  <span
                    key={r}
                    className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono bg-[#101524] border border-[#1f2940] text-[#dfb86c]"
                  >
                    {r?.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Roster Ownership Status Card */}
          <div className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
            <span className="text-[10px] font-mono text-[#5c6882] uppercase">Roster Status</span>
            {isOwned ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#68d391] bg-[#68d391]/10 px-2 py-0.5 rounded-xs">
                  Owned Lv.{rosterItem.level} E{rosterItem.eidolon}
                </span>
                <Link to="/roster">
                  <Button variant="secondary" size="sm" className="text-[10px] h-6 px-2">
                    Edit
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#718096] bg-[#718096]/10 px-2 py-0.5 rounded-xs">
                  Unowned
                </span>
                <Link to="/roster">
                  <Button variant="secondary" size="sm" className="text-[10px] h-6 px-2">
                    Add to Roster
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Lv.80 Base Stats Grid */}
        <div className="border-t border-[#151c2e] pt-4">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-[#5c6882] uppercase mb-2">
            Base Attributes (Level 80 Baseline)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs">
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">HP</span>
              <span className="text-[#f0f3fa] font-bold">{character.baseStats.hp}</span>
            </div>
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">ATK</span>
              <span className="text-[#f0f3fa] font-bold">{character.baseStats.atk}</span>
            </div>
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">DEF</span>
              <span className="text-[#f0f3fa] font-bold">{character.baseStats.def}</span>
            </div>
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">SPD</span>
              <span className="text-[#f0f3fa] font-bold">{character.baseStats.spd}</span>
            </div>
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">CRIT RATE</span>
              <span className="text-[#f0f3fa] font-bold">{(character.baseStats.critRate * 100).toFixed(1)}%</span>
            </div>
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">CRIT DMG</span>
              <span className="text-[#f0f3fa] font-bold">{(character.baseStats.critDmg * 100).toFixed(1)}%</span>
            </div>
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">TAUNT</span>
              <span className="text-[#f0f3fa] font-bold">{character.baseStats.taunt}</span>
            </div>
            <div className="p-2 rounded-xs bg-[#101524] border border-[#1f2940]">
              <span className="text-[10px] text-[#5c6882] block">ENERGY</span>
              <span className="text-[#dfb86c] font-bold">
                {character.baseStats.maxEnergy !== null ? character.baseStats.maxEnergy : "Special"}
              </span>
            </div>
          </div>
          {character.specialResourceType && (
            <p className="text-[11px] font-mono text-[#dfb86c] mt-2">
              • Special Resource: {character.specialResourceType}
            </p>
          )}
        </div>
      </div>

      {/* Section B: Kit, Traces & Eidolons Navigation Tabs */}
      <div className="p-5 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-4">
        <div className="flex border-b border-[#1f2940] gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("abilities")}
            className={`pb-2 text-xs font-mono font-bold transition-colors cursor-pointer ${
              activeTab === "abilities"
                ? "text-[#dfb86c] border-b-2 border-[#dfb86c]"
                : "text-[#9ba5be] hover:text-[#f0f3fa]"
            }`}
          >
            Abilities & Skills ({character.abilities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("traces")}
            className={`pb-2 text-xs font-mono font-bold transition-colors cursor-pointer ${
              activeTab === "traces"
                ? "text-[#dfb86c] border-b-2 border-[#dfb86c]"
                : "text-[#9ba5be] hover:text-[#f0f3fa]"
            }`}
          >
            Major Traces ({character.majorTraces.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("eidolons")}
            className={`pb-2 text-xs font-mono font-bold transition-colors cursor-pointer ${
              activeTab === "eidolons"
                ? "text-[#dfb86c] border-b-2 border-[#dfb86c]"
                : "text-[#9ba5be] hover:text-[#f0f3fa]"
            }`}
          >
            Eidolons (E1–E6)
          </button>
        </div>

        {/* Tab 1: Abilities */}
        {activeTab === "abilities" && (
          <div className="space-y-3">
            {character.abilities.map((ability) => (
              <div
                key={ability.id}
                className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#f0f3fa]">{ability.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-[#1a2338] text-[#dfb86c] uppercase">
                      {ability.type}
                    </span>
                  </div>
                  {ability.spCost !== undefined && (
                    <span className="text-[10px] font-mono text-[#9ba5be]">
                      SP Cost: {ability.spCost}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9ba5be] leading-relaxed">{ability.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Major Traces */}
        {activeTab === "traces" && (
          <div className="space-y-3">
            {character.majorTraces.map((trace) => (
              <div
                key={trace.id}
                className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f0f3fa]">{trace.name}</span>
                  <span className="text-[10px] font-mono text-[#dfb86c]">{trace.ascensionRequirement}</span>
                </div>
                <p className="text-xs text-[#9ba5be] leading-relaxed">{trace.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Eidolons */}
        {activeTab === "eidolons" && (
          <div className="space-y-3">
            {character.eidolons.map((eidolon) => (
              <div
                key={eidolon.rank}
                className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f0f3fa]">
                    E{eidolon.rank}: {eidolon.name}
                  </span>
                </div>
                <p className="text-xs text-[#9ba5be] leading-relaxed">{eidolon.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section C: Build Guidance (Truthful Engineering Labels) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Path-Compatible Light Cones */}
        <div className="p-4 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2940] pb-2">
            <div>
              <h2 className="text-xs font-bold text-[#f0f3fa] uppercase tracking-wider">
                Path-Compatible Light Cones
              </h2>
              <p className="text-[10px] text-[#5c6882]">
                Filtered strictly by Path compatibility ({character.path})
              </p>
            </div>
            <PathIcon path={character.path} size={16} />
          </div>

          <div className="space-y-2">
            {compatibleLightCones.length === 0 ? (
              <p className="text-xs text-[#9ba5be]">No compatible light cones in verified fixtures.</p>
            ) : (
              compatibleLightCones.map((cone) => (
                <div
                  key={cone.id}
                  className="p-2.5 rounded-xs border border-[#1f2940] bg-[#101524] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f0f3fa]">{cone.name}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        cone.rarity === 5 ? "text-[#dfb86c]" : "text-[#b096f2]"
                      }`}
                    >
                      {cone.rarity}★
                    </span>
                  </div>
                  <p className="text-[11px] text-[#dfb86c] font-mono">{cone.skill.name}</p>
                  <p className="text-[10px] text-[#9ba5be] line-clamp-2">
                    {cone.skill.superimpositions[0]}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mechanically Synergistic Relics */}
        <div className="p-4 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-3">
          <div className="border-b border-[#1f2940] pb-2">
            <h2 className="text-xs font-bold text-[#f0f3fa] uppercase tracking-wider">
              Mechanically Synergistic Relics
            </h2>
            <p className="text-[10px] text-[#5c6882]">
              Associated deterministically via shared kit mechanic tags
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#5c6882] block mb-1">
                Cavern Relics (4-Piece):
              </span>
              <div className="space-y-1.5">
                {recommendedRelics.cavernRelics.length === 0 ? (
                  <p className="text-[11px] text-[#5c6882] italic">
                    No direct mechanic tag association in verified canonical fixtures.
                  </p>
                ) : (
                  recommendedRelics.cavernRelics.map((relic) => (
                    <div
                      key={relic.id}
                      className="p-2.5 rounded-xs border border-[#1f2940] bg-[#101524] space-y-1"
                    >
                      <span className="text-xs font-bold text-[#f0f3fa] block">{relic.name}</span>
                      <p className="text-[10px] text-[#9ba5be]">
                        <span className="text-[#dfb86c]">2pc:</span> {relic.twoPieceEffect}
                      </p>
                      {relic.fourPieceEffect && (
                        <p className="text-[10px] text-[#9ba5be]">
                          <span className="text-[#dfb86c]">4pc:</span> {relic.fourPieceEffect}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#5c6882] block mb-1">
                Planar Ornaments (2-Piece):
              </span>
              <div className="space-y-1.5">
                {recommendedRelics.planarOrnaments.length === 0 ? (
                  <p className="text-[11px] text-[#5c6882] italic">
                    No direct mechanic tag association in verified canonical fixtures.
                  </p>
                ) : (
                  recommendedRelics.planarOrnaments.map((planar) => (
                    <div
                      key={planar.id}
                      className="p-2.5 rounded-xs border border-[#1f2940] bg-[#101524] space-y-1"
                    >
                      <span className="text-xs font-bold text-[#f0f3fa] block">{planar.name}</span>
                      <p className="text-[10px] text-[#9ba5be]">
                        <span className="text-[#dfb86c]">2pc:</span> {planar.twoPieceEffect}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Single Honest Editorial Unavailable State */}
      <div className="p-4 rounded-xs border border-[#25324e] bg-[#0c101a] flex items-start gap-3">
        <Info className="h-4 w-4 text-[#dfb86c] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-[#f0f3fa]">
            Editorial Consensus & Multi-Source Comparison Unavailable
          </p>
          <p className="text-[#9ba5be] leading-relaxed">
            Multi-source comparison across external guides (Prydwen, Game8, Guobie) is scheduled for the automated ingestion pipeline in Phase 8. No third-party editorial data has been ingested yet.
          </p>
        </div>
      </div>

      {/* Section E: "Best Team From My Roster" (Phase 5 Engine Integration) */}
      <div className="p-5 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2940] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
                Recommendation Engine
              </span>
              <span className="text-[10px] font-mono text-[#9ba5be]">• Roster-Aware Anchor</span>
            </div>
            <h2 className="text-sm font-bold text-[#f0f3fa] mt-0.5">
              Best Team From My Roster ({character.name} Focus)
            </h2>
          </div>

          {topTeam && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveTopTeam}
              disabled={saveStatus === "saving" || saveStatus === "saved"}
              className="flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              {saveStatus === "saved" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#68d391]" />
                  <span className="text-[#68d391]">Saved to Teams!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  <span>Save to My Teams</span>
                </>
              )}
            </Button>
          )}
        </div>

        {!isOwned && (
          <div className="p-2.5 rounded-xs border border-[#1f2940] bg-[#101524] text-[11px] text-[#9ba5be] font-mono">
            • Note: Recommendations evaluated assuming {character.name} is available.
          </div>
        )}

        {recLoading ? (
          <div className="p-6 text-center text-xs text-[#9ba5be]">
            Calculating optimal synergies from your owned roster...
          </div>
        ) : recStatus === "insufficient_roster" || !topTeam ? (
          <div className="p-6 text-center border border-[#1f2940] bg-[#101524] rounded-xs space-y-2">
            <p className="text-xs font-semibold text-[#f0f3fa]">Insufficient Roster Characters</p>
            <p className="text-[11px] text-[#9ba5be]">
              At least 4 owned characters are required to compute full team recommendations.
            </p>
            <Link to="/roster">
              <Button variant="primary" size="sm" className="mx-auto mt-2">
                Add Characters to Roster
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Team Header & Score */}
            <div className="flex items-center justify-between p-3 bg-[#101524] border border-[#1f2940] rounded-xs font-mono text-xs">
              <div>
                <span className="text-[#5c6882]">Archetype:</span>{" "}
                <span className="font-bold text-[#dfb86c]">{topTeam.archetype}</span>
              </div>
              <div>
                <span className="text-[#5c6882]">Composite Score:</span>{" "}
                <span className="font-bold text-[#68d391]">{topTeam.score} / 100</span>
              </div>
            </div>

            {/* 4 Member Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {topTeam.slots.map((slot) => {
                const memberChar = characters.find((c) => c.id === slot.characterId);
                return (
                  <div
                    key={slot.slot}
                    className="p-2.5 rounded-xs border border-[#1f2940] bg-[#101524] flex items-center gap-2.5"
                  >
                    <CharacterAvatar
                      characterId={slot.characterId}
                      name={memberChar?.name || slot.characterId}
                      rarity={memberChar?.rarity || 5}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#f0f3fa] truncate block">
                        {memberChar?.name || slot.characterId}
                      </span>
                      <span className="text-[10px] font-mono text-[#9ba5be] block">
                        {slot.role?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendation Reasons */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono uppercase text-[#5c6882] block">
                Deterministic Decision Rationale:
              </span>
              <div className="space-y-1">
                {topTeam.reasons.map((r, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-[#9ba5be] flex items-start gap-1.5 font-mono"
                  >
                    <span className="text-[#dfb86c]">[{r.code}]</span>
                    <span>{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section F: Kit Synergy Teammates */}
      <div className="p-5 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-3">
        <div className="border-b border-[#1f2940] pb-2">
          <h2 className="text-xs font-bold text-[#f0f3fa] uppercase tracking-wider">
            Kit Synergy Teammates
          </h2>
          <p className="text-[10px] text-[#5c6882]">
            Exposes verified mechanic relationships with other canonical characters
          </p>
        </div>

        {teammateSynergies.length === 0 ? (
          <p className="text-[11px] text-[#5c6882] italic">
            No specific kit mechanic associations found in verified canonical fixtures.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teammateSynergies.map((synergy) => {
              const tmChar = characters.find((c) => c.id === synergy.teammateId);
              return (
                <div
                  key={synergy.teammateId}
                  className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <CharacterAvatar
                        characterId={synergy.teammateId}
                        name={synergy.teammateName}
                        rarity={tmChar?.rarity || 5}
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#f0f3fa] block">
                          {synergy.teammateName}
                        </span>
                        <span className="text-[9px] font-mono text-[#dfb86c]">
                          Mechanic Synergy
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#9ba5be] leading-relaxed">
                      {synergy.explanation}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#151c2e]">
                    <span className="text-[9px] font-mono text-[#5c6882] uppercase">
                      [{synergy.reasonCode}]
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
