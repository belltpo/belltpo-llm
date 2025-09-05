@echo off
echo ==========================================
echo    Docker Container Debug & Fix
echo ==========================================
echo.

echo [1/6] Stopping any existing containers...
docker stop anythingllm-container 2>nul
docker rm anythingllm-container 2>nul

echo [2/6] Checking Docker image exists...
docker images | findstr anythingllm
if %errorlevel% neq 0 (
    echo ERROR: Docker image not found! Building image...
    docker build -t anythingllm:latest .
)

echo [3/6] Starting container with debug output...
docker run -d ^
  --name anythingllm-container ^
  --restart unless-stopped ^
  -p 3001:3001 ^
  -p 8888:8888 ^
  -v "%cd%\anythingllm-data:/app/server/storage" ^
  -v "%cd%\anythingllm-logs:/var/log" ^
  --env-file .env.docker ^
  anythingllm:latest

echo [4/6] Waiting for container startup (60 seconds)...
timeout /t 60 /nobreak

echo [5/6] Checking container status...
docker ps -a | findstr anythingllm-container
echo.

echo [6/6] Showing detailed logs...
docker logs anythingllm-container

echo.
echo ==========================================
echo    Debug Information
echo ==========================================
echo.
echo Container Status:
docker ps | findstr anythingllm-container

echo.
echo Port Check:
netstat -an | findstr :3001

echo.
echo Testing Connection:
curl -f http://localhost:3001/api/ping 2>nul
if %errorlevel% equ 0 (
    echo SUCCESS: Docker container is responding!
    start http://localhost:3001
) else (
    echo FAILED: Container not responding
    echo.
    echo Troubleshooting:
    echo 1. Check logs above for errors
    echo 2. Verify container is running: docker ps
    echo 3. Check if ports are bound: netstat -an ^| findstr :3001
    echo 4. Try restarting: docker restart anythingllm-container
)

pause
