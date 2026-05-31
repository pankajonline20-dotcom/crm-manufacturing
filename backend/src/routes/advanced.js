const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { calculateHealthScore } = require('../utils/customerHealth');

const router = express.Router();
router.use(authMiddleware);

// ─── MODULE 1: GOALS ─────────────────────────────────────────────────────────

router.get('/goals/current', (req, res) => {
  const month = new Date().toISOString().slice(0, 7);
  const goals = db.prepare('SELECT * FROM goals WHERE month = ?').all(month);

  const wonLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE status='won' AND strftime('%Y-%m',updated_at)=?`).get(month);
  const revenue  = db.prepare(`SELECT COALESCE(SUM(total_amount),0) as total FROM quotations WHERE status='accepted' AND strftime('%Y-%m',created_at)=?`).get(month);
  const calls    = db.prepare(`SELECT COUNT(*) as count FROM call_logs WHERE strftime('%Y-%m',called_at)=?`).get(month);
  const quotes   = db.prepare(`SELECT COUNT(*) as count FROM quotations WHERE strftime('%Y-%m',created_at)=?`).get(month);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysElapsed = today.getDate();
  const dailyRate = (revenue.total || 0) / Math.max(daysElapsed, 1);
  const forecast = Math.round(dailyRate * daysInMonth);

  res.json({
    month, goals,
    actual: { deals: wonLeads.count, revenue: revenue.total, calls: calls.count, quotes: quotes.count },
    forecast, daysElapsed, daysInMonth
  });
});

router.get('/goals', adminOnly, (req, res) => {
  const { month } = req.query;
  const goals = month
    ? db.prepare('SELECT * FROM goals WHERE month = ?').all(month)
    : db.prepare('SELECT * FROM goals ORDER BY month DESC LIMIT 20').all();
  res.json(goals);
});

router.post('/goals', adminOnly, (req, res) => {
  const { month, type, target_value, user_id } = req.body;
  if (!month || !type || !target_value) return res.status(400).json({ error: 'month, type, target_value required' });
  db.prepare('DELETE FROM goals WHERE month=? AND type=? AND (user_id=? OR (user_id IS NULL AND ? IS NULL))').run(month, type, user_id || null, user_id || null);
  const result = db.prepare('INSERT INTO goals (user_id, month, type, target_value, created_by) VALUES (?,?,?,?,?)').run(user_id || null, month, type, target_value, req.user.id);
  res.json(db.prepare('SELECT * FROM goals WHERE id=?').get(result.lastInsertRowid));
});

// ─── MODULE 3: BUSINESS INTELLIGENCE ─────────────────────────────────────────

router.get('/bi/summary', adminOnly, (req, res) => {
  const period = Math.min(parseInt(req.query.period) || 30, 365);
  const since = new Date(Date.now() - period * 86400000).toISOString();

  const revenueByCity = db.prepare(`
    SELECT l.city, COALESCE(SUM(q.total_amount),0) as revenue, COUNT(*) as deal_count
    FROM quotations q JOIN leads l ON q.lead_id = l.id
    WHERE q.status='accepted' AND q.created_at >= ? AND l.city IS NOT NULL AND l.city != ''
    GROUP BY l.city ORDER BY revenue DESC LIMIT 10
  `).all(since);

  const leadsBySource = db.prepare(`
    SELECT source, COUNT(*) as count,
      SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won
    FROM leads WHERE created_at >= ?
    GROUP BY source ORDER BY count DESC
  `).all(since);

  const avgDealByMonth = db.prepare(`
    SELECT strftime('%Y-%m',created_at) as month,
      ROUND(AVG(total_amount),0) as avg_deal, COUNT(*) as deals
    FROM quotations WHERE status='accepted'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all();

  const funnel = db.prepare(`
    SELECT status, COUNT(*) as count FROM leads WHERE created_at >= ? GROUP BY status
  `).all(since);

  const agentPerformance = db.prepare(`
    SELECT u.name, COUNT(cl.id) as calls, COUNT(DISTINCT cl.lead_id) as leads_called
    FROM call_logs cl JOIN users u ON cl.user_id = u.id
    WHERE cl.called_at >= ? GROUP BY u.id ORDER BY calls DESC
  `).all(since);

  const revenueByMachine = db.prepare(`
    SELECT q.items, q.total_amount FROM quotations q WHERE q.status='accepted' AND q.created_at >= ?
  `).all(since).reduce((acc, q) => {
    try {
      const items = JSON.parse(q.items);
      items.forEach(item => {
        const key = item.model_name || 'Unknown';
        if (!acc[key]) acc[key] = { model: key, revenue: 0, deal_count: 0 };
        acc[key].revenue += (item.unit_price * item.qty * (1 + item.gst / 100));
        acc[key].deal_count += 1;
      });
    } catch {}
    return acc;
  }, {});

  res.json({
    revenueByMachine: Object.values(revenueByMachine).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    revenueByCity, leadsBySource,
    avgDealByMonth: [...avgDealByMonth].reverse(),
    funnel, agentPerformance, period
  });
});

