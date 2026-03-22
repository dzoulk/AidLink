import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, skills, hasVehicle, availableNow, travelRadius } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email required" },
        { status: 400 }
      );
    }

    const skillsStr = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify([]);
    const safeEmail = String(email).includes("@") ? String(email) : `${String(email)}@volunteer.demo`;
    const user = await prisma.user.create({
      data: {
        email: safeEmail,
        name: fullName,
        role: "volunteer",
      },
    });

    const volunteer = await prisma.volunteerProfile.create({
      data: {
        userId: user.id,
        fullName,
        email: user.email,
        phone: phone || null,
        skills: skillsStr,
        hasVehicle: !!hasVehicle,
        availableNow: !!availableNow,
        travelRadius: Number(travelRadius) || 50,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({ volunteer });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create volunteer" },
      { status: 500 }
    );
  }
}
