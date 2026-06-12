import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to Supabase Database...");
  const purchaseCount = await prisma.purchase.count();
  console.log("Total purchases in database:", purchaseCount);

  const successfulPurchases = await prisma.purchase.findMany({
    where: { paymentStatus: "Successful" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  });

  console.log("\nLatest 5 Successful Purchases:");
  successfulPurchases.forEach((p) => {
    console.log(`- User: ${p.user.fullName} (${p.user.email})`);
    console.log(`  Reference: ${p.paymentReference}`);
    console.log(`  Product Type: ${p.productType}`);
    console.log(`  Amount: ${p.amount}`);
    console.log(`  Date: ${p.createdAt}`);
  });

  const pendingPurchases = await prisma.purchase.findMany({
    where: { paymentStatus: { not: "Successful" } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  });

  console.log("\nLatest 5 Non-Successful Purchases:");
  pendingPurchases.forEach((p) => {
    console.log(`- User: ${p.user.fullName} (${p.user.email})`);
    console.log(`  Reference: ${p.paymentReference}`);
    console.log(`  Status: ${p.paymentStatus}`);
    console.log(`  Amount: ${p.amount}`);
    console.log(`  Date: ${p.createdAt}`);
  });
}

main()
  .catch((e) => {
    console.error("Error connecting to database:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
