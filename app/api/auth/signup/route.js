import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    const state = await readState();
    const payload = await readJson(request);
    requireFields(payload, ["email"]);
    const email = String(payload.email).toLowerCase().trim();
    let user = state.users.find((item) => item.email === email);

    if (!user) {
      user = {
        id: uid("reader"),
        fullName: payload.fullName || "Ascendance Reader",
        username: "",
        email,
        phone: "",
        country: "NG",
        avatar: "A",
        emailVerified: false,
        verificationCode: "123456",
        onboardingStep: "verify",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      state.users.push(user);
    } else {
      user.lastLogin = new Date().toISOString();
    }

    await writeState(state);
    return json({ ok: true, user, verificationCode: user.verificationCode }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
