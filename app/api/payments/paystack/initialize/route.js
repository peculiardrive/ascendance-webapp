import { paystackAmount, paystackReference, paystackRequest, resolvePaymentProduct } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { json, readJson, readState, requireFields, uid, userIdFrom, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    const userId = userIdFrom(request);
    const payload = await readJson(request);
    requireFields(payload, ["productType"]);
    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });
    if (!user.emailVerified) return json({ ok: false, error: "Verify your email before making a payment." }, { status: 403 });

    const product = await resolvePaymentProduct(payload);
    if (product.amount <= 0) return json({ ok: false, error: "This item does not require payment." }, { status: 400 });

    const reference = paystackReference(product.productType === "trilogy" ? "ASC-TRI" : "ASC");
    const origin = new URL(request.url).origin;
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${origin}/?paystack_reference=${reference}`;

    const response = await paystackRequest("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        amount: paystackAmount(product.amount),
        currency: process.env.PAYSTACK_CURRENCY || "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId,
          productType: product.productType,
          bookId: product.bookId,
          sectionId: product.sectionId,
          product: product.product
        }
      })
    });

    const state = await readState();
    state.transactions = state.transactions || [];
    state.transactions.push({
      id: uid("tx"),
      userId,
      email: user.email,
      amount: product.amount,
      product: product.product,
      productType: product.productType,
      bookId: product.bookId,
      sectionId: product.sectionId,
      gateway: "Paystack",
      reference,
      status: "Pending",
      authorizationUrl: response.data.authorization_url,
      createdAt: new Date().toISOString()
    });
    await writeState(state);

    return json({
      ok: true,
      reference,
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
