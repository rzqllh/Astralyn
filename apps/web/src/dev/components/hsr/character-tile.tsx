import * as React from "react";
import { cn } from "../../../lib/utils";
import type { CharacterFixture } from "../../../../tests/fixtures/ui-fixtures";
import { GameAssetImage } from "../game-asset-image";

export interface CharacterTileProps extends React.HTMLAttributes<HTMLDivElement> {
  character: CharacterFixture;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function CharacterTile({
  character,
  selected = false,
  disabled = false,
  onClick,
  className,
  ...props
}: CharacterTileProps) {
  const is5Star = character.rarity === 5;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      aria-label={`${character.name}, ${character.rarity}-Star ${character.element} ${character.path}`}
      onClick={() => !disabled && onClick?.()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xs border transition-all duration-200 select-none cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-[#dfb86c]",
        // 5★ vs 4★ Rarity Background Gradient & Base Border
        is5Star
          ? "border-[#d89f37]/45 bg-gradient-to-b from-[#1f190e] via-[#141824] to-[#0c0f18] hover:border-[#dfb86c]"
          : "border-[#9d7fe6]/45 bg-gradient-to-b from-[#1a1426] via-[#141824] to-[#0c0f18] hover:border-[#dfb86c]",
        // Selected state styling
        selected &&
          "border-[#dfb86c] ring-2 ring-[#dfb86c]/70 shadow-[0_0_16px_rgba(223,184,108,0.35)]",
        // Disabled state styling
        disabled && "opacity-40 cursor-not-allowed hover:border-[#1f2940] focus:ring-0",
        className
      )}
      {...props}
    >
      {/* Top Header Row: Path Icon & Rarity Tag */}
      <div className="flex items-center justify-between p-2 z-10">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-xs p-0.5 bg-black/40 border border-white/10 backdrop-blur-xs">
            <GameAssetImage
              entityType="path_icon"
              entityId={character.path}
              alt={character.path}
              variant="icon"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-xs font-mono font-medium text-[#9ba5be] uppercase">
            {character.path}
          </span>
        </div>

        {/* 5★ / 4★ Rarity Indicator */}
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-xs text-xs font-mono font-black tracking-widest",
            is5Star
              ? "bg-[#d89f37]/20 text-[#f4d38f] border border-[#d89f37]/50"
              : "bg-[#9d7fe6]/20 text-[#c4b5fd] border border-[#9d7fe6]/50"
          )}
        >
          {character.rarity}★
        </span>
      </div>

      {/* Center Character Artwork Illustration Container */}
      <div className="relative h-28 w-full overflow-hidden bg-[#0a0d16] flex items-center justify-center">
        <GameAssetImage
          entityType="character_preview"
          entityId={character.id}
          alt={character.name}
          variant="preview"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Subtle Element Icon Overlay in top-right of image */}
        <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 border border-white/20 p-0.5 backdrop-blur-xs flex items-center justify-center">
          <GameAssetImage
            entityType="element_icon"
            entityId={character.element}
            alt={character.element}
            variant="icon"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Level / Status badge overlay at bottom right of image */}
        {character.level && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-xs bg-[#090c13]/85 border border-[#1f2940] text-[10px] font-mono font-bold text-[#9ba5be]">
            Lv.{character.level}
          </div>
        )}
      </div>

      {/* Bottom Footer: Character Name, Role, and Eidolon Chip */}
      <div className="p-2.5 bg-[#090c13]/90 border-t border-[#1a2338] flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-[#f0f3fa] truncate group-hover:text-[#dfb86c] transition-colors">
            {character.name}
          </h3>
          <p className="text-xs text-[#9ba5be] truncate">{character.role}</p>
        </div>

        {character.eidolon !== undefined && (
          <span
            className={cn(
              "shrink-0 font-mono text-xs font-bold px-1.5 py-0.5 rounded-xs border",
              character.eidolon > 0
                ? "border-[#dfb86c]/50 bg-[#dfb86c]/15 text-[#dfb86c]"
                : "border-[#1f2940] bg-[#101524] text-[#9ba5be]"
            )}
          >
            E{character.eidolon}
          </span>
        )}
      </div>

      {/* Selected Gold Active Notch */}
      {selected && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rotate-45 bg-[#dfb86c] shadow-[0_0_6px_#dfb86c]" />
      )}
    </div>
  );
}
