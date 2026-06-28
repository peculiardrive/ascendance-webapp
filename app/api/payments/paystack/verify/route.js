import { generateGiftCode } from "@/lib/gifts";
import { sendGiftNotificationEmail } from "@/lib/email";
import { paystackAmount, paystackRequest, resolvePaymentProduct } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom, readerSessionCookie } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    let userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);
    requireFields(payload, ["reference"]);

    const reference = String(payload.reference).trim();
    const existing = await prisma.purchase.findUnique({ where: { paymentReference: reference } });
    if (existing) {
      return json({
        ok: true,
        purchase: { ...existing, amount: Number(existing.amount), status: existing.paymentStatus },
        alreadyVerified: true
      }, {
        headers: { "set-cookie": readerSessionCookie(existing.userId) }
      });
    }

    const verification = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
    const metadata = verification.data.metadata || {};
    const transactionUserId = metadata.userId;

    if (!transactionUserId) {
      return json({ ok: false, error: "Invalid payment transaction metadata." }, { status: 400 });
    }

    if (userId && userId !== transactionUserId) {
      return json({ ok: false, error: "Payment does not belong to this reader." }, { status: 403 });
    }

    userId = transactionUserId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });

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

      // Log GIFT_PURCHASE activity
      await prisma.userActivity.create({
        data: {
          userId,
          email: user.email,
          action: "GIFT_PURCHASE",
          details: {
            giftId: savedGift.id,
            recipientEmail: savedGift.recipientEmail,
            amount: product.amount,
            reference
          },
          device: "Web"
        }
      }).catch(err => console.error("Failed to log gift purchase activity:", err));

      // Construct baseUrl from request headers
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "www.ascendance-trilogy.com";
      const baseUrl = `${protocol}://${host}`;

      try {
        await sendGiftNotificationEmail({
          to: savedGift.recipientEmail,
          accessCode: savedGift.accessCode,
          senderName: user.fullName,
          baseUrl
        });
      } catch (err) {
        console.error("Failed to send gift notification email:", err);
      }

      const gift = { ...savedGift, senderName: user.fullName };
      state.gifts.unshift(gift);
      transaction.status = "Successful";
      transaction.verifiedAt = gift.createdAt;
      transaction.gatewayResponse = verification.data.gateway_response;
      if (!state.transactions.some((item) => item.reference === reference)) state.transactions.push(transaction);
      await writeState(state);
      return json({ ok: true, gift, transaction }, { headers: { "set-cookie": readerSessionCookie(userId) } });
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
        paymentStatus: "Successful",
        referralPartnerId: metadata.referralPartnerId || null
      }
    });

    // Log PURCHASE activity
    await prisma.userActivity.create({
      data: {
        userId,
        email: user.email,
        action: "PURCHASE",
        details: {
          purchaseId: savedPurchase.id,
          productType: product.productType,
          amount: product.amount,
          reference
        },
        device: "Web"
      }
    }).catch(err => console.error("Failed to log purchase activity:", err));

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

    return json({ ok: true, purchase, transaction }, { headers: { "set-cookie": readerSessionCookie(userId) } });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
