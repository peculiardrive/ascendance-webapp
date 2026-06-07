import { prisma } from "@/lib/prisma";
import { json, publicBook, readState, userIdFrom } from "@/lib/store";

export async function GET(request) {
  const state = await readState();
  const userId = userIdFrom(request);
  if (userId) {
    const purchases = await prisma.purchase.findMany({
      where: { userId, paymentStatus: "Successful" }
    });
    state.purchases = purchases.map((purchase) => ({
      ...purchase,
      amount: Number(purchase.amount),
      status: purchase.paymentStatus
    }));
  }
  return json({ ok: true, books: state.books.map((book) => publicBook(book, state, userId)) });
}
