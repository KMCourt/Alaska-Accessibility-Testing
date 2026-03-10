/**
 * ===========================================
 * ACCESSIBILITY SCAN TEST — DORS-Booking BROWSER
 * ===========================================
 * Runs axe-core accessibility scans against all pages
 * in the DORS Booking site, in Chrome, Firefox and Edge.
 *
 * Generates ONE consolidated HTML report at:
 *   DORS-Booking-results/YYYY-MM-DD/browser/report.html
 *
 * HOW TO RUN:
 * All browsers:  npx playwright test --config=dors-booking.config.js --project=chromium --project=firefox --project=edge
 * One browser:   npx playwright test --config=dors-booking.config.js --project=chromium
 * ===========================================
 */

require('dotenv').config();
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const { getPreviousCounts, recordRun, isRegression } = require('../../utils/trend-tracker');

const BASE = 'https://ttc-eun-qat-booking-as.azurewebsites.net';

// -------------------------------------------
// PAGES TO SCAN
// Add new pages here as the site is built out.
// -------------------------------------------
const PAGES = [
  {
    name: 'DORS Booking Landing Page',
    url: `${BASE}/`,
  },
];

// -------------------------------------------
// RESULTS FOLDER SETUP
// -------------------------------------------
const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, '..', 'DORS-Booking-results', today, 'browser');
const screenshotsDir = path.join(resultsDir, 'screenshots');
const jsonDir = path.join(resultsDir, 'json');

[resultsDir, screenshotsDir, jsonDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

test.setTimeout(60000);

test.describe('Accessibility Scan', () => {

  for (const pageDef of PAGES) {
    test(`Scan: ${pageDef.name}`, async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;

      if (pageDef.timeout) test.setTimeout(pageDef.timeout);

      await page.context().clearCookies();
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });

      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      if (pageDef.setup) {
        await pageDef.setup(page);
        await page.waitForTimeout(1000);
      }

      const actualUrl = page.url();

      const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();
      const screenshotFile = `${safeName}_${projectName}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotFile);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const axeBuilder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice']);
      if (pageDef.scanScope) axeBuilder.include(pageDef.scanScope);
      const results = await axeBuilder.analyze();

      const elementScreenshots = {};
      for (const violation of results.violations) {
        elementScreenshots[violation.id] = [];
        for (let i = 0; i < violation.nodes.length; i++) {
          const target = violation.nodes[i].target?.[0];
          if (target) {
            try {
              const element = page.locator(target).first();
              const shotFile = `${safeName}_${projectName}_${violation.id}_${i}.png`;
              const shotPath = path.join(screenshotsDir, shotFile);
              await element.screenshot({ path: shotPath, timeout: 5000 });
              elementScreenshots[violation.id].push(shotFile);
            } catch {
              elementScreenshots[violation.id].push(null);
            }
          }
        }
      }

      const counts = {
        total:    results.violations.length,
        critical: results.violations.filter(v => v.impact === 'critical').length,
        serious:  results.violations.filter(v => v.impact === 'serious').length,
        moderate: results.violations.filter(v => v.impact === 'moderate').length,
        minor:    results.violations.filter(v => v.impact === 'minor').length,
      };

      const previousCounts = getPreviousCounts(pageDef.name, projectName);
      recordRun({ page: pageDef.name, browser: projectName, counts });

      const jsonPath = path.join(jsonDir, `${safeName}_${projectName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        page:               pageDef.name,
        url:                actualUrl,
        browser:            projectName,
        scannedAt:          new Date().toISOString(),
        summary:            counts,
        previousCounts,
        regression:         isRegression(previousCounts, counts.total),
        screenshotFile,
        elementScreenshots,
        violations:         results.violations,
        incomplete:         results.incomplete,
      }, null, 2));

      console.log(`\n========================================`);
      console.log(`PAGE    : ${pageDef.name}`);
      console.log(`BROWSER : ${projectName}`);
      console.log(`========================================`);
      console.log(`Total    : ${counts.total}`);
      console.log(`Critical : ${counts.critical}`);
      console.log(`Serious  : ${counts.serious}`);
      console.log(`Moderate : ${counts.moderate}`);
      console.log(`Minor    : ${counts.minor}`);
    });
  }

});
// Report generation and Teams notification handled by utils/dors-booking-teardown.js
// which runs after ALL tests across ALL browsers/devices complete.
