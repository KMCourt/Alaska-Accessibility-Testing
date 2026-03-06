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
 * OUTPUTS PER PAGE PER BROWSER:
 * - HTML report with screenshot inline and bug tickets per issue
 * - JSON report with full technical detail
 * - Combined summary report across all pages and browsers
 *
 * HOW TO ADD A NEW PAGE:
 * Add a new entry to the PAGES array below.
 *
 * HOW TO RUN:
 * npx playwright test cpc-accessibility.spec.js --reporter=list
 * ===========================================
 */

const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');

// -------------------------------------------
// PAGES TO SCAN
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
// -------------------------------------------
const PLAIN_ENGLISH = {
  'html-has-lang': {
    what: 'The page is missing a language setting.',
    why: 'Screen readers use the language setting to know how to read the page out loud. Without it, the content may be read in the wrong language, making it very difficult to understand for visually impaired users.',
    fix: 'A developer needs to add a language attribute to the top of the page code. This is a very quick, one-line change.',
    steps: 'Open the page URL above. Run a screen reader (NVDA on Windows or VoiceOver on Mac). Listen to the language the page is read in.',
  },
  'image-alt': {
    what: 'One or more images on the page have no description.',
    why: 'Users who are blind or visually impaired use screen readers that read out descriptions of images. If an image has no description, the screen reader has nothing to say, so the user misses that content entirely.',
    fix: 'A developer needs to add a short text description to each affected image. For decorative images, they should be marked as decorative so screen readers skip them.',
    steps: 'Open the page URL above. Run a screen reader (NVDA on Windows or VoiceOver on Mac). Navigate to the affected image element(s) listed below.',
  },
  'meta-viewport': {
    what: 'The page is preventing users from zooming in on mobile devices.',
    why: 'Many users with low vision need to pinch and zoom on their phone to read text clearly. This page has a setting that blocks that ability.',
    fix: 'A developer needs to remove the zoom restriction from the page settings. This is a very quick, one-line change.',
    steps: 'Open the page on a mobile device. Attempt to pinch and zoom in on the page content.',
  },
  'nested-interactive': {
    what: 'Some clickable elements on the page are incorrectly placed inside other clickable elements.',
    why: 'When a button or link is placed inside another button or link, keyboard users and screen reader users can get confused or stuck.',
    fix: 'A developer needs to review the affected elements and restructure them so no interactive element is placed inside another.',
    steps: 'Open the page URL above. Use Tab key to navigate to the affected elements. Attempt to activate them using Enter or Space.',
  },
  'color-contrast': {
    what: 'Some text on the page does not have enough contrast against its background colour.',
    why: 'Users with low vision or colour blindness may struggle to read text that does not stand out clearly from its background.',
    fix: 'A designer and developer need to adjust either the text colour or background colour to meet the required contrast ratio.',
    steps: 'Open the page URL above. Locate the affected elements listed below. Check whether the text is clearly readable against its background.',
  },
  'label': {
    what: 'One or more form fields are missing a label.',
    why: 'When a form field has no label, screen reader users cannot tell what information they are supposed to enter.',
    fix: 'A developer needs to add a visible or hidden label to each affected form field.',
    steps: 'Open the page URL above. Run a screen reader. Tab to each form field and listen for the label announcement.',
  },
  'button-name': {
    what: 'One or more buttons on the page have no readable name.',
    why: 'Screen readers announce the name of a button when a user focuses on it. If a button has no name, the user does not know what it does.',
    fix: 'A developer needs to add a text label or description to each affected button.',
    steps: 'Open the page URL above. Tab to each button. Listen to what the screen reader announces.',
  },
  'link-name': {
    what: 'One or more links on the page have no readable name.',
    why: 'Screen readers read out link names so users know where a link will take them.',
    fix: 'A developer needs to add descriptive text to each affected link.',
    steps: 'Open the page URL above. Tab to each link. Listen to what the screen reader announces.',
  },
};

function getPlainEnglish(ruleId) {
  return PLAIN_ENGLISH[ruleId] || {
    what: `An accessibility issue was detected (rule: ${ruleId}).`,
    why: 'This issue may prevent some users from accessing or understanding content on this page.',
    fix: 'A developer should review this issue. See the help link below for guidance.',
    steps: 'Open the page URL above and review the affected elements listed below.',
  };
}

