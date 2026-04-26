@echo off
title YouTube Remote Setup Wizard - ASUS ROG STRIX 2025
color 0B
cls

echo ============================================================
echo      YOUTUBE REMOTE - WINDOWS SETUP WIZARD
echo ============================================================
echo.

:CHECK_NODE
echo [1/3] Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js is NOT installed.
    echo Please download and install it from: https://nodejs.org/
    pause
    exit /b
)
echo [OK] Node.js found.

:SETUP_BRIDGE
echo.
echo [2/3] Setting up Windows System Bridge...
cd bridge
call npm install socket.io-client
echo [OK] Bridge dependencies installed.

:EXTENSION_INFO
echo.
echo [3/3] Chrome Extension Instructions:
echo 1. Open Chrome and go to: chrome://extensions/
echo 2. Enable "Developer mode" (top right toggle).
echo 3. Click "Load unpacked".
echo 4. Select the 'extension' folder in this directory.
echo.

echo ============================================================
echo SETUP COMPLETE!
echo ============================================================
echo.
set /p choice="Would you like to start the Bridge now? (Y/N): "
if /i "%choice%"=="Y" (
    echo Starting Bridge...
    node index.js
) else (
    echo You can start the bridge later by running 'node bridge/index.js'
    pause
)
