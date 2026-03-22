"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SafetyNotice } from "@/components/SafetyNotice";
import { VolunteerForm } from "@/components/VolunteerForm";
import { IncidentCard } from "@/components/IncidentCard";
import type { Incident } from "@prisma/client";

function VolunteerContent() {
  const searchParams = useSearchParams();
  const incidentId = searchParams.get("incident");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [counts, setCounts] = useState<Record<string, { i: number; c: number; ch: number }>>({});
  const [profileCreated, setProfileCreated] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((data) => {
        setIncidents(data.incidents ?? []);
        setCounts(data.counts ?? {});
      })
      .catch(() => setIncidents([]));
  }, []);

  const publicIncidents = incidents.filter(
    (i) => !["FALSE_REPORT", "DUPLICATE"].includes(i.verificationStatus)
  );

  const handleProfileCreated = (volunteerId: string) => {
    setProfileCreated(volunteerId);
  };

  const handleOfferHelp = async (incidentId: string) => {
    if (!profileCreated) return;
    const res = await fetch("/api/offer-help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volunteerId: profileCreated, incidentId }),
    });
    if (res.ok) {
      const data = await fetch("/api/incidents").then((r) => r.json());
      setCounts(data.counts ?? {});
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          AidLink
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/map" className="text-sm text-muted-foreground hover:text-foreground">
            Crisis Map
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Organizer Dashboard
            </Button>
          </Link>
        </nav>
      </header>

      <main className="container max-w-4xl py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">Volunteer</h1>
        <p className="text-muted-foreground mb-6">
          Create your profile and offer to help at an incident. An organizer will review and may confirm your assignment.
        </p>

        <SafetyNotice
          text="Interested does not mean assigned. An organizer may review and confirm you. Do not enter unsafe zones without authorization."
          className="mb-8"
        />

        {!profileCreated ? (
          <VolunteerForm onSuccess={handleProfileCreated} />
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Profile created. You can now offer to help at incidents below.
                </p>
              </CardContent>
            </CardHeader>
          </Card>
        )}

        <h2 className="text-lg font-semibold mb-4">Open Incidents</h2>
        <div className="grid gap-4">
          {publicIncidents.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              interestedCount={counts[inc.id]?.i ?? 0}
              confirmedCount={counts[inc.id]?.c ?? 0}
              checkedInCount={counts[inc.id]?.ch ?? 0}
              actions={
                profileCreated && (
                  <Button
                    size="sm"
                    onClick={() => handleOfferHelp(inc.id)}
                    disabled={!profileCreated}
                  >
                    Offer to Help
                  </Button>
                )
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function VolunteerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VolunteerContent />
    </Suspense>
  );
}
