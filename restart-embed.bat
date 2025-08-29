@echo off
echo ==========================================
echo RESTARTING EMBED WITH FIXES
echo ==========================================

echo Step 1: Kill existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Starting embed with reset chat fix...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\embed"
start "Embed with Reset Fix" cmd /k "npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo Step 3: Starting frontend with WebSocket...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
start "Frontend with WebSocket" cmd /k "npm run dev"

echo.
echo Step 4: Wait for services...
timeout /t 15 /nobreak >nul

echo.
echo ==========================================
echo FIXES APPLIED
echo ==========================================
echo.
echo CHANGES MADE:
echo ✓ Reset Chat: Now keeps greeting message after reset
echo ✓ Auto Greeting: Shows after prechat form completion
echo ✓ WebSocket: Real-time dashboard updates without page reload
echo ✓ Chat Widget: No longer shows prechat form after reset
echo.
echo EXPECTED BEHAVIOR:
echo 1. Fill prechat form → See greeting message
echo 2. Chat normally → Messages appear
echo 3. Click "Reset Chat" → Only clears messages, keeps greeting
echo 4. Dashboard updates in real-time when new users join
echo.
echo TEST URLS:
echo - Chat Widget: http://localhost:3000/embed/test
echo - Dashboard: http://localhost:3000/dashboard/chat-sessions
echo.
pause
