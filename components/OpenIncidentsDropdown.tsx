"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IncidentCard } from "@/components/IncidentCard";
import { ChevronDown, List } from "lucide-react";
import type { Incident } from "@prisma/client";
import type { IncidentJson } from "@/types/incident-json";
import {
  type DisplayIncident,
  prismaToDisplay,
  jsonToDisplay,
} from "@/lib/incident-feed-utils";

interface OpenIncidentsDropdownProps {
  onSelectIncident?: (id: string) => void;
}

export function OpenIncidentsDropdown({
  onSelectIncident,
}: OpenIncidentsDropdownProps) {
  const [incidents, setIncidents] = useState<DisplayIncident[]>([]);
  const [counts, setCounts] = useState<
    Record<string, { i: number; c: number; ch: number }>
  >({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      // Try Prisma first (same as volunteer page)
      fetch("/api/incidents")
        .then((r) => r.json())
        .then(
          (data: {
            incidents?: Incident[];
            counts?: Record<string, { i: number; c: number; ch: number }>;
          }) => {
            const list = data.incidents ?? [];
            if (list.length > 0) {
              setIncidents(list.map(prismaToDisplay));
              setCounts(data.counts ?? {});
              return;
            }
            // Fallback: fetch from JSON (incidents.json - same as map)
            return fetch("/api/incidents-json")
              .then((r) => r.json())
              .then((jsonData: { incidents?: IncidentJson[] }) => {
                const jsonList = jsonData.incidents ?? [];
                setIncidents(jsonList.map(jsonToDisplay));
                setCounts({});
              });
          }
        )
        .catch(() =>
          fetch("/api/incidents-json")
            .then((r) => r.json())
            .then((jsonData: { incidents?: IncidentJson[] }) => {
              const jsonList = jsonData.incidents ?? [];
              setIncidents(jsonList.map(jsonToDisplay));
              setCounts({});
            })
            .catch(() => setIncidents([]))
        );
    }
  }, [open]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2 gap-1.5 shadow-sm hover:bg-muted transition-colors"
        >
          <List className="h-3.5 w-3.5" />
          Open Incidents
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-2rem))] max-h-[70vh] overflow-hidden p-0"
      >
        <div className="sticky top-0 z-10 border-b bg-background px-3 py-2">
          <h3 className="font-semibold text-sm">Open Incidents</h3>
        </div>
        <div className="overflow-y-auto max-h-[calc(70vh-48px)] p-2 space-y-2">
          {incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No open incidents
            </p>
          ) : (
            incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => {
                  onSelectIncident?.(inc.id);
                  setOpen(false);
                }}
              >
                <IncidentCard
                  incident={inc}
                  interestedCount={counts[inc.id]?.i ?? 0}
                  confirmedCount={counts[inc.id]?.c ?? 0}
                  checkedInCount={counts[inc.id]?.ch ?? 0}
                  onClick={() => {
                    onSelectIncident?.(inc.id);
                    setOpen(false);
                  }}
                />
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
