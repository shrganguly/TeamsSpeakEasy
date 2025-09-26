# Teams Voice Extension Deployment Script

Write-Host " Teams Voice Extension Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if ngrok is available
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host " ngrok not found. Please install ngrok first:" -ForegroundColor Red
    Write-Host "   1. Download from https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "   2. Extract to a folder in your PATH" -ForegroundColor Yellow
    Write-Host "   3. Run: ngrok config add-authtoken <your-token>" -ForegroundColor Yellow
    exit 1
}

# Start the server
Write-Host " Starting web server..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "src/server.js" -WindowStyle Hidden -PassThru | Out-Null
Start-Sleep -Seconds 3

# Start ngrok
Write-Host " Starting ngrok tunnel..." -ForegroundColor Green
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", "3000" -WindowStyle Normal -PassThru

Write-Host " Waiting for ngrok to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Get ngrok URL
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
    $publicUrl = $ngrokApi.tunnels[0].public_url
    $domain = $publicUrl -replace "https://", ""
    
    Write-Host " ngrok tunnel active: $publicUrl" -ForegroundColor Green
    
    # Update environment variables
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "TEAMS_APP_BASE_URL=.*", "TEAMS_APP_BASE_URL=$publicUrl"
    $envContent = $envContent -replace "TEAMS_APP_DOMAIN=.*", "TEAMS_APP_DOMAIN=$domain"
    $envContent | Set-Content ".env"
    
    Write-Host " Updated .env file with ngrok URL" -ForegroundColor Green
    
} catch {
    Write-Host " Could not get ngrok URL automatically" -ForegroundColor Yellow
    Write-Host "   Please check ngrok dashboard at http://127.0.0.1:4040" -ForegroundColor Yellow
}

Write-Host ""
Write-Host " Next Steps:" -ForegroundColor Cyan
Write-Host "1. Get your ngrok URL from http://127.0.0.1:4040" -ForegroundColor White
Write-Host "2. Run: .\create-teams-package.ps1" -ForegroundColor White
Write-Host "3. Upload the generated ZIP file to Teams" -ForegroundColor White
Write-Host ""
Write-Host " Test the voice recorder: $publicUrl/voice-recorder" -ForegroundColor Green
