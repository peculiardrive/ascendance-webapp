import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readJson, readState, writeState } from "@/lib/store";

export async function PUT(request, { params }) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { bookId } = await params;
    const payload = await readJson(request);

    const state = await readState();
    const bookIndex = state.books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return json({ ok: false, error: "Book not found." }, { status: 404 });
    }

    const existingBook = state.books[bookIndex];
    state.books[bookIndex] = {
      ...existingBook,
      title: payload.title !== undefined ? payload.title : existingBook.title,
      subtitle: payload.subtitle !== undefined ? payload.subtitle : existingBook.subtitle,
      author: payload.author !== undefined ? payload.author : existingBook.author,
      cover: payload.cover !== undefined ? payload.cover : existingBook.cover,
      price: payload.price !== undefined ? Number(payload.price) : existingBook.price,
      usdPrice: payload.usdPrice !== undefined ? Number(payload.usdPrice) : existingBook.usdPrice,
      status: payload.status !== undefined ? payload.status : existingBook.status,
      preview: payload.preview !== undefined ? Boolean(payload.preview) : existingBook.preview,
      blurb: payload.blurb !== undefined ? payload.blurb : existingBook.blurb,
      order: payload.order !== undefined ? Number(payload.order) : existingBook.order,
    };

    await writeState(state);
    return json({ ok: true, book: state.books[bookIndex] });
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

    const { bookId } = await params;
    const permanent = new URL(request.url).searchParams.get("permanent") === "true";

    const state = await readState();
    const bookIndex = state.books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return json({ ok: false, error: "Book not found." }, { status: 404 });
    }

    if (permanent) {
      state.books.splice(bookIndex, 1);
    } else {
      state.books[bookIndex].deleted = true;
      state.books[bookIndex].deletedAt = new Date().toISOString();

      // Soft-delete child sections and chapters as well
      if (state.books[bookIndex].sections) {
        state.books[bookIndex].sections.forEach((sec) => {
          sec.deleted = true;
          sec.deletedAt = new Date().toISOString();
          if (sec.chapters) {
            sec.chapters.forEach((ch) => {
              ch.deleted = true;
              ch.deletedAt = new Date().toISOString();
            });
          }
        });
      }
    }

    await writeState(state);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
