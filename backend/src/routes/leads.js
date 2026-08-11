const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { deleteLead, restoreLead } = require('../utils/softDelete');
const { logAction } = require('../utils/audit');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status, assigned_to, source, city, search, sort_by = 'created_at', order = 'DESC' } = req.query;

  let query = `
    SELECT l.*,
      COALESCE(creator.name, l.created_by_name, 'Unknown') as created_by_name,
      COALESCE(assignee.name, 'Former Agent') as assigned_name,
      assignee.is_active as agent_is_active,
      assignee.is_deleted as agent_is_deleted
    FROM leads l
    LEFT JOIN users creator ON l.created_by = creator.id
    LEFT JOIN users assignee ON l.assigned_to = assignee.id
    WHERE l.is_deleted = 0
  `;
  const params = [];

  if (req.user.role === 'agent' && !search) {
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
    WHERE l.next_followup_date = ? AND l.is_deleted = 0
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
  let query = `SELECT status, COUNT(*) as count FROM leads WHERE is_deleted = 0`;
  const params = [];

  if (req.user.role === 'agent') {
    query += ' AND assigned_to = ?';
    params.push(req.user.id);
  }

  query += ' GROUP BY status';
  const summary = db.prepare(query).all(...params);
  res.json(summary);
});

router.get('/:id', (req, res) => {
  const lead = db.prepare(`
    SELECT l.*,
      COALESCE(creator.name, l.created_by_name, 'Unknown') as created_by_name,
      creator.email as created_by_email,
      COALESCE(assignee.name, 'Former Agent') as assigned_name,
      assignee.is_active as agent_is_active,
      assignee.is_deleted as agent_is_deleted
    FROM leads l
    LEFT JOIN users creator ON l.created_by = creator.id
    LEFT JOIN users assignee ON l.assigned_to = assignee.id
    WHERE l.id = ? AND l.is_deleted = 0
  `).get(req.params.id);

  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (req.user.role === 'agent' && lead.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(lead);
});

router.post('/', (req, res) => {
  try {
    console.log('Create lead request:', req.body);
    const { name, phone, email, city, source, requirement, status, assigned_to, next_followup_date } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });

    // Lead created by whoever is logged in
    const createdBy = req.user.id;
    const createdByName = req.user.name;

    console.log('Inserting lead:', { name, phone, email, city, source, status, created_by: createdBy, created_by_name: createdByName });
    const result = db.prepare(`
      INSERT INTO leads (name, phone, email, city, source, requirement, status, assigned_to, next_followup_date, created_by, created_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, email || null, city || null, source || 'manual', requirement || null,
      status || 'new', assigned_to || req.user.id, next_followup_date || null, createdBy, createdByName);

    console.log('Lead inserted with ID:', result.lastInsertRowid);
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    if (!lead) return res.status(500).json({ error: 'Lead created but not found', id: result.lastInsertRowid });

    logAction(req.user.id, 'CREATE', 'leads', lead.id, null, lead);
    console.log('Lead created successfully:', lead.id);
    res.status(201).json(lead);
  } catch (err) {
    console.error('Create lead error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to create lead', details: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, email, city, source, requirement, status, assigned_to, next_followup_date } = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND is_deleted = 0').get(req.params.id);
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
  logAction(req.user.id, 'UPDATE', 'leads', lead.id, lead, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND is_deleted = 0').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    deleteLead(req.params.id);
    logAction(req.user.id, 'DELETE', 'leads', req.params.id, lead, null);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
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

// VIP customers
router.get('/vip', (req, res) => {
  const vips = db.prepare(`
    SELECT l.*, u.name as vip_marked_by_name
    FROM leads l
    LEFT JOIN users u ON l.vip_marked_by = u.id
    WHERE l.is_vip = 1 AND l.is_deleted = 0
    ORDER BY l.vip_marked_at DESC
  `).all();
  res.json(vips);
});

router.put('/:id/vip', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { is_vip, vip_note } = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  db.prepare(`
    UPDATE leads SET
      is_vip = ?,
      vip_note = ?,
      vip_marked_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
      vip_marked_by = CASE WHEN ? = 1 THEN ? ELSE NULL END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(is_vip ? 1 : 0, vip_note || '', is_vip ? 1 : 0, is_vip ? 1 : 0, req.user.id, req.params.id);

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  logAction(req.user.id, is_vip ? 'VIP_MARK' : 'VIP_UNMARK', 'leads', lead.id, lead, updated);
  res.json(updated);
});

module.exports = router;
