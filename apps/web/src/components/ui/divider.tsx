import * as React from "react";
import { cn } from "../../lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  withDiamond?: boolean;
  orientation?: "horizontal" | "vertical";
}

export function Divider({
  className,
  withDiamond = true,
  orientation = "horizontal",
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("relative mx-2 inline-flex h-full w-[1px] bg-[#1f2940]", className)}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn("relative flex items-center justify-center my-4 w-full", className)}
      {...props}
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#26334f] to-transparent" />
      {withDiamond && (
        <div className="absolute flex items-center justify-center bg-[#090c13] px-2">
          <div className="h-2 w-2 rotate-45 border border-[#dfb86c]/70 bg-[#dfb86c]/20" />
        </div>
      )}
    </div>
  );
}
