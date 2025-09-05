@echo off
title AnythingLLM Docker Deployment - Final
color 0A

echo.
echo ========================================
echo   AnythingLLM Docker Deployment - Final
echo ========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.docker .env
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file with your configuration
    echo    Required: Set your OpenAI API key and other provider credentials
    echo.
    pause
)

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose down >nul 2>&1

REM Start the application
echo 🚀 Starting AnythingLLM...
docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ⏳ Waiting for services to start...
    timeout /t 15 >nul
    
    echo ✅ AnythingLLM is running!
    echo.
    echo 🌐 Access your application:
    echo    Frontend: http://localhost:3001
    echo    Collector API: http://localhost:8888
    echo.
    echo 📊 Service status:
    docker-compose ps
    echo.
    echo 🧪 Testing endpoints...
    echo Testing server health...
    curl -f http://localhost:3001/api/ping 2>nul && echo ✅ Server is responding || echo ⚠️ Server starting up...
    
    echo Testing collector...
    curl -f http://localhost:8888/ 2>nul && echo ✅ Collector is responding || echo ⚠️ Collector starting up...
    
    echo.
    echo 📝 Useful commands:
    echo    View logs: docker-compose logs -f
    echo    Stop services: docker-compose down
    echo    Restart: docker-compose restart
    echo.
) else (
    echo ❌ Failed to start services
    echo Checking logs...
    docker-compose logs
)

pause
