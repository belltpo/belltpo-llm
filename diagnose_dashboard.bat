@echo off
echo ==========================================
echo FIXING DASHBOARD COUNTS AND TIMESTAMPS
echo ==========================================

echo Step 1: Testing stats API endpoint...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/chat-dashboard/stats' -Method GET; Write-Output 'Stats API Response:'; $response | ConvertTo-Json } catch { Write-Output 'Stats API Error - Check if server is running' }"

echo.
echo Step 2: Kill existing processes and restart with fixes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting backend server with stats fix...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
start "Backend with Stats Fix" cmd /k "npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo Step 4: Starting frontend with timestamp display...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
start "Frontend with Timestamps" cmd /k "npm run dev"

echo.
echo Step 5: Wait for services to start...
timeout /t 15 /nobreak >nul

echo 2. Open: http://localhost:3001/dashboard/chat-sessions
echo 3. Clear browser cache and hard refresh (Ctrl+F5)
echo 4. Check browser console for errors
echo.
pause
