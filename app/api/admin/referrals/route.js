import { prisma } from "@/lib/prisma";
import { adminSessionFrom } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const partners = await prisma.referralPartner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            visits: true,
            users: true
          }
        },
        purchases: {
          where: {
            paymentStatus: "Successful"
          },
          select: {
            amount: true
          }
        }
      }
    });

    const formattedPartners = partners.map(partner => {
      const successfulPurchases = partner.purchases;
      const totalRevenue = successfulPurchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);

      return {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        code: partner.code,
        isActive: partner.isActive,
        createdAt: partner.createdAt,
        visitsCount: partner._count.visits,
        signupsCount: partner._count.users,
        purchasesCount: successfulPurchases.length,
        totalRevenue
      };
    });

    return NextResponse.json({
      ok: true,
      partners: formattedPartners
    });
  } catch (error) {
    console.error("Failed to fetch referral partners:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = await readJson(request);
    requireFields(payload, ["name", "code", "type"]);

    const name = String(payload.name).trim();
    const code = String(payload.code).toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    const type = String(payload.type).trim();

    if (!name || !code || !type) {
      return NextResponse.json({ ok: false, error: "All fields are required." }, { status: 400 });
    }

    if (type !== "shop" && type !== "club") {
      return NextResponse.json({ ok: false, error: "Type must be either 'shop' or 'club'." }, { status: 400 });
    }

    const existing = await prisma.referralPartner.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ ok: false, error: "A partner with this code already exists." }, { status: 409 });
    }

    const partner = await prisma.referralPartner.create({
      data: {
        name,
        code,
        type,
        isActive: true
      }
    });

    return NextResponse.json({
      ok: true,
      partner
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create referral partner:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