// -------------------------------------------
// SEVERITY COLOURS FOR HTML REPORT
// -------------------------------------------
const SEVERITY_COLOURS = {
  critical: { bg: '#ffe0e0', border: '#cc0000', badge: '#cc0000', label: 'CRITICAL — Must fix immediately' },
  serious:  { bg: '#fff3e0', border: '#e65100', badge: '#e65100', label: 'SERIOUS — Fix as soon as possible' },
  moderate: { bg: '#fffde0', border: '#f9a825', badge: '#f9a825', label: 'MODERATE — Plan in for fixing' },
  minor:    { bg: '#f1f8e9', border: '#558b2f', badge: '#558b2f', label: 'MINOR — Low priority' },
};

// -------------------------------------------
// HTML REPORT GENERATOR
// -------------------------------------------
function generateHtmlReport(pageDef, browserName, results, screenshotPath, reportPath) {
  const date = new Date().toLocaleString('en-GB');
  const total = results.violations.length;
  const counts = {
    critical: results.violations.filter(v => v.impact === 'critical').length,
    serious:  results.violations.filter(v => v.impact === 'serious').length,
    moderate: results.violations.filter(v => v.impact === 'moderate').length,
    minor:    results.violations.filter(v => v.impact === 'minor').length,
  };

  // Convert screenshot to base64 so it embeds directly in the HTML
  let screenshotBase64 = '';
  if (fs.existsSync(screenshotPath)) {
    screenshotBase64 = fs.readFileSync(screenshotPath).toString('base64');
  }

  // Group violations by severity
  const grouped = { critical: [], serious: [], moderate: [], minor: [] };
  results.violations.forEach(v => {
    if (grouped[v.impact]) grouped[v.impact].push(v);
  });

  // Build bug ticket HTML per violation
  function buildBugTickets(violations) {
    if (violations.length === 0) return '';
    return violations.map((v, i) => {
      const pe = getPlainEnglish(v.id);
      const col = SEVERITY_COLOURS[v.impact];
      const wcag = v.tags.filter(t => t.startsWith('wcag')).join(', ');
      const elements = v.nodes.map((n, ni) => {
        const target = n.target ? n.target.join(' > ') : 'Unknown element';
        return `<li><code>${target}</code></li>`;
      }).join('');

      return `
        <div style="background:${col.bg};border-left:5px solid ${col.border};padding:20px;margin-bottom:20px;border-radius:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <strong style="font-size:16px;">Bug Ticket — ${pe.what}</strong>
            <span style="background:${col.badge};color:white;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:bold;">${v.impact.toUpperCase()}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px;width:160px;font-weight:bold;vertical-align:top;">Title</td><td style="padding:6px;">[${v.impact.toUpperCase()}] ${pe.what} — ${pageDef.name} (${browserName})</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">Priority</td><td style="padding:6px;">${v.impact.charAt(0).toUpperCase() + v.impact.slice(1)}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">Page</td><td style="padding:6px;">${pageDef.name}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">Browser</td><td style="padding:6px;">${browserName}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">URL</td><td style="padding:6px;"><a href="${pageDef.url}" target="_blank">${pageDef.url}</a></td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">WCAG Criteria</td><td style="padding:6px;">${wcag}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">What is it?</td><td style="padding:6px;">${pe.what}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">Why it matters</td><td style="padding:6px;">${pe.why}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">Steps to Reproduce</td><td style="padding:6px;"><ol style="margin:0;padding-left:16px;">${pe.steps.split('. ').filter(s => s).map(s => `<li>${s}</li>`).join('')}</ol></td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">Affected Elements (${v.nodes.length})</td><td style="padding:6px;"><ul style="margin:0;padding-left:16px;">${elements}</ul></td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">How to Fix</td><td style="padding:6px;">${pe.fix}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;vertical-align:top;">More Info</td><td style="padding:6px;"><a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a></td></tr>
          </table>
        </div>`;
    }).join('');
  }

  // Build severity sections
  function buildSection(impact) {
    const col = SEVERITY_COLOURS[impact];
    const violations = grouped[impact];
    if (violations.length === 0) return '';
    return `
      <div style="margin-bottom:32px;">
        <h2 style="color:${col.badge};border-bottom:2px solid ${col.border};padding-bottom:8px;">
          ${col.label} (${violations.length})
        </h2>
        ${buildBugTickets(violations)}
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report — ${pageDef.name} (${browserName})</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 24px; color: #222; }
    h1 { background: #0b3c6e; color: white; padding: 20px; border-radius: 6px; }
    .summary-box { display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap; }
    .summary-card { flex: 1; min-width: 120px; padding: 16px; border-radius: 6px; text-align: center; }
    .screenshot { width: 100%; border: 1px solid #ccc; border-radius: 6px; margin: 24px 0; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    .no-issues { background: #e8f5e9; border-left: 5px solid #2e7d32; padding: 20px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>♿ Accessibility Report — ${pageDef.name} (${browserName})</h1>

  <table style="width:100%;font-size:15px;margin-bottom:24px;">
    <tr><td style="width:140px;font-weight:bold;padding:6px;">Page</td><td>${pageDef.name}</td></tr>
    <tr><td style="font-weight:bold;padding:6px;">URL</td><td><a href="${pageDef.url}" target="_blank">${pageDef.url}</a></td></tr>
    <tr><td style="font-weight:bold;padding:6px;">Browser</td><td>${browserName}</td></tr>
    <tr><td style="font-weight:bold;padding:6px;">Standard</td><td>WCAG 2.2 AA</td></tr>
    <tr><td style="font-weight:bold;padding:6px;">Scanned on</td><td>${date}</td></tr>
    <tr><td style="font-weight:bold;padding:6px;">Total Issues</td><td>${total}</td></tr>
  </table>

  <div class="summary-box">
    <div class="summary-card" style="background:#ffe0e0;border:2px solid #cc0000;">
      <div style="font-size:28px;font-weight:bold;color:#cc0000;">${counts.critical}</div>
      <div style="font-size:13px;font-weight:bold;">Critical</div>
    </div>
    <div class="summary-card" style="background:#fff3e0;border:2px solid #e65100;">
      <div style="font-size:28px;font-weight:bold;color:#e65100;">${counts.serious}</div>
      <div style="font-size:13px;font-weight:bold;">Serious</div>
    </div>
    <div class="summary-card" style="background:#fffde0;border:2px solid #f9a825;">
      <div style="font-size:28px;font-weight:bold;color:#f9a825;">${counts.moderate}</div>
      <div style="font-size:13px;font-weight:bold;">Moderate</div>
    </div>
    <div class="summary-card" style="background:#f1f8e9;border:2px solid #558b2f;">
      <div style="font-size:28px;font-weight:bold;color:#558b2f;">${counts.minor}</div>
      <div style="font-size:13px;font-weight:bold;">Minor</div>
    </div>
  </div>

  <h2>Page Screenshot at Time of Scan</h2>
  ${screenshotBase64 ? `<img class="screenshot" src="data:image/png;base64,${screenshotBase64}" alt="Screenshot of ${pageDef.name}">` : '<p>Screenshot not available.</p>'}

  <h2>Issues Found</h2>
  ${total === 0 ? '<div class="no-issues">✅ No accessibility violations were found on this page.</div>' : ''}
  ${buildSection('critical')}
  ${buildSection('serious')}
  ${buildSection('moderate')}
  ${buildSection('minor')}

  ${results.incomplete.length > 0 ? `
  <h2 style="color:#555;">⚠️ Needs Manual Review (${results.incomplete.length})</h2>
  <p>The following items could not be automatically confirmed. A tester needs to manually check each one.</p>
  ${results.incomplete.map(v => {
    const pe = getPlainEnglish(v.id);
    return `<div style="background:#f5f5f5;border-left:5px solid #999;padding:16px;margin-bottom:16px;border-radius:4px;">
      <strong>${pe.what}</strong><br><br>
      <strong>Why it matters:</strong> ${pe.why}<br><br>
      <strong>What to do:</strong> Manually visit the page and check whether this issue exists.<br><br>
      <strong>More info:</strong> <a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a>
    </div>`;
  }).join('')}` : ''}

  <p style="color:#888;font-size:12px;margin-top:40px;border-top:1px solid #eee;padding-top:16px;">
    Generated by TTC Accessibility Test Suite — WCAG 2.2 AA — ${date}
  </p>
</body>
</html>`;

  fs.writeFileSync(reportPath, html, 'utf8');
}

// -------------------------------------------
// RESULTS FOLDER SETUP
// -------------------------------------------
const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, 'results', today);
const summaryDir = path.join(resultsDir, 'summary');
const jsonDir = path.join(resultsDir, 'json');

