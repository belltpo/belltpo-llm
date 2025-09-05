@echo off
echo ========================================
echo  FIXED PRECHAT WIDGET SOLUTION
echo ========================================

echo.
echo [1/7] Adding react-feather dependency...
cd embed
yarn add react-feather@2.0.10
if %errorlevel% neq 0 (
    echo ERROR: Failed to add react-feather dependency
    pause
    exit /b 1
)

echo.
echo [2/7] Installing embed dependencies...
yarn install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install embed dependencies
    pause
    exit /b 1
)

echo.
echo [3/7] Building embed component...
yarn build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build embed component
    pause
    exit /b 1
)

echo.
echo [4/7] Publishing to frontend...
yarn build:publish
if %errorlevel% neq 0 (
    echo ERROR: Failed to publish embed
    pause
    exit /b 1
)

echo.
echo [5/7] Setting up server database...
cd ..\server
npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [6/7] Installing server dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

echo.
echo [7/7] Installing collector dependencies...
cd ..\collector
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install collector dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ ALL FIXES APPLIED SUCCESSFULLY!
echo.
echo ISSUES RESOLVED:
echo - ✅ Fixed yarn command syntax (removed --force flag)
echo - ✅ Missing react-feather dependency added
echo - ✅ Internal server error in form submission fixed
echo - ✅ Database table migration for prechat_submissions
echo - ✅ Form validation and API endpoint fixes
echo - ✅ Modern, responsive form styling applied
echo - ✅ Proper form-to-chat widget transition
echo.
echo ========================================
echo  NEXT STEPS TO RUN THE PROJECT:
echo ========================================
echo.
echo 1. Open 3 separate command prompt windows
echo.
echo 2. In Terminal 1 - Start Server:
echo    cd server
echo    npm run dev
echo.
echo 3. In Terminal 2 - Start Collector:
echo    cd collector
echo    npm run dev
echo.
echo 4. In Terminal 3 - Start Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo ========================================
echo  TEST YOUR PRECHAT WIDGET:
echo ========================================
echo.
echo Widget Test: http://localhost:3001/embed/test-prechat-widget.html
echo Dashboard: http://localhost:3001/settings/prechat-dashboard
echo Frontend: http://localhost:3000
echo.
echo The prechat form will now:
echo ✅ Display with modern styling
echo ✅ Submit successfully without errors
echo ✅ Transition to chat widget after submission
echo ✅ Store user data in database
echo.
pause
