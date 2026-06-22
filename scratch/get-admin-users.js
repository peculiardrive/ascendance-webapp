import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const admins = await prisma.adminUser.findMany();
  console.log("Admin Users in database:");
  for (const admin of admins) {
    console.log(`- Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}`);
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
