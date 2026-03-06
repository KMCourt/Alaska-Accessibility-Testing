/**
 * ===========================================
 * ACCESSIBILITY SCAN TEST
 * ===========================================
 * Runs axe-core accessibility scans against all pages
 * in Chrome, Firefox and Edge.
 *
 * Generates ONE consolidated HTML report at:
 *   results/YYYY-MM-DD/report.html
 *
 * The report contains every page, every browser,
 * every violation, and a copy-ready bug ticket
 * for each issue — all in one place.
 *
 * HOW TO RUN:
 * npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js
 * ===========================================
 */

require('dotenv').config();
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const { generateConsolidatedReport } = require('../utils/report-generator');
const { getPreviousCounts, recordRun, isRegression } = require('../utils/trend-tracker');
const { postToTeams } = require('../utils/teams-notify');

// -------------------------------------------
// PAGES TO SCAN
// Add new pages here as needed.
// -------------------------------------------
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
  {
    name: 'Info Page',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    setup: async (page) => {
      // Click the first Info button — navigates to a live course details page
      // without hardcoding an eventInstanceId that will expire
      await page.locator('button[class*="_info_"]').first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'My Basket Modal',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 120000,
    scanScope: '[role="dialog"]',
    setup: async (page) => {
      // Add a course to the basket so the modal has content
      await page.locator('button:has-text("Add to basket")').first().click();
      // Wait for basket badge to update (indicates item was added)
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);
      // Click the cart container div to open the basket modal
      await page.locator('div[class*="_cart_"]').first().click();
      // Wait for the modal to become visible
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        const style = window.getComputedStyle(dialog);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
    },
  },
];

// -------------------------------------------
// RESULTS FOLDER SETUP
// -------------------------------------------
const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, '..', 'results', today);
const screenshotsDir = path.join(resultsDir, 'screenshots');
const jsonDir = path.join(resultsDir, 'json');

[resultsDir, screenshotsDir, jsonDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Collects all scan results — used to build the single consolidated report
const allResults = [];
const regressions = [];

test.setTimeout(60000);

test.describe('Accessibility Scan', () => {

  for (const pageDef of PAGES) {
    test(`Scan: ${pageDef.name}`, async ({ page, browserName }) => {

      // Use per-page timeout if specified (e.g. modals need more time)
      if (pageDef.timeout) test.setTimeout(pageDef.timeout);

      // Navigate to page
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Run any setup steps (e.g. open a modal or navigate via click)
      if (pageDef.setup) {
        await pageDef.setup(page);
        await page.waitForTimeout(1000);
      }

      // Capture the actual URL after any navigation (e.g. clicking Info lands on a different page)
      const actualUrl = page.url();

      // Full page screenshot — saved in screenshots/ subfolder
      const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();
      const screenshotFile = `${safeName}_${browserName}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotFile);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Run axe scan (scoped to a specific element if defined, e.g. a modal)
      const axeBuilder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']);
      if (pageDef.scanScope) axeBuilder.include(pageDef.scanScope);
      const results = await axeBuilder.analyze();

      // Take element screenshots for each violation
      const elementScreenshots = {};
      for (const violation of results.violations) {
        elementScreenshots[violation.id] = [];
        for (let i = 0; i < violation.nodes.length; i++) {
          const target = violation.nodes[i].target?.[0];
          if (target) {
            try {
              const element = page.locator(target).first();
              const shotFile = `${safeName}_${browserName}_${violation.id}_${i}.png`;
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

      // Get previous run counts for trend comparison
      const previousCounts = getPreviousCounts(pageDef.name, browserName);

      // Check for regression
      if (isRegression(previousCounts, counts.total)) {
        regressions.push({ page: pageDef.name, browser: browserName });
        console.log(`\n⚠️ REGRESSION: ${pageDef.name} (${browserName}) has more violations than last run!`);
      }

      // Record this run in trend history
      recordRun({ page: pageDef.name, browser: browserName, counts });

      // Store full result for the consolidated report
      allResults.push({
        page: pageDef.name,
        url: actualUrl,
        browser: browserName,
        counts,
        previousCounts,
        violations: results.violations,
        screenshotFile,
        elementScreenshots,
      });

      // Save JSON (for programmatic access / import to tracking tools)
      const jsonPath = path.join(jsonDir, `${safeName}_${browserName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        page: pageDef.name,
        url: actualUrl,
        browser: browserName,
        scannedAt: new Date().toISOString(),
        summary: counts,
        violations: results.violations,
        incomplete: results.incomplete,
      }, null, 2));

      // Print terminal summary
      console.log(`\n========================================`);
      console.log(`PAGE    : ${pageDef.name}`);
      console.log(`BROWSER : ${browserName}`);
      console.log(`========================================`);
      console.log(`Total    : ${counts.total}`);
      console.log(`Critical : ${counts.critical}`);
      console.log(`Serious  : ${counts.serious}`);
      console.log(`Moderate : ${counts.moderate}`);
      console.log(`Minor    : ${counts.minor}`);
    });
  }

  // -------------------------------------------
  // GENERATE CONSOLIDATED REPORT + NOTIFY TEAMS
  // -------------------------------------------
  test('Generate report and notify Teams', async () => {

    const reportPath = path.join(resultsDir, 'report.html');
    generateConsolidatedReport({ allResults, regressions, reportPath, today });

    console.log(`\n✅ Report saved to: results/${today}/report.html`);

    // Post to Teams
    const summaryData = allResults.map(r => ({
      page: r.page, url: r.url, browser: r.browser, ...r.counts,
    }));

    await postToTeams({
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      summaryData,
      today,
      regressions,
    });
  });
});
