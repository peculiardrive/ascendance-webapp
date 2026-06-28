import { createHmac, timingSafeEqual } from "node:crypto";
import { generateGiftCode } from "@/lib/gifts";
import { sendGiftNotificationEmail } from "@/lib/email";
import { paystackAmount, resolvePaymentProduct } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { json, readState, uid, writeState } from "@/lib/store";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) return json({ ok: false, error: "PAYSTACK_SECRET_KEY is not configured." }, { status: 500 });

  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(hash);
  const actual = Buffer.from(signature || "");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return json({ ok: false, error: "Invalid Paystack signature." }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "Invalid webhook payload." }, { status: 400 });
  }
  if (event.event !== "charge.success") return json({ ok: true, ignored: true });

  const data = event.data || {};
  const reference = data.reference;
  const metadata = data.metadata || {};
  if (!reference || !metadata.userId || !metadata.productType) {
    return json({ ok: false, error: "Paystack metadata is incomplete." }, { status: 400 });
  }

  const product = await resolvePaymentProduct({
    productType: metadata.productType,
    bookId: metadata.bookId || null,
    sectionId: metadata.sectionId || null
  });
  if (Number(data.amount || 0) !== paystackAmount(product.amount)) {
    return json({ ok: false, error: "Paystack amount mismatch." }, { status: 400 });
  }

  if (product.productType === "gift-trilogy") {
    const existingGift = await prisma.gift.findFirst({ where: { paymentReference: reference } });
    if (!existingGift) {
      const savedGift = await prisma.gift.create({
        data: {
          senderUserId: metadata.userId,
          recipientEmail: String(metadata.recipientEmail || "").toLowerCase().trim(),
          accessCode: generateGiftCode(),
          giftPackage: "trilogy",
          paymentReference: reference,
          status: "Sent"
        }
      });

      // Retrieve the sender user details to get their full name
      const senderUser = await prisma.user.findUnique({ where: { id: metadata.userId } });
      const senderName = senderUser ? senderUser.fullName : "A reader";

      // Log GIFT_PURCHASE activity
      await prisma.userActivity.create({
        data: {
          userId: metadata.userId,
          email: senderUser?.email || null,
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
          senderName,
          baseUrl
        });
      } catch (err) {
        console.error("Failed to send gift notification email in webhook:", err);
      }
    }
    return json({ ok: true });
  }

  const existingPurchase = await prisma.purchase.findUnique({ where: { paymentReference: reference } });
  if (!existingPurchase) {
    const newPurchase = await prisma.purchase.create({
      data: {
        userId: metadata.userId,
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

    // Retrieve the user to get their email
    const user = await prisma.user.findUnique({ where: { id: metadata.userId } });

    // Log PURCHASE activity
    await prisma.userActivity.create({
      data: {
        userId: metadata.userId,
        email: user?.email || null,
        action: "PURCHASE",
        details: {
          purchaseId: newPurchase.id,
          productType: product.productType,
          amount: product.amount,
          reference
        },
        device: "Web"
      }
    }).catch(err => console.error("Failed to log purchase activity:", err));
  }

  const state = await readState();
  state.transactions = state.transactions || [];
  const transaction = state.transactions.find((item) => item.reference === reference) || {
    id: uid("tx"),
    userId: metadata.userId,
    amount: product.amount,
    product: product.product,
    productType: product.productType,
    bookId: product.bookId,
    sectionId: product.sectionId,
    gateway: "Paystack",
    reference,
    createdAt: new Date().toISOString()
  };
  transaction.status = "Successful";
  transaction.verifiedAt = new Date().toISOString();
  if (!state.transactions.some((item) => item.reference === reference)) state.transactions.push(transaction);
  await writeState(state);
  return json({ ok: true });
}
