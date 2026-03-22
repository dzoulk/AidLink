import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { incidentId, volunteerId } = await req.json();
    if (!incidentId || !volunteerId) {
      return NextResponse.json(
        { error: "incidentId and volunteerId required" },
        { status: 400 }
      );
    }

    const existing = await prisma.assignment.findFirst({
      where: { incidentId, volunteerId },
    });
    if (existing) {
      return NextResponse.json({ ok: true });
    }

    await prisma.assignment.create({
      data: {
        incidentId,
        volunteerId,
        status: "ASSIGNED",
        role: "general_support",
      },
    });

    await prisma.volunteerProfile.update({
      where: { id: volunteerId },
      data: { status: "ASSIGNED" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to assign" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { assignmentId, status } = await req.json();
    if (!assignmentId || !status) {
      return NextResponse.json(
        { error: "assignmentId and status required" },
        { status: 400 }
      );
    }

    const a = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status,
        confirmedAt: ["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(status)
          ? new Date()
          : undefined,
        checkedInAt: ["CHECKED_IN", "COMPLETED"].includes(status)
          ? new Date()
          : undefined,
      },
      include: { volunteer: true },
    });

    await prisma.volunteerProfile.update({
      where: { id: a.volunteerId },
      data: { status: status as "INTERESTED" | "ASSIGNED" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" },
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
