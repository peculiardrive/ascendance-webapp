import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const purchases = await prisma.purchase.findMany();
  console.log("Prisma Purchases:");
  for (const p of purchases) {
    console.log(`- ID: ${p.id}, UserID: ${p.userId}, ProductType: ${p.productType}, BookID: ${p.bookId}, Status: ${p.paymentStatus}`);
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
