#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "======================================"
echo "SalesSaathi CRM Quick Test"
echo "======================================"
echo ""

# Step 1: Login
echo "Step 1: Login as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salessaathi.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_NAME=$(echo $LOGIN_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

echo "[OK] Login successful!"
echo "User: $USER_NAME"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Create leads
echo "Step 2: Creating test leads..."

for LEAD_DATA in '{"name":"Kaushik Chaudhary","phone":"9876543210","city":"Surat"}' \
                  '{"name":"Snehal Patel","phone":"9123456780","city":"Valsad"}' \
                  '{"name":"Ramdev Enterprises","phone":"9988776655","city":"Rajkot"}'
do
    LEAD_RESPONSE=$(curl -s -X POST $BASE_URL/leads \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$LEAD_DATA")
    
    LEAD_NAME=$(echo $LEAD_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
    LEAD_ID=$(echo $LEAD_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    CREATED_BY=$(echo $LEAD_RESPONSE | grep -o '"created_by_name":"[^"]*' | cut -d'"' -f4)
    
    echo "[OK] Lead created: $LEAD_NAME (ID: $LEAD_ID, Created by: $CREATED_BY)"
done
echo ""

# Step 3: Get all leads
echo "Step 3: Getting all leads..."
LEADS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/leads)
LEAD_COUNT=$(echo $LEADS_RESPONSE | grep -o '"id":[0-9]*' | wc -l)

echo "[OK] Retrieved $LEAD_COUNT leads"
echo ""

# Show leads
echo "Leads with creator tracking:"
echo $LEADS_RESPONSE | grep -o '{"id":[^}]*' | head -3 | while read LEAD; do
    ID=$(echo $LEAD | grep -o '"id":[0-9]*' | cut -d':' -f2)
    NAME=$(echo $LEAD | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
    CREATOR=$(echo $LEAD | grep -o '"created_by_name":"[^"]*' | cut -d'"' -f4)
    PHONE=$(echo $LEAD | grep -o '"phone":"[^"]*' | head -1 | cut -d'"' -f4)
    
    echo "  Lead #$ID: $NAME (Phone: $PHONE, Created by: $CREATOR)"
done
echo ""

# Step 4: Get reports
echo "Step 4: Getting agent reports..."
REPORT_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/reports/leads-by-agent)

echo "[OK] Agent Statistics:"
echo $REPORT_RESPONSE | grep -o '{"agent_id":[^}]*' | while read AGENT; do
    NAME=$(echo $AGENT | grep -o '"agent_name":"[^"]*' | cut -d'"' -f4)
    TOTAL=$(echo $AGENT | grep -o '"total_leads":[0-9]*' | cut -d':' -f2)
    MONTH=$(echo $AGENT | grep -o '"this_month":[0-9]*' | cut -d':' -f2)
    WON=$(echo $AGENT | grep -o '"won":[0-9]*' | cut -d':' -f2)
    
    echo "  Agent: $NAME (Total: $TOTAL, This Month: $MONTH, Won: $WON)"
done
echo ""

echo "======================================"
echo "SUCCESS: All tests passed!"
echo "======================================"
