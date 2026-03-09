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
  s.addText('TTC Group  |  Corporate & Construction Bookings Platforms  |  2026', {
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
// SLIDE 4b — Three Layers of Testing
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Three Layers of Testing — Automated + Manual');

  s.addText('Every page on both platforms is covered by automated scans and a manual checklist', {
    x: 0.3, y: 0.62, w: 9.4, h: 0.28, fontSize: 10, color: DGREY, italic: true,
  });

  const layers = [
    {
      x: 0.2, color: NAVY, title: 'Axe-Core\nAccessibility Scan',
      items: ['WCAG 2.0, 2.1, 2.2 AAA', 'Best-practice rules', '14 pages per platform', '3 browsers each run', 'Screenshots + bug tickets'],
    },
    {
      x: 2.7, color: BLUE, title: 'Colour Contrast\nCheck',
      items: ['Dedicated contrast scan', 'All text elements', 'Normal & large text', 'WCAG 1.4.6 AAA (7:1)', 'Per page, per browser'],
    },
    {
      x: 5.2, color: '6A1B9A', title: 'Keyboard\nNavigation Check',
      items: ['Tab order validation', 'Focus visibility', 'Interactive elements', 'Modal focus trapping', 'Skip links & landmarks'],
    },
    {
      x: 7.7, color: ORANGE, title: 'Manual Testing\nChecklist',
      items: ['Screen reader testing', 'Cognitive & usability', 'Mobile & touch', 'Media & motion', 'WCAG 2.2 AAA checks'],
    },
  ];

  for (const l of layers) {
    s.addShape(pres.ShapeType.roundRect, {
      x: l.x, y: 0.98, w: 2.3, h: 5.95,
      fill: { color: l.color }, line: { color: l.color }, rectRadius: 0.12,
    });
    s.addText(l.title, {
      x: l.x + 0.08, y: 1.05, w: 2.14, h: 0.75,
      fontSize: 11, bold: true, color: WHITE, align: 'center', wrap: true,
    });
    s.addShape(pres.ShapeType.rect, { x: l.x + 0.15, y: 1.85, w: 2.0, h: 0.02, fill: { color: WHITE } });
    for (let i = 0; i < l.items.length; i++) {
      s.addText(l.items[i], {
        x: l.x + 0.15, y: 1.95 + i * 0.75, w: 2.0, h: 0.6,
        fontSize: 9, color: WHITE, align: 'center', wrap: true,
      });
    }
  }

  s.addText('Automated tests run on demand (or can be scheduled). The manual checklist is completed by a tester in a browser — no installation required.', {
    x: 0.3, y: 6.98, w: 9.4, h: 0.3, fontSize: 8, color: DGREY, italic: true, align: 'center',
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5a — What Pages Are Tested? (CPCBA)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('What Pages Are Tested?  —  Corporate Bookings (CPCBA)');

  s.addText('14 pages covering the full booking journey', {
    x: 0.3, y: 0.6, w: 9.4, h: 0.28, fontSize: 10, color: DGREY, italic: true,
  });

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
    const y   = 0.9 + row * rowH;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: y + 0.02, w: colW, h: rowH - 0.04,
      fill: { color: i % 2 === 0 ? LGREY : WHITE }, line: { color: 'DDDDDD', width: 0.5 }, rectRadius: 0.05,
    });
    s.addText(`${i + 1}.  ${pages[i][0]}`, { x: x + 0.1, y: y + 0.07, w: colW * 0.54, h: rowH - 0.12, fontSize: 10, bold: true, color: NAVY });
    s.addText(pages[i][1],                 { x: x + colW * 0.54, y: y + 0.07, w: colW * 0.44, h: rowH - 0.12, fontSize: 9, color: DGREY, italic: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5b — What Pages Are Tested? (ConstBA)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('What Pages Are Tested?  —  Construction Bookings (ConstBA)');

  s.addText('14 pages covering the full construction booking journey', {
    x: 0.3, y: 0.6, w: 9.4, h: 0.28, fontSize: 10, color: DGREY, italic: true,
  });

  const pages = [
    ['Construction Page',            'The main construction course listing'],
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
    const y   = 0.9 + row * rowH;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: y + 0.02, w: colW, h: rowH - 0.04,
      fill: { color: i % 2 === 0 ? LGREY : WHITE }, line: { color: 'DDDDDD', width: 0.5 }, rectRadius: 0.05,
    });
    s.addText(`${i + 1}.  ${pages[i][0]}`, { x: x + 0.1, y: y + 0.07, w: colW * 0.54, h: rowH - 0.12, fontSize: 10, bold: true, color: BLUE });
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
    const y = 1.02 + i * 1.2;
    s.addShape(pres.ShapeType.roundRect, { x: 0.3, y, w: 1.1, h: 0.85, fill: { color: levels[i].color }, line: { color: levels[i].color }, rectRadius: 0.1 });
    s.addText(levels[i].label, { x: 0.3, y: y + 0.28, w: 1.1, h: 0.28, fontSize: 10, bold: true, color: WHITE, align: 'center' });
    s.addText(levels[i].desc,  { x: 1.55, y: y + 0.22, w: 3.1, h: 0.45, fontSize: 9,  color: DGREY, wrap: true });
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
  ], { x: 5.1, y: 1.0, w: 4.65, h: 5.0, valign: 'top' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6b — The HTML Report — Visual Example
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('The HTML Report — What It Looks Like');

  // Mock report window
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.25, y: 0.62, w: 9.5, h: 6.25,
    fill: { color: 'F8F9FA' }, line: { color: 'CCCCCC', width: 1 }, rectRadius: 0.1,
  });

  // Report header bar
  s.addShape(pres.ShapeType.rect, { x: 0.25, y: 0.62, w: 9.5, h: 0.48, fill: { color: NAVY } });
  s.addText('Accessibility Report — Construction Page', {
    x: 0.4, y: 0.68, w: 6.0, h: 0.3, fontSize: 11, bold: true, color: WHITE,
  });
  // Summary chips in header
  const chips = [
    { label: '26 total', color: '555555' },
    { label: '3 critical', color: RED },
    { label: '8 serious', color: ORANGE },
  ];
  for (let i = 0; i < chips.length; i++) {
    s.addShape(pres.ShapeType.roundRect, {
      x: 6.6 + i * 1.04, y: 0.7, w: 0.95, h: 0.26,
      fill: { color: chips[i].color }, line: { color: chips[i].color }, rectRadius: 0.05,
    });
    s.addText(chips[i].label, { x: 6.6 + i * 1.04, y: 0.71, w: 0.95, h: 0.22, fontSize: 8, bold: true, color: WHITE, align: 'center' });
  }

  // Browser tabs
  const tabs = ['Chrome', 'Firefox', 'Edge'];
  for (let i = 0; i < tabs.length; i++) {
    const active = i === 0;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.35 + i * 1.3, y: 1.13, w: 1.2, h: 0.28,
      fill: { color: active ? WHITE : 'E0E0E0' }, line: { color: 'CCCCCC', width: 0.5 }, rectRadius: 0.05,
    });
    s.addText(tabs[i], {
      x: 0.35 + i * 1.3, y: 1.15, w: 1.2, h: 0.22,
      fontSize: 8, bold: active, color: active ? NAVY : '777777', align: 'center',
    });
  }

  // Page screenshot (real scan screenshot — Construction Page, Chrome)
  s.addImage({
    path: 'ConstBA-accessibility-tests/ConstBA-results/2026-03-08/screenshots/construction_page_chromium.png',
    x: 0.35, y: 1.48, w: 3.2, h: 2.5,
  });

  // Violation card (right)
  s.addShape(pres.ShapeType.roundRect, {
    x: 3.7, y: 1.48, w: 5.9, h: 1.15,
    fill: { color: WHITE }, line: { color: 'FFCCCC', width: 1 }, rectRadius: 0.06,
  });
  s.addShape(pres.ShapeType.roundRect, {
    x: 3.78, y: 1.54, w: 0.85, h: 0.22,
    fill: { color: RED }, line: { color: RED }, rectRadius: 0.04,
  });
  s.addText('CRITICAL', { x: 3.78, y: 1.55, w: 0.85, h: 0.18, fontSize: 7, bold: true, color: WHITE, align: 'center' });
  s.addText('image-alt — Images must have alternative text', {
    x: 4.7, y: 1.54, w: 4.8, h: 0.22, fontSize: 9, bold: true, color: DGREY,
  });
  s.addText('<img class="_logo_" src="/assets/logo.png">', {
    x: 3.78, y: 1.8, w: 5.7, h: 0.2, fontSize: 8, color: '883333', fontFace: 'Courier New',
  });
  s.addText('Fix: Add alt="TTC Group Logo" to the img element', {
    x: 3.78, y: 2.02, w: 5.7, h: 0.2, fontSize: 8, color: GREEN, italic: true,
  });
  // Element screenshot (real close-up of a flagged element)
  s.addImage({
    path: 'ConstBA-accessibility-tests/ConstBA-results/2026-03-08/screenshots/construction_page_chromium_button-name_0.png',
    x: 3.7, y: 2.72, w: 2.5, h: 0.7,
  });
  // "Copy bug ticket" — expanded dropdown header
  s.addShape(pres.ShapeType.rect, {
    x: 3.7, y: 3.5, w: 5.9, h: 0.28,
    fill: { color: 'EEF2FF' }, line: { color: 'CCCCCC', width: 0.5 },
  });
  s.addText('📋  Copy bug ticket  ▼', {
    x: 3.78, y: 3.52, w: 4.0, h: 0.22, fontSize: 9, bold: true, color: NAVY,
  });
  // "Copy" button inside the expanded dropdown
  s.addShape(pres.ShapeType.roundRect, {
    x: 8.7, y: 3.52, w: 0.78, h: 0.22,
    fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.04,
  });
  s.addText('Copy', { x: 8.7, y: 3.53, w: 0.78, h: 0.18, fontSize: 7.5, bold: true, color: WHITE, align: 'center' });

  // Bug ticket text box
  s.addShape(pres.ShapeType.rect, {
    x: 3.7, y: 3.78, w: 5.9, h: 2.35,
    fill: { color: 'F8F8F8' }, line: { color: 'E0E0E0', width: 0.5 },
  });

  const ticketLines = [
    { t: 'TITLE: [Accessibility] image-alt — Construction Page (Chrome)', bold: true, color: DGREY },
    { t: '' },
    { t: 'TYPE: Accessibility Bug   |   SEVERITY: CRITICAL', color: RED, bold: true },
    { t: 'WCAG CRITERION: wcag2a, wcag412   |   PAGE: Construction Page' },
    { t: '' },
    { t: 'DESCRIPTION: Images must have alternative text' },
    { t: '' },
    { t: 'AFFECTED ELEMENTS (1):', bold: true, color: DGREY },
    { t: '  Target: img._logo_' },
    { t: '  HTML: <img class="_logo_" src="/assets/logo.png">' },
    { t: '  Fix: Element does not have an alt attribute' },
    { t: '' },
    { t: 'EXPECTED: The img element has a descriptive alt text value' },
    { t: 'ACTUAL: Element does not have an alt attribute' },
    { t: '' },
    { t: 'REFERENCE: dequeuniversity.com/rules/axe/4.10/image-alt', color: BLUE },
  ];

  const lineH = 0.132;
  for (let i = 0; i < ticketLines.length; i++) {
    const tl = ticketLines[i];
    if (!tl.t) continue;
    s.addText(tl.t, {
      x: 3.78, y: 3.84 + i * lineH, w: 5.7, h: lineH,
      fontSize: 6.8, color: tl.color || '333333', bold: tl.bold || false,
      fontFace: 'Courier New', wrap: false,
    });
  }

  // Footer note inside mock
  s.addShape(pres.ShapeType.rect, { x: 0.25, y: 6.22, w: 9.5, h: 0.02, fill: { color: 'DDDDDD' } });
  s.addText('One report per run  ·  All pages and browsers in a single HTML file  ·  Open report.html in any browser  ·  No internet required', {
    x: 0.3, y: 6.26, w: 9.4, h: 0.28, fontSize: 8, color: '888888', align: 'center', italic: true,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6c — Manual Testing Checklist
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Manual Testing — What Automation Cannot Check');

  s.addText('A browser-based checklist completed by a tester — covers 9 categories across all 14 pages on both platforms', {
    x: 0.3, y: 0.62, w: 9.4, h: 0.28, fontSize: 10, color: DGREY, italic: true,
  });

  const cats = [
    { icon: '🗣️',  title: 'Screen Reader',         desc: 'Does content read out in a logical order? Are all elements announced correctly?' },
    { icon: '⌨️',  title: 'Keyboard Navigation',   desc: 'Can every feature be used with only a keyboard? Is focus always visible?' },
    { icon: '👁️',  title: 'Visual & Colour',       desc: 'Is text readable at 200% zoom? Does the page work without colour cues alone?' },
    { icon: '📝',  title: 'Content & Structure',   desc: 'Are headings meaningful? Is reading order logical without CSS?' },
    { icon: '📋',  title: 'Forms & Errors',        desc: 'Are error messages descriptive? Can users correct mistakes easily?' },
    { icon: '🎬',  title: 'Media & Motion',        desc: 'Can animations be paused? Are videos captioned? No auto-play audio?' },
    { icon: '📱',  title: 'Mobile & Touch',        desc: 'Are touch targets large enough? Does the page work in portrait and landscape?' },
    { icon: '🧠',  title: 'Cognitive & Usability', desc: 'Is the language plain? Are instructions clear? Are timeouts flagged?' },
    { icon: '⭐',  title: 'WCAG 2.2 AAA Enhanced', desc: 'Exceeds minimum standards — covers sign language, extended timeouts, pronunciation.' },
  ];

  const colW = 3.0, rowH = 0.68, col2x = 3.5, col3x = 7.0;
  for (let i = 0; i < cats.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = col === 0 ? 0.25 : col === 1 ? col2x : col3x;
    const y = 0.98 + row * rowH;
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: colW, h: rowH - 0.06,
      fill: { color: LGREY }, line: { color: 'DDDDDD', width: 0.5 }, rectRadius: 0.07,
    });
    s.addText(cats[i].icon + '  ' + cats[i].title, {
      x: x + 0.08, y: y + 0.04, w: colW - 0.16, h: 0.24, fontSize: 9, bold: true, color: NAVY,
    });
    s.addText(cats[i].desc, {
      x: x + 0.08, y: y + 0.28, w: colW - 0.16, h: 0.3, fontSize: 7.5, color: DGREY, wrap: true,
    });
  }

  s.addText('Checklist opens in any browser — no install needed. Results saved locally. Available for both CPCBA and ConstBA.', {
    x: 0.3, y: 6.94, w: 9.4, h: 0.25, fontSize: 8, color: GREEN, bold: true, align: 'center',
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Results Summary (both platforms)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Latest Results — 3 Browsers × 14 Pages × 2 Platforms');

  // ── CPCBA column (left) ──
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.25, y: 0.62, w: 4.5, h: 0.3,
    fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.06,
  });
  s.addText('Corporate Bookings (CPCBA)', {
    x: 0.25, y: 0.64, w: 4.5, h: 0.26, fontSize: 10, bold: true, color: WHITE, align: 'center',
  });
  badge(s, 1.5, 1.02, 2.0, 0.78, NAVY, '~240', 'Total violations');
  const cpcbaSev = [
    { color: RED,      label: '~20', sub: 'Critical' },
    { color: ORANGE,   label: '~56', sub: 'Serious'  },
    { color: YELLOW,   label: '~78', sub: 'Moderate' },
    { color: '999999', label: '~0',  sub: 'Minor'    },
  ];
  for (let i = 0; i < cpcbaSev.length; i++) {
    badge(s, 0.28 + i * 1.09, 1.9, 1.0, 0.62, cpcbaSev[i].color, cpcbaSev[i].label, cpcbaSev[i].sub);
  }

  // ── ConstBA column (right) ──
  s.addShape(pres.ShapeType.roundRect, {
    x: 5.25, y: 0.62, w: 4.5, h: 0.3,
    fill: { color: BLUE }, line: { color: BLUE }, rectRadius: 0.06,
  });
  s.addText('Construction Bookings (ConstBA)', {
    x: 5.25, y: 0.64, w: 4.5, h: 0.26, fontSize: 10, bold: true, color: WHITE, align: 'center',
  });
  badge(s, 6.5, 1.02, 2.0, 0.78, BLUE, '262', 'Total violations');
  const constbaSev = [
    { color: RED,      label: '40',  sub: 'Critical' },
    { color: ORANGE,   label: '109', sub: 'Serious'  },
    { color: YELLOW,   label: '113', sub: 'Moderate' },
    { color: '999999', label: '0',   sub: 'Minor'    },
  ];
  for (let i = 0; i < constbaSev.length; i++) {
    badge(s, 5.28 + i * 1.09, 1.9, 1.0, 0.62, constbaSev[i].color, constbaSev[i].label, constbaSev[i].sub);
  }

  // Divider
  s.addShape(pres.ShapeType.rect, { x: 4.9, y: 0.62, w: 0.05, h: 1.92, fill: { color: 'DDDDDD' } });

  // Shared notes
  s.addText([
    b('Issues span the full journey — browsing, signing in, paying, and managing attendees', 0),
    b('Many violations appear in all 3 browsers — they are in the code, not browser-specific', 0),
    b('Critical and Serious issues are the priority — they prevent or significantly impair real users', 0),
    b('The automated tool finds issues instantly that would take hours to find manually', 0),
  ], { x: 0.35, y: 2.65, w: 9.3, h: 3.8, valign: 'top' });
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

  // 4 rows, each 1.1" — total 4.4" starting at y=0.65 → last body ends ~5.05
  for (let i = 0; i < steps.length; i++) {
    const y = 0.65 + i * 1.1;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.3, y, w: 0.62, h: 0.62,
      fill: { color: steps[i].color }, line: { color: steps[i].color }, rectRadius: 0.08,
    });
    s.addText(steps[i].icon,  { x: 0.3,  y: y + 0.08, w: 0.62, h: 0.4,  fontSize: 13, align: 'center' });
    s.addText(steps[i].title, { x: 1.05, y: y + 0.02, w: 8.65, h: 0.28, fontSize: 12, bold: true, color: steps[i].color });
    s.addText(steps[i].body,  { x: 1.05, y: y + 0.32, w: 8.65, h: 0.42, fontSize: 9,  color: DGREY, wrap: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — For Developers
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('For Developers — What the Scanner Checks');

  s.addText('Uses axe-core against WCAG 2.0 / 2.1 / 2.2 AAA + best practices', {
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

  // CPCBA section header
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.3, y: 1.05, w: 4.55, h: 0.3,
    fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.05,
  });
  s.addText('Corporate Bookings (CPCBA)', { x: 0.4, y: 1.07, w: 4.35, h: 0.24, fontSize: 10, bold: true, color: WHITE });

  const cpcbaCmds = [
    { label: 'All browsers',    cmd: 'npx playwright test' },
    { label: 'Chrome only',     cmd: 'npx playwright test --project=chromium' },
    { label: 'Single test',     cmd: 'npx playwright test --grep "CPC Page"' },
  ];
  for (let i = 0; i < cpcbaCmds.length; i++) {
    const y = 1.42 + i * 0.73;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.3, y, w: 4.55, h: 0.6,
      fill: { color: LGREY }, line: { color: 'CCCCCC', width: 0.5 }, rectRadius: 0.07,
    });
    s.addText(cpcbaCmds[i].label, { x: 0.45, y: y + 0.04, w: 1.7, h: 0.24, fontSize: 9, bold: true, color: NAVY });
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.45, y: y + 0.3, w: 4.25, h: 0.24,
      fill: { color: '1E1E1E' }, line: { color: '1E1E1E' }, rectRadius: 0.04,
    });
    s.addText(cpcbaCmds[i].cmd, { x: 0.55, y: y + 0.32, w: 4.1, h: 0.18, fontSize: 8, color: '00FF90', fontFace: 'Courier New' });
  }

  // ConstBA section header
  s.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 1.05, w: 4.55, h: 0.3,
    fill: { color: BLUE }, line: { color: BLUE }, rectRadius: 0.05,
  });
  s.addText('Construction Bookings (ConstBA)', { x: 5.25, y: 1.07, w: 4.35, h: 0.24, fontSize: 10, bold: true, color: WHITE });

  const constbaCmds = [
    { label: 'All browsers',    cmd: 'npx playwright test --config=constba.config.js' },
    { label: 'Chrome only',     cmd: 'npx playwright test --config=constba.config.js --project=chromium' },
    { label: 'Single test',     cmd: 'npx playwright test --config=constba.config.js --grep "Construction Page"' },
  ];
  for (let i = 0; i < constbaCmds.length; i++) {
    const y = 1.42 + i * 0.73;
    s.addShape(pres.ShapeType.roundRect, {
      x: 5.15, y, w: 4.55, h: 0.6,
      fill: { color: LGREY }, line: { color: 'CCCCCC', width: 0.5 }, rectRadius: 0.07,
    });
    s.addText(constbaCmds[i].label, { x: 5.3, y: y + 0.04, w: 1.7, h: 0.24, fontSize: 9, bold: true, color: BLUE });
    s.addShape(pres.ShapeType.roundRect, {
      x: 5.3, y: y + 0.3, w: 4.25, h: 0.24,
      fill: { color: '1E1E1E' }, line: { color: '1E1E1E' }, rectRadius: 0.04,
    });
    s.addText(constbaCmds[i].cmd, { x: 5.4, y: y + 0.32, w: 4.1, h: 0.18, fontSize: 7.5, color: '00FF90', fontFace: 'Courier New' });
  }

  s.addText([
    b('Both suites use the same report format — one HTML file per run with full screenshots and bug tickets', 0),
    b('Results saved in dated folders — CPCBA-results/YYYY-MM-DD/ and ConstBA-results/YYYY-MM-DD/', 0),
  ], { x: 0.3, y: 4.65, w: 9.4, h: 1.0, valign: 'top' });

  s.addText('CPCBA report: CPCBA-results / YYYY-MM-DD / report.html      ConstBA report: ConstBA-results / YYYY-MM-DD / report.html', {
    x: 0.3, y: 6.52, w: 9.4, h: 0.32, fontSize: 9, color: GREEN, bold: true,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10b — Everything We Delivered
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Everything We Delivered — Full Project Summary');

  const deliverables = [
    { color: NAVY,     icon: '🤖', title: 'Axe-Core Accessibility Scan',    desc: '14 pages × 3 browsers on both CPCBA and ConstBA — fully automated, runs on demand.' },
    { color: BLUE,     icon: '🎨', title: 'Colour Contrast Test Suite',      desc: 'Dedicated scan for WCAG 1.4.3 contrast ratio violations across both platforms.' },
    { color: '6A1B9A', icon: '⌨️', title: 'Keyboard Navigation Test Suite',  desc: 'Validates tab order, focus management, and interactive element accessibility.' },
    { color: ORANGE,   icon: '📋', title: 'Manual Testing Checklist',        desc: '9-category browser-based checklist covering what automation cannot — screen readers, cognitive, mobile.' },
    { color: GREEN,    icon: '📊', title: 'HTML Accessibility Report',        desc: 'Auto-generated report per run — page screenshots, violation cards, element close-ups, copy-paste bug tickets.' },
    { color: RED,      icon: '📈', title: 'Trend Tracker',                   desc: 'Git-tracked JSON history of every run — flags regressions and shows improvement over time.' },
    { color: '555555', icon: '🔔', title: 'Microsoft Teams Notification',    desc: 'Automated summary card posted to Teams when any test suite finishes.' },
    { color: '00695C', icon: '📄', title: 'Tester Setup Guide (Word)',       desc: 'CPCBA-Tester-Setup-Guide.docx — step-by-step onboarding for new testers.' },
    { color: '37474F', icon: '🗂️', title: 'GitHub Actions CI/CD',           desc: 'Automated daily schedule — tests can run on push or on a timed trigger without manual effort.' },
  ];

  const colW = 4.55, rowH = 0.72, col2x = 5.2;
  for (let i = 0; i < deliverables.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 0.25 : col2x;
    const y = 0.62 + row * rowH;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: y + 0.04, w: 0.5, h: 0.5,
      fill: { color: deliverables[i].color }, line: { color: deliverables[i].color }, rectRadius: 0.06,
    });
    s.addText(deliverables[i].icon, { x, y: y + 0.1, w: 0.5, h: 0.35, fontSize: 12, align: 'center' });
    s.addText(deliverables[i].title, {
      x: x + 0.58, y: y + 0.05, w: colW - 0.62, h: 0.24, fontSize: 9, bold: true, color: deliverables[i].color,
    });
    s.addText(deliverables[i].desc, {
      x: x + 0.58, y: y + 0.28, w: colW - 0.62, h: 0.35, fontSize: 8, color: DGREY, wrap: true,
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10c — Brand Guidelines WCAG Conformance
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Brand Guidelines — WCAG Accessibility Conformance Check');

  s.addText('Source: TTC Group_Brand Guidelines_V1 4  ·  Colours extracted from official PowerPoint theme  ·  Tested against WCAG 2.2 AAA', {
    x: 0.3, y: 0.62, w: 9.4, h: 0.24, fontSize: 8, color: DGREY, italic: true,
  });

  // ── Colour palette swatches ──────────────────────────────────────────────
  const swatches = [
    { hex: '190B2F', name: 'Dark Purple',     role: 'Primary / dk1' },
    { hex: '5F4FFC', name: 'Bright Purple',   role: 'Accent 1' },
    { hex: 'A082E0', name: 'Medium Purple',   role: 'Accent 2' },
    { hex: '5B1D7A', name: 'Deep Purple',     role: 'Accent 3' },
    { hex: 'FF99FF', name: 'Pink / Magenta',  role: 'Accent 4' },
    { hex: 'D8D2E9', name: 'Light Lavender',  role: 'Accent 5' },
    { hex: '467886', name: 'Teal',            role: 'Hyperlink' },
    { hex: '96607D', name: 'Muted Pink',      role: 'Visited Link' },
  ];
  const sw = 1.14, swGap = 0.04, swStartX = 0.25, swY = 0.92;
  for (let i = 0; i < swatches.length; i++) {
    const x = swStartX + i * (sw + swGap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: swY, w: sw, h: 0.42,
      fill: { color: swatches[i].hex }, line: { color: 'CCCCCC', width: 0.3 }, rectRadius: 0.06,
    });
    // hex label inside swatch — white or dark depending on brightness
    const lum = parseInt(swatches[i].hex.slice(0,2),16)*0.2126 + parseInt(swatches[i].hex.slice(2,4),16)*0.7152 + parseInt(swatches[i].hex.slice(4,6),16)*0.0722;
    const txtClr = lum > 160 ? DGREY : WHITE;
    s.addText('#' + swatches[i].hex, { x, y: swY + 0.04, w: sw, h: 0.18, fontSize: 7, bold: true, color: txtClr, align: 'center', fontFace: 'Courier New' });
    s.addText(swatches[i].name, { x, y: swY + 0.44, w: sw, h: 0.16, fontSize: 7, color: DGREY, align: 'center', bold: true });
    s.addText(swatches[i].role, { x, y: swY + 0.6,  w: sw, h: 0.14, fontSize: 6.5, color: '888888', align: 'center' });
  }

  // ── Section headers ──────────────────────────────────────────────────────
  const colL = 0.25, colR = 5.1, colW2 = 4.7;

  s.addShape(pres.ShapeType.roundRect, {
    x: colL, y: 1.82, w: colW2, h: 0.26,
    fill: { color: '1B5E20' }, line: { color: '1B5E20' }, rectRadius: 0.05,
  });
  s.addText('✅  WCAG AAA Compliant Combinations', {
    x: colL + 0.08, y: 1.84, w: colW2 - 0.1, h: 0.2, fontSize: 8.5, bold: true, color: WHITE,
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: colR, y: 1.82, w: colW2, h: 0.26,
    fill: { color: 'B71C1C' }, line: { color: 'B71C1C' }, rectRadius: 0.05,
  });
  s.addText('❌  Non-Compliant — Avoid for Text', {
    x: colR + 0.08, y: 1.84, w: colW2 - 0.1, h: 0.2, fontSize: 8.5, bold: true, color: WHITE,
  });

  // ── Contrast row helper ──────────────────────────────────────────────────
  function contrastRow(slide, x, y, fgHex, bgHex, label, ratio, status) {
    const rowH2 = 0.5;
    const passClr = status === 'PASS' ? '1B5E20' : status === 'LARGE' ? 'E65100' : 'B71C1C';
    const passLabel = status === 'PASS' ? '✅ PASS' : status === 'LARGE' ? '⚠️ Large only' : '❌ FAIL';
    // FG swatch
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.05, y: y + 0.1, w: 0.32, h: 0.28,
      fill: { color: fgHex }, line: { color: 'AAAAAA', width: 0.3 }, rectRadius: 0.04,
    });
    // BG swatch
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.42, y: y + 0.1, w: 0.32, h: 0.28,
      fill: { color: bgHex }, line: { color: 'AAAAAA', width: 0.3 }, rectRadius: 0.04,
    });
    // Label + ratio
    slide.addText(label, {
      x: x + 0.82, y: y + 0.04, w: colW2 - 2.0, h: 0.22, fontSize: 8, color: DGREY, bold: true,
    });
    slide.addText(ratio + ':1', {
      x: x + 0.82, y: y + 0.25, w: colW2 - 2.0, h: 0.18, fontSize: 7.5, color: '666666', fontFace: 'Courier New',
    });
    // Pass/fail badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + colW2 - 1.1, y: y + 0.1, w: 1.0, h: 0.26,
      fill: { color: passClr }, line: { color: passClr }, rectRadius: 0.05,
    });
    slide.addText(passLabel, {
      x: x + colW2 - 1.1, y: y + 0.12, w: 1.0, h: 0.2, fontSize: 7, bold: true, color: WHITE, align: 'center',
    });
  }

  const rowStart = 2.14, rowGap = 0.54;

  // Left — AAA PASSES (≥ 7:1 normal text) + AAA large-only (≥ 4.5:1)
  const passes = [
    { fg: '190B2F', bg: 'FFFFFF', label: 'Dark Purple on White',         ratio: '18.58', st: 'PASS' },
    { fg: '5B1D7A', bg: 'FFFFFF', label: 'Deep Purple on White',         ratio: '11.05', st: 'PASS' },
    { fg: 'D8D2E9', bg: '190B2F', label: 'Light Lavender on Dark Purple',ratio: '12.67', st: 'PASS' },
    { fg: 'FF99FF', bg: '190B2F', label: 'Pink/Magenta on Dark Purple',  ratio: '9.96',  st: 'PASS' },
    { fg: '5F4FFC', bg: 'FFFFFF', label: 'Bright Purple on White',       ratio: '5.24',  st: 'LARGE' },
  ];
  for (let i = 0; i < passes.length; i++) {
    contrastRow(s, colL, rowStart + i * rowGap, passes[i].fg, passes[i].bg, passes[i].label, passes[i].ratio, passes[i].st);
  }

  // Right — FAILS at AAA (all four miss the 4.5:1 AAA large-text threshold or worse)
  const fails = [
    { fg: 'A082E0', bg: 'FFFFFF', label: 'Medium Purple on White',       ratio: '3.10', st: 'FAIL' },
    { fg: '5F4FFC', bg: '190B2F', label: 'Bright Purple on Dark Purple', ratio: '3.55', st: 'FAIL' },
    { fg: 'FF99FF', bg: 'FFFFFF', label: 'Pink/Magenta on White',        ratio: '1.87', st: 'FAIL' },
    { fg: 'D8D2E9', bg: 'FFFFFF', label: 'Light Lavender on White',      ratio: '1.47', st: 'FAIL' },
  ];
  for (let i = 0; i < fails.length; i++) {
    contrastRow(s, colR, rowStart + i * rowGap, fails[i].fg, fails[i].bg, fails[i].label, fails[i].ratio, fails[i].st);
  }

  // ── Font note ────────────────────────────────────────────────────────────
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.25, y: 5.9, w: 9.5, h: 0.72,
    fill: { color: 'FFF8E1' }, line: { color: 'FFD54F', width: 0.5 }, rectRadius: 0.08,
  });
  s.addText('Brand Fonts — Accessibility Notes', {
    x: 0.4, y: 5.95, w: 5.0, h: 0.22, fontSize: 9, bold: true, color: ORANGE,
  });
  s.addText([
    { text: 'Heading: ', options: { bold: true, fontSize: 8, color: DGREY } },
    { text: 'DM Sans Semibold', options: { fontSize: 8, color: DGREY, fontFace: 'Courier New' } },
    { text: '  — Good. Semibold weight ensures readability at all sizes.', options: { fontSize: 8, color: DGREY } },
  ], { x: 0.4, y: 6.17, w: 9.1, h: 0.18 });
  s.addText([
    { text: 'Body: ', options: { bold: true, fontSize: 8, color: DGREY } },
    { text: 'Noto Sans Light', options: { fontSize: 8, color: DGREY, fontFace: 'Courier New' } },
    { text: '  — Caution. Light weight can fail WCAG 1.4.12 (text spacing) at small sizes. At AAA, ensure minimum 18px or use Regular/Medium weight for body text.', options: { fontSize: 8, color: 'B71C1C' } },
  ], { x: 0.4, y: 6.37, w: 9.1, h: 0.18 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — Next Steps
// ════════════════════════════════════════════════════════════════════════════
{
  const s = contentSlide('Next Steps');

  const items = [
    { icon: '🎯', color: RED,    title: 'Fix Critical issues first',    body: 'These are blocking users right now. Address critical violations as the highest priority on both CPCBA and ConstBA.' },
    { icon: '📅', color: ORANGE, title: 'Schedule regular scans',       body: 'Run both suites after every major release or sprint to catch new issues before they reach production.' },
    { icon: '✅', color: BLUE,   title: 'ConstBA coverage is now live', body: 'Construction Bookings (ConstBA) is fully covered — 14 pages, 3 browsers, same scan depth and reporting as CPCBA.' },
    { icon: '📈', color: GREEN,  title: 'Track improvements over time', body: 'The trend tracker records every run on both platforms — violation counts will reduce as fixes are applied.' },
  ];

  // 4 rows × 1.1" = 4.4" starting y=0.65 → last body ends ~5.05
  for (let i = 0; i < items.length; i++) {
    const y = 0.65 + i * 1.1;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.3, y, w: 0.62, h: 0.62,
      fill: { color: items[i].color }, line: { color: items[i].color }, rectRadius: 0.08,
    });
    s.addText(items[i].icon,  { x: 0.3,  y: y + 0.08, w: 0.62, h: 0.4,  fontSize: 13, align: 'center' });
    s.addText(items[i].title, { x: 1.05, y: y + 0.02, w: 8.65, h: 0.28, fontSize: 12, bold: true, color: items[i].color });
    s.addText(items[i].body,  { x: 1.05, y: y + 0.32, w: 8.65, h: 0.42, fontSize: 9,  color: DGREY, wrap: true });
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
    { text: 'CPCBA Report:  ', options: { bold: true, color: 'A8C4E8', fontSize: 11 } },
    { text: 'CPCBA-results / YYYY-MM-DD / report.html', options: { color: '6FCFFF', fontFace: 'Courier New', fontSize: 11 } },
  ], { x: 0.5, y: 3.15, w: 9, h: 0.38, align: 'center' });
  s.addText([
    { text: 'ConstBA Report:  ', options: { bold: true, color: 'A8C4E8', fontSize: 11 } },
    { text: 'ConstBA-results / YYYY-MM-DD / report.html', options: { color: '6FCFFF', fontFace: 'Courier New', fontSize: 11 } },
  ], { x: 0.5, y: 3.58, w: 9, h: 0.38, align: 'center' });
  s.addText([
    { text: 'Spec files:  ', options: { bold: true, color: 'A8C4E8', fontSize: 11 } },
    { text: 'CPCBA-accessibility-tests/  &  ConstBA-accessibility-tests/  (accessibility-scan.spec.js)', options: { color: '6FCFFF', fontFace: 'Courier New', fontSize: 10 } },
  ], { x: 0.5, y: 4.02, w: 9, h: 0.38, align: 'center' });
  s.addText('TTC Group  |  Accessibility Testing Programme  |  2026', {
    x: 0.5, y: 6.9, w: 9, h: 0.35, fontSize: 10, color: '6699BB', align: 'center',
  });
}

// ─── Write ───────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: 'Accessibility-Testing-Overview.pptx' })
  .then(() => console.log('✅  Saved: Accessibility-Testing-Overview.pptx'))
  .catch(err => { console.error('Error:', err); process.exit(1); });
