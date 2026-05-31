const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const deliveries = db.prepare(`
    SELECT d.*, l.name as lead_name, l.phone as lead_phone, m.model_name,
      CAST((julianday('now') - julianday(d.delivered_at)) AS INTEGER) as days_since_delivery
    FROM deliveries d
    LEFT JOIN leads l ON d.lead_id = l.id
    LEFT JOIN machines m ON d.machine_id = m.id
    ORDER BY d.delivered_at DESC
  `).all();
  res.json(deliveries);
});

router.post('/', (req, res) => {
  const { lead_id, machine_id, delivered_at, notes } = req.body;
  if (!lead_id || !machine_id) return res.status(400).json({ error: 'lead_id and machine_id required' });

  const result = db.prepare(`
    INSERT INTO deliveries (lead_id, machine_id, delivered_at, notes)
    VALUES (?, ?, ?, ?)
  `).run(lead_id, machine_id, delivered_at || new Date().toISOString().split('T')[0], notes || null);

  db.prepare(`UPDATE leads SET status = 'won', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(lead_id);

  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(delivery);
});

router.put('/:id', (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const { installation_done, followup_7day_sent, followup_30day_sent, notes } = req.body;
  db.prepare(`
    UPDATE deliveries SET installation_done = ?, followup_7day_sent = ?, followup_30day_sent = ?, notes = ? WHERE id = ?
  `).run(
    installation_done !== undefined ? (installation_done ? 1 : 0) : delivery.installation_done,
    followup_7day_sent !== undefined ? (followup_7day_sent ? 1 : 0) : delivery.followup_7day_sent,
    followup_30day_sent !== undefined ? (followup_30day_sent ? 1 : 0) : delivery.followup_30day_sent,
    notes ?? delivery.notes,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/send-followup', (req, res) => {
  const delivery = db.prepare(`
    SELECT d.*, l.name as lead_name, l.phone as lead_phone, m.model_name
    FROM deliveries d
    LEFT JOIN leads l ON d.lead_id = l.id
    LEFT JOIN machines m ON d.machine_id = m.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const message = `Hi ${delivery.lead_name}, ${delivery.model_name} kaisi chal rahi hai? Koi problem toh nahi? Hum hamesha available hain. - Heat Press CRM Team`;
  const waLink = `https://wa.me/91${delivery.lead_phone}?text=${encodeURIComponent(message)}`;

  res.json({ wa_link: waLink, message });
});

module.exports = router;
