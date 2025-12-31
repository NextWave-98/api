# Quick Test Script for Notifications
Write-Host "Testing Notification System..." -ForegroundColor Cyan

# Login
$login = @{ email = "admin@123.com"; password = "Admin@123" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $login -ContentType "application/json"
$token = $response.data.accessToken

Write-Host "Logged in as: $($response.data.user.name)" -ForegroundColor Green

# Get notifications
$notifs = Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/my?limit=10" -Method Get -Headers @{ Authorization = "Bearer $token" }

Write-Host "`nYour Notifications: $($notifs.data.pagination.total) total" -ForegroundColor Cyan

if ($notifs.data.data.Count -gt 0) {
    foreach ($n in $notifs.data.data) {
        Write-Host "  - $($n.title) [$($n.status)]" -ForegroundColor White
    }
    Write-Host "`nSUCCESS!" -ForegroundColor Green
} else {
    Write-Host "No notifications found. Run test again after creating test data." -ForegroundColor Yellow
}
