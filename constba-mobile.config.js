// ===========================================
// PLAYWRIGHT CONFIGURATION — ConstBA Mobile
// ===========================================
// Runs axe-core accessibility scans on mobile-emulated devices
// against the Construction Booking site.
//
// HOW TO RUN:
// All devices:  npx playwright test --config=constba-mobile.config.js
// One device:   npx playwright test --config=constba-mobile.config.js --project="iPhone 15 Pro"
// ===========================================

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  testDir: './ConstBA-accessibility-tests/mobile-tests',

  outputDir: './ConstBA-accessibility-tests/ConstBA-dev-debug/mobile-artifacts',

  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 60000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'ConstBA-accessibility-tests/ConstBA-dev-debug/mobile/html-report', open: 'never' }],
  ],

  use: {
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'iPhone 15 Pro',
      use: { ...devices['iPhone 15 Pro'] },    // WebKit (Safari) · iOS 17 · 393×659 · touch
    },
    {
      name: 'Galaxy S24',
      use: { ...devices['Galaxy S24'] },       // Chromium (Chrome) · Android 14 · 360×780 · touch
    },
    {
      name: 'Pixel 7',
      use: { ...devices['Pixel 7'] },          // Chromium (Chrome) · Android 14 · 412×839 · touch
    },
  ],
});
