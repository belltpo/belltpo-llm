@echo off
echo ==========================================
echo RESTARTING FRONTEND WITH PROXY FIX
echo ==========================================

echo Step 1: Kill frontend processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Step 2: Starting frontend with API proxy...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
echo Frontend will proxy /api requests to http://localhost:3001
echo Dashboard will be available at: http://localhost:3000/dashboard/chat-sessions
echo.
start "AnythingLLM Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo PROXY CONFIGURATION APPLIED
echo ==========================================
echo Frontend: http://localhost:3000 (with proxy to backend)
echo Backend: http://localhost:3001 (API server)
echo.
echo The frontend will now properly connect to the backend API
echo Mobile numbers should be visible in the dashboard
echo.
pause
