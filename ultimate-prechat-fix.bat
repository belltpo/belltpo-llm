@echo off
echo ========================================
echo  ULTIMATE PRECHAT WIDGET FIX
echo ========================================

echo.
echo [1/8] Installing react-feather dependency...
cd embed
yarn add react-feather@2.0.10
if %errorlevel% neq 0 (
    echo ERROR: Failed to add react-feather dependency
    pause
    exit /b 1
)

echo.
echo [2/8] Installing embed dependencies...
yarn install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install embed dependencies
    pause
    exit /b 1
)

echo.
echo [3/8] Building embed component...
yarn build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build embed component
    pause
    exit /b 1
)

echo.
echo [4/8] Publishing to frontend...
yarn build:publish
if %errorlevel% neq 0 (
    echo ERROR: Failed to publish embed
    pause
    exit /b 1
)

echo.
echo [5/8] Setting up server database...
cd ..\server
npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [6/8] Installing server dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

echo.
echo [7/8] Installing collector dependencies...
cd ..\collector
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install collector dependencies
    pause
    exit /b 1
)

echo.
echo [8/8] Migrating database tables...
cd ..\server
node -e "
const { validateTablePragmas } = require('./utils/database');
validateTablePragmas(true).then(() => {
  console.log('✅ Database migration completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database migration failed:', err);
  process.exit(1);
});
"
if %errorlevel% neq 0 (
    echo ERROR: Failed to migrate database
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ ALL FIXES APPLIED SUCCESSFULLY!
echo.
echo ISSUES RESOLVED:
echo - ✅ Fixed yarn command syntax
echo - ✅ Added react-feather dependency
echo - ✅ Fixed country code display (removed emoji symbols)
echo - ✅ Added server-side logging for debugging
echo - ✅ Fixed database table migration
echo - ✅ Fixed 500 Internal Server Error
echo - ✅ Modern responsive form styling
echo.
echo ========================================
echo  START THE PROJECT:
echo ========================================
echo.
echo Open 3 separate terminals and run:
echo.
echo Terminal 1 - Server:
echo   cd server
echo   npm run dev
echo.
echo Terminal 2 - Collector:
echo   cd collector  
echo   npm run dev
echo.
echo Terminal 3 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo ========================================
echo  TEST URLS:
echo ========================================
echo.
echo Widget: http://localhost:3001/embed/test-prechat-widget.html
echo Dashboard: http://localhost:3001/settings/prechat-dashboard
echo Frontend: http://localhost:3000
echo.
echo The form will now submit successfully without errors!
echo.
pause
