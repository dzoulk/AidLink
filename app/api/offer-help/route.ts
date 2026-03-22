import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { volunteerId, incidentId } = await req.json();
    if (!volunteerId || !incidentId) {
      return NextResponse.json(
        { error: "volunteerId and incidentId required" },
        { status: 400 }
      );
    }

    const existing = await prisma.assignment.findFirst({
      where: { volunteerId, incidentId },
    });
    if (existing) {
      return NextResponse.json({ ok: true, assignment: existing });
    }

    const assignment = await prisma.assignment.create({
      data: {
        volunteerId,
        incidentId,
        status: "INTERESTED",
        role: "general_support",
      },
    });

    return NextResponse.json({ ok: true, assignment });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to offer help" },
      { status: 500 }
    );
  }
}
