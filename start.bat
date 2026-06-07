@echo off
echo ====================================================================
echo                   FITVOICE AI MEAL TRACKER LAUNCHER
echo ====================================================================
echo.
echo [1/2] Launching Python FastAPI Backend (http://localhost:8000)...
start "FitVoice Backend API" cmd /k "cd backend && .venv\Scripts\python main.py"

echo.
echo [2/2] Launching Next.js Client Dashboard (http://localhost:3000)...
start "FitVoice Frontend Client" cmd /k "cd frontend && npm run dev"

echo.
echo --------------------------------------------------------------------
echo SUCCESS: Both servers are starting up in separate terminal windows!
echo.
echo Ready to start tracking:
echo 1. Ensure you configure your OPENAI_API_KEY inside 'backend\.env'.
echo 2. Navigate to http://localhost:3000 in your web browser.
echo --------------------------------------------------------------------
echo.
pause
