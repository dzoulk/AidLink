import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reports = await prisma.incidentReport.findMany({
      orderBy: { timestamp: "desc" },
      take: 15,
    });
    return NextResponse.json({ reports });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
