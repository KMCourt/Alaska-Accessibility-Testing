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
const { isRegression } = require('./trend-tracker');
const { postToTeams } = require('./teams-notify');

module.exports = async function globalTeardown() {
  const today = new Date().toISOString().split('T')[0];
  const resultsDir = path.join(__dirname, '..', 'results', today);
  const jsonDir = path.join(resultsDir, 'json');
  const reportPath = path.join(resultsDir, 'report.html');

  if (!fs.existsSync(jsonDir)) {
    console.log('\nNo JSON results found — skipping report generation.');
    return;
  }

  // Read every JSON file written by the scan tests
  const jsonFiles = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
  if (jsonFiles.length === 0) {
    console.log('\nNo JSON results found — skipping report generation.');
    return;
  }

  const allResults = jsonFiles.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(jsonDir, f), 'utf8'));
    return {
      page:             data.page,
      url:              data.url,
      browser:          data.browser,
      counts:           data.summary,
      previousCounts:   data.previousCounts,
      violations:       data.violations,
      screenshotFile:   data.screenshotFile,
      elementScreenshots: data.elementScreenshots || {},
    };
  });

  // Rebuild regressions list from stored flags
  const regressions = jsonFiles
    .map(f => JSON.parse(fs.readFileSync(path.join(jsonDir, f), 'utf8')))
    .filter(d => d.regression)
    .map(d => ({ page: d.page, browser: d.browser }));

  if (regressions.length > 0) {
    console.log('\n⚠️  REGRESSIONS DETECTED:');
    regressions.forEach(r => console.log(`   - ${r.page} (${r.browser})`));
  }

  generateConsolidatedReport({ allResults, regressions, reportPath, today });
  console.log(`\n✅ Report saved to: results/${today}/report.html`);

  const summaryData = allResults.map(r => ({
    page: r.page, url: r.url, browser: r.browser, ...r.counts,
  }));

  await postToTeams({
    webhookUrl: process.env.TEAMS_WEBHOOK_URL,
    summaryData,
    today,
    regressions,
  });
};
