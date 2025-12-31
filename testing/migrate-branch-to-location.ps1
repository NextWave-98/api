#!/usr/bin/env pwsh
# Branch to Location Migration Script
# This script automates the tedious find-replace operations
# Run from LTS-Api directory: .\migrate-branch-to-location.ps1

param(
    [switch]$DryRun = $false
)

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Branch → Location Migration Script" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN MODE] - No files will be modified" -ForegroundColor Yellow
    Write-Host ""
}

# Create backup
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = ".\migration_backup_$timestamp"

if (-not $DryRun) {
    Write-Host "Creating backup..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item -Path ".\src" -Destination "$backupDir\src" -Recurse -Force
    Write-Host "✓ Backup created: $backupDir" -ForegroundColor Green
    Write-Host ""
}

# Define all replacements
$simpleReplacements = @{
    # Prisma model access
    'prisma\.branch\.findMany' = 'prisma.location.findMany'
    'prisma\.branch\.findUnique' = 'prisma.location.findUnique'
    'prisma\.branch\.findFirst' = 'prisma.location.findFirst'
    'prisma\.branch\.create' = 'prisma.location.create'
    'prisma\.branch\.update' = 'prisma.location.update'
    'prisma\.branch\.delete' = 'prisma.location.delete'
    'prisma\.branch\.count' = 'prisma.location.count'
    'prisma\.branch\.groupBy' = 'prisma.location.groupBy'
    
    # Include patterns - be careful with these
    'include:\s*\{\s*branch:' = 'include: { location:'
    
    # Property access
    '\.branch\.code([^a-zA-Z])' = '.location.locationCode$1'
    '\.branch\?\.code([^a-zA-Z])' = '.location?.locationCode$1'
    '\.branch\.isActive' = '.location.isActive'
    '\.branch\?\.isActive' = '.location?.isActive'
    
    # User object properties
    'user\.branch\?\.id' = 'user.location?.id'
    'user\.branch\?\.code' = 'user.location?.locationCode'
    'user\.branch\?\.name' = 'user.location?.name'
    'user\.branch &&' = 'user.location &&'
    'updatedUser\.branch' = 'updatedUser.location'
    
    # Database field names in where/data
    'where:\s*\{\s*branchId:' = 'where: { locationId:'
    'where:\s*\{\s*branchId\s*\}' = 'where: { locationId }'
    'data:\s*\{\s*branchId:' = 'data: { locationId:'
    '\{\s*branchId\s*\}' = '{ locationId }'
    'branchId,' = 'locationId,'
    'branchId:' = 'locationId:'
    'branchId\?' = 'locationId?'
    
    # DTO and interface fields
    'branchCode:' = 'locationCode:'
    'branchCode\?' = 'locationCode?'
    'branchName:' = 'locationName:'
    
    # Variable names in code
    'const\s+branchId\s*=' = 'const locationId ='
    'let\s+branchId\s*=' = 'let locationId ='
    '\(\s*branchId\s*\)' = '(locationId)'
    '\[\s*branchId\s*\]' = '[locationId]'
    
    # Comments
    'Check if.*branch is' = 'Check if location is'
    'Verify branch' = 'Verify location'
    'assigned branch' = 'assigned location'
    'user.*s branch' = 'users location'
}

# Files to process
$files = Get-ChildItem -Path ".\src" -Filter "*.ts" -Recurse | Where-Object {
    $_.FullName -notlike "*\node_modules\*"
}

Write-Host "Found $($files.Count) TypeScript files to process" -ForegroundColor Cyan
Write-Host ""

$filesModified = 0
$totalReplacements = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace((Get-Location).Path, ".")
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if (-not $content) {
        continue
    }
    
    $originalContent = $content
    $fileChanges = 0
    
    foreach ($pattern in $simpleReplacements.Keys) {
        $replacement = $simpleReplacements[$pattern]
        $matches = [regex]::Matches($content, $pattern)
        
        if ($matches.Count -gt 0) {
            $content = $content -replace $pattern, $replacement
            $fileChanges += $matches.Count
            $totalReplacements += $matches.Count
        }
    }
    
    if ($content -ne $originalContent) {
        $filesModified++
        Write-Host "✓ $relativePath" -ForegroundColor Yellow
        Write-Host "  └─ $fileChanges replacements" -ForegroundColor Gray
        
        if (-not $DryRun) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
        }
    }
}

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Migration Summary" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Files processed: $($files.Count)" -ForegroundColor White
Write-Host "Files modified: $filesModified" -ForegroundColor $(if ($filesModified -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Total replacements: $totalReplacements" -ForegroundColor $(if ($totalReplacements -gt 0) { 'Yellow' } else { 'Green' })
Write-Host ""

if ($DryRun) {
    Write-Host "This was a DRY RUN - no files were actually modified" -ForegroundColor Yellow
    Write-Host "Run without -DryRun flag to apply changes" -ForegroundColor Yellow
} else {
    Write-Host "✓ Changes applied successfully" -ForegroundColor Green
    Write-Host "✓ Backup saved to: $backupDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Review the changes with: git diff" -ForegroundColor White
Write-Host "2. Fix remaining complex cases manually (see BRANCH_TO_LOCATION_FIX_GUIDE.md)" -ForegroundColor White
Write-Host "3. Run: npm run build" -ForegroundColor White
Write-Host "4. Fix any remaining TypeScript errors" -ForegroundColor White
Write-Host "5. Test thoroughly before committing" -ForegroundColor White
Write-Host ""

# Show remaining manual fixes needed
Write-Host "MANUAL FIXES STILL REQUIRED:" -ForegroundColor Red
Write-Host "- branch.service.ts - Add locationType: 'BRANCH' filters" -ForegroundColor Yellow
Write-Host "- goodsreceipt.service.ts - Add destinationLocationId field" -ForegroundColor Yellow
Write-Host "- inventory.service.ts - Add product/location includes" -ForegroundColor Yellow
Write-Host "- sales.dto.ts - Update interfaces" -ForegroundColor Yellow
Write-Host "- Update all select statements: code to locationCode" -ForegroundColor Yellow
Write-Host ""
