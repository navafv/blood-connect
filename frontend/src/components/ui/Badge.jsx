import React from "react";
import { cn } from "../../lib/utils";

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    danger:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    primary:
      "bg-rose-600 text-white border-rose-600 dark:bg-rose-600/90 dark:border-rose-500",
    outline:
      "bg-transparent text-slate-600 border-slate-300 dark:text-slate-400 dark:border-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 border shadow-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
