// ===========================================
// PLAYWRIGHT CONFIGURATION — DORS-Booking
// ===========================================
// https://ttc-eun-qat-booking-as.azurewebsites.net/
//
// HOW TO RUN:
// Browser only:  npx playwright test --config=dors-booking.config.js --project=chromium --project=firefox --project=edge
// Mobile only:   npx playwright test --config=dors-booking.config.js --project="iPhone 15 Pro" --project="Galaxy S24" --project="Pixel 7"
// Everything:    npx playwright test --config=dors-booking.config.js
// ===========================================

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  testDir: './DORS-Booking-accessibility-tests',

  globalTeardown: './utils/dors-booking-teardown.js',

  outputDir: './DORS-Booking-accessibility-tests/DORS-Booking-dev-debug/artifacts',

  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 60000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'DORS-Booking-accessibility-tests/DORS-Booking-dev-debug/html-report', open: 'never' }],
  ],

  use: {
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },

  projects: [
    // ── Desktop browsers — run browser-tests/ only ────────────────────────
    {
      name: 'chromium',
      testMatch: '**/browser-tests/**/*.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: '**/browser-tests/**/*.spec.js',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'edge',
      testMatch: '**/browser-tests/**/*.spec.js',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },

    // ── Mobile devices — run mobile-tests/ only ───────────────────────────
    {
      name: 'iPhone 15 Pro',
      testMatch: '**/mobile-tests/**/*.spec.js',
      use: { ...devices['iPhone 15 Pro'] },    // WebKit (Safari) · iOS 17 · 393×659 · touch
    },
    {
      name: 'Galaxy S24',
      testMatch: '**/mobile-tests/**/*.spec.js',
      use: { ...devices['Galaxy S24'] },       // Chromium (Chrome) · Android 14 · 360×780 · touch
    },
    {
      name: 'Pixel 7',
      testMatch: '**/mobile-tests/**/*.spec.js',
      use: { ...devices['Pixel 7'] },          // Chromium (Chrome) · Android 14 · 412×839 · touch
    },
  ],
});
