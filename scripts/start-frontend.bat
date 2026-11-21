@echo off
title Tech4Health - frontend
cd /d "%~dp0..\frontend"
where npm >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org & pause & exit /b 1)
if not exist node_modules (
  echo Installing packages, first time only...
  call npm install || (pause & exit /b 1)
)
echo.
echo Open http://localhost:5173 in Chrome. Close this window to stop the app.
echo.
call npm run dev
pause
