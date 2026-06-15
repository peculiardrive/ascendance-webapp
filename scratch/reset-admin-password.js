import { PrismaClient } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const ITERATIONS = 600000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "peculiardrive@gmail.com";
  const password = process.argv[3] || process.env.NEW_ADMIN_PASSWORD || "Uv9!Qx7#Lm2@Rs8$Nk5%Wp4&Hz6";

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!admin) {
    console.error(`Admin user with email ${email} not found.`);
    process.exit(1);
  }

  const passwordHash = hashPassword(password);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash }
  });

  console.log(`Successfully updated admin password for: ${email}`);
  console.log(`New password: "${password}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
