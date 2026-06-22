import { chromium } from "playwright-core";
import { join } from "node:path";

async function run() {
  console.log("Launching Chromium browser...");
  // Launch the browser using playwright-core (it will find the local installed version or system version)
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to Sign In page...");
  await page.goto("http://localhost:3000/signin", { waitUntil: "networkidle" });

  console.log("Filling in sign-in form...");
  await page.fill('input[type="email"]', "ascendance-test-123@mailinator.com");
  await page.fill('input[type="password"]', "password123");

  console.log("Clicking Log In button...");
  await Promise.all([
    page.waitForURL("**/books", { timeout: 15000 }),
    page.click('button[type="submit"]')
  ]);
  console.log("Successfully logged in and redirected to books library page.");

  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(process.cwd(), "scratch", "library-screenshot.png") });
  console.log("Library screenshot saved.");

  console.log("Navigating to Prologue...");
  // Wait for the first book link and click it
  await page.click('a[href*="/books/book-1"]');
  await page.waitForTimeout(2000);
  
  // Wait for Prologue link/button and click it to open the reader
  await page.click('a[href*="/read/b1-c0"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(process.cwd(), "scratch", "prologue-screenshot.png") });
  console.log("Prologue screenshot saved.");

  console.log("Navigating to Chapter One...");
  await page.goto("http://localhost:3000/read/b1-c1", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(process.cwd(), "scratch", "chapter1-screenshot.png") });
  console.log("Chapter 1 screenshot saved.");

  await browser.close();
  console.log("Verification finished successfully!");
}

run().catch((err) => {
  console.error("Playwright verification failed:", err);
  process.exit(1);
});
