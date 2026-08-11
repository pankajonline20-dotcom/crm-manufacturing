const express = require('express');
const { db } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminOnly);

router.get('/summary', (req, res) => {
  const { period = 'month' } = req.query;
  const days = period === 'week' ? 7 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get();
  const newLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE created_at >= ?').get(since);
  const wonLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'won'").get();
  const conversionRate = totalLeads.count > 0 ? Math.round((wonLeads.count / totalLeads.count) * 100) : 0;

  const pipelineValue = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as value FROM quotations WHERE status IN ('sent','accepted')
  `).get();

  const pendingPayments = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as value FROM payments WHERE status = 'pending'
  `).get();

  const sourceBreakdown = db.prepare(`
    SELECT source, COUNT(*) as count FROM leads WHERE created_at >= ? GROUP BY source
  `).all(since);

  const statusBreakdown = db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();

  const topAgents = db.prepare(`
    SELECT u.name, COUNT(l.id) as leads_won
    FROM users u
    LEFT JOIN leads l ON l.assigned_to = u.id AND l.status = 'won'
    GROUP BY u.id ORDER BY leads_won DESC LIMIT 5
  `).all();

  res.json({
    total_leads: totalLeads.count,
    new_leads_period: newLeads.count,
    won_leads: wonLeads.count,
    conversion_rate: conversionRate,
    pipeline_value: pipelineValue.value,
    pending_payments: pendingPayments.value,
    source_breakdown: sourceBreakdown,
    status_breakdown: statusBreakdown,
    top_agents: topAgents
  });
});

router.get('/pipeline', (req, res) => {
  const pipeline = db.prepare(`
    SELECT l.status, COUNT(*) as count, COALESCE(SUM(q.total_amount), 0) as value
    FROM leads l
    LEFT JOIN quotations q ON q.lead_id = l.id AND q.status IN ('sent','accepted')
    GROUP BY l.status
  `).all();

  const monthlyLeads = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM leads
    WHERE created_at >= date('now', '-6 months')
    GROUP BY month ORDER BY month ASC
  `).all();

  res.json({ pipeline, monthly_leads: monthlyLeads });
});

// Leads by agent (who created them)
router.get('/leads-by-agent', (req, res) => {
  const thisMonth = new Date().toISOString().slice(0, 7);

  const data = db.prepare(`
    SELECT
      u.id   AS agent_id,
      u.name AS agent_name,
      COUNT(l.id) AS total_leads,
      SUM(CASE WHEN strftime('%Y-%m', l.created_at) = ? THEN 1 ELSE 0 END) AS this_month,
      SUM(CASE WHEN l.status = 'won' THEN 1 ELSE 0 END) AS won,
      SUM(CASE WHEN l.status IN ('interested', 'quoted', 'negotiating') THEN 1 ELSE 0 END) AS pipeline
    FROM users u
    LEFT JOIN leads l ON l.created_by = u.id AND l.is_deleted = 0
    WHERE u.is_deleted = 0
    GROUP BY u.id, u.name
    ORDER BY total_leads DESC
  `).all(thisMonth);

  res.json(data);
});

module.exports = router;
