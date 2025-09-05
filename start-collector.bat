@echo off
cd /d "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector"
echo Starting collector service...
echo Trying fixed-collector.js first...
node fixed-collector.js
if %ERRORLEVEL% NEQ 0 (
    echo fixed-collector.js failed, trying working-collector.js...
    node working-collector.js
    if %ERRORLEVEL% NEQ 0 (
        echo working-collector.js failed, trying index.js...
        node index.js
    )
)
pause
