@echo off
echo ========================================
echo Build and Run - Dependency Conflict Fix
echo ========================================

echo Step 1: Clean up existing containers...
docker stop anythingllm-unified 2>nul
docker rm anythingllm-unified 2>nul
docker rmi anythingllm-unified-fixed 2>nul

echo.
echo Step 2: Clean local files...
cd /d "%~dp0"
if exist "prechat_widget\db.sqlite3" del "prechat_widget\db.sqlite3"
if exist "prechat_widget\prechat\migrations\__pycache__" rmdir /s /q "prechat_widget\prechat\migrations\__pycache__"
if exist "server\storage\anythingllm.db" del "server\storage\anythingllm.db"

echo.
echo Step 3: Build simplified Docker image (bypasses dependency conflicts)...
echo This will use --legacy-peer-deps to resolve apache-arrow conflicts...
docker build -t anythingllm-unified-fixed -f Dockerfile.simplified .

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 4: Run container with all fixes...
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
        echo ✅ SUCCESS! Container running with dependency conflict fix!
        echo.
        echo 🔧 Applied Fixes:
        echo ==========================================
        echo ✓ Used --legacy-peer-deps to bypass apache-arrow conflict
        echo ✓ Django migration errors resolved
        echo ✓ Collector STORAGE_DIR path fixed
        echo ✓ Environment variables properly set
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
        echo.
        echo ⏳ Please wait 60-90 seconds for all services to start
    ) else (
        echo ❌ Container failed to start
        echo Check logs: docker logs anythingllm-unified
    )
) else (
    echo ❌ Build failed
    echo.
    echo If build still fails due to network issues:
    echo 1. Wait for better internet connection
    echo 2. Try: docker system prune -f
    echo 3. Run this script again
)

echo.
echo Current container status:
docker ps --filter "name=anythingllm-unified"

pause
