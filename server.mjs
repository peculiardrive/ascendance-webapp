import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { seedBooks } from "./lib/seed.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const dataDir = join(root, "data");
const stateFile = join(dataDir, "state.json");
const port = Number(process.env.PORT || 5189);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const defaultState = {
  users: [],
  books: [],
  purchases: [],
  transactions: [],
  progress: {},
  gifts: [],
  posts: [],
  notifications: [],
  settings: {
    bookOnePrice: 3522,
    bookTwoPrice: 4882,
    bookThreePrice: 4882,
    trilogyPrice: 8962,
    giftPrice: 4882,
    giftLimit: 5
  },
  readerSettings: {},
  currentChapter: null,
  adminTab: "dashboard"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function loadState() {
  try {
    const raw = await readFile(stateFile, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    if (error.code === "ENOENT") return structuredClone(defaultState);
    throw error;
  }
}

async function saveState(state) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    stateFile,
    JSON.stringify(
      {
        ...state,
        serverSavedAt: new Date().toISOString()
      },
      null,
      2
    )
  );
}

function normalizeState(state) {
  return {
    ...structuredClone(defaultState),
    ...(state || {}),
    books: seedBooks,
    settings: {
      ...defaultState.settings,
      ...(state?.settings || {})
    }
  };
}

function sanitizeState(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("State payload must be an object.");
  }

  const allowedCollections = ["users", "books", "purchases", "transactions", "progress", "gifts", "posts", "notifications", "settings", "readerSettings", "currentChapter", "adminTab"];
  return allowedCollections.reduce((clean, key) => {
    if (Object.hasOwn(payload, key)) clean[key] = payload[key];
    return clean;
  }, {});
}

async function readJsonRequest(request) {
  const body = await readBody(request);
  return body ? JSON.parse(body) : {};
}

function flattenChapters(books) {
  return books.flatMap((book) =>
    (book.sections || []).flatMap((section) =>
      (section.chapters || []).map((chapter) => ({ book, section, chapter }))
    )
  );
}

function currentUserPurchases(state, userId) {
  return state.purchases.filter((purchase) => purchase.userId === userId && purchase.status === "Successful");
}

function hasChapterAccess(state, userId, book, chapter) {
  if (chapter?.isPreview) return true;
  if (!userId) return false;
  return currentUserPurchases(state, userId).some((purchase) =>
    purchase.productType === "trilogy" ||
    purchase.productType === "gift-trilogy" ||
    purchase.bookId === book.id
  );
}

function publicBook(book, state, userId) {
  return {
    ...book,
    sections: (book.sections || []).map((section) => ({
      ...section,
      chapters: (section.chapters || []).map((chapter) => ({
        ...chapter,
        content: hasChapterAccess(state, userId, book, chapter) ? chapter.content : undefined,
        locked: !hasChapterAccess(state, userId, book, chapter)
      }))
    }))
  };
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => !payload[field]);
  if (missing.length) {
    throw new Error(`Missing required field(s): ${missing.join(", ")}`);
  }
}

function getUserId(request) {
  return request.headers["x-user-id"] || null;
}

