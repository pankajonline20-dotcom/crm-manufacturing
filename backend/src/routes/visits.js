const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { date, upcoming } = req.query;
  let query = `
    SELECT cv.*, l.name as lead_name, l.phone as lead_phone,
           u.name as assigned_name
    FROM customer_visits cv
    LEFT JOIN leads l ON cv.lead_id = l.id
    LEFT JOIN users u ON cv.assigned_to = u.id
    WHERE cv.is_deleted = 0
  `;
  const params = [];

  if (date) {
    query += ` AND cv.visit_date = ?`;
    params.push(date);
  }

  if (upcoming) {
    query += ` AND cv.visit_date >= date('now')`;
  }

  query += ' ORDER BY cv.visit_date ASC, cv.visit_time ASC';
  const visits = db.prepare(query).all(...params);
  res.json(visits);
});

router.get('/tomorrow', (req, res) => {
  const visits = db.prepare(`
    SELECT cv.*, l.name as lead_name, l.phone as lead_phone,
           u.name as assigned_name
    FROM customer_visits cv
    LEFT JOIN leads l ON cv.lead_id = l.id
    LEFT JOIN users u ON cv.assigned_to = u.id
    WHERE cv.visit_date = date('now', '+1 day')
      AND cv.status = 'scheduled'
      AND cv.is_deleted = 0
    ORDER BY cv.visit_time ASC
  `).all();
  res.json(visits);
});

router.get('/today', (req, res) => {
  const visits = db.prepare(`
    SELECT cv.*, l.name as lead_name, l.phone as lead_phone,
           u.name as assigned_name
    FROM customer_visits cv
    LEFT JOIN leads l ON cv.lead_id = l.id
    LEFT JOIN users u ON cv.assigned_to = u.id
    WHERE cv.visit_date = date('now')
      AND cv.status IN ('scheduled', 'arrived')
      AND cv.is_deleted = 0
    ORDER BY cv.visit_time ASC
  `).all();
  res.json(visits);
});

router.post('/', (req, res) => {
  const {
    lead_id,
    visitor_name,
    visitor_phone,
    visitor_company,
    visit_date,
    visit_time,
    visit_purpose,
    machines_interested,
    assigned_to,
    visit_notes,
  } = req.body;

  if (!visitor_name || !visit_date) {
    return res.status(400).json({ error: 'visitor_name and visit_date required' });
  }

  const result = db.prepare(`
    INSERT INTO customer_visits
    (lead_id, visitor_name, visitor_phone, visitor_company, visit_date,
     visit_time, visit_purpose, machines_interested, assigned_to, visit_notes, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    lead_id || null,
    visitor_name,
    visitor_phone || null,
    visitor_company || null,
    visit_date,
    visit_time || null,
    visit_purpose || null,
    machines_interested || null,
    assigned_to || null,
    visit_notes || null,
    req.user.id
  );

  const visit = db.prepare('SELECT * FROM customer_visits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(visit);
});

router.put('/:id/status', (req, res) => {
  const { status, outcome_notes } = req.body;
  const visit = db.prepare('SELECT * FROM customer_visits WHERE id = ?').get(req.params.id);

  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  db.prepare('UPDATE customer_visits SET status=?, outcome_notes=? WHERE id=?').run(
    status,
    outcome_notes || null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM customer_visits WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const visit = db.prepare('SELECT * FROM customer_visits WHERE id = ?').get(req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  db.prepare('DELETE FROM customer_visits WHERE id = ?').run(req.params.id);
  res.json({ message: 'Visit deleted' });
});

module.exports = router;
