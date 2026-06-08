import { createHmac, timingSafeEqual } from "node:crypto";

const READER_COOKIE = "ascendance_session";
const ADMIN_COOKIE = "ascendance_admin_session";
const ADMIN_CHALLENGE_COOKIE = "ascendance_admin_challenge";
const READER_TTL_SECONDS = 7 * 24 * 60 * 60;
const ADMIN_TTL_SECONDS = 8 * 60 * 60;
const ADMIN_CHALLENGE_TTL_SECONDS = 10 * 60;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.VERIFICATION_CODE_PEPPER;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret || "ascendance-local-session-secret";
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedPayload) {
  return createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
}

export function createSessionToken({ id, kind, role = null, ttlSeconds }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = encode(JSON.stringify({
    sub: id,
    kind,
    role,
    iat: now,
    exp: now + ttlSeconds
  }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token, expectedKind) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature || "");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.kind !== expectedKind || !decoded.sub || decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function serializeCookie(name, value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; Priority=High${secure}`;
}

export function readerSessionFrom(request) {
  return verifySessionToken(cookieValue(request, READER_COOKIE), "reader");
}

export function adminSessionFrom(request) {
  return verifySessionToken(cookieValue(request, ADMIN_COOKIE), "admin");
}

export function adminChallengeFrom(request) {
  return verifySessionToken(cookieValue(request, ADMIN_CHALLENGE_COOKIE), "admin-2fa");
}

export function readerSessionCookie(userId) {
  const token = createSessionToken({ id: userId, kind: "reader", ttlSeconds: READER_TTL_SECONDS });
  return serializeCookie(READER_COOKIE, token, READER_TTL_SECONDS);
}

export function adminSessionCookie(admin) {
  const token = createSessionToken({
    id: admin.id,
    kind: "admin",
    role: admin.role,
    ttlSeconds: ADMIN_TTL_SECONDS
  });
  return serializeCookie(ADMIN_COOKIE, token, ADMIN_TTL_SECONDS);
}

export function adminChallengeCookie(challengeId, adminId) {
  const token = createSessionToken({
    id: challengeId,
    kind: "admin-2fa",
    role: adminId,
    ttlSeconds: ADMIN_CHALLENGE_TTL_SECONDS
  });
  return serializeCookie(ADMIN_CHALLENGE_COOKIE, token, ADMIN_CHALLENGE_TTL_SECONDS);
}

export function clearReaderSessionCookie() {
  return serializeCookie(READER_COOKIE, "", 0);
}

export function clearAdminSessionCookie() {
  return serializeCookie(ADMIN_COOKIE, "", 0);
}

export function clearAdminChallengeCookie() {
  return serializeCookie(ADMIN_CHALLENGE_COOKIE, "", 0);
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestUrl = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
  const expectedOrigin = `${protocol}://${host}`;
  if (fetchSite === "cross-site" || (origin && origin !== expectedOrigin)) {
    const error = new Error("Cross-site request blocked.");
    error.status = 403;
    throw error;
  }
}
