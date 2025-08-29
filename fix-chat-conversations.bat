@echo off
echo ==========================================
echo FIXING CHAT CONVERSATIONS IN FRONTEND
echo ==========================================

echo Step 1: Testing backend session details API...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server"
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/chat-dashboard/sessions/session_token_1' -Method GET; Write-Output 'Backend API Response:'; $response | ConvertTo-Json -Depth 3 } catch { Write-Output 'API Error: Check if server is running' }"

echo.
echo Step 2: Kill frontend processes and restart with fix...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting frontend with chat conversation fix...
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend"
start "Frontend with Chat Fix" cmd /k "npm run dev"

echo.
echo Step 4: Wait for frontend to start...
timeout /t 15 /nobreak >nul

echo.
echo ==========================================
echo CHAT CONVERSATION FIX APPLIED
echo ==========================================
echo.
echo CHANGES MADE:
echo ✓ Fixed fetchSessionDetails function to handle backend API response
echo ✓ Updated data transformation for chat history
echo ✓ Added proper session info mapping (sessionInfo vs session)
echo ✓ Added console logging for debugging
echo.
echo TEST INSTRUCTIONS:
echo 1. Go to: http://localhost:3000/dashboard/chat-sessions
echo 2. Click on any user (chan, test, bell, logi)
echo 3. Check right panel for:
echo    - User details (name, email, mobile, region)
echo    - Chat conversation bubbles
echo    - Message timestamps
echo.
echo EXPECTED RESULTS:
echo - Left panel: User list with mobile numbers
echo - Right panel: User details + chat conversation when clicked
echo - Chat bubbles: User messages (right), AI responses (left)
echo.
echo If still not working:
echo 1. Open browser console (F12)
echo 2. Check for API errors
echo 3. Clear cache and hard refresh (Ctrl+F5)
echo.
pause
