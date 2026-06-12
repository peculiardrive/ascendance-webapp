const { chromium } = require('playwright-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\pecul\\.gemini\\antigravity\\brain\\d4d41252-8e29-4269-b543-fe3e499ac29a';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 420, height: 850 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  
  try {
    // 1. Splash Screen
    console.log("Capturing Splash Screen...");
    await page.goto('http://127.0.0.1:3000/');
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-1-splash.png') });

    // 2. Auth Page
    console.log("Capturing Auth Page...");
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-2-auth.png') });

    // 3. Home Screen
    console.log("Capturing Home Screen...");
    await page.goto('http://127.0.0.1:3000/?preview=home');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-3-home.png') });

    // 4. Store Screen
    console.log("Capturing Store Screen...");
    await page.goto('http://127.0.0.1:3000/?preview=books');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-4-store.png') });

    // 5. Reader View
    console.log("Capturing Reader View...");
    await page.goto('http://127.0.0.1:3000/?preview=reader');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-5-reader.png') });

    // 6. Community View
    console.log("Capturing Community View...");
    await page.goto('http://127.0.0.1:3000/?preview=community');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-6-community.png') });

    // 7. Gift View
    console.log("Capturing Gift View...");
    await page.goto('http://127.0.0.1:3000/?preview=notices');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-7-gift.png') });

    console.log("Screenshots captured successfully!");
  } catch(e) {
    console.error("Error during capture:", e);
  } finally {
    await browser.close();
  }
})();
