import { chromium } from "playwright-core";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createSessionToken } from "../lib/session.js";
import { readFile, writeFile } from "node:fs/promises";

async function readState() {
  const raw = await readFile(join(process.cwd(), "data", "next-state.json"), "utf8");
  return JSON.parse(raw);
}

async function writeState(state) {
  await writeFile(join(process.cwd(), "data", "next-state.json"), JSON.stringify(state, null, 2));
}

async function run() {
  const prisma = new PrismaClient();
  console.log("Seeding test recipient and gift...");

  const recipientEmail = "recipient-ui-test@example.com";
  const recipientId = "recipient-ui-id";
  const accessCode = "UI-GIFT-123";

  // Create recipient user
  await prisma.user.upsert({
    where: { id: recipientId },
    create: {
      id: recipientId,
      fullName: "Alice UI",
      username: "AliceUI",
      email: recipientEmail,
      onboardingStep: "done",
      countryCode: "NG",
      emailVerified: true
    },
    update: {}
  });

  // Create gift code
  const gift = await prisma.gift.upsert({
    where: { accessCode },
    create: {
      senderUserId: "reader-demo", // reuse seeded demo user
      recipientEmail,
      accessCode,
      giftPackage: "trilogy",
      paymentReference: "PROTOTYPE-GIFT-UI-1",
      status: "Sent"
    },
    update: {
      status: "Sent",
      redeemedByUserId: null,
      redeemedAt: null
    }
  });

  // Sync to JSON state
  const state = await readState();
  state.gifts = state.gifts || [];
  const idx = state.gifts.findIndex(g => g.accessCode === accessCode);
  const giftData = {
    ...gift,
    senderName: "Ada Reads"
  };
  if (idx !== -1) {
    state.gifts[idx] = giftData;
  } else {
    state.gifts.unshift(giftData);
  }
  await writeState(state);

  await prisma.$disconnect();

  console.log("Launching Chromium browser...");
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext();

  const sessionToken = createSessionToken({
    id: recipientId,
    kind: "reader",
    ttlSeconds: 7 * 24 * 60 * 60
  });

  await context.addCookies([
    {
      name: "ascendance_session",
      value: sessionToken,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Strict"
    }
  ]);

  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    console.error(`[BROWSER ERROR] ${err.message}`);
  });

  // Mock recipient user session
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: recipientId,
          fullName: "Alice UI",
          username: "AliceUI",
          email: recipientEmail,
          onboardingStep: "done",
          phone: "+23480000000",
          country: "NG"
        }
      })
    });
  });

  // Set last view to home to verify query parameter redirect works
  await context.addInitScript(() => {
    localStorage.setItem("ascendance_last_view", "home");
  });

  console.log("Navigating to app with giftCode query parameter...");
  await page.goto("http://127.0.0.1:3000/?confirmBypass=true&giftCode=" + accessCode, { waitUntil: "load" });

  console.log("Waiting for page load and redirection to Gift tab...");
  await page.waitForSelector("input[name='accessCode']", { timeout: 15000 });
  await page.screenshot({ path: join(process.cwd(), "scratch", "redemption-ui-step1-loaded.png") });

  console.log("Verifying access code was auto-populated from URL...");
  const codeInput = await page.$("input[name='accessCode']");
  if (!codeInput) {
    throw new Error("Redemption input 'accessCode' not found!");
  }
  const prefilledValue = await codeInput.inputValue();
  console.log(`Prefilled input value: "${prefilledValue}"`);
  if (prefilledValue !== accessCode) {
    throw new Error(`Expected accessCode to be prefilled as "${accessCode}", but got "${prefilledValue}"`);
  }

  console.log("Submitting redemption form...");
  await page.screenshot({ path: join(process.cwd(), "scratch", "redemption-ui-step2-typed.png") });
  
  await page.click("button:has-text('Unlock Trilogy')");

  console.log("Waiting for verification response...");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(process.cwd(), "scratch", "redemption-ui-step3-result.png") });

  await browser.close();
  console.log("UI Test execution completed successfully.");
}

run().catch((err) => {
  console.error("UI Test failed:", err);
  process.exit(1);
});
