import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "peer flex h-11 w-full appearance-none rounded-xl border px-4 py-2 pr-11 text-sm shadow-sm transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          // Light Mode Defaults
          "bg-white border-slate-200 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20",
          // Dark Mode Overrides
          "dark:bg-slate-950/50 dark:border-slate-700/80 dark:text-slate-100 dark:shadow-inner dark:focus:border-rose-500 dark:focus:ring-1 dark:focus:ring-rose-500/30",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-colors duration-300 peer-focus:text-rose-600 dark:text-slate-500 dark:peer-focus:text-rose-400" />
    </div>
  );
});

Select.displayName = "Select";
export { Select };
