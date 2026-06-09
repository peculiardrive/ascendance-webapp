import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json, readJson } from "@/lib/store";

export async function PUT(request) {
  try {
    assertSameOrigin(request);
    const userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);

    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });

    const { currentPassword, newPassword } = payload;
    if (!currentPassword || !newPassword) {
      return json({ ok: false, error: "Missing password fields." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return json({ ok: false, error: "New password must be at least 8 characters long." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return json({ ok: false, error: "User not found." }, { status: 404 });

    // Users who signed up via OTP or don't have a password set yet cannot change password this way
    if (!existing.passwordHash) {
      return json({ ok: false, error: "You do not have a password set. Please use password reset." }, { status: 400 });
    }

    const isValid = verifyPassword(String(currentPassword), existing.passwordHash);
    if (!isValid) {
      return json({ ok: false, error: "Incorrect current password." }, { status: 403 });
    }

    const newHash = hashPassword(String(newPassword));

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
