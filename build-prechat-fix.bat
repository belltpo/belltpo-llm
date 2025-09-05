@echo off
echo ========================================
echo Building Prechat Widget - Manual Fix
echo ========================================

echo Step 1: Navigate to embed directory
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\embed"

echo Step 2: Install dependencies
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo Step 3: Build with Vite
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Vite build failed
    pause
    exit /b 1
)

echo Step 4: Check build output
dir dist
if not exist "dist\anythingllm-chat-widget.js" (
    echo ERROR: Build output not found
    pause
    exit /b 1
)

echo Step 5: Create minified versions
if exist "dist\anythingllm-embedded-chat.css" (
    call npx cleancss -o "dist\anythingllm-chat-widget.min.css" "dist\anythingllm-embedded-chat.css"
)

if exist "dist\anythingllm-chat-widget.js" (
    call npx terser --compress -o "dist\anythingllm-chat-widget.min.js" -- "dist\anythingllm-chat-widget.js"
)

echo Step 6: Create server embed directory
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm"
if not exist "server\public\embed" mkdir "server\public\embed"

echo Step 7: Copy files to server
copy "embed\dist\anythingllm-chat-widget.min.js" "server\public\embed\" >nul 2>&1
copy "embed\dist\anythingllm-chat-widget.min.css" "server\public\embed\" >nul 2>&1
copy "embed\dist\anythingllm-chat-widget.js" "server\public\embed\" >nul 2>&1
copy "embed\dist\anythingllm-embedded-chat.css" "server\public\embed\" >nul 2>&1

echo Step 8: Verify files copied
dir "server\public\embed"

echo Step 9: Run database migration
cd server
call node -e "const { PrechatSubmissions } = require('./models/prechatSubmissions'); PrechatSubmissions.migrateTable().then(() => console.log('Migration completed')).catch(console.error);"

echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Start server: yarn dev:server
echo 2. Test widget: http://localhost:3001/embed/test-prechat-widget.html
echo 3. Check files at: http://localhost:3001/embed/anythingllm-chat-widget.min.js
echo.
pause
