import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

// Allow large chapter content payloads (full book text)
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { sectionId } = params;
    const payload = await readJson(request);
    requireFields(payload, ["title", "content"]);

    const state = await readState();
    let foundSection = null;
    let foundBook = null;

    for (const book of state.books) {
      const section = (book.sections || []).find((s) => s.id === sectionId);
      if (section) {
        foundSection = section;
        foundBook = book;
        break;
      }
    }

    if (!foundSection) {
      return json({ ok: false, error: "Section not found." }, { status: 404 });
    }

    const chapterContent = Array.isArray(payload.content)
      ? payload.content
      : String(payload.content).includes("<p>") || String(payload.content).includes("<br>") 
        ? String(payload.content) 
        : String(payload.content).split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

    const chapter = {
      id: uid("chapter"),
      title: payload.title,
      subtitle: payload.subtitle || "",
      chapterNumber: Number(payload.chapterNumber || (foundSection.chapters || []).length + 1),
      content: chapterContent,
      order: Number(payload.order || (foundSection.chapters || []).length + 1),
      isPreview: Boolean(payload.isPreview),
      status: payload.status || "Published"
    };

    foundSection.chapters = foundSection.chapters || [];
    foundSection.chapters.push(chapter);
    await writeState(state);

    return json({ ok: true, chapter }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
