@echo off
echo ========================================
echo    PRECHAT DATABASE FIX SCRIPT
echo ========================================
echo.

echo [1/4] Stopping any running server processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Installing server dependencies...
cd /d "%~dp0\server"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

echo [3/4] Running database migration...
node -e "
const { PrechatSubmissions } = require('./models/prechatSubmissions');
async function migrate() {
    try {
        console.log('Starting prechat database migration...');
        await PrechatSubmissions.migrateTable();
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
migrate();
"
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)

echo [4/4] Starting server...
echo.
echo ========================================
echo    SERVER STARTING - CHECK FOR ERRORS
echo ========================================
echo.
start cmd /k "npm run dev"

echo.
echo ========================================
echo    FIX COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Server is starting in a new window.
echo Test the prechat form at: http://localhost:3001/embed/test-prechat-widget.html
echo.
pause
