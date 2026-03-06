/**
 * ===========================================
 * MOBILE VIEWPORT ACCESSIBILITY TEST
 * ===========================================
 * Runs accessibility scans on mobile and tablet viewports.
 * Checks for mobile specific issues like:
 * - Touch target sizes (WCAG 2.2 minimum 24x24px)
 * - Horizontal scrolling
 * - Viewport zoom blocking
 *
 * HOW TO RUN:
 * npx playwright test tests/mobile-viewport.spec.js --reporter=list
 * ===========================================
 */

const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const { generateHtmlReport } = require('../utils/report-generator');

const PAGES = [
  {
    name: 'CPC Page',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
  },
  {
    name: 'Details and Payment',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment',
  },
  {
    name: 'Details and Payment - Pay',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment/pay',
  },
];

const MOBILE_DEVICES = [
  // Phones
  { name: 'iPhone 14',             width: 390,  height: 844,  deviceScaleFactor: 3,     isMobile: true },
  { name: 'iPhone SE',             width: 375,  height: 667,  deviceScaleFactor: 2,     isMobile: true },
  { name: 'Samsung Galaxy S23',    width: 360,  height: 780,  deviceScaleFactor: 3,     isMobile: true },
  { name: 'Samsung Galaxy A54',    width: 360,  height: 800,  deviceScaleFactor: 2.5,   isMobile: true },
  { name: 'Pixel 7',               width: 412,  height: 915,  deviceScaleFactor: 2.625, isMobile: true },
  // Tablets
  { name: 'iPad 10th Gen',         width: 820,  height: 1180, deviceScaleFactor: 2,     isMobile: true },
  { name: 'iPad Mini',             width: 768,  height: 1024, deviceScaleFactor: 2,     isMobile: true },
  { name: 'Samsung Galaxy Tab S8', width: 800,  height: 1280, deviceScaleFactor: 2,     isMobile: true },
];

const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, '..', 'results', today);

test.setTimeout(90000);

// -------------------------------------------
// Generate one describe block per device
// each with its own test.use() call
// -------------------------------------------
for (const device of MOBILE_DEVICES) {

  test.describe(`Mobile Viewport — ${device.name}`, () => {

    // test.use() must be at the TOP of describe, not inside a loop
    test.use({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile,
      hasTouch: true,
    });

    for (const pageDef of PAGES) {

      test(`Scan: ${pageDef.name}`, async ({ page }) => {

        await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();
        const deviceSafe = device.name.replace(/\s+/g, '_').toLowerCase();
        const pageDir = path.join(resultsDir, `${safeName}_${deviceSafe}`);
        if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });

        // Take screenshot
        const screenshotPath = path.join(pageDir, 'screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Check for horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );

        // Check touch target sizes (WCAG 2.2 — minimum 24x24px)
        const smallTargets = await page.evaluate(() => {
          const interactive = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"]'));
          return interactive
            .map(el => {
              const rect = el.getBoundingClientRect();
              return {
                tag: el.tagName,
                text: el.innerText?.trim()?.substring(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              };
            })
            .filter(el => el.width > 0 && (el.width < 24 || el.height < 24));
        });

        // Run axe scan
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();

        const counts = {
          total: results.violations.length,
          critical: results.violations.filter(v => v.impact === 'critical').length,
          serious:  results.violations.filter(v => v.impact === 'serious').length,
          moderate: results.violations.filter(v => v.impact === 'moderate').length,
          minor:    results.violations.filter(v => v.impact === 'minor').length,
        };

        // Generate HTML report
        const htmlPath = path.join(pageDir, 'report.html');
        generateHtmlReport({
          pageDef: { ...pageDef, name: `${pageDef.name} — ${device.name}` },
          browserName: device.name,
          results,
          screenshotPath,
          elementScreenshots: {},
          reportPath: htmlPath,
          previousCounts: null,
          isMobile: true,
        });

        // Print terminal summary
        console.log(`\n========================================`);
        console.log(`PAGE    : ${pageDef.name}`);
        console.log(`DEVICE  : ${device.name} (${device.width}x${device.height})`);
        console.log(`========================================`);
        console.log(`Total Violations    : ${counts.total}`);
        console.log(`Horizontal Scroll   : ${hasHorizontalScroll ? 'YES — accessibility issue!' : 'No'}`);
        console.log(`Small Touch Targets : ${smallTargets.length} element(s) below 24x24px`);
        if (smallTargets.length > 0) {
          smallTargets.forEach(t => console.log(`  - ${t.tag} "${t.text}" (${t.width}x${t.height}px)`));
        }
        console.log(`Report : results/${today}/${safeName}_${deviceSafe}/report.html`);
      });
    }
  });
}