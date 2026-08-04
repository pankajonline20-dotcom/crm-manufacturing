const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { type, city, q } = req.query;
  let query = 'SELECT * FROM directory_contacts WHERE is_active = 1';
  const params = [];

  if (type) {
    query += ' AND contact_type = ?';
    params.push(type);
  }

  if (city) {
    query += ' AND LOWER(city) = LOWER(?)';
    params.push(city);
  }

  if (q) {
    query += ' AND (LOWER(name) LIKE ? OR phone LIKE ? OR customer_ref_number LIKE ? OR LOWER(city) LIKE ? OR LOWER(company_name) LIKE ?)';
    const s = `%${q.toLowerCase()}%`;
    params.push(s, `%${q}%`, `%${q}%`, s, s);
  }

  query += ' ORDER BY contact_type, city, name';
  const contacts = db.prepare(query).all(...params);

  const result = contacts.map((c) => ({
    ...c,
    machines_owned: c.machines_owned ? JSON.parse(c.machines_owned) : [],
  }));

  res.json(result);
});

router.post('/', (req, res) => {

  const {
    contact_type,
    name,
    phone,
    phone_2,
    email,
    city,
    state,
    address,
    company_name,
    customer_ref_number,
    machines_owned,
    engineer_specialization,
    engineer_availability,
    dealer_territory,
    dealer_commission_pct,
    supplier_materials,
    supplier_lead_time,
    notes,
  } = req.body;

  if (!contact_type || !name || !phone) {
    return res.status(400).json({ error: 'contact_type, name, and phone required' });
  }

  const result = db.prepare(`
    INSERT INTO directory_contacts
    (contact_type, name, phone, phone_2, email, city, state, address, company_name,
     customer_ref_number, machines_owned, engineer_specialization, engineer_availability,
     dealer_territory, dealer_commission_pct, supplier_materials, supplier_lead_time, notes, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    contact_type,
    name,
    phone,
    phone_2 || null,
    email || null,
    city || null,
    state || 'Gujarat',
    address || null,
    company_name || null,
    customer_ref_number || null,
    JSON.stringify(machines_owned || []),
    engineer_specialization || null,
    engineer_availability || null,
    dealer_territory || null,
    dealer_commission_pct || null,
    supplier_materials || null,
    supplier_lead_time || null,
    notes || null,
    req.user.id
  );

  const contact = db.prepare('SELECT * FROM directory_contacts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(contact);
});

router.put('/:id', (req, res) => {

  const contact = db.prepare('SELECT * FROM directory_contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const { machines_owned, ...rest } = req.body;

  const cols = Object.keys(rest).map((k) => `${k}=?`).join(', ');
  const values = Object.values(rest);
  values.push(JSON.stringify(machines_owned || []));

  db.prepare(
    `UPDATE directory_contacts SET ${cols}, machines_owned=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).run(...values, req.params.id);

  const updated = db.prepare('SELECT * FROM directory_contacts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {

  const contact = db.prepare('SELECT * FROM directory_contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  db.prepare('UPDATE directory_contacts SET is_active=0 WHERE id=?').run(req.params.id);
  res.json({ message: 'Contact deleted' });
});

module.exports = router;
