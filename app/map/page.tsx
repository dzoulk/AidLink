"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/SiteHeader";
import { MapIncidentDrawer } from "@/components/MapIncidentDrawer";
import { GazaZonePanelMapIncident } from "@/components/GazaZonePanelMapIncident";
import { Button } from "@/components/ui/button";
import { pointInBounds, GAZA_FLY_BOUNDS } from "@/lib/gaza-zones";
import { CRITICALITY_META } from "@/lib/criticality-meta";
import { jsonToMapIncident, prismaToMapIncident } from "@/lib/incident-adapters";
import type { Incident } from "@prisma/client";
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

export default function PublicMapPage() {
  const [mapIncidents, setMapIncidents] = useState<MapIncident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [gazaMode, setGazaMode] = useState(false);

  useEffect(() => {
    fetch("/api/incidents-json")
      .then((r) => r.json())
      .then((data: { incidents?: IncidentJson[] }) => {
        const json = data.incidents ?? [];
        if (json.length > 0) {
          setMapIncidents(json.map(jsonToMapIncident).filter(inGaza));
          return;
        }
        return fetch("/api/incidents")
          .then((r) => r.json())
          .then((fallback: { incidents?: Incident[] }) => {
            const incidents = (fallback.incidents ?? []) as Incident[];
            setMapIncidents(
              incidents
                .filter(
                  (i) =>
                    !["FALSE_REPORT", "DUPLICATE"].includes(
                      i.verificationStatus ?? ""
                    )
                )
                .map(prismaToMapIncident)
                .filter(inGaza)
            );
          });
      })
      .catch(() => setMapIncidents([]));
  }, []);

  const selected = useMemo(
    () => mapIncidents.find((i) => i.id === selectedId) ?? null,
    [mapIncidents, selectedId]
  );

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader
        navItems={[
          { href: "/", label: "Home" },
          { href: "/volunteer", label: "Volunteer" },
        ]}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
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

        <div className="relative min-h-0 flex-1">
          <GazaCrisisMap
            incidents={mapIncidents}
            gazaMode={gazaMode}
            onEnterGaza={() => setGazaMode(true)}
            selectedIncidentId={selectedId}
            onSelectIncident={setSelectedId}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            className="h-full min-h-0 rounded-none border-0"
          />
        </div>

        {selected && (
          <MapIncidentDrawer
            incident={selected}
            onClose={() => setSelectedId(null)}
          />
        )}

        {selectedZoneId && !selected && gazaMode && (
          <GazaZonePanelMapIncident
            zoneId={selectedZoneId}
            incidents={mapIncidents}
            onClose={() => setSelectedZoneId(null)}
            onSelectIncident={setSelectedId}
          />
        )}
      </div>

      <div className="pointer-events-none absolute left-4 top-32 z-[1000] max-w-[calc(100vw-2rem)] rounded-xl border bg-background/95 p-4 text-sm shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:top-36">
        <p className="pointer-events-auto font-medium">Criticality (by time since incident)</p>
        <div className="pointer-events-auto mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CRITICALITY_META.critical.marker }}
            />
            Critical
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CRITICALITY_META["needs support"].marker }}
            />
            Needs Support
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CRITICALITY_META.cleanup.marker }}
            />
            Clean Up
          </span>
        </div>
      </div>
    </div>
  );
}
