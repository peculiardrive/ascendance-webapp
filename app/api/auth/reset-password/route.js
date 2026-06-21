import { hashPassword, publicUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readerSessionCookie } from "@/lib/session";
import { json, readJson } from "@/lib/store";

export async function POST(request) {
  try {
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
      return json({ ok: false, error: "Invalid or expired reset code." }, { status: 400 });
    }

    if (new Date() > user.passwordResetExpiresAt) {
      return json({ ok: false, error: "Reset code has expired." }, { status: 400 });
    }

    const isCodeValid = verifyPassword(code, user.passwordResetCodeHash);
    if (!isCodeValid) {
      return json({ ok: false, error: "Invalid reset code." }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetCodeHash: null,
        passwordResetExpiresAt: null,
        lastLogin: new Date()
      }
    });

    return json(
      { ok: true, user: publicUser(updatedUser) },
      { headers: { "set-cookie": readerSessionCookie(updatedUser.id) } }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
