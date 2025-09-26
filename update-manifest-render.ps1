# Teams Manifest Updater for Render
# Usage: ./update-manifest-render.ps1 -RenderUrl "https://your-service-name.onrender.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$RenderUrl
)

# Validate URL format
if (-not ($RenderUrl -match "^https://.*\.onrender\.com$")) {
    Write-Host "❌ Invalid Render URL format. Expected: https://your-service-name.onrender.com" -ForegroundColor Red
    exit 1
}

# Remove trailing slash if present
$RenderUrl = $RenderUrl.TrimEnd('/')

Write-Host "🔄 Updating Teams manifest with Render URL: $RenderUrl" -ForegroundColor Cyan

# Read current manifest
$manifestPath = "appPackage\manifest.json"
if (-not (Test-Path $manifestPath)) {
    Write-Host "❌ Manifest file not found: $manifestPath" -ForegroundColor Red
    exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

# Update URLs in manifest
Write-Host "📝 Updating developer URLs..." -ForegroundColor Yellow
$manifest.developer.websiteUrl = $RenderUrl
$manifest.developer.privacyUrl = "$RenderUrl/privacy"
$manifest.developer.termsOfUseUrl = "$RenderUrl/terms"

Write-Host "📝 Updating compose extension URL..." -ForegroundColor Yellow
$manifest.composeExtensions[0].commands[0].taskInfo.url = "$RenderUrl/voice-recorder"

Write-Host "📝 Updating valid domains..." -ForegroundColor Yellow
$renderDomain = ([System.Uri]$RenderUrl).Host
$manifest.validDomains = @($renderDomain)
$manifest.composeExtensions[0].messageHandlers[0].value.domains = @($renderDomain)

# Save updated manifest
$updatedJson = $manifest | ConvertTo-Json -Depth 10
$updatedJson | Set-Content $manifestPath -Encoding UTF8

Write-Host "✅ Manifest updated successfully!" -ForegroundColor Green
Write-Host "📦 Creating new Teams app package..." -ForegroundColor Cyan

# Create new package
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$packageName = "TeamsVoiceExtension-Render-$timestamp.zip"

# Use existing package creation script
& .\create-teams-package.ps1 -AppId $manifest.id -BaseUrl $RenderUrl

Write-Host "🎉 Ready for deployment!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Install the new package in Teams" -ForegroundColor White
Write-Host "   2. Test voice recording functionality" -ForegroundColor White
Write-Host "   3. Share with your teammates!" -ForegroundColor White