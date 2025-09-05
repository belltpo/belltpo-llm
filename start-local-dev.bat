@echo off
echo ==========================================
echo    AnythingLLM Local Development Setup
echo ==========================================
echo.

echo This will start all services locally (not in Docker)
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo Collector: http://localhost:8888
echo.

echo [1/4] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Installing dependencies if needed...
echo Installing server dependencies...
cd server
if not exist "node_modules" (
    npm install --legacy-peer-deps
)
cd ..

echo Installing collector dependencies...
cd collector
if not exist "node_modules" (
    npm install --legacy-peer-deps
)
cd ..

echo Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    npm install --legacy-peer-deps
)
cd ..

echo [3/4] Setting up environment...
if not exist "server\.env" (
    copy ".env.docker" "server\.env"
    echo Environment file created for server.
)

echo [4/4] Starting all services...
echo Opening 3 terminal windows for each service...

start "AnythingLLM Server (Port 3001)" cmd /k "cd server && echo Starting AnythingLLM Server... && npm run dev"
timeout /t 3 /nobreak >nul

start "AnythingLLM Collector (Port 8888)" cmd /k "cd collector && echo Starting Document Collector... && npm run dev"
timeout /t 3 /nobreak >nul

start "AnythingLLM Frontend (Port 3000)" cmd /k "cd frontend && echo Starting Frontend... && npm run dev"

echo.
echo ==========================================
echo    All Services Starting
echo ==========================================
echo.
echo Three terminal windows have opened:
echo 1. Server (Backend API) - Port 3001
echo 2. Collector (Document Processing) - Port 8888  
echo 3. Frontend (Web Interface) - Port 3000
echo.
echo Wait 30-60 seconds for all services to start, then:
echo Open: http://localhost:3000
echo.
echo To stop services: Close the terminal windows or press Ctrl+C in each
echo.

timeout /t 10 /nobreak >nul
echo Opening frontend in browser...
start http://localhost:3000

pause
