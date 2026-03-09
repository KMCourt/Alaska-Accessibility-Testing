# TTC Accessibility Testing

Automated and manual accessibility tests for the **TTC Corporate Bookings Platform (CPCBA)** and **Construction Bookings Platform (ConstBA)**.

Tests check against **WCAG 2.2 AAA** — covering the full standard through automated axe-core scans and manual checklists.

---

## Project Structure

```
accessibility-testing/
│
├── CPCBA-accessibility-tests/
│   ├── browser-tests/
│   │   └── accessibility-scan.spec.js      ← Automated scan — Chrome, Firefox, Edge
│   ├── mobile-tests/
│   │   └── accessibility-scan.spec.js      ← Automated scan — iPhone 15 Pro, Galaxy S24, Pixel 7
│   ├── CPCBA-manual-tests/
│   │   ├── manual-checklist.html           ← Desktop manual checklist (open in browser)
│   │   └── manual-checklist-mobile.html    ← Mobile manual checklist (open in browser)
│   └── cpc-results/                        ← Generated reports (gitignored)
│       └── YYYY-MM-DD/
│           ├── browser/
│           │   ├── report.html             ← Browser report (Chrome/Firefox/Edge)
│           │   ├── json/                   ← Raw scan data per page per browser
│           │   └── screenshots/            ← Page and element screenshots
│           └── mobile/
│               ├── report.html             ← Mobile report (iPhone/Galaxy/Pixel)
│               ├── json/                   ← Raw scan data per page per device
│               └── screenshots/            ← Mobile page and element screenshots
│
├── ConstBA-accessibility-tests/
│   ├── accessibility-scan.spec.js
│   └── ConstBA-results/
│
├── utils/
│   ├── global-teardown.js                  ← Builds browser + mobile HTML reports after all tests
│   ├── report-generator.js                 ← HTML report template
│   ├── trend-tracker.js                    ← Tracks violation counts over time
│   ├── teams-notify.js                     ← Posts results summary to MS Teams (Adaptive Card)
│   ├── testmail.js                         ← Retrieves OTP codes from testmail.app
│   └── create-presentation.js              ← Generates PowerPoint overview
│
├── trend-history.json                      ← Violation trend history (tracked in git)
├── playwright.config.js                    ← Browser, mobile device and test configuration
├── .env                                    ← Your local credentials (gitignored — see .env.example)
└── .env.example                            ← Template for setting up .env
```

---

## Pages Tested (14 total — CPCBA)

| # | Page | What it covers |
|---|------|----------------|
| 1 | CPC Page | Main course listing |
| 2 | Info Page | Individual course details |
| 3 | My Basket Modal | Shopping basket pop-up |
| 4 | Sign In Modal | Login pop-up |
| 5 | Details & Payment | Delegate and billing details |
| 6 | Details & Payment — Pay | Payment method selection |
| 7 | Details & Payment — Verified | After email OTP verification |
| 8 | Pay by Card | Stripe card entry form |
| 9 | Booking Confirmation | Post-payment confirmation |
| 10 | Add Attendees | Manage delegates page |
| 11 | Add Attendee — Edit Form | Edit attendee panel |
| 12 | View Booked Courses | Account: booked courses |
| 13 | User Profile | Account: profile settings |
| 14 | Sign Out Page | Post sign-out page |

---

## Accessibility Standards Covered

| Standard | Automated | Manual checklist |
|----------|-----------|-----------------|
| WCAG 2.0 A | ✅ | ✅ |
| WCAG 2.0 AA | ✅ | ✅ |
| WCAG 2.1 AA | ✅ | ✅ |
| WCAG 2.2 AA | ✅ | ✅ |
| WCAG 2.2 AAA | ✅ (where detectable by axe) | ✅ |

---

## Understanding the Reports

After each run two separate reports are generated:

| Report | Location | Contains |
|--------|----------|---------|
| Browser report | `cpc-results/YYYY-MM-DD/browser/report.html` | Chrome, Firefox, Edge |
| Mobile report | `cpc-results/YYYY-MM-DD/mobile/report.html` | iPhone 15 Pro, Galaxy S24, Pixel 7 |

Each report groups results by page. Every violation includes a description, a screenshot of the affected element, and a pre-written bug ticket ready to copy into Jira.

### Severity levels

| Level | Meaning |
|-------|---------|
| 🔴 Critical | Blocks users entirely — fix immediately |
| 🟠 Serious | Significantly impairs use — fix as soon as possible |
| 🟡 Moderate | Causes difficulty — fix in next sprint |
| ⚪ Minor | Minor annoyance — fix when convenient |

---

## Manual Testing

Automated tools catch roughly 30–40% of accessibility issues. The rest require a human tester.

Open the relevant checklist directly in any browser — no setup needed:

| Checklist | Path | Use for |
|-----------|------|---------|
| Desktop | `CPCBA-accessibility-tests/CPCBA-manual-tests/manual-checklist.html` | Chrome, Firefox, Edge testing |
| Mobile | `CPCBA-accessibility-tests/CPCBA-manual-tests/manual-checklist-mobile.html` | iPhone, Android device testing |

Results are saved automatically in the browser (localStorage) — no server needed.

---

## Questions or Issues

Speak to the QA team lead or raise an issue in the [GitHub repository](https://github.com/KMCourt/accessibility-testing).
