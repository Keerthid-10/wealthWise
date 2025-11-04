@echo off
echo ========================================
echo   WEALTHWISE APPLICATION STARTUP
echo ========================================
echo.

:: Change to the project directory
cd /d "%~dp0"

:: Check if MongoDB is running
echo [1/4] Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MongoDB is already running.
) else (
    echo MongoDB is not running. Please start MongoDB manually.
    echo You can start it with: net start MongoDB
    echo Or run mongod.exe from your MongoDB installation directory.
    pause
)

echo.
echo [2/4] Starting Bank Statement Service (Port 3001)...
start "Bank Statement Service" cmd /k "cd /d %~dp0bank-statement-app && npm start"
timeout /t 5 /nobreak > NUL

echo.
echo [3/4] Starting Backend Server (Port 5000)...
start "WealthWise Backend" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 5 /nobreak > NUL

echo.
echo [4/4] Starting Frontend Application (Port 3000)...
start "WealthWise Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo Backend Server:          http://localhost:5000
echo Bank Statement Service:  http://localhost:3001
echo Frontend Application:    http://localhost:3000
echo.
echo The frontend should open automatically in your browser.
echo If not, please navigate to http://localhost:3000
echo.
echo Press any key to exit this window...
pause > NUL
