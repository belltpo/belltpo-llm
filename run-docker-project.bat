@echo off
echo ========================================
echo Run AnythingLLM Unified Docker Project
echo ========================================

echo Step 1: Check if container exists and stop it...
docker stop anythingllm-unified 2>nul
docker rm anythingllm-unified 2>nul

echo.
echo Step 2: Run the unified container...
docker run -d ^
    -p 3001:3001 ^
    -p 8888:8888 ^
    -p 9000:9000 ^
    --name anythingllm-unified ^
    --cap-add SYS_ADMIN ^
    -v "%cd%\server\storage:/app/server/storage" ^
    -v "%cd%\collector\hotdir:/app/collector/hotdir" ^
    -v "%cd%\collector\outputs:/app/collector/outputs" ^
    -e STORAGE_DIR="/app/server/storage" ^
    -e NODE_ENV=production ^
    -e USE_SQLITE=true ^
    --restart unless-stopped ^
    anythingllm-unified-fixed

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Container started successfully!
    echo.
    echo 🌐 Access Points:
    echo ==================
    echo Main Application: http://localhost:3001
    echo Dashboard:        http://localhost:3001/dashboard
    echo Collector:        http://localhost:8888
    echo Prechat Widget:   http://localhost:9000
    echo.
    echo 🔧 Management Commands:
    echo ========================
    echo View logs:        docker logs -f anythingllm-unified
    echo Stop container:   docker stop anythingllm-unified
    echo Start container:  docker start anythingllm-unified
    echo Restart:          docker restart anythingllm-unified
    echo Remove:           docker rm -f anythingllm-unified
    echo.
    echo ⏳ Services are starting up... Please wait 30-60 seconds
    echo    for all services to be fully ready.
) else (
    echo ❌ Failed to start container!
    echo.
    echo Troubleshooting:
    echo 1. Check if image exists: docker images anythingllm-unified-fixed
    echo 2. Check Docker Desktop is running
    echo 3. Try rebuilding: build-fixed-container.bat
)

echo.
echo Current container status:
docker ps --filter "name=anythingllm-unified"

pause
