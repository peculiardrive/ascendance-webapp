import { json, readJson, readState, requireFields, uid, userIdFrom, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    const state = await readState();
    const userId = userIdFrom(request);
    const payload = await readJson(request);
    requireFields(payload, ["productType", "amount"]);
    const user = state.users.find((item) => item.id === userId);
    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });

    const reference = payload.reference || `ASC-${Date.now()}`;
    const purchase = {
      id: uid("purchase"),
      userId,
      productType: payload.productType,
      bookId: payload.bookId || null,
      sectionId: payload.sectionId || null,
      amount: Number(payload.amount),
      paymentReference: reference,
      paymentGateway: payload.gateway || "Prototype Paystack",
      status: "Successful",
      createdAt: new Date().toISOString()
    };

    state.purchases.push(purchase);
    state.transactions.push({
      id: uid("tx"),
      email: user.email,
      amount: purchase.amount,
      product: payload.product || purchase.productType,
      gateway: purchase.paymentGateway,
      reference,
      status: "Successful",
      createdAt: purchase.createdAt
    });

    await writeState(state);
    return json({ ok: true, purchase }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
