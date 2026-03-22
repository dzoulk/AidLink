import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "warning" | "success";
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-slate-800/50 border-slate-700",
    warning: "bg-amber-500/10 border-amber-500/30",
    success: "bg-emerald-500/10 border-emerald-500/30",
  };

  return (
    <Card className={cn("overflow-hidden", variantStyles[variant], className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-0.5">{trend}</p>
            )}
          </div>
          <div className="rounded-lg bg-slate-900/80 p-2">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsOverviewProps {
  metrics: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    variant?: "default" | "warning" | "success";
  }>;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {metrics.map((m) => (
        <MetricCard key={m.title} {...m} />
      ))}
    </div>
  );
}
