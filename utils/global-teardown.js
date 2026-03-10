/**
 * ===========================================
 * GLOBAL TEARDOWN
 * ===========================================
 * Runs once after ALL tests across ALL browsers complete.
 * Reads every JSON result file written during the scan,
 * builds the consolidated HTML report, and notifies Teams.
 * ===========================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateConsolidatedReport } = require('./report-generator');
const { postToTeams } = require('./teams-notify');
const { pruneHistory } = require('./trend-tracker');

const TREND_HISTORY = path.join(__dirname, '..', 'cpcba-trend-history.json');

const RETENTION_DAYS = 90;

function pruneOldReports(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  for (const entry of fs.readdirSync(baseDir)) {
    // Only remove dated folders (YYYY-MM-DD format)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) continue;
    const folderPath = path.join(baseDir, entry);
    const folderDate = new Date(entry).getTime();
    if (!isNaN(folderDate) && folderDate < cutoff) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`🗑️  Removed old report: ${entry}`);
    }
  }
}

module.exports = async function globalTeardown() {
  const today = new Date().toISOString().split('T')[0];
  const baseResultsDir = path.join(__dirname, '..', 'CPCBA-accessibility-tests', 'cpc-results');
  const resultsDir = path.join(baseResultsDir, today);

  // Remove reports and trend history older than 90 days
  pruneOldReports(baseResultsDir);
  pruneHistory(TREND_HISTORY);

  const browserJsonDir = path.join(resultsDir, 'browser', 'json');
  const mobileJsonDir  = path.join(resultsDir, 'mobile',  'json');

  const readJsonDir = (dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  };

  const browserData = readJsonDir(browserJsonDir);
  const mobileData  = readJsonDir(mobileJsonDir);

  if (browserData.length === 0 && mobileData.length === 0) {
    console.log('\nNo JSON results found — skipping report generation.');
    return;
  }

  const toResult = (data) => ({
    page:               data.page,
    url:                data.url,
    browser:            data.browser,
    counts:             data.summary,
    previousCounts:     data.previousCounts,
    violations:         data.violations,
    screenshotFile:     data.screenshotFile,
    elementScreenshots: data.elementScreenshots || {},
  });

  const browserResults = browserData.map(toResult);
  const mobileResults  = mobileData.map(toResult);
  const allResults     = [...browserResults, ...mobileResults];

  // Rebuild regressions list from stored flags
  const regressions = [...browserData, ...mobileData]
    .filter(d => d.regression)
    .map(d => ({ page: d.page, browser: d.browser }));

  if (regressions.length > 0) {
    console.log('\n⚠️  REGRESSIONS DETECTED:');
    regressions.forEach(r => console.log(`   - ${r.page} (${r.browser})`));
  }

  // ── Browser report ──────────────────────────────────────────────────────
  if (browserResults.length > 0) {
    const reportPath = path.join(resultsDir, 'browser', 'report.html');
    generateConsolidatedReport({ allResults: browserResults, regressions, reportPath, today });
    console.log(`\n✅ Browser report saved to: CPCBA-accessibility-tests/cpc-results/${today}/browser/report.html`);
  }

  // ── Mobile report ───────────────────────────────────────────────────────
  if (mobileResults.length > 0) {
    const mobileReportPath = path.join(resultsDir, 'mobile', 'report.html');
    generateConsolidatedReport({ allResults: mobileResults, regressions, reportPath: mobileReportPath, today });
    console.log(`✅ Mobile report  saved to: CPCBA-accessibility-tests/cpc-results/${today}/mobile/report.html`);
  }

  // Print grand totals
  const printTotals = (label, results) => {
    const t = results.reduce(
      (acc, r) => {
        acc.total    += r.counts.total    || 0;
        acc.critical += r.counts.critical || 0;
        acc.serious  += r.counts.serious  || 0;
        acc.moderate += r.counts.moderate || 0;
        acc.minor    += r.counts.minor    || 0;
        return acc;
      },
      { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }
    );
    console.log(`\n========================================`);
    console.log(`  ${label}`);
    console.log(`========================================`);
    console.log(`  Total    : ${t.total}`);
    console.log(`  Critical : ${t.critical}`);
    console.log(`  Serious  : ${t.serious}`);
    console.log(`  Moderate : ${t.moderate}`);
    console.log(`  Minor    : ${t.minor}`);
    console.log(`========================================`);
  };

  if (browserResults.length > 0) printTotals('BROWSER TOTALS (Chrome / Firefox / Edge)', browserResults);
  if (mobileResults.length  > 0) printTotals('MOBILE TOTALS  (iPhone / Galaxy / Pixel)',  mobileResults);

  if (browserResults.length > 0) {
    await postToTeams({
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      summaryData: browserResults.map(r => ({ page: r.page, url: r.url, browser: r.browser, ...r.counts })),
      today,
      regressions,
      label: 'CPCBA Browser Scan (Chrome / Firefox / Edge)',
    });
  }

  if (mobileResults.length > 0) {
    await postToTeams({
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      summaryData: mobileResults.map(r => ({ page: r.page, url: r.url, browser: r.browser, ...r.counts })),
      today,
      regressions,
      label: 'CPCBA Mobile Scan (iPhone / Galaxy / Pixel)',
    });
  }
};
