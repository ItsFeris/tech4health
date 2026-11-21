@echo off
title Tech4Health - backend
cd /d "%~dp0..\backend"
where python >nul 2>nul || (echo Python is not installed. Get 3.12 from https://python.org and tick "Add python.exe to PATH" & pause & exit /b 1)
if not exist .venv (
  echo Creating the Python environment, first time only...
  python -m venv .venv || (pause & exit /b 1)
)
call .venv\Scripts\activate.bat
if not exist .venv\installed.flag (
  echo Installing packages, first time only...
  pip install -r requirements.txt || (pause & exit /b 1)
  echo ok> .venv\installed.flag
)
echo.
echo Backend on http://localhost:8000  -  health check: http://localhost:8000/health
echo Close this window to stop it.
echo.
uvicorn app.main:app --reload
pause
