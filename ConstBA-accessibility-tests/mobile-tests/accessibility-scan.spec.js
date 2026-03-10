/**
 * ===========================================
 * ACCESSIBILITY SCAN TEST — ConstBA MOBILE
 * ===========================================
 * Runs axe-core accessibility scans against all pages
 * in the Construction Booking site on emulated mobile devices:
 *   - iPhone 15 Pro  (WebKit / iOS Safari · 393×659)
 *   - Galaxy S24     (Chromium / Android Chrome · 360×780)
 *   - Pixel 7        (Chromium / Android Chrome · 412×839)
 *
 * Mobile-specific adaptations vs browser spec:
 *   - Checkboxes: page.evaluate() native click (touch events don't toggle reliably)
 *   - Stripe CVC: explicit cvcInput.click() before typing (no auto-advance on WebKit)
 *   - Global timeout: 120 000 ms (WebKit is slower than Chromium)
 *
 * HOW TO RUN:
 * All devices:  npx playwright test --config=constba-mobile.config.js
 * One device:   npx playwright test --config=constba-mobile.config.js --project="iPhone 15 Pro"
 * ===========================================
 */

require('dotenv').config();
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const { getPreviousCounts, recordRun, isRegression } = require('../../utils/trend-tracker');
const TREND_HISTORY = path.join(__dirname, '..', '..', 'constba-trend-history.json');
const { getOtp } = require('../../utils/testmail');

const BASE = 'https://ttc-eun-qat-corporatebookings.azurewebsites.net';

// ── Shared payment setup helper ──────────────────────────────────────────────
// Runs the full OTP verification + job title + address + dual checkboxes flow
// and lands on the Stripe card entry page. Re-used by all payment-dependent pages.

async function setupPayment(page) {
  await page.locator('button:has-text("Add to basket")').first().click();
  await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
  await page.waitForTimeout(500);

  await page.goto(`${BASE}/construction/details-and-payment`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const testEmail = `${process.env.TESTMAIL_NAMESPACE}.${process.env.TESTMAIL_TAG}@inbox.testmail.app`;
  await page.locator('input[type="radio"]').first().click({ force: true });
  await page.locator('input[placeholder*="First name"]').fill('Test');
  await page.locator('input[placeholder*="Surname"]').fill('User');
  await page.locator('input[placeholder*="Contact email"]').fill(testEmail);

  const before = Date.now();
  await page.locator('button:has-text("Verify Email address")').click();
  await page.waitForSelector('input[class*="_otpInput_"]', { state: 'visible' });
  const otp = await getOtp({
    apiKey:    process.env.TESTMAIL_API_KEY,
    namespace: process.env.TESTMAIL_NAMESPACE,
    tag:       process.env.TESTMAIL_TAG,
    after:     before,
  });
  const otpBoxes = page.locator('input[class*="_otpInput_"]');
  for (let i = 0; i < otp.length; i++) {
    await otpBoxes.nth(i).fill(otp[i]);
  }
  await page.locator('button:has-text("Verify")').last().click();
  await page.waitForTimeout(2000);

  // Job title — custom dropdown (ConstBA-specific required field)
  const jobTitleInput = page.getByRole('textbox', { name: /job title/i });
  if (await jobTitleInput.count() > 0) {
    const jobTitleBtn = page.locator('button').filter({ has: jobTitleInput });
    if (await jobTitleBtn.count() > 0) {
      await jobTitleBtn.click();
    } else {
      await jobTitleInput.click();
    }
    await page.waitForTimeout(400);
    try {
      await page.locator('[role="option"]').first().click({ timeout: 2000 });
    } catch {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(500);
  }

  await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
  await page.locator('input[placeholder*="Town/City"]').fill('London');
  await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
  await page.waitForTimeout(500);

  // Terms checkbox — native DOM click bypasses mobile touch event issues
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('[class*="_termsAndConditions_"] input[type="checkbox"]');
    if (checkboxes[0]) checkboxes[0].click();
  });
  await page.waitForTimeout(300);

  // Suitability checkbox (second required checkbox in ConstBA)
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('[class*="_termsAndConditions_"] input[type="checkbox"]');
    if (checkboxes[1]) checkboxes[1].click();
  });
  await page.waitForTimeout(500);

  const payBtn = page.locator('button:has-text("Pay now by card")');
  await payBtn.scrollIntoViewIfNeeded();
  await payBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

