import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readJson, readState, writeState } from "@/lib/store";

export async function PUT(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { chapterId } = await params;
    const payload = await readJson(request);
    const state = await readState();

    let foundChapter = null;
    let foundBookIndex = -1;
    let foundSectionIndex = -1;
    let foundChapterIndex = -1;

    for (let i = 0; i < state.books.length; i++) {
      if (!state.books[i].sections) continue;
      for (let j = 0; j < state.books[i].sections.length; j++) {
        const chapters = state.books[i].sections[j].chapters || [];
        const cIdx = chapters.findIndex(c => c.id === chapterId);
        if (cIdx !== -1) {
          foundChapter = chapters[cIdx];
          foundBookIndex = i;
          foundSectionIndex = j;
          foundChapterIndex = cIdx;
          break;
        }
      }
      if (foundChapter) break;
    }

    if (!foundChapter) {
      return json({ ok: false, error: "Chapter not found." }, { status: 404 });
    }

    state.books[foundBookIndex].sections[foundSectionIndex].chapters[foundChapterIndex] = {
      ...foundChapter,
      title: payload.title !== undefined ? payload.title : foundChapter.title,
      subtitle: payload.subtitle !== undefined ? payload.subtitle : foundChapter.subtitle,
      content: payload.content !== undefined ? (
        Array.isArray(payload.content) 
          ? payload.content 
          : String(payload.content).includes("<p>") || String(payload.content).includes("<br>")
            ? String(payload.content)
            : String(payload.content).split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
      ) : foundChapter.content,
      chapterNumber: payload.chapterNumber !== undefined ? Number(payload.chapterNumber) : foundChapter.chapterNumber,
      order: payload.order !== undefined ? Number(payload.order) : foundChapter.order,
      isPreview: payload.isPreview !== undefined ? Boolean(payload.isPreview) : foundChapter.isPreview,
      status: payload.status !== undefined ? payload.status : foundChapter.status,
    };

    await writeState(state);
    return json({ ok: true, chapter: state.books[foundBookIndex].sections[foundSectionIndex].chapters[foundChapterIndex] });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { chapterId } = await params;
    const permanent = new URL(request.url).searchParams.get("permanent") === "true";

    const state = await readState();

    let deleted = false;
    for (let i = 0; i < state.books.length; i++) {
      if (!state.books[i].sections) continue;
      for (let j = 0; j < state.books[i].sections.length; j++) {
        const chapters = state.books[i].sections[j].chapters || [];
        const cIdx = chapters.findIndex(c => c.id === chapterId);
        if (cIdx !== -1) {
          if (permanent) {
            chapters.splice(cIdx, 1);
          } else {
            chapters[cIdx].deleted = true;
            chapters[cIdx].deletedAt = new Date().toISOString();
          }
          deleted = true;
          break;
        }
      }
      if (deleted) break;
    }

    if (!deleted) {
      return json({ ok: false, error: "Chapter not found." }, { status: 404 });
    }

    await writeState(state);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
