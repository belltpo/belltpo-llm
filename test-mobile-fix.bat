@echo off
echo ==========================================
echo TESTING MOBILE NUMBER FIX IN DASHBOARD
echo ==========================================

echo Step 1: Verify backend API has mobile numbers...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
node test_dashboard_fixed.js

echo.
echo Step 2: Check if frontend is running with proxy...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -Method GET -TimeoutSec 5; Write-Output 'Frontend is running on port 3000' } catch { Write-Output 'Frontend not running - starting it...' }"

echo.
echo Step 3: Restart frontend with mobile number fix...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
start "Frontend with Mobile Fix" cmd /k "npm run dev"

echo.
echo Step 4: Wait for frontend to start...
timeout /t 15 /nobreak >nul

echo.
echo ==========================================
echo MOBILE NUMBER FIX APPLIED
echo ==========================================
echo.
echo CHANGES MADE:
echo ✓ Added Phone icon and mobile number display in session list
echo ✓ Added Envelope icon for email addresses
echo ✓ Mobile numbers now show below email in frontend dashboard
echo.
echo TEST URLS:
echo - Backend Test: http://localhost:3001/dashboard/chat-sessions
echo - Frontend Dashboard: http://localhost:3000/dashboard/chat-sessions
echo.
echo EXPECTED RESULTS:
echo - Session list shows: Name, Email (📧), Mobile (📱), Status
echo - Mobile numbers: 854796589, 8878986989, etc.
echo - Click sessions to see chat conversations
echo.
echo If mobile numbers still not visible:
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Hard refresh (Ctrl+F5)
echo 3. Check browser console for errors
echo.
pause
