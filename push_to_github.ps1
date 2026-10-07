Write-Host "========================================================" -ForegroundColor Green
Write-Host " Pushing Arecanut AI Project to GitHub" -ForegroundColor Green
Write-Host " Repository: https://github.com/Vinaysamaldar/Areca" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$git = "C:\Users\DELL\.gemini\antigravity\scratch\mingit\cmd\git.exe"

if (-not (Test-Path $git)) {
    Write-Host "[ERROR] Git executable not found at $git" -ForegroundColor Red
    pause
    exit
}

Set-Location $PSScriptRoot

Write-Host "`n[1/3] Adding files to git..." -ForegroundColor Cyan
& $git add -A

Write-Host "[2/3] Checking commit..." -ForegroundColor Cyan
& $git commit -m "Update Arecanut Disease Detection project files" 2>$null

Write-Host "[3/3] Pushing to https://github.com/Vinaysamaldar/Areca..." -ForegroundColor Cyan
& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Project successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Check your repository at: https://github.com/Vinaysamaldar/Areca" -ForegroundColor Green
} else {
    Write-Host "`n[NOTE] If GitHub prompted for credentials, use your GitHub Personal Access Token (PAT) as the password." -ForegroundColor Yellow
    Write-Host "Generate a token at: https://github.com/settings/tokens" -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
