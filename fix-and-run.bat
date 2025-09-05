@echo off
echo ==========================================
echo    AnythingLLM - Fixed Container Deploy
echo ==========================================
echo.

echo [1/4] Building fixed Docker image...
docker build -t anythingllm:latest .

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

echo [2/4] Creating data directories...
if not exist "anythingllm-data" mkdir anythingllm-data
if not exist "anythingllm-logs" mkdir anythingllm-logs

echo [3/4] Starting container with fixes...
docker run -d ^
  --name anythingllm-container ^
  --restart unless-stopped ^
  -p 3001:3001 ^
  -p 8888:8888 ^
  -v "%cd%\anythingllm-data:/app/server/storage" ^
  -v "%cd%\anythingllm-logs:/var/log" ^
  --env-file .env.docker ^
  anythingllm:latest

echo [4/4] Waiting for startup (90 seconds)...
timeout /t 90 /nobreak

echo.
echo Checking container status...
docker ps | findstr anythingllm-container

echo.
echo Checking logs...
docker logs anythingllm-container --tail=15

echo.
echo ==========================================
echo    Testing Connection
echo ==========================================
echo.
curl -f http://localhost:3001/api/ping 2>nul
if %errorlevel% equ 0 (
    echo SUCCESS: Application is responding!
    echo Opening web interface...
    start http://localhost:3001
) else (
    echo WARNING: Application may still be starting...
    echo Please wait a few more minutes and try: http://localhost:3001
)

pause
