import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "parchment";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      iconLeft,
      iconRight,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap font-medium tracking-wide transition-all duration-150 select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] [&>svg]:shrink-0";

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5 rounded-sm",
      md: "h-10 px-4 text-sm gap-2 rounded-sm",
      lg: "h-12 px-6 text-base gap-2.5 rounded-sm",
    }[size];

    const variantStyles = {
      // HSR Golden Action Button
      primary:
        "bg-gradient-to-b from-[#f4d38f] via-[#dfb86c] to-[#c79c4a] text-[#10141e] font-semibold border-t border-[#fff3cc] border-b border-[#9c752c] shadow-[0_2px_8px_rgba(223,184,108,0.25)] hover:brightness-110 hover:shadow-[0_4px_16px_rgba(223,184,108,0.4)]",
      // Deep Navy Framed Panel Button
      secondary:
        "bg-[#131929] text-[#f0f3fa] border border-[#26334f] hover:border-[#dfb86c]/60 hover:bg-[#1a233a] hover:text-[#f4d38f] shadow-sm",
      // Clean Gold Outlined
      outline:
        "bg-transparent text-[#dfb86c] border border-[#dfb86c]/50 hover:bg-[#dfb86c]/10 hover:border-[#dfb86c]",
      // Minimal Ghost
      ghost: "bg-transparent text-[#9ba5be] hover:bg-[#161e32] hover:text-[#f0f3fa]",
      // Danger Action
      danger:
        "bg-[#dc2626]/20 text-[#f87171] border border-[#dc2626]/40 hover:bg-[#dc2626]/30 hover:border-[#dc2626]",
      // HSR Parchment Surface Button
      parchment:
        "bg-[#eee8dc] text-[#181d28] font-semibold border border-[#d4ccbd] hover:bg-[#f7f3ec] shadow-sm",
    }[variant];

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(baseStyles, sizeStyles, variantStyles, className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, sizeStyles, variantStyles, className)}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      "aria-label": ariaLabel,
      children,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    }[size];

    return (
      <Button
        ref={ref}
        variant={variant}
        aria-label={ariaLabel}
        className={cn("p-0 shrink-0", sizeStyles, className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";
