@echo off
title AnythingLLM Docker Build - Fixed Version
color 0A

echo.
echo ========================================
echo   AnythingLLM Docker Build - Fixed
echo ========================================
echo.

REM Clean up any existing containers and images
echo 🧹 Cleaning up existing containers...
docker stop anythingllm 2>nul
docker rm anythingllm 2>nul
docker rmi anythingllm:latest 2>nul

echo.
echo 🔨 Building Docker image with dependency fixes...
docker build -t anythingllm:latest . --no-cache --progress=plain

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo.
    echo 📋 Image details:
    docker images | findstr anythingllm
    echo.
    echo 🎯 Ready for deployment!
    echo Run: docker-compose up -d
    echo.
) else (
    echo.
    echo ❌ Build failed! Check the error messages above.
    echo.
)

pause
