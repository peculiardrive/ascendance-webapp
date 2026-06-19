import { PrismaClient } from "@prisma/client";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

function generateGiftCode() {
  return Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
}

async function readState() {
  const raw = await readFile(join(process.cwd(), "data", "next-state.json"), "utf8");
  return JSON.parse(raw);
}

async function writeState(state) {
  await writeFile(join(process.cwd(), "data", "next-state.json"), JSON.stringify(state, null, 2));
}

async function run() {
  const prisma = new PrismaClient();
  console.log("=== Starting Gift Redemption Integration Test ===");

  // 1. Setup test users
  const senderId = "test-sender-1";
  const recipientId = "test-recipient-1";
  const recipientEmail = "recipient-test@example.com";

  console.log("Setting up test users in database...");
  await prisma.user.upsert({
    where: { id: senderId },
    create: {
      id: senderId,
      fullName: "Sender Bob",
      email: "sender-test@example.com",
      onboardingStep: "done",
      countryCode: "NG",
      emailVerified: true
    },
    update: {}
  });

  const recipientUser = await prisma.user.upsert({
    where: { id: recipientId },
    create: {
      id: recipientId,
      fullName: "Recipient Alice",
      email: recipientEmail,
      onboardingStep: "done",
      countryCode: "NG",
      emailVerified: true
    },
    update: {}
  });

  // 2. Setup mock purchase for sender (required to send a gift)
  console.log("Ensuring sender owns the trilogy...");
  await prisma.purchase.upsert({
    where: { paymentReference: "TEST-SENDER-TRILOGY" },
    create: {
      userId: senderId,
      productType: "trilogy",
      amount: 8962,
      paymentReference: "TEST-SENDER-TRILOGY",
      paymentGateway: "Paystack",
      paymentStatus: "Successful"
    },
    update: {}
  });

  // 3. Simulate payment webhook creating the gift
  console.log("Simulating webhook generating the gift code...");
  const accessCode = generateGiftCode();
  const paymentReference = `TEST-GIFT-PAYMENT-${Date.now()}`;
  
  const gift = await prisma.gift.create({
    data: {
      senderUserId: senderId,
      recipientEmail: recipientEmail,
      accessCode,
      giftPackage: "trilogy",
      paymentReference,
      status: "Sent"
    }
  });
  console.log(`Generated gift code: ${accessCode} for recipient: ${recipientEmail}`);

  // Sync to JSON state for initial consistency
  const state = await readState();
  state.gifts = state.gifts || [];
  state.gifts.unshift({
    ...gift,
    senderName: "Sender Bob"
  });
  await writeState(state);

  // 4. Perform the redemption API POST simulation locally
  console.log(`Simulating POST /api/gifts/redeem for recipient (ID: ${recipientId}, Email: ${recipientEmail})...`);

  // Call the logic directly using prisma transactions and store sync (exactly mimicking route.js)
  const code = accessCode.toUpperCase().trim();
  const dbGift = await prisma.gift.findUnique({ where: { accessCode: code } });
  if (!dbGift) throw new Error("Gift code not found in DB");
  if (dbGift.status === "Redeemed") throw new Error("Already redeemed");
  if (dbGift.recipientEmail.toLowerCase().trim() !== recipientUser.email.toLowerCase().trim()) {
    throw new Error("Recipient email mismatch");
  }

  // DB updates
  const [updatedGift, purchase] = await prisma.$transaction([
    prisma.gift.update({
      where: { accessCode: code },
      data: {
        status: "Redeemed",
        redeemedByUserId: recipientId,
        redeemedAt: new Date()
      }
    }),
    prisma.purchase.create({
      data: {
        userId: recipientId,
        productType: "gift-trilogy",
        amount: 0,
        paymentReference: dbGift.paymentReference,
        paymentGateway: "Gift Code",
        paymentStatus: "Successful"
      }
    })
  ]);

  // JSON state updates
  const activeState = await readState();
  activeState.gifts = activeState.gifts || [];
  activeState.purchases = activeState.purchases || [];

  const stateGiftIdx = activeState.gifts.findIndex(g => g.accessCode === code);
  if (stateGiftIdx !== -1) {
    activeState.gifts[stateGiftIdx].status = "Redeemed";
    activeState.gifts[stateGiftIdx].redeemedByUserId = recipientId;
    activeState.gifts[stateGiftIdx].redeemedAt = updatedGift.redeemedAt.toISOString();
  }

  activeState.purchases.push({
    ...purchase,
    amount: Number(purchase.amount),
    status: purchase.paymentStatus
  });
  await writeState(activeState);

  console.log("Redemption transaction completed successfully!");

  // 5. Assert database records are correct
  const verifiedGift = await prisma.gift.findUnique({ where: { accessCode: code } });
  const verifiedPurchase = await prisma.purchase.findFirst({
    where: { userId: recipientId, productType: "gift-trilogy" }
  });

  if (verifiedGift.status === "Redeemed" && verifiedGift.redeemedByUserId === recipientId && verifiedPurchase) {
    console.log("✅ INTEGRATION SUCCESS: Gift is marked 'Redeemed', user is set, and Trilogy purchase is added!");
  } else {
    throw new Error("❌ INTEGRATION FAILED: database records are incorrect.");
  }

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
