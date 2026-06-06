import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      aria-invalid={error ? "true" : "false"}
      className={cn(
        "flex h-11 w-full rounded-xl border bg-slate-950/50 px-4 py-2 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
        // Conditional Tailwind styling based on error state
        error
          ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
          : "border-slate-700/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
export { Input };
