"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { VolunteerProfile, Assignment } from "@prisma/client";

interface VolunteerWithAssignments extends VolunteerProfile {
  assignments: (Assignment & { incident: { title: string } })[];
}

interface VolunteerTableProps {
  volunteers: VolunteerWithAssignments[];
  onSelectVolunteer?: (id: string) => void;
}

function formatSkills(skillsJson: string): string[] {
  try {
    const arr = JSON.parse(skillsJson);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function VolunteerTable({
  volunteers,
  onSelectVolunteer,
}: VolunteerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Skills</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Assigned To</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {volunteers.map((v) => (
          <TableRow
            key={v.id}
            className={onSelectVolunteer ? "cursor-pointer hover:bg-muted/50" : ""}
            onClick={() => onSelectVolunteer?.(v.id)}
          >
            <TableCell className="font-medium">{v.fullName}</TableCell>
            <TableCell className="text-sm">{v.phone || v.email}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {formatSkills(v.skills).slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={v.status} />
            </TableCell>
            <TableCell>{v.hasVehicle ? "Yes" : "No"}</TableCell>
            <TableCell className="text-sm">
              {v.assignments?.find((a) =>
                ["ASSIGNED", "CONFIRMED", "CHECKED_IN"].includes(a.status)
              )?.incident?.title ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
