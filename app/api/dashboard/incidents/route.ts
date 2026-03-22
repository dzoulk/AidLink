import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      include: {
        assignments: { include: { volunteer: true } },
      },
      orderBy: { reportedAt: "desc" },
    });

    const counts: Record<string, { i: number; c: number; ch: number }> = {};
    for (const inc of incidents) {
      counts[inc.id] = {
        i: inc.assignments.filter((a) => a.status === "INTERESTED").length,
        c: inc.assignments.filter((a) =>
          ["ASSIGNED", "CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(a.status)
        ).length,
        ch: inc.assignments.filter((a) =>
          ["CHECKED_IN", "COMPLETED"].includes(a.status)
        ).length,
      };
    }

    return NextResponse.json({ incidents, counts });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { incidentId, verificationStatus, operationalStatus } = body;

    if (!incidentId) {
      return NextResponse.json(
        { error: "incidentId required" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (verificationStatus) update.verificationStatus = verificationStatus;
    if (operationalStatus) update.operationalStatus = operationalStatus;

    await prisma.incident.update({
      where: { id: incidentId },
      data: update,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
