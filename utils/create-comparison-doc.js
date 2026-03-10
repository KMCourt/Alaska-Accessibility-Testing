/**
 * Generates a Word document comparing browser vs mobile
 * accessibility violations for CPCBA, grouped by page.
 */

const fs   = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, AlignmentType, ShadingType,
  BorderStyle, VerticalAlign,
} = require('docx');

// ── helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor'];

const SEVERITY_COLOUR = {
  critical: 'FFDCDC',  // light red
  serious:  'FFE8CC',  // light orange
  moderate: 'FFF8CC',  // light yellow
  minor:    'F0F0F0',  // light grey
};

const PLATFORM_COLOUR = {
  both:   'D6EAD0',  // green
  browser:'D0E4F0',  // blue
  mobile: 'EBD6F0',  // purple
};

const bold = (text) => new TextRun({ text, bold: true, font: 'Calibri', size: 20 });
const normal = (text) => new TextRun({ text, font: 'Calibri', size: 20 });
const small  = (text) => new TextRun({ text, font: 'Calibri', size: 18 });

function cell(content, { bg, bold: isBold = false, width, vAlign } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    verticalAlign: vAlign || VerticalAlign.CENTER,
    shading: bg ? { type: ShadingType.CLEAR, fill: bg } : undefined,
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left:   { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right:  { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
      children: [isBold ? bold(content) : small(content)],
    })],
  });
}

// ── data loading ──────────────────────────────────────────────────────────────

const today = '2026-03-09'; // date of test runs
const base  = path.join(__dirname, '..', 'CPCBA-accessibility-tests', 'cpc-results', today);

function readDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

const browserFiles = readDir(path.join(base, 'browser', 'json'));
const mobileFiles  = readDir(path.join(base, 'mobile',  'json'));

// One representative per page
const browserByPage = {};
const mobileByPage  = {};
for (const d of browserFiles) {
  if (d.browser === 'chromium' || !browserByPage[d.page]) browserByPage[d.page] = d;
}
for (const d of mobileFiles) {
  if (d.browser === 'iPhone 15 Pro' || !mobileByPage[d.page]) mobileByPage[d.page] = d;
}

const PAGE_ORDER = [
  'CPC Page','Info Page','My Basket Modal','Sign In Modal',
  'Details and Payment','Details and Payment - Pay','Details and Payment - Verified',
  'Pay by Card','Booking Confirmation','Add Attendees','Add Attendee - Edit Form',
  'View Booked Courses','User Profile','Sign Out Page',
];

// ── build document sections ───────────────────────────────────────────────────

const children = [];

// Title
children.push(new Paragraph({
  heading: HeadingLevel.TITLE,
  spacing: { after: 200 },
  children: [bold('CPCBA — Browser vs Mobile Accessibility Comparison')],
}));

children.push(new Paragraph({
  spacing: { after: 100 },
  children: [normal(`Test date: ${today}  |  Browser baseline: Chrome  |  Mobile baseline: iPhone 15 Pro`)],
}));

// Legend
children.push(new Paragraph({
  spacing: { before: 200, after: 80 },
  children: [bold('Platform key')],
}));

const legendTable = new Table({
  width: { size: 4500, type: WidthType.DXA },
  rows: [
    new TableRow({ children: [
      cell('BOTH',   { bg: PLATFORM_COLOUR.both,    bold: true, width: 1400 }),
      cell('Violation present on browser AND mobile', { width: 3100 }),
    ]}),
    new TableRow({ children: [
      cell('BROWSER', { bg: PLATFORM_COLOUR.browser, bold: true, width: 1400 }),
      cell('Browser only — not detected on mobile',   { width: 3100 }),
    ]}),
    new TableRow({ children: [
      cell('MOBILE',  { bg: PLATFORM_COLOUR.mobile,  bold: true, width: 1400 }),
      cell('Mobile only — not detected on browser',   { width: 3100 }),
    ]}),
  ],
});
children.push(legendTable);
children.push(new Paragraph({ spacing: { before: 300, after: 0 }, children: [new TextRun('')] }));

