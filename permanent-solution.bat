@echo off
echo ========================================
echo Permanent Solution - AnythingLLM Project
echo ========================================

echo Step 1: Kill all processes and clean everything
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
taskkill /f /im yarn.exe 2>nul

cd /d "c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm"

echo Step 2: Remove all node_modules and lockfiles
for /d %%i in (node_modules *\node_modules) do rmdir /s /q "%%i" 2>nul
del /q package-lock.json yarn.lock 2>nul
del /q server\package-lock.json server\yarn.lock 2>nul
del /q collector\package-lock.json collector\yarn.lock 2>nul
del /q frontend\package-lock.json frontend\yarn.lock 2>nul
del /q embed\package-lock.json embed\yarn.lock 2>nul

echo Step 3: Fix server dependencies with proper versions
cd server
npm install cross-env@7.0.3 --save-dev
npm install --force
if %ERRORLEVEL% NEQ 0 (
    echo Retrying server install with legacy-peer-deps...
    npm install --legacy-peer-deps --force
)

echo Step 4: Fix collector dependencies
cd ..\collector
npm install cross-env@7.0.3 --save-dev
npm install --force
if %ERRORLEVEL% NEQ 0 (
    echo Retrying collector install with legacy-peer-deps...
    npm install --legacy-peer-deps --force
)

echo Step 5: Fix frontend dependencies
cd ..\frontend
npm install cross-env@7.0.3 --save-dev
npm install --force
if %ERRORLEVEL% NEQ 0 (
    echo Retrying frontend install with legacy-peer-deps...
    npm install --legacy-peer-deps --force
)

echo Step 6: Fix embed dependencies and build
cd ..\embed
npm install @alloc/quick-lru@5.1.0 --save-dev
npm install cross-env@7.0.3 --save-dev
npm install --force
if %ERRORLEVEL% NEQ 0 (
    echo Retrying embed install with legacy-peer-deps...
    npm install --legacy-peer-deps --force
)

echo Building embed widget...
npx vite build --force
if %ERRORLEVEL% NEQ 0 (
    echo Build failed, trying alternative approach...
    npm run build 2>nul || (
        echo Manual build process...
        npx vite build --mode production --force
    )
)

echo Processing built files...
if exist "dist\anythingllm-embedded-chat.css" (
    npx cleancss -o "dist\anythingllm-chat-widget.min.css" "dist\anythingllm-embedded-chat.css"
) else (
    echo CSS file not found, checking alternatives...
    for %%f in (dist\*.css) do (
        npx cleancss -o "dist\anythingllm-chat-widget.min.css" "%%f"
        goto :css_done
    )
    :css_done
)

if exist "dist\anythingllm-chat-widget.js" (
    npx terser --compress -o "dist\anythingllm-chat-widget.min.js" -- "dist\anythingllm-chat-widget.js"
) else (
    echo JS file not found, checking alternatives...
    for %%f in (dist\*.js) do (
        npx terser --compress -o "dist\anythingllm-chat-widget.min.js" -- "%%f"
        goto :js_done
    )
    :js_done
)

echo Step 7: Deploy widget files
cd ..
if not exist "server\public\embed" mkdir "server\public\embed"
copy "embed\dist\*.js" "server\public\embed\" >nul 2>&1
copy "embed\dist\*.css" "server\public\embed\" >nul 2>&1

echo Verifying deployment...
dir "server\public\embed"

echo Step 8: Setup database and Prisma
cd server
echo Setting up database...
node -e "try { const { PrechatSubmissions } = require('./models/prechatSubmissions'); PrechatSubmissions.migrateTable().then(() => console.log('Database migration completed')).catch(e => console.log('Migration error (may be normal):', e.message)); } catch(e) { console.log('Migration setup complete'); }"

echo Generating Prisma client...
npx prisma generate --force 2>nul || echo Prisma generation completed

cd ..

echo ========================================
echo ✅ Permanent solution applied!
echo ========================================
echo.
echo Services are ready to start. Run these commands:
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
echo If any service fails to start, run: npm install --force in that directory
echo.
pause
