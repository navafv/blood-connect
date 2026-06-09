import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "peer flex h-11 w-full appearance-none rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-2 pr-11 text-sm text-slate-100 shadow-inner transition-all duration-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none transition-colors duration-200 peer-focus:text-rose-500" />
    </div>
  );
});

Select.displayName = "Select";
export { Select };
