/**
 * ===========================================
 * TREND TRACKER
 * ===========================================
 * Tracks accessibility violation counts over time.
 * Saves a history JSON file and compares runs to
 * detect regressions (more violations than last run).
 * ===========================================
 */

const fs = require('fs');
const path = require('path');

// Default history file — kept for backwards compatibility.
// Pass a custom historyFile path to each function to keep suites separate.
const DEFAULT_HISTORY_FILE = path.join(__dirname, '..', 'trend-history.json');

// Load existing history or start fresh
function loadHistory(historyFile = DEFAULT_HISTORY_FILE) {
  if (fs.existsSync(historyFile)) {
    try {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Save history back to file
function saveHistory(history, historyFile = DEFAULT_HISTORY_FILE) {
  const dir = path.dirname(historyFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
}

// Get the violation counts from the previous run for a given page + browser
function getPreviousCounts(pageName, browserName, historyFile = DEFAULT_HISTORY_FILE) {
  const history = loadHistory(historyFile);
  const key = `${pageName}__${browserName}`;
  const runs = history[key];
  if (!runs || runs.length === 0) return null;
  return runs[runs.length - 1].counts;
}

// Record the current run in history
function recordRun({ page, browser, counts, historyFile = DEFAULT_HISTORY_FILE }) {
  const history = loadHistory(historyFile);
  const key = `${page}__${browser}`;
  if (!history[key]) history[key] = [];
  history[key].push({
    date: new Date().toISOString(),
    counts,
  });
  // Keep only last 10 runs per page/browser
  if (history[key].length > 10) history[key] = history[key].slice(-10);
  saveHistory(history, historyFile);
}

// Returns true if current total is higher than previous (regression)
function isRegression(previousCounts, currentTotal) {
  if (!previousCounts) return false;
  return currentTotal > previousCounts.total;
}

// Remove runs older than retentionDays from the history file.
// Keys with no remaining runs are deleted entirely.
function pruneHistory(historyFile = DEFAULT_HISTORY_FILE, retentionDays = 90) {
  const history = loadHistory(historyFile);
  if (Object.keys(history).length === 0) return;

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let pruned = 0;

  for (const key of Object.keys(history)) {
    const before = history[key].length;
    history[key] = history[key].filter(run => new Date(run.date).getTime() >= cutoff);
    pruned += before - history[key].length;
    if (history[key].length === 0) delete history[key];
  }

  if (pruned > 0) {
    saveHistory(history, historyFile);
    console.log(`🗑️  Trend history: removed ${pruned} run(s) older than ${retentionDays} days from ${path.basename(historyFile)}`);
  }
}

module.exports = { getPreviousCounts, recordRun, isRegression, pruneHistory };