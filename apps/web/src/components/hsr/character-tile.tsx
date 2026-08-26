import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CharacterFixture } from "../../lib/fixtures";

export interface CharacterTileProps {
  character: CharacterFixture;
  selected?: boolean;
  disabled?: boolean;
  stateOverride?: "default" | "hover" | "selected" | "disabled" | "trial" | "owned";
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CharacterTile({
  character,
  selected = false,
  disabled = false,
  stateOverride,
  onClick,
  className,
  size = "md",
}: CharacterTileProps) {
  const isSelected = stateOverride === "selected" || selected;
  const isDisabled = stateOverride === "disabled" || disabled;
  const isTrial = stateOverride === "trial" || character.status === "trial";
  const is5Star = character.rarity === 5;

  const elementColorMap: Record<string, string> = {
    Physical: "#abb2bf",
    Fire: "#f87171",
    Ice: "#38bdf8",
    Lightning: "#c084fc",
    Wind: "#34d399",
    Quantum: "#818cf8",
    Imaginary: "#fbbf24",
  };

  const elemColor = elementColorMap[character.element] || "#9ba5be";

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xs border transition-all duration-150 select-none cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#dfb86c]",
        // Dimensions
        size === "sm" && "w-28 h-36 p-2",
        size === "md" && "w-36 h-48 p-2.5",
        size === "lg" && "w-44 h-56 p-3",
        // Background & Border styling
        is5Star
          ? "bg-gradient-to-b from-[#1c1810] via-[#0f1422] to-[#07090f] border-[#d89f37]/40"
          : "bg-gradient-to-b from-[#181324] via-[#0f1422] to-[#07090f] border-[#9d7fe6]/40",
        // Hover state
        !isDisabled &&
          !isSelected &&
          "hover:border-[#dfb86c] hover:shadow-[0_0_12px_rgba(223,184,108,0.2)] hover:-translate-y-0.5",
        // Selected state
        isSelected &&
          "border-[#dfb86c] ring-2 ring-[#dfb86c] shadow-[0_0_16px_rgba(223,184,108,0.4)] bg-[#1a1710]",
        // Disabled state
        isDisabled && "opacity-40 grayscale pointer-events-none cursor-not-allowed",
        className
      )}
    >
      {/* Top Rarity Gradient Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          is5Star
            ? "bg-gradient-to-r from-[#d89f37] via-[#f3d48f] to-[#d89f37]"
            : "bg-gradient-to-r from-[#9d7fe6] via-[#d8b4fe] to-[#9d7fe6]"
        )}
      />

      {/* Top Metadata Row: Element + Eidolon/Trial Chips */}
      <div className="flex items-center justify-between w-full z-10">
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs border"
          style={{ borderColor: `${elemColor}40`, color: elemColor }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: elemColor }}
          />
          <span>{character.element.substring(0, 3)}</span>
        </div>

        <div className="flex items-center gap-1">
          {character.eidolon !== undefined && (
            <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold text-[#dfb86c] bg-[#dfb86c]/15 border border-[#dfb86c]/30">
              E{character.eidolon}
            </span>
          )}
          {isTrial && (
            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30 uppercase">
              Trial
            </span>
          )}
        </div>
      </div>

      {/* Character Center Silhouette / Avatar Graphic Placeholder */}
      <div className="relative flex flex-1 items-center justify-center my-1 z-0">
        <div
          className={cn(
            "flex items-center justify-center rounded-full border shadow-inner transition-transform duration-200 group-hover:scale-105",
            size === "sm" && "h-14 w-14 text-sm font-bold",
            size === "md" && "h-20 w-20 text-lg font-extrabold",
            size === "lg" && "h-24 w-24 text-xl font-black",
            is5Star
              ? "border-[#d89f37]/50 bg-gradient-to-tr from-[#2a1d08] to-[#121829] text-[#f4d38f]"
              : "border-[#9d7fe6]/50 bg-gradient-to-tr from-[#1c0d2e] to-[#121829] text-[#d8b4fe]"
          )}
        >
          {character.avatarInitials}
        </div>

        {/* Selected Checkmark Indicator Overlay */}
        {isSelected && (
          <div className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-xs bg-[#dfb86c] text-[#10141e] shadow-md">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Bottom Info Row: Name + Path + Rarity Stars */}
      <div className="w-full z-10 pt-1.5 border-t border-white/10 bg-black/40 -mx-2.5 -mb-2.5 px-2.5 pb-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold tracking-tight text-[#f0f3fa] truncate max-w-[90px]">
            {character.name}
          </h4>
          <span className="text-[10px] font-mono text-[#9ba5be] truncate">
            {character.path}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center text-[10px] text-[#f3be53]">
            {Array.from({ length: character.rarity }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
          {character.level && (
            <span className="text-[10px] font-mono text-[#626e89]">
              Lv. {character.level}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
