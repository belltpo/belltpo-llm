@echo off
echo ========================================
echo Setup Local Development Environment
echo ========================================

echo Step 1: Install Node.js dependencies...
cd /d "%~dp0"

echo Installing server dependencies...
cd server
call npm install
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo Installing collector dependencies...
cd collector
call npm install
cd ..

echo Installing embed dependencies...
cd embed
call npm install
cd ..

echo.
echo Step 2: Setup Django prechat widget...
cd prechat_widget
echo Installing Python dependencies...
pip install -r requirements.txt

echo Setting up Django database...
if exist "db.sqlite3" del "db.sqlite3"
if exist "prechat\migrations\__pycache__" rmdir /s /q "prechat\migrations\__pycache__"
python manage.py migrate --fake-initial --noinput
python manage.py collectstatic --noinput

cd ..

echo.
echo Step 3: Create environment files...
if not exist "server\.env" (
    echo Creating server .env file...
    copy "server\.env.example" "server\.env"
)

if not exist "collector\.env" (
    echo Creating collector .env file...
    copy "collector\.env.example" "collector\.env"
)

echo.
echo ✅ Local development setup complete!
echo.
echo 🚀 To start development servers:
echo ==========================================
echo 1. Server:     cd server && npm run dev
echo 2. Frontend:   cd frontend && npm run dev  
echo 3. Collector:  cd collector && npm run dev
echo 4. Prechat:    cd prechat_widget && python manage.py runserver 9000
echo.
echo 🌐 Development URLs:
echo ==========================================
echo Frontend:      http://localhost:3000
echo Server API:    http://localhost:3001
echo Collector:     http://localhost:8888
echo Prechat:       http://localhost:9000
echo.
echo 📝 Note: Start all services in separate terminal windows

pause
