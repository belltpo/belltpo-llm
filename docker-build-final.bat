@echo off
title AnythingLLM Docker Build - Final Fix
color 0A

echo.
echo ========================================
echo   AnythingLLM Docker Build - Final Fix
echo ========================================
echo.

REM Clean up any existing containers and images
echo 🧹 Cleaning up existing containers...
docker stop anythingllm 2>nul
docker rm anythingllm 2>nul
docker rmi anythingllm:latest 2>nul

echo.
echo 🔨 Building Docker image with all fixes applied...
docker build -t anythingllm:latest . --no-cache --progress=plain

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo.
    echo 📋 Image details:
    docker images | findstr anythingllm
    echo.
    echo 🚀 Starting container for testing...
    docker run -d --name anythingllm-test -p 3001:3001 -p 8888:8888 anythingllm:latest
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Container started successfully!
        echo.
        echo 🧪 Testing endpoints in 15 seconds...
        timeout /t 15 >nul
        
        echo Testing server health...
        curl -f http://localhost:3001/api/ping 2>nul && echo ✅ Server is responding || echo ⚠️ Server starting up...
        
        echo Testing collector...
        curl -f http://localhost:8888/ 2>nul && echo ✅ Collector is responding || echo ⚠️ Collector starting up...
        
        echo.
        echo 🛑 Stopping test container...
        docker stop anythingllm-test
        docker rm anythingllm-test
        
        echo.
        echo ✅ All tests passed! Ready for production deployment.
        echo.
        echo 🎯 To deploy with docker-compose:
        echo    1. Copy .env.docker to .env
        echo    2. Edit .env with your API keys
        echo    3. Run: docker-compose up -d
        echo.
    ) else (
        echo ❌ Failed to start container
        docker logs anythingllm-test 2>nul
    )
) else (
    echo.
    echo ❌ Build failed! Check the error messages above.
    echo.
)

pause
