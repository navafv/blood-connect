import React from "react";
import { ShieldCheck, Clock, Ban, HelpCircle } from "lucide-react";
import { Badge } from "../ui/Badge";

const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Available",
    icon: ShieldCheck,
    variant: "success",
  },
  UNAVAILABLE: {
    label: "Resting",
    icon: Clock,
    variant: "warning",
  },
  DEFERRED: {
    label: "Deferred",
    icon: Ban,
    variant: "danger",
  },
};

export function StatusBadge({ status, className = "" }) {
  // Gracefully handle missing or incorrectly cased status strings
  const normalizedStatus = status?.toUpperCase();

  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || "Unknown",
    icon: HelpCircle,
    variant: "default",
  };

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`gap-1.5 px-2.5 py-1 flex items-center w-fit ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-semibold tracking-wide">{config.label}</span>
    </Badge>
  );
}
