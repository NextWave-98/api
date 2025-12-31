# Complete Notification System Test
$login = @{
    email = "admin@123.com"
    password = "Ma12345%"
} | ConvertTo-Json

Write-Host "=== NOTIFICATION SYSTEM TEST ===" -ForegroundColor Cyan
Write-Host ""

try {
    # Login
    Write-Host "1. Testing Login..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $login -ContentType "application/json"
    $token = $response.data.accessToken
    Write-Host "   SUCCESS - Logged in as: $($response.data.user.name)" -ForegroundColor Green
    Write-Host ""

    # Test My Notifications
    Write-Host "2. Testing GET /api/notifications/my..." -ForegroundColor Yellow
    $notifs = Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/my?limit=10" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "   Found: $($notifs.data.pagination.total) notifications" -ForegroundColor Green
    
    if ($notifs.data.data.Count -gt 0) {
        foreach ($n in $notifs.data.data) {
            Write-Host "   - [$($n.status)] $($n.title)" -ForegroundColor White
            Write-Host "     Type: $($n.type) | Created: $($n.createdAt)" -ForegroundColor Gray
        }
    }
    Write-Host ""

    # Test Notification Settings
    Write-Host "3. Testing GET /api/notifications/settings..." -ForegroundColor Yellow
    $settings = Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/settings" -Method Get -Headers @{ Authorization = "Bearer $token" }
    
    if ($settings.data.summary) {
        Write-Host "   Summary:" -ForegroundColor Green
        Write-Host "     Total Settings: $($settings.data.summary.total)" -ForegroundColor White
        Write-Host "     Enabled: $($settings.data.summary.enabled)" -ForegroundColor White
        Write-Host "     Disabled: $($settings.data.summary.disabled)" -ForegroundColor White
        Write-Host ""
        Write-Host "   Categories:" -ForegroundColor Green
        
        $categories = @("jobSheetNotifications", "salesNotifications", "returnNotifications", "generalNotifications")
        foreach ($cat in $categories) {
            if ($settings.data.categorized.$cat) {
                $count = $settings.data.categorized.$cat.Count
                Write-Host "     $cat : $count settings" -ForegroundColor White
            }
        }
    }
    Write-Host ""

    Write-Host "=== ALL TESTS PASSED ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "1. Login endpoint working" -ForegroundColor White
    Write-Host "2. /my endpoint returning $($notifs.data.pagination.total) notifications" -ForegroundColor White
    Write-Host "3. /settings endpoint returning categorized settings" -ForegroundColor White

} catch {
    Write-Host ""
    Write-Host "=== TEST FAILED ===" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
