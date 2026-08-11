# Data Persistence & Audit Documentation

SalesSaathi now includes comprehensive data persistence, soft delete capabilities, audit logging, and automated backups.

## Overview

This implementation ensures data integrity, recoverability, and compliance through:
- **Soft Deletes**: Records marked as deleted rather than removed
- **Audit Logging**: Complete history of all important actions
- **Automated Backups**: Daily database backups with 30-day retention
- **Persistent Storage**: Railway volume configuration for data durability

## Soft Delete Implementation

### Tables with Soft Deletes

| Table | Columns |
|-------|---------|
| `users` | `is_deleted` (0/1), `is_active` (0/1), `deleted_at` (timestamp) |
| `leads` | `is_deleted` (0/1), `deleted_at` (timestamp) |
| `machines` | `is_deleted` (0/1) |
| `directory_contacts` | `is_deleted` (0/1) |
| `customer_visits` | `is_deleted` (0/1) |

### Query Filtering Pattern

All `SELECT` queries now include:
```sql
WHERE is_deleted = 0
```

Example:
```javascript
// Get active leads
const leads = db.prepare(`
  SELECT * FROM leads 
  WHERE is_deleted = 0 AND status = ?
`).all('active');
```

### Soft Delete API

```javascript
// backend/src/utils/softDelete.js

// Deactivate a user (marks deleted, sets is_active=0)
deactivateUser(userId)

// Soft-delete a lead
deleteLead(leadId)

// Soft-delete a machine
deleteMachine(machineId)

// Delete a directory contact
deleteContact(contactId)

// Cancel a visit (marks deleted, sets status='cancelled')
cancelVisit(visitId)

// Restore a soft-deleted lead
restoreLead(leadId)
```

### Benefits

✅ **Data Recovery**: Accidentally deleted records can be restored  
✅ **Audit Trail**: Know who deleted what and when  
✅ **Referential Integrity**: Related records remain intact  
✅ **Compliance**: Regulatory requirements for data retention  

## Audit Logging

### Audit Log Table

```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,              -- Who performed the action
  action TEXT,                  -- CREATE, UPDATE, DELETE, etc.
  table_name TEXT,              -- Which table
  record_id INTEGER,            -- Which record
  old_value TEXT,               -- Previous state (JSON)
  new_value TEXT,               -- New state (JSON)
  created_at TIMESTAMP          -- When it happened
);
```

### Usage

```javascript
// Log an action
const { logAction } = require('../utils/audit');

logAction(
  userId,           // Who
  'UPDATE',         // What
  'leads',          // Where
  leadId,           // Which record
  oldLead,          // Before state
  newLead           // After state
);
```

### Action Types

```
CREATE   - New record created
UPDATE   - Record modified
DELETE   - Record deleted
VIP_MARK - Lead marked as VIP
VIP_UNMARK - VIP status removed
UPDATE_ROLE - User role changed
```

### Audit Log Query Examples

```javascript
// Get all actions by a user
SELECT * FROM audit_log 
WHERE user_id = ? 
ORDER BY created_at DESC;

// Get all deletions in the last 7 days
SELECT * FROM audit_log 
WHERE action = 'DELETE' 
AND created_at > datetime('now', '-7 days');

// Get all updates to a specific lead
SELECT * FROM audit_log 
WHERE table_name = 'leads' 
AND record_id = ? 
AND action = 'UPDATE';
```

## Backup System

### Location & Frequency

- **Location**: `/var/data/backups/` (Railway) or `./data/backups/` (local)
- **Frequency**: Daily at 2 AM
- **Naming**: `crm_YYYY-MM-DD.db`
- **Retention**: Last 30 days only

### How It Works

1. On startup: `backupDB()` creates immediate backup
2. Scheduler: `scheduleDailyBackup()` runs every 24 hours
3. Cleanup: Old backups (>30 days) automatically deleted

### Backup API

```javascript
const { backupDB, scheduleDailyBackup } = require('../utils/backup');

// Immediate backup
backupDB();

// Start daily schedule (already called in index.js)
scheduleDailyBackup();
```

### Restore from Backup

```bash
# Stop the application
# Replace the current database
cp /var/data/backups/crm_2026-08-10.db /var/data/crm.db
# Restart the application
```

## Configuration

### Environment Variables

```bash
# Database path (default: ./data/crm.db)
DATABASE_PATH=/var/data/crm.db

# Backup path (default: ./data/backups)
BACKUP_PATH=/var/data/backups

# Port
PORT=3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Railway Configuration

The `railway.toml` file configures persistent storage:

```toml
[deploy]
startCommand = "npm start"
volumes = ["data:/var/data"]

[env]
DATABASE_PATH = "/var/data/crm.db"
BACKUP_PATH = "/var/data/backups"
```

This mounts a persistent volume at `/var/data` so data survives:
- Application restarts
- Deployments
- Server crashes

## Routes with Audit Logging

### Leads Routes
- ✅ POST `/api/leads` - CREATE logged
- ✅ PUT `/api/leads/:id` - UPDATE logged
- ✅ DELETE `/api/leads/:id` - DELETE logged
- ✅ PUT `/api/leads/:id/vip` - VIP actions logged

### Payments Routes
- ✅ PUT `/api/payments/:id` - UPDATE logged
- ✅ DELETE `/api/payments/:id` - DELETE logged

### Auth Routes
- ✅ POST `/api/auth/users` - User creation logged
- ✅ DELETE `/api/auth/users/:id` - User deletion logged (soft delete)
- ✅ PUT `/api/auth/users/:id/role` - Role changes logged

## Soft Delete in Action

### Example: Deleting a Lead

Before (hard delete):
```javascript
// ❌ Data permanently gone
db.prepare('DELETE FROM leads WHERE id = ?').run(leadId);
```

After (soft delete):
```javascript
// ✅ Data preserved, marked as deleted
const { deleteLead } = require('../utils/softDelete');
deleteLead(leadId);

