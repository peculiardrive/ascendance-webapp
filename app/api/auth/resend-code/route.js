import { generateVerificationCode, hashVerificationCode, publicUser, verificationExpiry } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    requireFields(payload, ["email"]);
    const email = String(payload.email).toLowerCase().trim();
    const rateLimit = await consumeRateLimit(request, {
      scope: "resend-verification",
      identity: email,
      limit: 3,
      windowMs: 15 * 60 * 1000
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return json({ ok: true, delivery: null });
    if (user.emailVerified) return json({ ok: true, user: publicUser(user), alreadyVerified: true });

    const code = generateVerificationCode();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCodeHash: hashVerificationCode(code),
        verificationExpiresAt: verificationExpiry(),
        verificationAttempts: 0
      }
    });

    const delivery = await sendVerificationEmail({ to: email, code, name: updated.fullName });
    return json({ ok: true, user: publicUser(updated), delivery });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
