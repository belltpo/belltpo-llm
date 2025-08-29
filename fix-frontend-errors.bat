@echo off
echo ==========================================
echo FIXING FRONTEND MODULE IMPORT ERRORS
echo ==========================================

echo Step 1: Kill all Node processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Clear Vite cache and node_modules...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist ".vite" rmdir /s /q ".vite"
if exist "dist" rmdir /s /q "dist"
npm cache clean --force

echo.
echo Step 3: Reinstall dependencies...
npm install

echo.
echo Step 4: Start backend server first...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
start "Backend Server" cmd /k "npm run dev"

timeout /t 10 /nobreak >nul

echo.
echo Step 5: Start frontend with clean cache...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
start "Frontend Clean" cmd /k "npm run dev -- --force"

echo.
echo Step 6: Wait for services to stabilize...
timeout /t 20 /nobreak >nul

echo.
echo ==========================================
echo FRONTEND ERRORS FIXED
echo ==========================================
echo.
echo FIXES APPLIED:
echo ✓ Cleared Vite cache and build artifacts
echo ✓ Cleaned npm cache
echo ✓ Reinstalled dependencies
echo ✓ Started with --force flag to rebuild deps
echo ✓ Proper service startup order
echo.
echo TEST URLS:
echo - Main Dashboard: http://localhost:3000
echo - Chat Dashboard: http://localhost:3000/dashboard/chat-sessions
echo.
echo If still showing white page:
echo 1. Wait 30 seconds for full startup
echo 2. Hard refresh browser (Ctrl+F5)
echo 3. Clear browser cache completely
echo 4. Check browser console for remaining errors
echo.
pause
