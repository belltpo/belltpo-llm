@echo off
echo ==========================================
echo DASHBOARD DIAGNOSIS AND FIX
echo ==========================================

echo.
echo Step 1: Recreating Django test data...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\prechat_widget"
python simple_test.py
echo ✓ Test data created

echo.
echo Step 2: Verifying Django database...
python -c "import os, sys, django; sys.path.append('.'); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prechat_widget.settings'); django.setup(); from prechat.models import PrechatSubmission, ChatConversation; users = PrechatSubmission.objects.all(); chats = ChatConversation.objects.all(); print(f'Users: {users.count()}, Chats: {chats.count()}'); [print(f'- {u.name}: {u.email}, Mobile: {u.mobile}, Token: {u.session_token}') for u in users[:3]]"

echo.
echo Step 3: Killing existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1

echo.
echo Step 4: Starting server...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
start "AnythingLLM Server" cmd /k "npx cross-env NODE_ENV=development nodemon --ignore documents --ignore vector-cache --ignore storage --ignore swagger --trace-warnings index.js"

echo.
echo Step 5: Waiting for server startup...
timeout /t 10 /nobreak >nul

echo.
echo Step 6: Testing API directly...
powershell -Command "$response = Invoke-RestMethod -Uri 'http://localhost:3001/chat-dashboard/sessions' -Method GET; Write-Output 'API Response:'; $response | ConvertTo-Json -Depth 3"

echo.
echo ==========================================
echo NEXT STEPS:
echo ==========================================
echo 1. Check API response above
echo 2. Open: http://localhost:3001/dashboard/chat-sessions
echo 3. Clear browser cache and hard refresh (Ctrl+F5)
echo 4. Check browser console for errors
echo.
pause
