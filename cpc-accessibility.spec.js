/**
 * ===========================================
 * TTC ALASKA BOOKINGS — ACCESSIBILITY TEST SUITE
 * ===========================================
 *
 * WHAT THIS FILE DOES:
 * Runs automated accessibility scans across Chrome, Firefox and Edge
 * against all pages listed in the PAGES array below.
 *
 * STANDARD: WCAG 2.2 AA (current latest standard as of October 2023)
 *
 * WHAT IS BEING CHECKED:
 * - WCAG 2.0 A   : Fundamental rules — must pass
 * - WCAG 2.0 AA  : Legal standard for most organisations
 * - WCAG 2.1 AA  : Mobile and modern web rules
 * - WCAG 2.2 AA  : Latest standard — focus, forms, and touch
 *
 * VIOLATION SEVERITY LEVELS:
 * - Critical : Completely blocks access for some users
 * - Serious  : Significantly impairs access
 * - Moderate : Causes difficulty but user can work around it
 * - Minor    : Small issue with limited impact
 *
 * OUTPUTS PER PAGE PER BROWSER:
 * - Screenshot of the page at time of scan (saved to results/screenshots/)
 * - JSON report with full technical detail
 * - Plain English .txt report for non-technical team members
 * - Combined summary report across all pages and browsers
 *
 * HOW TO ADD A NEW PAGE:
 * Add a new entry to the PAGES array below:
 * { name: 'My Page', url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/my-page' }
 *
 * HOW TO RUN MANUALLY:
 * npx playwright test alaska-accessibility.spec.js --reporter=list
 *
 * HOW TO RUN ON A SPECIFIC BROWSER:
 * npx playwright test alaska-accessibility.spec.js --project=chromium
 * npx playwright test alaska-accessibility.spec.js --project=firefox
 * npx playwright test alaska-accessibility.spec.js --project=edge
 *
 * AUTOMATIC SCHEDULING:
 * This test is configured to run daily via GitHub Actions.
 * See .github/workflows/accessibility.yml for the schedule configuration.
 * ===========================================
 */

const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');

// -------------------------------------------
// PAGES TO SCAN
// Add or remove pages here as needed.
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
// PLAIN ENGLISH DESCRIPTIONS
// Maps each axe rule ID to a plain English explanation.
// -------------------------------------------
const PLAIN_ENGLISH = {
  'html-has-lang': {
    what: 'The page is missing a language setting.',
    why: 'Screen readers use the language setting to know how to read the page out loud. Without it, the content may be read in the wrong language, making it very difficult to understand for visually impaired users.',
    fix: 'A developer needs to add a language attribute to the top of the page code. This is a very quick, one-line change.',
  },
  'image-alt': {
    what: 'One or more images on the page have no description.',
    why: 'Users who are blind or visually impaired use screen readers that read out descriptions of images. If an image has no description, the screen reader has nothing to say, so the user misses that content entirely.',
    fix: 'A developer needs to add a short text description to each affected image. For decorative images, they should be marked as decorative so screen readers skip them.',
  },
  'meta-viewport': {
    what: 'The page is preventing users from zooming in on mobile devices.',
    why: 'Many users with low vision need to pinch and zoom on their phone to read text clearly. This page has a setting that blocks that ability.',
    fix: 'A developer needs to remove the zoom restriction from the page settings. This is a very quick, one-line change.',
  },
  'nested-interactive': {
    what: 'Some clickable elements on the page are incorrectly placed inside other clickable elements.',
    why: 'When a button or link is placed inside another button or link, keyboard users and screen reader users can get confused or stuck.',
    fix: 'A developer needs to review the affected elements and restructure them so no interactive element is placed inside another.',
  },
  'color-contrast': {
    what: 'Some text on the page does not have enough contrast against its background colour.',
    why: 'Users with low vision or colour blindness may struggle to read text that does not stand out clearly from its background.',
    fix: 'A designer and developer need to adjust either the text colour or background colour to meet the required contrast ratio.',
  },
  'label': {
    what: 'One or more form fields are missing a label.',
    why: 'When a form field has no label, screen reader users cannot tell what information they are supposed to enter.',
    fix: 'A developer needs to add a visible or hidden label to each affected form field.',
  },
  'button-name': {
    what: 'One or more buttons on the page have no readable name.',
    why: 'Screen readers announce the name of a button when a user focuses on it. If a button has no name, the user does not know what it does.',
    fix: 'A developer needs to add a text label or description to each affected button.',
  },
  'link-name': {
    what: 'One or more links on the page have no readable name.',
    why: 'Screen readers read out link names so users know where a link will take them. A link with no name is announced as just "link" with no context.',
    fix: 'A developer needs to add descriptive text to each affected link.',
  },
};

