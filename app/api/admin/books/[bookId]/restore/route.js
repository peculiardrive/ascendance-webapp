import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readState, writeState } from "@/lib/store";

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { bookId } = await params;
    const state = await readState();
    const bookIndex = state.books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return json({ ok: false, error: "Book not found." }, { status: 404 });
    }

    // Restore the book
    state.books[bookIndex].deleted = false;
    delete state.books[bookIndex].deletedAt;
    
    // Also recursively restore child sections and chapters if they were deleted with it
    if (state.books[bookIndex].sections) {
      state.books[bookIndex].sections.forEach((sec) => {
        if (sec.deleted) {
          sec.deleted = false;
          delete sec.deletedAt;
        }
        if (sec.chapters) {
          sec.chapters.forEach((ch) => {
            if (ch.deleted) {
              ch.deleted = false;
              delete ch.deletedAt;
            }
          });
        }
      });
    }

    await writeState(state);
    return json({ ok: true, book: state.books[bookIndex] });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
