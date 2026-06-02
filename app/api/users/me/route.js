import { json, readJson, readState, userIdFrom, writeState } from "@/lib/store";

export async function PATCH(request) {
  const state = await readState();
  const userId = userIdFrom(request);
  const payload = await readJson(request);
  const user = state.users.find((item) => item.id === userId);

  if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });

  Object.assign(user, {
    fullName: payload.fullName ?? user.fullName,
    username: payload.username ?? user.username,
    phone: payload.phone ?? user.phone,
    country: payload.country ?? user.country,
    avatar: payload.avatar ?? user.avatar
  });

  if (user.emailVerified && user.phone && user.username) user.onboardingStep = "done";
  else if (user.emailVerified && user.phone) user.onboardingStep = "profile";

  await writeState(state);
  return json({ ok: true, user });
}
