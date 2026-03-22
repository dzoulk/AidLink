"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RoleRequirementList } from "@/components/RoleRequirementList";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, UserPlus } from "lucide-react";
import type { Incident, VolunteerProfile, Assignment } from "@prisma/client";

interface AssignmentPanelProps {
  incident: Incident;
  assignments: (Assignment & { volunteer: VolunteerProfile })[];
  availableVolunteers: VolunteerProfile[];
  onAssign: (volunteerId: string) => void;
  onStatusChange: (assignmentId: string, status: string) => void;
}

const STATUS_OPTIONS = [
  { value: "INTERESTED", label: "Interested" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "COMPLETED", label: "Completed" },
];

export function AssignmentPanel({
  incident,
  assignments,
  availableVolunteers,
  onAssign,
  onStatusChange,
}: AssignmentPanelProps) {
  const helpTypes = JSON.parse(incident.helpTypesNeeded || "[]") as string[];
  const roleReqs = helpTypes.map((role) => {
    const filled = assignments.filter(
      (a) => a.role === role && ["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(a.status)
    ).length;
    return { role, needed: Math.ceil(incident.volunteersNeeded / helpTypes.length) || 1, filled };
  });
  if (roleReqs.length === 0) {
    roleReqs.push({ role: "general_support", needed: incident.volunteersNeeded, filled: 0 });
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">Assignments</h3>
        <RoleRequirementList roles={roleReqs} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Add Volunteer</p>
          <Select onValueChange={onAssign}>
            <SelectTrigger>
              <SelectValue placeholder="Select volunteer..." />
            </SelectTrigger>
            <SelectContent>
              {availableVolunteers
                .filter((v) => !assignments.some((a) => a.volunteerId === v.id))
                .map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.fullName} — {v.skills}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Current Assignments</p>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          ) : (
            assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div>
                  <p className="font-medium text-sm">{a.volunteer.fullName}</p>
                  <p className="text-xs text-muted-foreground">{a.role}</p>
                </div>
                <Select
                  value={a.status}
                  onValueChange={(v) => onStatusChange(a.id, v)}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
