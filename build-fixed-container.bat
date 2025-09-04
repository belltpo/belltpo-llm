@echo off
echo ========================================
echo Fixed Single Container Build Solution
echo ========================================

echo Step 1: Cleaning up existing containers...
docker stop $(docker ps -aq) 2>nul
docker rm $(docker ps -aq) 2>nul
docker rmi anythingllm-unified anythingllm-unified-fixed 2>nul

echo.
echo Step 2: Building fixed unified container...
docker build -t anythingllm-unified-fixed -f Dockerfile.unified.fixed .

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful! Starting unified container...
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
        --restart unless-stopped ^
        anythingllm-unified-fixed
    
    echo.
    echo ✅ Single container is running with all services!
    echo 🌐 Main App: http://localhost:3001
    echo 📊 Dashboard: http://localhost:3001/dashboard
    echo 📁 Collector: http://localhost:8888
    echo 🔧 Prechat Widget: http://localhost:9000
    echo 🔄 WebSocket: Real-time updates enabled
    echo.
    echo All services (Server + Frontend + Collector + Prechat Widget) running in ONE container!
) else (
    echo ❌ Build failed. Check the error above.
    echo.
    echo Common issues and solutions:
    echo 1. Network timeout: Try again with stable internet
    echo 2. Disk space: Free up space and retry
    echo 3. Memory: Close other applications and retry
)

echo.
echo Container status:
docker ps

echo.
echo To view logs: docker logs -f anythingllm-unified
echo To stop: docker stop anythingllm-unified
echo To restart: docker restart anythingllm-unified

pause
