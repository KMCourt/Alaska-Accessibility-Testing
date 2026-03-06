// ===========================================
// PLAYWRIGHT CONFIGURATION
// ===========================================
// This file tells Playwright which browsers to run tests in
// and sets global settings for all tests.
// ===========================================

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  // Test file location
  testDir: './tests',

  // Move Playwright's debug output to a dev-only folder
  // Testers should use the results/ folder for reports
  outputDir: './dev-debug',

  // Run tests in parallel across browsers
  fullyParallel: true,

  // Retry failed tests once before marking as failed
  retries: 1,

  // Number of parallel workers — increased to handle mobile device tests
  workers: 6,

  // Global timeout per test — increased to 90 seconds for mobile tests
  timeout: 90000,

  // Reporter — shows results in terminal and saves an HTML report
  reporter: [
    ['list'],
    ['html', { outputFolder: 'results/html-report', open: 'never' }],
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