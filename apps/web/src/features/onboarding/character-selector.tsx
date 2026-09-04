// apps/web/src/features/onboarding/character-selector.tsx
import * as React from "react";
import { useCharacters } from "../../lib/knowledge/use-knowledge";
import { Search, Check, Filter } from "lucide-react";
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

interface CharacterSelectorProps {
  selectedIds: Set<string>;
  excludedIds?: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

export function CharacterSelector({
  selectedIds,
  excludedIds,
  onToggle,
}: CharacterSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPath, setSelectedPath] = React.useState<CombatPath | "ALL">("ALL");
  const [selectedElement, setSelectedElement] = React.useState<CombatElement | "ALL">("ALL");

  const filter = React.useMemo(() => {
    return {
      path: selectedPath !== "ALL" ? selectedPath : undefined,
      element: selectedElement !== "ALL" ? selectedElement : undefined,
    };
  }, [selectedPath, selectedElement]);

  const { characters: allCharacters, loading, error } = useCharacters(filter);

  // Exclude characters that are already in the current roster
  const addableCharacters = React.useMemo(() => {
    if (!excludedIds || excludedIds.size === 0) {
      return allCharacters;
    }
    return allCharacters.filter((c) => !excludedIds.has(c.id));
  }, [allCharacters, excludedIds]);

  const filteredCharacters = React.useMemo(() => {
    if (!searchQuery.trim()) return addableCharacters;
    const q = searchQuery.toLowerCase().trim();
    return addableCharacters.filter((c) => c.name.toLowerCase().includes(q));
  }, [addableCharacters, searchQuery]);

  const handleToggle = React.useCallback(
    (id: string) => {
      if (excludedIds?.has(id)) return;
      onToggle(id);
    },
    [excludedIds, onToggle]
  );

  return (
    <div className="space-y-4" data-testid="character-selector">
      {/* Search & Filter Bar */}
      <div className="p-3 rounded-xs border border-[#1a2338] bg-[#0c101a] space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9ba5be]" />
          <input
            type="text"
            placeholder="Search characters by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#101524] border border-[#1f2940] rounded-xs text-xs text-[#f0f3fa] placeholder-[#9ba5be]/60 focus:border-[#dfb86c] focus:outline-none"
          />
        </div>

        {/* Element Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-mono text-[#9ba5be] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" /> Element:
          </span>
          <button
            type="button"
            onClick={() => setSelectedElement("ALL")}
            className={`px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
              selectedElement === "ALL"
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
              onClick={() => setSelectedElement(elem)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                selectedElement === elem
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
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-mono text-[#9ba5be] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" /> Path:
          </span>
          <button
            type="button"
            onClick={() => setSelectedPath("ALL")}
            className={`px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
              selectedPath === "ALL"
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
              onClick={() => setSelectedPath(path)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                selectedPath === path
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

      {/* Counter & Status */}
      <div className="flex items-center justify-between text-xs text-[#9ba5be]">
        <div>
          Showing <span className="text-[#f0f3fa] font-bold font-mono">{filteredCharacters.length}</span> characters
        </div>
        <div>
          Selected: <span className="text-[#dfb86c] font-bold font-mono">{selectedIds.size}</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#9ba5be]">Loading canonical characters...</div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-[#f87171] bg-[#f87171]/10 rounded-xs border border-[#f87171]/20">
          Failed to load characters: {error.message}
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#9ba5be] border border-dashed border-[#1f2940] rounded-xs">
          No characters match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[440px] overflow-y-auto p-1">
          {filteredCharacters.map((char) => {
            const isSelected = selectedIds.has(char.id);
            const is5Star = char.rarity === 5;

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => handleToggle(char.id)}
                className={`relative group p-2.5 rounded-xs text-left transition-all cursor-pointer border ${
                  isSelected
                    ? "border-[#dfb86c] bg-[#dfb86c]/10 shadow-[0_0_12px_rgba(223,184,108,0.2)]"
                    : is5Star
                    ? "border-[#d89f37]/30 bg-[#101524] hover:border-[#d89f37]/60"
                    : "border-[#9d7fe6]/30 bg-[#101524] hover:border-[#9d7fe6]/60"
                }`}
              >
                {/* Checkbox Badge */}
                <div
                  className={`absolute top-2 right-2 h-4 w-4 rounded-xs flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#dfb86c] text-[#090c13]"
                      : "border border-[#1f2940] bg-[#0c101a] group-hover:border-[#9ba5be]"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>

                {/* Character Avatar & Identity */}
                <div className="flex items-center gap-2 mb-2">
                  <CharacterAvatar
                    characterId={char.id}
                    name={char.name}
                    rarity={char.rarity}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-xs font-bold text-[#f0f3fa] truncate group-hover:text-[#dfb86c] transition-colors">
                      {char.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-[#9ba5be] mt-0.5">
                      <PathIcon path={char.path} size={11} />
                      <span className="truncate font-mono">{char.path}</span>
                    </div>
                  </div>
                </div>

                {/* Combat Element & Rarity Footer */}
                <div className="flex items-center justify-between text-[10px] text-[#9ba5be] pt-1.5 border-t border-[#1a2338]/60">
                  <div className="flex items-center gap-1">
                    <ElementIcon element={char.element} size={11} />
                    <span className="font-mono">{char.element}</span>
                  </div>
                  <span
                    className={`font-mono font-bold text-[10px] ${
                      is5Star ? "text-[#d89f37]" : "text-[#9d7fe6]"
                    }`}
                  >
                    {char.rarity}★
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
