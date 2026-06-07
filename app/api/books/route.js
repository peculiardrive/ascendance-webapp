import { prisma } from "@/lib/prisma";
import { readerSessionFrom } from "@/lib/session";
import { json, publicBook, readState } from "@/lib/store";

export async function GET(request) {
  const state = await readState();
  const userId = readerSessionFrom(request)?.sub || null;
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
