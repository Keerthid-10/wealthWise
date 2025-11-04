@echo off
echo ========================================
echo   WEALTHWISE DATA RESET
echo ========================================
echo.
echo WARNING: This will delete ALL expenses from the database!
echo This is useful if you have old expenses with wrong dates.
echo.
echo After reset, you can re-import from bank statements.
echo.
set /p confirm="Are you sure you want to continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Operation cancelled.
    pause
    exit /b
)

echo.
echo Clearing expense data...
cd /d "%~dp0backend"

node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/wealthwise').then(async () => { const Expense = require('./src/models/Expense'); const result = await Expense.deleteMany({}); console.log('Deleted', result.deletedCount, 'expenses'); process.exit(); });"

echo.
echo ========================================
echo   DATA RESET COMPLETE!
echo ========================================
echo.
echo You can now:
echo 1. Open the application
echo 2. Go to Expenses page
echo 3. Click "Import Expenses from Bank"
echo.
pause
