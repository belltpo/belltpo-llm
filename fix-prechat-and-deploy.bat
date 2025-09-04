@echo off
echo ========================================
echo Fix All Issues and Deploy Container
echo ========================================

echo Step 1: Stop and remove existing containers...
docker stop anythingllm-unified 2>nul
docker rm anythingllm-unified 2>nul
docker rmi anythingllm-unified-fixed 2>nul

echo.
echo Step 2: Clean up all database and cache files...
cd /d "%~dp0"
if exist "prechat_widget\db.sqlite3" del "prechat_widget\db.sqlite3"
if exist "prechat_widget\prechat\migrations\__pycache__" rmdir /s /q "prechat_widget\prechat\migrations\__pycache__"
if exist "server\storage\anythingllm.db" del "server\storage\anythingllm.db"

echo.
echo Step 3: Build Docker image with all fixes...
docker build -t anythingllm-unified-fixed -f Dockerfile.unified.fixed .

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 4: Run container with proper environment variables...
        -p 9000:9000 ^
        -v "%cd%\prechat_widget:/app" ^
        -w /app ^
        python:3.11-slim ^
        sh -c "pip install -r requirements.txt && python manage.py migrate && python manage.py runserver 0.0.0.0:9000"
    
    REM Start main AnythingLLM
    docker run -d ^
        -p 3001:3001 ^
        --name anythingllm-main ^
        --cap-add SYS_ADMIN ^
        --link prechat-widget:prechat-widget ^
        -v "%cd%\server\storage:/app/server/storage" ^
        -v "%cd%\collector\hotdir:/app/collector/hotdir" ^
        -v "%cd%\collector\outputs:/app/collector/outputs" ^
        -v "%cd%\docker\.env:/app/server/.env" ^
        -e STORAGE_DIR="/app/server/storage" ^
        -e SERVER_PORT=3001 ^
        -e PRECHAT_WIDGET_URL="http://prechat-widget:9000" ^
        --restart unless-stopped ^
        mintplexlabs/anythingllm:latest
    
    echo.
    echo ✅ Alternative setup complete!
    echo 🌐 Main App: http://localhost:3001
    echo 🔧 Prechat Widget: http://localhost:9000
)

echo.
echo Current running containers:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ========================================
echo Next: Production Deployment Setup
echo ========================================
echo.
echo To deploy to llm.belltpo.com, you'll need:
echo 1. A server with Docker installed
echo 2. Domain DNS pointing to server IP
echo 3. SSL certificate setup
echo 4. Production environment variables
echo.
echo Run 'setup-production.bat' for deployment guide.

pause
