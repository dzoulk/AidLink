"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IncidentDrawer } from "@/components/IncidentDrawer";
import { useRouter } from "next/navigation";
import type { Incident } from "@prisma/client";

const IncidentMap = dynamic(
  () => import("@/components/IncidentMap").then((m) => ({ default: m.IncidentMap })),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse flex items-center justify-center">Loading map...</div> }
);

export default function PublicMapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [counts, setCounts] = useState<Record<string, { i: number; c: number; ch: number }>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((data) => {
        setIncidents(data.incidents ?? []);
        setCounts(data.counts ?? {});
      })
      .catch(() => setIncidents([]));
  }, []);

  const selected = incidents.find((i) => i.id === selectedId);
  const c = selectedId ? counts[selectedId] ?? { i: 0, c: 0, ch: 0 } : { i: 0, c: 0, ch: 0 };

  const handleOfferHelp = () => {
    router.push(`/volunteer?incident=${selectedId}`);
  };

  const publicIncidents = incidents.filter(
    (i) => !["FALSE_REPORT", "DUPLICATE"].includes(i.verificationStatus)
  );

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between shrink-0">
        <Link href="/" className="font-bold text-xl">
          AidLink
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link href="/volunteer" className="text-sm text-muted-foreground hover:text-foreground">
            Volunteer
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Organizer Dashboard
            </Button>
          </Link>
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 min-w-0">
          <IncidentMap
            incidents={publicIncidents}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        {selected && (
          <IncidentDrawer
            incident={selected}
            interestedCount={c.i}
            confirmedCount={c.c}
            checkedInCount={c.ch}
            onClose={() => setSelectedId(null)}
            onOfferHelp={handleOfferHelp}
            isPublic
          />
        )}
      </div>

      <div className="absolute left-4 top-20 z-[1000] rounded-lg border bg-background/95 p-3 text-sm shadow">
        <p className="font-medium">Map legend</p>
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Unverified
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Partially verified
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Verified
          </span>
        </div>
      </div>
    </div>
  );
}
