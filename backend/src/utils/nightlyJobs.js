const cron = require('node-cron');
const { db } = require('../database');
const { calculateHealthScore } = require('./customerHealth');
const { runBoardMeeting } = require('./runBoardMeeting');

function runCustomerHealth() {
  const wonLeads = db.prepare("SELECT * FROM leads WHERE status='won'").all();
  for (const lead of wonLeads) {
    const payments = db.prepare('SELECT * FROM payments WHERE lead_id=?').all(lead.id);
    const existing = db.prepare('SELECT * FROM customer_health WHERE lead_id=?').get(lead.id);
    const customer = existing || { payment_delays: 0, complaints: 0, referrals_given: 0, repurchase_count: 0, last_interaction_at: lead.updated_at };
    const { score, label } = calculateHealthScore(customer, payments);
    if (existing) {
      db.prepare('UPDATE customer_health SET health_score=?, health_label=?, score_updated_at=CURRENT_TIMESTAMP WHERE lead_id=?').run(score, label, lead.id);
    } else {
      db.prepare('INSERT INTO customer_health (lead_id, health_score, health_label, last_interaction_at) VALUES (?,?,?,?)').run(lead.id, score, label, lead.updated_at);
    }
  }
  console.log(`[CRON] Updated health for ${wonLeads.length} customers`);
}

function startNightlyJobs() {
  // Run once on startup too
  setTimeout(() => {
    runCustomerHealth();
  }, 3000);

  // Nightly at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('[CRON] Running nightly jobs...');
    runCustomerHealth();
    console.log('[CRON] Done.');
  });

  // Daily board meeting at 9:00 AM (Mon-Sat)
  cron.schedule('0 9 * * 1-6', async () => {
    try {
      console.log('[CRON] Starting daily board meeting...');
      await runBoardMeeting(db, 'daily');
      console.log('[CRON] Daily board meeting complete.');
    } catch (err) {
      console.error('[CRON] Board meeting failed:', err.message);
    }
  });

  // Weekly strategic review Monday 9:30 AM
  cron.schedule('30 9 * * 1', async () => {
    try {
      console.log('[CRON] Starting weekly board meeting...');
      await runBoardMeeting(db, 'weekly');
      console.log('[CRON] Weekly board meeting complete.');
    } catch (err) {
      console.error('[CRON] Weekly board meeting failed:', err.message);
    }
  });

  // Monthly review 1st of month 10 AM
  cron.schedule('0 10 1 * *', async () => {
    try {
      console.log('[CRON] Starting monthly board meeting...');
      await runBoardMeeting(db, 'monthly');
      console.log('[CRON] Monthly board meeting complete.');
    } catch (err) {
      console.error('[CRON] Monthly board meeting failed:', err.message);
    }
  });

  console.log('Nightly jobs scheduled (runs at midnight daily). Board meetings scheduled (daily 9am, weekly Monday, monthly 1st).');
}

module.exports = { startNightlyJobs };
