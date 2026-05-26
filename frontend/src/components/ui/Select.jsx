import React from "react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-2 pr-10 text-sm text-slate-100 shadow-inner transition-all duration-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50",
        "bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-position-[calc(100%-12px)_center] bg-no-repeat",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";
export { Select };
