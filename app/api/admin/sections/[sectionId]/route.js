import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readJson, readState, writeState } from "@/lib/store";

export async function PUT(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { sectionId } = await params;
    const payload = await readJson(request);
    const state = await readState();

    let foundSection = null;
    let foundBookIndex = -1;

    for (let i = 0; i < state.books.length; i++) {
      const secIndex = state.books[i].sections?.findIndex(s => s.id === sectionId);
      if (secIndex !== undefined && secIndex !== -1) {
        foundSection = state.books[i].sections[secIndex];
        foundBookIndex = i;
        
        state.books[i].sections[secIndex] = {
          ...foundSection,
          title: payload.title !== undefined ? payload.title : foundSection.title,
          subtitle: payload.subtitle !== undefined ? payload.subtitle : foundSection.subtitle,
          price: payload.price !== undefined ? Number(payload.price) : foundSection.price,
          order: payload.order !== undefined ? Number(payload.order) : foundSection.order,
          tts: payload.tts !== undefined ? Boolean(payload.tts) : foundSection.tts,
          voice: payload.voice !== undefined ? payload.voice : foundSection.voice,
        };
        break;
      }
    }

    if (!foundSection) {
      return json({ ok: false, error: "Section not found." }, { status: 404 });
    }

    await writeState(state);
    return json({ ok: true, section: state.books[foundBookIndex].sections.find(s => s.id === sectionId) });
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

    const { sectionId } = await params;
    const state = await readState();

    let deleted = false;
    for (let i = 0; i < state.books.length; i++) {
      if (!state.books[i].sections) continue;
      const secIndex = state.books[i].sections.findIndex(s => s.id === sectionId);
      if (secIndex !== -1) {
        state.books[i].sections.splice(secIndex, 1);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return json({ ok: false, error: "Section not found." }, { status: 404 });
    }

    await writeState(state);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
