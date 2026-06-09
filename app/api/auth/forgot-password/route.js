import { hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { json, readJson } from "@/lib/store";

export async function POST(request) {
  try {
    const payload = await readJson(request);
    const email = payload.email?.toLowerCase().trim();

    if (!email) {
      return json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return ok anyway to prevent email enumeration
      return json({ ok: true, provider: "none" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const hashedCode = await hashPassword(code);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCodeHash: hashedCode,
        passwordResetExpiresAt: expiresAt
      }
    });

    if (!process.env.RESEND_API_KEY) {
      console.log(`[DEV ONLY] Password Reset Code for ${email}: ${code}`);
      return json({ ok: true, provider: "console" });
    }

    const delivery = await sendPasswordResetEmail({ to: email, code, name: user.fullName });
    return json({ ok: true, provider: delivery.provider });
  } catch (error) {
    console.error("Forgot password error:", error);
    return json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
