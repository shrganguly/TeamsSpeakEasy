# Create a simple colored icon (placeholder)
# In production, you would use proper 96x96 and 32x32 PNG files

# For now, we'll use PowerShell to create placeholder files
$colorIcon = @"
<svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#6264A7" rx="16"/>
  <text x="48" y="65" font-family="Arial" font-size="48" fill="white" text-anchor="middle">�</text>
</svg>
"@

$outlineIcon = @"
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="none" stroke="#6264A7" stroke-width="2" rx="8"/>
  <text x="16" y="24" font-family="Arial" font-size="16" fill="#6264A7" text-anchor="middle"></text>
</svg>
"@

$colorIcon | Out-File -FilePath "appPackage/color.svg" -Encoding UTF8
$outlineIcon | Out-File -FilePath "appPackage/outline.svg" -Encoding UTF8

Write-Host "Icon placeholders created. For production, replace with proper 96x96 PNG (color.png) and 32x32 PNG (outline.png) files."
