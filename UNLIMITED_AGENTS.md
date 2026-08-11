# 🚀 Unlimited Agents — Data NEVER Deleted

SalesSaathi now supports **unlimited agents** with **permanent data protection**. Agents kabhi delete nahi honge — unka poora data hamesha safe rahega.

---

## The Promise 🛡️

✅ **Unlimited Agents** — Jitne agents chahiye add karo  
✅ **Data Never Deleted** — Agent ko remove karo, data stays forever  
✅ **Leads Stay Assigned** — Former agent ke leads still show  
✅ **Complete History** — Sab call logs, quotes, payments preserved  
✅ **No Data Loss** — Restart, redeploy, crash — data safe rehta hai  

---

## How It Works

### 1. Add Unlimited Agents

```
Admin Panel → Team → "+ Add Agent"
- Name, Email, Password
- Role: Admin or Agent
```

**Data is saved in users table with:**
- `is_deleted = 0` (active)
- `is_active = 1` (can login)
- `deleted_at = NULL`

### 2. Deactivate an Agent (They Can't Login)

```
Admin Panel → Team → [Agent Card] → "Deactivate"
```

**What happens:**
- `is_active` changes to `0`
- Agent can't login anymore
- Data stays in database
- Leads still assigned to them (show "Former Agent" in UI)

### 3. Remove an Agent (SOFT DELETE — Data Stays Forever)

```
Admin Panel → Team → [Agent Card] → "Remove"
```

**What happens:**
- `is_deleted` changes to `1`
- Agent removed from active list
- **Data stays in database FOREVER** ✅
- Leads, calls, quotes, payments all preserved
- Shows "Former Agent" in UI with reassign option

### 4. Restart/Redeploy — No Data Lost

When server restarts or Railway redeploys:

**Before (❌ Broken):**
```
Seed file: "DELETE FROM users WHERE role='agent'"
Result: All agents gone after restart ❌
```

**Now (✅ Fixed):**
```
Seed file: "IF users exist, DO NOTHING"
Result: All agents still there after restart ✅
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT,             -- 'admin' or 'agent'
  is_active     INTEGER DEFAULT 1, -- 0=can't login, 1=can login
  is_deleted    INTEGER DEFAULT 0, -- 0=exists, 1=soft deleted
  deleted_at    DATETIME,          -- When removed
  created_at    DATETIME
);
```

### Leads Table (Still References Deleted Agent)

```sql
CREATE TABLE leads (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  assigned_to  INTEGER,           -- References users(id)
                                  -- Still works if user.is_deleted=1
  is_deleted   INTEGER DEFAULT 0,
  created_at   DATETIME,
  ...
);
```

**Key Point:** Foreign key constraint doesn't prevent lead from staying assigned to deleted user.

---

## API Endpoints

### Get All Agents (Admin Only)

```bash
GET /api/auth/users
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Admin",
    "email": "admin@salessaathi.com",
    "role": "admin",
    "is_active": 1,
    "lead_count": 5,
    "call_count": 12,
    "created_at": "2026-08-11T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Rahul",
    "email": "rahul@salessaathi.com",
    "role": "agent",
    "is_active": 1,
    "lead_count": 8,
    "call_count": 24,
    "created_at": "2026-08-01T10:00:00Z"
  }
]
```

### Create New Agent (Admin Only)

```bash
POST /api/auth/users
Content-Type: application/json

{
  "name": "Priya Patel",
  "email": "priya@salessaathi.com",
  "password": "secure123",
  "role": "agent"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 5,
    "name": "Priya Patel",
    "email": "priya@salessaathi.com",
    "role": "agent"
  }
}
```

### Toggle Agent Active/Inactive

```bash
PUT /api/auth/users/:id/toggle-active
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "is_active": 0,
  "message": "Agent deactivated — data safe hai ✅"
}
```

**What Changes:**
- `is_active` flips between 0 and 1
- If `is_active = 0`: Agent can't login
- Leads stay assigned to them
- Data not touched

### Remove Agent (Soft Delete)

