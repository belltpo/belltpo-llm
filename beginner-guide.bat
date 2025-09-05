@echo off
echo ==========================================
echo    AnythingLLM - Complete Beginner Guide
echo ==========================================
echo.

echo This guide will help you run your AnythingLLM project step by step.
echo.

echo [STEP 1] Stop any existing containers
echo Command: docker stop anythingllm-container
docker stop anythingllm-container 2>nul

echo Command: docker rm anythingllm-container
docker rm anythingllm-container 2>nul

echo.
echo [STEP 2] Build the Docker image (this may take 10-15 minutes)
echo Command: docker build -t anythingllm:latest .
echo Building image...
docker build -t anythingllm:latest .

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo [STEP 3] Create data directories for persistent storage
echo Command: mkdir anythingllm-data
if not exist "anythingllm-data" mkdir anythingllm-data

echo Command: mkdir anythingllm-logs  
if not exist "anythingllm-logs" mkdir anythingllm-logs

echo.
echo [STEP 4] Run the container with all necessary configurations
echo Command: docker run -d --name anythingllm-container --restart unless-stopped -p 3001:3001 -p 8888:8888 -v "%cd%\anythingllm-data:/app/server/storage" -v "%cd%\anythingllm-logs:/var/log" --env-file .env.docker anythingllm:latest

docker run -d ^
  --name anythingllm-container ^
  --restart unless-stopped ^
  -p 3001:3001 ^
  -p 8888:8888 ^
  -v "%cd%\anythingllm-data:/app/server/storage" ^
  -v "%cd%\anythingllm-logs:/var/log" ^
  --env-file .env.docker ^
  anythingllm:latest

if %errorlevel% neq 0 (
    echo ERROR: Failed to start container!
    pause
    exit /b 1
)

echo.
echo [STEP 5] Wait for the application to start (60 seconds)
echo The application needs time to initialize the database and start services...
timeout /t 60 /nobreak

echo.
echo [STEP 6] Check if the container is running
echo Command: docker ps
docker ps | findstr anythingllm-container

echo.
echo [STEP 7] Check the application logs
echo Command: docker logs anythingllm-container --tail=10
docker logs anythingllm-container --tail=10

echo.
echo ==========================================
echo    Your AnythingLLM is Ready!
echo ==========================================
echo.
echo Web Interface: http://localhost:3001
echo Collector API: http://localhost:8888
echo.
echo What to do next:
echo 1. Open http://localhost:3001 in your web browser
echo 2. Create your admin account (first time only)
echo 3. Create a workspace and upload documents
echo 4. Start chatting with your AI assistant!
echo.
echo Useful commands for managing your container:
echo   View logs:    docker logs -f anythingllm-container
echo   Stop:         docker stop anythingllm-container
echo   Start:        docker start anythingllm-container
echo   Restart:      docker restart anythingllm-container
echo   Remove:       docker rm -f anythingllm-container
echo.
echo Opening web interface...
start http://localhost:3001

pause
