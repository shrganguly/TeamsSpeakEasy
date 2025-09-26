# Production Deployment Script
# Usage: .\deploy-production.ps1 -RenderUrl "https://your-service.onrender.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$RenderUrl,
    [string]$PackageName = "TeamsVoiceExtension-Production.zip"
)

Write-Host "🚀 Creating Production Teams Package" -ForegroundColor Cyan

# Validate Render URL
if (-not ($RenderUrl -match "^https://.*\.onrender\.com$")) {
    Write-Host "❌ Invalid Render URL. Expected: https://service-name.onrender.com" -ForegroundColor Red
    exit 1
}

$RenderUrl = $RenderUrl.TrimEnd('/')
$RenderDomain = ([System.Uri]$RenderUrl).Host

Write-Host "🌐 Production URL: $RenderUrl" -ForegroundColor Green

# Update manifest
$manifestPath = "appPackage\manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

$manifest.developer.websiteUrl = $RenderUrl
$manifest.developer.privacyUrl = "$RenderUrl/privacy"  
$manifest.developer.termsOfUseUrl = "$RenderUrl/terms"
$manifest.composeExtensions[0].commands[0].taskInfo.url = "$RenderUrl/voice-recorder"
$manifest.validDomains = @($RenderDomain)
$manifest.composeExtensions[0].messageHandlers[0].value.domains = @($RenderDomain)
$manifest.version = "1.0.1"

# Save manifest
$updatedJson = $manifest | ConvertTo-Json -Depth 10
$updatedJson | Set-Content $manifestPath -Encoding UTF8

# Create package
if (Test-Path $PackageName) { Remove-Item $PackageName -Force }
Compress-Archive -Path "appPackage\*" -DestinationPath $PackageName -CompressionLevel Optimal

Write-Host "✅ Production package ready: $PackageName" -ForegroundColor Green
Write-Host "📤 Share this file with your teammates!" -ForegroundColor Yellow