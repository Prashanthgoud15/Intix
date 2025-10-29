@echo off
echo ========================================
echo Starting Intix - AI Interview Coach
echo Frontend Development Server
echo ========================================
echo.

cd frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo.
)

REM Start development server
echo Starting Vite development server...
echo Application will be available at http://localhost:5173
echo.
call npm run dev

pause
