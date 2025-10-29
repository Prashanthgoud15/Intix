@echo off
echo ========================================
echo Starting Intix - AI Interview Coach
echo Full Stack Application
echo ========================================
echo.

echo [1/2] Starting Backend Server...
echo ========================================
start "Intix Backend" cmd /k "cd backend && call venv\Scripts\activate && python main.py"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo [2/2] Starting Frontend Server...
echo ========================================
start "Intix Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop all servers...
pause > nul

echo.
echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Intix Backend*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Intix Frontend*" /T /F > nul 2>&1

echo All servers stopped.
pause
