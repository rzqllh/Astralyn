import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "gold"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "rarity5"
    | "rarity4"
    | "parchment";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  icon,
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  }[size];

  const variantStyles = {
    default: "bg-[#161e32] text-[#9ba5be] border border-[#26334f]",
    gold: "bg-[#dfb86c]/15 text-[#dfb86c] border border-[#dfb86c]/40 font-semibold",
    secondary: "bg-[#1f2940] text-[#f0f3fa] border border-[#303f5e]",
    outline: "bg-transparent text-[#9ba5be] border border-[#26334f]",
    success: "bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/40",
    warning: "bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/40",
    danger: "bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/40",
    info: "bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40",
    rarity5:
      "bg-[#d89f37]/20 text-[#f3be53] border border-[#d89f37]/60 font-semibold shadow-xs",
    rarity4:
      "bg-[#9d7fe6]/20 text-[#c4b5fd] border border-[#9d7fe6]/50 font-semibold shadow-xs",
    parchment: "bg-[#d4ccbd]/40 text-[#181d28] border border-[#b8ae9d] font-semibold",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-mono font-medium rounded-xs tracking-wide uppercase select-none",
        sizeStyles,
        variantStyles,
        className
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

export function RarityBadge({ rarity }: { rarity: 5 | 4 | number }) {
  return (
    <Badge variant={rarity === 5 ? "rarity5" : "rarity4"} size="sm" className="font-bold">
      {rarity === 5 ? "5★ GOLD" : "4★ VIOLET"}
    </Badge>
  );
}

export function ElementBadge({
  element,
  className,
}: {
  element:
    "Physical" | "Fire" | "Ice" | "Lightning" | "Wind" | "Quantum" | "Imaginary" | string;
  className?: string;
}) {
  const colorMap: Record<string, string> = {
    Physical: "text-[#abb2bf] border-[#abb2bf]/40 bg-[#abb2bf]/10",
    Fire: "text-[#f87171] border-[#f87171]/40 bg-[#f87171]/10",
    Ice: "text-[#38bdf8] border-[#38bdf8]/40 bg-[#38bdf8]/10",
    Lightning: "text-[#c084fc] border-[#c084fc]/40 bg-[#c084fc]/10",
    Wind: "text-[#34d399] border-[#34d399]/40 bg-[#34d399]/10",
    Quantum: "text-[#818cf8] border-[#818cf8]/40 bg-[#818cf8]/10",
    Imaginary: "text-[#fbbf24] border-[#fbbf24]/40 bg-[#fbbf24]/10",
  };

  const style = colorMap[element] || "text-[#9ba5be] border-[#26334f] bg-[#161e32]";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium rounded-xs border uppercase tracking-wider",
        style,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{element}</span>
    </div>
  );
}

export function ConfidenceBadge({
  level,
}: {
  level: "High" | "Medium" | "Low" | string;
}) {
  const variant =
    level === "High" ? "success" : level === "Medium" ? "warning" : "default";
  return (
    <Badge variant={variant} size="sm">
      {level} Confidence
    </Badge>
  );
}
