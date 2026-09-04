// apps/web/src/routes/best-characters-view.tsx
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useCharacters } from "../lib/knowledge/use-knowledge";
import { useRoster } from "../features/roster";
import { CharacterAvatar, ElementIcon, PathIcon } from "../components/ui/game-asset";
import { Shield, Swords, Wand2, Info } from "lucide-react";

export function BestCharactersView() {
  const { characters, loading } = useCharacters();
  const { roster } = useRoster();

  const ownedSet = React.useMemo(() => {
    return new Set(roster.filter((r) => r.isOwned !== false).map((r) => r.characterId));
  }, [roster]);

  // Group characters by mechanical combat taxonomy
  const roleGroups = React.useMemo(() => {
    const sustains = characters.filter((c) =>
      c.roles.some((r) => r === "shielder" || r === "healer")
    );
    const carries = characters.filter((c) =>
      c.roles.some((r) => r === "hypercarry_dps" || r === "break_dps" || r === "elation_dps" || r === "sub_dps")
    );
    const amplifiers = characters.filter((c) =>
      c.roles.some((r) => r === "buffer" || r === "debuffer" || r === "battery")
    );

    return { sustains, carries, amplifiers };
  }, [characters]);

  return (
    <div className="space-y-6 max-w-5xl" data-testid="best-characters-view">
      {/* Header */}
      <div className="border-b border-[#1a2338] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
            Combat Taxonomy
          </span>
          <span className="text-[10px] font-mono text-[#9ba5be]">• Version 4.5 Baseline</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa] mt-1">
          Character Role & Coverage Matrix
        </h1>
        <p className="text-xs text-[#9ba5be] mt-1 max-w-2xl">
          Authoritative combat role categorization across Sustain Specialists, Primary Carries, and Amplifiers. Compare tactical roles and monitor your owned roster coverage.
        </p>
      </div>

      {/* Honest Truthful Disclaimer */}
      <div className="p-4 rounded-xs border border-[#25324e] bg-[#0c101a] flex items-start gap-3">
        <Info className="h-4 w-4 text-[#dfb86c] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-[#f0f3fa]">
            Mode-Neutral Mechanical Role Evaluation
          </p>
          <p className="text-[#9ba5be] leading-relaxed">
            This matrix is evaluated strictly on canonical combat roles and mechanic taxonomy. Subjective community tier lists (S+/S/A) and unverified game mode suitability rankings (MoC/PF/AS) are not ingested in this build.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#9ba5be]">
          Loading canonical combat roles...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category 1: Sustain Specialists */}
          <div className="p-5 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2940] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xs bg-[#101524] border border-[#1f2940] text-[#68d391]">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#f0f3fa]">Sustain Specialists</h2>
                  <p className="text-[10px] text-[#5c6882]">
                    Shielders, Healers, and team survivability anchors
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-[#9ba5be]">
                Roster Coverage:{" "}
                <span className="font-bold text-[#68d391]">
                  {roleGroups.sustains.filter((c) => ownedSet.has(c.id)).length} / {roleGroups.sustains.length} Owned
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleGroups.sustains.map((char) => {
                const isOwned = ownedSet.has(char.id);
                return (
                  <Link
                    key={char.id}
                    to="/characters/$characterId"
                    params={{ characterId: char.id }}
                    className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] hover:border-[#dfb86c]/60 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CharacterAvatar
                        characterId={char.id}
                        name={char.name}
                        rarity={char.rarity}
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#f0f3fa] block">{char.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-[#9ba5be] font-mono">
                          <PathIcon path={char.path} size={11} />
                          <span>{char.path}</span>
                        </div>
                      </div>
                    </div>
                    {isOwned ? (
                      <span className="text-[10px] font-mono font-bold text-[#68d391] bg-[#68d391]/10 px-1.5 py-0.5 rounded-xs">
                        Owned
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#718096] bg-[#718096]/10 px-1.5 py-0.5 rounded-xs">
                        Unowned
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Category 2: Primary Carries */}
          <div className="p-5 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2940] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xs bg-[#101524] border border-[#1f2940] text-[#e53e3e]">
                  <Swords className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#f0f3fa]">Primary Carries</h2>
                  <p className="text-[10px] text-[#5c6882]">
                    Hypercarries, Break DPS, Elation Carries, and core damage dealers
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-[#9ba5be]">
                Roster Coverage:{" "}
                <span className="font-bold text-[#68d391]">
                  {roleGroups.carries.filter((c) => ownedSet.has(c.id)).length} / {roleGroups.carries.length} Owned
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleGroups.carries.map((char) => {
                const isOwned = ownedSet.has(char.id);
                return (
                  <Link
                    key={char.id}
                    to="/characters/$characterId"
                    params={{ characterId: char.id }}
                    className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] hover:border-[#dfb86c]/60 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CharacterAvatar
                        characterId={char.id}
                        name={char.name}
                        rarity={char.rarity}
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#f0f3fa] block">{char.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-[#9ba5be] font-mono">
                          <ElementIcon element={char.element} size={11} />
                          <span>{char.element}</span>
                        </div>
                      </div>
                    </div>
                    {isOwned ? (
                      <span className="text-[10px] font-mono font-bold text-[#68d391] bg-[#68d391]/10 px-1.5 py-0.5 rounded-xs">
                        Owned
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#718096] bg-[#718096]/10 px-1.5 py-0.5 rounded-xs">
                        Unowned
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Category 3: Amplifiers */}
          <div className="p-5 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2940] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xs bg-[#101524] border border-[#1f2940] text-[#dfb86c]">
                  <Wand2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#f0f3fa]">Amplifiers & Supports</h2>
                  <p className="text-[10px] text-[#5c6882]">
                    Buffers, Debuffers, and Energy Batteries
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-[#9ba5be]">
                Roster Coverage:{" "}
                <span className="font-bold text-[#68d391]">
                  {roleGroups.amplifiers.filter((c) => ownedSet.has(c.id)).length} / {roleGroups.amplifiers.length} Owned
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleGroups.amplifiers.map((char) => {
                const isOwned = ownedSet.has(char.id);
                return (
                  <Link
                    key={char.id}
                    to="/characters/$characterId"
                    params={{ characterId: char.id }}
                    className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] hover:border-[#dfb86c]/60 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CharacterAvatar
                        characterId={char.id}
                        name={char.name}
                        rarity={char.rarity}
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#f0f3fa] block">{char.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-[#9ba5be] font-mono">
                          <PathIcon path={char.path} size={11} />
                          <span>{char.path}</span>
                        </div>
                      </div>
                    </div>
                    {isOwned ? (
                      <span className="text-[10px] font-mono font-bold text-[#68d391] bg-[#68d391]/10 px-1.5 py-0.5 rounded-xs">
                        Owned
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#718096] bg-[#718096]/10 px-1.5 py-0.5 rounded-xs">
                        Unowned
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
