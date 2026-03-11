/**
 * ===========================================
 * ACCESSIBILITY SCAN TEST — BROWSER
 * ===========================================
 * Runs axe-core accessibility scans against all pages
 * in Chrome, Firefox and Edge.
 *
 * Generates ONE consolidated HTML report at:
 *   trainer-results/YYYY-MM-DD/browser/report.html
 *
 * The report contains every page, every browser,
 * every violation, and a copy-ready bug ticket
 * for each issue — all in one place.
 *
 * HOW TO RUN:
 * All browsers:   npx playwright test --config=trainer.config.js Trainer-Test/browser-tests/
 * One browser:    npx playwright test --config=trainer.config.js Trainer-Test/browser-tests/ --project=chromium
 * ===========================================
 */

require('dotenv').config();
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const { getPreviousCounts, recordRun, isRegression } = require('../../utils/trend-tracker');
const TREND_HISTORY = path.join(__dirname, '..', '..', 'trainer-trend-history.json');

const BASE = 'https://ttc-eun-qat-trainer-as.azurewebsites.net';

// -------------------------------------------
// SIGN-IN HELPER
// Navigates to the app, waits for the B2C login page,
// fills in credentials, and waits for the redirect back.
// -------------------------------------------
async function signIn(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Azure AD B2C login form — adjust selectors if the page uses different ids
  await page.locator('input[id="signInName"], input[name="logonIdentifier"], input[type="email"]').fill(process.env.TRAINER_USERNAME);
  await page.locator('input[id="password"], input[name="password"], input[type="password"]').fill(process.env.TRAINER_PASSWORD);
  await page.locator('button[id="next"], button[type="submit"]').click();

  // Wait for redirect back to the app after successful login
  await page.waitForURL(url => url.href.startsWith(BASE), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

// -------------------------------------------
// PAGES TO SCAN
// Add new pages here as needed.
// -------------------------------------------
const PAGES = [
  {
    name: 'Sign In Page',
    url: BASE,
    // No setup — scans the B2C login form itself
  },
  {
    name: 'Home (Signed In)',
    url: BASE,
    timeout: 90000,
    skipDefaultNav: true,  // signIn handles navigation
    setup: async (page) => {
      await signIn(page);
    },
  },
  // Add more authenticated pages below, e.g.:
  // {
  //   name: 'My Profile',
  //   url: `${BASE}/profile`,
  //   timeout: 60000,
  //   setup: async (page) => {
  //     await signIn(page);
  //     await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
  //     await page.waitForTimeout(2000);
  //   },
  // },
];

// -------------------------------------------
// RESULTS FOLDER SETUP
// -------------------------------------------
const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, '..', 'trainer-results', today, 'browser');
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

      if (!pageDef.skipDefaultNav) {
        await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
      }

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

      const previousCounts = getPreviousCounts(pageDef.name, projectName, TREND_HISTORY);
      recordRun({ page: pageDef.name, browser: projectName, counts, historyFile: TREND_HISTORY });

      const jsonPath = path.join(jsonDir, `${safeName}_${projectName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        page: pageDef.name,
        url: actualUrl,
        browser: projectName,
        scannedAt: new Date().toISOString(),
        summary: counts,
        previousCounts,
        regression: isRegression(previousCounts, counts.total),
        screenshotFile,
        elementScreenshots,
        violations: results.violations,
        incomplete: results.incomplete,
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
// Report generation and Teams notification are handled by utils/trainer-teardown.js
// which runs after ALL tests across ALL browsers complete.
