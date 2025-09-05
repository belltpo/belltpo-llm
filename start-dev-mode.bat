@echo off
echo ==========================================
echo    AnythingLLM Development Mode
echo ==========================================
echo.

echo Starting all services in development mode...
echo.

echo [1/3] Starting Backend Server (Port 3001)...
start "AnythingLLM Server" cmd /k "cd server && npm run dev"

echo [2/3] Starting Collector Service (Port 8888)...
start "AnythingLLM Collector" cmd /k "cd collector && npm run dev"

echo [3/3] Starting Frontend (Port 3000)...
start "AnythingLLM Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo    All Services Started
echo ==========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:3001
echo Collector: http://localhost:8888
echo.
echo Three terminal windows have opened for each service.
echo Close this window or press any key to continue...

pause
