-- Manual Schema Fix for Lead Creation Tracking
-- Run this if migrations don't work automatically

-- Step 1: Add created_by column (if it doesn't exist)
-- This will fail silently if column already exists
ALTER TABLE leads ADD COLUMN created_by INTEGER REFERENCES users(id);

-- Step 2: Add created_by_name column (if it doesn't exist)
ALTER TABLE leads ADD COLUMN created_by_name TEXT;

-- Step 3: Fill created_by for existing leads
-- Assign leads to whoever they're assigned to (best guess)
UPDATE leads
SET created_by = assigned_to,
    created_by_name = (
      SELECT name FROM users WHERE id = leads.assigned_to LIMIT 1
    )
WHERE created_by IS NULL AND assigned_to IS NOT NULL;

-- Step 4: Fill remaining leads to admin
UPDATE leads
SET created_by = (SELECT id FROM users WHERE role='admin' AND is_deleted=0 LIMIT 1),
    created_by_name = (SELECT name FROM users WHERE role='admin' AND is_deleted=0 LIMIT 1)
WHERE created_by IS NULL;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- Verify
SELECT COUNT(*) as total_leads,
       SUM(CASE WHEN created_by IS NOT NULL THEN 1 ELSE 0 END) as leads_with_creator
FROM leads;
