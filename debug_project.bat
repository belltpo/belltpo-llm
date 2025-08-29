@echo off
echo ======================================
echo PROJECT DEBUGGING AND RESTART SCRIPT
echo ======================================

echo.
echo Step 1: Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1
echo Node processes stopped.

echo.
echo Step 2: Clearing Node.js cache...
npm cache clean --force
echo Cache cleared.

echo.
echo Step 3: Recreating Django test data...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\prechat_widget"
python simple_test.py
echo Test data created.

echo.
echo Step 4: Verifying Django database...
python -c "import os, sys, django; sys.path.append('.'); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prechat_widget.settings'); django.setup(); from prechat.models import PrechatSubmission; users = PrechatSubmission.objects.all(); print(f'Total users: {users.count()}'); [print(f'- {u.name}: {u.email}, Mobile: {u.mobile}') for u in users]"

echo.
echo Step 5: Starting AnythingLLM server...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
echo Starting server on port 3001...
start "AnythingLLM Server" cmd /k "npx cross-env NODE_ENV=development nodemon --ignore documents --ignore vector-cache --ignore storage --ignore swagger --trace-warnings index.js"

echo.
echo Step 6: Waiting for server to start...
timeout /t 10 /nobreak >nul

echo.
echo Step 7: Testing dashboard API...
node test_dashboard_api.js

echo.
echo ======================================
echo DEBUGGING COMPLETE
echo ======================================
echo.
echo Dashboard URL: http://localhost:3001/dashboard/chat-sessions
echo.
echo If mobile numbers are still not visible:
echo 1. Check browser developer tools for console errors
echo 2. Clear browser cache (Ctrl+Shift+Delete)
echo 3. Hard refresh the page (Ctrl+F5)
echo.
pause
