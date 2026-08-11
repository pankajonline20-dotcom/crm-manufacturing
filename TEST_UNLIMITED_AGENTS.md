# 🧪 Test Unlimited Agents — Complete Procedure

## Goal
Verify that agents are NEVER deleted, data stays FOREVER, even across restarts and deployments.

---

## Prerequisites

```bash
# Ensure backend is running
cd backend
npm start

# In another terminal, test with curl or Postman
```

---

## Test 1: Fresh Database Startup ✅

### Step 1: Delete existing database (fresh start)
```bash
# On Windows
del C:\Users\Pankaj\Desktop\crm-manufacturing\backend\data\crm.db

# On Mac/Linux
rm backend/data/crm.db
```

### Step 2: Start backend
```bash
npm start
```

### Expected Console Output:
```
[Seed] Empty database — creating first admin only...
[Seed] ✅ First admin created.
[Seed] 📧 Email: admin@salessaathi.com
[Seed] 🔑 Password: admin123
[Seed] ⚠️  CHANGE PASSWORD IMMEDIATELY after first login.
[Seed] Done. No agents were touched. Data is PERMANENT.
Database seeded successfully!
```

✅ **Result:** Admin created, no agents added yet

---

## Test 2: Add Agents (API Call)

### Step 1: Get JWT token (login as admin)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@salessaathi.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "name": "Admin", "email": "admin@salessaathi.com", "role": "admin" }
}
```

**Save the token:** 
```bash
TOKEN="eyJhbGc..."
```

### Step 2: Add Agent 1
```bash
curl -X POST http://localhost:3001/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Rahul Shah",
    "email": "rahul@salessaathi.com",
    "password": "agent123",
    "role": "agent"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Rahul Shah",
    "email": "rahul@salessaathi.com",
    "role": "agent"
  }
}
```

### Step 3: Add Agent 2
```bash
curl -X POST http://localhost:3001/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Priya Patel",
    "email": "priya@salessaathi.com",
    "password": "agent123",
    "role": "agent"
  }'
```

### Step 4: Add Agent 3
```bash
curl -X POST http://localhost:3001/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Snehal Desai",
    "email": "snehal@salessaathi.com",
    "password": "agent123",
    "role": "agent"
  }'
```

### Step 5: Get all users
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/users
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Admin",
    "email": "admin@salessaathi.com",
    "role": "admin",
    "is_active": 1,
    "lead_count": 0,
    "call_count": 0
  },
  {
    "id": 2,
    "name": "Rahul Shah",
    "email": "rahul@salessaathi.com",
    "role": "agent",
    "is_active": 1,
    "lead_count": 0,
    "call_count": 0
  },
  {
    "id": 3,
    "name": "Priya Patel",
    "email": "priya@salessaathi.com",
    "role": "agent",
    "is_active": 1,
    "lead_count": 0,
    "call_count": 0
  },
  {
    "id": 4,
    "name": "Snehal Desai",
    "email": "snehal@salessaathi.com",
    "role": "agent",
    "is_active": 1,
    "lead_count": 0,
    "call_count": 0
  }
]
```

✅ **Result:** 3 agents created successfully

---

## Test 3: Restart Server — Agents Survive ✅

### Step 1: Stop backend
```bash
# Press Ctrl+C in the terminal
```

### Step 2: Check database file exists
```bash
# Windows
dir C:\Users\Pankaj\Desktop\crm-manufacturing\backend\data\

# Mac/Linux
ls -la backend/data/
```

Should see: `crm.db` file

### Step 3: Start backend again
```bash
npm start
```

### Expected Console Output:
```
[Seed] 4 users exist — skipping seed. No data touched. Data is SAFE.
✅ Database initialized
```

### Step 4: Get users again
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/users
```

**Expected:** Same 4 users (admin + 3 agents)

✅ **Result:** Agents survived restart! 🎉

---

## Test 4: Create Lead Assigned to Agent

### Step 1: Create lead assigned to Rahul (id: 2)
```bash
ADMIN_TOKEN="..."  # From earlier

curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Kaushik Chaudhary",
    "phone": "9876543210",
    "email": "kaushik@example.com",
    "city": "Surat",
    "source": "facebook",
    "status": "interested",
    "assigned_to": 2
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Kaushik Chaudhary",
  "phone": "9876543210",
  "assigned_to": 2,
  "assigned_name": "Rahul Shah"
}
```

### Step 2: Verify lead shows agent name
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/leads/1
```

**Expected:**
```json
{
  "id": 1,
  "assigned_to": 2,
  "assigned_name": "Rahul Shah",
  "agent_is_active": 1,
  "agent_is_deleted": 0
}
```

✅ **Result:** Lead correctly assigned to agent

---

## Test 5: Deactivate Agent

### Step 1: Deactivate Rahul (id: 2)
```bash
curl -X PUT http://localhost:3001/api/auth/users/2/toggle-active \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "is_active": 0,
  "message": "Agent deactivated — data safe hai ✅"
}
```

### Step 2: Try login with Rahul
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rahul@salessaathi.com",
    "password": "agent123"
  }'
```

**Expected Error:**
```json
{
  "error": "Invalid credentials"  // or "Account is inactive"
}
```

### Step 3: Check lead still shows Rahul
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/leads/1
```

