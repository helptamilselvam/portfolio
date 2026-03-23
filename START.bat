@echo off
:: Change to the folder where this .bat file lives
cd /d "%~dp0"

title Tamilselvam Portfolio
color 0A

echo.
echo  ================================================
echo   Tamilselvam Jeyaraman - Data Engineer Portfolio
echo  ================================================
echo.

:: Check Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please download and install Node.js from:
    echo  https://nodejs.org
    echo.
    echo  Then run this file again.
    pause
    exit /b
)

:: Install dependencies if missing
if not exist "node_modules\express" (
    echo  Installing dependencies - please wait...
    echo.
    npm install
    echo.
)

:: Wait for server to start then open browser
echo  Starting server...
echo.
echo  Your portfolio will open at: http://localhost:3000
echo.
echo  Keep this window open while using the portfolio.
echo  Press Ctrl+C to stop the server.
echo.

:: Open browser after 3 second delay
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start the server (this keeps running)
node server.js

echo.
echo  Server stopped.
pause
