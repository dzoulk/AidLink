import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        verificationStatus: { notIn: ["FALSE_REPORT", "DUPLICATE"] },
      },
      orderBy: { reportedAt: "desc" },
    });

    const counts: Record<string, { i: number; c: number; ch: number }> = {};
    for (const inc of incidents) {
      const assignments = await prisma.assignment.findMany({
        where: { incidentId: inc.id },
      });
      counts[inc.id] = {
        i: assignments.filter((a) => a.status === "INTERESTED").length,
        c: assignments.filter((a) =>
          ["ASSIGNED", "CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(a.status)
        ).length,
        ch: assignments.filter((a) =>
          ["CHECKED_IN", "COMPLETED"].includes(a.status)
        ).length,
      };
    }

    return NextResponse.json({ incidents, counts });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}
