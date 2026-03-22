import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { incidentId, code, assignmentId } = await req.json();
    if (!incidentId || !code) {
      return NextResponse.json(
        { error: "incidentId and code required" },
        { status: 400 }
      );
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident?.checkInCode) {
      return NextResponse.json({ ok: false });
    }
    if (incident.checkInCode.toUpperCase() !== code.toUpperCase()) {
      return NextResponse.json({ ok: false });
    }

    let assignment;
    if (assignmentId) {
      assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          incidentId,
          status: { in: ["ASSIGNED", "CONFIRMED"] },
        },
      });
    } else {
      assignment = await prisma.assignment.findFirst({
        where: {
          incidentId,
          status: { in: ["ASSIGNED", "CONFIRMED"] },
        },
      });
    }
    if (!assignment) {
      return NextResponse.json({ ok: false });
    }

    await prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      },
    });

    await prisma.checkInLog.create({
      data: {
        assignmentId: assignment.id,
        code: code.toUpperCase(),
      },
    });

    await prisma.volunteerProfile.update({
      where: { id: assignment.volunteerId },
      data: { status: "CHECKED_IN" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
