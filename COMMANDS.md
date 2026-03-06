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

### Run all tests
```bash
npx playwright test
```

### Run a specific test file
```bash
# Accessibility scan (axe violations)
npx playwright test tests/accessibility-scan.spec.js

# Colour contrast
npx playwright test tests/colour-contrast.spec.js

# Keyboard navigation
npx playwright test tests/keyboard-navigation.spec.js
```

### Run tests in a specific browser only
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=edge
```

### Run a specific test by name
```bash
npx playwright test --grep "CPC Page"
```

---

## Viewing Results

### Open the HTML report after tests finish
```bash
npx playwright show-report results/html-report
```

---

## Clearing Results

### Delete all previous test results
```bash
Remove-Item -Path "results\*" -Recurse -Force
Remove-Item -Path "dev-debug\*" -Recurse -Force
```

---

## Tips
- Always run `npx playwright test` from the `accessibility-testing` folder
- Results are saved to `results/` — check the HTML report for full details
- ⚠️ KN-02 (focus indicator) logs warnings only — review the screenshots manually in `results/<date>/keyboard/`