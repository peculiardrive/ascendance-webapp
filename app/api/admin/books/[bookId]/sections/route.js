import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { bookId } = params;
    const payload = await readJson(request);
    requireFields(payload, ["title"]);

    const state = await readState();
    const book = state.books.find((item) => item.id === bookId);
    if (!book) {
      return json({ ok: false, error: "Book not found." }, { status: 404 });
    }

    const section = {
      id: uid("section"),
      title: payload.title,
      subtitle: payload.subtitle || "",
      order: Number(payload.order || (book.sections || []).length + 1),
      price: Number(payload.price || 0),
      tts: payload.tts ?? true,
      voice: payload.voice || "Female",
      chapters: []
    };

    book.sections = book.sections || [];
    book.sections.push(section);
    await writeState(state);

    return json({ ok: true, section }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
