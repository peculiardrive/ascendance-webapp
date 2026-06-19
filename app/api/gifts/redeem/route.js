import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);
    requireFields(payload, ["accessCode"]);

    if (!userId) {
      return json({ ok: false, error: "Missing user session." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return json({ ok: false, error: "User not found." }, { status: 404 });
    }

    const code = String(payload.accessCode).toUpperCase().trim();
    
    // Find the gift by code
    const gift = await prisma.gift.findUnique({
      where: { accessCode: code }
    });

    if (!gift) {
      return json({ ok: false, error: "Gift code is invalid." }, { status: 404 });
    }

    if (gift.status === "Redeemed") {
      return json({ ok: false, error: "This gift code has already been redeemed." }, { status: 400 });
    }

    // Verify recipient email matches current user email
    if (gift.recipientEmail.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      return json({ ok: false, error: "This gift was purchased for a different email address." }, { status: 403 });
    }

    // Process the redemption transaction in the DB
    const [updatedGift, purchase] = await prisma.$transaction([
      prisma.gift.update({
        where: { accessCode: code },
        data: {
          status: "Redeemed",
          redeemedByUserId: userId,
          redeemedAt: new Date()
        }
      }),
      prisma.purchase.create({
        data: {
          userId,
          productType: "gift-trilogy",
          amount: 0,
          paymentReference: gift.paymentReference || `GIFT-REDEEM-${uid("p")}`,
          paymentGateway: "Gift Code",
          paymentStatus: "Successful"
        }
      })
    ]);

    // Synchronize to the local next-state.json file for prototype consistency
    const state = await readState();
    state.gifts = state.gifts || [];
    state.purchases = state.purchases || [];

    // Find and update the gift in the JSON array
    const stateGiftIdx = state.gifts.findIndex(g => g.accessCode === code);
    if (stateGiftIdx !== -1) {
      state.gifts[stateGiftIdx].status = "Redeemed";
      state.gifts[stateGiftIdx].redeemedByUserId = userId;
      state.gifts[stateGiftIdx].redeemedAt = updatedGift.redeemedAt.toISOString();
    } else {
      // If it wasn't in state.gifts, push the new updated record
      state.gifts.unshift({
        ...updatedGift,
        redeemedAt: updatedGift.redeemedAt.toISOString()
      });
    }

    // Add the purchase to state.purchases
    state.purchases.push({
      ...purchase,
      amount: Number(purchase.amount),
      status: purchase.paymentStatus
    });

    await writeState(state);

    return json({
      ok: true,
      gift: {
        ...updatedGift,
        redeemedAt: updatedGift.redeemedAt.toISOString()
      },
      purchase: {
        ...purchase,
        amount: Number(purchase.amount),
        status: purchase.paymentStatus
      }
    });

  } catch (error) {
    console.error("Redemption error:", error);
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
