import { cn } from "@/lib/utils";

interface RoleReq {
  role: string;
  needed: number;
  filled: number;
}

interface RoleRequirementListProps {
  roles: RoleReq[];
  className?: string;
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function RoleRequirementList({ roles, className }: RoleRequirementListProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {roles.map((r) => {
        const shortage = Math.max(0, r.needed - r.filled);
        const hasShortage = shortage > 0;
        return (
          <div
            key={r.role}
            className={cn(
              "flex items-center justify-between text-sm",
              hasShortage && "text-amber-600 dark:text-amber-400"
            )}
          >
            <span>{formatRole(r.role)}</span>
            <span className="font-medium">
              {r.filled}/{r.needed}
              {hasShortage && (
                <span className="ml-1 text-xs">(-{shortage})</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
