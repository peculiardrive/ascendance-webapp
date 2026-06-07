import { publicUser, verifyCode } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { assertSameOrigin, readerSessionCookie } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    requireFields(payload, ["email", "code"]);
    const email = String(payload.email).toLowerCase().trim();
    const rateLimit = await consumeRateLimit(request, {
      scope: "verify-email",
      identity: email,
      limit: 10,
      windowMs: 15 * 60 * 1000
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return json({ ok: false, error: "Invalid verification code." }, { status: 400 });
    }

    if (user.emailVerified) {
      return json(
        { ok: true, user: publicUser(user) },
        { headers: { "set-cookie": readerSessionCookie(user.id) } }
      );
    }

    if (!user.verificationCodeHash || !user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
      return json({ ok: false, error: "Verification code expired. Request a new code." }, { status: 400 });
    }

    if (user.verificationAttempts >= 5) {
      return json({ ok: false, error: "Too many attempts. Request a new code." }, { status: 429 });
    }

    if (!verifyCode(payload.code, user.verificationCodeHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: { increment: 1 } }
      });
      return json({ ok: false, error: "Invalid verification code." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCodeHash: null,
        verificationExpiresAt: null,
        verificationAttempts: 0,
        onboardingStep: user.phone ? "profile" : "phone"
      }
    });

    return json(
      { ok: true, user: publicUser(updated) },
      { headers: { "set-cookie": readerSessionCookie(updated.id) } }
    );
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
