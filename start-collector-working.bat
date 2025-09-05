@echo off
title AnythingLLM Collector Service
echo ===== Starting Working Collector Service =====
cd /d "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector"

REM Kill any existing processes on port 8888
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888') do (
    taskkill /F /PID %%a 2>nul
)

REM Set environment variables
set NODE_ENV=development
set STORAGE_DIR=../server/storage
set COLLECTOR_PORT=8888

REM Create directories
if not exist hotdir mkdir hotdir
if not exist "../server/storage/documents/custom-documents" mkdir "../server/storage/documents/custom-documents"

echo Starting collector service...
node working-collector-final.js
echo Service will run on http://localhost:8888
echo Press Ctrl+C to stop the service
echo.
