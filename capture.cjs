const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // Guessing Chrome path
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // We are on localhost:3000. Let's see if there is a profile button.
    // The initial view is "library". Let's click the profile icon.
    // In page.jsx, the profile button is: <button className="circle-icon-btn" onClick={() => setView("profile")}>...</button>
    // Let's just click the first button with class circle-icon-btn or evaluate to change view.
    await page.evaluate(() => {
      // Find a button that might open the profile or just force the view state if possible
      // Actually, we can just click the profile icon.
      const btns = Array.from(document.querySelectorAll('.circle-icon-btn'));
      // The last one is usually profile
      if(btns.length > 0) btns[btns.length - 1].click();
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot-profile.png' });
    console.log("Screenshot saved.");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
