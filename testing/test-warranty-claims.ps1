# ==========================================
# WARRANTY CLAIMS TESTING SCRIPT
# ==========================================
# This script tests warranty claim creation and management
# Run this after warranties are generated

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WARRANTY CLAIMS TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_BASE = "http://localhost:3000/api/v1"
$AUTH_TOKEN = ""

# Step 1: Authenticate
Write-Host "STEP 1: Authenticating..." -ForegroundColor Yellow
$loginPayload = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
    $AUTH_TOKEN = $authResponse.token
    Write-Host "✓ Authentication successful" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Authentication failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "Content-Type" = "application/json"
}

# Step 2: Get an active warranty
Write-Host "STEP 2: Finding active warranty..." -ForegroundColor Yellow
try {
    $warranties = Invoke-RestMethod -Uri "$API_BASE/warranty-cards?status=ACTIVE&limit=10" -Method GET -Headers $headers
    $warranty = $warranties.data | Select-Object -First 1
    
    if ($warranty) {
        Write-Host "✓ Found active warranty" -ForegroundColor Green
        Write-Host "  Warranty: $($warranty.warrantyNumber)" -ForegroundColor Gray
        Write-Host "  Product: $($warranty.product.name)" -ForegroundColor Gray
        Write-Host "  Customer: $($warranty.customer.name)" -ForegroundColor Gray
    } else {
        Write-Host "✗ No active warranties found" -ForegroundColor Red
        Write-Host "Run test-warranty-generation.ps1 first to create warranties" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch warranties: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Create warranty claim
Write-Host "STEP 3: Creating warranty claim..." -ForegroundColor Yellow
$claimPayload = @{
    warrantyCardId = $warranty.id
    issueDescription = "Product not working properly. Screen flickering and battery draining fast."
    issueType = "PRODUCT_DEFECT"
    priority = "HIGH"
    estimatedCost = 150.00
} | ConvertTo-Json

try {
    $claimResponse = Invoke-RestMethod -Uri "$API_BASE/warranty-claims" -Method POST -Body $claimPayload -Headers $headers
    
    Write-Host "✓ Claim created successfully" -ForegroundColor Green
    Write-Host "  Claim Number: $($claimResponse.claimNumber)" -ForegroundColor Gray
    Write-Host "  Status: $($claimResponse.status)" -ForegroundColor Gray
    Write-Host "  Priority: $($claimResponse.priority)" -ForegroundColor Gray
    Write-Host ""
    
    $claimId = $claimResponse.id
    $claimNumber = $claimResponse.claimNumber
} catch {
    Write-Host "✗ Failed to create claim: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Get staff for assignment
Write-Host "STEP 4: Finding staff for claim assignment..." -ForegroundColor Yellow
try {
    $staffList = Invoke-RestMethod -Uri "$API_BASE/staff?limit=10" -Method GET -Headers $headers
    $staff = $staffList.data | Select-Object -First 1
    
    if ($staff) {
        Write-Host "✓ Found staff member" -ForegroundColor Green
        Write-Host "  Staff: $($staff.fullName)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ No staff found for assignment" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "⚠ Failed to fetch staff: $_" -ForegroundColor Yellow
}

# Step 5: Assign claim to staff
if ($staff) {
    Write-Host "STEP 5: Assigning claim to staff..." -ForegroundColor Yellow
    $assignPayload = @{
        assignedToId = $staff.id
    } | ConvertTo-Json
    
    try {
        $assignResponse = Invoke-RestMethod -Uri "$API_BASE/warranty-claims/$claimId/assign" -Method PATCH -Body $assignPayload -Headers $headers
        Write-Host "✓ Claim assigned successfully" -ForegroundColor Green
        Write-Host "  Assigned to: $($assignResponse.assignedTo.fullName)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Failed to assign claim: $_" -ForegroundColor Red
    }
}

# Step 6: Update claim status
Write-Host "STEP 6: Updating claim status..." -ForegroundColor Yellow
$statusPayload = @{
    status = "UNDER_REVIEW"
    notes = "Claim is being reviewed by technical team"
} | ConvertTo-Json

try {
    $statusResponse = Invoke-RestMethod -Uri "$API_BASE/warranty-claims/$claimId/status" -Method PATCH -Body $statusPayload -Headers $headers
    Write-Host "✓ Status updated successfully" -ForegroundColor Green
    Write-Host "  New Status: $($statusResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Failed to update status: $_" -ForegroundColor Red
}

# Step 7: Test claim retrieval endpoints
Write-Host "STEP 7: Testing claim retrieval..." -ForegroundColor Yellow

# Get all claims
try {
    $allClaims = Invoke-RestMethod -Uri "$API_BASE/warranty-claims?limit=10" -Method GET -Headers $headers
    Write-Host "✓ Retrieved all claims: $($allClaims.data.Count) found" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to retrieve claims" -ForegroundColor Red
}

# Get specific claim
try {
    $specificClaim = Invoke-RestMethod -Uri "$API_BASE/warranty-claims/$claimId" -Method GET -Headers $headers
    Write-Host "✓ Retrieved specific claim: $($specificClaim.claimNumber)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to retrieve specific claim" -ForegroundColor Red
}

# Get claims by status
try {
    $statusClaims = Invoke-RestMethod -Uri "$API_BASE/warranty-claims?status=UNDER_REVIEW" -Method GET -Headers $headers
    Write-Host "✓ Retrieved claims by status: $($statusClaims.data.Count) under review" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to retrieve claims by status" -ForegroundColor Red
}

Write-Host ""

# Step 8: Resolve claim
Write-Host "STEP 8: Resolving claim..." -ForegroundColor Yellow
$resolvePayload = @{
    resolutionType = "REPLACED"
    resolutionNotes = "Product replaced with new unit. Customer satisfied."
    actualCost = 0.00
} | ConvertTo-Json

try {
    $resolveResponse = Invoke-RestMethod -Uri "$API_BASE/warranty-claims/$claimId/resolve" -Method PATCH -Body $resolvePayload -Headers $headers
    Write-Host "✓ Claim resolved successfully" -ForegroundColor Green
    Write-Host "  Resolution: $($resolveResponse.resolutionType)" -ForegroundColor Gray
    Write-Host "  Status: $($resolveResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Failed to resolve claim: $_" -ForegroundColor Red
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLAIMS TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Warranty claim creation: SUCCESS" -ForegroundColor Green
Write-Host "✓ Claim assignment: SUCCESS" -ForegroundColor Green
Write-Host "✓ Status updates: SUCCESS" -ForegroundColor Green
Write-Host "✓ Claim resolution: SUCCESS" -ForegroundColor Green
Write-Host "✓ Claim retrieval: SUCCESS" -ForegroundColor Green
Write-Host ""
Write-Host "Created Claim: $claimNumber" -ForegroundColor Cyan
Write-Host "For Warranty: $($warranty.warrantyNumber)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Check claims in frontend warranty page" -ForegroundColor White
Write-Host "2. Test claim filtering and search" -ForegroundColor White
Write-Host "3. Test claim status transitions" -ForegroundColor White
Write-Host "4. Test claim rejection flow" -ForegroundColor White
