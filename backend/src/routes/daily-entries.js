const express = require('express');
const { db } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.use(adminOnly);

// Daily Entry (Sheet 2)
router.get('/daily-entry', (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    const entry = db.prepare(`
      SELECT * FROM daily_entries WHERE entry_date = ?
    `).get(queryDate);

    res.json(entry || {
      entry_date: queryDate,
      cash_in: 0,
      cash_out: 0,
      welding_completed: 0,
      sent_to_coating: 0,
      returned_from_coating: 0,
      fitting_completed: 0,
      testing_completed: 0,
      dispatch_count: 0,
      sales_calls: 0,
      orders_count: 0,
      remarks: ''
    });
  } catch (err) {
    console.error('Daily entry error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/daily-entry', (req, res) => {
  try {
    const {
      entry_date,
      cash_in,
      cash_out,
      welding_completed,
      sent_to_coating,
      returned_from_coating,
      fitting_completed,
      testing_completed,
      dispatch_count,
      sales_calls,
      orders_count,
      remarks
    } = req.body;

    const queryDate = entry_date || new Date().toISOString().split('T')[0];

    // Check if entry exists
    const existing = db.prepare(`
      SELECT id FROM daily_entries WHERE entry_date = ?
    `).get(queryDate);

    if (existing) {
      db.prepare(`
        UPDATE daily_entries SET
          cash_in = ?, cash_out = ?, welding_completed = ?,
          sent_to_coating = ?, returned_from_coating = ?,
          fitting_completed = ?, testing_completed = ?,
          dispatch_count = ?, sales_calls = ?, orders_count = ?, remarks = ?
        WHERE entry_date = ?
      `).run(
        cash_in || 0, cash_out || 0, welding_completed || 0,
        sent_to_coating || 0, returned_from_coating || 0,
        fitting_completed || 0, testing_completed || 0,
        dispatch_count || 0, sales_calls || 0, orders_count || 0,
        remarks || '', queryDate
      );
    } else {
      db.prepare(`
        INSERT INTO daily_entries (
          entry_date, cash_in, cash_out, welding_completed,
          sent_to_coating, returned_from_coating, fitting_completed,
          testing_completed, dispatch_count, sales_calls, orders_count, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        queryDate, cash_in || 0, cash_out || 0, welding_completed || 0,
        sent_to_coating || 0, returned_from_coating || 0,
        fitting_completed || 0, testing_completed || 0,
        dispatch_count || 0, sales_calls || 0, orders_count || 0,
        remarks || '', req.user.id
      );
    }

    res.json({ success: true, message: 'Entry saved' });
  } catch (err) {
    console.error('Save entry error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Finance (Sheet 3)
router.get('/finance', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const entries = db.prepare(`
      SELECT * FROM finance_entries
      WHERE entry_date >= ? AND entry_date <= ?
      ORDER BY entry_date DESC
    `).all(start, end);

    const totals = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END) as total_in,
        SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END) as total_out
      FROM finance_entries
      WHERE entry_date >= ? AND entry_date <= ?
    `).get(start, end);

    res.json({
      entries,
      totals: {
        cash_in: totals.total_in || 0,
        cash_out: totals.total_out || 0,
        profit: (totals.total_in || 0) - (totals.total_out || 0)
      }
    });
  } catch (err) {
    console.error('Finance error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance', (req, res) => {
  try {
    const { entry_date, type, customer_name, vendor_name, amount, category, payment_mode, remarks } = req.body;

    db.prepare(`
      INSERT INTO finance_entries (
        entry_date, type, customer_name, vendor_name, amount, category, payment_mode, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry_date || new Date().toISOString().split('T')[0],
      type, customer_name || '', vendor_name || '',
      amount || 0, category || '', payment_mode || '', remarks || '', req.user.id
    );

    res.json({ success: true, message: 'Entry added' });
  } catch (err) {
    console.error('Add finance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Production (Sheet 4)
router.get('/production', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const entries = db.prepare(`
      SELECT * FROM production_entries
      WHERE entry_date >= ? AND entry_date <= ?
      ORDER BY entry_date DESC
    `).all(start, end);

    const totals = db.prepare(`
      SELECT
        SUM(welding_done) as welding_total,
        SUM(sent_to_coating) as coating_total,
        SUM(returned_count) as returned_total,
        SUM(pending) as pending_total
      FROM production_entries
      WHERE entry_date >= ? AND entry_date <= ?
    `).get(start, end);

    res.json({ entries, totals });
  } catch (err) {
    console.error('Production error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/production', (req, res) => {
  try {
    const { entry_date, machine_model, welding_done, sent_to_coating, returned_count, pending, remarks } = req.body;

    db.prepare(`
      INSERT INTO production_entries (
        entry_date, machine_model, welding_done, sent_to_coating, returned_count, pending, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry_date || new Date().toISOString().split('T')[0],
      machine_model || '', welding_done || 0, sent_to_coating || 0,
      returned_count || 0, pending || 0, remarks || '', req.user.id
    );

    res.json({ success: true, message: 'Entry added' });
  } catch (err) {
    console.error('Add production error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fitting (Sheet 5)
router.get('/fitting', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const entries = db.prepare(`
      SELECT * FROM fitting_entries
      WHERE entry_date >= ? AND entry_date <= ?
      ORDER BY entry_date DESC
    `).all(start, end);

    res.json({ entries });
  } catch (err) {
    console.error('Fitting error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/fitting', (req, res) => {
  try {
    const { entry_date, machine, testing_completed, passed, failed, ready_for_dispatch } = req.body;

    db.prepare(`
      INSERT INTO fitting_entries (
        entry_date, machine, testing_completed, passed, failed, ready_for_dispatch, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry_date || new Date().toISOString().split('T')[0],
      machine || '', testing_completed || 0, passed || 0,
      failed || 0, ready_for_dispatch || 0, req.user.id
    );

    res.json({ success: true, message: 'Entry added' });
  } catch (err) {
    console.error('Add fitting error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dispatch (Sheet 6)
router.get('/dispatch', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const entries = db.prepare(`
      SELECT * FROM dispatch_entries
      WHERE entry_date >= ? AND entry_date <= ?
      ORDER BY entry_date DESC
    `).all(start, end);

    res.json({ entries });
  } catch (err) {
    console.error('Dispatch error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/dispatch', (req, res) => {
  try {
    const { entry_date, customer_name, machine_model, transport_company, lr_number, state, delivered } = req.body;

    db.prepare(`
      INSERT INTO dispatch_entries (
        entry_date, customer_name, machine_model, transport_company, lr_number, state, delivered, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry_date || new Date().toISOString().split('T')[0],
      customer_name || '', machine_model || '', transport_company || '',
      lr_number || '', state || '', delivered || 0, req.user.id
    );

    res.json({ success: true, message: 'Entry added' });
  } catch (err) {
    console.error('Add dispatch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sales (Sheet 7)
router.get('/sales', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const entries = db.prepare(`
      SELECT se.*, u.name as sales_person
      FROM sales_entries se
      LEFT JOIN users u ON se.sales_person_id = u.id
      WHERE se.entry_date >= ? AND se.entry_date <= ?
      ORDER BY se.entry_date DESC
    `).all(start, end);

    const totals = db.prepare(`
      SELECT
        SUM(calls) as total_calls,
        SUM(orders) as total_orders,
        SUM(order_value) as total_value
      FROM sales_entries
      WHERE entry_date >= ? AND entry_date <= ?
    `).get(start, end);

    const conversion = totals.total_calls > 0
      ? Math.round((totals.total_orders / totals.total_calls) * 100)
      : 0;

    res.json({
      entries,
      totals: {
        calls: totals.total_calls || 0,
        orders: totals.total_orders || 0,
        value: totals.total_value || 0,
        conversion
      }
    });
  } catch (err) {
    console.error('Sales error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales', (req, res) => {
  try {
    const { entry_date, sales_person_id, calls, followups, videos_sent, quotations, orders, order_value } = req.body;

    db.prepare(`
      INSERT INTO sales_entries (
        entry_date, sales_person_id, calls, followups, videos_sent, quotations, orders, order_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry_date || new Date().toISOString().split('T')[0],
      sales_person_id || 0, calls || 0, followups || 0,
      videos_sent || 0, quotations || 0, orders || 0, order_value || 0
    );

    res.json({ success: true, message: 'Entry added' });
  } catch (err) {
    console.error('Add sales error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Orders (Sheet 8)
router.get('/orders', (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    let query = `
      SELECT * FROM order_entries
      WHERE order_date >= ? AND order_date <= ?
    `;
    const params = [start, end];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY order_date DESC`;

    const entries = db.prepare(query).all(...params);

    const totals = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(amount) as total_amount,
        SUM(advance) as total_advance
      FROM order_entries
      WHERE order_date >= ? AND order_date <= ?
    `).get(start, end);

    res.json({
      entries,
      totals: {
        orders: totals.total_orders || 0,
        amount: totals.total_amount || 0,
        advance: totals.total_advance || 0,
        balance: (totals.total_amount || 0) - (totals.total_advance || 0)
      }
    });
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders', (req, res) => {
  try {
    const { order_date, customer_name, machine_model, quantity, amount, advance, status } = req.body;

    db.prepare(`
      INSERT INTO order_entries (
        order_date, customer_name, machine_model, quantity, amount, advance, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_date || new Date().toISOString().split('T')[0],
      customer_name || '', machine_model || '',
      quantity || 1, amount || 0, advance || 0, status || 'new', req.user.id
    );

    res.json({ success: true, message: 'Order added' });
  } catch (err) {
    console.error('Add order error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
