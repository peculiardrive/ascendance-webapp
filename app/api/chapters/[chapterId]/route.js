import { prisma } from "@/lib/prisma";
import { readerSessionFrom } from "@/lib/session";
import { flattenChapters, hasChapterAccess, json, readState } from "@/lib/store";

export async function GET(request, { params }) {
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
  const { chapterId } = await params;
  const match = flattenChapters(state.books).find((item) => item.chapter.id === chapterId);

  if (!match) return json({ ok: false, error: "Chapter not found." }, { status: 404 });
  if (!hasChapterAccess(state, userId, match.book, match.chapter)) {
    return json({ ok: false, locked: true, error: "Chapter is locked." }, { status: 403 });
  }

  return json({ ok: true, ...match });
}
