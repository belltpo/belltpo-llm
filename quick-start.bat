@echo off
echo ==========================================
echo    AnythingLLM Quick Start Commands
echo ==========================================
echo.

echo Step 1: Stop any existing container
docker stop anythingllm-container 2>nul
docker rm anythingllm-container 2>nul

echo.
echo Step 2: Build the Docker image
docker build -t anythingllm:latest .

echo.
echo Step 3: Create data directories
if not exist "anythingllm-data" mkdir anythingllm-data
if not exist "anythingllm-logs" mkdir anythingllm-logs

echo.
echo Step 4: Run the container
docker run -d ^
  --name anythingllm-container ^
  --restart unless-stopped ^
  -p 3001:3001 ^
  -p 8888:8888 ^
  -v "%cd%\anythingllm-data:/app/server/storage" ^
  -v "%cd%\anythingllm-logs:/var/log" ^
  --env-file .env.docker ^
  anythingllm:latest

echo.
echo Step 5: Wait for startup (30 seconds)
timeout /t 30 /nobreak

echo.
echo Step 6: Check if running
docker ps | findstr anythingllm-container

echo.
echo ==========================================
echo    Access Your Application
echo ==========================================
echo Web Interface: http://localhost:3001
echo Collector API: http://localhost:8888
echo.
echo Opening web interface...
start http://localhost:3001

pause
