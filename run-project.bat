@echo off
echo ========================================
echo Starting AnythingLLM Project
echo ========================================

echo Starting Server...
start "AnythingLLM Server" cmd /k "cd /d c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\server && npm run dev"

timeout /t 3

echo Starting Collector...
start "AnythingLLM Collector" cmd /k "cd /d c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector && npm run dev"

timeout /t 3

echo Starting Frontend...
start "AnythingLLM Frontend" cmd /k "cd /d c:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\frontend && npm run dev"

echo ========================================
echo ✅ All services starting...
echo ========================================
echo.
echo Wait for all services to start, then test:
echo - Widget: http://localhost:3001/embed/test-prechat-widget.html
echo - Dashboard: http://localhost:3001/settings/prechat-dashboard
echo - Frontend: http://localhost:3000
echo.
pause
