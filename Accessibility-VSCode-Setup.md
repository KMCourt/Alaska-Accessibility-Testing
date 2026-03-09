# Accessibility Testing — VS Code Setup Guide

---

## Prerequisites

- [Node.js](https://nodejs.org) LTS version
- [VS Code](https://code.visualstudio.com)
- Testmail.app credentials (contact the QA team lead)
- Microsoft Teams webhook URL (contact the QA team lead)

---

## First-Time Setup

**1. Clone the repository**
```bash
git clone https://github.com/KMCourt/accessibility-testing.git
cd accessibility-testing
```

**2. Install Node dependencies**
```bash
npm install
```

**3. Install desktop browsers**
```bash
npx playwright install chromium firefox msedge
```

**4. Install WebKit (required for iPhone / iOS Safari emulation)**
```bash
npx playwright install webkit
```

**5. Configure environment variables**
```bash
cp .env.example .env
```
Open `.env` in VS Code and fill in the values — contact the QA team lead for credentials:
```
TESTMAIL_API_KEY=your-key-here
TESTMAIL_NAMESPACE=your-namespace
TESTMAIL_TAG=test
TEAMS_WEBHOOK_URL=your-power-automate-url
```

---

## Running Browser Tests (Chrome · Firefox · Edge)

### Run all pages, all browsers
```bash
npx playwright test --project=chromium --project=firefox --project=edge
```

### Run a single browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=edge
```

### Run a specific page in a specific browser
```bash
npx playwright test --grep "CPC Page" --project=chromium
npx playwright test --grep "Booking Confirmation" --project=edge
npx playwright test --grep "Sign In Modal" --project=firefox
```

**Reports are saved to:**
```
CPCBA-accessibility-tests/cpc-results/YYYY-MM-DD/browser/report.html
```

---

## Running Mobile Tests (iPhone 15 Pro · Galaxy S24 · Pixel 7)

### Run all pages, all mobile devices
```bash
npx playwright test --project="iPhone 15 Pro" --project="Galaxy S24" --project="Pixel 7"
```

### Run a single device
```bash
npx playwright test --project="iPhone 15 Pro"
npx playwright test --project="Galaxy S24"
npx playwright test --project="Pixel 7"
```

### Run a specific page on a specific device
```bash
npx playwright test --grep "CPC Page" --project="iPhone 15 Pro"
npx playwright test --grep "Sign In Modal" --project="Pixel 7"
```

**Device details:**

| Project name | Engine | Represents | Viewport |
|---|---|---|---|
| `iPhone 15 Pro` | WebKit | iOS 17 / Safari | 393×659 |
| `Galaxy S24` | Chromium | Android 14 / Chrome | 360×780 |
| `Pixel 7` | Chromium | Android 14 / Chrome | 412×839 |

**Reports are saved to:**
```
CPCBA-accessibility-tests/cpc-results/YYYY-MM-DD/mobile/report.html
```

---

## Running Everything (browsers + all mobile devices)

```bash
npx playwright test
```

This runs all 6 projects against their respective test folders and generates both reports.

---

## Results Folder Structure

```
cpc-results/
  YYYY-MM-DD/
    browser/
      report.html       ← Open this for browser results
      json/             ← Raw data files
      screenshots/      ← Page and element screenshots
    mobile/
      report.html       ← Open this for mobile results
      json/             ← Raw data files
      screenshots/      ← Mobile screenshots
```

Reports older than 90 days are deleted automatically on each run.

---

## Manual Checklists

Open directly in a browser — no server needed.

| Checklist | Path |
|-----------|------|
| Desktop (Chrome/Firefox/Edge) | `CPCBA-accessibility-tests/CPCBA-manual-tests/manual-checklist.html` |
| Mobile (iPhone/Android) | `CPCBA-accessibility-tests/CPCBA-manual-tests/manual-checklist-mobile.html` |

Results are saved in browser localStorage automatically.

---

## Generating the PowerPoint Presentation

```bash
node utils/create-presentation.js
```

Output: `Accessibility-Testing-Overview.pptx` in the project root.

---

## Useful Tips

- Always run commands from the `accessibility-testing/` root folder
- Tests run sequentially (1 worker) — multiple payment tests share one OTP email address and cannot run in parallel
- Browser suite (14 pages × 3 browsers = 42 tests) takes approximately 35 minutes
- Mobile suite (14 pages × 3 devices = 42 tests) takes approximately 45 minutes
- A Teams notification card is sent automatically when a run completes
- The `CorpBA-dev-debug/` folder contains Playwright's internal debug output — use the `cpc-results/` folder for reports

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `WebKit not found` | Run `npx playwright install webkit` |
| `OTP not received` | Check testmail.app dashboard — verify namespace/tag in `.env` |
| `Teams notification not sent` | Check `TEAMS_WEBHOOK_URL` in `.env` — test with `node -e "require('dotenv').config(); const {postToTeams} = require('./utils/teams-notify'); postToTeams({webhookUrl: process.env.TEAMS_WEBHOOK_URL, summaryData:[], today:'test', regressions:[]})"` |
| `EBUSY error on .pptx` | Close the PowerPoint file before running `node utils/create-presentation.js` |
| Tests fail on payment pages | OTP rate limiting — ensure `workers: 1` in `playwright.config.js` |
