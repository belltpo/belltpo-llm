@echo off
echo ========================================
echo Complete Prechat Widget Fix and Run
echo ========================================

echo Step 1: Clean and fix embed dependencies
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\embed"

echo Removing node_modules and package-lock.json...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"

echo Installing dependencies with --force flag...
call npm install --force
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed, trying with legacy-peer-deps
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: All npm install attempts failed
        pause
        exit /b 1
    )
)

echo Step 2: Build embed widget
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Vite build failed
    pause
    exit /b 1
)

echo Step 3: Create minified files
if exist "dist\anythingllm-embedded-chat.css" (
    echo Creating minified CSS...
    call npx cleancss -o "dist\anythingllm-chat-widget.min.css" "dist\anythingllm-embedded-chat.css"
)

if exist "dist\anythingllm-chat-widget.js" (
    echo Creating minified JS...
    call npx terser --compress -o "dist\anythingllm-chat-widget.min.js" -- "dist\anythingllm-chat-widget.js"
)

echo Step 4: Deploy to server
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm"

echo Creating server embed directory...
if not exist "server\public\embed" mkdir "server\public\embed"

echo Copying widget files...
copy "embed\dist\anythingllm-chat-widget.min.js" "server\public\embed\" >nul 2>&1
copy "embed\dist\anythingllm-chat-widget.min.css" "server\public\embed\" >nul 2>&1
copy "embed\dist\anythingllm-chat-widget.js" "server\public\embed\" >nul 2>&1
copy "embed\dist\anythingllm-embedded-chat.css" "server\public\embed\" >nul 2>&1

echo Verifying files copied...
dir "server\public\embed"

echo Step 5: Database migration
cd server
echo Running database migration...
call node -e "const { PrechatSubmissions } = require('./models/prechatSubmissions'); PrechatSubmissions.migrateTable().then(() => console.log('✅ Migration completed')).catch(console.error);"

echo Step 6: Install server dependencies
call npm install --legacy-peer-deps

cd ..

echo ========================================
echo ✅ Build completed successfully!
echo ========================================
echo.
echo 🚀 Now run these commands to start the project:
echo.
echo 1. Start the server:
echo    yarn dev:server
echo.
echo 2. Test the widget:
echo    http://localhost:3001/embed/test-prechat-widget.html
echo.
echo 3. Check dashboard:
echo    http://localhost:3001/settings/prechat-dashboard
echo.
pause
