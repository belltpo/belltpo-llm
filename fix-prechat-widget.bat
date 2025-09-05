@echo off
echo ========================================
echo Fixing Prechat Widget Integration
echo ========================================

echo.
echo [1/5] Building embed widget...
cd embed
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build embed widget
    pause
    exit /b 1
)

echo.
echo [2/5] Copying built files to server public directory...
if not exist "..\server\public\embed" mkdir "..\server\public\embed"
copy "dist\anythingllm-chat-widget.min.js" "..\server\public\embed\" >nul
copy "dist\anythingllm-chat-widget.min.css" "..\server\public\embed\" >nul
echo Embed files copied successfully

echo.
echo [3/5] Copying built files to frontend public directory...
if not exist "..\frontend\public\embed" mkdir "..\frontend\public\embed"
copy "dist\anythingllm-chat-widget.min.js" "..\frontend\public\embed\" >nul
copy "dist\anythingllm-chat-widget.min.css" "..\frontend\public\embed\" >nul
echo Frontend files copied successfully

cd ..

echo.
echo [4/5] Running database migration for prechat submissions...
cd server
call node -e "const { PrechatSubmissions } = require('./models/prechatSubmissions'); PrechatSubmissions.migrateTable().then(() => console.log('Migration completed')).catch(console.error);"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Database migration may have failed, but continuing...
)

cd ..

echo.
echo [5/5] Testing API endpoints...
echo Testing prechat API connectivity...

echo.
echo ========================================
echo Fix completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Restart the server: yarn dev:server
echo 2. Test the widget at: http://localhost:3001/embed/test-prechat-widget.html
echo 3. Check dashboard at: http://localhost:3001/settings/prechat-dashboard
echo.
pause
