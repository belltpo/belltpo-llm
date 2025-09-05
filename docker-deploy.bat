@echo off
title AnythingLLM Docker Deployment
color 0A

echo.
echo ========================================
echo   AnythingLLM Docker Deployment
echo ========================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and ensure it's running
    pause
    exit /b 1
)

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

REM Check if image exists, build if not
docker images | findstr "anythingllm" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📦 AnythingLLM image not found. Building...
    docker build -t anythingllm:latest .
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to build Docker image
        pause
        exit /b 1
    )
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
    timeout /t 10 >nul
    
    echo ✅ AnythingLLM is running!
    echo.
    echo 🌐 Access your application:
    echo    Frontend: http://localhost:3001
    echo    Collector API: http://localhost:8888
    echo.
    echo 📊 Service status:
    docker-compose ps
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
