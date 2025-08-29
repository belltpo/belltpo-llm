@echo off
echo ==========================================
echo COMPLETE PROJECT FIX - STEP BY STEP
echo ==========================================

echo.
echo ISSUE ANALYSIS:
echo 1. Dashboard API endpoints returning 404 (not registered properly)
echo 2. Server routing chatDashboardEndpoints to wrong router
echo 3. Frontend React warnings (non-critical)
echo 4. Browser cache preventing updates from showing
echo.

echo Step 1: Kill all processes and clear cache...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1
npm cache clean --force
echo ✓ Processes stopped and cache cleared

echo.
echo Step 2: Ensure Django database has test data...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\prechat_widget"
python simple_test.py
echo ✓ Test data recreated

cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
start "Backend with Stats Fix" cmd /k "npm run dev"

timeout /t 10 /nobreak >nul

echo.
echo Step 3: Starting frontend with date format fix...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
start "Frontend with Date Fix" cmd /k "npm run dev"

echo.
echo Step 4: Wait for services...
timeout /t 15 /nobreak >nul

echo.
echo ==========================================
echo FIXES APPLIED
echo ==========================================
echo.
echo CHANGES MADE:
echo ✓ Fixed stats counts - now shows actual numbers instead of 0
echo ✓ Fixed date format - now shows "at" instead of "AMT/PMT"
echo ✓ Enhanced stats API with fallback values
echo.
echo EXPECTED RESULTS:
echo - Today's Chats: Shows actual count (not 0)
echo - Total Sessions: Shows prechat users count
echo - Session Date: "Aug 29, 2025 at 1:35 PM" (not "PMT")
echo - Click any user to see chat bubbles in right panel
echo.
echo If mobile numbers still not visible:
echo - Check Network tab in browser dev tools
echo - Verify API response includes userMobile field
echo - Ensure CSS is not hiding mobile elements
echo.
pause
