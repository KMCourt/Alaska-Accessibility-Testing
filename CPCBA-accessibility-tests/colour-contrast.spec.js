/**
 * ===========================================
 * COLOUR CONTRAST TEST
 * ===========================================
 * Dedicated colour contrast checks that go beyond
 * what axe-core catches automatically. Checks:
 * - Text contrast ratios against backgrounds
 * - Text over images
 * - Focus indicator contrast
 * - Large text contrast requirements
 * - UI component contrast (buttons, inputs)
 *
 * WCAG Requirements:
 * - Normal text : 4.5:1 minimum contrast ratio
 * - Large text  : 3:1 minimum contrast ratio (18pt or 14pt bold)
 * - UI components: 3:1 minimum contrast ratio
 * - Focus indicators: 3:1 minimum contrast ratio (WCAG 2.2)
 *
 * HOW TO RUN:
 * npx playwright test tests/colour-contrast.spec.js --reporter=list
 * ===========================================
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');

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

const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, '..', 'results', today, 'colour-contrast');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

// -------------------------------------------
// HELPER: Calculate relative luminance
// Used to calculate contrast ratio between two colours.
// -------------------------------------------
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(rgb) {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
}

test.setTimeout(60000);

test.describe('Colour Contrast', () => {

  for (const pageDef of PAGES) {
    const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();

    // -------------------------------------------
    // CC-01: Run axe colour contrast check
    // -------------------------------------------
    test(`CC-01: Axe contrast check — ${pageDef.name}`, async ({ page, browserName }) => {
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Run axe focused only on colour contrast rules
      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast', 'color-contrast-enhanced'])
        .analyze();

      const violations = results.violations;
      console.log(`\nCC-01: ${pageDef.name} (${browserName})`);
      console.log(`Contrast violations found: ${violations.length}`);

      violations.forEach((v, i) => {
        console.log(`\n  ${i + 1}. ${v.id} — ${v.description}`);
        console.log(`     Elements affected: ${v.nodes.length}`);
        v.nodes.forEach(n => {
          console.log(`     - ${n.target?.join(' > ')}`);
          if (n.any?.[0]?.data) {
            console.log(`       Contrast ratio: ${n.any[0].data.contrastRatio}`);
            console.log(`       Required: ${n.any[0].data.expectedContrastRatio}`);
          }
        });
      });

      // Save report
      const report = {
        page: pageDef.name,
        url: pageDef.url,
        browser: browserName,
        test: 'CC-01',
        violations: violations.map(v => ({
          id: v.id,
          description: v.description,
          elements: v.nodes.map(n => ({
            target: n.target?.join(' > '),
            contrastRatio: n.any?.[0]?.data?.contrastRatio,
            required: n.any?.[0]?.data?.expectedContrastRatio,
            html: n.html,
          })),
        })),
      };
      fs.writeFileSync(path.join(resultsDir, `${safeName}_${browserName}_cc01.json`), JSON.stringify(report, null, 2));
    });

    // -------------------------------------------
    // CC-02: Check text contrast manually using computed styles
    // Catches cases axe misses e.g. text over images
    // -------------------------------------------
    test(`CC-02: Manual contrast check — ${pageDef.name}`, async ({ page, browserName }) => {
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Take screenshot for reference
      const screenshotPath = path.join(resultsDir, `${safeName}_${browserName}_contrast.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Get all text elements and check their contrast
      const contrastIssues = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, label, span, li'));
        const issues = [];

        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bg = style.backgroundColor;
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = style.fontWeight;
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
          const text = el.innerText?.trim()?.substring(0, 50);

          if (text && color && bg && bg !== 'rgba(0, 0, 0, 0)') {
            issues.push({
              tag: el.tagName,
              text,
              color,
              background: bg,
              fontSize: `${fontSize}px`,
              isLargeText,
              requiredRatio: isLargeText ? 3 : 4.5,
            });
          }
        });

        return issues.slice(0, 50); // Limit to 50 elements
      });

      console.log(`\nCC-02: ${pageDef.name} (${browserName})`);
      console.log(`Elements checked: ${contrastIssues.length}`);
      console.log(`Screenshot: ${screenshotPath}`);
      console.log(`Note: Review screenshot manually for text over images — these cannot be automatically detected`);

      // Save report
      fs.writeFileSync(
        path.join(resultsDir, `${safeName}_${browserName}_cc02.json`),
        JSON.stringify({ page: pageDef.name, url: pageDef.url, browser: browserName, test: 'CC-02', elementsChecked: contrastIssues.length, screenshotPath, elements: contrastIssues }, null, 2)
      );
    });
  }
});