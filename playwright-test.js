const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const port = process.env.PORT || 3000;
  await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });

  // Click "I'm a Client" button
  await page.click('text="I\'m a Client"');

  // New first step: fill in name and email
  const nameInput = await page.$('input[placeholder="Enter your name"]');
  const emailInput = await page.$('input[placeholder="Enter your email"]');
  if (nameInput) await nameInput.fill('Playwright Tester');
  if (emailInput) await emailInput.fill('tester@example.com');
  const nextBtn1 = await page.$('button:has-text("Next")');
  if (nextBtn1) await nextBtn1.click();

  // Now on Project Details step: fill project name
  await page.fill('#projectName', 'Playwright Test Project');

  // Click Next until Review
  for (let i = 0; i < 7; i++) {
    const next = await page.$('button:has-text("Next")');
    if (!next) break;
    await next.click();
    await page.waitForTimeout(300);
  }

  // Wait for Download PDF button and click
  await page.waitForSelector('button:has-text("Download PDF")', { timeout: 10000 });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download PDF")')
  ]);

  const path = await download.path();
  console.log('Downloaded to:', path);

  await browser.close();
})();