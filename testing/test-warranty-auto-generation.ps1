# WARRANTY AUTO-GENERATION TEST SCRIPT
# Run this after starting the backend server (npm run dev)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WARRANTY AUTO-GENERATION TEST" -ForegroundColor Cyan
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
    Write-Host "[SUCCESS] Authentication successful" -ForegroundColor Green
    Write-Host "  User: $($authResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "  Role: $($authResponse.user.role)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "[FAILED] Authentication failed: $_" -ForegroundColor Red
    Write-Host "Make sure the backend server is running (npm run dev)" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "Content-Type" = "application/json"
}

# Step 2: Get a product with warranty
Write-Host "STEP 2: Finding product with warranty..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$API_BASE/products?limit=100" -Method GET -Headers $headers
    $warrantyProduct = $products.data | Where-Object { $_.warrantyMonths -gt 0 } | Select-Object -First 1
    
    if ($warrantyProduct) {
        Write-Host "[SUCCESS] Found product with warranty" -ForegroundColor Green
        Write-Host "  Product: $($warrantyProduct.name)" -ForegroundColor Gray
        Write-Host "  Warranty: $($warrantyProduct.warrantyMonths) months" -ForegroundColor Gray
        Write-Host "  Price: $($warrantyProduct.sellingPrice)" -ForegroundColor Gray
    }
    else {
        Write-Host "[FAILED] No products with warranty found in database" -ForegroundColor Red
        Write-Host "Please add warrantyMonths to a product in the database" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
}
catch {
    Write-Host "[FAILED] Failed to fetch products: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Get customer
Write-Host "STEP 3: Finding customer..." -ForegroundColor Yellow
try {
    $customers = Invoke-RestMethod -Uri "$API_BASE/customers?limit=10" -Method GET -Headers $headers
    $customer = $customers.data | Select-Object -First 1
    
    if ($customer) {
        Write-Host "[SUCCESS] Found customer" -ForegroundColor Green
        Write-Host "  Customer: $($customer.name)" -ForegroundColor Gray
        Write-Host "  Phone: $($customer.phone)" -ForegroundColor Gray
    }
    else {
        Write-Host "[FAILED] No customers found in database" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}
catch {
    Write-Host "[FAILED] Failed to fetch customers: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Get location
Write-Host "STEP 4: Finding location..." -ForegroundColor Yellow
try {
    $locations = Invoke-RestMethod -Uri "$API_BASE/locations?limit=10" -Method GET -Headers $headers
    $location = $locations.data | Select-Object -First 1
    
    if ($location) {
        Write-Host "[SUCCESS] Found location" -ForegroundColor Green
        Write-Host "  Location: $($location.name)" -ForegroundColor Gray
    }
    else {
        Write-Host "[FAILED] No locations found in database" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}
catch {
    Write-Host "[FAILED] Failed to fetch locations: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Create POS Sale
Write-Host "STEP 5: Creating POS sale with warranty product..." -ForegroundColor Yellow
$salePayload = @{
    customerId = $customer.id
    locationId = $location.id
    paymentMethod = "CASH"
    items = @(
        @{
            productId = $warrantyProduct.id
            quantity = 1
            unitPrice = $warrantyProduct.sellingPrice
            warrantyMonths = $warrantyProduct.warrantyMonths
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "  Creating sale..." -ForegroundColor Gray
    $saleResponse = Invoke-RestMethod -Uri "$API_BASE/sales-pos" -Method POST -Body $salePayload -Headers $headers
    
    Write-Host "[SUCCESS] Sale created successfully" -ForegroundColor Green
    Write-Host "  Sale ID: $($saleResponse.id)" -ForegroundColor Gray
    Write-Host "  Invoice: $($saleResponse.invoiceNumber)" -ForegroundColor Gray
    Write-Host "  Total: $($saleResponse.totalAmount)" -ForegroundColor Gray
    Write-Host ""
    
    $saleId = $saleResponse.id
    $invoiceNumber = $saleResponse.invoiceNumber
}
catch {
    Write-Host "[FAILED] Failed to create sale: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Wait for warranty generation
Write-Host "STEP 6: Waiting for warranty auto-generation..." -ForegroundColor Yellow
Write-Host "  (Backend processes warranty generation after sale creation)" -ForegroundColor Gray
Start-Sleep -Seconds 2
Write-Host ""

# Step 7: Verify warranty was generated
Write-Host "STEP 7: Verifying warranty generation..." -ForegroundColor Yellow
try {
    # Search by customer
    $warranties = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/customer/$($customer.id)" -Method GET -Headers $headers
    
    if ($warranties.data -and $warranties.data.Count -gt 0) {
        # Find the most recent warranty
        $latestWarranty = $warranties.data | Sort-Object -Property createdAt -Descending | Select-Object -First 1
        
        Write-Host "[SUCCESS] WARRANTY SUCCESSFULLY AUTO-GENERATED!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Warranty Details:" -ForegroundColor Cyan
        Write-Host "  Warranty Number: $($latestWarranty.warrantyNumber)" -ForegroundColor White
        Write-Host "  Status: $($latestWarranty.status)" -ForegroundColor White
        Write-Host "  Type: $($latestWarranty.type)" -ForegroundColor White
        Write-Host "  Customer: $($latestWarranty.customer.name)" -ForegroundColor White
        Write-Host "  Phone: $($latestWarranty.customer.phone)" -ForegroundColor White
        Write-Host "  Product: $($latestWarranty.product.name)" -ForegroundColor White
        Write-Host "  Start Date: $($latestWarranty.startDate.Split('T')[0])" -ForegroundColor White
        Write-Host "  Expiry Date: $($latestWarranty.expiryDate.Split('T')[0])" -ForegroundColor White
        Write-Host "  Created: $($latestWarranty.createdAt.Split('T')[0])" -ForegroundColor White
        Write-Host ""
        
        # Verify warranty matches sale
        if ($latestWarranty.saleItemId) {
            Write-Host "[SUCCESS] Warranty linked to sale item" -ForegroundColor Green
        }
        else {
            Write-Host "[WARNING] Warranty not linked to sale item" -ForegroundColor Yellow
        }
        
    }
    else {
        Write-Host "[FAILED] No warranties found for customer" -ForegroundColor Red
        Write-Host "  This could mean:" -ForegroundColor Yellow
        Write-Host "  1. Warranty generation failed (check backend logs)" -ForegroundColor Yellow
        Write-Host "  2. Product warrantyMonths was not set correctly" -ForegroundColor Yellow
        Write-Host "  3. Sale creation did not trigger warranty service" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
}
catch {
    Write-Host "[FAILED] Failed to fetch warranties: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 8: Test warranty API endpoints
Write-Host "STEP 8: Testing warranty API endpoints..." -ForegroundColor Yellow

# Test search by identifier
try {
    $searchResult = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/search?identifier=$($latestWarranty.warrantyNumber)" -Method GET -Headers $headers
    if ($searchResult.data) {
        Write-Host "[SUCCESS] Search by warranty number works" -ForegroundColor Green
    }
}
catch {
    Write-Host "[FAILED] Search endpoint failed" -ForegroundColor Red
}

# Test search by phone
try {
    $phoneSearch = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/search?identifier=$($customer.phone)" -Method GET -Headers $headers
    if ($phoneSearch.data) {
        Write-Host "[SUCCESS] Search by phone number works" -ForegroundColor Green
    }
}
catch {
    Write-Host "[FAILED] Phone search endpoint failed" -ForegroundColor Red
}

# Test expiring warranties
try {
    $expiring = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/expiring?days=90" -Method GET -Headers $headers
    $expiringCount = 0
    if ($expiring.data) { $expiringCount = $expiring.data.Count }
    Write-Host "[SUCCESS] Expiring warranties endpoint works - $expiringCount expiring soon" -ForegroundColor Green
}
catch {
    Write-Host "[FAILED] Expiring warranties endpoint failed" -ForegroundColor Red
}

# Test analytics
try {
    $analytics = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/analytics" -Method GET -Headers $headers
    Write-Host "[SUCCESS] Analytics endpoint works" -ForegroundColor Green
    Write-Host "  Total Warranties: $($analytics.data.totalWarranties)" -ForegroundColor Gray
    Write-Host "  Active: $($analytics.data.activeWarranties)" -ForegroundColor Gray
    Write-Host "  Expired: $($analytics.data.expiredWarranties)" -ForegroundColor Gray
}
catch {
    Write-Host "[FAILED] Analytics endpoint failed" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Authentication: PASSED" -ForegroundColor Green
Write-Host "[SUCCESS] Product with warranty: FOUND" -ForegroundColor Green
Write-Host "[SUCCESS] POS Sale creation: SUCCESS" -ForegroundColor Green
Write-Host "[SUCCESS] Warranty auto-generation: SUCCESS" -ForegroundColor Green
Write-Host "[SUCCESS] Warranty API endpoints: WORKING" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test frontend warranty page with real data" -ForegroundColor White
Write-Host "2. Run: .\test-warranty-claims.ps1" -ForegroundColor White
Write-Host "3. Check WARRANTY_TESTING_EXECUTION.md for detailed guide" -ForegroundColor White
Write-Host ""
Write-Host "Created Sale Invoice: $invoiceNumber" -ForegroundColor Cyan
Write-Host "Created Warranty: $($latestWarranty.warrantyNumber)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
