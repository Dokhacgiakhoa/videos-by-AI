@echo off
title AI Video Maker
echo ========================================
echo   AI Video Maker - Khoi dong...
echo ========================================

:: Cap GPU 200W (chong sap may)
echo [1/3] Cap GPU 200W...
nvidia-smi -pl 200 2>nul
if errorlevel 1 (
    echo   ^ Khong cap duoc GPU - can chay voi quyen Admin hoac GPU khong ho tro.
    echo   ^ Video van chay duoc, nhung tranh dung Flux local.
)

:: Khoi dong Next.js server
echo [2/3] Khoi dong server...
cd /d "%~dp0"
if not exist node_modules (
    echo   Cai dat dependencies lan dau...
    call npm install
)

:: Mo trinh duyet sau 3 giay
echo [3/3] Mo trinh duyet...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Chay server (blocking)
call npm run dev
