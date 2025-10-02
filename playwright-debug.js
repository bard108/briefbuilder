const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('dialog', async dialog => { console.log('DIALOG:', dialog.message()); await dialog.dismiss(); });
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.click('text="I\'m a Client"');
  await page.fill('#projectName', 'Playwright Debug Project');

  // move through steps to reach Review
  for (let i = 0; i < 6; i++) {
    const next = await page.$('button:has-text("Next")');
    if (!next) break;
    await next.click();
    await page.waitForTimeout(300);
  }

  // capture window state before click
  const hasJsPdf = await page.evaluate(() => !!window.jspdf);
  const hasHtml2Canvas = await page.evaluate(() => !!window.html2canvas);
  console.log('Has window.jspdf:', hasJsPdf);
  console.log('Has window.html2canvas:', hasHtml2Canvas);

  // Click Download and wait a bit
  await page.click('button:has-text("Download PDF")');
  await page.waitForTimeout(3000);

  console.log('Finished click; checking for any downloads in context...');
  const downloads = [];
  for (const d of context.pages()) {
    // noop
  }

  await browser.close();
})();