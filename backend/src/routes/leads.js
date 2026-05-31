const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status, assigned_to, source, city, search, sort_by = 'created_at', order = 'DESC' } = req.query;

  let query = `
    SELECT l.*, u.name as assigned_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'agent') {
    query += ' AND l.assigned_to = ?';
    params.push(req.user.id);
  }

  if (status) { query += ' AND l.status = ?'; params.push(status); }
  if (assigned_to) { query += ' AND l.assigned_to = ?'; params.push(assigned_to); }
  if (source) { query += ' AND l.source = ?'; params.push(source); }
  if (city) { query += ' AND l.city LIKE ?'; params.push(`%${city}%`); }
  if (search) {
    query += ' AND (l.name LIKE ? OR l.phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const allowed = ['created_at', 'updated_at', 'next_followup_date', 'last_called_at', 'name'];
  const sortCol = allowed.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
  query += ` ORDER BY l.${sortCol} ${sortOrder}`;

  const leads = db.prepare(query).all(...params);
  res.json(leads);
});

router.get('/today-followups', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let query = `
    SELECT l.*, u.name as assigned_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.next_followup_date = ?
  `;
  const params = [today];

  if (req.user.role === 'agent') {
    query += ' AND l.assigned_to = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY l.name ASC';
  const leads = db.prepare(query).all(...params);
  res.json(leads);
});

router.get('/pipeline-summary', (req, res) => {
  let query = `SELECT status, COUNT(*) as count FROM leads`;
  const params = [];

  if (req.user.role === 'agent') {
    query += ' WHERE assigned_to = ?';
    params.push(req.user.id);
  }

  query += ' GROUP BY status';
  const summary = db.prepare(query).all(...params);
  res.json(summary);
});

router.get('/:id', (req, res) => {
  const lead = db.prepare(`
    SELECT l.*, u.name as assigned_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (req.user.role === 'agent' && lead.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(lead);
});

router.post('/', (req, res) => {
  const { name, phone, email, city, source, requirement, status, assigned_to, next_followup_date } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });

  const result = db.prepare(`
    INSERT INTO leads (name, phone, email, city, source, requirement, status, assigned_to, next_followup_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, phone, email || null, city || null, source || 'manual', requirement || null,
    status || 'new', assigned_to || req.user.id, next_followup_date || null);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(lead);
});

router.put('/:id', (req, res) => {
  const { name, phone, email, city, source, requirement, status, assigned_to, next_followup_date } = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (req.user.role === 'agent' && lead.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare(`
    UPDATE leads SET
      name = ?, phone = ?, email = ?, city = ?, source = ?, requirement = ?,
      status = ?, assigned_to = ?, next_followup_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ?? lead.name, phone ?? lead.phone, email ?? lead.email, city ?? lead.city,
    source ?? lead.source, requirement ?? lead.requirement, status ?? lead.status,
    assigned_to ?? lead.assigned_to, next_followup_date ?? lead.next_followup_date,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  db.prepare('DELETE FROM call_logs WHERE lead_id = ?').run(req.params.id);
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lead deleted' });
});

// Call logs
router.get('/:id/call-logs', (req, res) => {
  const logs = db.prepare(`
    SELECT cl.*, u.name as agent_name
    FROM call_logs cl
    LEFT JOIN users u ON cl.user_id = u.id
    WHERE cl.lead_id = ?
    ORDER BY cl.called_at DESC
  `).all(req.params.id);
  res.json(logs);
});

router.post('/:id/call-log', (req, res) => {
  const { notes, duration_minutes } = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const result = db.prepare(`
    INSERT INTO call_logs (lead_id, user_id, notes, duration_minutes)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, notes || null, duration_minutes || null);

  db.prepare(`UPDATE leads SET last_called_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);

  const log = db.prepare('SELECT * FROM call_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(log);
});

module.exports = router;
