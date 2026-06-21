import { prisma } from "@/lib/prisma";
import { adminSessionFrom, readerSessionFrom } from "@/lib/session";
import { json, readState } from "@/lib/store";

export async function GET(request) {
  const storedState = await readState();
  const readerSession = readerSessionFrom(request);
  const adminSession = adminSessionFrom(request);
  const admin = adminSession
    ? await prisma.adminUser.findUnique({ where: { id: adminSession.sub }, select: { id: true } })
    : null;

  const purchaseWhere = admin ? {} : readerSession ? { userId: readerSession.sub } : null;
  const giftWhere = admin ? {} : readerSession ? { senderUserId: readerSession.sub } : null;
  const progressWhere = readerSession ? { userId: readerSession.sub } : null;

  const [purchases, gifts, progressRows] = await Promise.all([
    purchaseWhere
      ? prisma.purchase.findMany({ where: purchaseWhere, orderBy: { createdAt: "desc" } })
      : [],
    giftWhere
      ? prisma.gift.findMany({ where: giftWhere, orderBy: { createdAt: "desc" } })
      : [],
    progressWhere
      ? prisma.readingProgress.findMany({ where: progressWhere, orderBy: { lastReadAt: "asc" } })
      : []
  ]);

  const progress = Object.fromEntries(progressRows.map((item) => [
    item.chapterId,
    {
      userId: item.userId,
      bookId: item.bookId,
      sectionId: item.sectionId,
      chapterId: item.chapterId,
      scrollPosition: item.scrollPosition,
      percentage: Number(item.percentageCompleted),
      lastReadAt: item.lastReadAt,
      deviceType: item.deviceType
    }
  ]));

  return json({
    ok: true,
    state: {
      purchases: purchases.map((purchase) => ({
        id: purchase.id,
        userId: purchase.userId,
        productType: purchase.productType,
        bookId: purchase.bookId,
        sectionId: purchase.sectionId,
        amount: Number(purchase.amount),
        paymentReference: purchase.paymentReference,
        paymentGateway: purchase.paymentGateway,
        paymentStatus: purchase.paymentStatus,
        status: purchase.paymentStatus,
        createdAt: purchase.createdAt
      })),
      gifts,
      progress,
      settings: storedState.settings
    }
  });
}
