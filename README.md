# CPCBA Accessibility Testing

Automated and manual accessibility tests for the **TTC Corporate Bookings Platform** (CPCBA).

Tests check that the site meets **WCAG 2.2 AA** — the current legal standard — and also runs **WCAG 2.2 AAA** enhanced checks where possible.

---

## What is Accessibility Testing?

Accessibility testing checks that a website can be used by everyone, including people who:
- Are blind or visually impaired and use a screen reader
- Cannot use a mouse and navigate by keyboard only
- Have low vision and need to zoom in or increase text size
- Have motor disabilities and use assistive technology
- Have cognitive disabilities and need clear, simple content

---

## Project Structure

```
accessibility-testing/
├── CPCBA-accessibility-tests/
│   ├── accessibility-scan.spec.js      ← Main automated scan (14 pages, 3 browsers)
│   ├── colour-contrast.spec.js         ← Dedicated contrast checks
│   └── keyboard-navigation.spec.js     ← Keyboard navigation checks
│
├── CPCBA-manual-tests/
│   └── manual-checklist.html           ← Manual test checklist (open in browser)
│
├── utils/
│   ├── global-teardown.js              ← Builds HTML report after all tests finish
│   ├── report-generator.js             ← HTML report template
│   ├── trend-tracker.js                ← Tracks violation counts over time
│   ├── teams-notify.js                 ← Posts results summary to MS Teams
│   ├── testmail.js                     ← Retrieves OTP codes from testmail.app
│   └── create-presentation.js          ← Generates PowerPoint overview (node utils/create-presentation.js)
│
├── CPCBA-results/                      ← Generated reports (gitignored)
│   └── YYYY-MM-DD/
│       ├── report.html                 ← Main HTML report — open this
│       ├── json/                       ← Raw scan data per page per browser
│       └── screenshots/                ← Page and element screenshots
│
├── trend-history.json                  ← Violation trend history (tracked in git)
├── playwright.config.js                ← Browser and test configuration
├── .env                                ← Your local credentials (gitignored — see .env.example)
└── .env.example                        ← Template for setting up .env
```

---

## Pages Tested (14 total)

| # | Page | What it covers |
|---|------|---------------|
| 1 | CPC Page | Main course listing |
| 2 | Info Page | Individual course details |
| 3 | My Basket Modal | Shopping basket pop-up |
| 4 | Sign In Modal | Login pop-up |
| 5 | Details & Payment | Delegate and billing details |
| 6 | Details & Payment — Pay | Payment method selection |
| 7 | Details & Payment — Verified | After email OTP verification |
| 8 | Pay by Card | Stripe card entry |
| 9 | Booking Confirmation | Post-payment confirmation |
| 10 | Add Attendees | Manage delegates page |
| 11 | Add Attendee — Edit Form | Edit attendee panel |
| 12 | View Booked Courses | Account: booked courses |
| 13 | User Profile | Account: profile settings |
| 14 | Sign Out Page | Post sign-out page |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) LTS version
- [VS Code](https://code.visualstudio.com) (recommended)
- A testmail.app account for OTP email handling (contact the QA team lead)

### Setup

**1. Clone the repository**
```bash
git clone https://github.com/KMCourt/accessibility-testing.git
cd accessibility-testing
```

**2. Install dependencies**
```bash
npm install
```

**3. Install browsers**
```bash
npx playwright install
```

**4. Configure environment variables**
```bash
cp .env.example .env
```
Open `.env` and fill in your testmail credentials and Teams webhook URL.
Contact the QA team lead for the real values.

---

## Running the Tests

### Run everything (all 14 pages × 3 browsers)
```bash
npx playwright test
```

### Run a single browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=edge
```

### Run a specific test by name
```bash
npx playwright test --grep "CPC Page"
```

### Run only the contrast or keyboard tests
```bash
npx playwright test CPCBA-accessibility-tests/colour-contrast.spec.js
npx playwright test CPCBA-accessibility-tests/keyboard-navigation.spec.js
```

After the run completes, the HTML report is saved to:
```
CPCBA-results/YYYY-MM-DD/report.html
```
Open this file in any browser to view all results.

---

## Manual Testing

Automated tools catch roughly 30–40% of accessibility issues. The rest require a human.

Open the manual checklist in any browser — no setup needed:
```
CPCBA-manual-tests/manual-checklist.html
```

It covers all 14 pages with 9 categories of checks:
- 🔊 Screen Reader
- ⌨️ Keyboard Navigation
- 👁️ Visual & Colour
- 📝 Content & Structure
- 📋 Forms & Errors
- 🎬 Media & Motion
- 📱 Mobile & Touch
- 🧠 Cognitive & Usability
- ⭐ WCAG 2.2 AAA Enhanced Standards

Answers are saved automatically in the browser (localStorage) — no server needed.

---

## Understanding the Automated Report

The HTML report groups results by page. Each page has a tab for **Chromium**, **Firefox**, and **Edge**.

### Severity levels

| Level | Meaning |
|-------|---------|
| 🔴 Critical | Blocks users entirely — fix immediately |
| 🟠 Serious | Significantly impairs use — fix as soon as possible |
| 🟡 Moderate | Causes difficulty — fix in next sprint |
| ⚪ Minor | Minor annoyance — fix when convenient |

Each violation includes:
- A description of the issue
- A screenshot of the affected element
- A pre-written bug ticket ready to paste into Jira

---

## Accessibility Standards

| Standard | Covered |
|----------|---------|
| WCAG 2.0 A | ✅ Automated |
| WCAG 2.0 AA | ✅ Automated |
| WCAG 2.1 AA | ✅ Automated |
| WCAG 2.2 AA | ✅ Automated |
| WCAG 2.2 AAA | ✅ Automated (where detectable) + Manual checklist |

---

## Adding a New Page

Open [`CPCBA-accessibility-tests/accessibility-scan.spec.js`](CPCBA-accessibility-tests/accessibility-scan.spec.js) and add an entry to the `PAGES` array:

```javascript
{
  name: 'My New Page',
  url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/new-page',
},
```

For pages that require navigation steps (e.g. clicking a button to open a modal), add a `setup` function:

```javascript
{
  name: 'My Modal',
  url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc',
  setup: async (page) => {
    await page.locator('button:has-text("Open modal")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  },
},
```

---

## Questions or Issues

Speak to the QA team or raise an issue in the GitHub repository.
