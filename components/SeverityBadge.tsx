import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const getSeverityStyle = (score: number) => {
  if (score >= 8) return "bg-red-500/20 text-red-700 border-red-200";
  if (score >= 6) return "bg-orange-500/20 text-orange-700 border-orange-200";
  if (score >= 4) return "bg-amber-500/20 text-amber-700 border-amber-200";
  return "bg-slate-500/20 text-slate-600 border-slate-200";
};

interface SeverityBadgeProps {
  score: number;
  className?: string;
}

export function SeverityBadge({ score, className }: SeverityBadgeProps) {
  const colorClass = getSeverityStyle(score);
  return (
    <Badge variant="outline" className={cn(colorClass, "border", className)}>
      {score}/10
    </Badge>
  );
}
