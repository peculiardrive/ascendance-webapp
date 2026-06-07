import { generateGiftCode } from "@/lib/gifts";
import { paystackAmount, paystackRequest, resolvePaymentProduct } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);
    requireFields(payload, ["reference"]);
    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });

    const reference = String(payload.reference).trim();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });

    const existing = await prisma.purchase.findUnique({ where: { paymentReference: reference } });
    if (existing) {
      return json({
        ok: true,
        purchase: { ...existing, amount: Number(existing.amount), status: existing.paymentStatus },
        alreadyVerified: true
      });
    }

    const verification = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
    const metadata = verification.data.metadata || {};
    if (metadata.userId !== userId) {
      return json({ ok: false, error: "Payment does not belong to this reader." }, { status: 403 });
    }

    const product = await resolvePaymentProduct({
      productType: metadata.productType,
      bookId: metadata.bookId || null,
      sectionId: metadata.sectionId || null
    });
    const paid = verification.data.status === "success";
    const expectedAmount = paystackAmount(product.amount);
    const paidAmount = Number(verification.data.amount || 0);

    if (!paid || paidAmount !== expectedAmount) {
      return json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
    }

    const state = await readState();
    state.transactions = state.transactions || [];
    state.purchases = state.purchases || [];
    state.gifts = state.gifts || [];
    const transaction = state.transactions.find((item) => item.reference === reference) || {
      id: uid("tx"),
      userId,
      email: user.email,
      amount: product.amount,
      product: product.product,
      productType: product.productType,
      bookId: product.bookId,
      sectionId: product.sectionId,
      recipientEmail: metadata.recipientEmail || null,
      gateway: "Paystack",
      reference,
      createdAt: new Date().toISOString()
    };

    if (product.productType === "gift-trilogy") {
      const existingGift = await prisma.gift.findFirst({ where: { paymentReference: reference } });
      if (existingGift) return json({ ok: true, gift: existingGift, alreadyVerified: true });

      const savedGift = await prisma.gift.create({
        data: {
          senderUserId: userId,
          recipientEmail: String(metadata.recipientEmail || "").toLowerCase().trim(),
          accessCode: generateGiftCode(),
          giftPackage: "trilogy",
          paymentReference: reference,
          status: "Sent"
        }
      });
      const gift = { ...savedGift, senderName: user.fullName };
      state.gifts.unshift(gift);
      transaction.status = "Successful";
      transaction.verifiedAt = gift.createdAt;
      transaction.gatewayResponse = verification.data.gateway_response;
      if (!state.transactions.some((item) => item.reference === reference)) state.transactions.push(transaction);
      await writeState(state);
      return json({ ok: true, gift, transaction });
    }

    const savedPurchase = await prisma.purchase.create({
      data: {
        userId,
        productType: product.productType,
        bookId: product.bookId || null,
        sectionId: product.sectionId || null,
        amount: product.amount,
        paymentReference: reference,
        paymentGateway: "Paystack",
        paymentStatus: "Successful"
      }
    });
    const purchase = {
      ...savedPurchase,
      amount: Number(savedPurchase.amount),
      status: savedPurchase.paymentStatus
    };

    state.purchases.push(purchase);
    transaction.status = "Successful";
    transaction.verifiedAt = purchase.createdAt;
    transaction.gatewayResponse = verification.data.gateway_response;
    if (!state.transactions.some((item) => item.reference === reference)) state.transactions.push(transaction);
    await writeState(state);

    return json({ ok: true, purchase, transaction });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
