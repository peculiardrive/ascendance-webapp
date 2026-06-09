import { prisma } from "@/lib/prisma";
import { adminSessionFrom } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminSession.sub } });
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        countryCode: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            purchases: true,
            readingProgress: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
