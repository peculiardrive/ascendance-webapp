import { publicAdmin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    const payload = await readJson(request);
    requireFields(payload, ["email", "password"]);

    const email = String(payload.email).toLowerCase().trim();
    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin || !verifyPassword(String(payload.password), admin.passwordHash)) {
      return json({ ok: false, error: "Invalid admin email or password." }, { status: 401 });
    }

    return json({ ok: true, admin: publicAdmin(admin) });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
