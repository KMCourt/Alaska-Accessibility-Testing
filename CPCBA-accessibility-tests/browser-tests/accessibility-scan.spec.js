/**
 * ===========================================
 * ACCESSIBILITY SCAN TEST — BROWSER
 * ===========================================
 * Runs axe-core accessibility scans against all pages
 * in Chrome, Firefox and Edge.
 *
 * Generates ONE consolidated HTML report at:
 *   cpc-results/YYYY-MM-DD/report.html
 *
 * The report contains every page, every browser,
 * every violation, and a copy-ready bug ticket
 * for each issue — all in one place.
 *
 * HOW TO RUN:
 * All browsers:   npx playwright test CPCBA-accessibility-tests/browser-tests/
 * One browser:    npx playwright test CPCBA-accessibility-tests/browser-tests/ --project=chromium
 * ===========================================
 */

require('dotenv').config();
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const { getPreviousCounts, recordRun, isRegression } = require('../../utils/trend-tracker');
const { getOtp } = require('../../utils/testmail');

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
  {
    name: 'Sign In Modal',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    scanScope: '[role="dialog"]',
    setup: async (page) => {
      // Click the "Sign in" button in the header to open the sign-in modal
      await page.locator('button:has-text("Sign in")').click();
      // Wait for the modal to become visible
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
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment',
  },
  {
    name: 'Details and Payment - Pay',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment/pay',
  },
  {
    name: 'Details and Payment - Verified',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 120000,
    setup: async (page) => {
      // The form only appears once basket has items — add one first
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      // Navigate to the details and payment page
      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const testEmail = `${process.env.TESTMAIL_NAMESPACE}.${process.env.TESTMAIL_TAG}@inbox.testmail.app`;

      // Fill in the form with dummy test data
      // Select "Individual" customer type (required field)
      await page.locator('input[type="radio"]').first().click({ force: true });
      await page.locator('input[placeholder*="First name"]').fill('Test');
      await page.locator('input[placeholder*="Surname"]').fill('User');
      await page.locator('input[placeholder*="Contact email"]').fill(testEmail);

      // Record time before requesting OTP so we only pick up the fresh email
      const before = Date.now();

      // Request the OTP
      await page.locator('button:has-text("Verify Email address")').click();

      // Wait for the OTP input boxes to appear
      await page.waitForSelector('input[class*="_otpInput_"]', { state: 'visible' });

      // Fetch the OTP from the testmail inbox
      const otp = await getOtp({
        apiKey:    process.env.TESTMAIL_API_KEY,
        namespace: process.env.TESTMAIL_NAMESPACE,
        tag:       process.env.TESTMAIL_TAG,
        after:     before,
      });

      // Type each digit into its individual OTP input box
      const otpBoxes = page.locator('input[class*="_otpInput_"]');
      for (let i = 0; i < otp.length; i++) {
        await otpBoxes.nth(i).fill(otp[i]);
      }

      // Submit the OTP
      await page.locator('button:has-text("Verify")').last().click();
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'Pay by Card',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 180000,
    setup: async (page) => {
      // Step 1: Add to basket
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      // Step 2: Navigate to details and payment
      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Step 3: Fill in the form
      const testEmail = `${process.env.TESTMAIL_NAMESPACE}.${process.env.TESTMAIL_TAG}@inbox.testmail.app`;
      await page.locator('input[type="radio"]').first().click({ force: true });
      await page.locator('input[placeholder*="First name"]').fill('Test');
      await page.locator('input[placeholder*="Surname"]').fill('User');
      await page.locator('input[placeholder*="Contact email"]').fill(testEmail);

      // Step 4: Request and complete OTP
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

      // Step 5: Fill billing address (required before payment)
      await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
      await page.locator('input[placeholder*="Town/City"]').fill('London');
      await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
      await page.waitForTimeout(500);

      // Step 6: Accept terms and navigate to Pay by Card page
      await page.locator('div[class*="_termsAndConditions_"] label[class*="_checkbox_"]').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Pay now by card")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      // Scan runs here on the card entry form
    },
  },
  {
    name: 'Booking Confirmation',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 240000,
    setup: async (page) => {
      // Step 1: Add to basket
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      // Step 2: Navigate to details and payment
      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Step 3: Fill in the form
      const testEmail = `${process.env.TESTMAIL_NAMESPACE}.${process.env.TESTMAIL_TAG}@inbox.testmail.app`;
      await page.locator('input[type="radio"]').first().click({ force: true });
      await page.locator('input[placeholder*="First name"]').fill('Test');
      await page.locator('input[placeholder*="Surname"]').fill('User');
      await page.locator('input[placeholder*="Contact email"]').fill(testEmail);

      // Step 4: Request and complete OTP
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

      // Step 5: Fill billing address
      await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
      await page.locator('input[placeholder*="Town/City"]').fill('London');
      await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
      await page.waitForTimeout(500);

      // Step 6: Accept terms and go to Pay by Card page
      await page.locator('div[class*="_termsAndConditions_"] label[class*="_checkbox_"]').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Pay now by card")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Step 7: Fill in card details.
      // Stripe iframes identified by stable title attributes.
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

      // Step 8: Submit payment and wait for confirmation page
      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'Add Attendees',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 300000,
    setup: async (page) => {
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
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

      await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
      await page.locator('input[placeholder*="Town/City"]').fill('London');
      await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
      await page.waitForTimeout(500);

      await page.locator('div[class*="_termsAndConditions_"] label[class*="_checkbox_"]').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Pay now by card")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

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
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 360000,
    // No scanScope — the edit panel is not wrapped in [role="dialog"] (that div is a hidden
    // React portal stub). Scanning the full page captures the visible edit form correctly.
    setup: async (page) => {
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
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

      await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
      await page.locator('input[placeholder*="Town/City"]').fill('London');
      await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
      await page.waitForTimeout(500);

      await page.locator('div[class*="_termsAndConditions_"] label[class*="_checkbox_"]').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Pay now by card")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

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

      await page.locator('button:has-text("Pay now")').last().click();
      await page.waitForURL('**/confirmation/**', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.locator('button:has-text("Add attendees"), a:has-text("Add attendees")').first().click();
      await page.waitForURL('**/manage-delegates/**', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Click the edit (pencil) button on the first attendee row.
      const pencilBtn = page.locator('svg[role="button"][class*="_iconButton_"]:not([class*="_logo_"]):not([aria-haspopup])').first();
      await pencilBtn.waitFor({ state: 'visible', timeout: 10000 });
      await pencilBtn.click();
      await page.waitForTimeout(2000);

      await page.waitForSelector('h1:has-text("Edit attendee")', { state: 'visible', timeout: 15000 });
    },
  },
  // -----------------------------------------------
  // USER MENU PAGES (only visible when logged in)
  // -----------------------------------------------
  {
    name: 'View Booked Courses',
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 300000,
    setup: async (page) => {
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
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

      await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
      await page.locator('input[placeholder*="Town/City"]').fill('London');
      await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
      await page.waitForTimeout(500);

      await page.locator('div[class*="_termsAndConditions_"] label[class*="_checkbox_"]').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Pay now by card")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

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
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 300000,
    setup: async (page) => {
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
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

      await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
      await page.locator('input[placeholder*="Town/City"]').fill('London');
      await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
      await page.waitForTimeout(500);

      await page.locator('div[class*="_termsAndConditions_"] label[class*="_checkbox_"]').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Pay now by card")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

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
    url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
    timeout: 300000,
    setup: async (page) => {
      await page.locator('button:has-text("Add to basket")').first().click();
      await page.waitForSelector('div[class*="_badge_"]', { state: 'visible' });
      await page.waitForTimeout(500);

      await page.goto('https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment', { waitUntil: 'domcontentloaded' });
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

      await page.locator('input[placeholder*="Address line 1"]').fill('123 Test Street');
      await page.locator('input[placeholder*="Town/City"]').fill('London');
      await page.locator('input[placeholder*="Postcode"]').fill('E1 1AA');
      await page.waitForTimeout(500);

      await page.locator('div[class*="_termsAndConditions_"] label[class*="_checkbox_"]').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Pay now by card")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

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

// -------------------------------------------
// RESULTS FOLDER SETUP
// -------------------------------------------
const today = new Date().toISOString().split('T')[0];
const resultsDir = path.join(__dirname, '..', 'cpc-results', today, 'browser');
const screenshotsDir = path.join(resultsDir, 'screenshots');
const jsonDir = path.join(resultsDir, 'json');

[resultsDir, screenshotsDir, jsonDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});


test.setTimeout(60000);

test.describe('Accessibility Scan', () => {

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

      const safeName = pageDef.name.replace(/\s+/g, '_').toLowerCase();
      const screenshotFile = `${safeName}_${projectName}.png`;
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
              const shotFile = `${safeName}_${projectName}_${violation.id}_${i}.png`;
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

      const previousCounts = getPreviousCounts(pageDef.name, projectName);
      recordRun({ page: pageDef.name, browser: projectName, counts });

      const jsonPath = path.join(jsonDir, `${safeName}_${projectName}.json`);
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
      console.log(`PAGE    : ${pageDef.name}`);
      console.log(`BROWSER : ${projectName}`);
      console.log(`========================================`);
      console.log(`Total    : ${counts.total}`);
      console.log(`Critical : ${counts.critical}`);
      console.log(`Serious  : ${counts.serious}`);
      console.log(`Moderate : ${counts.moderate}`);
      console.log(`Minor    : ${counts.minor}`);
    });
  }

});
// Report generation and Teams notification are handled by utils/global-teardown.js
// which runs after ALL tests across ALL browsers complete.