```bash
DELETE /api/auth/users/:id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent removed — unka poora data safe hai aur kabhi delete nahi hota ✅"
}
```

**What Changes:**
- `is_deleted` = 1
- `is_active` = 0
- `deleted_at` = current timestamp
- Agent removed from team list
- **Leads still assigned (show "Former Agent")**
- All data stays in database FOREVER

### View Leads (Shows Former Agents)

```bash
GET /api/leads
```

**Response includes:**
```json
[
  {
    "id": 1,
    "name": "Kaushik Chaudhary",
    "assigned_to": 2,
    "assigned_name": "Former Agent",  -- If agent is deleted
    "agent_is_active": 0,
    "agent_is_deleted": 1,
    ...
  }
]
```

---

## UI/Frontend Updates

### Team Page Shows:

✅ **Active Agents**
- Green "Active" badge
- Full profile card
- Can deactivate or remove

✅ **Inactive Agents** (is_active=0)
- Grey "Inactive" badge
- Still visible
- Can activate or remove

### Removed Agents (is_deleted=1)
- **Not shown in team list** (filtered out)
- Can't login
- Leads show as "Former Agent"

### Lead Detail Page

```jsx
// If agent is deleted:
<div style={{ background: '#FEF3C7', padding: 12, borderRadius: 8 }}>
  ⚠️ Pehle wale agent remove ho gaye — Please yeh lead reassign karo
  <button onClick={handleReassign}>
    Reassign →
  </button>
</div>
```

---

## Seed File Logic (CRITICAL)

### Before (❌ Broke Data)

```javascript
function seedIfEmpty() {
  // This ran EVERY restart and deleted agents!
  db.exec("DELETE FROM users WHERE role='agent'");
  db.exec("INSERT INTO users...");
}
```

### After (✅ Protects Data)

```javascript
function seedIfEmpty() {
  // Count ALL users (deleted or not)
  const userCount = db.prepare(
    'SELECT COUNT(*) as count FROM users'
  ).get().count;

  // If ANY user exists — do absolutely nothing
  if (userCount > 0) {
    console.log(`[Seed] ${userCount} users exist — skipping seed.`);
    return;
  }

  // Only runs on brand new empty database
  console.log('[Seed] Empty database — creating first admin...');
  // Create first admin only
}
```

**Key:** If even 1 user exists (active, inactive, or deleted), seed does NOTHING.

---

## Testing Checklist ✅

```
[ ] Start server → no agents (fresh DB)
[ ] Add admin via /api/auth/users
[ ] Restart server → admin still there ✅
[ ] Add 3 agents
[ ] Restart server → all 3 agents still there ✅
[ ] Deactivate agent 1 → can't login, but data visible
[ ] Remove agent 2 → removed from team, leads show "Former Agent"
[ ] Restart server → agent 1 still inactive, agent 2 still soft-deleted ✅
[ ] Deploy new version to Railway → agents still there ✅
[ ] Create 5 leads assigned to agent 1
[ ] Deactivate agent 1
[ ] View leads → all 5 show with "Former Agent" ✅
[ ] Restore agent 1 via activate → can login again
```

---

## Important Points 🎯

### ✅ What's Protected

- **Agent Records** — User profile stays forever
- **Assigned Leads** — Still show in database
- **Call Logs** — All history preserved
- **Quotations** — Quotes stay assigned to that agent
- **Payments** — Payment records linked to agent
- **Delivery Info** — Delivery history intact

### ✅ What Happens to Leads

When an agent is removed, their leads:
1. **Stay in database** (not deleted)
2. **Still show assigned_to = [old_agent_id]**
3. **UI shows "Former Agent"**
4. **Admin can reassign** to new agent

### ⚠️ Deactivate vs Remove

| | Deactivate | Remove (Soft Delete) |
|---|---|---|
| **Agent sees it** | Can't login | Can't login |
| **Data stays** | ✅ Yes | ✅ Yes (forever) |
| **In team list** | ✅ Visible (inactive) | ❌ Hidden |
| **Can reactivate** | ✅ Yes | ✅ Yes* |
| **Reversible** | ✅ Easy | ⚠️ Not in UI |

