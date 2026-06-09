import { createAdminChallenge, revokeAdminChallenge } from "@/lib/admin-2fa";
import { publicAdmin, verifyPassword } from "@/lib/auth";
import { sendAdminTwoFactorEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { adminChallengeCookie, assertSameOrigin, clearAdminSessionCookie } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    requireFields(payload, ["email", "password"]);

    const email = String(payload.email).toLowerCase().trim();
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin-login",
      identity: email,
      limit: 5,
      windowMs: 15 * 60 * 1000
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin || !verifyPassword(String(payload.password), admin.passwordHash)) {
      return json({ ok: false, error: "Invalid admin email or password." }, { status: 401 });
    }

    const challenge = await createAdminChallenge(admin.id);
    try {
      await sendAdminTwoFactorEmail({
        to: admin.email,
        code: challenge.code,
        challengeId: challenge.id
      });
    } catch (error) {
      await revokeAdminChallenge(challenge.id);
      throw error;
    }

    const headers = new Headers();
    headers.append("set-cookie", clearAdminSessionCookie());
    headers.append("set-cookie", adminChallengeCookie(challenge.id, admin.id));
    
    return json(
      {
        ok: true,
        requiresTwoFactor: true,
        delivery: process.env.NODE_ENV === "production" ? "email" : "email-or-console"
      },
      { headers }
    );
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
