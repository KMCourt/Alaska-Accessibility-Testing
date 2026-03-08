/**
 * Creates the Accessibility Testing Project presentation
 * Run: node utils/create-presentation.js
 * Output: Accessibility-Testing-Overview.pptx
 */

const pptx = require('pptxgenjs');

const pres = new pptx();

// ─── Brand colours ───────────────────────────────────────────────────────────
const NAVY   = '0B3C6E';
const WHITE  = 'FFFFFF';
const BLUE   = '1565C0';
const ORANGE = 'E65100';
const GREEN  = '2E7D32';
const RED    = 'CC0000';
const LGREY  = 'F0F2F5';
const DGREY  = '444444';
const YELLOW = 'F9A825';

// Slide canvas: 10" × 7.5"
// Safe content zone: y 0.62 → 6.95  (top bar 0–0.55, footer 7.05–7.5)

// ─── Shared helpers ──────────────────────────────────────────────────────────

function contentSlide(title) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  // Top bar
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.55, fill: { color: NAVY } });
  slide.addText(title, {
    x: 0.3, y: 0.06, w: 9.4, h: 0.43,
    fontSize: 17, bold: true, color: WHITE,
  });
  // Footer
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 7.05, w: 10, h: 0.45, fill: { color: LGREY } });
  slide.addText('TTC Group  |  Accessibility Testing Programme', {
    x: 0.3, y: 7.1, w: 9.4, h: 0.3,
    fontSize: 8, color: '888888', align: 'center',
  });
  return slide;
}

// Bullet helper — small font so wrapped text stays inside its text box
function b(text, level = 0, opts = {}) {
  return {
    text,
    options: {
      bullet: level === 0 ? { type: 'bullet', code: '25CF' } : { type: 'bullet', code: '25E6' },
      indentLevel: level,
      fontSize: opts.fontSize || (level === 0 ? 12 : 10),
      color: opts.color || DGREY,
      bold: opts.bold || false,
      breakLine: true,
      paraSpaceAfter: 4,
    },
  };
}

