@echo off
echo ========================================
echo    AnythingLLM Server Startup Script
echo ========================================
echo.

cd /d "%~dp0server"

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js version 18 or higher
    pause
    exit /b 1
)

echo Node.js found. Checking version...
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

echo.
echo Setting up environment...
if not exist ".env.development" (
    echo Creating .env.development from .env.example...
    copy ".env.example" ".env.development" >nul
    echo Environment file created.
) else (
    echo Environment file already exists.
)

echo.
echo Installing dependencies...
call yarn install
if %errorlevel% neq 0 (
    echo Yarn failed, trying npm...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Setting up database...
call npx prisma generate
call npx prisma migrate dev --name init

echo.
echo Starting AnythingLLM server...
echo Server will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

set NODE_ENV=development
call yarn dev

pause
