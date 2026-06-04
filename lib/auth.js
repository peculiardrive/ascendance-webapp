import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";
const CODE_TTL_MINUTES = 15;

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

export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashVerificationCode(code) {
  const pepper = process.env.VERIFICATION_CODE_PEPPER || "ascendance-dev-pepper";
  return pbkdf2Sync(String(code), pepper, 60000, KEY_LENGTH, DIGEST).toString("hex");
}

export function verifyCode(code, storedHash) {
  if (!code || !storedHash) return false;
  const actual = Buffer.from(hashVerificationCode(String(code).trim()), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verificationExpiry() {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
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

export function publicAdmin(admin) {
  if (!admin) return null;
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  };
}
