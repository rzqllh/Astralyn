// apps/web/src/components/ui/game-asset.tsx
import * as React from "react";
import type { CombatElement, CombatPath } from "@astralyn/shared";

// Normalization mapping for canonical character IDs to dev asset filenames
function normalizeCharacterAssetId(id: string): string {
  const clean = id.toLowerCase().trim().replace(/-/g, "_");
  if (clean === "archer_acheron") return "acheron";
  return clean;
}

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
  const normalizedId = normalizeCharacterAssetId(characterId);

  // In DEV mode, attempt to load the candidate game asset icon
  const devSrc = import.meta.env.DEV && !loadFailed
    ? `/src/dev/game-assets/v1.0.0/characters/${normalizedId}_icon.png`
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
