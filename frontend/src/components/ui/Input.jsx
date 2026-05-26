import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-2 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 focus:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
export { Input };
