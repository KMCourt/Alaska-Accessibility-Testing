/**
 * ===========================================
 * TEAMS NOTIFICATION
 * ===========================================
 * Posts accessibility scan results to a
 * Microsoft Teams channel via Power Automate webhook.
 * ===========================================
 */

async function postToTeams({ webhookUrl, summaryData, today, regressions }) {
  if (!webhookUrl) {
    console.log('\n⚠️  No Teams webhook URL found — skipping notification.');
    console.log('   Add TEAMS_WEBHOOK_URL to your .env file to enable Teams notifications.');
    return;
  }

  const totalViolations = summaryData.reduce((s, r) => s + r.total, 0);
  const hasRegressions = regressions && regressions.length > 0;

  const rows = summaryData.map(r => ({
    page: r.page,
    browser: r.browser,
    total: r.total,
    critical: r.critical,
    serious: r.serious,
    moderate: r.moderate,
    minor: r.minor,
    regression: regressions?.some(x => x.page === r.page && x.browser === r.browser) ? '⚠️ Yes' : 'No',
  }));

  const message = {
    title: `♿ Accessibility Scan — ${today}`,
    summary: `TTC Accessibility scan completed for ${today}`,
    totalViolations,
    hasRegressions,
    regressions: hasRegressions
      ? regressions.map(r => `${r.page} (${r.browser})`).join(', ')
      : 'None',
    results: rows,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('\n✅ Teams notification sent successfully.');
    } else {
      console.log(`\n⚠️  Teams notification failed — status: ${response.status}`);
    }
  } catch (err) {
    console.log(`\n⚠️  Teams notification error: ${err.message}`);
  }
}

module.exports = { postToTeams };