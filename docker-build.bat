@echo off
title AnythingLLM Docker Build
color 0A

echo.
echo ========================================
echo   AnythingLLM Docker Build Script
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    docker-compose --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Docker Compose is not available. Please ensure Docker Desktop is running.
        pause
        exit /b 1
    )
)

echo ✅ Docker is installed and running
echo.

REM Set image details
set IMAGE_NAME=anythingllm
set IMAGE_TAG=latest
set FULL_IMAGE_NAME=%IMAGE_NAME%:%IMAGE_TAG%

echo 📦 Building Docker image: %FULL_IMAGE_NAME%
echo This may take several minutes...
echo.

REM Build the Docker image
docker build -t %FULL_IMAGE_NAME% .

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Docker image built successfully!
    echo.
    echo 📋 Image details:
    docker images | findstr %IMAGE_NAME%
    echo.
    echo 🎯 Next steps:
    echo 1. Copy .env.docker to .env and configure your settings
    echo 2. Run: docker-compose up -d
    echo 3. Access AnythingLLM at http://localhost:3001
    echo.
    echo 🔧 Quick start commands:
    echo   copy .env.docker .env
    echo   docker-compose up -d
    echo.
) else (
    echo.
    echo ❌ Docker build failed!
    echo Check the error messages above for details.
    echo.
)

pause
