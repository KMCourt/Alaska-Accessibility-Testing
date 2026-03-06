/**
 * ===========================================
 * ACCESSIBILITY SCAN TEST
 * ===========================================
 * Runs axe-core accessibility scans against all pages
 * in Chrome, Firefox and Edge.
 * Generates HTML reports with screenshots and bug tickets.
 * Posts results to Teams and tracks trends over time.
 *
 * HOW TO RUN:
 * npx playwright test tests/accessibility-scan.spec.js --reporter=list
 * ===========================================
 */

require('dotenv').config();
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const { generateHtmlReport } = require('../utils/report-generator');
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
];

// -------------------------------------------
// RESULTS FOLDER SETUP
// -------------------------------------------
const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, '..', 'results', today);
const summaryDir = path.join(resultsDir, 'summary');
const jsonDir = path.join(resultsDir, 'json');

[resultsDir, summaryDir, jsonDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const summaryData = [];
const regressions = [];

test.setTimeout(60000);

test.describe('Accessibility Scan', () => {

  for (const pageDef of PAGES) {
    test(`Scan: ${pageDef.name}`, async ({ page, browserName }) => {

      // Navigate to page
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Create folder per page per browser
      const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();
      const pageDir = path.join(resultsDir, `${safeName}_${browserName}`);
      if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });

      // Full page screenshot
      const screenshotPath = path.join(pageDir, 'screenshot.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Run axe scan
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      // Take element screenshots for each violation
      const elementScreenshots = {};
      for (const violation of results.violations) {
        elementScreenshots[violation.id] = [];
        for (let i = 0; i < violation.nodes.length; i++) {
          const target = violation.nodes[i].target?.[0];
          if (target) {
            try {
              const element = page.locator(target).first();
              const shotPath = path.join(pageDir, `${violation.id}_element_${i}.png`);
              await element.screenshot({ path: shotPath });
              elementScreenshots[violation.id].push(shotPath);
            } catch {
              elementScreenshots[violation.id].push(null);
            }
          }
        }
      }

      const counts = {
        total: results.violations.length,
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

      // Add to summary
      summaryData.push({ page: pageDef.name, url: pageDef.url, browser: browserName, ...counts });

      // Generate HTML report
      const htmlPath = path.join(pageDir, 'report.html');
      generateHtmlReport({
        pageDef,
        browserName,
        results,
        screenshotPath,
        elementScreenshots,
        reportPath: htmlPath,
        previousCounts,
        isMobile: false,
      });

      // Save JSON report
      const jsonPath = path.join(jsonDir, `${safeName}_${browserName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        page: pageDef.name,
        url: pageDef.url,
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
      console.log(`Report   : results/${today}/${safeName}_${browserName}/report.html`);
    });
  }

  // -------------------------------------------
  // COMBINED SUMMARY + TEAMS NOTIFICATION
  // -------------------------------------------
  test('Generate summary and notify Teams', async () => {
    const date = new Date().toLocaleString('en-GB');
    const totalViolations = summaryData.reduce((s, r) => s + r.total, 0);

    // Generate summary HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessibility Summary — ${today}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 24px; color: #222; }
    h1 { background: #0b3c6e; color: white; padding: 20px; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #0b3c6e; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    .critical { color: #cc0000; font-weight: bold; }
    .serious  { color: #e65100; font-weight: bold; }
    .moderate { color: #f9a825; font-weight: bold; }
    .minor    { color: #558b2f; font-weight: bold; }
    .regression { background: #ffe0e0; }
  </style>
</head>
<body>
  <h1>♿ Accessibility Audit — Combined Summary</h1>
  <p><strong>Site:</strong> TTC Alaska Bookings</p>
  <p><strong>Standard:</strong> WCAG 2.2 AA</p>
  <p><strong>Browsers:</strong> Chrome, Firefox, Edge</p>
  <p><strong>Generated:</strong> ${date}</p>
  <p><strong>Total violations:</strong> ${totalViolations}</p>
  ${regressions.length > 0 ? `<p style="color:#cc0000;font-weight:bold;">⚠️ Regressions detected on: ${regressions.map(r => `${r.page} (${r.browser})`).join(', ')}</p>` : '<p style="color:#2e7d32;font-weight:bold;">✅ No regressions detected</p>'}
  <table>
    <thead>
      <tr><th>Page</th><th>Browser</th><th>Total</th><th>Critical</th><th>Serious</th><th>Moderate</th><th>Minor</th></tr>
    </thead>
    <tbody>
      ${summaryData.map(r => {
        const isReg = regressions.some(x => x.page === r.page && x.browser === r.browser);
        return `<tr class="${isReg ? 'regression' : ''}">
          <td>${r.page}${isReg ? ' ⚠️' : ''}</td>
          <td>${r.browser}</td>
          <td><strong>${r.total}</strong></td>
          <td class="critical">${r.critical}</td>
          <td class="serious">${r.serious}</td>
          <td class="moderate">${r.moderate}</td>
          <td class="minor">${r.minor}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  <p style="color:#888;font-size:12px;margin-top:40px;border-top:1px solid #eee;padding-top:16px;">
    Generated by TTC Accessibility Test Suite — ${date}
  </p>
</body>
</html>`;

    const summaryPath = path.join(summaryDir, `summary_${today}.html`);
    fs.writeFileSync(summaryPath, html, 'utf8');
    console.log(`\nSummary saved to: results/${today}/summary/summary_${today}.html`);

    // Post to Teams
    await postToTeams({
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      summaryData,
      today,
      regressions,
    });
  });
});