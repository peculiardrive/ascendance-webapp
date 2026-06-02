import { json, readJson, readState, requireFields, userIdFrom, writeState } from "@/lib/store";

export async function PUT(request) {
  try {
    const state = await readState();
    const userId = userIdFrom(request);
    const payload = await readJson(request);
    requireFields(payload, ["chapterId"]);
    state.progress[payload.chapterId] = {
      userId,
      bookId: payload.bookId || null,
      sectionId: payload.sectionId || null,
      chapterId: payload.chapterId,
      scrollPosition: Number(payload.scrollPosition || 0),
      percentage: Number(payload.percentage || 0),
      lastReadAt: new Date().toISOString(),
      deviceType: payload.deviceType || "unknown"
    };
    await writeState(state);
    return json({ ok: true, progress: state.progress[payload.chapterId] });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
