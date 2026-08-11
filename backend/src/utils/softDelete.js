const { db } = require('../database');

function deactivateUser(userId) {
  try {
    db.prepare(`
      UPDATE users
      SET is_deleted=1, is_active=0, deleted_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(userId);
    console.log('[SoftDelete] User deactivated:', userId);
  } catch (err) {
    console.error('[SoftDelete] Deactivate user error:', err);
    throw err;
  }
}

function deleteLead(leadId) {
  try {
    db.prepare(`
      UPDATE leads
      SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(leadId);
    console.log('[SoftDelete] Lead soft-deleted:', leadId);
  } catch (err) {
    console.error('[SoftDelete] Delete lead error:', err);
    throw err;
  }
}

function deleteMachine(machineId) {
  try {
    db.prepare(`
      UPDATE machines
      SET is_deleted=1
      WHERE id=?
    `).run(machineId);
    console.log('[SoftDelete] Machine soft-deleted:', machineId);
  } catch (err) {
    console.error('[SoftDelete] Delete machine error:', err);
    throw err;
  }
}

function deleteContact(contactId) {
  try {
    db.prepare(`
      UPDATE directory_contacts
      SET is_deleted=1
      WHERE id=?
    `).run(contactId);
    console.log('[SoftDelete] Contact soft-deleted:', contactId);
  } catch (err) {
    console.error('[SoftDelete] Delete contact error:', err);
    throw err;
  }
}

function cancelVisit(visitId) {
  try {
    db.prepare(`
      UPDATE customer_visits
      SET status='cancelled', is_deleted=1
      WHERE id=?
    `).run(visitId);
    console.log('[SoftDelete] Visit cancelled:', visitId);
  } catch (err) {
    console.error('[SoftDelete] Cancel visit error:', err);
    throw err;
  }
}

function restoreLead(leadId) {
  try {
    db.prepare(`
      UPDATE leads
      SET is_deleted=0, deleted_at=NULL
      WHERE id=?
    `).run(leadId);
    console.log('[SoftDelete] Lead restored:', leadId);
  } catch (err) {
    console.error('[SoftDelete] Restore lead error:', err);
    throw err;
  }
}

module.exports = {
  deactivateUser,
  deleteLead,
  deleteMachine,
  deleteContact,
  cancelVisit,
  restoreLead
};
