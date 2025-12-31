# PowerShell script to migrate all branch references to location in TypeScript files
# Run from the LTS-Api directory

Write-Host "Starting Branch -> Location Migration..." -ForegroundColor Green

# Define replacement patterns
$replacements = @(
    # Prisma queries
    @{ Pattern = 'prisma\.branch\.findMany'; Replacement = 'prisma.location.findMany' }
    @{ Pattern = 'prisma\.branch\.findUnique'; Replacement = 'prisma.location.findUnique' }
    @{ Pattern = 'prisma\.branch\.findFirst'; Replacement = 'prisma.location.findFirst' }
    @{ Pattern = 'prisma\.branch\.create'; Replacement = 'prisma.location.create' }
    @{ Pattern = 'prisma\.branch\.update'; Replacement = 'prisma.location.update' }
    @{ Pattern = 'prisma\.branch\.delete'; Replacement = 'prisma.location.delete' }
    @{ Pattern = 'prisma\.branch\.count'; Replacement = 'prisma.location.count' }
    
    # Include/Select patterns
    @{ Pattern = 'include:\s*{\s*branch:'; Replacement = 'include: { location:' }
    @{ Pattern = 'select:\s*{\s*branch:'; Replacement = 'select: { location:' }
    
    # Field references in queries
    @{ Pattern = 'where:\s*{\s*branchId'; Replacement = 'where: { locationId' }
    @{ Pattern = 'data:\s*{\s*branchId'; Replacement = 'data: { locationId' }
    
    # Property access
    @{ Pattern = '\.branch\.code'; Replacement = '.location.locationCode' }
    @{ Pattern = '\.branch\.name'; Replacement = '.location.name' }
    @{ Pattern = '\.branch\.id'; Replacement = '.location.id' }
    @{ Pattern = '\.branch\.isActive'; Replacement = '.location.isActive' }
    @{ Pattern = '\.branch\?\.code'; Replacement = '.location?.locationCode' }
    @{ Pattern = '\.branch\?\.name'; Replacement = '.location?.name' }
    @{ Pattern = '\.branch\?\.id'; Replacement = '.location?.id' }
    
    # Variable declarations
    @{ Pattern = 'const\s+branch\s*=\s*await\s+prisma\.location'; Replacement = 'const location = await prisma.location' }
    
    # Object properties in return statements
    @{ Pattern = 'branchId:\s*user\.branch\?\.id'; Replacement = 'locationId: user.location?.id' }
    @{ Pattern = 'branchCode:\s*user\.branch\?\.code'; Replacement = 'locationCode: user.location?.locationCode' }
    
    # Comments
    @{ Pattern = '// Check if.*branch'; Replacement = '// Check if location' }
    @{ Pattern = '// Verify branch'; Replacement = '// Verify location' }
)

# Get all TypeScript files in src directory
$files = Get-ChildItem -Path ".\src" -Filter "*.ts" -Recurse

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $fileModified = $false
    
    foreach ($replacement in $replacements) {
        if ($content -match $replacement.Pattern) {
            $content = $content -replace $replacement.Pattern, $replacement.Replacement
            $fileModified = $true
        }
    }
    
    if ($fileModified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFiles++
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Yellow
    }
}

Write-Host "`nMigration Summary:" -ForegroundColor Green
Write-Host "Files modified: $totalFiles" -ForegroundColor Cyan

Write-Host "`nIMPORTANT: Manual fixes still required:" -ForegroundColor Red
Write-Host "1. Update branch.service.ts to use location model properly" -ForegroundColor Yellow
Write-Host "2. Update DTOs that reference branchId to locationId" -ForegroundColor Yellow
Write-Host "3. Update any custom business logic that assumes branch-specific behavior" -ForegroundColor Yellow
Write-Host "4. Test all endpoints thoroughly" -ForegroundColor Yellow
Write-Host "`nRun 'npm run build' to check for remaining TypeScript errors" -ForegroundColor Green
