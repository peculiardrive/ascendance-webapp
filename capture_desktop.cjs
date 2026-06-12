const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  
  try {
    // Capture Main App
    await page.goto('http://localhost:3001/?preview=home');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshot-app.png' });
    console.log("App Screenshot saved.");
    
    // Capture Admin
    await page.goto('http://localhost:3001/?preview=admin');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshot-admin.png' });
    console.log("Admin Screenshot saved.");
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
