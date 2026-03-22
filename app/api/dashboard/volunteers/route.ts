import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const volunteers = await prisma.volunteerProfile.findMany({
      include: {
        assignments: {
          include: { incident: { select: { title: true } } },
        },
      },
    });
    return NextResponse.json({ volunteers });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
