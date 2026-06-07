import { prisma } from "@/lib/prisma";
import { json, readState, userIdFrom, writeState } from "@/lib/store";

export async function GET(request) {
  const state = await readState();
  const userId = userIdFrom(request);
  if (userId) {
    const [purchases, gifts] = await Promise.all([
      prisma.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.gift.findMany({ where: { senderUserId: userId }, orderBy: { createdAt: "desc" } })
    ]);
    state.purchases = purchases.map((purchase) => ({
      ...purchase,
      amount: Number(purchase.amount),
      status: purchase.paymentStatus
    }));
    state.gifts = gifts;
  }
  return json({ ok: true, state });
}

export async function PUT(request) {
  const payload = await request.json();
  await writeState(payload);
  return json({ ok: true, savedAt: new Date().toISOString() });
}
