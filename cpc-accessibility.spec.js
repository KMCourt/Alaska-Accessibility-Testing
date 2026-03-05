/**
 * ===========================================
 * CPC ACCESSIBILITY TEST SUITE
 * ===========================================
 *
 * PURPOSE:
 * This file runs automated accessibility scans against the pages listed
 * in the PAGES array below. It uses Playwright (browser automation) and
 * axe-core (accessibility engine) to detect violations.
 *
 * WHAT IS BEING CHECKED:
 *
 * 1. WCAG 2.0 Level A (wcag2a)
 *    The most fundamental accessibility rules. Failures here make a page
 *    completely unusable for some users. Checks include:
 *    - Images have alt text
 *    - Pages have a title
 *    - Form inputs have labels
 *    - Content does not rely on colour alone to convey meaning
 *    - No keyboard traps (users can navigate away from any element)
 *
 * 2. WCAG 2.0 Level AA (wcag2aa)
 *    The standard most organisations are legally required to meet. Checks include:
 *    - Colour contrast ratio is sufficient between text and background
 *    - Text can be resized up to 200% without breaking the page
 *    - Navigation is consistent across pages
 *    - Error messages are descriptive and identify which field has the issue
 *
 * 3. WCAG 2.1 Level AA (wcag21aa)
 *    An updated standard that adds rules for mobile and modern web. Checks include:
 *    - Touch targets are large enough to tap
 *    - Content does not require horizontal scrolling on mobile
 *    - No content that flashes more than 3 times per second (seizure risk)
 *    - Purpose of inputs like name, email, phone is programmatically identified
 *
 * 4. WCAG 2.2 Level AA (wcag22aa) — CURRENT LATEST STANDARD (published October 2023)
 *    Builds on 2.1 with additional criteria focused on focus indicators, mobile,
 *    and form usability. Checks include:
 *    - Focus indicators meet minimum size and contrast requirements
 *    - Draggable functionality can also be operated by keyboard
 *    - Users are warned before being timed out of a form or session
 *    - Consistent helper text and labels are provided across similar components
 *
 * VIOLATION SEVERITY LEVELS:
 *    - Critical : Completely blocks access for some users
 *    - Serious  : Significantly impairs access
 *    - Moderate : Causes difficulty but user can work around it
 *    - Minor    : Small issue with limited impact
 *
 * INCOMPLETE / NEEDS MANUAL REVIEW:
 *    Some checks axe cannot determine automatically. These are saved separately
 *    in the results file and need a human to review.
 *
 * RESULTS OUTPUT:
 *    After each page scan two files are saved to the results/ folder:
 *    1. A JSON file with the full technical detail
 *    2. A plain English .txt report for non-technical team members
 *
 * HOW TO ADD A NEW PAGE TO SCAN:
 *    Add a new entry to the PAGES array below, like this:
 *    { name: 'My New Page', url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/new-page' }
 *
 * HOW TO RUN:
 *    npx playwright test cpc-accessibility.spec.js --reporter=list
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
// Maps each axe rule ID to a plain English explanation of what the
// issue is, why it matters, and what needs to be done to fix it.
// This is used to generate the non-technical report.
// -------------------------------------------
const PLAIN_ENGLISH = {
  'html-has-lang': {
    what: 'The page is missing a language setting.',
    why: 'Screen readers use the language setting to know how to read the page out loud. Without it, the content may be read in the wrong language or accent, making it very difficult to understand for visually impaired users.',
    fix: 'A developer needs to add a language attribute to the top of the page code. This is a very quick, one-line change.',
  },
  'image-alt': {
    what: 'One or more images on the page have no description.',
    why: 'Users who are blind or visually impaired use screen readers that read out descriptions of images. If an image has no description, the screen reader has nothing to say, so the user misses that content entirely.',
    fix: 'A developer needs to add a short text description to each affected image explaining what it shows. For decorative images that add no meaning, they should be marked as decorative so screen readers skip them.',
  },
  'meta-viewport': {
    what: 'The page is preventing users from zooming in on mobile devices.',
    why: 'Many users with low vision need to pinch and zoom on their phone to read text clearly. This page has a setting that blocks that ability, making it inaccessible on mobile for those users.',
    fix: 'A developer needs to remove the zoom restriction from the page settings. This is a very quick, one-line change.',
  },
  'nested-interactive': {
    what: 'Some clickable elements on the page are incorrectly placed inside other clickable elements.',
    why: 'When a button or link is placed inside another button or link, keyboard users and screen reader users can get confused or stuck. The assistive technology may not know which element to activate, or may skip one entirely.',
    fix: 'A developer needs to review the affected elements and restructure them so no interactive element is placed inside another. This may take more time depending on how many components are affected.',
  },
  'color-contrast': {
    what: 'Some text on the page does not have enough contrast against its background colour.',
    why: 'Users with low vision or colour blindness may struggle to read text that does not stand out clearly from its background. Good contrast makes text readable for everyone.',
    fix: 'A designer and developer need to review the affected text and adjust either the text colour or background colour to meet the required contrast ratio.',
  },
  'label': {
    what: 'One or more form fields are missing a label.',
    why: 'When a form field has no label, screen reader users cannot tell what information they are supposed to enter. For example, a text box with no label is announced as just "text box" with no context.',
    fix: 'A developer needs to add a visible or hidden label to each affected form field describing what the user should enter.',
  },
  'button-name': {
    what: 'One or more buttons on the page have no readable name.',
    why: 'Screen readers announce the name of a button when a user focuses on it. If a button has no name, the user hears nothing and does not know what the button does.',
    fix: 'A developer needs to add a text label or description to each affected button.',
  },
  'link-name': {
    what: 'One or more links on the page have no readable name.',
    why: 'Screen readers read out link names so users know where a link will take them. A link with no name is announced as just "link" with no context, which is not helpful.',
    fix: 'A developer needs to add descriptive text to each affected link.',
  },
};

// -------------------------------------------
// HELPER: GET PLAIN ENGLISH CONTENT FOR A RULE
// Falls back to a generic message if the rule is not in our list above.
// -------------------------------------------
function getPlainEnglish(ruleId) {
  return PLAIN_ENGLISH[ruleId] || {
    what: `An accessibility issue was detected (rule: ${ruleId}).`,
    why: 'This issue may prevent some users from accessing or understanding content on this page.',
    fix: 'A developer should review this issue and address it. See the help link in the technical report for guidance.',
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
// Produces a .txt file written in plain English for non-technical readers.
// -------------------------------------------
function generatePlainEnglishReport(pageDef, results, filePath) {
  const lines = [];
  const date = new Date().toLocaleString('en-GB');

  lines.push(`ACCESSIBILITY REPORT`);
  lines.push(`====================`);
  lines.push(`Page         : ${pageDef.name}`);
  lines.push(`URL          : ${pageDef.url}`);
  lines.push(`Scanned on   : ${date}`);
  lines.push(`====================`);
  lines.push(``);

  // Summary
  const total = results.violations.length;
  const critical = results.violations.filter(v => v.impact === 'critical').length;
  const serious  = results.violations.filter(v => v.impact === 'serious').length;
  const moderate = results.violations.filter(v => v.impact === 'moderate').length;
  const minor    = results.violations.filter(v => v.impact === 'minor').length;

  lines.push(`SUMMARY`);
  lines.push(`-------`);
  if (total === 0) {
    lines.push(`No accessibility failures were found on this page.`);
  } else {
    lines.push(`This page has ${total} accessibility issue(s) that need attention:`);
    lines.push(``);
    lines.push(`  Critical : ${critical}  (must fix immediately)`);
    lines.push(`  Serious  : ${serious}  (fix as soon as possible)`);
    lines.push(`  Moderate : ${moderate}  (plan in for fixing)`);
    lines.push(`  Minor    : ${minor}  (low priority)`);
  }
  lines.push(``);

  // Failures
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
      lines.push(`Why does it  `);
      lines.push(`matter?      : ${pe.why}`);
      lines.push(`How to fix   : ${pe.fix}`);
      lines.push(`Elements     : ${v.nodes.length} element(s) on the page are affected.`);
      lines.push(`Affected     :`);
      v.nodes.forEach((n, ni) => {
        // Use the target selector if available, otherwise fall back to the HTML tag
        const target = n.target ? n.target.join(' > ') : 'Unknown element';
        lines.push(`  ${ni + 1}. ${target}`);
      });
      lines.push(`More info    : ${v.helpUrl}`);
      lines.push(``);
      lines.push(`- - - - - - - - - - - - - - - - - - -`);
      lines.push(``);
    });
  }

  // Manual review items
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
      lines.push(`Why does it  `);
      lines.push(`matter?      : ${pe.why}`);
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
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// -------------------------------------------
// TIMEOUT SETTING
// Increased to 60 seconds to handle pages with third party scripts
// such as Stripe payment forms that keep network connections open.
// -------------------------------------------
test.setTimeout(60000);

test.describe('Accessibility Audit', () => {

  for (const pageDef of PAGES) {
    test(`Scan: ${pageDef.name}`, async ({ page }) => {

      // Navigate to the page and wait for the DOM to be ready.
      // We use 'domcontentloaded' instead of 'networkidle' because payment
      // pages with third party scripts (e.g. Stripe) keep network connections
      // open indefinitely, which causes 'networkidle' to time out.
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });

      // Give the JavaScript framework extra time to finish rendering the UI
      await page.waitForTimeout(3000);

      // Run the axe accessibility scan against WCAG 2.0 A, 2.0 AA, 2.1 AA and 2.2 AA
      // WCAG 2.2 AA is the current latest standard as of October 2023
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();

      // Save technical JSON report
      const jsonReport = {
        page: pageDef.name,
        url: pageDef.url,
        scannedAt: new Date().toISOString(),
        summary: {
          totalViolations: results.violations.length,
          byCriticality: {
            critical: results.violations.filter(v => v.impact === 'critical').length,
            serious:  results.violations.filter(v => v.impact === 'serious').length,
            moderate: results.violations.filter(v => v.impact === 'moderate').length,
            minor:    results.violations.filter(v => v.impact === 'minor').length,
          },
        },
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
          affectedElements: v.nodes.map(n => ({
            html: n.html,
            target: n.target,
          })),
        })),
      };

      const jsonPath = path.join(resultsDir, `${safeName}_${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

      // Save plain English report for non-technical team members
      const txtPath = path.join(resultsDir, `${safeName}_${timestamp}_report.txt`);
      generatePlainEnglishReport(pageDef, results, txtPath);

      // Print summary to terminal
      console.log(`\n========================================`);
      console.log(`PAGE: ${pageDef.name}`);
      console.log(`URL: ${pageDef.url}`);
      console.log(`========================================`);
      console.log(`Total Violations : ${results.violations.length}`);
      console.log(`  Critical : ${results.violations.filter(v => v.impact === 'critical').length}`);
      console.log(`  Serious  : ${results.violations.filter(v => v.impact === 'serious').length}`);
      console.log(`  Moderate : ${results.violations.filter(v => v.impact === 'moderate').length}`);
      console.log(`  Minor    : ${results.violations.filter(v => v.impact === 'minor').length}`);
      console.log(`\nTechnical report : results/${safeName}_${timestamp}.json`);
      console.log(`Plain English    : results/${safeName}_${timestamp}_report.txt`);
    });
  }
});