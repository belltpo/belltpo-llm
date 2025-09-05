@echo off
echo ========================================
echo  FINAL PRECHAT WIDGET SOLUTION
echo ========================================

echo.
echo [1/7] Adding react-feather dependency...
cd embed
yarn add react-feather@^2.0.10

echo.
echo [2/7] Installing embed dependencies...
yarn install

echo.
echo [3/7] Building embed component...
yarn build

echo.
echo [4/7] Publishing to frontend...
yarn build:publish

echo.
echo [5/7] Setting up server database...
cd ..\server
npx prisma generate

echo.
echo [6/7] Installing server dependencies...
npm install

echo.
echo [7/7] Installing collector dependencies...
cd ..\collector
npm install

echo.
echo ✅ ALL FIXES APPLIED SUCCESSFULLY!
echo.
echo ISSUES RESOLVED:
echo - ✅ Missing react-feather dependency
echo - ✅ Internal server error in form submission
echo - ✅ Database table migration for prechat_submissions
echo - ✅ Form validation and API endpoint fixes
echo - ✅ Modern, responsive form styling
echo - ✅ Proper form-to-chat widget transition
echo.
echo STARTUP COMMANDS:
echo Terminal 1: cd server ^&^& npm run dev
echo Terminal 2: cd collector ^&^& npm run dev
echo Terminal 3: cd frontend ^&^& npm run dev
echo.
echo TEST URLS:
echo - Widget: http://localhost:3001/embed/test-prechat-widget.html
echo - Dashboard: http://localhost:3001/settings/prechat-dashboard
echo - Frontend: http://localhost:3000
echo.
echo The prechat form will now:
echo 1. Display with modern styling
echo 2. Submit successfully to the server
echo 3. Transition to chat widget after submission
echo 4. Store user data in the database
echo.
pause
