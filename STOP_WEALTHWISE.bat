@echo off
echo ========================================
echo   STOPPING WEALTHWISE SERVICES
echo ========================================
echo.

echo Stopping all Node.js processes for WealthWise...
echo.

:: Find and kill processes on specific ports
echo [1/3] Stopping Backend Server (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>NUL
)

echo [2/4] Stopping Frontend Application (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>NUL
)

echo [3/3] Stopping Bank Statement Service (Port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>NUL
)

echo.
echo ========================================
echo   ALL SERVICES STOPPED!
echo ========================================
echo.
pause
