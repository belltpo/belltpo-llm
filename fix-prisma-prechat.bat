@echo off
echo ========================================
echo    PRISMA PRECHAT DATABASE FIX
echo ========================================
echo.

echo [1/5] Stopping any running server processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Installing server dependencies...
cd /d "%~dp0\server"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

echo [3/5] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo [4/5] Running Prisma database migration...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to push database schema
    pause
    exit /b 1
)

echo [5/5] Starting server...
echo.
echo ========================================
echo    SERVER STARTING - CHECK FOR ERRORS
echo ========================================
echo.
start cmd /k "npm run dev"

echo.
echo ========================================
echo    PRISMA FIX COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Server is starting in a new window.
echo Test the prechat form at: http://localhost:3001/embed/test-prechat-widget.html
echo.
pause
