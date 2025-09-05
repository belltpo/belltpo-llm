@echo off
echo ========================================
echo  COMPLETE PRECHAT WIDGET FIX SOLUTION
echo ========================================

echo.
echo [1/6] Installing react-feather dependency...
cd embed
yarn add react-feather@^2.0.10 --force
if %errorlevel% neq 0 (
    echo ERROR: Failed to install react-feather
    pause
    exit /b 1
)

echo.
echo [2/6] Installing all embed dependencies...
yarn install --force
if %errorlevel% neq 0 (
    echo ERROR: Failed to install embed dependencies
    pause
    exit /b 1
)

echo.
echo [3/6] Building embed component...
yarn build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build embed component
    pause
    exit /b 1
)

echo.
echo [4/6] Publishing embed to frontend...
yarn build:publish
if %errorlevel% neq 0 (
    echo ERROR: Failed to publish embed
    pause
    exit /b 1
)

echo.
echo [5/6] Setting up server database...
cd ..\server
npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [6/6] Starting services...
echo.
echo ✅ All fixes applied successfully!
echo.
echo NEXT STEPS:
echo 1. Start server: cd server && npm run dev
echo 2. Start collector: cd collector && npm run dev  
echo 3. Start frontend: cd frontend && npm run dev
echo.
echo TEST URLS:
echo - Widget: http://localhost:3001/embed/test-prechat-widget.html
echo - Dashboard: http://localhost:3001/settings/prechat-dashboard
echo - Frontend: http://localhost:3000
echo.
echo The prechat form should now display properly in the widget!
echo.
pause
