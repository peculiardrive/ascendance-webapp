import { hashPassword, publicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom, readerSessionCookie } from "@/lib/session";
import { json, readJson, requireFields } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const userId = readerSessionFrom(request)?.sub;
    if (!userId) {
      return json({ ok: false, error: "Missing user session." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return json({ ok: false, error: "User not found." }, { status: 404 });
    }

    if (user.onboardingStep !== "signup-payment-pending") {
      return json({ ok: false, error: "Invalid onboarding step." }, { status: 400 });
    }

    const payload = await readJson(request);
    requireFields(payload, ["fullName", "password", "phone", "username", "country"]);

    const fullName = String(payload.fullName).trim();
    const password = String(payload.password);
    const phone = String(payload.phone).trim();
    const username = String(payload.username).trim().toLowerCase();
    const country = String(payload.country).toUpperCase().trim();

    if (password.length < 8) {
      return json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername && existingUsername.id !== user.id) {
      return json({ ok: false, error: "Username is already taken." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName,
        passwordHash: hashPassword(password),
        phone,
        username,
        countryCode: country,
        emailVerified: true,
        onboardingStep: "done",
        lastLogin: new Date()
      }
    });

    return json(
      { ok: true, user: publicUser(updated) },
      { headers: { "set-cookie": readerSessionCookie(updated.id) } }
    );
  } catch (error) {
    console.error("Complete signup error:", error);
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
