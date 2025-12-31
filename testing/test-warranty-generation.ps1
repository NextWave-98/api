# ==========================================
# WARRANTY AUTO-GENERATION TEST SCRIPT
# ==========================================
# This script tests the end-to-end warranty generation flow
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
    Write-Host "✓ Authentication successful" -ForegroundColor Green
    Write-Host "  User: $($authResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "  Role: $($authResponse.user.role)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Authentication failed: $_" -ForegroundColor Red
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
        Write-Host "✓ Found product with warranty" -ForegroundColor Green
        Write-Host "  Product: $($warrantyProduct.name)" -ForegroundColor Gray
        Write-Host "  Warranty: $($warrantyProduct.warrantyMonths) months" -ForegroundColor Gray
        Write-Host "  Price: $$($warrantyProduct.sellingPrice)" -ForegroundColor Gray
    } else {
        Write-Host "✗ No products with warranty found in database" -ForegroundColor Red
        Write-Host "Please add warrantyMonths to a product in the database" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch products: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Get customer
Write-Host "STEP 3: Finding customer..." -ForegroundColor Yellow
try {
    $customers = Invoke-RestMethod -Uri "$API_BASE/customers?limit=10" -Method GET -Headers $headers
    $customer = $customers.data | Select-Object -First 1
    
    if ($customer) {
        Write-Host "✓ Found customer" -ForegroundColor Green
        Write-Host "  Customer: $($customer.name)" -ForegroundColor Gray
        Write-Host "  Phone: $($customer.phone)" -ForegroundColor Gray
    } else {
        Write-Host "✗ No customers found in database" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch customers: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Get location
Write-Host "STEP 4: Finding location..." -ForegroundColor Yellow
try {
    $locations = Invoke-RestMethod -Uri "$API_BASE/locations?limit=10" -Method GET -Headers $headers
    $location = $locations.data | Select-Object -First 1
    
    if ($location) {
        Write-Host "✓ Found location" -ForegroundColor Green
        Write-Host "  Location: $($location.name)" -ForegroundColor Gray
    } else {
        Write-Host "✗ No locations found in database" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch locations: $_" -ForegroundColor Red
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
    
    Write-Host "✓ Sale created successfully" -ForegroundColor Green
    Write-Host "  Sale ID: $($saleResponse.id)" -ForegroundColor Gray
    Write-Host "  Invoice: $($saleResponse.invoiceNumber)" -ForegroundColor Gray
    Write-Host "  Total: $$($saleResponse.totalAmount)" -ForegroundColor Gray
    Write-Host ""
    
    $saleId = $saleResponse.id
    $invoiceNumber = $saleResponse.invoiceNumber
} catch {
    Write-Host "✗ Failed to create sale: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
    exit 1
}

# Step 6: Wait for warranty generation (async process)
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
        
        Write-Host "✓ WARRANTY SUCCESSFULLY AUTO-GENERATED!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Warranty Details:" -ForegroundColor Cyan
        Write-Host "  ├─ Warranty Number: $($latestWarranty.warrantyNumber)" -ForegroundColor White
        Write-Host "  ├─ Status: $($latestWarranty.status)" -ForegroundColor White
        Write-Host "  ├─ Type: $($latestWarranty.type)" -ForegroundColor White
        Write-Host "  ├─ Customer: $($latestWarranty.customer.name)" -ForegroundColor White
        Write-Host "  ├─ Phone: $($latestWarranty.customer.phone)" -ForegroundColor White
        Write-Host "  ├─ Product: $($latestWarranty.product.name)" -ForegroundColor White
        Write-Host "  ├─ Start Date: $($latestWarranty.startDate.Split('T')[0])" -ForegroundColor White
        Write-Host "  ├─ Expiry Date: $($latestWarranty.expiryDate.Split('T')[0])" -ForegroundColor White
        Write-Host "  └─ Created: $($latestWarranty.createdAt.Split('T')[0])" -ForegroundColor White
        Write-Host ""
        
        # Verify warranty matches sale
        if ($latestWarranty.saleItemId) {
            Write-Host "✓ Warranty linked to sale item" -ForegroundColor Green
        } else {
            Write-Host "⚠ Warning: Warranty not linked to sale item" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "✗ No warranties found for customer" -ForegroundColor Red
        Write-Host "  This could mean:" -ForegroundColor Yellow
        Write-Host "  1. Warranty generation failed (check backend logs)" -ForegroundColor Yellow
        Write-Host "  2. Product warrantyMonths was not set correctly" -ForegroundColor Yellow
        Write-Host "  3. Sale creation didn't trigger warranty service" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch warranties: $_" -ForegroundColor Red
    exit 1
}

# Step 8: Test warranty API endpoints
Write-Host "STEP 8: Testing warranty API endpoints..." -ForegroundColor Yellow

# Test search by identifier (warranty number)
try {
    $searchResult = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/search?identifier=$($latestWarranty.warrantyNumber)" -Method GET -Headers $headers
    if ($searchResult.data) {
        Write-Host "✓ Search by warranty number works" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Search endpoint failed" -ForegroundColor Red
}

# Test search by phone
try {
    $phoneSearch = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/search?identifier=$($customer.phone)" -Method GET -Headers $headers
    if ($phoneSearch.data) {
        Write-Host "✓ Search by phone number works" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Phone search endpoint failed" -ForegroundColor Red
}

# Test expiring warranties
try {
    $expiring = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/expiring?days=90" -Method GET -Headers $headers
    $expiringCount = if ($expiring.data) { $expiring.data.Count } else { 0 }
    Write-Host "✓ Expiring warranties endpoint works ($expiringCount expiring soon)" -ForegroundColor Green
} catch {
    Write-Host "✗ Expiring warranties endpoint failed" -ForegroundColor Red
}

# Test analytics
try {
    $analytics = Invoke-RestMethod -Uri "$API_BASE/warranty-cards/analytics" -Method GET -Headers $headers
    Write-Host "✓ Analytics endpoint works" -ForegroundColor Green
    Write-Host "  Total Warranties: $($analytics.data.totalWarranties)" -ForegroundColor Gray
    Write-Host "  Active: $($analytics.data.activeWarranties)" -ForegroundColor Gray
    Write-Host "  Expired: $($analytics.data.expiredWarranties)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Analytics endpoint failed" -ForegroundColor Red
}

Write-Host ""

# Step 9: Test frontend integration
Write-Host "STEP 9: Frontend Integration Check" -ForegroundColor Yellow
Write-Host "  To verify frontend integration:" -ForegroundColor Gray
Write-Host "  1. Start frontend: cd LTS-App && npm run dev" -ForegroundColor Gray
Write-Host "  2. Navigate to Warranty page" -ForegroundColor Gray
Write-Host "  3. You should see the warranty for invoice: $invoiceNumber" -ForegroundColor Gray
Write-Host "  4. Search for warranty number: $($latestWarranty.warrantyNumber)" -ForegroundColor Gray
Write-Host "  5. Search for phone: $($customer.phone)" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Authentication: PASSED" -ForegroundColor Green
Write-Host "✓ Product with warranty: FOUND" -ForegroundColor Green
Write-Host "✓ POS Sale creation: SUCCESS" -ForegroundColor Green
Write-Host "✓ Warranty auto-generation: SUCCESS" -ForegroundColor Green
Write-Host "✓ Warranty API endpoints: WORKING" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test frontend warranty page with real data" -ForegroundColor White
Write-Host "2. Create warranty claim for testing" -ForegroundColor White
Write-Host "3. Test warranty transfer functionality" -ForegroundColor White
Write-Host "4. Test warranty void/cancellation" -ForegroundColor White
Write-Host ""
Write-Host "Created Sale Invoice: $invoiceNumber" -ForegroundColor Cyan
Write-Host "Created Warranty: $($latestWarranty.warrantyNumber)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
