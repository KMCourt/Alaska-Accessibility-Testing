// ===========================================
// PLAYWRIGHT CONFIGURATION
// ===========================================
// This file tells Playwright which browsers to run tests in
// and sets global settings for all tests.
// ===========================================

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  // Test file location
  testDir: './CPCBA-accessibility-tests',

  // Runs after ALL tests across ALL browsers finish — generates report and notifies Teams
  globalTeardown: './utils/global-teardown.js',

  // Move Playwright's debug output to a dev-only folder
  // Testers should use the results/ folder for reports
  outputDir: './CPCBA-accessibility-tests/CorpBA-dev-debug',

  // Run tests sequentially — payment-heavy tests share one OTP email address
  // and the app rate-limits concurrent OTP requests, causing flakiness in parallel.
  fullyParallel: false,

  // Retry failed tests once before marking as failed
  retries: 1,

  // Single worker ensures no OTP race conditions between tests
  workers: 1,

  // Global timeout per test
  timeout: 60000,

  // Reporter — shows results in terminal and saves an HTML report
  reporter: [
    ['list'],
    ['html', { outputFolder: 'CPCBA-accessibility-tests/CorpBA-dev-debug/html-report', open: 'never' }],
  ],

  // Global settings applied to all tests
  use: {
    // Take a screenshot automatically on test failure
    screenshot: 'only-on-failure',

    // Record a video on test failure for debugging
    video: 'on-first-retry',

    // Trace on first retry for debugging
    trace: 'on-first-retry',
  },

  // Browsers to test against
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
});