*Reactivation requires database update or recovery procedure.

---

## Recovery: Reactivate a Removed Agent

If you accidentally removed an agent and want them back:

### Option 1: Admin Panel (Future Feature)
```
Admin → Settings → Deleted Users → [Agent Name] → "Restore"
```

### Option 2: Database Query (Manual)
```sql
UPDATE users
SET is_deleted = 0, is_active = 1, deleted_at = NULL
WHERE id = 2;
```

Their leads will immediately show as assigned to them (not "Former Agent").

---

## Startup Sequence (Order CRITICAL)

```javascript
// server.js / index.js

// Step 1: Initialize database schema
initializeDatabase();

// Step 2: Run migrations (add any missing columns)
runMigrations();

// Step 3: Seed only if empty
seedDatabase();  // ← Does NOTHING if users exist

// Step 4: Start backup system
backupDB();
scheduleDailyBackup();

// Step 5: Start server
app.listen(PORT);
```

**Never do this:**
```javascript
❌ db.exec('DELETE FROM users')      // Will delete all agents!
❌ db.exec('DROP TABLE users')       // Will drop schema!
❌ seedDatabase() multiple times      // Use once only
```

---

## Monitoring

### Check Agent Count

```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/api/auth/users
```

Look for:
- `"is_active": 1` — Can login
- `"is_active": 0` — Cannot login
- `"is_deleted": 1` — Soft deleted (not in this list)

### Check Soft-Deleted Agents (Admin DB Query)

```sql
SELECT id, name, email, deleted_at FROM users WHERE is_deleted = 1;
```

### Verify Data Preservation

```sql
-- Check leads still assigned to deleted agent
SELECT COUNT(*) FROM leads WHERE assigned_to = 2 AND is_deleted = 0;

-- Check their call logs still exist
SELECT COUNT(*) FROM call_logs WHERE user_id = 2;

-- Check their quotations
SELECT COUNT(*) FROM quotations WHERE user_id = 2;
```

---

## FAQ 🤔

**Q: Agar agent ko delete karo toh unke leads kya hoga?**  
A: Leads database mein stay karti hain, same agent ko assigned. UI mein "Former Agent" show hota hai.

**Q: Kya agent ko reactivate kar sakte ho?**  
A: Haan! Database update se ya future admin panel se. Data kabhi delete nahi hota.

**Q: Restart karne se agents delete ho jayenge?**  
A: Nahi! Ab seed file sirf empty database ke liye run hota hai. Agar 1 bhi user exist kare to kuch nahi hota.

**Q: Unlimited agents add kar sakte ho?**  
A: Haan! Jitne chahiye add karo. Database unlimited support karta hai.

**Q: Ek agent ke kitne leads, calls, quotes ho sakte hain?**  
A: Unlimited! Database mein koi limit nahi hai.

**Q: Soft delete vs deactivate mein kya difference hai?**  
A: Deactivate = can't login, isme easily reactivate kar sakte ho. Delete = permanently removed from team list, par data forever stays.

**Q: Agar sab agents ko remove karo toh new agent add kar sakte ho?**  
A: Haan! Admin ko hi add karna padega pehle, phir agents. Kam se kam 1 admin hona chahiye.

---

## Implementation Files Updated

✅ `backend/src/seed.js` — Never deletes existing users  
✅ `backend/src/routes/auth.js` — Added toggle-active, proper soft delete  
✅ `backend/src/routes/leads.js` — Shows "Former Agent" for deleted agents  
✅ `backend/src/database.js` — Schema with is_deleted, is_active columns  

---

## Summary

**SalesSaathi ab unlimited agents support karta hai. Agents kabhi delete nahi honge — unka poora data permanent rahega. Even if you remove them from team, unke leads, calls, quotes, payments — sab database mein forever stay karenge.**

🎉 **Data is SAFE** — Always, Forever! 🎉
