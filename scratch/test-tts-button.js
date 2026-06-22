import { chromium } from "playwright-core";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

async function run() {
  // Ensure purchase exists in DB
  const prisma = new PrismaClient();
  console.log("Seeding test user in PostgreSQL...");
  await prisma.user.upsert({
    where: { id: "reader-demo" },
    create: {
      id: "reader-demo",
      fullName: "Ada Reads",
      username: "AdaReads",
      email: "ada@example.com",
      onboardingStep: "done",
      countryCode: "NG"
    },
    update: {}
  });

  console.log("Seeding test purchase in PostgreSQL...");
  await prisma.purchase.upsert({
    where: { paymentReference: "PROTOTYPE-1" },
    create: {
      userId: "reader-demo",
      productType: "trilogy",
      amount: 8962,
      paymentReference: "PROTOTYPE-1",
      paymentGateway: "Prototype Paystack",
      paymentStatus: "Successful"
    },
    update: {}
  });
  await prisma.$disconnect();

  console.log("Launching Chromium browser with Chrome channel...");
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log console events
  page.on("console", (msg) => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Log errors
  page.on("pageerror", (err) => {
    console.error(`[BROWSER ERROR] ${err.message}`);
  });

  // Intercept auth session
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "reader-demo",
          fullName: "Ada Reads",
          username: "AdaReads",
          email: "ada@example.com",
          onboardingStep: "done",
          phone: "+23480000000",
          country: "NG"
        }
      })
    });
  });

  // Set local storage keys on route to set last view/chapter
  await context.addInitScript(() => {
    localStorage.setItem("ascendance_last_view", "reader");
    localStorage.setItem("ascendance_last_chapter", "b1-c0");
  });

  console.log("Navigating to local dev home...");
  await page.goto("http://127.0.0.1:3000/?confirmBypass=true", { waitUntil: "load" });

  console.log("Waiting for page load...");
  await page.waitForTimeout(4000);
  await page.screenshot({ path: join(process.cwd(), "scratch", "tts-test-step3-reader.png") });

  console.log("Locating and clicking TTS button...");
  const ttsButton = await page.$(".tts-btn, button:has-text('TTS')");
  if (ttsButton) {
    console.log("Clicking TTS button...");
    await ttsButton.click();
    console.log("TTS clicked. Waiting 5 seconds to capture speech synthesis activity/logs...");
    await page.waitForTimeout(5000);
    await page.screenshot({ path: join(process.cwd(), "scratch", "tts-test-step4-clicked.png") });
  } else {
    console.error("TTS button not found on reader page!");
  }

  await browser.close();
  console.log("Test execution completed successfully.");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
