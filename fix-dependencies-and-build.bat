@echo off
echo ========================================
echo Fixing Dependencies and Building Widget
echo ========================================

echo Step 1: Fix embed package dependencies
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\embed"

echo Cleaning previous installations...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"

echo Installing with --legacy-peer-deps to resolve conflicts...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Trying with --force flag...
    call npm install --force
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)

echo Step 2: Build the widget
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo Step 3: Process built files
if exist "dist\anythingllm-embedded-chat.css" (
    call npx cleancss -o "dist\anythingllm-chat-widget.min.css" "dist\anythingllm-embedded-chat.css"
)

if exist "dist\anythingllm-chat-widget.js" (
    call npx terser --compress -o "dist\anythingllm-chat-widget.min.js" -- "dist\anythingllm-chat-widget.js"
)

echo Step 4: Deploy files
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm"
if not exist "server\public\embed" mkdir "server\public\embed"

copy "embed\dist\*.js" "server\public\embed\" >nul 2>&1
copy "embed\dist\*.css" "server\public\embed\" >nul 2>&1

echo Step 5: Database setup
cd server
call node -e "const { PrechatSubmissions } = require('./models/prechatSubmissions'); PrechatSubmissions.migrateTable().then(() => console.log('Database ready')).catch(console.error);"

cd ..

echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Run this to start the project:
echo yarn dev:server
echo.
echo Then test at:
echo http://localhost:3001/embed/test-prechat-widget.html
echo.
pause
