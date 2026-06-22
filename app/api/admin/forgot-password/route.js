import { hashPassword } from "@/lib/auth";
import { sendAdminPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/session";
import { json, readJson } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    const email = payload.email?.toLowerCase().trim();

    if (!email) {
      return json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      // Prevent email enumeration
      return json({ ok: true, provider: "none" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const hashedCode = hashPassword(code);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordResetCodeHash: hashedCode,
        passwordResetExpiresAt: expiresAt
      }
    });

    if (!process.env.RESEND_API_KEY) {
      console.log(`[DEV ONLY] Admin Password Reset Code for ${email}: ${code}`);
      return json({ ok: true, provider: "console" });
    }

    const delivery = await sendAdminPasswordResetEmail({ to: email, code, name: admin.name });
    return json({ ok: true, provider: delivery.provider });
  } catch (error) {
    console.error("Admin forgot password error:", error);
    return json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
