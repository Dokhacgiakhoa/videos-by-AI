# Tao shortcut "AI Video Maker" tren Desktop
# Chay 1 lan: powershell -ExecutionPolicy Bypass -File create-shortcut.ps1

$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$Desktop\AI Video Maker.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\start.bat"
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Khoi dong AI Video Maker (local)"
$Shortcut.WindowStyle = 1
$IconPath = "$PSScriptRoot\public\ai91-logo.ico"
if (Test-Path $IconPath) { $Shortcut.IconLocation = $IconPath }
$Shortcut.Save()

Write-Host "Da tao shortcut 'AI Video Maker' tren Desktop!" -ForegroundColor Green
Write-Host "Double-click de khoi dong." -ForegroundColor Cyan
