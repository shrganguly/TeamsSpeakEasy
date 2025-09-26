# Download sample icons from a public repository
$colorIconUrl = "https://raw.githubusercontent.com/OfficeDev/Microsoft-Teams-Samples/main/samples/tab-app-pages/nodejs/appPackage/color.png"
$outlineIconUrl = "https://raw.githubusercontent.com/OfficeDev/Microsoft-Teams-Samples/main/samples/tab-app-pages/nodejs/appPackage/outline.png"

try {
    Invoke-WebRequest -Uri $colorIconUrl -OutFile "appPackage/color.png" -ErrorAction Stop
    Invoke-WebRequest -Uri $outlineIconUrl -OutFile "appPackage/outline.png" -ErrorAction Stop
    Write-Host " Icons downloaded successfully"
} catch {
    Write-Host " Could not download icons. Creating placeholder files..."
    # Create minimal placeholder files
    New-Item -Path "appPackage/color.png" -ItemType File -Force | Out-Null
    New-Item -Path "appPackage/outline.png" -ItemType File -Force | Out-Null
    Write-Host " Please replace color.png (96x96) and outline.png (32x32) with proper icon files"
}