[resultsDir, summaryDir, jsonDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const summaryData = [];

test.setTimeout(60000);

test.describe('Accessibility Audit — TTC Alaska Bookings', () => {

  for (const pageDef of PAGES) {
    test(`Scan: ${pageDef.name}`, async ({ page, browserName }) => {

      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Create folder per page per browser
      const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();
      const pageDir = path.join(resultsDir, `${safeName}_${browserName}`);
      if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });

      // Take screenshot
      const screenshotPath = path.join(pageDir, 'screenshot.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Run axe scan
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const counts = {
        critical: results.violations.filter(v => v.impact === 'critical').length,
        serious:  results.violations.filter(v => v.impact === 'serious').length,
        moderate: results.violations.filter(v => v.impact === 'moderate').length,
        minor:    results.violations.filter(v => v.impact === 'minor').length,
      };

      summaryData.push({
        page: pageDef.name,
        url: pageDef.url,
        browser: browserName,
        totalViolations: results.violations.length,
        ...counts,
      });

      // Save HTML report
      const htmlPath = path.join(pageDir, 'report.html');
      generateHtmlReport(pageDef, browserName, results, screenshotPath, htmlPath);

      // Save JSON report
      const jsonPath = path.join(jsonDir, `${safeName}_${browserName}.json`);
      const jsonReport = {
        page: pageDef.name,
        url: pageDef.url,
        browser: browserName,
        scannedAt: new Date().toISOString(),
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
      fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

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
      console.log(`Report   : results/${today}/${safeName}_${browserName}/report.html`);

      if (results.violations.length > 0) {
        console.log('\nVIOLATIONS:');
        results.violations.forEach((v, i) => {
          console.log(`\n  ${i + 1}. [${v.impact.toUpperCase()}] ${v.id}`);
          console.log(`     Description : ${v.description}`);
          console.log(`     WCAG        : ${v.tags.filter(t => t.startsWith('wcag')).join(', ')}`);
          console.log(`     Elements    : ${v.nodes.length} affected`);
        });
      }
    });
  }

  // Combined summary report
  test('Generate combined summary report', async () => {
    const date = new Date().toLocaleString('en-GB');
    const totalViolations = summaryData.reduce((s, r) => s + r.totalViolations, 0);

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
  </style>
</head>
<body>
  <h1>♿ Accessibility Audit — Combined Summary</h1>
  <p><strong>Site:</strong> TTC Alaska Bookings</p>
  <p><strong>Standard:</strong> WCAG 2.2 AA</p>
  <p><strong>Browsers:</strong> Chrome, Firefox, Edge</p>
  <p><strong>Generated:</strong> ${date}</p>
  <p><strong>Total violations found across all pages and browsers:</strong> ${totalViolations}</p>

  <table>
    <thead>
      <tr>
        <th>Page</th>
        <th>Browser</th>
        <th>Total</th>
        <th>Critical</th>
        <th>Serious</th>
        <th>Moderate</th>
        <th>Minor</th>
      </tr>
    </thead>
    <tbody>
      ${summaryData.map(r => `
        <tr>
          <td>${r.page}</td>
          <td>${r.browser}</td>
          <td><strong>${r.totalViolations}</strong></td>
          <td class="critical">${r.critical}</td>
          <td class="serious">${r.serious}</td>
          <td class="moderate">${r.moderate}</td>
          <td class="minor">${r.minor}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  <p style="color:#888;font-size:12px;margin-top:40px;border-top:1px solid #eee;padding-top:16px;">
    Generated by TTC Accessibility Test Suite — ${date}
  </p>
</body>
</html>`;

    const summaryPath = path.join(summaryDir, `summary_${today}.html`);
    fs.writeFileSync(summaryPath, html, 'utf8');
    console.log(`\nCombined summary saved to: results/${today}/summary/summary_${today}.html`);
  });
});