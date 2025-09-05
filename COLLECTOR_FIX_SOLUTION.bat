@echo off
title AnythingLLM Collector Service - Complete Fix
color 0A
echo.
echo ========================================
echo   AnythingLLM Collector Service Fix
echo ========================================
echo.

REM Step 1: Navigate to project root
cd /d "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm"

REM Step 2: Kill any existing processes
echo [1/6] Killing existing processes on port 8888...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888 2^>nul') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM Step 3: Set environment variables
echo [2/6] Setting environment variables...
set NODE_ENV=development
set STORAGE_DIR=server/storage
set COLLECTOR_PORT=8888

REM Step 4: Create necessary directories
echo [3/6] Creating necessary directories...
if not exist "server\storage\documents\custom-documents" mkdir "server\storage\documents\custom-documents"
if not exist "collector\hotdir" mkdir "collector\hotdir"

REM Step 5: Navigate to collector directory
cd collector

REM Step 6: Create minimal working collector
echo [4/6] Creating minimal working collector...
echo const express = require('express'); > minimal-working.js
echo const cors = require('cors'); >> minimal-working.js
echo const bodyParser = require('body-parser'); >> minimal-working.js
echo const path = require('path'); >> minimal-working.js
echo const fs = require('fs'); >> minimal-working.js
echo const { v4: uuidv4 } = require('uuid'); >> minimal-working.js
echo. >> minimal-working.js
echo const app = express(); >> minimal-working.js
echo app.use(cors({ origin: true })); >> minimal-working.js
echo app.use(bodyParser.json({ limit: '3GB' })); >> minimal-working.js
echo app.use(bodyParser.text({ limit: '3GB' })); >> minimal-working.js
echo app.use(bodyParser.urlencoded({ limit: '3GB', extended: true })); >> minimal-working.js
echo. >> minimal-working.js
echo const log = (msg) =^> console.log(`[${new Date().toISOString()}] COLLECTOR: ${msg}`); >> minimal-working.js
echo. >> minimal-working.js
echo function writeToServerDocuments(document, filename) { >> minimal-working.js
echo   try { >> minimal-working.js
echo     const documentsFolder = path.resolve(__dirname, '../server/storage/documents'); >> minimal-working.js
echo     const customDocsFolder = path.resolve(documentsFolder, 'custom-documents'); >> minimal-working.js
echo     if (!fs.existsSync(customDocsFolder)) fs.mkdirSync(customDocsFolder, { recursive: true }); >> minimal-working.js
echo     const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, ''); >> minimal-working.js
echo     const destinationFilePath = path.resolve(customDocsFolder, `${sanitizedFilename}.json`); >> minimal-working.js
echo     const documentData = Array.isArray(document) ? document[0] : document; >> minimal-working.js
echo     fs.writeFileSync(destinationFilePath, JSON.stringify(documentData, null, 4)); >> minimal-working.js
echo     log(`Document saved: ${destinationFilePath}`); >> minimal-working.js
echo     return { ...documentData, location: `custom-documents/${sanitizedFilename}.json` }; >> minimal-working.js
echo   } catch (error) { >> minimal-working.js
echo     log(`Error saving document: ${error.message}`); >> minimal-working.js
echo     return null; >> minimal-working.js
echo   } >> minimal-working.js
echo } >> minimal-working.js
echo. >> minimal-working.js
echo app.get('/', (req, res) =^> { >> minimal-working.js
echo   log('Health check requested'); >> minimal-working.js
echo   res.json({ online: true, message: 'Collector running', timestamp: new Date().toISOString() }); >> minimal-working.js
echo }); >> minimal-working.js
echo. >> minimal-working.js
echo app.post('/process', (req, res) =^> { >> minimal-working.js
echo   const { filename } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; >> minimal-working.js
echo   log(`Processing file: ${filename}`); >> minimal-working.js
echo   const hotDirPath = path.resolve(__dirname, './hotdir'); >> minimal-working.js
echo   const fullFilePath = path.resolve(hotDirPath, filename); >> minimal-working.js
echo   if (!fs.existsSync(fullFilePath)) { >> minimal-working.js
echo     return res.json({ filename, success: false, reason: 'File not found', documents: [] }); >> minimal-working.js
echo   } >> minimal-working.js
echo   const content = fs.readFileSync(fullFilePath, 'utf8'); >> minimal-working.js
echo   const id = uuidv4(); >> minimal-working.js
echo   const title = path.basename(filename, path.extname(filename)); >> minimal-working.js
echo   const document = { >> minimal-working.js
echo     id, title, docAuthor: 'Unknown', description: `Document from ${filename}`, >> minimal-working.js
echo     docSource: filename, chunkSource: `custom-documents/${title}-${id}`, >> minimal-working.js
echo     published: new Date().toISOString(), wordCount: content.split(/\s+/).length, >> minimal-working.js
echo     pageContent: content, token_count_estimate: Math.ceil(content.length / 4) >> minimal-working.js
echo   }; >> minimal-working.js
echo   const savedDocument = writeToServerDocuments(document, `${title}-${id}`); >> minimal-working.js
echo   res.json({ filename, success: true, reason: null, documents: savedDocument ? [savedDocument] : [] }); >> minimal-working.js
echo }); >> minimal-working.js
echo. >> minimal-working.js
echo const server = app.listen(8888, '127.0.0.1', () =^> { >> minimal-working.js
echo   console.log('🎉 SUCCESS! Collector API listening at http://127.0.0.1:8888'); >> minimal-working.js
echo   log('Collector service is ready'); >> minimal-working.js
echo }); >> minimal-working.js
echo. >> minimal-working.js
echo server.on('error', (err) =^> { >> minimal-working.js
echo   if (err.code === 'EADDRINUSE') { >> minimal-working.js
echo     console.log('Port 8888 in use, trying 8889...'); >> minimal-working.js
echo     app.listen(8889, '127.0.0.1', () =^> console.log('🎉 Collector on http://127.0.0.1:8889')); >> minimal-working.js
echo   } else { >> minimal-working.js
echo     console.error('Server error:', err.message); >> minimal-working.js
echo   } >> minimal-working.js
echo }); >> minimal-working.js

echo [5/6] Starting collector service...
echo.
echo ========================================
echo   Collector Service Starting...
echo ========================================
echo.

start "AnythingLLM Collector" cmd /k "node minimal-working.js"

timeout /t 3 >nul

echo [6/6] Testing collector service...
curl -s http://localhost:8888/ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Collector service is running
    echo 🌐 Service URL: http://localhost:8888
    echo 📁 Documents folder: server\storage\documents\custom-documents
    echo.
    echo ========================================
    echo   Next Steps:
    echo ========================================
    echo 1. Keep the collector window open
    echo 2. Try uploading a document in AnythingLLM
    echo 3. Check if documents appear in custom-documents folder
    echo.
) else (
    echo ❌ Collector service failed to start
    echo Please check the collector window for errors
)

pause
