import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pills" | "parchment";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "border-b border-[#1f2940] bg-transparent gap-2",
    pills: "bg-[#0d121f] p-1 border border-[#1f2940] rounded-sm gap-1",
    parchment: "border-b border-[#d4ccbd] bg-transparent gap-2",
  }[variant];

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center text-[#9ba5be] select-none",
        variantStyles,
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "pills" | "parchment";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default:
      "relative px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 hover:text-[#f0f3fa] data-[state=active]:text-[#dfb86c] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-[#dfb86c] data-[state=active]:after:shadow-[0_0_8px_#dfb86c]",
    pills:
      "px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150 hover:text-[#f0f3fa] data-[state=active]:bg-[#dfb86c] data-[state=active]:text-[#10141e] data-[state=active]:font-semibold shadow-xs",
    parchment:
      "relative px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#565f75] hover:text-[#181d28] data-[state=active]:text-[#181d28] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-[#a8813a]",
  }[variant];

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap cursor-pointer disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#dfb86c]",
        variantStyles,
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#dfb86c]",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
