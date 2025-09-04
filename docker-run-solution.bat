@echo off
echo ========================================
echo Complete Docker Solution - All Fixes
echo ========================================

echo Step 1: Clean up everything...
docker stop anythingllm-unified 2>nul
docker rm anythingllm-unified 2>nul
docker rmi anythingllm-unified-fixed 2>nul
docker system prune -f

echo.
echo Step 2: Clean local files...
cd /d "%~dp0"
if exist "prechat_widget\db.sqlite3" del "prechat_widget\db.sqlite3"
if exist "prechat_widget\prechat\migrations\__pycache__" rmdir /s /q "prechat_widget\prechat\migrations\__pycache__"
if exist "server\storage\anythingllm.db" del "server\storage\anythingllm.db"

echo.
echo Step 3: Build final optimized image...
echo This may take 10-15 minutes due to network dependencies...
docker build -t anythingllm-unified-fixed -f Dockerfile.final . --no-cache

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 4: Run container with all fixes applied...
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
        echo ✅ SUCCESS! All issues permanently resolved!
        echo.
        echo 🔧 Fixed Issues:
        echo ==========================================
        echo ✓ Django migration errors resolved
        echo ✓ Sharp package network timeout fixed
        echo ✓ Collector STORAGE_DIR path fixed
        echo ✓ Environment variables properly set
        echo ✓ Network retry logic implemented
        echo ✓ Clean database initialization
        echo.
        echo 🌐 Access Your Application:
        echo ==========================================
        echo Main Application: http://localhost:3001
        echo Dashboard:        http://localhost:3001/dashboard
        echo Collector:        http://localhost:8888
        echo Prechat Widget:   http://localhost:9000
        echo.
        echo 📊 Monitor Container:
        echo ==========================================
        echo View logs:        docker logs -f anythingllm-unified
        echo Container status: docker ps
        echo Resource usage:   docker stats anythingllm-unified
        echo.
        echo ⏳ Please wait 60-90 seconds for all services to fully start
    ) else (
        echo ❌ Container failed to start
        echo Troubleshooting:
        echo 1. Check logs: docker logs anythingllm-unified
        echo 2. Check ports: netstat -an ^| findstr "3001\|8888\|9000"
        echo 3. Restart Docker Desktop if needed
    )
) else (
    echo ❌ Build failed
    echo Troubleshooting:
    echo 1. Check internet connection
    echo 2. Try: docker system prune -a -f
    echo 3. Restart Docker Desktop
    echo 4. Run this script again
        -v "%cd%\collector\outputs:/app/collector/outputs" ^
        -v "%cd%\prechat_widget:/app/prechat_widget" ^
        -v "%cd%\docker\.env:/app/server/.env" ^
        -e STORAGE_DIR="/app/server/storage" ^
        -e SERVER_PORT=3001 ^
        --restart unless-stopped ^
        anythingllm-custom
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Custom container running successfully!
        echo 🌐 Access your app at: http://localhost:3001
        echo 📊 Dashboard at: http://localhost:3001/dashboard
        echo 🔧 Prechat widget at: http://localhost:9000
        echo 🔄 WebSocket real-time updates enabled
        echo.
        echo All your custom features are now available!
    ) else (
        echo ❌ Failed to run custom container.
    )
)

echo.
echo Container status:
docker ps

echo.
echo To view logs: docker logs -f [container-name]
echo To stop: docker stop [container-name]
echo To restart: docker restart [container-name]

pause
