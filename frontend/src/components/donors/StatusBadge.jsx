import React from "react";
import { ShieldCheck, Clock, Ban, HelpCircle } from "lucide-react";
import { Badge } from "../ui/Badge";

const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Available",
    icon: ShieldCheck,
    variant: "success",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  UNAVAILABLE: {
    label: "Resting",
    icon: Clock,
    variant: "warning",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  DEFERRED: {
    label: "Deferred",
    icon: Ban,
    variant: "danger",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

export function StatusBadge({ status, className = "" }) {
  // Gracefully handle missing or incorrectly cased status strings
  const normalizedStatus = status?.toUpperCase();

  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || "Unknown",
    icon: HelpCircle,
    variant: "default",
    className: "bg-slate-800 text-slate-400 border-slate-700",
  };

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`gap-1.5 px-2.5 py-1 flex items-center w-fit ${config.className} ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-semibold tracking-wide">{config.label}</span>
    </Badge>
  );
}
