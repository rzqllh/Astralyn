import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      error,
      helperText,
      label,
      id,
      iconLeft,
      iconRight,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#9ba5be]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {iconLeft && (
            <div className="pointer-events-none absolute left-3 flex items-center text-[#9ba5be]">
              {iconLeft}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-sm bg-[#0a0e1a] px-3.5 py-2 text-sm text-[#f0f3fa] placeholder:text-[#9ba5be]/70 border transition-colors duration-150",
              "border-[#1f2940] hover:border-[#303f5e] focus:border-[#dfb86c] focus:outline-hidden focus:ring-1 focus:ring-[#dfb86c]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              iconLeft && "pl-9",
              iconRight && "pr-9",
              error && "border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]",
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 flex items-center text-[#9ba5be]">
              {iconRight}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#f87171]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#9ba5be]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, helperText, label, id, children, disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#9ba5be]"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-sm bg-[#0a0e1a] px-3.5 py-2 text-sm text-[#f0f3fa] border transition-colors duration-150 cursor-pointer [color-scheme:dark]",
            "border-[#1f2940] hover:border-[#303f5e] focus:border-[#dfb86c] focus:outline-hidden focus:ring-1 focus:ring-[#dfb86c]",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error && "border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="text-xs text-[#f87171]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#9ba5be]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";
