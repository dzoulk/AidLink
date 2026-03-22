import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IncidentVerificationStatus } from "@/types";

const VERIFICATION_STYLES: Record<
  IncidentVerificationStatus,
  { class: string; label: string }
> = {
  UNVERIFIED: { class: "bg-red-500/20 text-red-700 border-red-200", label: "Unverified" },
  PARTIALLY_VERIFIED: {
    class: "bg-amber-500/20 text-amber-700 border-amber-200",
    label: "Partially Verified",
  },
  VERIFIED: {
    class: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    label: "Verified",
  },
  FALSE_REPORT: {
    class: "bg-gray-400/20 text-gray-600 border-gray-300",
    label: "False Report",
  },
  DUPLICATE: {
    class: "bg-slate-400/20 text-slate-600 border-slate-300",
    label: "Duplicate",
  },
};

const ORGANIZER_LABELS: Record<string, string> = {
  UNVERIFIED: "Initial",
  PARTIALLY_VERIFIED: "Confident",
  VERIFIED: "Verified",
};

const ORGANIZER_STYLES: Record<string, string> = {
  UNVERIFIED: "bg-red-500/15 text-red-700 border-red-300",
  PARTIALLY_VERIFIED: "bg-amber-500/15 text-amber-700 border-amber-300",
  VERIFIED: "bg-green-500/15 text-green-700 border-green-300",
};

interface VerificationBadgeProps {
  status: IncidentVerificationStatus | string;
  className?: string;
  /** Use organizer labels (Initial, Confident, Verified) */
  organizerLabels?: boolean;
}

export function VerificationBadge({ status, className, organizerLabels }: VerificationBadgeProps) {
  const style = VERIFICATION_STYLES[status as IncidentVerificationStatus] ?? VERIFICATION_STYLES.UNVERIFIED;
  const colorClass = organizerLabels ? (ORGANIZER_STYLES[status] ?? style.class) : style.class;
  const label = organizerLabels ? (ORGANIZER_LABELS[status] ?? style.label) : style.label;
  return (
    <Badge variant="outline" className={cn(colorClass, "border", className)}>
      {label}
    </Badge>
  );
}
