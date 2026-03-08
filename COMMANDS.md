# Accessibility Testing — Command Reference

## Setup (first time only)
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

---

## Running Tests

### Run the full CPCBA suite (all pages, all browsers)
```bash
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js
```

### Run in a specific browser only
```bash
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --project=chromium
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --project=firefox
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --project=edge
```

### Run a specific page by name
```bash
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --grep "CPC Page"
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --grep "Booking Confirmation"
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --grep "Sign In Modal"
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --grep "View Booked Courses"
```

### Run a specific page in a specific browser
```bash
npx playwright test CPCBA-accessibility-tests/accessibility-scan.spec.js --grep "CPC Page" --project=chromium
```

---

## Results

Reports are saved to `CPCBA-results/YYYY-MM-DD/report.html` after each run.
A Teams notification is also sent automatically on completion.

---

## Clearing Results

### Delete today's debug output (screenshots, traces, videos)
```bash
Remove-Item -Path "CPCBA-dev-debug\*" -Recurse -Force
```

### Delete all saved accessibility reports
```bash
Remove-Item -Path "CPCBA-results\*" -Recurse -Force
```

---

## Tips
- Always run commands from the `accessibility-testing` folder
- Tests run sequentially (1 worker) — multiple payment tests share one OTP email and cannot run in parallel
- The full suite (14 pages × 3 browsers = 42 tests) takes approximately 35 minutes
- Reports older than 90 days are deleted automatically on each run
