import * as React from "react";
import { cn } from "../../lib/utils";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  category?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  category,
  badge,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 md:flex-row md:items-center md:justify-between py-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {/* HSR Diamond Accent Icon */}
        <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
          <div className="h-3 w-3 rotate-45 border border-[#dfb86c] bg-[#dfb86c]/20" />
          <div className="absolute h-1.5 w-1.5 rotate-45 bg-[#dfb86c]" />
        </div>

        <div>
          {category && (
            <span className="block text-[10px] font-mono font-semibold tracking-widest uppercase text-[#dfb86c]">
              {category}
            </span>
          )}
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-[#f0f3fa] md:text-xl">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-[#9ba5be] mt-0.5 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>

      {action && <div className="mt-2 md:mt-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
