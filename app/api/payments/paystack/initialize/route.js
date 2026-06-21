import { paystackAmount, paystackReference, paystackRequest, resolvePaymentProduct } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    let userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);
    requireFields(payload, ["productType"]);

    let user;
    if (!userId) {
      const email = payload.email?.toLowerCase().trim();
      if (!email) {
        return json({ ok: false, error: "Email is required for checkout." }, { status: 400 });
      }
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        if (user.onboardingStep === "done") {
          return json({ ok: false, error: "This email is already registered. Please log in to complete your purchase." }, { status: 400 });
        }
        if (user.onboardingStep !== "signup-payment-pending") {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { onboardingStep: "signup-payment-pending" }
          });
        }
        userId = user.id;
      } else {
        user = await prisma.user.create({
          data: {
            email,
            fullName: "Guest Reader",
            emailVerified: false,
            onboardingStep: "signup-payment-pending"
          }
        });
        userId = user.id;
      }
    } else {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });
    }

    if (user.onboardingStep !== "signup-payment-pending" && !user.emailVerified) {
      return json({ ok: false, error: "Verify your email before making a payment." }, { status: 403 });
    }

    const product = await resolvePaymentProduct(payload);
    if (product.amount <= 0) return json({ ok: false, error: "This item does not require payment." }, { status: 400 });

    if (product.productType === "book") {
      if (product.bookId === "book-2") {
        const ownsBook1 = await prisma.purchase.findFirst({
          where: {
            userId,
            paymentStatus: "Successful",
            OR: [
              { productType: "trilogy" },
              { productType: "gift-trilogy" },
              { bookId: "book-1" }
            ]
          }
        });
        if (!ownsBook1) {
          return json({ ok: false, error: "You must purchase Volume 1 (Disciples of the Inverted Cross) before you can purchase Volume 2." }, { status: 403 });
        }
      }
      if (product.bookId === "book-3") {
        const ownsBook2 = await prisma.purchase.findFirst({
          where: {
            userId,
            paymentStatus: "Successful",
            OR: [
              { productType: "trilogy" },
              { productType: "gift-trilogy" },
              { bookId: "book-2" }
            ]
          }
        });
        if (!ownsBook2) {
          return json({ ok: false, error: "You must purchase Volume 2 (Merchants of the Ivory Towers) before you can purchase Volume 3." }, { status: 403 });
        }
      }
    }

    const state = await readState();
    const recipientEmail = String(payload.recipientEmail || "").toLowerCase().trim();
    if (product.productType === "gift-trilogy") {
      if (!recipientEmail) return json({ ok: false, error: "Recipient email is required." }, { status: 400 });
      const ownsBook1OrTrilogy = await prisma.purchase.findFirst({
        where: {
          userId,
          paymentStatus: "Successful",
          OR: [
            { productType: "trilogy" },
            { productType: "gift-trilogy" },
            { bookId: "book-1" }
          ]
        }
      });
      if (!ownsBook1OrTrilogy) {
        return json({ ok: false, error: "You must purchase Book One or the Trilogy before you can send a gift." }, { status: 403 });
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
