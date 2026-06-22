import { prisma } from "@/lib/prisma";
import { adminSessionFrom } from "@/lib/session";
import { json, readJson } from "@/lib/store";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payload = await readJson(request);

    const updateData = {};
    if (payload.name !== undefined) updateData.name = String(payload.name).trim();
    if (payload.isActive !== undefined) updateData.isActive = Boolean(payload.isActive);
    if (payload.code !== undefined) {
      updateData.code = String(payload.code).toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
      
      const existing = await prisma.referralPartner.findFirst({
        where: {
          code: updateData.code,
          NOT: { id }
        }
      });
      if (existing) {
        return NextResponse.json({ ok: false, error: "A partner with this code already exists." }, { status: 409 });
      }
    }

    const partner = await prisma.referralPartner.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      ok: true,
      partner
    });
  } catch (error) {
    console.error("Failed to update referral partner:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.referralPartner.delete({
      where: { id }
    });

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    console.error("Failed to delete referral partner:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
