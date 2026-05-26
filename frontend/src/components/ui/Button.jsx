import React from "react";
import { cn } from "../../lib/utils";

const Button = React.forwardRef(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const variants = {
      primary:
        "bg-rose-600 text-white hover:bg-rose-500 shadow-lg border border-transparent",
      secondary:
        "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 shadow-sm",
      outline:
        "border border-slate-700 bg-transparent text-slate-300 hover:text-white hover:bg-slate-800",
      ghost:
        "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100 border border-transparent",
      danger:
        "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20",
    };

    const sizes = {
      default: "h-11 px-5 py-2",
      sm: "h-9 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-11 w-11 justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 tracking-wide",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
export { Button };
