"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/SiteHeader";
import { MapIncidentDrawer } from "@/components/MapIncidentDrawer";
import { GazaZonePanelMapIncident } from "@/components/GazaZonePanelMapIncident";
import { OpenIncidentsPanel } from "@/components/OpenIncidentsPanel";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { pointInBounds, GAZA_FLY_BOUNDS } from "@/lib/gaza-zones";
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

  const selected = useMemo(
    () => mapIncidents.find((i) => i.id === selectedId) ?? null,
    [mapIncidents, selectedId]
  );

  const fetchIncidents = useCallback(() => {
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

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader
        navItems={[
          { href: "/", label: "Home" },
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchIncidents()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
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

      {!selected && !selectedZoneId && (
        <OpenIncidentsPanel
          mapIncidents={mapIncidents}
          onSelectIncident={(id) => {
            setSelectedId(id);
            setGazaMode(true);
          }}
        />
      )}
    </div>
  );
}
