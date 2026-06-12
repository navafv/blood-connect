import React from "react";
import { cn } from "../../lib/utils";

const Button = React.forwardRef(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const variants = {
      primary:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-md border border-transparent dark:hover:bg-rose-500 dark:shadow-lg",
      secondary:
        "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border-slate-700",
      outline:
        "border border-slate-200 bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800",
      ghost:
        "hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent dark:hover:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-100",
      danger:
        "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500 dark:hover:text-white dark:border-red-500/20",
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
          "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 tracking-wide",
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
