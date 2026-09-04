// apps/web/src/components/ui/game-asset.tsx
import * as React from "react";
import type { CombatElement, CombatPath } from "@astralyn/shared";

// Explicit mapping of canonical character IDs to dev candidate asset icon paths
// Hard invariant: Exact canonical IDs only; no string normalization or conversion of hyphens.
const DEV_CHARACTER_ICON_MAP: Record<string, string> = {
  "acheron": "/src/dev/game-assets/v1.0.0/characters/acheron_icon.png",
  "aventurine": "/src/dev/game-assets/v1.0.0/characters/aventurine_icon.png",
  "aventurine-waveflair": "/src/dev/game-assets/v1.0.0/characters/aventurine_wf_icon.png",
  "castorice": "/src/dev/game-assets/v1.0.0/characters/castorice_icon.png",
  "firefly": "/src/dev/game-assets/v1.0.0/characters/firefly_icon.png",
  "gallagher": "/src/dev/game-assets/v1.0.0/characters/gallagher_icon.png",
  "robin": "/src/dev/game-assets/v1.0.0/characters/robin_icon.png",
  "the-herta": "/src/dev/game-assets/v1.0.0/characters/the_herta_icon.png",
  "tingyun": "/src/dev/game-assets/v1.0.0/characters/tingyun_icon.png",
};

export interface CharacterAvatarProps {
  characterId: string;
  name?: string;
  rarity?: 4 | 5 | number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CharacterAvatar({
  characterId,
  name,
  rarity = 5,
  size = "md",
  className = "",
}: CharacterAvatarProps) {
  const [loadFailed, setLoadFailed] = React.useState(false);

  const is5Star = rarity === 5;

  // In DEV mode, attempt to load candidate game asset icon via explicit canonical ID lookup
  const devSrc = import.meta.env.DEV && !loadFailed
    ? DEV_CHARACTER_ICON_MAP[characterId]
    : undefined;

  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-11 w-11 text-xs",
    lg: "h-14 w-14 text-sm",
  }[size];

  const initials = (name || characterId)
    .split(/[\s_-]+/)
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("") || "??";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xs border select-none ${sizeClasses} ${
        is5Star
          ? "border-[#d89f37]/40 bg-[#16130d]"
          : "border-[#9d7fe6]/40 bg-[#14101e]"
      } ${className}`}
    >
      {devSrc ? (
        <img
          src={devSrc}
          alt={name || characterId}
          onError={() => setLoadFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-mono font-bold ${
            is5Star ? "text-[#dfb86c]" : "text-[#bca4f5]"
          }`}
        >
          {initials}
        </div>
      )}

      {/* Subtle rarity indicator badge */}
      <div
        className={`absolute bottom-0 right-0 px-1 py-0.2 text-[8px] font-mono font-bold leading-none ${
          is5Star ? "bg-[#d89f37] text-[#090c13]" : "bg-[#9d7fe6] text-[#090c13]"
        }`}
      >
        {is5Star ? "5★" : "4★"}
      </div>
    </div>
  );
}

export interface ElementIconProps {
  element: CombatElement | string;
  size?: number;
  className?: string;
}

export function ElementIcon({
  element,
  size = 14,
  className = "",
}: ElementIconProps) {
  const [loadFailed, setLoadFailed] = React.useState(false);

  const devSrc = import.meta.env.DEV && !loadFailed && element
    ? `/src/dev/game-assets/v1.0.0/elements/${element}.png`
    : undefined;

  if (devSrc) {
    return (
      <img
        src={devSrc}
        alt={element}
        onError={() => setLoadFailed(true)}
        style={{ width: size, height: size }}
        className={`inline-block object-contain shrink-0 ${className}`}
      />
    );
  }

  // Fallback neutral bullet
  return (
    <span
      className={`inline-block rounded-full bg-[#dfb86c]/70 shrink-0 ${className}`}
      style={{ width: Math.max(6, size - 6), height: Math.max(6, size - 6) }}
      title={element}
    />
  );
}

export interface PathIconProps {
  path: CombatPath | string;
  size?: number;
  className?: string;
}

export function PathIcon({
  path,
  size = 14,
  className = "",
}: PathIconProps) {
  const [loadFailed, setLoadFailed] = React.useState(false);

  const devSrc = import.meta.env.DEV && !loadFailed && path
    ? `/src/dev/game-assets/v1.0.0/paths/${path}.png`
    : undefined;

  if (devSrc) {
    return (
      <img
        src={devSrc}
        alt={path}
        onError={() => setLoadFailed(true)}
        style={{ width: size, height: size }}
        className={`inline-block object-contain shrink-0 ${className}`}
      />
    );
  }

  // Fallback neutral diamond
  return (
    <span
      className={`inline-block rotate-45 border border-[#dfb86c]/70 shrink-0 ${className}`}
      style={{ width: Math.max(6, size - 6), height: Math.max(6, size - 6) }}
      title={path}
    />
  );
}
