import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log("Users in database before verification:");
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Verified: ${u.emailVerified}, OnboardingStep: ${u.onboardingStep}`);
  });

  const updated = await prisma.user.updateMany({
    data: {
      emailVerified: true,
      onboardingStep: "done"
    }
  });
  console.log(`\nUpdated ${updated.count} users to emailVerified = true and onboardingStep = "done".`);

  const verifiedUsers = await prisma.user.findMany();
  console.log("\nUsers in database after verification:");
  verifiedUsers.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Verified: ${u.emailVerified}, OnboardingStep: ${u.onboardingStep}`);
  });
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
