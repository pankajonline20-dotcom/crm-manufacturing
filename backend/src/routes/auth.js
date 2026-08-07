const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// Get all users (admin only)
router.get('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// Create new user (admin only)
router.post('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, email, password, role = 'agent' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role);
    const newUser = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, user: newUser, message: 'User created successfully' });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { role } = req.body;
  if (!['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be admin or agent' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

// Clear all data (admin only)
router.post('/clear-all-data', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    db.prepare('PRAGMA foreign_keys = OFF').run();

    // Delete all data from all tables in correct order
    db.prepare('DELETE FROM call_logs').run();
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM deliveries').run();
    db.prepare('DELETE FROM quotations').run();
    db.prepare('DELETE FROM customer_visits').run();
    db.prepare('DELETE FROM broadcast_logs').run();
    db.prepare('DELETE FROM customer_health').run();
    db.prepare('DELETE FROM leads').run();
    db.prepare('DELETE FROM call_logs').run();
    db.prepare('DELETE FROM broadcasts').run();
    db.prepare('DELETE FROM machine_media').run();
    db.prepare('DELETE FROM machines').run();
    db.prepare('DELETE FROM knowledge_base').run();
    db.prepare('DELETE FROM goals').run();
    db.prepare('DELETE FROM board_actions').run();
    db.prepare('DELETE FROM board_meetings').run();
    db.prepare('DELETE FROM kpi_snapshots').run();
    db.prepare('DELETE FROM production_stages').run();
    db.prepare('DELETE FROM daily_expenses').run();
    db.prepare('DELETE FROM monthly_goals').run();
    db.prepare('DELETE FROM activity_log').run();
    db.prepare('DELETE FROM alerts').run();
    db.prepare('DELETE FROM daily_entries').run();
    db.prepare('DELETE FROM finance_entries').run();
    db.prepare('DELETE FROM production_entries').run();
    db.prepare('DELETE FROM fitting_entries').run();
    db.prepare('DELETE FROM dispatch_entries').run();
    db.prepare('DELETE FROM sales_entries').run();
    db.prepare('DELETE FROM order_entries').run();
    db.prepare('DELETE FROM directory_contacts').run();

    db.prepare('PRAGMA foreign_keys = ON').run();

    res.json({ message: 'All data cleared successfully' });
  } catch (err) {
    console.error('Clear data error:', err);
    res.status(500).json({ error: 'Failed to clear data', details: err.message });
  }
});

module.exports = router;
