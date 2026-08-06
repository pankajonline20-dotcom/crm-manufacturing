const express = require('express');
const { db } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.use(adminOnly);

// Utility to get date range
const getDateRange = (period = 'today') => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (period) {
    case 'today':
      return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
    case 'yesterday':
      return { start: yesterday.toISOString().split('T')[0], end: yesterday.toISOString().split('T')[0] };
    case 'this_week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
    case 'this_month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
    default:
      return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
  }
};

// KPI Cards Data
router.get('/kpis', (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { start, end } = getDateRange(period);

    // Revenue from payments
    const revenueToday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE payment_date = ? AND status = 'completed'
    `).get(start);

    const revenueYesterday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE payment_date = ? AND status = 'completed'
    `).get(new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]);

    // Expenses
    const expensesToday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM daily_expenses
      WHERE expense_date = ?
    `).get(start);

    const expensesYesterday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM daily_expenses
      WHERE expense_date = ?
    `).get(new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]);

    // Production metrics
    const productionMetrics = db.prepare(`
      SELECT stage, COUNT(*) as count
      FROM production_stages
      WHERE DATE(started_at) = ?
      GROUP BY stage
    `).all(start);

    const productionToday = productionMetrics.reduce((acc, m) => acc + m.count, 0);

    // Calls
    const callsToday = db.prepare(`
      SELECT COUNT(*) as count
      FROM call_logs
      WHERE DATE(called_at) = ?
    `).get(start);

    // Quotations
    const quotationsToday = db.prepare(`
      SELECT COUNT(*) as count
      FROM quotations
      WHERE DATE(created_at) = ?
    `).get(start);

    // Deliveries
    const deliveriesToday = db.prepare(`
      SELECT COUNT(*) as count
      FROM deliveries
      WHERE DATE(dispatched_at) = ?
    `).get(start);

    // Orders
    const ordersToday = db.prepare(`
      SELECT COUNT(*) as count
      FROM deliveries
      WHERE DATE(created_at) = ?
    `).get(start);

    // Calculate trends
    const revenueTrend = revenueYesterday.total > 0
      ? Math.round(((revenueToday.total - revenueYesterday.total) / revenueYesterday.total) * 100)
      : 0;

    const expenseTrend = expensesYesterday.total > 0
      ? Math.round(((expensesToday.total - expensesYesterday.total) / expensesYesterday.total) * 100)
      : 0;

    const profit = revenueToday.total - expensesToday.total;
    const profitTrend = (revenueYesterday.total - expensesYesterday.total) > 0
      ? Math.round(((profit - (revenueYesterday.total - expensesYesterday.total)) / (revenueYesterday.total - expensesYesterday.total)) * 100)
      : 0;

    res.json({
      period,
      today: {
        revenue: revenueToday.total,
        expenses: expensesToday.total,
        profit,
        orders: ordersToday.count,
        calls: callsToday.count,
        quotations: quotationsToday.count,
        deliveries: deliveriesToday.count,
        production: productionToday,
      },
      trends: {
        revenue: revenueTrend,
        expenses: expenseTrend,
        profit: profitTrend,
      }
    });
  } catch (err) {
    console.error('KPIs error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Business Health Score
router.get('/business-health', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Revenue achievement (target: 1L per day)
    const revenueToday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE payment_date = ? AND status = 'completed'
    `).get(today);
    const revenueScore = Math.min(100, (revenueToday.total / 100000) * 100);

    // Production completion
    const productionCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM production_stages
      WHERE DATE(completed_at) = ? AND status = 'completed'
    `).get(today);
    const productionPending = db.prepare(`
      SELECT COUNT(*) as count FROM production_stages
      WHERE status = 'pending' OR status = 'in_progress'
    `).get();
    const productionScore = productionPending.count > 0
      ? Math.max(0, 100 - (productionPending.count * 5))
      : 100;

    // Dispatch completion
    const dispatchCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM deliveries
      WHERE DATE(dispatched_at) = ?
    `).get(today);
    const dispatchScore = dispatchCompleted.count > 0 ? 100 : 50;

    // Sales performance
    const callsToday = db.prepare(`
      SELECT COUNT(*) as count FROM call_logs WHERE DATE(called_at) = ?
    `).get(today);
    const salesScore = Math.min(100, (callsToday.count / 20) * 100);

    // Cash flow
    const cashInToday = revenueToday.total;
    const cashOutToday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM daily_expenses WHERE expense_date = ?
    `).get(today);
    const cashFlowScore = cashInToday >= cashOutToday.total ? 100 : 50;

    // Pending orders
    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM deliveries WHERE status != 'delivered' AND status != 'cancelled'
    `).get();
    const pendingScore = Math.max(0, 100 - (pendingOrders.count * 2));

    // Testing backlog
    const testingBacklog = db.prepare(`
      SELECT COUNT(*) as count FROM production_stages WHERE stage = 'testing' AND status != 'completed'
    `).get();
    const testingScore = Math.max(0, 100 - (testingBacklog.count * 3));

    const scores = [
      revenueScore,
      productionScore,
      dispatchScore,
      salesScore,
      cashFlowScore,
      pendingScore,
      testingScore
    ];

    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const healthLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Fair' : 'Poor';

    res.json({
      score: overallScore,
      label: healthLabel,
      breakdown: {
        revenue: Math.round(revenueScore),
        production: Math.round(productionScore),
        dispatch: Math.round(dispatchScore),
        sales: Math.round(salesScore),
        cashFlow: Math.round(cashFlowScore),
        pending: Math.round(pendingScore),
        testing: Math.round(testingScore),
      }
    });
  } catch (err) {
    console.error('Health score error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Finance Dashboard
router.get('/finance', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Revenue
    const revenueTodayData = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE payment_date = ? AND status = 'completed'
    `).get(today);

    const revenueMonthData = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE payment_date >= ? AND status = 'completed'
    `).get(monthStart);

    // Expenses
    const expensesToday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM daily_expenses WHERE expense_date = ?
    `).get(today);

    const expensesMonth = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM daily_expenses WHERE expense_date >= ?
    `).get(monthStart);

    // Outstanding payments
    const outstanding = db.prepare(`
      SELECT COALESCE(SUM(q.total_amount - COALESCE(p.paid, 0)), 0) as total
      FROM quotations q
      LEFT JOIN (
        SELECT quotation_id, SUM(amount) as paid
        FROM payments
        WHERE status IN ('completed', 'pending')
        GROUP BY quotation_id
      ) p ON q.id = p.quotation_id
      WHERE q.status IN ('sent', 'accepted')
    `).get();

    // 7-day revenue trend
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const data = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM payments
        WHERE payment_date = ? AND status = 'completed'
      `).get(dateStr);
      revenueTrend.push({ date: dateStr, value: data.total });
    }

    res.json({
      today: {
        revenue: revenueTodayData.total,
        expenses: expensesToday.total,
        profit: revenueTodayData.total - expensesToday.total,
      },
      month: {
        revenue: revenueMonthData.total,
        expenses: expensesMonth.total,
        profit: revenueMonthData.total - expensesMonth.total,
      },
      outstanding: outstanding.total,
      revenueTrend,
    });
  } catch (err) {
    console.error('Finance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Production Pipeline
router.get('/production-pipeline', (req, res) => {
  try {
    const stages = ['welding', 'coating', 'fitting', 'testing', 'dispatch'];
    const pipeline = {};

    stages.forEach(stage => {
      const data = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM production_stages
        WHERE stage = ?
      `).get(stage);

      pipeline[stage] = {
        total: data.total,
        completed: data.completed || 0,
        in_progress: data.in_progress || 0,
        pending: data.pending || 0,
        completionPercent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      };
    });

    res.json(pipeline);
  } catch (err) {
    console.error('Pipeline error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Department Productivity
router.get('/department-productivity', (req, res) => {
  try {
    const departments = {
      welding: { label: 'Welding' },
      coating: { label: 'Coating' },
      fitting: { label: 'Fitting' },
      testing: { label: 'Testing' },
      dispatch: { label: 'Dispatch' },
    };

    Object.keys(departments).forEach(dept => {
      const data = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          COUNT(DISTINCT worker_id) as workers
        FROM production_stages
        WHERE stage = ?
      `).get(dept);

      departments[dept].completed = data.completed || 0;
      departments[dept].pending = (data.total || 0) - (data.completed || 0);
      departments[dept].efficiency = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      departments[dept].workers = data.workers || 0;
    });

    res.json(departments);
  } catch (err) {
    console.error('Productivity error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sales Metrics
router.get('/sales-metrics', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const callsToday = db.prepare(`SELECT COUNT(*) as count FROM call_logs WHERE DATE(called_at) = ?`).get(today);
    const callsMonth = db.prepare(`SELECT COUNT(*) as count FROM call_logs WHERE DATE(called_at) >= ?`).get(monthStart);

    const quotationsToday = db.prepare(`SELECT COUNT(*) as count FROM quotations WHERE DATE(created_at) = ?`).get(today);
    const quotationsMonth = db.prepare(`SELECT COUNT(*) as count FROM quotations WHERE DATE(created_at) >= ?`).get(monthStart);

    const ordersMonth = db.prepare(`SELECT COUNT(*) as count FROM deliveries WHERE DATE(dispatched_at) >= ?`).get(monthStart);

    const conversionRate = callsMonth.count > 0 ? Math.round((ordersMonth.count / callsMonth.count) * 100) : 0;

    // Top performers
    const topSalespeople = db.prepare(`
      SELECT u.name, COUNT(cl.id) as calls, COUNT(DISTINCT d.id) as orders
      FROM users u
      LEFT JOIN call_logs cl ON u.id = cl.user_id AND DATE(cl.called_at) >= ?
      LEFT JOIN deliveries d ON u.id = d.lead_id AND DATE(d.dispatched_at) >= ?
      WHERE u.role = 'agent'
      GROUP BY u.id
      ORDER BY calls DESC
      LIMIT 5
    `).all(monthStart, monthStart);

    res.json({
      calls: { today: callsToday.count, month: callsMonth.count },
      quotations: { today: quotationsToday.count, month: quotationsMonth.count },
      orders: { month: ordersMonth.count },
      conversionRate,
      topSalespeople,
    });
  } catch (err) {
    console.error('Sales metrics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Orders Summary
router.get('/orders-summary', (req, res) => {
  try {
    const statuses = ['new', 'in_production', 'testing', 'ready', 'dispatched', 'delivered', 'cancelled'];
    const summary = {};

    statuses.forEach(status => {
      const data = db.prepare(`
        SELECT COUNT(*) as count FROM deliveries WHERE status = ?
      `).get(status);
      summary[status] = data.count;
    });

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'
    `).get();

    const pendingRevenue = db.prepare(`
      SELECT COALESCE(SUM(q.total_amount), 0) as total FROM quotations q
      WHERE q.status IN ('sent', 'accepted')
    `).get();

    res.json({
      summary,
      totalRevenue: totalRevenue.total,
      pendingRevenue: pendingRevenue.total,
    });
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Activity Log
router.get('/activity-log', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const activities = db.prepare(`
      SELECT * FROM activity_log
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);

    res.json(activities);
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Alerts
router.get('/alerts', (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT * FROM alerts
      WHERE is_resolved = 0
      ORDER BY created_at DESC
    `).all();

    res.json(alerts);
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Expense Breakdown
router.get('/expenses-breakdown', (req, res) => {
  try {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const breakdown = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM daily_expenses
      WHERE expense_date >= ?
      GROUP BY category
      ORDER BY total DESC
    `).all(monthStart);

    res.json(breakdown);
  } catch (err) {
    console.error('Expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Log Activity (internal helper)
router.post('/log-activity', (req, res) => {
  try {
    const { action, entityType, entityId, details } = req.body;
    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, action, entityType, entityId, details);

    res.json({ success: true });
  } catch (err) {
    console.error('Log activity error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
