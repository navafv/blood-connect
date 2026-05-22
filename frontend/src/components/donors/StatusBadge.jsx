import { Badge } from "../ui/Badge";

export function StatusBadge({ status, className }) {
  const config = {
    AVAILABLE: { label: "Available", variant: "success" },
    UNAVAILABLE: { label: "Unavailable", variant: "warning" },
    DEFERRED: { label: "Deferred", variant: "danger" },
  };

  // Fallback if status is missing or unrecognized
  const currentStatus = config[status] || {
    label: status || "Unknown",
    variant: "default",
  };

  return (
    <Badge variant={currentStatus.variant} className={className}>
      {currentStatus.label}
    </Badge>
  );
}
