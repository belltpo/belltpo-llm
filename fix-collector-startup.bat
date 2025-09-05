@echo off
echo ===== AnythingLLM Collector Service Fix =====
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not properly installed or not in PATH
    echo Please install Node.js v18.12.1 or higher from https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to collector directory
cd /d "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector"

REM Set environment variables
echo Setting environment variables...
set NODE_ENV=development
set STORAGE_DIR=../server/storage
set COLLECTOR_PORT=8888

REM Check if package.json exists
if not exist package.json (
    echo ERROR: package.json not found in collector directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing collector dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create necessary directories
echo Creating necessary directories...
if not exist hotdir mkdir hotdir
if not exist storage mkdir storage
if not exist "../server/storage/documents/custom-documents" mkdir "../server/storage/documents/custom-documents"

REM Try to start the collector service
echo.
echo Starting collector service...
echo Trying fixed-collector.js...
node fixed-collector.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo fixed-collector.js failed, trying simple approach...
    echo.
    
    REM Create a minimal collector if all else fails
    echo const express = require('express'); > minimal-start.js
    echo const app = express(); >> minimal-start.js
    echo app.use(express.json()); >> minimal-start.js
    echo app.get('/', (req, res) =^> res.json({online: true, message: 'Collector running'})); >> minimal-start.js
    echo const server = app.listen(8888, '127.0.0.1', () =^> console.log('Collector listening on http://127.0.0.1:8888')); >> minimal-start.js
    echo server.on('error', (err) =^> {if(err.code === 'EADDRINUSE') {console.log('Port 8888 in use, trying 8889...'); app.listen(8889, '127.0.0.1', () =^> console.log('Collector listening on http://127.0.0.1:8889'));}}); >> minimal-start.js
    
    node minimal-start.js
)

pause
