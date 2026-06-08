import { verifyAdminChallenge } from "@/lib/admin-2fa";
import { publicAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  adminChallengeFrom,
  adminSessionCookie,
  assertSameOrigin,
  clearAdminChallengeCookie
} from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const challengeSession = adminChallengeFrom(request);
    if (!challengeSession?.sub || !challengeSession.role) {
      return json({ ok: false, error: "Admin authentication challenge is missing or expired." }, { status: 401 });
    }

    const payload = await readJson(request);
    requireFields(payload, ["code"]);
    const code = String(payload.code).trim();
    if (!/^\d{6}$/.test(code)) {
      return json({ ok: false, error: "Enter the six-digit authentication code." }, { status: 400 });
    }

    const rateLimit = await consumeRateLimit(request, {
      scope: "admin-2fa",
      identity: challengeSession.sub,
      limit: 5,
      windowMs: 10 * 60 * 1000
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const result = await verifyAdminChallenge({
      challengeId: challengeSession.sub,
      adminId: challengeSession.role,
      code
    });
    if (!result.ok) return json({ ok: false, error: result.error }, { status: 401 });

    const admin = await prisma.adminUser.findUnique({ where: { id: challengeSession.role } });
    if (!admin) return json({ ok: false, error: "Admin account no longer exists." }, { status: 401 });

    const headers = new Headers();
    headers.append("set-cookie", adminSessionCookie(admin));
    headers.append("set-cookie", clearAdminChallengeCookie());
    return json({ ok: true, admin: publicAdmin(admin) }, { headers });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
