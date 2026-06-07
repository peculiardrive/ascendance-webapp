import { paystackAmount, paystackReference, paystackRequest, resolvePaymentProduct } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);
    requireFields(payload, ["productType"]);
    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });
    if (!user.emailVerified) return json({ ok: false, error: "Verify your email before making a payment." }, { status: 403 });

    const product = await resolvePaymentProduct(payload);
    if (product.amount <= 0) return json({ ok: false, error: "This item does not require payment." }, { status: 400 });

    const state = await readState();
    const recipientEmail = String(payload.recipientEmail || "").toLowerCase().trim();
    if (product.productType === "gift-trilogy") {
      if (!recipientEmail) return json({ ok: false, error: "Recipient email is required." }, { status: 400 });
      const purchaseCount = await prisma.purchase.count({
        where: { userId, paymentStatus: "Successful" }
      });
      if (!purchaseCount) {
        return json({ ok: false, error: "Purchase at least one book before sending a gift." }, { status: 403 });
      }
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentGiftCount = await prisma.gift.count({
        where: { senderUserId: userId, createdAt: { gte: oneWeekAgo } }
      });
      if (recentGiftCount >= Number(state.settings.giftLimit || 5)) {
        return json({ ok: false, error: "Weekly gift limit reached." }, { status: 403 });
      }
    }

    const prefix = product.productType === "trilogy" ? "ASC-TRI" : product.productType === "gift-trilogy" ? "ASC-GIFT" : "ASC";
    const reference = paystackReference(prefix);
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
          product: product.product,
          recipientEmail
        }
      })
    });

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
      recipientEmail: recipientEmail || null,
      usdAmount: product.usdAmount || null,
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
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
