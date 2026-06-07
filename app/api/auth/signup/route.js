import { generateVerificationCode, hashPassword, hashVerificationCode, publicUser, verificationExpiry } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    requireFields(payload, ["email", "password"]);
    const email = String(payload.email).toLowerCase().trim();
    const password = String(payload.password);
    const rateLimit = await consumeRateLimit(request, {
      scope: "reader-signup",
      identity: email,
      limit: 5,
      windowMs: 30 * 60 * 1000
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    if (password.length < 8) {
      return json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.emailVerified) {
        return json({ ok: false, error: "An account already exists for this email. Log in instead." }, { status: 409 });
      }

      const code = generateVerificationCode();
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: payload.fullName || existing.fullName,
          passwordHash: hashPassword(password),
          verificationCodeHash: hashVerificationCode(code),
          verificationExpiresAt: verificationExpiry(),
          verificationAttempts: 0,
          onboardingStep: "verify",
          lastLogin: new Date()
        }
      });
      const delivery = await sendVerificationEmail({ to: email, code, name: user.fullName });
      return json({ ok: true, user: publicUser(user), delivery, resent: true });
    }

    const code = generateVerificationCode();
    const user = await prisma.user.create({
      data: {
        fullName: payload.fullName || "Ascendance Reader",
        email,
        passwordHash: hashPassword(password),
        avatar: "A",
        countryCode: "NG",
        verificationCodeHash: hashVerificationCode(code),
        verificationExpiresAt: verificationExpiry(),
        verificationAttempts: 0,
        onboardingStep: "verify",
        lastLogin: new Date()
      }
    });

    const delivery = await sendVerificationEmail({ to: email, code, name: user.fullName });
    return json({ ok: true, user: publicUser(user), delivery }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
