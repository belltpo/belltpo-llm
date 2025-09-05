@echo off
echo ========================================
echo Final Project Fix - All Issues
echo ========================================

echo Step 1: Kill all running processes
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
taskkill /f /im yarn.exe 2>nul

echo Step 2: Clean root workspace
cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm"
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"
if exist "yarn.lock" del "yarn.lock"

echo Step 3: Fix server dependencies
cd server
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"
npm install cross-env --save-dev
npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Server npm install failed
    pause
    exit /b 1
)

echo Step 4: Fix collector dependencies
cd ..\collector
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"
npm install cross-env --save-dev
npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Collector npm install failed
    pause
    exit /b 1
)

echo Step 5: Fix frontend dependencies
cd ..\frontend
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"
npm install cross-env --save-dev
npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend npm install failed
    pause
    exit /b 1
)

echo Step 6: Fix embed dependencies and build
cd ..\embed
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"
npm install @alloc/quick-lru --save-dev
npm install cross-env --save-dev
npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Embed npm install failed
    pause
    exit /b 1
)

echo Building embed widget...
npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Embed build failed
    pause
    exit /b 1
)

echo Creating minified files...
if exist "dist\anythingllm-embedded-chat.css" (
    npx cleancss -o "dist\anythingllm-chat-widget.min.css" "dist\anythingllm-embedded-chat.css"
)
if exist "dist\anythingllm-chat-widget.js" (
    npx terser --compress -o "dist\anythingllm-chat-widget.min.js" -- "dist\anythingllm-chat-widget.js"
)

echo Step 7: Deploy embed widget
cd ..
if not exist "server\public\embed" mkdir "server\public\embed"
copy "embed\dist\*.js" "server\public\embed\" >nul 2>&1
copy "embed\dist\*.css" "server\public\embed\" >nul 2>&1

echo Step 8: Setup database
cd server
node -e "const { PrechatSubmissions } = require('./models/prechatSubmissions'); PrechatSubmissions.migrateTable().then(() => console.log('Database ready')).catch(console.error);"
npx prisma generate

cd ..

echo ========================================
echo ✅ All fixes completed successfully!
echo ========================================
echo.
echo Now run these commands in separate terminals:
echo.
echo Terminal 1 - Server:
echo cd server ^&^& npm run dev
echo.
echo Terminal 2 - Collector:
echo cd collector ^&^& npm run dev
echo.
echo Terminal 3 - Frontend:
echo cd frontend ^&^& npm run dev
echo.
echo Test URLs:
echo - Widget: http://localhost:3001/embed/test-prechat-widget.html
echo - Dashboard: http://localhost:3001/settings/prechat-dashboard
echo - Frontend: http://localhost:3000
echo.
pause
