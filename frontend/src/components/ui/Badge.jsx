import React from "react";
import { cn } from "../../lib/utils";

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-slate-800/80 text-slate-300 border-slate-700/80",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    primary: "bg-rose-600/90 text-white border-rose-500",
    outline: "bg-transparent text-slate-400 border-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors border shadow-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
