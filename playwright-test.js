const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Click "I'm a Client" button
  await page.click('text="I\'m a Client"');
  // Fill project name
  await page.fill('#projectName', 'Playwright Test Project');
  // Click Next until Review
  for (let i = 0; i < 6; i++) {
    const next = await page.$('button:has-text("Next")');
    if (!next) break;
    await next.click();
    await page.waitForTimeout(300);
  }

  // Wait for Download PDF button and click
  await page.waitForSelector('button:has-text("Download PDF")', { timeout: 5000 });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download PDF")')
  ]);

  const path = await download.path();
  console.log('Downloaded to:', path);

  await browser.close();
})();