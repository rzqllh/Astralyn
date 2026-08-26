import * as React from "react";
import { cn } from "../../lib/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "sunken" | "parchment" | "highlight" | "glass";
  chamfer?: boolean;
  bordered?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      className,
      variant = "default",
      chamfer = false,
      bordered = true,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: "bg-[#0d121f] text-[#f0f3fa]",
      raised: "bg-[#121829] text-[#f0f3fa]",
      sunken: "bg-[#07090f] text-[#f0f3fa]",
      parchment: "bg-[#eee8dc] text-[#181d28]",
      highlight: "bg-gradient-to-b from-[#141b2e] to-[#0e1322] text-[#f0f3fa]",
      glass: "bg-[#0d121f]/80 backdrop-blur-md text-[#f0f3fa]",
    }[variant];

    const borderStyles = bordered
      ? {
          default: "border border-[#1f2940]",
          raised: "border border-[#26334f] shadow-lg shadow-black/40",
          sunken: "border border-[#131926]",
          parchment: "border border-[#d4ccbd] shadow-sm",
          highlight:
            "border border-[#dfb86c]/60 shadow-[0_0_15px_rgba(223,184,108,0.15)]",
          glass: "border border-[#2b3752]/70 shadow-lg",
        }[variant]
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          "relative transition-colors duration-150",
          variantStyles,
          borderStyles,
          chamfer ? "clip-chamfer-sm" : "rounded-sm",
          className
        )}
        {...props}
      >
        {/* Subtle decorative gold corner tag when highlighted */}
        {variant === "highlight" && (
          <div className="absolute top-0 right-0 h-2 w-2 bg-[#dfb86c]" />
        )}
        {children}
      </div>
    );
  }
);
Panel.displayName = "Panel";

export function PanelHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-inherit px-5 py-3.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold tracking-wide uppercase text-inherit",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function PanelDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs opacity-75 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

export function PanelContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function PanelFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-inherit px-5 py-3 bg-black/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
