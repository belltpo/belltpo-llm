@echo off
echo ==========================================
echo    AnythingLLM Docker Container Deployment
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

echo [1/6] Stopping any existing containers...
docker stop anythingllm-container 2>nul
docker rm anythingllm-container 2>nul

echo [2/6] Creating data directories...
if not exist "anythingllm-data" mkdir anythingllm-data
if not exist "anythingllm-logs" mkdir anythingllm-logs

echo [3/6] Checking Docker image...
docker images | findstr anythingllm
if %errorlevel% neq 0 (
    echo Docker image not found. Building image...
    docker build -t anythingllm:latest .
)

echo [4/6] Starting AnythingLLM container...
docker run -d ^
  --name anythingllm-container ^
  --restart unless-stopped ^
  -p 3001:3001 ^
  -p 8888:8888 ^
  -v "%cd%\anythingllm-data:/app/server/storage" ^
  -v "%cd%\anythingllm-logs:/var/log" ^
  --env-file .env.docker ^
  anythingllm:latest

if %errorlevel% neq 0 (
    echo ERROR: Failed to start container!
    echo Checking logs...
    docker logs anythingllm-container
    pause
    exit /b 1
)

echo [5/6] Waiting for services to initialize...
timeout /t 45 /nobreak >nul

echo [6/6] Checking container status...
docker ps | findstr anythingllm-container
if %errorlevel% neq 0 (
    echo ERROR: Container is not running!
    echo Checking logs...
    docker logs anythingllm-container --tail=20
    pause
    exit /b 1
)

echo.
echo ==========================================
echo    Deployment Successful!
echo ==========================================
echo.
echo Container Name: anythingllm-container
echo Status: Running
echo.
echo Access URLs:
echo   Web Interface: http://localhost:3001
echo   Collector API: http://localhost:8888
echo.
echo Data Storage: %cd%\anythingllm-data
echo Logs Storage: %cd%\anythingllm-logs
echo.
echo Useful Commands:
echo   View logs:    docker logs -f anythingllm-container
echo   Stop:         docker stop anythingllm-container
echo   Restart:      docker restart anythingllm-container
echo   Status:       docker ps
echo.
echo Opening web interface...
timeout /t 3 /nobreak >nul
start http://localhost:3001

pause
