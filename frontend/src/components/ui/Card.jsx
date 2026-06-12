import React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl text-slate-900 shadow-xl relative overflow-hidden transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-2xl",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 relative z-10", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white transition-colors duration-300",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0 relative z-10", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
