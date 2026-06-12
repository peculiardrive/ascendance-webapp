const { chromium } = require('playwright-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\pecul\\.gemini\\antigravity\\brain\\b71f2729-7a17-4983-aebf-0f7f24b56c5c';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  
  try {
    // 1. Capture Splash Screen
    console.log("Loading page for Splash Screen...");
    await page.goto('http://localhost:3001/');
    // Wait just a tiny bit for initial render of splash screen (which holds for 1300ms)
    await page.waitForTimeout(300);
    const splashPath = path.join(ARTIFACT_DIR, 'flow-1-splash.png');
    await page.screenshot({ path: splashPath });
    console.log("Splash Screen screenshot saved to:", splashPath);

    // 2. Capture Trailer Intro Screen
    console.log("Waiting for Splash Screen to transition to Trailer...");
    await page.waitForTimeout(2000); // Wait for splash timeout (1300ms) plus transition
    const trailerPath = path.join(ARTIFACT_DIR, 'flow-2-trailer.png');
    await page.screenshot({ path: trailerPath });
    console.log("Trailer Intro screenshot saved to:", trailerPath);

    // 3. Capture Auth - Login Form
    console.log("Clicking 'Login' button on Trailer to enter Auth View...");
    await page.click('.trailer-login-btn-new');
    await page.waitForTimeout(1000);
    const loginPath = path.join(ARTIFACT_DIR, 'flow-3-login.png');
    await page.screenshot({ path: loginPath });
    console.log("Login Form screenshot saved to:", loginPath);

    // 4. Capture Auth - Signup Form
    console.log("Clicking 'Create Profile' to open Signup Form...");
    // The "Create Profile" button is a button inside the login form with text 'Create Profile'
    // Let's find it by text and click it
    await page.click('button:has-text("Create Profile")');
    await page.waitForTimeout(500);
    const signupPath = path.join(ARTIFACT_DIR, 'flow-4-signup.png');
    await page.screenshot({ path: signupPath });
    console.log("Signup Form screenshot saved to:", signupPath);

    // Go back to login
    await page.click('button:has-text("Already have an account? Login")');
    await page.waitForTimeout(500);

    // 5. Capture Auth - Forgot Password Form
    console.log("Clicking 'Forgot Password?' to open Forgot Password Form...");
    await page.click('button:has-text("Forgot Password?")');
    await page.waitForTimeout(500);
    const forgotPath = path.join(ARTIFACT_DIR, 'flow-5-forgot.png');
    await page.screenshot({ path: forgotPath });
    console.log("Forgot Password Form screenshot saved to:", forgotPath);

    // 6. Capture Home Screen (Preview Mode)
    console.log("Navigating directly to Home Screen preview...");
    await page.goto('http://localhost:3001/?preview=home');
    await page.waitForTimeout(3000);
    const homePath = path.join(ARTIFACT_DIR, 'flow-6-home.png');
    await page.screenshot({ path: homePath });
    console.log("Home Screen screenshot saved to:", homePath);

    // 7. Capture Profile Screen (Preview Mode)
    console.log("Navigating directly to Profile Screen preview...");
    await page.goto('http://localhost:3001/?preview=profile');
    await page.waitForTimeout(3000);
    const profilePath = path.join(ARTIFACT_DIR, 'flow-7-profile.png');
    await page.screenshot({ path: profilePath });
    console.log("Profile Screen screenshot saved to:", profilePath);

  } catch(e) {
    console.error("Error during flow capture:", e);
  } finally {
    await browser.close();
    console.log("Browser closed. Capture flow script completed.");
  }
})();
