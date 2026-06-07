import { publicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json, readJson } from "@/lib/store";

export async function PATCH(request) {
  try {
    assertSameOrigin(request);
    const userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);

    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return json({ ok: false, error: "User not found." }, { status: 404 });

    const nextPhone = payload.phone == null ? existing.phone : String(payload.phone).trim().slice(0, 32);
    const nextUsername = payload.username == null ? existing.username : String(payload.username).trim().slice(0, 40);
    const fullName = payload.fullName == null ? existing.fullName : String(payload.fullName).trim().slice(0, 100);
    const countryCode = payload.country == null ? existing.countryCode : String(payload.country).trim().toUpperCase().slice(0, 3);
    const nextStep = existing.emailVerified && nextPhone && nextUsername ? "done" : existing.emailVerified && nextPhone ? "profile" : existing.onboardingStep;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        username: nextUsername || null,
        phone: nextPhone || null,
        countryCode,
        avatar: payload.avatar == null ? existing.avatar : String(payload.avatar).slice(0, 8),
        onboardingStep: nextStep
      }
    });

    return json({ ok: true, user: publicUser(user) });
  } catch (error) {
    const message = error.code === "P2002" ? "That username is already taken." : error.message;
    return json({ ok: false, error: message }, { status: error.status || 400 });
  }
}