// In database:
// is_deleted = 1
// deleted_at = CURRENT_TIMESTAMP
```

### Example: Viewing Leads

Before:
```javascript
const leads = db.prepare('SELECT * FROM leads').all();
// ❌ Includes deleted leads
```

After:
```javascript
const leads = db.prepare('SELECT * FROM leads WHERE is_deleted = 0').all();
// ✅ Only active leads shown
```

## Monitoring Data Persistence

### Check Backup Status

```sql
-- List recent backups
SELECT name FROM (
  SELECT 'crm_2026-08-10.db' as name, '2026-08-10' as date
  UNION ALL SELECT 'crm_2026-08-11.db', '2026-08-11'
)
ORDER BY date DESC
LIMIT 5;
```

### Audit Trail Queries

```sql
-- Recent deletions
SELECT * FROM audit_log 
WHERE action = 'DELETE' 
ORDER BY created_at DESC 
LIMIT 10;

-- User activity summary
SELECT user_id, action, COUNT(*) 
FROM audit_log 
WHERE created_at > datetime('now', '-24 hours')
GROUP BY user_id, action;

-- Restore a deleted lead
SELECT * FROM leads 
WHERE is_deleted = 1 
ORDER BY deleted_at DESC;
```

## Testing Data Persistence

### Test 1: Soft Delete
```
1. Create a lead
2. Delete it via API
3. Check audit_log has DELETE entry
4. Query database: is_deleted should be 1
5. Try to restore: UPDATE leads SET is_deleted=0 WHERE id=X
```

### Test 2: Audit Logging
```
1. Create a new user
2. Check audit_log has CREATE entry
3. Update the user
4. Check audit_log has UPDATE entry with old/new values
```

### Test 3: Backups
```
1. Check /var/data/backups/ directory
2. Verify daily backup exists
3. Database file should exist at /var/data/crm.db
4. Wait 24 hours for next backup (or trigger manually)
```

### Test 4: Persistence Across Restarts
```
1. Create a lead in the app
2. Restart the backend (npm restart)
3. Verify the lead still exists
4. Check Railway deployment logs
```

## Best Practices

### For Developers

1. **Always filter soft-deleted records**:
   ```javascript
   // Good
   db.prepare('SELECT * FROM leads WHERE is_deleted = 0').all()
   
   // Bad
   db.prepare('SELECT * FROM leads').all()
   ```

2. **Use soft delete utilities**:
   ```javascript
   // Good
   const { deleteLead } = require('../utils/softDelete');
   deleteLead(leadId);
   
   // Bad
   db.prepare('DELETE FROM leads WHERE id = ?').run(leadId);
   ```

3. **Always log important actions**:
   ```javascript
   const { logAction } = require('../utils/audit');
   logAction(userId, 'CREATE', 'leads', leadId, null, lead);
   ```

### For Operations

1. **Monitor backup directory size**: Ensure `/var/data/backups/` doesn't exceed quota
2. **Weekly audit review**: Check `audit_log` for suspicious activity
3. **Test restore procedure**: Monthly restore from backup to verify integrity
4. **Update environment variables**: Always set `DATABASE_PATH` and `BACKUP_PATH` on Railway

## Troubleshooting

### Issue: Backups not being created

**Check**:
- Is `DATABASE_PATH` set correctly?
- Does `/var/data/` have write permissions?
- Check logs: `[Backup]` messages in console

```bash
# In Railway logs, look for:
[Backup] Daily backup created: /var/data/backups/crm_2026-08-11.db
```

### Issue: Audit logs growing too large

**Solution**:
```sql
-- Archive old audit logs (keep last 90 days)
DELETE FROM audit_log 
WHERE created_at < datetime('now', '-90 days');
```

### Issue: Data persisting after deletion

**Check**:
```sql
-- Verify is_deleted flag
SELECT id, name, is_deleted, deleted_at 
FROM leads 
WHERE id = ?;
```

If `is_deleted = 0` after delete attempt, the soft delete didn't work.

### Issue: Soft-deleted data visible in UI

**Fix**: Ensure all GET endpoints filter `WHERE is_deleted = 0`

## Migration Guide

### Upgrading Existing Databases

The `initializeDatabase()` function uses `CREATE TABLE IF NOT EXISTS`, so:

1. New installations: Get all columns automatically
2. Existing databases: Need manual migration

**To add soft delete to existing table**:
```sql
-- Add columns
ALTER TABLE leads ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMP;

-- All existing records remain active (is_deleted = 0)
```

## Implementation Files

### Core Files
- `backend/src/utils/softDelete.js` - Soft delete operations
- `backend/src/utils/audit.js` - Audit logging
- `backend/src/utils/backup.js` - Backup system
- `backend/src/database.js` - Schema with soft delete columns
- `backend/index.js` - Initialization of backup system

### Updated Routes
- `backend/src/routes/leads.js` - Soft delete & audit logging
- `backend/src/routes/payments.js` - Audit logging
- `backend/src/routes/auth.js` - Soft user deletion & audit logging

### Configuration
- `railway.toml` - Persistent volume setup
- `.env.example` - Database path configuration
- `DATA_PERSISTENCE.md` - This file

## Support

For issues or questions about data persistence:
1. Check audit_log for recent changes
2. Verify backups in `/var/data/backups/`
3. Review Railway deployment logs
4. Restore from backup if needed
