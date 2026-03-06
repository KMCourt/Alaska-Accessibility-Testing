/**
 * ===========================================
 * HTML REPORT GENERATOR
 * ===========================================
 * Generates a detailed HTML report for each
 * page/browser accessibility scan.
 * ===========================================
 */

const fs = require('fs');
const path = require('path');

function generateHtmlReport({
  pageDef,
  browserName,
  results,
  screenshotPath,
  elementScreenshots = {},
  reportPath,
  previousCounts,
  isMobile = false,
}) {
  const today = new Date().toLocaleString('en-GB');

  const counts = {
    total:    results.violations.length,
    critical: results.violations.filter(v => v.impact === 'critical').length,
    serious:  results.violations.filter(v => v.impact === 'serious').length,
    moderate: results.violations.filter(v => v.impact === 'moderate').length,
    minor:    results.violations.filter(v => v.impact === 'minor').length,
  };

  const trend = previousCounts
    ? counts.total > previousCounts.total
      ? `<span style="color:#cc0000">▲ +${counts.total - previousCounts.total} from last run</span>`
      : counts.total < previousCounts.total
      ? `<span style="color:#2e7d32">▼ -${previousCounts.total - counts.total} from last run</span>`
      : `<span style="color:#555">= Same as last run</span>`
    : `<span style="color:#555">First run — no previous data</span>`;

  const screenshotRelative = screenshotPath
    ? path.relative(path.dirname(reportPath), screenshotPath).replace(/\\/g, '/')
    : null;

  const violationsHtml = results.violations.map(v => {
    const shots = (elementScreenshots[v.id] || [])
      .filter(Boolean)
      .map(s => {
        const rel = path.relative(path.dirname(reportPath), s).replace(/\\/g, '/');
        return `<img src="${rel}" alt="Element screenshot" style="max-width:100%;border:1px solid #ddd;margin:4px 0;border-radius:4px;">`;
      }).join('');

    const nodesHtml = v.nodes.map(n => `
      <div style="background:#f5f5f5;padding:8px;border-radius:4px;margin:4px 0;font-size:12px;">
        <strong>Target:</strong> ${n.target?.join(', ') || 'N/A'}<br>
        <strong>HTML:</strong> <code style="word-break:break-all">${n.html?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''}</code><br>
        ${n.failureSummary ? `<strong>Fix:</strong> ${n.failureSummary}` : ''}
      </div>
    `).join('');

    const impactColour = {
      critical: '#cc0000',
      serious:  '#e65100',
      moderate: '#f9a825',
      minor:    '#558b2f',
    }[v.impact] || '#555';

    return `
      <div style="border:1px solid #ddd;border-radius:6px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:15px;">${v.id}</h3>
          <span style="background:${impactColour};color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:bold;">${v.impact}</span>
        </div>
        <p style="margin:8px 0;color:#444;">${v.description}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>WCAG:</strong> ${v.tags?.filter(t => t.startsWith('wcag')).join(', ') || 'N/A'}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Affected elements:</strong> ${v.nodes.length}</p>
        <details style="margin-top:8px;">
          <summary style="cursor:pointer;font-size:13px;color:#0b3c6e;">View affected elements</summary>
          <div style="margin-top:8px;">${nodesHtml}</div>
        </details>
        ${shots ? `<div style="margin-top:8px;">${shots}</div>` : ''}
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report — ${pageDef.name} (${browserName})</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 24px; color: #222; }
    h1 { background: #0b3c6e; color: white; padding: 20px; border-radius: 6px; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-card { background: #f5f5f5; border-radius: 6px; padding: 16px; text-align: center; }
    .summary-card .number { font-size: 32px; font-weight: bold; }
    .summary-card .label { font-size: 12px; color: #666; margin-top: 4px; }
    .critical { color: #cc0000; }
    .serious  { color: #e65100; }
    .moderate { color: #f9a825; }
    .minor    { color: #558b2f; }
    .meta { background: #f9f9f9; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-size: 14px; }
    .meta p { margin: 4px 0; }
  </style>
</head>
<body>
  <h1>♿ Accessibility Report${isMobile ? ' — Mobile' : ''}</h1>

  <div class="meta">
    <p><strong>Page:</strong> ${pageDef.name}</p>
    <p><strong>URL:</strong> <a href="${pageDef.url}">${pageDef.url}</a></p>
    <p><strong>Browser:</strong> ${browserName}${isMobile ? ' (Mobile)' : ''}</p>
    <p><strong>Standard:</strong> WCAG 2.2 AA</p>
    <p><strong>Generated:</strong> ${today}</p>
    <p><strong>Trend:</strong> ${trend}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="number">${counts.total}</div>
      <div class="label">Total</div>
    </div>
    <div class="summary-card">
      <div class="number critical">${counts.critical}</div>
      <div class="label">Critical</div>
    </div>
    <div class="summary-card">
      <div class="number serious">${counts.serious}</div>
      <div class="label">Serious</div>
    </div>
    <div class="summary-card">
      <div class="number moderate">${counts.moderate}</div>
      <div class="label">Moderate</div>
    </div>
    <div class="summary-card">
      <div class="number minor">${counts.minor}</div>
      <div class="label">Minor</div>
    </div>
  </div>

  ${screenshotRelative ? `
  <h2>Page Screenshot</h2>
  <img src="${screenshotRelative}" alt="Page screenshot" style="max-width:100%;border:1px solid #ddd;border-radius:6px;margin-bottom:24px;">
  ` : ''}

  <h2>Violations (${counts.total})</h2>
  ${counts.total === 0
    ? '<p style="color:#2e7d32;font-weight:bold;">✅ No violations found!</p>'
    : violationsHtml
  }

  <p style="color:#888;font-size:12px;margin-top:40px;border-top:1px solid #eee;padding-top:16px;">
    Generated by TTC Accessibility Test Suite — ${today}
  </p>
</body>
</html>`;

  fs.writeFileSync(reportPath, html, 'utf8');
}

module.exports = { generateHtmlReport };