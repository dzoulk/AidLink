"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { OrganizerOpenIncidentsPanel } from "@/components/OrganizerOpenIncidentsPanel";
import { OrganizerIncidentDrawer } from "@/components/OrganizerIncidentDrawer";
import { MapIncidentDrawer } from "@/components/MapIncidentDrawer";
import { AssignmentPanel } from "@/components/AssignmentPanel";
import { CheckInModal } from "@/components/CheckInModal";
import { EditIncidentModal } from "@/components/EditIncidentModal";
import { GazaZonePanelMapIncident } from "@/components/GazaZonePanelMapIncident";
import { pointInBounds, GAZA_FLY_BOUNDS, getZoneForPoint } from "@/lib/gaza-zones";
import { jsonToMapIncident, prismaToMapIncident } from "@/lib/incident-adapters";
import { LogOut } from "lucide-react";
import type { Incident, VolunteerProfile, Assignment } from "@prisma/client";
import type { MapIncident, IncidentJson } from "@/types/incident-json";

const GazaCrisisMap = dynamic(
  () =>
    import("@/components/GazaCrisisMap").then((m) => ({
      default: m.GazaCrisisMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-muted animate-pulse">
        Loading map…
      </div>
    ),
  }
);

function inGaza(inc: { lat: number; lng: number }) {
  return pointInBounds(inc.lat, inc.lng, GAZA_FLY_BOUNDS);
}

type IncidentWithAssignments = Incident & {
  assignments: (Assignment & { volunteer: VolunteerProfile })[];
};

type VolunteerWithAssignments = VolunteerProfile & {
  assignments: (Assignment & { incident: { title: string } })[];
};

export function OrganizerMap() {
  const { logout } = useAuthStore();
  const [prismaIncidents, setPrismaIncidents] = useState<IncidentWithAssignments[]>([]);
  const [jsonFallbackIncidents, setJsonFallbackIncidents] = useState<MapIncident[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerWithAssignments[]>([]);
  const [counts, setCounts] = useState<Record<string, { i: number; c: number; ch: number }>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [gazaMode, setGazaMode] = useState(false);
  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const prismaById = useMemo(
    () => Object.fromEntries(prismaIncidents.map((i) => [i.id, i])),
    [prismaIncidents]
  );

  const openPrismaIncidents = useMemo(
    () => prismaIncidents.filter((i) => i.operationalStatus !== "RESOLVED"),
    [prismaIncidents]
  );

  const mapIncidentsFromPrisma = useMemo(
    () =>
      openPrismaIncidents
        .filter(
          (i) =>
            !["FALSE_REPORT", "DUPLICATE"].includes(
              i.verificationStatus ?? ""
            )
        )
        .filter(inGaza)
        .map(prismaToMapIncident),
    [openPrismaIncidents]
  );

  const mapIncidents =
    mapIncidentsFromPrisma.length > 0 ? mapIncidentsFromPrisma : jsonFallbackIncidents;

  const selectedPrismaIncident = selectedId ? prismaById[selectedId] : null;
  const selectedMapIncident = mapIncidents.find((i) => i.id === selectedId);
  const c = selectedId ? counts[selectedId] ?? { i: 0, c: 0, ch: 0 } : { i: 0, c: 0, ch: 0 };

  const availableForAssign =
    selectedPrismaIncident &&
    volunteers.filter(
      (v) => !selectedPrismaIncident.assignments.some((a) => a.volunteerId === v.id)
    );

  const fetchDashboard = async () => {
    const [incRes, volRes] = await Promise.all([
      fetch("/api/dashboard/incidents"),
      fetch("/api/dashboard/volunteers"),
    ]);
    const incData = await incRes.json();
    const volData = await volRes.json();
    const incidents = incData.incidents ?? [];
    setPrismaIncidents(incidents);
    setVolunteers(volData.volunteers ?? []);
    setCounts(incData.counts ?? {});

    if (incidents.filter((i: Incident) => i.operationalStatus !== "RESOLVED").length === 0) {
      try {
        const jsonRes = await fetch("/api/incidents-json");
        const jsonData = await jsonRes.json();
        const json = jsonData.incidents ?? [];
        if (json.length > 0) {
          setJsonFallbackIncidents(
            (json as IncidentJson[]).map(jsonToMapIncident).filter(inGaza)
          );
          return;
        }
      } catch {
        // ignore
      }
      setJsonFallbackIncidents([]);
    } else {
      setJsonFallbackIncidents([]);
    }
  };

  const refresh = async () => {
    await fetchDashboard();
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  const handleVerify = async (incidentId: string, status: string) => {
    await fetch("/api/dashboard/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId, verificationStatus: status }),
    });
    refresh();
  };

  const handleRemove = async (incidentId: string) => {
    await fetch("/api/dashboard/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId, operationalStatus: "RESOLVED" }),
    });
    setSelectedId(null);
    refresh();
  };

  const handleEditSave = async (
    id: string,
    data: {
      title: string;
      description?: string;
      locationName: string;
      lat: number;
      lng: number;
      severityScore: number;
      volunteersNeeded: number;
      safetyNote?: string;
    }
  ) => {
    await fetch("/api/dashboard/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId: id, ...data }),
    });
    setEditModalOpen(false);
    setEditIncident(null);
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

  const handleSelectIncident = (id: string) => {
    setSelectedId(id);
    setGazaMode(true);
    const inc = mapIncidents.find((i) => i.id === id);
    if (inc) {
      const z = getZoneForPoint(inc.lat, inc.lng);
      setSelectedZoneId(z?.id ?? null);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0 font-bold text-xl tracking-tight">
            AidLink
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Organizer Map</span>
            <Button variant="ghost" size="sm" onClick={refresh}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1">
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-3 text-sm">
        <Button
          type="button"
          variant={gazaMode ? "secondary" : "default"}
          size="sm"
          onClick={() => setGazaMode(true)}
        >
          Gaza view
        </Button>
        {gazaMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setGazaMode(false);
              setSelectedZoneId(null);
              setSelectedId(null);
            }}
          >
            World map
          </Button>
        )}
        <span className="text-muted-foreground">
          {gazaMode
            ? "Hover a marker for summary • Click Open details for full panel"
            : "Click the Gaza area or use Gaza view to zoom in"}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          <GazaCrisisMap
            incidents={mapIncidents}
            gazaMode={gazaMode}
            onEnterGaza={() => setGazaMode(true)}
            selectedIncidentId={selectedId}
            onSelectIncident={(id) => {
              setSelectedId(id);
              if (id) {
                const inc = mapIncidents.find((i) => i.id === id);
                if (inc) {
                  const z = getZoneForPoint(inc.lat, inc.lng);
                  setSelectedZoneId(z?.id ?? null);
                }
              } else {
                setSelectedZoneId(null);
              }
            }}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            className="h-full min-h-0 rounded-none border-0"
          />
        </div>

        {selectedMapIncident && selectedPrismaIncident && (
          <OrganizerIncidentDrawer
            incident={selectedPrismaIncident}
            interestedCount={c.i}
            confirmedCount={c.c}
            checkedInCount={c.ch}
            onClose={() => setSelectedId(null)}
            onVerificationChange={handleVerify}
            onRemove={handleRemove}
            onEdit={(inc) => {
              setEditIncident(inc);
              setEditModalOpen(true);
            }}
            onCheckIn={
              selectedPrismaIncident.checkInCode
                ? () => setCheckInOpen(true)
                : undefined
            }
            assignmentPanel={
              availableForAssign ? (
                <AssignmentPanel
                  incident={selectedPrismaIncident}
                  assignments={selectedPrismaIncident.assignments ?? []}
                  availableVolunteers={availableForAssign}
                  onAssign={handleAssign}
                  onStatusChange={handleStatusChange}
                />
              ) : null
            }
          />
        )}

        {selectedMapIncident && !selectedPrismaIncident && (
          <MapIncidentDrawer
            incident={selectedMapIncident}
            onClose={() => setSelectedId(null)}
            onRemove={(id) => {
              setSelectedId(null);
              setJsonFallbackIncidents((prev) => prev.filter((i) => i.id !== id));
            }}
          />
        )}

        {selectedZoneId && !selectedMapIncident && gazaMode && (
          <GazaZonePanelMapIncident
            zoneId={selectedZoneId}
            incidents={mapIncidents}
            onClose={() => setSelectedZoneId(null)}
            onSelectIncident={handleSelectIncident}
          />
        )}
      </div>

      {!selectedMapIncident && !selectedZoneId && (
        <OrganizerOpenIncidentsPanel
          mapIncidents={mapIncidents}
          counts={counts}
          prismaById={prismaById}
          selectedId={selectedId}
          onSelectIncident={handleSelectIncident}
          onEditIncident={(inc) => {
            setEditIncident(inc);
            setEditModalOpen(true);
          }}
        />
      )}

      {selectedPrismaIncident?.checkInCode && (
        <CheckInModal
          open={checkInOpen}
          onOpenChange={setCheckInOpen}
          checkInCode={selectedPrismaIncident.checkInCode}
          incidentTitle={selectedPrismaIncident.title}
          assignments={selectedPrismaIncident.assignments ?? []}
          onCheckIn={handleCheckIn}
        />
      )}

      <EditIncidentModal
        incident={editIncident}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleEditSave}
      />
    </div>
  );
}
