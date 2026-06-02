const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5189";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json();
  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const email = `smoke-${Date.now()}@example.com`;

const health = await request("/api/health");
assert(health.status === 200 && health.body.ok, "health endpoint failed");

const signup = await request("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ email, fullName: "Smoke Reader" })
});
assert(signup.status === 201 && signup.body.user?.id, "signup endpoint failed");

const userId = signup.body.user.id;

const verify = await request("/api/auth/verify-email", {
  method: "POST",
  body: JSON.stringify({ email, code: "123456" })
});
assert(verify.status === 200 && verify.body.user?.emailVerified, "email verification failed");

const profile = await request("/api/users/me", {
  method: "PATCH",
  headers: { "x-user-id": userId },
  body: JSON.stringify({ phone: "+2348000000000", username: "SmokeReader", country: "NG" })
});
assert(profile.status === 200 && profile.body.user?.onboardingStep === "done", "profile update failed");

const books = await request("/api/books", {
  headers: { "x-user-id": userId }
});
assert(books.status === 200 && Array.isArray(books.body.books), "books endpoint failed");

const bookTwo = books.body.books.find((book) => book.id === "book-2") || books.body.books[1];
const lockedChapter = bookTwo?.sections?.[0]?.chapters?.[0];

let lockedStatus = "skipped";
let unlockedStatus = "skipped";

if (bookTwo && lockedChapter) {
  const locked = await request(`/api/chapters/${lockedChapter.id}`, {
    headers: { "x-user-id": userId }
  });
  lockedStatus = locked.status;
  assert(locked.status === 403, "locked chapter should be blocked before purchase");

  const purchase = await request("/api/purchases", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify({
      productType: "book",
      bookId: bookTwo.id,
      amount: bookTwo.price || 5000,
      product: bookTwo.title
    })
  });
  assert(purchase.status === 201 && purchase.body.purchase?.status === "Successful", "purchase endpoint failed");

  const unlocked = await request(`/api/chapters/${lockedChapter.id}`, {
    headers: { "x-user-id": userId }
  });
  unlockedStatus = unlocked.status;
  assert(unlocked.status === 200 && unlocked.body.chapter?.content, "chapter should open after purchase");
}

const progress = await request("/api/progress", {
  method: "PUT",
  headers: { "x-user-id": userId },
  body: JSON.stringify({ chapterId: "b1-c1", bookId: "book-1", sectionId: "b1-s1", scrollPosition: 20, percentage: 12 })
});
assert(progress.status === 200 && progress.body.progress?.chapterId === "b1-c1", "progress endpoint failed");

const post = await request("/api/community/posts", {
  method: "POST",
  headers: { "x-user-id": userId },
  body: JSON.stringify({ content: "Smoke test review for Ascendance.", bookId: "book-1" })
});
assert(post.status === 201 && post.body.post?.id, "community post endpoint failed");

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      userId,
      books: books.body.books.length,
      lockedStatus,
      unlockedStatus,
      postId: post.body.post.id
    },
    null,
    2
  )
);
