import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={error ? "true" : "false"}
        autoComplete={
          props.name === "email"
            ? "email"
            : props.name === "password"
              ? "current-password"
              : "off"
        }
        spellCheck="false"
        className={cn(
          "flex h-11 w-full rounded-xl border px-4 py-2 text-sm shadow-sm transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          // Light mode defaults
          "bg-white text-slate-900 placeholder:text-slate-400 focus:bg-slate-50",
          // Dark mode overrides
          "dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950 dark:shadow-inner",
          // Conditional styling based on error state
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/80 dark:focus:ring-1 dark:focus:ring-red-500/30"
            : "border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700/80 dark:focus:border-rose-500 dark:focus:ring-1 dark:focus:ring-rose-500/30",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
export { Input };
