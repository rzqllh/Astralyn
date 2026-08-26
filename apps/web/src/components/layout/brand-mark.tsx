import { cn } from "../../lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      {/* Astralyn Original Celestial Emblem */}
      <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
        <div className="h-6 w-6 rotate-45 border-2 border-[#dfb86c] bg-gradient-to-br from-[#2a210d] to-[#0f1422] shadow-[0_0_10px_rgba(223,184,108,0.3)]" />
        <div className="absolute h-2.5 w-2.5 rotate-45 bg-[#f4d38f] shadow-[0_0_6px_#f4d38f]" />
        <div className="absolute -top-0.5 -right-0.5 h-1 w-1 rounded-full bg-[#dfb86c]" />
      </div>

      {!compact && (
        <div className="flex flex-col">
          <span className="text-base font-black tracking-wider text-gold-gradient uppercase leading-none">
            Astralyn
          </span>
          <span className="text-[9px] font-mono tracking-widest text-[#626e89] uppercase mt-0.5">
            HSR Companion
          </span>
        </div>
      )}
    </div>
  );
}
