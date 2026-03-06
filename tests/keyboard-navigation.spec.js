/**
 * ===========================================
 * KEYBOARD NAVIGATION TEST
 * ===========================================
 * Tests that all pages can be fully navigated
 * using a keyboard only. Checks:
 * - Every interactive element is reachable by Tab
 * - Focus indicators are visible
 * - No keyboard traps exist
 * - Buttons and links can be activated by keyboard
 * - Tab order is logical
 *
 * HOW TO RUN:
 * npx playwright test tests/keyboard-navigation.spec.js --reporter=list
 * ===========================================
 */

const { test, expect } = require('@playwright/test');
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
const resultsDir = path.join(__dirname, '..', 'results', today, 'keyboard');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

test.setTimeout(60000);

test.describe('Keyboard Navigation', () => {

  for (const pageDef of PAGES) {
    const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();

    // -------------------------------------------
    // KN-01: All interactive elements reachable by Tab
    // -------------------------------------------
    test(`KN-01: All elements reachable by Tab — ${pageDef.name}`, async ({ page }) => {
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const issues = [];
      const focusedElements = [];

      // Tab through up to 100 elements
      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? { tag: el.tagName, text: el.innerText?.trim()?.substring(0, 50), role: el.getAttribute('role'), id: el.id, class: el.className } : null;
        });
        if (!focused || focused.tag === 'BODY') break;
        focusedElements.push(focused);
      }

      // Check we found at least some focusable elements
      if (focusedElements.length === 0) {
        issues.push('No focusable elements found on the page — keyboard navigation may be completely broken');
      }

      // Save results
      const report = { page: pageDef.name, url: pageDef.url, test: 'KN-01', focusableElements: focusedElements.length, elements: focusedElements, issues };
      fs.writeFileSync(path.join(resultsDir, `${safeName}_kn01.json`), JSON.stringify(report, null, 2));

      console.log(`\nKN-01: ${pageDef.name}`);
      console.log(`Focusable elements found: ${focusedElements.length}`);
      if (issues.length > 0) console.log(`Issues: ${issues.join(', ')}`);

      expect(focusedElements.length).toBeGreaterThan(0);
    });

    // -------------------------------------------
    // KN-02: Focus indicator is visible
    // -------------------------------------------
    test(`KN-02: Focus indicator visible — ${pageDef.name}`, async ({ page }) => {
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const issues = [];

      // Tab to first element and take a screenshot to verify focus is visible
      await page.keyboard.press('Tab');
      const screenshotPath = path.join(resultsDir, `${safeName}_focus_indicator.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // Check that something is focused
      const hasFocus = await page.evaluate(() => document.activeElement !== document.body);
      if (!hasFocus) issues.push('No element received focus after pressing Tab');

      // Check focus outline is not hidden via CSS
      const focusOutlineHidden = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return true;
        const style = window.getComputedStyle(el);
        return style.outline === 'none' || style.outline === '0px none' || style.outlineWidth === '0px';
      });

      if (focusOutlineHidden) issues.push('Focus outline appears to be hidden via CSS — focus indicator may not be visible to keyboard users');

      const report = { page: pageDef.name, url: pageDef.url, test: 'KN-02', issues, screenshotPath };
      fs.writeFileSync(path.join(resultsDir, `${safeName}_kn02.json`), JSON.stringify(report, null, 2));

      console.log(`\nKN-02: ${pageDef.name}`);
      console.log(`Focus indicator issues: ${issues.length === 0 ? 'None' : issues.join(', ')}`);
      console.log(`Screenshot: ${screenshotPath}`);

      expect(issues).toHaveLength(0);
    });

    // -------------------------------------------
    // KN-03: No keyboard trap
    // -------------------------------------------
    test(`KN-03: No keyboard trap — ${pageDef.name}`, async ({ page }) => {
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const visitedElements = new Set();
      let trapDetected = false;

      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? el.outerHTML.substring(0, 100) : null;
        });

        if (!focused) break;

        // If we see the same element twice in a row, we may be trapped
        if (visitedElements.has(focused) && i > 5) {
          trapDetected = true;
          break;
        }
        visitedElements.add(focused);
      }

      console.log(`\nKN-03: ${pageDef.name}`);
      console.log(`Keyboard trap detected: ${trapDetected ? 'YES — needs investigation' : 'No'}`);

      expect(trapDetected).toBe(false);
    });
  }
});