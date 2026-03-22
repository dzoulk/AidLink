import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VolunteerStatus } from "@/types";
import { VOLUNTEER_STATUS_COLORS } from "@/types";

const STATUS_LABELS: Record<VolunteerStatus, string> = {
  AVAILABLE: "Available",
  INTERESTED: "Interested",
  ASSIGNED: "Assigned",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  COMPLETED: "Completed",
  OFFLINE: "Offline",
};

interface StatusBadgeProps {
  status: VolunteerStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status as VolunteerStatus;
  const colorClass = VOLUNTEER_STATUS_COLORS[s] ?? VOLUNTEER_STATUS_COLORS.AVAILABLE;
  const label = STATUS_LABELS[s] ?? status;
  return (
    <Badge variant="outline" className={cn(colorClass, "border-0", className)}>
      {label}
    </Badge>
  );
}
