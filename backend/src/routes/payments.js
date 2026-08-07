const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, l.name as lead_name, l.phone as lead_phone, q.quote_number, q.total_amount as quote_total
    FROM payments p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN quotations q ON p.quotation_id = q.id
    ORDER BY p.id DESC
  `).all();
  res.json(payments);
});

router.put('/:id', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const { amount, payment_date, mode, status, notes } = req.body;
  db.prepare(`
    UPDATE payments SET amount = ?, payment_date = ?, mode = ?, status = ?, notes = ? WHERE id = ?
  `).run(amount ?? payment.amount, payment_date ?? payment.payment_date, mode ?? payment.mode,
    status ?? payment.status, notes ?? payment.notes, req.params.id);

  const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/send-reminder', (req, res) => {
  const payment = db.prepare(`
    SELECT p.*, l.name as lead_name, l.phone as lead_phone
    FROM payments p LEFT JOIN leads l ON p.lead_id = l.id WHERE p.id = ?
  `).get(req.params.id);

  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  db.prepare(`UPDATE payments SET reminder_count = reminder_count + 1, last_reminder_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);

  const amount = payment.amount ? `₹${Number(payment.amount).toLocaleString('en-IN')}` : 'the amount';
  const message = `Hi ${payment.lead_name}, yeh SalesSaathi ki taraf se reminder hai. Aapki payment ${amount} abhi pending hai. Please confirm karein. Dhanyawad!`;
  const waLink = `https://wa.me/91${payment.lead_phone}?text=${encodeURIComponent(message)}`;

  res.json({ wa_link: waLink, message });
});

router.delete('/:id', (req, res) => {
  try {
    console.log('Delete payment request:', { id: req.params.id, role: req.user?.role });

    if (req.user.role !== 'admin') {
      console.log('Permission denied: user role is', req.user.role);
      return res.status(403).json({ error: 'Admin only' });
    }

    const payment = db.prepare('SELECT id FROM payments WHERE id = ?').get(req.params.id);
    if (!payment) {
      console.log('Payment not found:', req.params.id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    const result = db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
    console.log('Payment deleted:', { id: req.params.id, changes: result.changes });
    res.json({ message: 'Payment deleted', changes: result.changes });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
