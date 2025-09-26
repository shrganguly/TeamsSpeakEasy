# Teams App Package Creator

param(
    [string]$AppId = "",
    [string]$BaseUrl = "",
    [string]$Domain = ""
)

Write-Host " Creating Teams App Package" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Get environment variables if not provided
if (-not $AppId -or -not $BaseUrl -or -not $Domain) {
    Write-Host " Required parameters not provided. Please provide:" -ForegroundColor Yellow
    
    if (-not $AppId) {
        $AppId = Read-Host "Enter your Teams App ID (GUID) or press Enter for auto-generated"
        if (-not $AppId) {
            $AppId = [System.Guid]::NewGuid().ToString()
            Write-Host " Generated App ID: $AppId" -ForegroundColor Green
        }
    }
    
    if (-not $BaseUrl) {
        $BaseUrl = "https://teamsspeakeasy.onrender.com"
        Write-Host " Using Render production URL: $BaseUrl" -ForegroundColor Green
    }
    
    if (-not $Domain) {
        $Domain = $BaseUrl -replace "https://", ""
    }
}

# Validate inputs
if (-not $BaseUrl.StartsWith("https://")) {
    Write-Host " Base URL must start with https://" -ForegroundColor Red
    exit 1
}

# Update manifest with actual values
$manifestPath = "appPackage/manifest.json"
$manifestContent = Get-Content $manifestPath -Raw

$manifestContent = $manifestContent -replace '\$\(TEAMS_APP_ID\)', $AppId
$manifestContent = $manifestContent -replace '\$\(TEAMS_APP_BASE_URL\)', $BaseUrl
$manifestContent = $manifestContent -replace '\$\(TEAMS_APP_DOMAIN\)', $Domain

$manifestContent | Set-Content $manifestPath

Write-Host " Updated manifest.json with deployment details" -ForegroundColor Green
Write-Host "   App ID: $AppId" -ForegroundColor White
Write-Host "   Base URL: $BaseUrl" -ForegroundColor White
Write-Host "   Domain: $Domain" -ForegroundColor White

# Create package
$packageName = "SpeakEasy-Production-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"

try {
    Compress-Archive -Path "appPackage/*" -DestinationPath $packageName -Force
    Write-Host " Teams app package created: $packageName" -ForegroundColor Green
    
    Write-Host ""
    Write-Host " Installation Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open Microsoft Teams" -ForegroundColor White
    Write-Host "2. Go to Apps  Upload a custom app" -ForegroundColor White
    Write-Host "3. Select: $packageName" -ForegroundColor Yellow
    Write-Host "4. Install for your team/organization" -ForegroundColor White
    Write-Host ""
    Write-Host " Usage:" -ForegroundColor Cyan
    Write-Host "- Open any chat in Teams" -ForegroundColor White
    Write-Host "- Click the  Voice Message button in compose area" -ForegroundColor White
    Write-Host "- Record your message and get AI summary" -ForegroundColor White
    Write-Host "- Edit if needed and insert into chat" -ForegroundColor White
    
} catch {
    Write-Host " Failed to create package: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Update .env file
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace "TEAMS_APP_ID=.*", "TEAMS_APP_ID=$AppId"
$envContent = $envContent -replace "TEAMS_APP_BASE_URL=.*", "TEAMS_APP_BASE_URL=$BaseUrl"
$envContent = $envContent -replace "TEAMS_APP_DOMAIN=.*", "TEAMS_APP_DOMAIN=$Domain"
$envContent | Set-Content ".env"

Write-Host " Updated .env file with package details" -ForegroundColor Green
