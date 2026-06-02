import { publicUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    const payload = await readJson(request);
    requireFields(payload, ["email", "password"]);

    const email = String(payload.email).toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(String(payload.password), user.passwordHash)) {
      return json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return json({ ok: true, user: publicUser(updated) });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
