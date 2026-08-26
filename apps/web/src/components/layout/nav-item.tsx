import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "../../lib/utils";

export interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NavItem({
  to,
  icon,
  label,
  badge,
  active,
  onClick,
  className,
}: NavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-semibold tracking-wide transition-all duration-150 select-none",
        active
          ? "bg-gradient-to-r from-[#221c0e] via-[#161c2e] to-[#0f1422] text-[#f4d38f] border-l-2 border-[#dfb86c] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          : "text-[#9ba5be] hover:bg-[#131929] hover:text-[#f0f3fa]",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 transition-transform duration-150 group-hover:scale-110">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>

      {badge && (
        <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase bg-[#dfb86c]/20 text-[#dfb86c] border border-[#dfb86c]/40">
          {badge}
        </span>
      )}
    </Link>
  );
}
