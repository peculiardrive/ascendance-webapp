import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    requireFields(payload, ["code"]);

    const code = String(payload.code).trim();
    if (!code) {
      return json({ ok: false, error: "Referral code is required." }, { status: 400 });
    }

    const partner = await prisma.referralPartner.findUnique({
      where: { code }
    });

    if (!partner || !partner.isActive) {
      return json({ ok: false, error: "Referral partner not found or inactive." }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    await prisma.referralVisit.create({
      data: {
        partnerId: partner.id,
        ip,
        userAgent
      }
    });

    return json({
      ok: true,
      partner: {
        id: partner.id,
        name: partner.name,
        code: partner.code,
        type: partner.type
      }
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 500 });
  }
}
