import { randomBytes } from "node:crypto";

export function generateGiftCode() {
  return randomBytes(8).toString("base64url").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
}