// Per-page tables
for (const page of PAGE_ORDER) {
  const b = browserByPage[page];
  const m = mobileByPage[page];
  if (!b || !m) continue;

  const bIds = new Set(b.violations.map(v => v.id));
  const mIds = new Set(m.violations.map(v => v.id));
  const both   = [...bIds].filter(id => mIds.has(id));
  const bOnly  = [...bIds].filter(id => !mIds.has(id));
  const mOnly  = [...mIds].filter(id => !bIds.has(id));

  // Page heading
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 100 },
    children: [bold(page)],
  }));

  // Counts summary line
  const bTotal = b.violations.length;
  const mTotal = m.violations.length;
  children.push(new Paragraph({
    spacing: { after: 120 },
    children: [
      normal(`Browser: ${bTotal} violation${bTotal !== 1 ? 's' : ''}   |   Mobile: ${mTotal} violation${mTotal !== 1 ? 's' : ''}   |   `),
      bold(`Shared: ${both.length}  `),
      bOnly.length ? normal(`  Browser-only: ${bOnly.length}  `) : new TextRun(''),
      mOnly.length ? normal(`  Mobile-only: ${mOnly.length}`) : new TextRun(''),
    ],
  }));

  if (bTotal === 0 && mTotal === 0) {
    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [normal('No violations on either platform.')],
    }));
    continue;
  }

  // Column header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell('Platform', { bg: 'E0E0E0', bold: true, width: 1300 }),
      cell('Severity',  { bg: 'E0E0E0', bold: true, width: 1200 }),
      cell('Rule ID',   { bg: 'E0E0E0', bold: true, width: 2200 }),
      cell('Description', { bg: 'E0E0E0', bold: true, width: 4500 }),
    ],
  });

  const rows = [headerRow];

  // Helper to sort violations by severity
  const sortedIds = (ids, source) => {
    return [...ids].sort((a, b) => {
      const vA = source.violations.find(x => x.id === a);
      const vB = source.violations.find(x => x.id === b);
      return SEVERITY_ORDER.indexOf(vA?.impact) - SEVERITY_ORDER.indexOf(vB?.impact);
    });
  };

  for (const id of sortedIds(both, b)) {
    const v = b.violations.find(x => x.id === id);
    rows.push(new TableRow({ children: [
      cell('BOTH',      { bg: PLATFORM_COLOUR.both,    bold: true }),
      cell(v.impact.charAt(0).toUpperCase() + v.impact.slice(1), { bg: SEVERITY_COLOUR[v.impact] }),
      cell(id),
      cell(v.description),
    ]}));
  }
  for (const id of sortedIds(bOnly, b)) {
    const v = b.violations.find(x => x.id === id);
    rows.push(new TableRow({ children: [
      cell('BROWSER',   { bg: PLATFORM_COLOUR.browser, bold: true }),
      cell(v.impact.charAt(0).toUpperCase() + v.impact.slice(1), { bg: SEVERITY_COLOUR[v.impact] }),
      cell(id),
      cell(v.description),
    ]}));
  }
  for (const id of sortedIds(mOnly, m)) {
    const v = m.violations.find(x => x.id === id);
    rows.push(new TableRow({ children: [
      cell('MOBILE',    { bg: PLATFORM_COLOUR.mobile,  bold: true }),
      cell(v.impact.charAt(0).toUpperCase() + v.impact.slice(1), { bg: SEVERITY_COLOUR[v.impact] }),
      cell(id),
      cell(v.description),
    ]}));
  }

  children.push(new Table({
    width: { size: 9200, type: WidthType.DXA },
    rows,
  }));
}

// ── write file ────────────────────────────────────────────────────────────────

const doc = new Document({ sections: [{ children }] });

const outPath = path.join(__dirname, '..', 'CPCBA-Browser-vs-Mobile-Comparison.docx');

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('Saved: ' + outPath);
});
