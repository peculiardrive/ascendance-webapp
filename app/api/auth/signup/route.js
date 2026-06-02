import { hashPassword, publicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    const payload = await readJson(request);
    requireFields(payload, ["email", "password"]);
    const email = String(payload.email).toLowerCase().trim();
    const password = String(payload.password);

    if (password.length < 8) {
      return json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return json({ ok: false, error: "An account already exists for this email. Log in instead." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        fullName: payload.fullName || "Ascendance Reader",
        email,
        passwordHash: hashPassword(password),
        avatar: "A",
        countryCode: "NG",
        onboardingStep: "verify",
        lastLogin: new Date()
      }
    });

    return json({ ok: true, user: publicUser(user), verificationCode: "123456" }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
