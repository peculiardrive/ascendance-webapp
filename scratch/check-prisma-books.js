import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const books = await prisma.book.findMany();
  console.log("Prisma Books:");
  for (const b of books) {
    console.log(`- ID: ${b.id}`);
    console.log(`  Title: ${b.title}`);
    console.log(`  Blurb: ${b.blurb}`);
    console.log(`  Summary: ${b.summary ? b.summary.substring(0, 80) + "..." : "null"}`);
    console.log(`---`);
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
