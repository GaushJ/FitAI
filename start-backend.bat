@echo off
REM Starts the GetFitbro backend (FastAPI + uvicorn, auto-reload) on port 8000.
REM Run from anywhere: .\start-backend.bat  (or double-click in Explorer)

cd /d "%~dp0backend"
".venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000

pause
