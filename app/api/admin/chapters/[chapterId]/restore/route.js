import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readState, writeState } from "@/lib/store";

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { chapterId } = await params;
    const state = await readState();

    let restored = false;
    let foundChapter = null;

    for (let i = 0; i < state.books.length; i++) {
      if (!state.books[i].sections) continue;
      for (let j = 0; j < state.books[i].sections.length; j++) {
        const chapters = state.books[i].sections[j].chapters || [];
        const cIdx = chapters.findIndex(c => c.id === chapterId);
        if (cIdx !== -1) {
          chapters[cIdx].deleted = false;
          delete chapters[cIdx].deletedAt;
          restored = true;
          foundChapter = chapters[cIdx];
          break;
        }
      }
      if (restored) break;
    }

    if (!restored) {
      return json({ ok: false, error: "Chapter not found." }, { status: 404 });
    }

    await writeState(state);
    return json({ ok: true, chapter: foundChapter });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
