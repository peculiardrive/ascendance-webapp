import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { defaultState } from "./seed";

const isDev = process.env.NODE_ENV === "development";
const dataDir = (process.env.VERCEL && !isDev) ? join(tmpdir(), "ascendance-webapp") : join(process.cwd(), "data");
const statePath = join(dataDir, "next-state.json");

export function uid(prefix) {
  return `${prefix}-${randomUUID()}`;
}

export async function readState() {
  try {
    const raw = await readFile(statePath, "utf8");
    const saved = JSON.parse(raw);
    return normalizeState(saved);
  } catch (error) {
    if (error.code === "ENOENT") return structuredClone(defaultState);
    throw error;
  }
}

export async function writeState(state) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(statePath, JSON.stringify({ ...state, serverSavedAt: new Date().toISOString() }, null, 2));
}

export function normalizeState(state) {
  const savedBooks = state && state.books !== undefined ? state.books : defaultState.books;
  const books = savedBooks.map((book) => {
    const canonicalBook = defaultState.books.find((item) => item.id === book.id);
    return canonicalBook ? { ...book, cover: canonicalBook.cover, usdPrice: canonicalBook.usdPrice } : book;
  });

  return {
    ...structuredClone(defaultState),
    ...(state || {}),
    books,
    settings: {
      ...defaultState.settings,
      ...(state?.settings || {})
    }
  };
}

export function flattenChapters(books) {
  return books.flatMap((book) =>
    (book.sections || []).flatMap((section) =>
      (section.chapters || []).map((chapter) => ({ book, section, chapter }))
    )
  );
}

export function getPurchases(state, userId) {
  return state.purchases.filter((purchase) => purchase.userId === userId && purchase.status === "Successful");
}

export function hasChapterAccess(state, userId, book, chapter) {
  if (chapter?.isPreview) return true;
  if (!userId) return false;
  return getPurchases(state, userId).some((purchase) =>
    purchase.productType === "trilogy" ||
    purchase.productType === "gift-trilogy" ||
    purchase.bookId === book.id
  );
}

export function publicBook(book, state, userId) {
  return {
    ...book,
    sections: (book.sections || []).map((section) => ({
      ...section,
      chapters: (section.chapters || []).map((chapter) => {
        const locked = !hasChapterAccess(state, userId, book, chapter);
        return {
          ...chapter,
          locked,
          content: locked ? undefined : chapter.content
        };
      })
    }))
  };
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("cache-control")) headers.set("cache-control", "no-store");
  return Response.json(data, {
    ...init,
    headers
  });
}

export async function readJson(request) {
  const body = await request.text();
  if (body.length > 16_777_216) throw new Error("Request body is too large (max 16MB).");
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

export function requireFields(payload, fields) {
  const missing = fields.filter((field) => !payload[field]);
  if (missing.length) throw new Error(`Missing required field(s): ${missing.join(", ")}`);
}