// -------------------------------------------
// HELPER: GET PLAIN ENGLISH CONTENT FOR A RULE
// -------------------------------------------
function getPlainEnglish(ruleId) {
  return PLAIN_ENGLISH[ruleId] || {
    what: `An accessibility issue was detected (rule: ${ruleId}).`,
    why: 'This issue may prevent some users from accessing or understanding content on this page.',
    fix: 'A developer should review this issue. See the help link in the technical report for guidance.',
  };
}

// -------------------------------------------
// HELPER: SEVERITY LABEL IN PLAIN ENGLISH
// -------------------------------------------
function severityLabel(impact) {
  const labels = {
    critical: 'CRITICAL — Must be fixed immediately. This blocks some users from accessing the page.',
    serious:  'SERIOUS — Should be fixed as soon as possible. This significantly impacts some users.',
    moderate: 'MODERATE — Should be planned in for fixing. This causes difficulty for some users.',
    minor:    'MINOR — Low priority but should be addressed over time.',
  };
  return labels[impact] || impact;
}

// -------------------------------------------
// HELPER: GENERATE PLAIN ENGLISH REPORT
// -------------------------------------------
function generatePlainEnglishReport(pageDef, browserName, results, filePath) {
  const lines = [];
  const date = new Date().toLocaleString('en-GB');
  const total = results.violations.length;

  lines.push(`ACCESSIBILITY REPORT`);
  lines.push(`====================`);
  lines.push(`Page         : ${pageDef.name}`);
  lines.push(`URL          : ${pageDef.url}`);
  lines.push(`Browser      : ${browserName}`);
  lines.push(`Scanned on   : ${date}`);
  lines.push(`====================`);
  lines.push(``);
  lines.push(`SUMMARY`);
  lines.push(`-------`);

  if (total === 0) {
    lines.push(`No accessibility failures were found on this page in ${browserName}.`);
  } else {
    lines.push(`This page has ${total} accessibility issue(s) in ${browserName} that need attention:`);
    lines.push(``);
    lines.push(`  Critical : ${results.violations.filter(v => v.impact === 'critical').length}  (must fix immediately)`);
    lines.push(`  Serious  : ${results.violations.filter(v => v.impact === 'serious').length}  (fix as soon as possible)`);
    lines.push(`  Moderate : ${results.violations.filter(v => v.impact === 'moderate').length}  (plan in for fixing)`);
    lines.push(`  Minor    : ${results.violations.filter(v => v.impact === 'minor').length}  (low priority)`);
  }
  lines.push(``);

  if (results.violations.length > 0) {
    lines.push(`FAILURES`);
    lines.push(`--------`);
    lines.push(`The following issues were automatically confirmed as failures.`);
    lines.push(`They must be reviewed and fixed by the development team.`);
    lines.push(``);

    results.violations.forEach((v, i) => {
      const pe = getPlainEnglish(v.id);
      lines.push(`Issue ${i + 1} of ${total}`);
      lines.push(`Severity     : ${severityLabel(v.impact)}`);
      lines.push(`What is it?  : ${pe.what}`);
      lines.push(`Why does it matter? : ${pe.why}`);
      lines.push(`How to fix   : ${pe.fix}`);
      lines.push(`Elements     : ${v.nodes.length} element(s) on the page are affected.`);
      lines.push(`Affected     :`);
      v.nodes.forEach((n, ni) => {
        const target = n.target ? n.target.join(' > ') : 'Unknown element';
        lines.push(`  ${ni + 1}. ${target}`);
      });
      lines.push(`More info    : ${v.helpUrl}`);
      lines.push(``);
      lines.push(`- - - - - - - - - - - - - - - - - - -`);
      lines.push(``);
    });
  }

  if (results.incomplete.length > 0) {
    lines.push(`NEEDS MANUAL REVIEW`);
    lines.push(`-------------------`);
    lines.push(`The following items could not be automatically confirmed as pass or fail.`);
    lines.push(`A team member needs to manually check each one.`);
    lines.push(``);

    results.incomplete.forEach((v, i) => {
      const pe = getPlainEnglish(v.id);
      lines.push(`Manual Check ${i + 1} of ${results.incomplete.length}`);
      lines.push(`What is it?  : ${pe.what}`);
      lines.push(`Why does it matter? : ${pe.why}`);
      lines.push(`What to do   : Manually visit the page and check whether this issue exists.`);
      lines.push(`More info    : ${v.helpUrl}`);
      lines.push(``);
      lines.push(`- - - - - - - - - - - - - - - - - - -`);
      lines.push(``);
    });
  }

  lines.push(`END OF REPORT`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

// -------------------------------------------
// RESULTS FOLDER SETUP
// -------------------------------------------
const resultsDir = path.join(__dirname, 'results');
const screenshotsDir = path.join(resultsDir, 'screenshots');
const summaryDir = path.join(resultsDir, 'summary');

[resultsDir, screenshotsDir, summaryDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// -------------------------------------------
// SUMMARY TRACKER
// Collects results across all pages and browsers for the combined report.
// -------------------------------------------
const summaryData = [];

// -------------------------------------------
// TIMEOUT SETTING
// -------------------------------------------
test.setTimeout(60000);

test.describe('Accessibility Audit — TTC Alaska Bookings', () => {

  for (const pageDef of PAGES) {
    test(`Scan: ${pageDef.name}`, async ({ page, browserName }) => {

      // Navigate to the page
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Take a screenshot of the page before scanning
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();
      const screenshotPath = path.join(screenshotsDir, `${safeName}_${browserName}_${timestamp}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Run the accessibility scan against WCAG 2.0 A, 2.0 AA, 2.1 AA and 2.2 AA
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      // Build violation counts
      const counts = {
        critical: results.violations.filter(v => v.impact === 'critical').length,
        serious:  results.violations.filter(v => v.impact === 'serious').length,
        moderate: results.violations.filter(v => v.impact === 'moderate').length,
        minor:    results.violations.filter(v => v.impact === 'minor').length,
      };

      // Add to summary tracker
      summaryData.push({
        page: pageDef.name,
        url: pageDef.url,
        browser: browserName,
        totalViolations: results.violations.length,
        ...counts,
        screenshotPath: screenshotPath,
      });

      // Save JSON report
      const jsonReport = {
        page: pageDef.name,
        url: pageDef.url,
        browser: browserName,
        scannedAt: new Date().toISOString(),
        screenshotPath: screenshotPath,
        summary: { totalViolations: results.violations.length, byCriticality: counts },
        violations: results.violations.map(v => ({
          id: v.id,
          description: v.description,
          impact: v.impact,
          wcagCriteria: v.tags.filter(t => t.startsWith('wcag')),
          helpUrl: v.helpUrl,
          affectedElements: v.nodes.map(n => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        })),
        incomplete: results.incomplete.map(v => ({
          id: v.id,
          description: v.description,
          impact: v.impact,
          wcagCriteria: v.tags.filter(t => t.startsWith('wcag')),
          helpUrl: v.helpUrl,
          note: 'Needs manual review',
        })),
      };

      const jsonPath = path.join(resultsDir, `${safeName}_${browserName}_${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

      // Save plain English report
      const txtPath = path.join(resultsDir, `${safeName}_${browserName}_${timestamp}_report.txt`);
      generatePlainEnglishReport(pageDef, browserName, results, txtPath);

      // Print terminal summary
      console.log(`\n========================================`);
      console.log(`PAGE    : ${pageDef.name}`);
      console.log(`BROWSER : ${browserName}`);
      console.log(`URL     : ${pageDef.url}`);
      console.log(`========================================`);
      console.log(`Total Violations : ${results.violations.length}`);
      console.log(`  Critical : ${counts.critical}`);
      console.log(`  Serious  : ${counts.serious}`);
      console.log(`  Moderate : ${counts.moderate}`);
      console.log(`  Minor    : ${counts.minor}`);
      console.log(`Screenshot : results/screenshots/${safeName}_${browserName}_${timestamp}.png`);
      console.log(`Report     : results/${safeName}_${browserName}_${timestamp}_report.txt`);

      if (results.violations.length > 0) {
        console.log('\nVIOLATIONS:');
        results.violations.forEach((v, i) => {
          console.log(`\n  ${i + 1}. [${v.impact.toUpperCase()}] ${v.id}`);
          console.log(`     Description : ${v.description}`);
          console.log(`     WCAG        : ${v.tags.filter(t => t.startsWith('wcag')).join(', ')}`);
          console.log(`     Help        : ${v.helpUrl}`);
          console.log(`     Elements    : ${v.nodes.length} affected`);
        });
      }
    });
  }

  // -------------------------------------------
  // COMBINED SUMMARY REPORT
  // Runs after all page scans and generates a single summary
  // across all pages and browsers.
  // -------------------------------------------
  test('Generate combined summary report', async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const date = new Date().toLocaleString('en-GB');
    const lines = [];

    lines.push(`ACCESSIBILITY AUDIT — COMBINED SUMMARY REPORT`);
    lines.push(`=============================================`);
    lines.push(`Site       : TTC Alaska Bookings`);
    lines.push(`Standard   : WCAG 2.2 AA`);
    lines.push(`Browsers   : Chrome, Firefox, Edge`);
    lines.push(`Generated  : ${date}`);
    lines.push(`=============================================`);
    lines.push(``);

    const totalViolations = summaryData.reduce((sum, r) => sum + r.totalViolations, 0);
    const totalCritical   = summaryData.reduce((sum, r) => sum + r.critical, 0);
    const totalSerious    = summaryData.reduce((sum, r) => sum + r.serious, 0);
    const totalModerate   = summaryData.reduce((sum, r) => sum + r.moderate, 0);
    const totalMinor      = summaryData.reduce((sum, r) => sum + r.minor, 0);

    lines.push(`OVERALL SUMMARY`);
    lines.push(`---------------`);
    lines.push(`Total violations found across all pages and browsers : ${totalViolations}`);
    lines.push(`  Critical : ${totalCritical}`);
    lines.push(`  Serious  : ${totalSerious}`);
    lines.push(`  Moderate : ${totalModerate}`);
    lines.push(`  Minor    : ${totalMinor}`);
    lines.push(``);
    lines.push(`RESULTS BY PAGE AND BROWSER`);
    lines.push(`---------------------------`);

    summaryData.forEach(r => {
      lines.push(``);
      lines.push(`Page    : ${r.page}`);
      lines.push(`Browser : ${r.browser}`);
      lines.push(`URL     : ${r.url}`);
      lines.push(`Total   : ${r.totalViolations} violation(s)`);
      lines.push(`  Critical : ${r.critical}`);
      lines.push(`  Serious  : ${r.serious}`);
      lines.push(`  Moderate : ${r.moderate}`);
      lines.push(`  Minor    : ${r.minor}`);
      lines.push(`Screenshot : ${r.screenshotPath}`);
      lines.push(`- - - - - - - - - - - - - - -`);
    });

    lines.push(``);
    lines.push(`For full details see the individual report files in the results/ folder.`);
    lines.push(`END OF SUMMARY`);

    const summaryPath = path.join(summaryDir, `summary_${timestamp}.txt`);
    fs.writeFileSync(summaryPath, lines.join('\n'), 'utf8');
    console.log(`\nCombined summary saved to: results/summary/summary_${timestamp}.txt`);
  });
});