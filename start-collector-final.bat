@echo off
echo ===== Starting AnythingLLM Collector Service =====
echo.

REM Navigate to collector directory
cd /d "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector"

REM Set environment variables
set NODE_ENV=development
set STORAGE_DIR=../server/storage
set COLLECTOR_PORT=8888

REM Kill any existing node processes on port 8888
echo Checking for existing processes on port 8888...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

REM Create necessary directories
if not exist hotdir mkdir hotdir
if not exist "../server/storage/documents/custom-documents" mkdir "../server/storage/documents/custom-documents"

echo.
echo Starting collector service...
echo.

REM Start the collector service
node fixed-collector.js

pause
