import { json, readJson, readState, requireFields, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    const state = await readState();
    const payload = await readJson(request);
    requireFields(payload, ["email", "code"]);
    const user = state.users.find((item) => item.email === String(payload.email).toLowerCase().trim());

    if (!user || user.verificationCode !== String(payload.code)) {
      return json({ ok: false, error: "Invalid verification code." }, { status: 400 });
    }

    user.emailVerified = true;
    user.onboardingStep = user.phone ? "profile" : "phone";
    await writeState(state);
    return json({ ok: true, user });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
