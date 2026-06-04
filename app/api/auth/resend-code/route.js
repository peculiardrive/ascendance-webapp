import { generateVerificationCode, hashVerificationCode, publicUser, verificationExpiry } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    const payload = await readJson(request);
    requireFields(payload, ["email"]);
    const email = String(payload.email).toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });
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
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