function generateCode() {
  return Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
}

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, {
      ok: true,
      app: "Ascendance WebApp",
      storage: "json-file",
      now: new Date().toISOString()
    });
    return true;
  }

  if (url.pathname === "/api/state" && request.method === "GET") {
    const state = await loadState();
    sendJson(response, 200, { ok: true, state });
    return true;
  }

  if (url.pathname === "/api/state" && request.method === "PUT") {
    try {
      const body = await readBody(request);
      const payload = sanitizeState(JSON.parse(body || "{}"));
      await saveState(payload);
      sendJson(response, 200, { ok: true, savedAt: new Date().toISOString() });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/auth/signup" && request.method === "POST") {
    try {
      const state = await loadState();
      const payload = await readJsonRequest(request);
      requireFields(payload, ["email"]);
      const email = String(payload.email).toLowerCase().trim();
      let user = state.users.find((item) => item.email === email);

      if (!user) {
        user = {
          id: uid("reader"),
          fullName: payload.fullName || "Ascendance Reader",
          username: payload.username || "",
          email,
          phone: payload.phone || "",
          country: payload.country || "NG",
          avatar: payload.avatar || "A",
          emailVerified: false,
          verificationCode: "123456",
          onboardingStep: "verify",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        state.users.push(user);
      } else {
        user.lastLogin = new Date().toISOString();
      }

      await saveState(state);
      sendJson(response, 201, { ok: true, user, verificationCode: user.verificationCode });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/auth/verify-email" && request.method === "POST") {
    try {
      const state = await loadState();
      const payload = await readJsonRequest(request);
      requireFields(payload, ["email", "code"]);
      const user = state.users.find((item) => item.email === String(payload.email).toLowerCase().trim());
      if (!user || user.verificationCode !== String(payload.code)) {
        sendJson(response, 400, { ok: false, error: "Invalid verification code." });
        return true;
      }
      user.emailVerified = true;
      user.onboardingStep = user.phone ? "profile" : "phone";
      await saveState(state);
      sendJson(response, 200, { ok: true, user });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/users/me" && request.method === "PATCH") {
    try {
      const state = await loadState();
      const userId = getUserId(request);
      const payload = await readJsonRequest(request);
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        sendJson(response, 404, { ok: false, error: "User not found." });
        return true;
      }
      Object.assign(user, {
        fullName: payload.fullName ?? user.fullName,
        username: payload.username ?? user.username,
        phone: payload.phone ?? user.phone,
        country: payload.country ?? user.country,
        avatar: payload.avatar ?? user.avatar
      });
      if (user.emailVerified && user.phone && user.username) user.onboardingStep = "done";
      await saveState(state);
      sendJson(response, 200, { ok: true, user });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/books" && request.method === "GET") {
    const state = await loadState();
    const userId = getUserId(request);
    sendJson(response, 200, {
      ok: true,
      books: state.books.map((book) => publicBook(book, state, userId))
    });
    return true;
  }

  if (url.pathname === "/api/admin/books" && request.method === "POST") {
    try {
      const state = await loadState();
      const payload = await readJsonRequest(request);
      requireFields(payload, ["title"]);
      const book = {
        id: uid("book"),
        order: payload.order || state.books.length + 1,
        title: payload.title,
        subtitle: payload.subtitle || `Book ${state.books.length + 1}`,
        author: payload.author || "BrandZilla Technologies",
        cover: payload.cover || "assets/cover-book-1.svg",
        price: Number(payload.price || 0),
        status: payload.status || "Draft",
        preview: Boolean(payload.preview),
        blurb: payload.blurb || "",
        sections: []
      };
      state.books.push(book);
      await saveState(state);
      sendJson(response, 201, { ok: true, book });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname.match(/^\/api\/admin\/books\/[^/]+\/sections$/) && request.method === "POST") {
    try {
      const state = await loadState();
      const bookId = url.pathname.split("/")[4];
      const payload = await readJsonRequest(request);
      requireFields(payload, ["title"]);
      const book = state.books.find((item) => item.id === bookId);
      if (!book) {
        sendJson(response, 404, { ok: false, error: "Book not found." });
        return true;
      }
      const section = {
        id: uid("section"),
        title: payload.title,
        subtitle: payload.subtitle || "",
        order: payload.order || (book.sections || []).length + 1,
        price: Number(payload.price || 0),
        tts: payload.tts ?? true,
        voice: payload.voice || "Female",
        chapters: []
      };
      book.sections ||= [];
      book.sections.push(section);
      await saveState(state);
      sendJson(response, 201, { ok: true, section });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname.match(/^\/api\/admin\/sections\/[^/]+\/chapters$/) && request.method === "POST") {
    try {
      const state = await loadState();
      const sectionId = url.pathname.split("/")[4];
      const payload = await readJsonRequest(request);
      requireFields(payload, ["title", "content"]);
      const match = state.books.flatMap((book) => (book.sections || []).map((section) => ({ book, section }))).find((item) => item.section.id === sectionId);
      if (!match) {
        sendJson(response, 404, { ok: false, error: "Section not found." });
        return true;
      }
      const chapter = {
        id: uid("chapter"),
        title: payload.title,
        subtitle: payload.subtitle || "",
        chapterNumber: payload.chapterNumber || (match.section.chapters || []).length + 1,
        content: Array.isArray(payload.content) ? payload.content : String(payload.content).split(/\n{2,}/),
        order: payload.order || (match.section.chapters || []).length + 1,
        isPreview: Boolean(payload.isPreview),
        status: payload.status || "Draft"
      };
      match.section.chapters ||= [];
      match.section.chapters.push(chapter);
      await saveState(state);
      sendJson(response, 201, { ok: true, chapter });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname.match(/^\/api\/chapters\/[^/]+$/) && request.method === "GET") {
    const state = await loadState();
    const userId = getUserId(request);
    const chapterId = url.pathname.split("/")[3];
    const match = flattenChapters(state.books).find((item) => item.chapter.id === chapterId);
    if (!match) {
      sendJson(response, 404, { ok: false, error: "Chapter not found." });
      return true;
    }
    if (!hasChapterAccess(state, userId, match.book, match.chapter)) {
      sendJson(response, 403, { ok: false, locked: true, error: "Chapter is locked." });
      return true;
    }
    sendJson(response, 200, { ok: true, ...match });
    return true;
  }

  if (url.pathname === "/api/purchases" && request.method === "POST") {
    try {
      const state = await loadState();
      const userId = getUserId(request);
      const payload = await readJsonRequest(request);
      requireFields(payload, ["productType", "amount"]);
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        sendJson(response, 404, { ok: false, error: "User not found." });
        return true;
      }

      if (payload.productType === "book") {
        if (payload.bookId === "book-2") {
          const ownsBook1 = state.purchases.some(
            (p) =>
              p.userId === userId &&
              p.status === "Successful" &&
              (p.productType === "trilogy" || p.productType === "gift-trilogy" || p.bookId === "book-1")
          );
          if (!ownsBook1) {
            sendJson(response, 403, { ok: false, error: "You must purchase Volume 1 (Disciples of the Inverted Cross) before you can purchase Volume 2." });
            return true;
          }
        }
        if (payload.bookId === "book-3") {
          const ownsBook2 = state.purchases.some(
            (p) =>
              p.userId === userId &&
              p.status === "Successful" &&
              (p.productType === "trilogy" || p.productType === "gift-trilogy" || p.bookId === "book-2")
          );
          if (!ownsBook2) {
            sendJson(response, 403, { ok: false, error: "You must purchase Volume 2 (Merchants of the Ivory Towers) before you can purchase Volume 3." });
            return true;
          }
        }
      }

      const reference = payload.reference || `ASC-${Date.now()}`;
      const purchase = {
        id: uid("purchase"),
        userId,
        productType: payload.productType,
        bookId: payload.bookId || null,
        sectionId: payload.sectionId || null,
        amount: Number(payload.amount),
        paymentReference: reference,
        paymentGateway: payload.gateway || "Prototype Paystack",
        status: "Successful",
        createdAt: new Date().toISOString()
      };
      state.purchases.push(purchase);
      state.transactions.push({
        id: uid("tx"),
        email: user.email,
        amount: purchase.amount,
        product: payload.product || purchase.productType,
        gateway: purchase.paymentGateway,
        reference,
        status: "Successful",
        createdAt: purchase.createdAt
      });
      await saveState(state);
      sendJson(response, 201, { ok: true, purchase });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/progress" && request.method === "PUT") {
    try {
      const state = await loadState();
      const userId = getUserId(request);
      const payload = await readJsonRequest(request);
      requireFields(payload, ["chapterId"]);
      state.progress[payload.chapterId] = {
        ...(state.progress[payload.chapterId] || {}),
        userId,
        bookId: payload.bookId || null,
        sectionId: payload.sectionId || null,
        chapterId: payload.chapterId,
        scrollPosition: Number(payload.scrollPosition || 0),
        percentage: Number(payload.percentage || 0),
        lastReadAt: new Date().toISOString(),
        deviceType: payload.deviceType || "unknown"
      };
      await saveState(state);
      sendJson(response, 200, { ok: true, progress: state.progress[payload.chapterId] });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/gifts" && request.method === "POST") {
    try {
      const state = await loadState();
      const userId = getUserId(request);
      const payload = await readJsonRequest(request);
      requireFields(payload, ["recipientEmail"]);
      const sender = state.users.find((item) => item.id === userId);
      if (!sender || !sender.emailVerified) {
        sendJson(response, 403, { ok: false, error: "Only verified readers can send gifts." });
        return true;
      }
      if (!currentUserPurchases(state, userId).length) {
        sendJson(response, 403, { ok: false, error: "Reader must purchase at least one book before gifting." });
        return true;
      }
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyCount = state.gifts.filter((gift) => gift.senderUserId === userId && new Date(gift.createdAt).getTime() > weekAgo).length;
      if (weeklyCount >= Number(state.settings.giftLimit)) {
        sendJson(response, 403, { ok: false, error: "Weekly gift limit reached." });
        return true;
      }
      const gift = {
        id: uid("gift"),
        senderUserId: userId,
        senderName: sender.fullName,
        recipientEmail: String(payload.recipientEmail).toLowerCase().trim(),
        accessCode: generateCode(),
        giftPackage: payload.giftPackage || "trilogy",
        paymentReference: payload.paymentReference || `GIFT-${Date.now()}`,
        status: "Sent",
        redeemedByUserId: null,
        redeemedAt: null,
        started: false,
        completedBookOne: false,
        completedTrilogy: false,
        reviewPosted: false,
        createdAt: new Date().toISOString()
      };
      state.gifts.unshift(gift);
      await saveState(state);
      sendJson(response, 201, { ok: true, gift });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/gifts/redeem" && request.method === "POST") {
    try {
      const state = await loadState();
      const userId = getUserId(request);
      const payload = await readJsonRequest(request);
      requireFields(payload, ["accessCode"]);
      const user = state.users.find((item) => item.id === userId);
      const gift = state.gifts.find((item) => item.accessCode === String(payload.accessCode).toUpperCase());
      if (!user || !gift || gift.status === "Redeemed" || gift.recipientEmail !== user.email) {
        sendJson(response, 400, { ok: false, error: "Gift code is invalid or already used." });
        return true;
      }
      gift.status = "Redeemed";
      gift.redeemedByUserId = userId;
      gift.redeemedAt = new Date().toISOString();
      state.purchases.push({
        id: uid("purchase"),
        userId,
        productType: "gift-trilogy",
        amount: 0,
        paymentReference: gift.paymentReference,
        paymentGateway: "Gift Code",
        status: "Successful",
        createdAt: new Date().toISOString()
      });
      await saveState(state);
      sendJson(response, 200, { ok: true, gift });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/community/posts" && request.method === "GET") {
    const state = await loadState();
    sendJson(response, 200, { ok: true, posts: state.posts.filter((post) => post.status !== "Hidden") });
    return true;
  }

  if (url.pathname === "/api/community/posts" && request.method === "POST") {
    try {
      const state = await loadState();
      const userId = getUserId(request);
      const payload = await readJsonRequest(request);
      requireFields(payload, ["content"]);
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        sendJson(response, 404, { ok: false, error: "User not found." });
        return true;
      }
      const post = {
        id: uid("post"),
        userId,
        username: user.username || user.fullName,
        country: user.country || "NG",
        bookId: payload.bookId || null,
        content: payload.content,
        image: payload.image || null,
        likes: 0,
        likedBy: [],
        comments: [],
        status: state.settings.autoApprovePosts === false ? "Pending" : "Visible",
        pinned: false,
        createdAt: new Date().toISOString()
      };
      state.posts.unshift(post);
      await saveState(state);
      sendJson(response, 201, { ok: true, post });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname.match(/^\/api\/community\/posts\/[^/]+\/like$/) && request.method === "POST") {
    const state = await loadState();
    const userId = getUserId(request);
    const postId = url.pathname.split("/")[4];
    const post = state.posts.find((item) => item.id === postId);
    if (!post) {
      sendJson(response, 404, { ok: false, error: "Post not found." });
      return true;
    }
    post.likedBy ||= [];
    if (post.likedBy.includes(userId)) {
      post.likedBy = post.likedBy.filter((id) => id !== userId);
      post.likes = Math.max(0, Number(post.likes || 0) - 1);
    } else {
      post.likedBy.push(userId);
      post.likes = Number(post.likes || 0) + 1;
    }
    await saveState(state);
    sendJson(response, 200, { ok: true, post });
    return true;
  }

  if (url.pathname.match(/^\/api\/community\/posts\/[^/]+\/comments$/) && request.method === "POST") {
    try {
      const state = await loadState();
      const userId = getUserId(request);
      const postId = url.pathname.split("/")[4];
      const payload = await readJsonRequest(request);
      requireFields(payload, ["comment"]);
      const user = state.users.find((item) => item.id === userId);
      const post = state.posts.find((item) => item.id === postId);
      if (!user || !post) {
        sendJson(response, 404, { ok: false, error: "User or post not found." });
        return true;
      }
      post.comments ||= [];
      post.comments.push({
        id: uid("comment"),
        userId,
        user: user.username || user.fullName,
        text: payload.comment,
        createdAt: new Date().toISOString()
      });
      await saveState(state);
      sendJson(response, 201, { ok: true, post });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/payments/verify" && request.method === "POST") {
    const body = await readBody(request);
    const payload = body ? JSON.parse(body) : {};
    sendJson(response, 200, {
      ok: true,
      status: "Successful",
      reference: payload.reference || `ASC-${Date.now()}`,
      gateway: "Prototype Paystack"
    });
    return true;
  }

  if (url.pathname === "/api/gifts/code" && request.method === "POST") {
    sendJson(response, 200, {
      ok: true,
      accessCode: Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()
    });
    return true;
  }

  if (url.pathname.startsWith("/api/")) {
    sendJson(response, 404, { ok: false, error: "API route not found." });
    return true;
  }

  return false;
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(root, normalized));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
      "cache-control": filePath.endsWith("sw.js") ? "no-store" : "public, max-age=60"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  try {
    if (await handleApi(request, response)) return;
    await serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Ascendance WebApp running at http://${host}:${port}/`);
});
