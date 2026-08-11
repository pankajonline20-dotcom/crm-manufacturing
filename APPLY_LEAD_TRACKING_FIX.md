# 🔧 Apply Lead Tracking Fix — Step by Step

Schema changes weren't applied? Follow these steps to fix it.

---

## ✅ Option 1: Automatic (Recommended)

### Step 1: Pull latest code
```bash
cd Desktop/crm-manufacturing/backend
git pull origin main
```

### Step 2: Stop backend (if running)
```bash
# Press Ctrl+C in the terminal where npm start is running
```

### Step 3: Delete old database (fresh start)
```bash
# On Windows:
del data\crm.db

# On Mac/Linux:
rm data/crm.db
```

### Step 4: Start backend
```bash
npm start
```

### Expected Output:
```
[Migration] Adding created_by column to leads table...
[Migration] ✅ added created_by
[Migration] Adding created_by_name column to leads table...
[Migration] ✅ added created_by_name
[Migration] All migrations completed ✅
[Seed] Empty database — creating first admin only...
[Seed] ✅ First admin created.
Database seeded successfully!
CRM Backend running on http://localhost:3001
```

✅ **Done!** Columns are now added and ready.

---

## ✅ Option 2: Keep Existing Data (Safer)

### Step 1: Verify current schema
```bash
cd backend
node verify-schema.js
```

**Output should show:**
```
✅ id
✅ name
✅ phone
✅ created_by
✅ created_by_name
...
```

If you see ❌ marks, continue with fix:

### Step 2: Start backend
```bash
npm start
```

Watch for migration logs:
```
[Migration] Adding created_by column to leads table...
[Migration] ✅ added created_by
[Migration] ✅ created_by filled for existing leads
```

### Step 3: Verify it worked
```bash
node verify-schema.js
```

All should show ✅

---

## ✅ Option 3: Manual Database Fix (Advanced)

If migrations still don't work:

### Step 1: Get database tool

**Windows:**
```bash
# Download from: https://www.sqlite.org/download.html
# Or use WSL/Git Bash with sqlite3 installed
```

**Mac/Linux:**
```bash
# Already installed, just use:
sqlite3 data/crm.db
```

### Step 2: Run SQL commands
```bash
# Open database
sqlite3 data/crm.db

# Paste the contents of:
# backend/manual-fix-schema.sql

# All commands at once:
sqlite3 data/crm.db < backend/manual-fix-schema.sql
```

### Step 3: Verify
```bash
sqlite3 data/crm.db
> PRAGMA table_info(leads);
# Should show created_by and created_by_name columns

> SELECT COUNT(*) as total, SUM(CASE WHEN created_by IS NOT NULL THEN 1 ELSE 0 END) as with_creator FROM leads;
# Should show totals
```

---

## 🔍 Verify the Fix

### Check Schema
```bash
cd backend
node verify-schema.js
```

### Check API Response
```bash
# Get token first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salessaathi.com","password":"admin123"}'

# Save token:
TOKEN="eyJhbGc..."

# Check leads have creator info
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/leads | jq '.[0]'

# Should see:
# {
#   "id": 1,
#   "name": "...",
#   "created_by": 1,
#   "created_by_name": "Admin",
#   ...
# }
```

### Check Reports
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/reports/leads-by-agent | jq '.'

# Should show agent stats
```

---

## 📋 Troubleshooting

### Issue: "Column already exists"
**Cause:** Migrations already ran  
**Fix:** That's fine! Columns are already there.

### Issue: "created_by IS NULL for all leads"
**Cause:** Migration added columns but didn't fill data  
**Fix:** Run manually:
```bash
sqlite3 data/crm.db

UPDATE leads
SET created_by = assigned_to,
    created_by_name = (SELECT name FROM users WHERE id = leads.assigned_to LIMIT 1)
WHERE created_by IS NULL AND assigned_to IS NOT NULL;
```

### Issue: "No such table: leads"
**Cause:** Database is corrupted or doesn't exist  
**Fix:** Delete and restart fresh:
```bash
rm data/crm.db
npm start
```

### Issue: "PRAGMA table_info(leads) returns empty"
**Cause:** Database locked or corrupted  
**Fix:**
```bash
# Stop backend
# Delete database
rm data/crm.db
# Start fresh
npm start
```

---

## Files Changed

✅ `backend/src/migrate.js` — Now adds columns via ALTER TABLE  
✅ `backend/src/routes/leads.js` — Saves created_by on POST  
✅ `backend/src/routes/reports.js` — Added leads-by-agent endpoint  
✅ `backend/src/database.js` — Schema includes created_by columns  
✅ `backend/verify-schema.js` — New diagnostic script  
✅ `backend/manual-fix-schema.sql` — Emergency SQL fix script  

---

## Expected Result After Fix

### Leads Response
```json
{
  "id": 1,
  "name": "Kaushik Chaudhary",
  "phone": "9876543210",
  "created_by": 1,
  "created_by_name": "Admin",
  "assigned_to": 2,
  "assigned_name": "Rahul Shah",
  "created_at": "2026-08-11T10:00:00Z",
  "status": "interested"
}
```

### Reports Response
```json
[
  {
    "agent_id": 1,
    "agent_name": "Admin",
    "total_leads": 15,
    "this_month": 8,
    "won": 3,
    "pipeline": 4
  },
  {
    "agent_id": 2,
    "agent_name": "Rahul Shah",
    "total_leads": 22,
    "this_month": 12,
    "won": 5,
    "pipeline": 8
  }
]
```

✅ **That's success!**

---

## Quick Checklist

```
[ ] npm start runs without errors
[ ] [Migration] messages show in console
[ ] No ❌ errors about columns
[ ] node verify-schema.js shows all ✅
[ ] curl to /api/leads shows created_by
[ ] curl to /api/reports/leads-by-agent shows agent stats
[ ] UI shows "Added by {Agent Name}" on leads
[ ] Lead detail shows creator info
```

If all checked ✅ — **You're done!**

---

## Need More Help?

If still not working:

1. **Check backend logs:**
   ```bash
   npm start 2>&1 | grep -i migration
   ```

2. **Check database directly:**
   ```bash
   sqlite3 data/crm.db "PRAGMA table_info(leads);"
   ```

3. **Run manual fix:**
   ```bash
   sqlite3 data/crm.db < backend/manual-fix-schema.sql
   ```

4. **Start fresh:**
   ```bash
   rm data/crm.db
   npm start
   ```

Let me know if any of these steps fail! 🚀
