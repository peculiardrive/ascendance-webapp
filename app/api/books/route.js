import { prisma } from "@/lib/prisma";
import { readerSessionFrom, adminSessionFrom } from "@/lib/session";
import { json, publicBook, readState } from "@/lib/store";

export async function GET(request) {
  const state = await readState();
  const userId = readerSessionFrom(request)?.sub || null;
  const isAdmin = !!adminSessionFrom(request);
  const includeDeleted = isAdmin && new URL(request.url).searchParams.get("includeDeleted") === "true";

  if (userId) {
    let purchases = [];
    if (process.env.DATABASE_URL) {
      purchases = await prisma.purchase.findMany({
        where: { userId, paymentStatus: "Successful" }
      });
    }
    state.purchases = purchases.map((purchase) => ({
      ...purchase,
      amount: Number(purchase.amount),
      status: purchase.paymentStatus
    }));
  }

  let activeBooks = state.books;
  if (!includeDeleted) {
    activeBooks = state.books
      .filter((book) => !book.deleted)
      .map((book) => {
        const activeSections = (book.sections || [])
          .filter((sec) => !sec.deleted)
          .map((sec) => {
            const activeChapters = (sec.chapters || []).filter((ch) => !ch.deleted);
            return { ...sec, chapters: activeChapters };
          });
        return { ...book, sections: activeSections };
      });
  }

  return json({ ok: true, books: activeBooks.map((book) => publicBook(book, state, userId, isAdmin)) });
}
