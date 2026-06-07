import { prisma } from "@/lib/prisma";
import { assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { flattenChapters, hasChapterAccess, json, readJson, readState, requireFields } from "@/lib/store";

export async function PUT(request) {
  try {
    assertSameOrigin(request);
    const state = await readState();
    const userId = readerSessionFrom(request)?.sub;
    const payload = await readJson(request);
    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });
    requireFields(payload, ["chapterId"]);

    const match = flattenChapters(state.books).find((item) => item.chapter.id === payload.chapterId);
    if (!match) return json({ ok: false, error: "Chapter not found." }, { status: 404 });

    const purchases = await prisma.purchase.findMany({
      where: { userId, paymentStatus: "Successful" }
    });
    state.purchases = purchases.map((purchase) => ({ ...purchase, status: purchase.paymentStatus }));
    if (!hasChapterAccess(state, userId, match.book, match.chapter)) {
      return json({ ok: false, error: "Chapter is locked." }, { status: 403 });
    }

    const scrollPosition = Math.max(0, Math.round(Number(payload.scrollPosition || 0)));
    const percentageCompleted = Math.min(100, Math.max(0, Number(payload.percentage || 0)));
    const saved = await prisma.readingProgress.upsert({
      where: { userId_chapterId: { userId, chapterId: match.chapter.id } },
      create: {
        userId,
        bookId: match.book.id,
        sectionId: match.section.id,
        chapterId: match.chapter.id,
        scrollPosition,
        percentageCompleted,
        deviceType: String(payload.deviceType || "unknown").slice(0, 32)
      },
      update: {
        scrollPosition,
        percentageCompleted,
        deviceType: String(payload.deviceType || "unknown").slice(0, 32),
        lastReadAt: new Date()
      }
    });

    return json({
      ok: true,
      progress: {
        ...saved,
        percentage: Number(saved.percentageCompleted)
      }
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