// ─── MODULE 4: COMPETITOR TRACKER ────────────────────────────────────────────

router.put('/leads/:id/lost', (req, res) => {
  const { lost_to_competitor, lost_reason, lost_their_price, lost_notes } = req.body;
  db.prepare(`UPDATE leads SET status='lost', lost_to_competitor=?, lost_reason=?, lost_their_price=?, lost_notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(lost_to_competitor || null, lost_reason || null, lost_their_price || null, lost_notes || null, req.params.id);
  res.json({ message: 'Lead marked as lost' });
});

router.get('/competitor-analysis', adminOnly, async (req, res) => {
  const lostLeads = db.prepare(`
    SELECT lost_to_competitor, lost_reason, lost_their_price, city, strftime('%Y-%m',created_at) as month
    FROM leads WHERE status='lost' AND (lost_reason IS NOT NULL OR lost_to_competitor IS NOT NULL)
    ORDER BY created_at DESC LIMIT 100
  `).all();

  const reasonCounts = {};
  const competitorCounts = {};
  lostLeads.forEach(l => {
    if (l.lost_reason) reasonCounts[l.lost_reason] = (reasonCounts[l.lost_reason] || 0) + 1;
    if (l.lost_to_competitor) competitorCounts[l.lost_to_competitor] = (competitorCounts[l.lost_to_competitor] || 0) + 1;
  });

  const totalLost = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status='lost'").get().count;
  const reasonArr = Object.entries(reasonCounts).map(([reason, count]) => ({ reason, count })).sort((a,b) => b.count - a.count);
  const competitorArr = Object.entries(competitorCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

  let analysis = null;
  if (lostLeads.length >= 3 && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const resp = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 400,
        messages: [{ role: 'user', content: `You are a sales analytics expert for a heat press machine company in India. Analyse these lost deals:\n\nReason breakdown: ${JSON.stringify(reasonCounts)}\nCompetitor breakdown: ${JSON.stringify(competitorCounts)}\nTotal lost: ${totalLost}\n\nProvide 3-4 bullet points with actionable insights. Be direct and specific. English only.` }]
      });
      analysis = resp.content[0].text;
    } catch (e) { analysis = null; }
  }

  res.json({ analysis, reasonCounts: reasonArr, competitorCounts: competitorArr, total: lostLeads.length, totalLost });
});

// ─── MODULE 5: CUSTOMER HEALTH ────────────────────────────────────────────────

function recalcCustomerHealth(leadId) {
  const lead = db.prepare("SELECT * FROM leads WHERE id=? AND status='won'").get(leadId);
  if (!lead) return;
  const payments = db.prepare('SELECT * FROM payments WHERE lead_id=?').all(leadId);
  const existing = db.prepare('SELECT * FROM customer_health WHERE lead_id=?').get(leadId);
  const customer = existing || { payment_delays: 0, complaints: 0, referrals_given: 0, repurchase_count: 0, last_interaction_at: lead.updated_at };
  const { score, label } = calculateHealthScore(customer, payments);
  if (existing) {
    db.prepare('UPDATE customer_health SET health_score=?, health_label=?, score_updated_at=CURRENT_TIMESTAMP WHERE lead_id=?').run(score, label, leadId);
  } else {
    db.prepare('INSERT INTO customer_health (lead_id, health_score, health_label, last_interaction_at) VALUES (?,?,?,?)').run(leadId, score, label, lead.updated_at);
  }
}

router.get('/customer-health', adminOnly, (req, res) => {
  const customers = db.prepare(`
    SELECT ch.*, l.name, l.phone, l.city,
      CAST((julianday('now') - julianday(ch.last_interaction_at)) AS INTEGER) as days_since_interaction
    FROM customer_health ch
    JOIN leads l ON ch.lead_id = l.id
    ORDER BY ch.health_score ASC
  `).all();
  res.json(customers);
});

router.post('/customer-health/recalculate', adminOnly, (req, res) => {
  const wonLeads = db.prepare("SELECT id FROM leads WHERE status='won'").all();
  for (const lead of wonLeads) recalcCustomerHealth(lead.id);
  res.json({ message: `Recalculated ${wonLeads.length} customers` });
});

router.put('/customer-health/:leadId', adminOnly, (req, res) => {
  const { complaints, referrals_given, repurchase_count, payment_delays } = req.body;
  const existing = db.prepare('SELECT * FROM customer_health WHERE lead_id=?').get(req.params.leadId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`UPDATE customer_health SET complaints=?, referrals_given=?, repurchase_count=?, payment_delays=? WHERE lead_id=?`)
    .run(complaints ?? existing.complaints, referrals_given ?? existing.referrals_given, repurchase_count ?? existing.repurchase_count, payment_delays ?? existing.payment_delays, req.params.leadId);
  recalcCustomerHealth(parseInt(req.params.leadId));
  res.json(db.prepare('SELECT * FROM customer_health WHERE lead_id=?').get(req.params.leadId));
});

// ─── MODULE 6: WHATSAPP BROADCAST ─────────────────────────────────────────────

router.get('/broadcasts', adminOnly, (req, res) => {
  const broadcasts = db.prepare(`
    SELECT b.*, u.name as created_by_name FROM broadcasts b
    LEFT JOIN users u ON b.created_by = u.id
    ORDER BY b.created_at DESC LIMIT 30
  `).all();
  res.json(broadcasts);
});

router.post('/broadcasts/preview', adminOnly, (req, res) => {
  const { segment_filters } = req.body;
  let query = 'SELECT COUNT(*) as count FROM leads WHERE 1=1';
  const params = [];
  try {
    const filters = typeof segment_filters === 'string' ? JSON.parse(segment_filters) : segment_filters;
    if (filters.status)      { query += ' AND status=?';       params.push(filters.status); }
    if (filters.city)        { query += ' AND city LIKE ?';    params.push(`%${filters.city}%`); }
    if (filters.source)      { query += ' AND source=?';       params.push(filters.source); }
    if (filters.score_label) { query += ' AND score_label=?';  params.push(filters.score_label); }
    if (filters.no_quote)    { query += ' AND id NOT IN (SELECT DISTINCT lead_id FROM quotations WHERE lead_id IS NOT NULL)'; }
  } catch {}
  const { count } = db.prepare(query).get(...params);
  res.json({ count });
});

router.post('/broadcasts', adminOnly, (req, res) => {
  const { name, message_template, segment_filters } = req.body;
  if (!name || !message_template) return res.status(400).json({ error: 'name and message_template required' });

  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  try {
    const filters = typeof segment_filters === 'string' ? JSON.parse(segment_filters) : (segment_filters || {});
    if (filters.status)      { query += ' AND status=?';       params.push(filters.status); }
    if (filters.city)        { query += ' AND city LIKE ?';    params.push(`%${filters.city}%`); }
    if (filters.source)      { query += ' AND source=?';       params.push(filters.source); }
    if (filters.score_label) { query += ' AND score_label=?';  params.push(filters.score_label); }
    if (filters.no_quote)    { query += ' AND id NOT IN (SELECT DISTINCT lead_id FROM quotations WHERE lead_id IS NOT NULL)'; }
  } catch {}

  const targetLeads = db.prepare(query).all(...params);
  const filters_str = typeof segment_filters === 'string' ? segment_filters : JSON.stringify(segment_filters || {});
  const broadcast = db.prepare(`INSERT INTO broadcasts (name, message_template, segment_filters, sent_count, created_by, sent_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`).run(name, message_template, filters_str, targetLeads.length, req.user.id);
  const broadcastId = broadcast.lastInsertRowid;

  const insertLog = db.prepare('INSERT INTO broadcast_logs (broadcast_id, lead_id, phone, personalised_message, wa_link) VALUES (?,?,?,?,?)');
  for (const lead of targetLeads) {
    const msg = message_template
      .replace(/\{name\}/g, lead.name.split(' ')[0])
      .replace(/\{city\}/g, lead.city || '')
      .replace(/\{phone\}/g, lead.phone);
    const waLink = `https://wa.me/91${lead.phone}?text=${encodeURIComponent(msg)}`;
    insertLog.run(broadcastId, lead.id, lead.phone, msg, waLink);
  }

  const logs = db.prepare('SELECT * FROM broadcast_logs WHERE broadcast_id=? LIMIT 5').all(broadcastId);
  res.json({ broadcast_id: broadcastId, sent_to: targetLeads.length, sample_links: logs.map(l => l.wa_link) });
});

router.get('/broadcasts/:id/logs', adminOnly, (req, res) => {
  const logs = db.prepare(`
    SELECT bl.*, l.name as lead_name FROM broadcast_logs bl
    LEFT JOIN leads l ON bl.lead_id = l.id
    WHERE bl.broadcast_id=? LIMIT 50
  `).all(req.params.id);
  res.json(logs);
});

module.exports = router;
