import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { IncidentJson } from "@/types/incident-json";

/**
 * Serves incident JSON from data/incidents.json.
 * TODO: Replace with Supabase fetch when backend pipeline is connected.
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "incidents.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ incidents: [] });
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const incidents: IncidentJson[] = JSON.parse(raw);
    return NextResponse.json({ incidents });
  } catch (e) {
    console.error("Failed to load incidents JSON:", e);
    return NextResponse.json(
      { error: "Failed to load incidents", incidents: [] },
      { status: 500 }
    );
  }
}
