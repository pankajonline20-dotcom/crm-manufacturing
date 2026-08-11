const { db } = require('./database');

function runMigrations() {
  try {
    console.log('[Migration] Running migrations...');

    // Migration 1: Add created_by columns to leads table if they don't exist
    try {
      // Check if column exists
      const tableInfo = db.prepare("PRAGMA table_info(leads)").all();
      const hasCreatedBy = tableInfo.some(col => col.name === 'created_by');
      const hasCreatedByName = tableInfo.some(col => col.name === 'created_by_name');

      if (!hasCreatedBy) {
        console.log('[Migration] Adding created_by column to leads table...');
        db.exec('ALTER TABLE leads ADD COLUMN created_by INTEGER REFERENCES users(id)');
        console.log('[Migration] ✅ added created_by');
      }

      if (!hasCreatedByName) {
        console.log('[Migration] Adding created_by_name column to leads table...');
        db.exec('ALTER TABLE leads ADD COLUMN created_by_name TEXT');
        console.log('[Migration] ✅ added created_by_name');
      }

      // Migration 2: Fill created_by for existing leads
      const missingCreatedBy = db.prepare(`
        SELECT COUNT(*) as count FROM leads WHERE created_by IS NULL
      `).get().count;

      if (missingCreatedBy > 0) {
        console.log(`[Migration] Found ${missingCreatedBy} leads without created_by, filling from assigned_to...`);

        db.prepare(`
          UPDATE leads
          SET created_by = assigned_to,
              created_by_name = (
                SELECT name FROM users WHERE id = leads.assigned_to LIMIT 1
              )
          WHERE created_by IS NULL AND assigned_to IS NOT NULL
        `).run();

        // Leads with no assigned_to → assign to first admin
        const unassignedCount = db.prepare(`
          SELECT COUNT(*) as count FROM leads WHERE created_by IS NULL
        `).get().count;

        if (unassignedCount > 0) {
          const admin = db.prepare(`
            SELECT id, name FROM users WHERE role='admin' AND is_deleted=0 LIMIT 1
          `).get();

          if (admin) {
            db.prepare(`
              UPDATE leads
              SET created_by = ?, created_by_name = ?
              WHERE created_by IS NULL
            `).run(admin.id, admin.name);
            console.log(`[Migration] Assigned ${unassignedCount} leads to admin: ${admin.name}`);
          }
        }

        console.log('[Migration] ✅ created_by filled for existing leads');
      } else {
        console.log('[Migration] All leads have created_by — skipping fill');
      }

      // Migration 3: Add indexes if they don't exist
      try {
        db.exec('CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to)');
        console.log('[Migration] ✅ indexes created');
      } catch (err) {
        console.log('[Migration] (indexes may already exist)');
      }

    } catch (err) {
      console.error('[Migration] Error adding columns:', err.message);
    }

    console.log('[Migration] All migrations completed ✅');
  } catch (err) {
    console.error('[Migration] Fatal error:', err.message);
  }
}

module.exports = { runMigrations };
