"use client";

import { VerificationBadge } from "@/components/VerificationBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { Incident } from "@prisma/client";
import { cn } from "@/lib/utils";

interface OrganizerIncidentPanelProps {
  incident: Incident;
  interestedCount: number;
  confirmedCount: number;
  checkedInCount: number;
}

export function OrganizerIncidentPanel({
  incident,
  interestedCount,
  confirmedCount,
  checkedInCount,
}: OrganizerIncidentPanelProps) {
  const helpTypes = JSON.parse(incident.helpTypesNeeded || "[]") as string[];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <VerificationBadge status={incident.verificationStatus} />
        <SeverityBadge score={incident.severityScore} />
      </div>
      <div>
        <p className="text-xs text-slate-500">Location</p>
        <p className="text-sm">{incident.locationName}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
          <p className="text-slate-500 text-xs">Needed</p>
          <p className="font-semibold">{incident.volunteersNeeded}</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
          <p className="text-slate-500 text-xs">Confirmed</p>
          <p className="font-semibold">{confirmedCount}</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
          <p className="text-slate-500 text-xs">Checked In</p>
          <p className="font-semibold">{checkedInCount}</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-800/50 p-2">
          <p className="text-slate-500 text-xs">Interested</p>
          <p className="font-semibold">{interestedCount}</p>
        </div>
      </div>
      {incident.safetyNote && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-sm">
          <p className="text-amber-600 font-medium">Safety</p>
          <p className="text-slate-300">{incident.safetyNote}</p>
        </div>
      )}
      {incident.checkInCode && (
        <div className="rounded border border-slate-700 p-2">
          <p className="text-xs text-slate-500">Check-in code</p>
          <p className="font-mono font-bold">{incident.checkInCode}</p>
        </div>
      )}
    </div>
  );
}
