import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const [method, iterations, salt, expected] = storedHash.split(":");
  if (method !== "pbkdf2" || !iterations || !salt || !expected) return false;

  const actual = pbkdf2Sync(password, salt, Number(iterations), KEY_LENGTH, DIGEST);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username || "",
    email: user.email,
    phone: user.phone || "",
    country: user.countryCode || "NG",
    avatar: user.avatar || "A",
    emailVerified: user.emailVerified,
    onboardingStep: user.onboardingStep
  };
}
