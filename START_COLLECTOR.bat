@echo off
title AnythingLLM Collector Service
cd /d "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector"

REM Kill existing processes
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888 2^>nul') do taskkill /F /PID %%a >nul 2>&1

REM Set environment
set NODE_ENV=development
set STORAGE_DIR=../server/storage
set COLLECTOR_PORT=8888

REM Create directories
if not exist hotdir mkdir hotdir
if not exist "../server/storage/documents/custom-documents" mkdir "../server/storage/documents/custom-documents"

echo Starting AnythingLLM Collector Service...
echo Service will run on http://localhost:8888
echo Keep this window open while using AnythingLLM
echo.

node minimal-working.js
pause
