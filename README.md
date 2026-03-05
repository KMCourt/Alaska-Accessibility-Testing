# TTC Alaska Bookings — Accessibility Testing

This repository contains automated and manual accessibility tests for the TTC Alaska Bookings platform. The tests check that the site meets **WCAG 2.2 AA** — the current latest accessibility standard.

---

## What is Accessibility Testing?

Accessibility testing checks that a website can be used by everyone, including people who:
- Are blind or visually impaired and use a screen reader
- Cannot use a mouse and navigate by keyboard only
- Have low vision and need to zoom in or increase text size
- Have motor disabilities and use assistive technology
- Have cognitive disabilities and need clear, simple content

---

## Pages Being Tested

| Page | URL |
|------|-----|
| CPC Page | https://ttc-eun-qat-corporatebookings.azurewebsites.net/cpc |
| Details and Payment | https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment |
| Pay Page | https://ttc-eun-qat-corporatebookings.azurewebsites.net/details-and-payment/pay |

---

## What's in This Repository

```
accessibility-testing/
  cpc-accessibility.spec.js                       → Automated test script
  manual-tests/
    manual-accessibility-test-scripts.md          → Manual test scripts for the team
  .gitignore                                       → Excludes node_modules and results from GitHub
  package.json                                     → Project dependencies
  README.md                                        → This file
```

---

## Getting Started

### What You Need
- [Node.js](https://nodejs.org) — download and install the LTS version
- [VS Code](https://code.visualstudio.com) — recommended code editor
- A terminal (built into VS Code)

### Setup Instructions

**Step 1: Clone the repository**
```bash
git clone https://github.com/KMCourt/accessibility-testing.git
cd accessibility-testing
```

**Step 2: Install dependencies**
```bash
npm install
```

**Step 3: Install the browser**
```bash
npx playwright install chromium
```

That's it — you're ready to run the tests!

---

## Running the Automated Tests

Open the terminal in VS Code and run:

```bash
npx playwright test cpc-accessibility.spec.js --reporter=list
```

This will:
1. Open a browser automatically
2. Visit each page listed above
3. Scan for accessibility violations
4. Print a summary to the terminal
5. Save two files to a `results/` folder for each page:
   - A **JSON file** with full technical details
   - A **plain English .txt report** for non-technical team members

---

## Understanding the Results

### Plain English Report (.txt)
Written so anyone on the team can understand it — no technical knowledge needed. Opens in any text editor. Contains:
- A summary of how many issues were found and how serious they are
- A plain English description of each issue
- Why each issue matters to real users
- What needs to be done to fix it

### JSON Report (.json)
For developers and technical team members. Contains:
- Full technical detail of each violation
- The exact HTML elements affected
- The WCAG criterion each issue fails against
- A help URL with guidance on how to fix it

---

## Manual Testing

Automated tools only catch around 30-40% of accessibility issues. The rest require a human to test manually.

The full manual test scripts are in the `manual-tests/` folder. They cover:
- Keyboard navigation
- Screen reader behaviour
- Colour and visual issues
- Zoom and text resize
- Mobile and touch
- Forms and error handling
- Moving and flashing content

---

## Accessibility Standard

All tests run against **WCAG 2.2 AA** which includes:

| Standard | What it covers |
|----------|---------------|
| WCAG 2.0 A | Fundamental accessibility rules |
| WCAG 2.0 AA | Legal standard for most organisations |
| WCAG 2.1 AA | Mobile and modern web rules |
| WCAG 2.2 AA | Latest standard — focus, forms, and touch |

---

## Adding a New Page to the Automated Scan

Open `cpc-accessibility.spec.js` and add a new entry to the `PAGES` array at the top of the file:

```javascript
{
  name: 'My New Page',
  url: 'https://ttc-eun-qat-corporatebookings.azurewebsites.net/new-page',
},
```

---

## Sharing Updates with the Team

When you make changes to any test file, push them to GitHub:

```bash
git add .
git commit -m "describe what you changed"
git push
```

Your team members can pull the latest changes with:

```bash
git pull
```

---

## Questions or Issues

If you have any questions about the tests or need help interpreting results, speak to the QA team.