import { publicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json, readJson, userIdFrom } from "@/lib/store";

export async function PATCH(request) {
  try {
    const userId = userIdFrom(request);
    const payload = await readJson(request);

    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return json({ ok: false, error: "User not found." }, { status: 404 });

    const nextPhone = payload.phone ?? existing.phone;
    const nextUsername = payload.username ?? existing.username;
    const nextStep = existing.emailVerified && nextPhone && nextUsername ? "done" : existing.emailVerified && nextPhone ? "profile" : existing.onboardingStep;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: payload.fullName ?? existing.fullName,
        username: nextUsername || null,
        phone: nextPhone || null,
        countryCode: payload.country ?? existing.countryCode,
        avatar: payload.avatar ?? existing.avatar,
        onboardingStep: nextStep
      }
    });

    return json({ ok: true, user: publicUser(user) });
  } catch (error) {
    const message = error.code === "P2002" ? "That username is already taken." : error.message;
    return json({ ok: false, error: message }, { status: 400 });
  }
}
