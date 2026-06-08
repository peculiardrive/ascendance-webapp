import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const payload = await readJson(request);
    requireFields(payload, ["title"]);

    const state = await readState();
    const book = {
      id: uid("book"),
      order: Number(payload.order || state.books.length + 1),
      title: payload.title,
      subtitle: payload.subtitle || `Book ${state.books.length + 1}`,
      author: payload.author || "BrandZilla Technologies",
      cover: payload.cover || "/assets/books/disciples-inverted-cross.jpeg",
      price: Number(payload.price || 0),
      usdPrice: Number(payload.usdPrice || 0),
      status: payload.status || "Draft",
      preview: Boolean(payload.preview),
      blurb: payload.blurb || "",
      sections: []
    };

    state.books.push(book);
    await writeState(state);

    return json({ ok: true, book }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
