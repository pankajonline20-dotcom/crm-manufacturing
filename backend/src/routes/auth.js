const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { deactivateUser } = require('../utils/softDelete');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/debug-users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role FROM users').all();
  res.json(users);
});

router.post('/update-emails', (req, res) => {
  try {
    const users = db.prepare('SELECT id, email FROM users').all();
    for (const user of users) {
      const newEmail = user.email.replace('@heatpresscrm.com', '@salessaathi.com');
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, user.id);
    }
    const updated = db.prepare('SELECT id, name, email, role FROM users').all();
    res.json({ message: 'All emails updated!', users: updated });
  } catch (err) {
    console.error('Update emails error:', err);
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

router.post('/init-admin', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount > 0) {
      return res.status(400).json({ error: 'Users already exist. Use regular login.' });
    }

    const adminHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`).run(
      'Pankaj Mehta',
      'admin@salessaathi.com',
      adminHash,
      'admin'
    );

    res.json({ message: 'Admin created!', email: 'admin@salessaathi.com', password: 'admin123' });
  } catch (err) {
    console.error('Init admin error:', err);
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_deleted = 0').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.is_active) {
    return res.status(401).json({ error: 'Account is inactive' });
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
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ? AND is_deleted = 0').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get all users (admin only) - with stats
router.get('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const users = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.role, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id AND is_deleted = 0) as lead_count,
      (SELECT COUNT(*) FROM call_logs WHERE user_id = u.id) as call_count
    FROM users u
    WHERE u.is_deleted = 0
    ORDER BY u.role DESC, u.name ASC
  `).all();
  res.json(users);
});

// Create new user (admin only)
router.post('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, email, password, role = 'agent' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND is_deleted = 0').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)').run(name, email, hashedPassword, role);
    const newUser = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    logAction(req.user.id, 'CREATE', 'users', newUser.id, null, newUser);
    res.status(201).json({ success: true, user: newUser, message: 'User created successfully' });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// Toggle user active/inactive
router.put('/users/:id/toggle-active', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;

    // Can't deactivate yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Aap khud ko deactivate nahi kar sakte' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If deactivating an admin — ensure at least one admin remains
    if (user.role === 'admin' && user.is_active === 1) {
      const activeAdmins = db.prepare(
        "SELECT COUNT(*) as n FROM users WHERE role='admin' AND is_active=1 AND is_deleted=0"
      ).get().n;
      if (activeAdmins <= 1) {
        return res.status(400).json({ error: 'Kam se kam ek admin active hona chahiye' });
      }
    }

    const newActive = user.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newActive, id);

    logAction(req.user.id, 'UPDATE', 'users', id, user, { ...user, is_active: newActive });

    res.json({
      success: true,
      is_active: newActive,
      message: newActive === 1 ? 'Agent activated ✅' : 'Agent deactivated — data safe hai ✅',
    });
  } catch (err) {
    res.status(500).json({ error: 'Toggle failed', details: err.message });
  }
});

// Delete user (admin only - soft delete) — marks as deleted, data stays forever
router.delete('/users/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;

    // Can't delete yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Aap khud ko delete nahi kar sakte' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Last admin protection
    if (user.role === 'admin') {
      const adminCount = db.prepare(
        "SELECT COUNT(*) as n FROM users WHERE role='admin' AND is_deleted=0"
      ).get().n;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Ek admin hamesha rehna chahiye' });
      }
    }

    // SOFT DELETE — row stays in DB, data stays forever
    db.prepare(`
      UPDATE users
      SET is_deleted=1, is_active=0, deleted_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(id);

    logAction(req.user.id, 'DELETE', 'users', id, user, null);

    res.json({
      success: true,
      message: 'Agent removed — unka poora data safe hai aur kabhi delete nahi hota ✅',
    });
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
  const oldUser = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!oldUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id);
  logAction(req.user.id, 'UPDATE_ROLE', 'users', req.params.id, oldUser, user);
  res.json(user);
});

// Clear all data (admin only)
router.post('/clear-all-data', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    db.prepare('PRAGMA foreign_keys = OFF').run();

    // Delete all data from all tables in correct order
    db.prepare('DELETE FROM audit_log').run();
    db.prepare('DELETE FROM call_logs').run();
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM deliveries').run();
    db.prepare('DELETE FROM quotations').run();
    db.prepare('DELETE FROM customer_visits').run();
    db.prepare('DELETE FROM broadcast_logs').run();
    db.prepare('DELETE FROM customer_health').run();
    db.prepare('DELETE FROM leads').run();
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
