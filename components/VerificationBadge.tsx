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
    class: "bg-emerald-500/20 text-emerald-700 border-emerald-200",
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

interface VerificationBadgeProps {
  status: IncidentVerificationStatus | string;
  className?: string;
}

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const style = VERIFICATION_STYLES[status as IncidentVerificationStatus] ?? VERIFICATION_STYLES.UNVERIFIED;
  const { class: colorClass, label } = style;
  return (
    <Badge variant="outline" className={cn(colorClass, "border", className)}>
      {label}
    </Badge>
  );
}
