import * as React from "react";
import type { AssetEntityType, AssetVariant } from "@astralyn/shared";
import { getAssetUrl } from "../../lib/assets";
import { cn } from "../../lib/utils";

export interface GameAssetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  entityType: AssetEntityType;
  entityId: string;
  variant?: AssetVariant;
  alt: string;
  fallbackLabel?: string;
  fallbackIcon?: React.ReactNode;
  aspectRatio?: "square" | "portrait" | "preview" | "wide";
  className?: string;
}

export function GameAssetImage({
  entityType,
  entityId,
  variant = "icon",
  alt,
  fallbackLabel,
  fallbackIcon,
  aspectRatio = "square",
  className,
  ...props
}: GameAssetImageProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const assetUrl = React.useMemo(() => {
    return getAssetUrl(entityType, entityId, variant);
  }, [entityType, entityId, variant]);

  // If asset URL is missing, or error triggered, render deliberate Astralyn fallback
  if (!assetUrl || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-xs border border-[#1f2940] bg-gradient-to-br from-[#121828] to-[#090c13] text-[#dfb86c] select-none",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "portrait" && "aspect-[3/4]",
          aspectRatio === "preview" && "aspect-[16/9]",
          className
        )}
      >
        {fallbackIcon ? (
          fallbackIcon
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
            {/* Astralyn Emblem Mini Silhouette */}
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="h-5 w-5 rotate-45 border border-[#dfb86c]/60 bg-[#161f33]" />
              <div className="absolute h-1.5 w-1.5 rotate-45 bg-[#dfb86c]" />
            </div>
            {fallbackLabel && (
              <span className="text-[10px] font-mono font-bold tracking-tight text-[#9ba5be] truncate max-w-full">
                {fallbackLabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xs bg-[#090c13]/50 select-none",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "portrait" && "aspect-[3/4]",
        aspectRatio === "preview" && "aspect-[16/9]",
        className
      )}
    >
      <img
        src={assetUrl}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "h-full w-full object-contain transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        {...props}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-[#121828]/60" />
      )}
    </div>
  );
}
