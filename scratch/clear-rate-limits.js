import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("Clearing rate limit buckets from the database...");
  const result = await prisma.rate_limit_buckets.deleteMany({});
  console.log(`Successfully cleared rate limit buckets. Deleted rows: ${result.count}`);
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
