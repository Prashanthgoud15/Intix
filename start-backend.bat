@echo off
echo ========================================
echo Starting Intix - AI Interview Coach
echo Backend Server
echo ========================================
echo.

cd backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
call venv\Scripts\activate

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and add your OPENAI_API_KEY
    echo.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
echo.

REM Start server
echo Starting FastAPI server...
echo Server will be available at http://localhost:8000
echo API Documentation at http://localhost:8000/docs
echo.
python main.py

pause
