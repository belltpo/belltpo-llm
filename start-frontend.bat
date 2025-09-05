@echo off
echo ==========================================
echo    AnythingLLM Frontend Development
echo ==========================================
echo.

echo [1/4] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Navigating to frontend directory...
cd frontend

echo [3/4] Installing dependencies (if needed)...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install --legacy-peer-deps
) else (
    echo Dependencies already installed.
)

echo [4/4] Starting frontend development server...
echo.
echo ==========================================
echo    Frontend Server Starting
echo ==========================================
echo.
echo Frontend will be available at: http://localhost:3000
echo API Backend should be running at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
