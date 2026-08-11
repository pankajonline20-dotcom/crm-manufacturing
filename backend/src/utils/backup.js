const fs = require('fs');
const path = require('path');

function backupDB() {
  try {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    const backupDir = process.env.BACKUP_PATH || './data/backups';

    if (!fs.existsSync(dbPath)) {
      console.log('[Backup] Database file not found:', dbPath);
      return;
    }

    fs.mkdirSync(backupDir, { recursive: true });

    const today = new Date().toISOString().slice(0, 10);
    const backupFile = `crm_${today}.db`;
    const dest = path.join(backupDir, backupFile);

    // Only one backup per day
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(dbPath, dest);
      console.log(`[Backup] Daily backup created: ${dest}`);
    } else {
      console.log(`[Backup] Today's backup already exists: ${dest}`);
    }

    // Keep last 30 days only
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('crm_') && f.endsWith('.db'))
      .sort()
      .reverse();

    if (files.length > 30) {
      const filesToDelete = files.slice(30);
      filesToDelete.forEach(f => {
        try {
          fs.unlinkSync(path.join(backupDir, f));
          console.log(`[Backup] Old backup removed: ${f}`);
        } catch (err) {
          console.error(`[Backup] Failed to remove ${f}:`, err.message);
        }
      });
    }
  } catch (err) {
    console.error('[Backup] Error:', err.message);
  }
}

// Schedule daily backup at 2 AM
function scheduleDailyBackup() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(2, 0, 0, 0);

  const timeUntilBackup = tomorrow - now;

  setTimeout(() => {
    backupDB();
    // Then schedule every 24 hours
    setInterval(backupDB, 24 * 60 * 60 * 1000);
  }, timeUntilBackup);

  console.log('[Backup] Daily backup scheduled at 2 AM');
}

module.exports = { backupDB, scheduleDailyBackup };
