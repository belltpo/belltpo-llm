@echo off
echo ==========================================
echo    AnythingLLM - Logo Fixed Deployment
echo ==========================================
echo.

echo [1/5] Checking Docker status...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [2/5] Cleaning up existing containers...
docker stop anythingllm-container 2>nul
docker rm anythingllm-container 2>nul

echo [3/5] Building Docker image with logo fix...
docker build -t anythingllm:latest .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

echo [4/5] Creating data directories...
if not exist "anythingllm-data" mkdir anythingllm-data
if not exist "anythingllm-logs" mkdir anythingllm-logs

echo [5/5] Starting container...
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
    docker logs anythingllm-container --tail=10
    pause
    exit /b 1
)

echo.
echo Waiting for services to initialize (90 seconds)...
timeout /t 90 /nobreak

echo.
echo ==========================================
echo    Chat Widget Logo Error Fixed!
echo ==========================================
echo.
echo FIXED: belltpoLogo import added to PreChatForm component
echo FIXED: Chat widget now works 24/7 regardless of office hours
echo FIXED: Supervisor log directory issue resolved
echo.
echo Container Status:
docker ps | findstr anythingllm-container

echo.
echo Recent Logs:
docker logs anythingllm-container --tail=10

echo.
echo Testing Connection:
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/ping' -TimeoutSec 10 -UseBasicParsing; Write-Host 'SUCCESS: Application is responding!' } catch { Write-Host 'FAILED: Application not responding yet - may need more time' }"

echo.
echo Access URLs:
echo   Web Interface: http://localhost:3001
echo   Chat Widget Test: Click the chat icon on any page
echo.
echo Management Commands:
echo   View logs:    docker logs -f anythingllm-container
echo   Restart:      docker restart anythingllm-container
echo   Stop:         docker stop anythingllm-container
echo.

timeout /t 5 /nobreak >nul
echo Opening web interface...
start http://localhost:3001

pause
