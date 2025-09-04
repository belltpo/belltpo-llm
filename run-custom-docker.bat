@echo off
echo ========================================
echo  AnythingLLM Custom Docker Setup
echo ========================================

echo Step 1: Cleaning up old containers...
docker stop anythingllm-local anythingllm-custom 2>nul
docker rm anythingllm-local anythingllm-custom 2>nul
docker rmi anythingllm-custom 2>nul

echo Step 2: Building custom image with your modifications...
docker build -t anythingllm-custom -f docker/Dockerfile .

if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Using official image with volume mounts...
    goto USE_OFFICIAL
)

echo Step 3: Running custom container...
docker run -d -p 3001:3001 ^
  --name anythingllm-custom ^
  --cap-add SYS_ADMIN ^
  -v "%cd%\docker\.env:/app/server/.env" ^
  -v "%cd%\server\storage:/app/server/storage" ^
  -v "%cd%\collector\hotdir:/app/collector/hotdir" ^
  -v "%cd%\collector\outputs:/app/collector/outputs" ^
  -v "%cd%\prechat_widget:/app/prechat_widget" ^
  -e STORAGE_DIR="/app/server/storage" ^
  -e SERVER_PORT=3001 ^
  --restart unless-stopped ^
  anythingllm-custom

goto SUCCESS

:USE_OFFICIAL
echo Using official image with volume mounts for development...
docker run -d -p 3001:3001 ^
  --name anythingllm-local ^
  --cap-add SYS_ADMIN ^
  -v "%cd%\docker\.env:/app/server/.env" ^
  -v "%cd%\server\storage:/app/server/storage" ^
  -v "%cd%\collector\hotdir:/app/collector/hotdir" ^
  -v "%cd%\collector\outputs:/app/collector/outputs" ^
  -v "%cd%\prechat_widget:/app/prechat_widget" ^
  -v "%cd%\frontend\dist:/app/frontend/dist" ^
  -v "%cd%\server:/app/server" ^
  -e STORAGE_DIR="/app/server/storage" ^
  -e SERVER_PORT=3001 ^
  --restart unless-stopped ^
  mintplexlabs/anythingllm

:SUCCESS
echo ========================================
echo Container started successfully!
echo Access your application at: http://localhost:3001
echo ========================================

echo Checking container status...
docker ps

echo.
echo To view logs: docker logs -f anythingllm-custom
echo To stop: docker stop anythingllm-custom
echo To restart: docker restart anythingllm-custom
echo ========================================
