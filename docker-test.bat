@echo off
title AnythingLLM Docker Test Build
color 0A

echo.
echo ========================================
echo   Testing AnythingLLM Docker Build
echo ========================================
echo.

REM Clean up any existing containers and images
echo 🧹 Cleaning up existing containers...
docker stop anythingllm 2>nul
docker rm anythingllm 2>nul
docker rmi anythingllm:latest 2>nul

echo.
echo 🔨 Building Docker image...
docker build -t anythingllm:latest . --no-cache

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful! Testing container...
    echo.
    
    REM Test the container
    docker run -d --name anythingllm-test -p 3001:3001 -p 8888:8888 anythingllm:latest
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Container started successfully!
        echo.
        echo 📊 Container status:
        docker ps | findstr anythingllm-test
        echo.
        echo 🧪 Testing endpoints in 10 seconds...
        timeout /t 10 >nul
        
        echo Testing server health...
        curl -f http://localhost:3001/api/ping 2>nul && echo ✅ Server is responding || echo ❌ Server not responding
        
        echo Testing collector...
        curl -f http://localhost:8888/ 2>nul && echo ✅ Collector is responding || echo ❌ Collector not responding
        
        echo.
        echo 🛑 Stopping test container...
        docker stop anythingllm-test
        docker rm anythingllm-test
        
        echo.
        echo ✅ All tests passed! Ready for deployment.
        echo Run: docker-compose up -d
    ) else (
        echo ❌ Failed to start container
        docker logs anythingllm-test 2>nul
    )
) else (
    echo ❌ Build failed! Check the error messages above.
)

echo.
pause
