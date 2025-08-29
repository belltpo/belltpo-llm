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

echo.
echo Step 3: Verify database contents...
python -c "import os, sys, django; sys.path.append('.'); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prechat_widget.settings'); django.setup(); from prechat.models import PrechatSubmission; users = PrechatSubmission.objects.all(); print(f'Database has {users.count()} users:'); [print(f'  - {u.name}: {u.email}, Mobile: {u.mobile}') for u in users]"

echo.
echo Step 4: Starting server with fixed endpoint registration...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
echo Starting AnythingLLM server on port 3001...
start "AnythingLLM Server" cmd /k "npx cross-env NODE_ENV=development nodemon --ignore documents --ignore vector-cache --ignore storage --ignore swagger --trace-warnings index.js"

echo.
echo Step 5: Waiting for server startup...
timeout /t 15 /nobreak >nul

echo.
echo Step 6: Testing dashboard API...
node test_dashboard_api.js

echo.
echo ==========================================
echo FIX APPLIED - NEXT STEPS:
echo ==========================================
echo.
echo 1. Dashboard URL: http://localhost:3001/dashboard/chat-sessions
echo 2. Clear browser cache: Ctrl+Shift+Delete (select "All time")
echo 3. Hard refresh page: Ctrl+F5
echo 4. Check browser console for any remaining errors
echo.
echo Expected Result:
echo - Left panel shows 3 users with names, emails, and mobile numbers
echo - Mobile numbers should be visible with phone icon
echo - Click any user to see chat bubbles in right panel
echo.
echo If mobile numbers still not visible:
echo - Check Network tab in browser dev tools
echo - Verify API response includes userMobile field
echo - Ensure CSS is not hiding mobile elements
echo.
pause
