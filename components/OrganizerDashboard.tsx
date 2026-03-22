"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { MetricsOverview } from "@/components/MetricsOverview";
import { IncidentCard } from "@/components/IncidentCard";
import { VolunteerTable } from "@/components/VolunteerTable";
import { OrganizerIncidentPanel } from "@/components/OrganizerIncidentPanel";
import { AssignmentPanel } from "@/components/AssignmentPanel";
import { CheckInModal } from "@/components/CheckInModal";
import { IncomingReports } from "@/components/IncomingReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Users,
  UserCheck,
  LogOut,
  Filter,
} from "lucide-react";
import type { Incident, VolunteerProfile, Assignment, IncidentReport } from "@prisma/client";

const IncidentMap = dynamic(
  () => import("@/components/IncidentMap").then((m) => ({ default: m.IncidentMap })),
  { ssr: false }
);

type IncidentWithAssignments = Incident & {
  assignments: (Assignment & { volunteer: VolunteerProfile })[];
};

type VolunteerWithAssignments = VolunteerProfile & {
  assignments: (Assignment & { incident: { title: string } })[];
};

export function OrganizerDashboard() {
  const { logout } = useAuthStore();
  const [incidents, setIncidents] = useState<IncidentWithAssignments[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerWithAssignments[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [counts, setCounts] = useState<Record<string, { i: number; c: number; ch: number }>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  const refresh = async () => {
    const [incRes, volRes, repRes] = await Promise.all([
      fetch("/api/dashboard/incidents"),
      fetch("/api/dashboard/volunteers"),
      fetch("/api/dashboard/reports"),
    ]);
    const incData = await incRes.json();
    const volData = await volRes.json();
    const repData = await repRes.json();
    setIncidents(incData.incidents ?? []);
    setVolunteers(volData.volunteers ?? []);
    setReports(repData.reports ?? []);
    setCounts(incData.counts ?? {});
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  const selected = incidents.find((i) => i.id === selectedId);
  const c = selectedId ? counts[selectedId] ?? { i: 0, c: 0, ch: 0 } : { i: 0, c: 0, ch: 0 };

  const activeCount = incidents.filter((i) => i.operationalStatus !== "RESOLVED").length;
  const unverifiedCount = incidents.filter((i) => i.verificationStatus === "UNVERIFIED").length;
  const criticalCount = incidents.filter((i) => i.severityScore >= 8).length;
  const availableVols = volunteers.filter((v) => v.status === "AVAILABLE").length;
  const confirmedVols = volunteers.filter((v) =>
    ["CONFIRMED", "CHECKED_IN"].includes(v.status)
  ).length;
  const checkedInVols = volunteers.filter((v) => v.status === "CHECKED_IN").length;
  const understaffed = incidents.filter((i) => {
    const ch = counts[i.id]?.ch ?? 0;
    return i.operationalStatus !== "RESOLVED" && ch < i.volunteersNeeded;
  }).length;

  const filteredIncidents =
    verificationFilter === "all"
      ? incidents
      : incidents.filter((i) => i.verificationStatus === verificationFilter);

  const handleVerify = async (incidentId: string, status: string) => {
    await fetch("/api/dashboard/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId, verificationStatus: status }),
    });
    refresh();
  };

  const handleOperational = async (incidentId: string, status: string) => {
    await fetch("/api/dashboard/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId, operationalStatus: status }),
    });
    refresh();
  };

  const handleAssign = async (volunteerId: string) => {
    if (!selectedId) return;
    await fetch("/api/dashboard/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId: selectedId, volunteerId }),
    });
    refresh();
  };

  const handleStatusChange = async (assignmentId: string, status: string) => {
    await fetch("/api/dashboard/assign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, status }),
    });
    refresh();
  };

  const handleCheckIn = async (code: string, assignmentId?: string): Promise<boolean> => {
    if (!selectedId) return false;
    const res = await fetch("/api/dashboard/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId: selectedId, code, assignmentId }),
    });
    const data = await res.json();
    if (data.ok) refresh();
    return !!data.ok;
  };

  const availableForAssign = volunteers.filter(
    (v) => !selected?.assignments.some((a) => a.volunteerId === v.id)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-white">
            AidLink
          </Link>
          <span className="text-slate-400 text-sm font-medium">Command Center</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
            Live
          </span>
          <Button variant="ghost" size="sm" onClick={refresh} className="text-slate-300">
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1 text-slate-400">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <div className="px-4 py-4 border-b border-slate-800">
        <MetricsOverview
          metrics={[
            { title: "Active Incidents", value: activeCount, icon: Activity },
            {
              title: "Unverified",
              value: unverifiedCount,
              icon: AlertTriangle,
              variant: unverifiedCount > 0 ? "warning" : "default",
            },
            {
              title: "Critical",
              value: criticalCount,
              icon: AlertTriangle,
              variant: criticalCount > 0 ? "warning" : "default",
            },
            { title: "Available Volunteers", value: availableVols, icon: Users },
            { title: "Confirmed", value: confirmedVols, icon: UserCheck },
            { title: "Checked In", value: checkedInVols, icon: CheckCircle, variant: "success" },
            {
              title: "Understaffed",
              value: understaffed,
              icon: MapPin,
              variant: understaffed > 0 ? "warning" : "default",
            },
          ]}
        />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 p-4">
          <Tabs defaultValue="incidents" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="incidents">Incident Board</TabsTrigger>
              <TabsTrigger value="volunteers">Volunteer Roster</TabsTrigger>
              <TabsTrigger value="reports">Incoming Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="incidents" className="flex-1 min-h-0 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
                >
                  <option value="all">All verification</option>
                  <option value="UNVERIFIED">Unverified</option>
                  <option value="PARTIALLY_VERIFIED">Partially verified</option>
                  <option value="VERIFIED">Verified</option>
                </select>
              </div>
              <div className="grid gap-3 overflow-y-auto max-h-[400px] pr-2">
                {filteredIncidents.map((inc) => (
                  <IncidentCard
                    key={inc.id}
                    incident={inc}
                    interestedCount={counts[inc.id]?.i ?? 0}
                    confirmedCount={counts[inc.id]?.c ?? 0}
                    checkedInCount={counts[inc.id]?.ch ?? 0}
                    onClick={() => setSelectedId(inc.id)}
                    selected={selectedId === inc.id}
                    variant="dark"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="volunteers" className="flex-1 min-h-0 mt-4">
              <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-900/50">
                <VolunteerTable volunteers={volunteers} />
              </div>
            </TabsContent>

            <TabsContent value="reports" className="flex-1 min-h-0 mt-4">
              <IncomingReports reports={reports} onRefresh={refresh} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-[420px] border-l border-slate-800 flex flex-col shrink-0">
          <div className="h-[320px] p-4 border-b border-slate-800">
            <IncidentMap
              incidents={incidents}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{selected.title}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                    Close
                  </Button>
                </div>
                <OrganizerIncidentPanel
                  incident={selected}
                  interestedCount={c.i}
                  confirmedCount={c.c}
                  checkedInCount={c.ch}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleVerify(selected.id, "VERIFIED")}>
                    Verify
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleVerify(selected.id, "PARTIALLY_VERIFIED")}>
                    Partial
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleVerify(selected.id, "FALSE_REPORT")}>
                    False
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOperational(selected.id, "ACTIVE")}>
                    Active
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOperational(selected.id, "RESOLVED")}>
                    Resolve
                  </Button>
                  {selected.checkInCode && (
                    <Button size="sm" onClick={() => setCheckInOpen(true)}>
                      Check-in
                    </Button>
                  )}
                </div>
                <AssignmentPanel
                  incident={selected}
                  assignments={selected.assignments ?? []}
                  availableVolunteers={availableForAssign}
                  onAssign={handleAssign}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Select an incident on the map or list
              </div>
            )}
          </div>
        </div>
      </div>

      {selected?.checkInCode && (
        <CheckInModal
          open={checkInOpen}
          onOpenChange={setCheckInOpen}
          checkInCode={selected.checkInCode}
          incidentTitle={selected.title}
          assignments={selected.assignments ?? []}
          onCheckIn={handleCheckIn}
        />
      )}
    </div>
  );
}