**Expected:**
```json
{
  "id": 1,
  "assigned_name": "Rahul Shah",  // ← Still shows Rahul!
  "agent_is_active": 0,            // ← But inactive
  "agent_is_deleted": 0            // ← Not deleted
}
```

✅ **Result:** Agent deactivated but data stays

---

## Test 6: Reactivate Agent

### Step 1: Activate Rahul again
```bash
curl -X PUT http://localhost:3001/api/auth/users/2/toggle-active \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "is_active": 1,
  "message": "Agent activated ✅"
}
```

### Step 2: Try login again
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rahul@salessaathi.com",
    "password": "agent123"
  }'
```

**Expected:** Success, token returned

✅ **Result:** Agent can login again, data restored

---

## Test 7: Remove Agent (Soft Delete)

### Step 1: Delete Priya (id: 3)
```bash
curl -X DELETE http://localhost:3001/api/auth/users/3 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Agent removed — unka poora data safe hai aur kabhi delete nahi hota ✅"
}
```

### Step 2: Check user list
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/auth/users
```

**Expected:** Only 3 users (Priya not in list)
```json
[
  { "id": 1, "name": "Admin", ... },
  { "id": 2, "name": "Rahul Shah", ... },
  { "id": 4, "name": "Snehal Desai", ... }
  // ← Priya (id: 3) missing from active list
]
```

### Step 3: Create lead for Priya (before deletion)
First, add a lead when Priya was active:
```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Customer A",
    "phone": "9876543211",
    "assigned_to": 3
  }'
```

Now Priya has a lead (id: 2).

### Step 4: Check lead shows "Former Agent"
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/leads/2
```

**Expected:**
```json
{
  "id": 2,
  "assigned_to": 3,
  "assigned_name": "Former Agent",  // ← Shows "Former Agent"!
  "agent_is_active": 0,
  "agent_is_deleted": 1             // ← is_deleted = 1 (soft deleted)
}
```

✅ **Result:** Agent removed, but lead shows "Former Agent" with reassign option

---

## Test 8: Restart After Delete — Data Survives

### Step 1: Stop backend
```bash
# Ctrl+C
```

### Step 2: Start backend
```bash
npm start
```

**Console should show:**
```
[Seed] 4 users exist — skipping seed. No data touched. Data is SAFE.
```

### Step 3: Get users
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/auth/users
```

**Expected:** Still 3 active users (Priya still soft-deleted)

### Step 4: Get leads
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/leads
```

**Expected:** Lead for "Customer A" still shows "Former Agent"

✅ **Result:** Deletion survived restart! Data PERMANENT! 🎉

---

## Test 9: Database Verification

### Step 1: Check database directly
```sql
-- Count all users (including soft-deleted)
SELECT COUNT(*) FROM users;  -- Should return 4

-- Count active users
SELECT COUNT(*) FROM users WHERE is_deleted = 0;  -- Should return 3

-- Count soft-deleted users
SELECT COUNT(*) FROM users WHERE is_deleted = 1;  -- Should return 1

-- See all users including deleted
SELECT id, name, email, is_active, is_deleted, deleted_at FROM users;

-- See leads with agent info
SELECT l.id, l.name, l.assigned_to, u.name, u.is_deleted 
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id;
```

✅ **Result:** Database shows correct soft delete state

---

## Test 10: Deployment Simulation

### Step 1: Simulate git pull + restart
```bash
# Simulate new code deployed
# Stop backend
Ctrl+C

# "Deploy new version"
# (Just restart same code)

# Start backend
npm start
```

**Expected Console:**
```
[Seed] 4 users exist — skipping seed. No data touched. Data is SAFE.
```

### Step 2: Verify all agents still there
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/users
```

✅ **Result:** Deployment survived, agents safe!

---

## Final Checklist ✅

```
[ ] Fresh database → admin created
[ ] Add 3 agents → all visible
[ ] Restart → all 3 agents survive
[ ] Create lead for agent → shows agent name
[ ] Deactivate agent → can't login, lead still shows agent
[ ] Reactivate agent → can login again
[ ] Delete agent → removed from team list
[ ] Check lead → shows "Former Agent"
[ ] Restart → agent still deleted, lead still shows "Former Agent"
[ ] Database query → shows is_deleted = 1 for removed agent
[ ] Verify audit log → DELETE action logged
[ ] Deploy simulation → all data survives
```

---

## Success! 🎉

**If all tests pass:**

✅ Agents are never deleted  
✅ Data is always safe  
✅ Soft delete working correctly  
✅ Audit logging working  
✅ Restart-proof  
✅ Deployment-proof  
✅ **UNLIMITED AGENTS READY FOR PRODUCTION**

---

## Troubleshooting

### Issue: Agents deleted after restart
**Fix:** Check `backend/src/seed.js` — line 10 should be `if (userCount > 0) return;`

### Issue: Lead doesn't show agent name
**Fix:** Restart backend, check `/api/leads` includes `assigned_name` field

### Issue: Can't deactivate agent
**Fix:** Check token is valid, agent exists, and you're admin role

### Issue: Can't remove last admin
**Expected:** Error message "Ek admin hamesha rehna chahiye"

### Issue: Database constraints error
**Fix:** Ensure `crm.db` has `is_deleted` columns in users table
