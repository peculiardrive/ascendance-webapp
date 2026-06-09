import { createAdminChallenge, revokeAdminChallenge } from "@/lib/admin-2fa";
import { publicAdmin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { adminSessionCookie, assertSameOrigin, clearAdminChallengeCookie } from "@/lib/session";
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

    const headers = new Headers();
    headers.append("set-cookie", clearAdminChallengeCookie());
    headers.append("set-cookie", adminSessionCookie(admin));
    
    return json(
      {
        ok: true,
        requiresTwoFactor: false,
        admin: publicAdmin(admin)
      },
      { headers }
    );
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
