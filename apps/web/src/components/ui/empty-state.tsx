import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = <Sparkles className="h-8 w-8 text-[#dfb86c]/70" />,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-sm border border-[#1f2940] bg-[#0c101c]/60",
        className
      )}
      {...props}
    >
      <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-sm border border-[#26334f] bg-[#111726]">
        {icon}
        <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-[#dfb86c]" />
      </div>
      <h3 className="text-sm font-bold tracking-wide uppercase text-[#f0f3fa]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-[#9ba5be] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
