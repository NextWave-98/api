# Test Login
$login = @{
    email = "admin@123.com"
    password = "Ma12345%"
} | ConvertTo-Json

Write-Host "Testing login with admin@123.com..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $login -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "SUCCESS! Logged in as: $($response.data.user.name)" -ForegroundColor Green
        Write-Host "Token: $($response.data.accessToken.Substring(0, 30))..." -ForegroundColor Yellow
        
        # Test notifications
        Write-Host "`nTesting /api/notifications/my..." -ForegroundColor Cyan
        $notifs = Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/my?limit=10" -Method Get -Headers @{ Authorization = "Bearer $($response.data.accessToken)" }
        
        Write-Host "Found $($notifs.data.pagination.total) notifications" -ForegroundColor White
        
        if ($notifs.data.data.Count -gt 0) {
            foreach ($n in $notifs.data.data) {
                Write-Host "  - $($n.title) [$($n.status)] - $($n.type)" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
