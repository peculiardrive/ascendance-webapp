import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("Starting referral system verification...");

  // 1. Clean up any previous test partner
  const testCode = "test-verification-code";
  await prisma.referralVisit.deleteMany({
    where: { partner: { code: testCode } }
  });
  await prisma.purchase.deleteMany({
    where: { user: { email: "test-ref-reader@example.com" } }
  });
  await prisma.user.deleteMany({
    where: { email: "test-ref-reader@example.com" }
  });
  await prisma.referralPartner.deleteMany({
    where: { code: testCode }
  });

  // 2. Create partner
  console.log("Creating test partner...");
  const partner = await prisma.referralPartner.create({
    data: {
      name: "Test Book Shop",
      code: testCode,
      type: "shop",
      isActive: true
    }
  });
  console.log("Partner created:", partner);

  // 3. Log a visit
  console.log("Logging a visit...");
  const visit = await prisma.referralVisit.create({
    data: {
      partnerId: partner.id,
      ip: "127.0.0.1",
      userAgent: "NodeTest"
    }
  });
  console.log("Visit logged:", visit);

  // 4. Create user referred by partner
  console.log("Creating referred user...");
  const user = await prisma.user.create({
    data: {
      fullName: "Test Referred Reader",
      email: "test-ref-reader@example.com",
      verificationCodeHash: "somehash",
      referralPartnerId: partner.id
    }
  });
  console.log("User created with referralPartnerId:", user.referralPartnerId);

  // 5. Create purchase attributed to partner
  console.log("Creating purchase...");
  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      productType: "trilogy",
      amount: 15000,
      paymentReference: "REF-TEST-PAYMENT-12345",
      paymentGateway: "Paystack",
      paymentStatus: "Successful",
      referralPartnerId: partner.id
    }
  });
  console.log("Purchase created with referralPartnerId:", purchase.referralPartnerId);

  // 6. Test statistics query (replicating the admin api query)
  console.log("Querying partner metrics...");
  const fetchedPartner = await prisma.referralPartner.findUnique({
    where: { id: partner.id },
    include: {
      _count: {
        select: {
          visits: true,
          users: true
        }
      },
      purchases: {
        where: {
          paymentStatus: "Successful"
        },
        select: {
          amount: true
        }
      }
    }
  });

  const totalRevenue = fetchedPartner.purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  console.log("Verification Metrics results:");
  console.log("- Visits Count:", fetchedPartner._count.visits, "(Expected: 1)");
  console.log("- Users Count:", fetchedPartner._count.users, "(Expected: 1)");
  console.log("- Purchases Count:", fetchedPartner.purchases.length, "(Expected: 1)");
  console.log("- Total Revenue:", totalRevenue, "(Expected: 15000)");

  if (
    fetchedPartner._count.visits === 1 &&
    fetchedPartner._count.users === 1 &&
    fetchedPartner.purchases.length === 1 &&
    totalRevenue === 15000
  ) {
    console.log("SUCCESS: Referral tracking verification passed!");
  } else {
    console.error("FAILURE: Metrics mismatch!");
  }

  // Cleanup
  await prisma.referralVisit.deleteMany({ where: { partnerId: partner.id } });
  await prisma.purchase.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
  await prisma.referralPartner.deleteMany({ where: { id: partner.id } });
  
  await prisma.$disconnect();
}

run().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
