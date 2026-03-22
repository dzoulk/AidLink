import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseToMapIncident } from "@/lib/supabase-incident-adapter";
import type { SupabaseIncidentRow } from "@/lib/supabase-incident-adapter";

const TABLE_BY_REGION: Record<string, string> = {
  gaza: "incidents_gaza",
  ukraine: "incidents_ukraine",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");

  if (!region || !TABLE_BY_REGION[region]) {
    return NextResponse.json(
      { error: "Invalid region. Use ?region=gaza or ?region=ukraine" },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured", incidents: [] },
      { status: 503 }
    );
  }

  try {
    const table = TABLE_BY_REGION[region];
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("time_of_incident", { ascending: false });

    if (error) {
      console.error(`Supabase error (${table}):`, error);
      return NextResponse.json(
        { error: error.message, incidents: [] },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as SupabaseIncidentRow[];
    const incidents = rows.map(supabaseToMapIncident);

    return NextResponse.json({ incidents });
  } catch (e) {
    console.error("Incidents Supabase fetch error:", e);
    return NextResponse.json(
      { error: "Failed to fetch incidents", incidents: [] },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const {
    incidentId,
    region,
    summary,
    time_of_incident,
    location_lat,
    location_lon,
    location_radius_km,
    casualties_estimate,
    casualties,
    manpower_needed_estimate,
    manpower_needed,
    criticality,
    verification,
  } = body;

  if (!incidentId || !region) {
    return NextResponse.json(
      { error: "incidentId and region required" },
      { status: 400 }
    );
  }

  const table = TABLE_BY_REGION[region];
  if (!table) {
    return NextResponse.json(
      { error: "Invalid region. Use gaza or ukraine" },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const update: Record<string, unknown> = {
    last_updated: new Date().toISOString(),
  };
  if (typeof summary === "string") update.summary = summary.trim();
  if (time_of_incident != null) update.time_of_incident = time_of_incident;
  if (typeof location_lat === "number") update.location_lat = location_lat;
  if (typeof location_lon === "number") update.location_lon = location_lon;
  if (location_radius_km != null) update.location_radius_km = Number(location_radius_km);
  if (typeof casualties_estimate === "number") update.casualties_estimate = casualties_estimate;
  const casualtiesStr = String(casualties);
  if (["few", "some", "many"].includes(casualtiesStr)) update.casualties = casualtiesStr;
  if (typeof manpower_needed_estimate === "number") update.manpower_needed_estimate = manpower_needed_estimate;
  const manpowerStr = String(manpower_needed);
  if (["small", "moderate", "large"].includes(manpowerStr)) update.manpower_needed = manpowerStr;
  const criticalityStr = String(criticality);
  if (["critical", "needs_support", "cleanup"].includes(criticalityStr)) update.criticality = criticalityStr;
  const verificationStr = String(verification);
  if (["initial_reports", "confident", "verified"].includes(verificationStr)) update.verification = verificationStr;

  if (Object.keys(update).length <= 1) {
    return NextResponse.json(
      { error: "No updatable fields provided" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from(table)
      .update(update)
      .eq("incident_id", incidentId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Supabase PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 }
    );
  }
}