function badge(slide, x, y, w, h, color, big, small) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, fill: { color }, line: { color }, rectRadius: 0.1,
  });
  slide.addText(big, {
    x, y: y + 0.04, w, h: h * 0.54,
    fontSize: 18, bold: true, color: WHITE, align: 'center',
  });
  if (small) {
    slide.addText(small, {
      x, y: y + h * 0.58, w, h: h * 0.34,
      fontSize: 9, color: WHITE, align: 'center',
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 2.45, w: 10, h: 0.07, fill: { color: ORANGE } });
  s.addText('Accessibility Testing', {
    x: 0.5, y: 0.9, w: 9, h: 0.85,
    fontSize: 38, bold: true, color: WHITE, align: 'center',
  });
  s.addText('Programme Overview', {
    x: 0.5, y: 1.72, w: 9, h: 0.6,
    fontSize: 24, color: 'A8C4E8', align: 'center',
  });
  s.addText('What we built, why it matters, and what we found', {
    x: 0.5, y: 2.62, w: 9, h: 0.45,
    fontSize: 14, color: 'A8C4E8', align: 'center', italic: true,
  });
  s.addText('TTC Group  |  Corporate Bookings Platform  |  2026', {
    x: 0.5, y: 6.9, w: 9, h: 0.35,
    fontSize: 10, color: '6699BB', align: 'center',
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — What is Accessibility Testing?
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('What is Accessibility Testing?');
  s.addText([
    b('Accessibility testing checks that our website can be used by everyone', 0, { bold: true }),
    b('Including people who use screen readers, keyboard-only navigation, or have visual impairments', 1),
    b('It also ensures we meet WCAG (Web Content Accessibility Guidelines) — the international standard', 1),
    b(''),
    b('Why does it matter to TTC Group?', 0, { bold: true }),
    b('Legal obligation — UK Equality Act 2010 and public sector accessibility regulations', 1),
    b('Better experience for all users, not just those with disabilities', 1),
    b('Reduces risk of complaints, legal challenges, and reputational damage', 1),
    b('Builds trust with corporate clients who have their own accessibility policies', 1),
  ], { x: 0.45, y: 0.62, w: 9.1, h: 6.3, valign: 'top' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — What Did We Build?
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('What Did We Build?');

  const boxes = [
    { x: 0.3,  color: NAVY,  icon: '🤖', title: 'Automated Scan', body: 'Tests run automatically across every page using axe-core — the industry-standard accessibility engine trusted by teams worldwide.' },
    { x: 3.65, color: BLUE,  icon: '📊', title: 'Smart Report',   body: 'A single HTML report groups results by page with a tab per browser — violations, screenshots and bug tickets all in one place.' },
    { x: 7.0,  color: GREEN, icon: '🔔', title: 'Teams Alerts',   body: 'When tests finish, a summary card is posted directly to Microsoft Teams so the whole team sees the results immediately.' },
  ];

  for (const bx of boxes) {
    s.addShape(pres.ShapeType.roundRect, {
      x: bx.x, y: 0.62, w: 2.9, h: 6.3,
      fill: { color: bx.color }, line: { color: bx.color }, rectRadius: 0.14,
    });
    s.addText(bx.icon,  { x: bx.x, y: 0.75, w: 2.9, h: 0.5,  fontSize: 22, align: 'center' });
    s.addText(bx.title, { x: bx.x + 0.1, y: 1.32, w: 2.7, h: 0.4, fontSize: 14, bold: true, color: WHITE, align: 'center' });
    s.addText(bx.body,  { x: bx.x + 0.15, y: 1.8,  w: 2.6, h: 4.8, fontSize: 11, color: WHITE, align: 'center', valign: 'top', wrap: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — How Does It Work?
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('How Does It Work?');

  const steps = [
    { n: '1', label: 'Tests open\nthe website',        color: NAVY   },
    { n: '2', label: 'Navigate to\neach page',         color: BLUE   },
    { n: '3', label: 'Scan for\naccessibility issues', color: ORANGE },
    { n: '4', label: 'Save results\n& screenshots',    color: GREEN  },
    { n: '5', label: 'Generate\nHTML report',          color: '6A1B9A' },
  ];

  const bw = 1.38, gap = 0.27, sx = 0.48, stepY = 0.9;
  for (let i = 0; i < steps.length; i++) {
    const x = sx + i * (bw + gap);
    s.addShape(pres.ShapeType.roundRect, { x, y: stepY, w: bw, h: 1.1, fill: { color: steps[i].color }, line: { color: steps[i].color }, rectRadius: 0.1 });
    s.addText(steps[i].n,     { x, y: stepY + 0.03, w: bw, h: 0.34, fontSize: 15, bold: true, color: WHITE, align: 'center' });
    s.addText(steps[i].label, { x: x + 0.05, y: stepY + 0.38, w: bw - 0.1, h: 0.65, fontSize: 10, color: WHITE, align: 'center', wrap: true });
    if (i < steps.length - 1) {
      s.addText('▶', { x: x + bw + 0.03, y: stepY + 0.28, w: gap - 0.06, h: 0.38, fontSize: 14, color: NAVY, align: 'center' });
    }
  }

  s.addText('Each test simulates a real user journey — signing in, adding to basket, paying, managing attendees — then checks the page for issues', {
    x: 0.45, y: 2.15, w: 9.1, h: 0.55,
    fontSize: 12, color: DGREY, align: 'center', italic: true, wrap: true,
  });

  s.addText([
    b('Runs in 3 browsers automatically: Chrome, Firefox, and Microsoft Edge', 0),
    b('Takes screenshots of every page and every individual problem element found', 0),
    b('Compares to the previous run — flags if anything gets worse (called a regression)', 0),
    b('Runs on demand — no manual effort needed once started', 0),
  ], { x: 0.45, y: 2.85, w: 9.1, h: 3.95, valign: 'top' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — What Pages Are Tested?
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('What Pages Are Tested?  (14 in total)');

  const pages = [
    ['CPC Page',                     'The main course listing page'],
    ['Info Page',                    'Individual course details'],
    ['My Basket Modal',              'The shopping basket pop-up'],
    ['Sign In Modal',                'The login pop-up'],
    ['Details & Payment',            'Delegate and billing details form'],
    ['Details & Payment — Pay',      'Payment method selection'],
    ['Details & Payment — Verified', 'After email OTP verification'],
    ['Pay by Card',                  'Stripe card entry form'],
    ['Booking Confirmation',         'Post-payment confirmation page'],
    ['Add Attendees',                'Manage delegates page'],
    ['Add Attendee — Edit Form',     'Edit attendee details panel'],
    ['View Booked Courses',          'Account: booked courses list'],
    ['User Profile',                 'Account: profile settings'],
    ['Sign Out Page',                'Post sign-out landing page'],
  ];

  const colW = 4.55, rowH = 0.43, col2x = 5.1;
  for (let i = 0; i < pages.length; i++) {
    const col = i < 7 ? 0 : 1;
    const row = i < 7 ? i : i - 7;
    const x   = col === 0 ? 0.3 : col2x;
    const y   = 0.62 + row * rowH;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: y + 0.02, w: colW, h: rowH - 0.04,
      fill: { color: i % 2 === 0 ? LGREY : WHITE }, line: { color: 'DDDDDD', width: 0.5 }, rectRadius: 0.05,
    });
    s.addText(`${i + 1}.  ${pages[i][0]}`, { x: x + 0.1, y: y + 0.07, w: colW * 0.54, h: rowH - 0.12, fontSize: 10, bold: true, color: NAVY });
    s.addText(pages[i][1],                 { x: x + colW * 0.54, y: y + 0.07, w: colW * 0.44, h: rowH - 0.12, fontSize: 9, color: DGREY, italic: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — What Does the Report Show?
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('What Does the Report Show?');

  // Left — severity key
  s.addText('Issue Severity Levels', { x: 0.3, y: 0.62, w: 4.4, h: 0.32, fontSize: 12, bold: true, color: NAVY });

  const levels = [
    { color: RED,      label: 'Critical', desc: 'Must fix — blocks users entirely' },
    { color: ORANGE,   label: 'Serious',  desc: 'Should fix — significantly impairs use' },
    { color: YELLOW,   label: 'Moderate', desc: 'Consider fixing — causes difficulty' },
    { color: '888888', label: 'Minor',    desc: 'Nice to fix — minor annoyance' },
  ];
  for (let i = 0; i < levels.length; i++) {
    const y = 1.02 + i * 1.44;
    s.addShape(pres.ShapeType.roundRect, { x: 0.3, y, w: 1.1, h: 1.0, fill: { color: levels[i].color }, line: { color: levels[i].color }, rectRadius: 0.1 });
    s.addText(levels[i].label, { x: 0.3, y: y + 0.32, w: 1.1, h: 0.34, fontSize: 11, bold: true, color: WHITE, align: 'center' });
    s.addText(levels[i].desc,  { x: 1.55, y: y + 0.32, w: 3.1, h: 0.38, fontSize: 11, color: DGREY, wrap: true });
  }

  // Right — report features
  s.addText('The report includes…', { x: 5.1, y: 0.62, w: 4.6, h: 0.32, fontSize: 12, bold: true, color: NAVY });
  s.addText([
    b('One section per page — with tabs for each browser', 0),
    b('Summary cards showing violation counts at a glance', 0),
    b('Full screenshot of the page as it appeared during the scan', 0),
    b('Close-up screenshots of each individual problem element', 0),
    b('Ready-to-paste bug ticket text for developers', 0),
    b('Regression flag if a page has more issues than last time', 0),
  ], { x: 5.1, y: 1.0, w: 4.65, h: 5.85, valign: 'top' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Results Summary
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Latest Results — 3 Browsers, 14 Pages');

  s.addText('Total issues found across all pages and browsers', {
    x: 0.4, y: 0.62, w: 9.2, h: 0.32, fontSize: 12, color: DGREY, italic: true,
  });

  badge(s, 3.8, 1.05, 2.4, 1.1, NAVY, '~240', 'Total violations');

  const sev = [
    { color: RED,      label: '~20', sub: 'Critical' },
    { color: ORANGE,   label: '~56', sub: 'Serious'  },
    { color: YELLOW,   label: '~78', sub: 'Moderate' },
    { color: '999999', label: '~0',  sub: 'Minor'    },
  ];
  for (let i = 0; i < sev.length; i++) {
    badge(s, 0.45 + i * 2.27, 2.38, 2.14, 0.82, sev[i].color, sev[i].label, sev[i].sub);
  }

  s.addText([
    b('These are issues across the full booking journey — from browsing courses to managing attendees', 0),
    b('Many issues appear in all 3 browsers, meaning they are in the code itself, not browser-specific', 0),
    b('Critical and Serious issues are the priority — they prevent or significantly impair real users', 0),
    b('The automated tool finds issues instantly that would take a human tester hours to find manually', 0),
  ], { x: 0.45, y: 3.35, w: 9.1, h: 3.5, valign: 'top' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — What Happens With The Results?
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('What Happens With The Results?');

  const steps = [
    { icon: '📋', color: NAVY,   title: 'Testers review the report',  body: 'Open report.html, check each page section, confirm the issue is real, and prioritise by severity.' },
    { icon: '🎫', color: BLUE,   title: 'Raise bug tickets',           body: 'Each violation has a pre-written bug ticket — just copy and paste it into Jira or your issue tracker.' },
    { icon: '🔧', color: ORANGE, title: 'Developers fix the issues',   body: 'Developers use the screenshot and element details to locate and fix the problem in the code.' },
    { icon: '🔁', color: GREEN,  title: 'Re-run to confirm',           body: 'Run the tests again after a fix — the tool confirms the issue is gone and flags anything new.' },
  ];

  // 4 rows, each 1.55" — total 6.2" starting at y=0.62 → ends at 6.82 ✓
  for (let i = 0; i < steps.length; i++) {
    const y = 0.62 + i * 1.55;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.3, y, w: 0.72, h: 0.72,
      fill: { color: steps[i].color }, line: { color: steps[i].color }, rectRadius: 0.08,
    });
    s.addText(steps[i].icon,  { x: 0.3,  y: y + 0.1,  w: 0.72, h: 0.45, fontSize: 14, align: 'center' });
    s.addText(steps[i].title, { x: 1.15, y: y + 0.02, w: 8.55, h: 0.3,  fontSize: 13, bold: true,  color: steps[i].color });
    s.addText(steps[i].body,  { x: 1.15, y: y + 0.35, w: 8.55, h: 0.38, fontSize: 11, color: DGREY, wrap: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — For Developers
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('For Developers — What the Scanner Checks');

  s.addText('Uses axe-core against WCAG 2.0 / 2.1 / 2.2 AA + best practices', {
    x: 0.3, y: 0.62, w: 9.4, h: 0.3, fontSize: 11, color: DGREY, italic: true,
  });

  const rules = [
    ['colour-contrast',         'Text must have sufficient contrast against its background'],
    ['aria-* attributes',       'ARIA labels on interactive elements must be valid and meaningful'],
    ['image alt text',          'Images must have descriptive alt attributes'],
    ['form labels',             'Every form input must have a properly associated label'],
    ['keyboard navigation',     'All functionality must be reachable without a mouse'],
    ['heading structure',       'Headings must follow a logical H1 → H2 → H3 order'],
    ['landmark regions',        'Page sections must use landmark roles (main, nav, footer…)'],
    ['focus management',        'Focus must move correctly when modals open and close'],
    ['link purpose',            '"Click here" links must clearly describe their destination'],
    ['autocomplete attributes', 'Login and payment fields must declare autocomplete type'],
  ];

  // 5 rows per column, rowH = 1.22" → total height 6.1" starting y=0.98 → ends 7.08 ✓
  const rowH = 1.19, boxH = 0.82;
  for (let i = 0; i < rules.length; i++) {
    const col = i < 5 ? 0 : 1;
    const row = i < 5 ? i : i - 5;
    const x   = col === 0 ? 0.3 : 5.15;
    const y   = 0.97 + row * rowH;
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 4.6, h: boxH,
      fill: { color: i % 2 === 0 ? LGREY : WHITE }, line: { color: 'CCCCCC', width: 0.5 }, rectRadius: 0.06,
    });
    s.addText(rules[i][0], { x: x + 0.1, y: y + 0.05, w: 4.4, h: 0.26, fontSize: 10, bold: true, color: NAVY });
    s.addText(rules[i][1], { x: x + 0.1, y: y + 0.34, w: 4.4, h: 0.4,  fontSize: 9,  color: DGREY, wrap: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — How To Run the Tests
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('How To Run the Tests — Quick Reference');

  s.addText('Prerequisites: Node.js installed, dependencies installed (npm install), .env file configured with testmail credentials', {
    x: 0.3, y: 0.62, w: 9.4, h: 0.4, fontSize: 10, color: DGREY, italic: true, wrap: true,
  });

  const cmds = [
    { label: 'Run all browsers',          cmd: 'npx playwright test' },
    { label: 'Run Chrome only',           cmd: 'npx playwright test --project=chromium' },
    { label: 'Run Firefox only',          cmd: 'npx playwright test --project=firefox' },
    { label: 'Run Edge only',             cmd: 'npx playwright test --project=edge' },
    { label: 'Run a single test by name', cmd: 'npx playwright test --grep "CPC Page"' },
  ];

  // 5 rows × 1.0" = 5.0" starting y=1.1 → ends 6.1, footer note at 6.55 ✓
  for (let i = 0; i < cmds.length; i++) {
    const y = 1.1 + i * 1.0;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.3, y, w: 9.4, h: 0.85,
      fill: { color: LGREY }, line: { color: 'CCCCCC', width: 0.5 }, rectRadius: 0.07,
    });
    s.addText(cmds[i].label, { x: 0.5, y: y + 0.06, w: 3.4, h: 0.28, fontSize: 11, bold: true, color: NAVY });
    s.addShape(pres.ShapeType.roundRect, {
      x: 4.0, y: y + 0.1, w: 5.5, h: 0.58,
      fill: { color: '1E1E1E' }, line: { color: '1E1E1E' }, rectRadius: 0.06,
    });
    s.addText(cmds[i].cmd, { x: 4.1, y: y + 0.17, w: 5.3, h: 0.32, fontSize: 10, color: '00FF90', fontFace: 'Courier New' });
  }

  s.addText('Report saved to: CPCBA-results / YYYY-MM-DD / report.html', {
    x: 0.3, y: 6.52, w: 9.4, h: 0.32, fontSize: 10, color: GREEN, bold: true,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — Next Steps
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Next Steps');

  const items = [
    { icon: '🎯', color: RED,    title: 'Fix Critical issues first',    body: 'These are blocking users right now. Developers should address critical violations as the highest priority.' },
    { icon: '📅', color: ORANGE, title: 'Schedule regular scans',       body: 'Run the tests after every major release or sprint to catch new issues before they reach production.' },
    { icon: '🌐', color: BLUE,   title: 'Expand to more platforms',     body: 'The same framework can be extended to cover the ConstructionBA site and any future platforms.' },
    { icon: '📈', color: GREEN,  title: 'Track improvements over time', body: 'The trend tracker records every run — you will see the violation count reduce as fixes are applied.' },
  ];

  // 4 rows × 1.55" = 6.2" starting y=0.62 → ends 6.82 ✓
  for (let i = 0; i < items.length; i++) {
    const y = 0.62 + i * 1.55;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.3, y, w: 0.72, h: 0.72,
      fill: { color: items[i].color }, line: { color: items[i].color }, rectRadius: 0.08,
    });
    s.addText(items[i].icon,  { x: 0.3,  y: y + 0.1,  w: 0.72, h: 0.45, fontSize: 14, align: 'center' });
    s.addText(items[i].title, { x: 1.15, y: y + 0.02, w: 8.55, h: 0.3,  fontSize: 13, bold: true,  color: items[i].color });
    s.addText(items[i].body,  { x: 1.15, y: y + 0.35, w: 8.55, h: 0.38, fontSize: 11, color: DGREY, wrap: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 12 — Closing
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 3.0, w: 10, h: 0.07, fill: { color: ORANGE } });
  s.addText('Thank You', {
    x: 0.5, y: 1.0, w: 9, h: 0.85,
    fontSize: 38, bold: true, color: WHITE, align: 'center',
  });
  s.addText('Questions welcome', {
    x: 0.5, y: 1.9, w: 9, h: 0.5,
    fontSize: 18, color: 'A8C4E8', align: 'center', italic: true,
  });
  s.addText([
    { text: 'Report:  ', options: { bold: true, color: 'A8C4E8', fontSize: 12 } },
    { text: 'CPCBA-results / YYYY-MM-DD / report.html', options: { color: '6FCFFF', fontFace: 'Courier New', fontSize: 12 } },
  ], { x: 1.0, y: 3.2, w: 8, h: 0.42, align: 'center' });
  s.addText([
    { text: 'Spec file:  ', options: { bold: true, color: 'A8C4E8', fontSize: 12 } },
    { text: 'CPCBA-accessibility-tests / accessibility-scan.spec.js', options: { color: '6FCFFF', fontFace: 'Courier New', fontSize: 12 } },
  ], { x: 1.0, y: 3.72, w: 8, h: 0.42, align: 'center' });
  s.addText('TTC Group  |  Accessibility Testing Programme  |  2026', {
    x: 0.5, y: 6.9, w: 9, h: 0.35, fontSize: 10, color: '6699BB', align: 'center',
  });
}

// ─── Write ───────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: 'Accessibility-Testing-Overview.pptx' })
  .then(() => console.log('✅  Saved: Accessibility-Testing-Overview.pptx'))
  .catch(err => { console.error('Error:', err); process.exit(1); });
