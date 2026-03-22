"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { OrganizerDashboard } from "@/components/OrganizerDashboard";
import { LogIn } from "lucide-react";

export default function DashboardPage() {
  const { role, loginAsOrganizer } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (role !== "organizer") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-2xl font-bold">Organizer Access</h1>
          <p className="text-slate-300">
            This dashboard is for relief organizers. Log in to manage incidents and volunteers.
          </p>
          <Button onClick={loginAsOrganizer} size="lg" className="gap-2">
            <LogIn className="h-4 w-4" />
            Log in as Organizer (Demo)
          </Button>
          <Link href="/" className="block text-sm text-slate-400 hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <OrganizerDashboard />;
}
