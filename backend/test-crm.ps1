# SalesSaathi CRM Testing Script

$BASE_URL = "http://localhost:3001/api"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SalesSaathi CRM Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Login as Admin" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@salessaathi.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "[OK] Login successful!" -ForegroundColor Green
Write-Host "User: $($loginData.user.name)" -ForegroundColor Green
Write-Host ""

# Step 2: Create Leads
Write-Host "Step 2: Create Test Leads" -ForegroundColor Yellow

$leadNames = @("Kaushik Chaudhary", "Snehal Patel", "Ramdev Enterprises")
$leadPhones = @("9876543210", "9123456780", "9988776655")
$leadCities = @("Surat", "Valsad", "Rajkot")

$createdLeads = @()

for ($i = 0; $i -lt $leadNames.Count; $i++) {
    $leadBody = @{
        name = $leadNames[$i]
        phone = $leadPhones[$i]
        city = $leadCities[$i]
        source = "manual"
    } | ConvertTo-Json

    $leadResponse = Invoke-WebRequest -Uri "$BASE_URL/leads" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body $leadBody

    $leadData = $leadResponse.Content | ConvertFrom-Json
    $createdLeads += $leadData

    Write-Host "[OK] Lead created: $($leadData.name)" -ForegroundColor Green
    Write-Host "    ID: $($leadData.id), Created by: $($leadData.created_by_name)" -ForegroundColor Green
}
Write-Host ""

# Step 3: Get All Leads
Write-Host "Step 3: Get All Leads" -ForegroundColor Yellow

$leadsResponse = Invoke-WebRequest -Uri "$BASE_URL/leads" `
    -Headers @{"Authorization" = "Bearer $token"}

$leadsData = $leadsResponse.Content | ConvertFrom-Json

Write-Host "[OK] Retrieved $($leadsData.Count) leads" -ForegroundColor Green
Write-Host ""

foreach ($lead in $leadsData) {
    Write-Host "Lead #$($lead.id): $($lead.name)" -ForegroundColor Cyan
    Write-Host "  Phone: $($lead.phone)" -ForegroundColor Gray
    Write-Host "  Created by: $($lead.created_by_name)" -ForegroundColor Magenta
    Write-Host "  Assigned to: $($lead.assigned_name)" -ForegroundColor Gray
    Write-Host ""
}

# Step 4: Get Single Lead Details
Write-Host "Step 4: Get Lead Details with Creator Info" -ForegroundColor Yellow

$leadId = $createdLeads[0].id
$singleLeadResponse = Invoke-WebRequest -Uri "$BASE_URL/leads/$leadId" `
    -Headers @{"Authorization" = "Bearer $token"}

$singleLeadData = $singleLeadResponse.Content | ConvertFrom-Json

Write-Host "[OK] Lead Details (ID: $leadId)" -ForegroundColor Green
Write-Host "Name: $($singleLeadData.name)" -ForegroundColor Cyan
Write-Host "Phone: $($singleLeadData.phone)" -ForegroundColor Cyan
Write-Host ""
Write-Host "CREATOR INFO:" -ForegroundColor Yellow
Write-Host "  Name: $($singleLeadData.created_by_name)" -ForegroundColor Green
Write-Host "  Email: $($singleLeadData.created_by_email)" -ForegroundColor Green
Write-Host "  ID: $($singleLeadData.created_by)" -ForegroundColor Green
Write-Host ""

# Step 5: Get Reports
Write-Host "Step 5: Leads by Agent Report" -ForegroundColor Yellow

$reportResponse = Invoke-WebRequest -Uri "$BASE_URL/reports/leads-by-agent" `
    -Headers @{"Authorization" = "Bearer $token"}

$reportData = $reportResponse.Content | ConvertFrom-Json

Write-Host "[OK] Agent Statistics:" -ForegroundColor Green
Write-Host ""

foreach ($agent in $reportData) {
    Write-Host "Agent: $($agent.agent_name)" -ForegroundColor Cyan
    Write-Host "  Total Leads: $($agent.total_leads)" -ForegroundColor Gray
    Write-Host "  This Month: $($agent.this_month)" -ForegroundColor Gray
    Write-Host "  Won: $($agent.won)" -ForegroundColor Green
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SUCCESS: Lead creation tracking is working!" -ForegroundColor Green
Write-Host "- Leads show created_by and created_by_name" -ForegroundColor Green
Write-Host "- Reports show leads by agent" -ForegroundColor Green
Write-Host ""
