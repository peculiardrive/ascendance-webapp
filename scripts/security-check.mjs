import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

process.env.SESSION_SECRET = "security-test-secret-that-is-long-and-random";

const {
  assertSameOrigin,
  createSessionToken,
  readerSessionCookie,
  verifySessionToken
} = await import("../lib/session.js");

const valid = createSessionToken({
  id: "reader-123",
  kind: "reader",
  ttlSeconds: 60
});
assert.equal(verifySessionToken(valid, "reader")?.sub, "reader-123");
assert.equal(verifySessionToken(valid, "admin"), null);

const tampered = `${valid.slice(0, -1)}${valid.endsWith("a") ? "b" : "a"}`;
assert.equal(verifySessionToken(tampered, "reader"), null);

const expired = createSessionToken({
  id: "reader-123",
  kind: "reader",
  ttlSeconds: -1
});
assert.equal(verifySessionToken(expired, "reader"), null);

const cookie = readerSessionCookie("reader-123");
assert.match(cookie, /HttpOnly/);
assert.match(cookie, /SameSite=Strict/);

assert.throws(
  () => assertSameOrigin(new Request("https://ascendance-trilogy.com/api/test", {
    method: "POST",
    headers: {
      origin: "https://attacker.example",
      "sec-fetch-site": "cross-site"
    }
  })),
  /Cross-site request blocked/
);
assert.doesNotThrow(() => assertSameOrigin(new Request("http://localhost:3000/api/test", {
  method: "POST",
  headers: {
    host: "127.0.0.1:3000",
    origin: "http://127.0.0.1:3000",
    "sec-fetch-site": "same-origin"
  }
})));

const root = process.cwd();
const sourceFiles = [
  "app/page.jsx",
  "app/api/books/route.js",
  "app/api/chapters/[chapterId]/route.js",
  "app/api/users/me/route.js",
  "app/api/progress/route.js",
  "app/api/payments/paystack/initialize/route.js",
  "app/api/payments/paystack/verify/route.js"
];
for (const file of sourceFiles) {
  assert.doesNotMatch(readFileSync(join(root, file), "utf8"), /x-user-id|userIdFrom/);
}

assert.equal(existsSync(join(root, "app/api/purchases/route.js")), false);
assert.equal(existsSync(join(root, "app/api/gifts/route.js")), false);
assert.doesNotMatch(readFileSync(join(root, "app/api/state/route.js"), "utf8"), /export async function PUT/);

console.log("Security regression checks passed.");
