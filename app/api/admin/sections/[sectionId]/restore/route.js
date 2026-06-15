import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readState, writeState } from "@/lib/store";

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { sectionId } = await params;
    const state = await readState();

    let restored = false;
    let foundSection = null;

    for (let i = 0; i < state.books.length; i++) {
      if (!state.books[i].sections) continue;
      const secIndex = state.books[i].sections.findIndex(s => s.id === sectionId);
      if (secIndex !== -1) {
        state.books[i].sections[secIndex].deleted = false;
        delete state.books[i].sections[secIndex].deletedAt;
        
        // Also restore all child chapters of this section
        if (state.books[i].sections[secIndex].chapters) {
          state.books[i].sections[secIndex].chapters.forEach((ch) => {
            if (ch.deleted) {
              ch.deleted = false;
              delete ch.deletedAt;
            }
          });
        }
        
        restored = true;
        foundSection = state.books[i].sections[secIndex];
        break;
      }
    }

    if (!restored) {
      return json({ ok: false, error: "Section not found." }, { status: 404 });
    }

    await writeState(state);
    return json({ ok: true, section: foundSection });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
