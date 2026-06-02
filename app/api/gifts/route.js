import { getPurchases, json, readJson, readState, requireFields, uid, userIdFrom, writeState } from "@/lib/store";

function generateCode() {
  return Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
}

export async function POST(request) {
  try {
    const state = await readState();
    const userId = userIdFrom(request);
    const payload = await readJson(request);
    requireFields(payload, ["recipientEmail"]);
    const sender = state.users.find((item) => item.id === userId);

    if (!sender || !sender.emailVerified) return json({ ok: false, error: "Only verified readers can send gifts." }, { status: 403 });
    if (!getPurchases(state, userId).length) return json({ ok: false, error: "Reader must purchase at least one book before gifting." }, { status: 403 });

    const gift = {
      id: uid("gift"),
      senderUserId: userId,
      senderName: sender.fullName,
      recipientEmail: String(payload.recipientEmail).toLowerCase().trim(),
      accessCode: generateCode(),
      giftPackage: payload.giftPackage || "trilogy",
      paymentReference: payload.paymentReference || `GIFT-${Date.now()}`,
      status: "Sent",
      redeemedByUserId: null,
      redeemedAt: null,
      createdAt: new Date().toISOString()
    };

    state.gifts.unshift(gift);
    await writeState(state);
    return json({ ok: true, gift }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
