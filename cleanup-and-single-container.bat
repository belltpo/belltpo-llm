@echo off
echo ========================================
echo Step 1: Cleanup All Existing Containers
echo ========================================

echo Stopping all containers...
docker stop $(docker ps -aq) 2>nul

echo Removing all containers...
docker rm $(docker ps -aq) 2>nul

echo Removing custom images...
docker rmi anythingllm-custom anythingllm-prod prechat-widget-prod prechat-widget 2>nul

echo Removing networks...
docker network rm anythingllm-network 2>nul

echo Pruning system...
docker system prune -f

echo.
echo ✅ Cleanup completed!
echo.
echo ========================================
echo Step 2: Building Single Container
echo ========================================
echo.
echo Building unified container with all services...
docker build -t anythingllm-unified -f Dockerfile.unified .

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
        anythingllm-unified
    
    echo.
    echo ✅ Unified container is running!
    echo 🌐 Main App: http://localhost:3001
    echo 📊 Dashboard: http://localhost:3001/dashboard
    echo 📁 Collector: http://localhost:8888
    echo 🔧 Prechat Widget: http://localhost:9000
    echo.
    echo All services running in single container!
) else (
    echo ❌ Build failed. Check logs above.
)

echo.
echo Current containers:
docker ps

pause
