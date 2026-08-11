const { db } = require('../database');

function logAction(userId, action, tableName, recordId, oldValue, newValue) {
  try {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      action,
      tableName,
      recordId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null
    );
    console.log(`[Audit] ${action} on ${tableName}:${recordId} by user ${userId}`);
  } catch (err) {
    console.error('[Audit] Log failed:', err.message);
  }
}

module.exports = { logAction };