// ── Stripe card fill helper ───────────────────────────────────────────────────
// Explicit CVC click required — Stripe auto-advance is unreliable on WebKit/mobile.

async function fillStripeCard(page) {
  await page.waitForTimeout(5000);
  const cardInput   = page.frameLocator('iframe[title="Secure card number input frame"]').locator('input:not([disabled])').first();
  const expiryInput = page.frameLocator('iframe[title="Secure expiration date input frame"]').locator('input:not([disabled])').first();
  const cvcInput    = page.frameLocator('iframe[title="Secure CVC input frame"]').locator('input:not([disabled])').first();

  await cardInput.waitFor({ state: 'visible', timeout: 30000 });
  await cardInput.fill('4242424242424242');
  await expiryInput.click();
  await page.keyboard.type('1229', { delay: 100 });
  await cvcInput.click();
  await page.keyboard.type('123', { delay: 100 });
  await page.waitForTimeout(1000);
}

// ── Pages ─────────────────────────────────────────────────────────────────────

const PAGES = [
  {
    name: 'Construction Page',
    url: `${BASE}/construction`,
  },
  {
    name: 'Info Page',
    url: `${BASE}/construction`,
    setup: async (page) => {
      await page.locator('button[class*="_info_"]').first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'My Basket Modal',
    url: `${BASE}/construction`,
    timeout: 120000,
    scanScope: '[role="dialog"]',
    setup: async (page) => {
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);
      await page.locator('div[class*="_cart_"]').first().click();
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        const style = window.getComputedStyle(dialog);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
    },
  },
  {
    name: 'Sign In Modal',
    url: `${BASE}/construction`,
    scanScope: '[role="dialog"]',
    setup: async (page) => {
      await page.locator('button:has-text("Sign in")').click();
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        const style = window.getComputedStyle(dialog);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      await page.waitForTimeout(500);
    },
  },
  {
    name: 'Details and Payment',
    url: `${BASE}/construction/details-and-payment`,
  },
  {
    name: 'Details and Payment - Pay',
    url: `${BASE}/construction/details-and-payment/pay`,
  },
  {
    name: 'Details and Payment - Verified',
    url: `${BASE}/construction`,
    timeout: 120000,
    setup: async (page) => {
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      await page.goto(`${BASE}/construction/details-and-payment`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const testEmail = `${process.env.TESTMAIL_NAMESPACE}.${process.env.TESTMAIL_TAG}@inbox.testmail.app`;
      await page.locator('input[type="radio"]').first().click({ force: true });
      await page.locator('input[placeholder*="First name"]').fill('Test');
      await page.locator('input[placeholder*="Surname"]').fill('User');
      await page.locator('input[placeholder*="Contact email"]').fill(testEmail);

      const before = Date.now();
      await page.locator('button:has-text("Verify Email address")').click();
      await page.waitForSelector('input[class*="_otpInput_"]', { state: 'visible' });
      const otp = await getOtp({
        apiKey:    process.env.TESTMAIL_API_KEY,
        namespace: process.env.TESTMAIL_NAMESPACE,
        tag:       process.env.TESTMAIL_TAG,
        after:     before,
      });
      const otpBoxes = page.locator('input[class*="_otpInput_"]');
      for (let i = 0; i < otp.length; i++) {
        await otpBoxes.nth(i).fill(otp[i]);
      }
      await page.locator('button:has-text("Verify")').last().click();
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'Pay by Card',
    url: `${BASE}/construction`,
    timeout: 180000,
    setup: async (page) => {
      await setupPayment(page);
      // Scan runs here on the card entry form — no Stripe fill needed
    },
  },
  {
    name: 'Booking Confirmation',
    url: `${BASE}/construction`,
    timeout: 240000,
    setup: async (page) => {
      await setupPayment(page);
      await fillStripeCard(page);
      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'Add Attendees',
    url: `${BASE}/construction`,
    timeout: 300000,
    setup: async (page) => {
      await setupPayment(page);
      await fillStripeCard(page);
      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.locator('button:has-text("Add attendees"), a:has-text("Add attendees")').first().click();
      await page.waitForURL('**/manage-delegates/**', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'Add Attendee - Edit Form',
    url: `${BASE}/construction`,
    timeout: 360000,
    setup: async (page) => {
      await setupPayment(page);
      await fillStripeCard(page);
      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.locator('button:has-text("Add attendees"), a:has-text("Add attendees")').first().click();
      await page.waitForURL('**/manage-delegates/**', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const pencilBtn = page.locator('svg[role="button"][class*="_iconButton_"]:not([class*="_logo_"]):not([aria-haspopup])').first();
      await pencilBtn.waitFor({ state: 'visible', timeout: 10000 });
      await pencilBtn.click();
      await page.waitForTimeout(2000);

      await page.waitForSelector('h1:has-text("Edit attendee")', { state: 'visible', timeout: 15000 });
    },
  },
  // ── User menu pages (only reachable after a full payment) ─────────────────
  {
    name: 'View Booked Courses',
    url: `${BASE}/construction`,
    timeout: 300000,
    setup: async (page) => {
      await setupPayment(page);
      await fillStripeCard(page);
      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.locator('[aria-haspopup="true"]').click();
      await page.waitForSelector('[role="menu"]', { state: 'visible' });
      await page.locator('[data-key="viewBookedCourses"]').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'User Profile',
    url: `${BASE}/construction`,
    timeout: 300000,
    setup: async (page) => {
      await setupPayment(page);
      await fillStripeCard(page);
      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.locator('[aria-haspopup="true"]').click();
      await page.waitForSelector('[role="menu"]', { state: 'visible' });
      await page.locator('[data-key="userProfile"]').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'Sign Out Page',
    url: `${BASE}/construction`,
    timeout: 300000,
    setup: async (page) => {
      await setupPayment(page);
      await fillStripeCard(page);
      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.locator('[aria-haspopup="true"]').click();
      await page.waitForSelector('[role="menu"]', { state: 'visible' });
      await page.locator('[data-key="signOut"]').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
];

// ── Results folder ────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const resultsDir     = path.join(__dirname, '..', 'ConstBA-results', today, 'mobile');
const screenshotsDir = path.join(resultsDir, 'screenshots');
const jsonDir        = path.join(resultsDir, 'json');

[resultsDir, screenshotsDir, jsonDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test.setTimeout(120000);

test.describe('Accessibility Scan — ConstBA Mobile', () => {

  for (const pageDef of PAGES) {
    test(`Scan: ${pageDef.name}`, async ({ page }, testInfo) => {
      const projectName = testInfo.project.name;

      if (pageDef.timeout) test.setTimeout(pageDef.timeout);

      await page.context().clearCookies();
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });

      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      if (pageDef.setup) {
        await pageDef.setup(page);
        await page.waitForTimeout(1000);
      }

      const actualUrl = page.url();

      const safeName    = pageDef.name.replace(/\s+/g, '_').toLowerCase();
      const safeProject = projectName.replace(/\s+/g, '_');
      const screenshotFile = `${safeName}_${safeProject}.png`;
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
              const shotFile = `${safeName}_${safeProject}_${violation.id}_${i}.png`;
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

      const jsonPath = path.join(jsonDir, `${safeName}_${safeProject}.json`);
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
      console.log(`PAGE   : ${pageDef.name}`);
      console.log(`DEVICE : ${projectName}`);
      console.log(`========================================`);
      console.log(`Total    : ${counts.total}`);
      console.log(`Critical : ${counts.critical}`);
      console.log(`Serious  : ${counts.serious}`);
      console.log(`Moderate : ${counts.moderate}`);
      console.log(`Minor    : ${counts.minor}`);
    });
  }

});
// Report generation is handled separately — run constba-global-teardown.js manually
// or extend constba-mobile.config.js with a globalTeardown if needed.
