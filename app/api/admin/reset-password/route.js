import { hashPassword, publicAdmin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminSessionCookie, assertSameOrigin } from "@/lib/session";
import { json, readJson } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const payload = await readJson(request);
    const email = payload.email?.toLowerCase().trim();
    const code = payload.code?.trim();
    const newPassword = payload.newPassword;

    if (!email || !code || !newPassword) {
      return json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return json({ ok: false, error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.passwordResetCodeHash || !admin.passwordResetExpiresAt) {
      return json({ ok: false, error: "Invalid or expired reset code." }, { status: 400 });
    }

    if (new Date() > admin.passwordResetExpiresAt) {
      return json({ ok: false, error: "Reset code has expired." }, { status: 400 });
    }

    const isCodeValid = verifyPassword(code, admin.passwordResetCodeHash);
    if (!isCodeValid) {
      return json({ ok: false, error: "Invalid reset code." }, { status: 400 });
    }

    const newPasswordHash = hashPassword(newPassword);

    const updatedAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetCodeHash: null,
        passwordResetExpiresAt: null
      }
    });

    return json(
      { ok: true, admin: publicAdmin(updatedAdmin) },
      { headers: { "set-cookie": adminSessionCookie(updatedAdmin) } }
    );
  } catch (error) {
    console.error("Admin reset password error:", error);
    return json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
