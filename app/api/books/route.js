import { json, publicBook, readState, userIdFrom } from "@/lib/store";

export async function GET(request) {
  const state = await readState();
  const userId = userIdFrom(request);
  return json({ ok: true, books: state.books.map((book) => publicBook(book, state, userId)) });
}
