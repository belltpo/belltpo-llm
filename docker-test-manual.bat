@echo off
echo ==========================================
echo    Manual Docker Test & Deployment
echo ==========================================
echo.

echo Step 1: Check Docker status
docker version
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)

echo.
echo Step 2: Clean up existing containers
docker stop anythingllm-container 2>nul
docker rm anythingllm-container 2>nul

echo.
echo Step 3: Check if image exists
docker images anythingllm:latest
if %errorlevel% neq 0 (
    echo Building Docker image...
    docker build -t anythingllm:latest .
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build Docker image!
        pause
        exit /b 1
    )
)

echo.
echo Step 4: Create data directories
if not exist "anythingllm-data" mkdir anythingllm-data
if not exist "anythingllm-logs" mkdir anythingllm-logs

echo.
echo Step 5: Start container
echo Running: docker run -d --name anythingllm-container --restart unless-stopped -p 3001:3001 -p 8888:8888 -v "%cd%\anythingllm-data:/app/server/storage" -v "%cd%\anythingllm-logs:/var/log" --env-file .env.docker anythingllm:latest

docker run -d --name anythingllm-container --restart unless-stopped -p 3001:3001 -p 8888:8888 -v "%cd%\anythingllm-data:/app/server/storage" -v "%cd%\anythingllm-logs:/var/log" --env-file .env.docker anythingllm:latest

if %errorlevel% neq 0 (
    echo ERROR: Failed to start container!
    pause
    exit /b 1
)

echo.
echo Step 6: Wait for startup
echo Waiting 90 seconds for services to initialize...
timeout /t 90 /nobreak

echo.
echo Step 7: Check container status
docker ps
echo.
docker ps -a | findstr anythingllm

echo.
echo Step 8: Show container logs
docker logs anythingllm-container --tail=20

echo.
echo Step 9: Test connection
echo Testing http://localhost:3001...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001' -TimeoutSec 10 -UseBasicParsing | Out-Null; Write-Host 'SUCCESS: Container is responding!' } catch { Write-Host 'FAILED: Container not responding' }"

echo.
echo Step 10: Check port binding
netstat -an | findstr :3001

echo.
echo ==========================================
echo    Container Management Commands
echo ==========================================
echo View logs:    docker logs -f anythingllm-container
echo Restart:      docker restart anythingllm-container
echo Stop:         docker stop anythingllm-container
echo Remove:       docker rm -f anythingllm-container
echo.
echo If container is running, access: http://localhost:3001
echo.

pause
