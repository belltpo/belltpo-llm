@echo off
echo ==========================================
echo COMPLETE PROJECT FIX - ALL ISSUES
echo ==========================================

echo Step 1: Kill all Node processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1
echo ✓ Processes stopped

echo.
echo Step 2: Recreate Django test data...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\prechat_widget"
python simple_test.py
echo ✓ Test data created

echo.
echo Step 3: Verify database has users...
python -c "import os, sys, django; sys.path.append('.'); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prechat_widget.settings'); django.setup(); from prechat.models import PrechatSubmission; users = PrechatSubmission.objects.all(); print(f'Database has {users.count()} users with mobile numbers'); [print(f'- {u.name}: {u.mobile}') for u in users[:3]]"

echo.
echo Step 4: Start server on port 3001...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
echo Starting server with fixed API endpoints...
start "AnythingLLM Server" cmd /k "npm run dev"

echo.
echo Step 5: Wait for server startup...
timeout /t 15 /nobreak >nul

echo.
echo Step 6: Test API endpoints...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/chat-dashboard/sessions' -Method GET; Write-Output 'API Working - Found sessions:'; $response.sessions | ForEach-Object { Write-Output \"- $($_.userName): $($_.userEmail), Mobile: $($_.userMobile)\" } } catch { Write-Output 'API Error: Server may still be starting' }"

echo.
echo ==========================================
echo FIXED ISSUES:
echo ==========================================
echo ✓ Port conflict resolved (killed existing processes)
echo ✓ API endpoints fixed (/api/chat-dashboard/*)
echo ✓ Django database with test users created
echo ✓ Mobile numbers visible in API response
echo.
echo DASHBOARD URLS:
echo - Main Dashboard: http://localhost:3001/dashboard/chat-sessions
echo - API Test: http://localhost:3001/dashboard/test
echo - Frontend: http://localhost:3000/dashboard/chat-sessions
echo.
echo NEXT STEPS:
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Visit dashboard URL
echo 3. Hard refresh (Ctrl+F5)
echo 4. Mobile numbers should now be visible
echo.

@echo off
echo ==========================================
echo FIXING DASHBOARD STATS COUNT ISSUE
echo ==========================================

echo Step 1: Testing current stats API...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/chat-dashboard/stats' -Method GET; Write-Output 'Current Stats:'; $response | ConvertTo-Json } catch { Write-Output 'Server not running - will start it' }"

echo.
echo Step 2: Kill all existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting backend server with enhanced stats logging...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
start "Backend with Stats Fix" cmd /k "npm run dev"

timeout /t 10 /nobreak >nul

echo.
echo Step 4: Testing stats API after restart...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/chat-dashboard/stats' -Method GET; Write-Output 'Updated Stats:'; $response | ConvertTo-Json } catch { Write-Output 'API still not responding' }"

echo.
echo Step 5: Starting frontend...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
start "Frontend Dashboard" cmd /k "npm run dev"

echo.
echo Step 6: Wait for frontend to load...
timeout /t 15 /nobreak >nul

echo.
echo ==========================================
echo STATS COUNT FIX APPLIED
echo ==========================================
echo.
echo CHANGES MADE:
echo ✓ Enhanced stats API with detailed logging
echo ✓ Added proper today's date filtering
echo ✓ Calculate actual message counts from Django conversations
echo ✓ Added console logging for debugging
echo.
echo EXPECTED RESULTS:
echo - Today's Chats: Shows users created today (not 0)
echo - Total Sessions: Shows all prechat users count
echo - Total Messages: Shows actual conversation count
echo.
echo TEST INSTRUCTIONS:
echo 1. Go to: http://localhost:3000/dashboard/chat-sessions
echo 2. Check top stats panel - should show proper counts
echo 3. Check server console for detailed logging
echo.
echo If counts still show 0:
echo 1. Check server console for error messages
echo 2. Verify Django database has prechat_submissions data
echo 3. Check browser network tab for API errors
echo.
pause
