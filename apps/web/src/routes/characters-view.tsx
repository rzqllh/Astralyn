// apps/web/src/routes/characters-view.tsx
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCharacters } from "../lib/knowledge/use-knowledge";
import { useRoster } from "../features/roster";
import { CharacterAvatar, ElementIcon, PathIcon } from "../components/ui/game-asset";
import { Button } from "../components/ui/button";
import type { CombatElement, CombatPath } from "@astralyn/shared";

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

export function CharactersView() {
  const { characters, loading: knowledgeLoading } = useCharacters();
  const { roster } = useRoster();

  const [search, setSearch] = React.useState("");
  const [selectedPath, setSelectedPath] = React.useState<string>("all");
  const [selectedElement, setSelectedElement] = React.useState<string>("all");
  const [selectedRarity, setSelectedRarity] = React.useState<string>("all");
  const [selectedOwnership, setSelectedOwnership] = React.useState<string>("all");

  const rosterMap = React.useMemo(() => {
    const map = new Map<string, { level: number; eidolon: number; isOwned: boolean }>();
    for (const r of roster) {
      if (r.isOwned !== false) {
        map.set(r.characterId, {
          level: r.level ?? 80,
          eidolon: r.eidolon ?? 0,
          isOwned: true,
        });
      }
    }
    return map;
  }, [roster]);

  const filteredCharacters = React.useMemo(() => {
    return characters.filter((c) => {
      // 1. Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesPath = c.path.toLowerCase().includes(query);
        const matchesElement = c.element.toLowerCase().includes(query);
        const matchesRole = c.roles.some((r) => r.toLowerCase().includes(query));
        if (!matchesName && !matchesPath && !matchesElement && !matchesRole) {
          return false;
        }
      }

      // 2. Path filter
      if (selectedPath !== "all" && c.path !== selectedPath) {
        return false;
      }

      // 3. Element filter
      if (selectedElement !== "all" && c.element !== selectedElement) {
        return false;
      }

      // 4. Rarity filter
      if (selectedRarity !== "all" && String(c.rarity) !== selectedRarity) {
        return false;
      }

      // 5. Ownership filter
      if (selectedOwnership === "owned" && !rosterMap.has(c.id)) {
        return false;
      }
      if (selectedOwnership === "unowned" && rosterMap.has(c.id)) {
        return false;
      }

      return true;
    });
  }, [characters, search, selectedPath, selectedElement, selectedRarity, selectedOwnership, rosterMap]);

  const resetFilters = () => {
    setSearch("");
    setSelectedPath("all");
    setSelectedElement("all");
    setSelectedRarity("all");
    setSelectedOwnership("all");
  };

  return (
    <div className="space-y-6" data-testid="characters-catalog-view">
      {/* Header */}
      <div className="border-b border-[#1a2338] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
            Canonical Directory
          </span>
          <span className="text-[10px] font-mono text-[#9ba5be]">• Version 4.5 Verified</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa] mt-1">
          Characters Database
        </h1>
        <p className="text-xs text-[#9ba5be] mt-1 max-w-2xl">
          Verified canonical Honkai: Star Rail character catalog. Filter by combat path, element, rarity, and roster ownership status.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ba5be]" />
            <input
              type="text"
              placeholder="Search by character name, path, element, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#101524] border border-[#1f2940] rounded-xs text-xs text-[#f0f3fa] placeholder-[#5c6882] focus:border-[#dfb86c] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ba5be] hover:text-[#f0f3fa]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Rarity Selector */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="px-3 py-1.5 bg-[#101524] border border-[#1f2940] rounded-xs text-xs font-mono text-[#f0f3fa] focus:border-[#dfb86c] focus:outline-none cursor-pointer"
          >
            <option value="all">Rarity: All</option>
            <option value="5">5★ Gold</option>
            <option value="4">4★ Purple</option>
          </select>

          {/* Ownership Selector */}
          <select
            value={selectedOwnership}
            onChange={(e) => setSelectedOwnership(e.target.value)}
            className="px-3 py-1.5 bg-[#101524] border border-[#1f2940] rounded-xs text-xs font-mono text-[#f0f3fa] focus:border-[#dfb86c] focus:outline-none cursor-pointer"
          >
            <option value="all">Roster: All</option>
            <option value="owned">Owned Only</option>
            <option value="unowned">Unowned Only</option>
          </select>
        </div>

        {/* Path & Element Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#151c2e]">
          <span className="text-[10px] font-mono text-[#5c6882] uppercase mr-1">Path:</span>
          <button
            type="button"
            onClick={() => setSelectedPath("all")}
            className={`px-2 py-0.5 rounded-xs text-[11px] font-mono transition-colors cursor-pointer ${
              selectedPath === "all"
                ? "bg-[#dfb86c] text-[#090c13] font-bold"
                : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa] border border-[#1a2338]"
            }`}
          >
            All
          </button>
          {PATHS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPath(p === selectedPath ? "all" : p)}
              className={`px-2 py-0.5 rounded-xs text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                selectedPath === p
                  ? "bg-[#dfb86c] text-[#090c13] font-bold"
                  : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa] border border-[#1a2338]"
              }`}
            >
              <PathIcon path={p} size={12} />
              <span>{p}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#5c6882] uppercase mr-1">Element:</span>
          <button
            type="button"
            onClick={() => setSelectedElement("all")}
            className={`px-2 py-0.5 rounded-xs text-[11px] font-mono transition-colors cursor-pointer ${
              selectedElement === "all"
                ? "bg-[#dfb86c] text-[#090c13] font-bold"
                : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa] border border-[#1a2338]"
            }`}
          >
            All
          </button>
          {ELEMENTS.map((el) => (
            <button
              key={el}
              type="button"
              onClick={() => setSelectedElement(el === selectedElement ? "all" : el)}
              className={`px-2 py-0.5 rounded-xs text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                selectedElement === el
                  ? "bg-[#dfb86c] text-[#090c13] font-bold"
                  : "bg-[#101524] text-[#9ba5be] hover:text-[#f0f3fa] border border-[#1a2338]"
              }`}
            >
              <ElementIcon element={el} size={12} />
              <span>{el}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Results */}
      {knowledgeLoading ? (
        <div className="p-12 text-center text-xs text-[#9ba5be]">
          Loading canonical database...
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="p-12 text-center border border-[#1a2338] bg-[#0c101a] rounded-xs space-y-3">
          <p className="text-xs font-semibold text-[#f0f3fa]">No characters matched your filters</p>
          <p className="text-[11px] text-[#9ba5be]">Try clearing your search query or reset filter pills.</p>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCharacters.map((char) => {
            const is5Star = char.rarity === 5;
            const rosterItem = rosterMap.get(char.id);
            const isOwned = rosterItem !== undefined;

            return (
              <Link
                key={char.id}
                to="/characters/$characterId"
                params={{ characterId: char.id }}
                className="group block"
              >
                <div
                  className={`p-3.5 rounded-xs border border-[#1a2338] bg-[#0c101a] flex flex-col justify-between h-full hover:border-[#dfb86c]/60 transition-all border-l-2 ${
                    is5Star ? "border-l-[#d89f37]" : "border-l-[#9d7fe6]"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top row: Avatar & basic metadata */}
                    <div className="flex items-start gap-3">
                      <CharacterAvatar
                        characterId={char.id}
                        name={char.name}
                        rarity={char.rarity}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h2 className="text-sm font-bold text-[#f0f3fa] group-hover:text-[#dfb86c] transition-colors truncate">
                            {char.name}
                          </h2>
                          <span
                            className={`text-[10px] font-mono px-1 py-0.2 rounded-xs shrink-0 ${
                              is5Star ? "text-[#dfb86c] bg-[#dfb86c]/10" : "text-[#b096f2] bg-[#9d7fe6]/10"
                            }`}
                          >
                            {char.rarity}★
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-[#9ba5be] font-mono mt-0.5">
                          <PathIcon path={char.path} size={11} />
                          <span>{char.path}</span>
                          <span>•</span>
                          <ElementIcon element={char.element} size={11} />
                          <span>{char.element}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role Tags */}
                    <div className="flex flex-wrap gap-1">
                      {char.roles.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono bg-[#101524] border border-[#1f2940] text-[#9ba5be]"
                        >
                          {r.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Live Roster Ownership Badge */}
                  <div className="pt-3 mt-3 border-t border-[#151c2e] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#5c6882]">Roster Status:</span>
                    {isOwned ? (
                      <span className="text-[#68d391] bg-[#68d391]/10 px-1.5 py-0.5 rounded-xs font-semibold">
                        Owned Lv.{rosterItem.level} E{rosterItem.eidolon}
                      </span>
                    ) : (
                      <span className="text-[#718096] bg-[#718096]/10 px-1.5 py-0.5 rounded-xs">
                        Unowned
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
