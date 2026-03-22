"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IncidentCard } from "@/components/IncidentCard";
import { ChevronRight, List, X, Pencil } from "lucide-react";
import { mapToDisplay } from "@/lib/incident-feed-utils";
import { CRITICALITY_META } from "@/lib/criticality-meta";
import type { Incident } from "@prisma/client";
import type { MapIncident } from "@/types/incident-json";

interface OrganizerOpenIncidentsPanelProps {
  mapIncidents: MapIncident[];
  counts: Record<string, { i: number; c: number; ch: number }>;
  prismaById: Record<string, Incident>;
  selectedId: string | null;
  onSelectIncident: (id: string) => void;
  onEditIncident: (incident: Incident) => void;
}

export function OrganizerOpenIncidentsPanel({
  mapIncidents,
  counts,
  prismaById,
  selectedId,
  onSelectIncident,
  onEditIncident,
}: OrganizerOpenIncidentsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <div className="absolute left-4 top-36 z-[1000] max-w-[280px] max-h-[50vh] flex flex-col rounded-xl border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <h2 className="font-semibold text-sm">Open Incidents</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setExpanded(false)}
            aria-label="Back to criticality"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="overflow-y-auto p-2 min-h-0" style={{ maxHeight: "calc(50vh - 44px)" }}>
          {mapIncidents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No open incidents
            </p>
          ) : (
            <div className="space-y-2">
              {mapIncidents.map((inc) => {
                const prismaInc = prismaById[inc.id];
                const canEdit = !!prismaInc;
                return (
                  <div key={inc.id} className="relative group">
                    <IncidentCard
                      incident={mapToDisplay(inc)}
                      interestedCount={counts[inc.id]?.i ?? 0}
                      confirmedCount={counts[inc.id]?.c ?? 0}
                      checkedInCount={counts[inc.id]?.ch ?? 0}
                      organizerLabels
                      onClick={() => {
                        onSelectIncident(inc.id);
                        setExpanded(false);
                      }}
                      selected={selectedId === inc.id}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditIncident(prismaInc);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/95 text-muted-foreground hover:bg-muted hover:text-foreground border border-border shadow-sm transition-colors z-10"
                        aria-label="Edit incident"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-36 z-[1000] max-w-[280px] rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-shadow hover:shadow-xl">
      <p className="font-medium text-sm">Criticality (by time since incident)</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: CRITICALITY_META.critical.marker }}
          />
          Critical
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: CRITICALITY_META["needs support"].marker }}
          />
          Needs Support
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: CRITICALITY_META.cleanup.marker }}
          />
          Clean Up
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3 w-full gap-2 shadow-sm transition-colors hover:bg-muted"
        onClick={() => setExpanded(true)}
      >
        <List className="h-4 w-4" />
        Open Incidents
        <ChevronRight className="h-4 w-4 opacity-70" />
      </Button>
    </div>
  );
}
