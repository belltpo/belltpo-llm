@echo off
echo ==========================================
echo    AnythingLLM Docker Deployment Script
echo ==========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/5] Stopping any existing containers...
docker stop anythingllm-container 2>nul
docker rm anythingllm-container 2>nul

echo [2/5] Creating environment file...
if not exist ".env" (
    copy ".env.docker" ".env"
    echo Environment file created from template.
) else (
    echo Environment file already exists.
)

echo [3/5] Creating data directories...
if not exist "anythingllm-data" mkdir anythingllm-data
if not exist "anythingllm-logs" mkdir anythingllm-logs

echo [4/5] Starting AnythingLLM container...
docker run -d ^
  --name anythingllm-container ^
  --restart unless-stopped ^
  -p 3001:3001 ^
  -p 8888:8888 ^
  -v "%cd%\anythingllm-data:/app/server/storage" ^
  -v "%cd%\anythingllm-logs:/var/log" ^
  --env-file .env ^
  anythingllm:latest

if %errorlevel% neq 0 (
    echo ERROR: Failed to start container!
    pause
    exit /b 1
)

echo [5/5] Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo ==========================================
echo    AnythingLLM Successfully Started!
echo ==========================================
echo.
echo Web Interface: http://localhost:3001
echo Collector API: http://localhost:8888
echo.
echo Container Name: anythingllm-container
echo Data Directory: %cd%\anythingllm-data
echo Logs Directory: %cd%\anythingllm-logs
echo.
echo Useful Commands:
echo   View logs:    docker logs -f anythingllm-container
echo   Stop:         docker stop anythingllm-container
echo   Restart:      docker restart anythingllm-container
echo   Remove:       docker rm -f anythingllm-container
echo.
echo Opening web interface in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3001

pause
