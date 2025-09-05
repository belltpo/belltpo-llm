@echo off
echo Building embed widget directly...

cd embed
echo Current directory: %CD%

echo Installing dependencies...
call npm install

echo Building with Vite...
call npx vite build

echo Checking build output...
dir dist

echo Copying files to server...
if not exist "..\server\public\embed" mkdir "..\server\public\embed"
copy "dist\*.js" "..\server\public\embed\" 2>nul
copy "dist\*.css" "..\server\public\embed\" 2>nul

echo Build completed!
cd ..
