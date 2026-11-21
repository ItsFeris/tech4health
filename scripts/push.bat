@echo off
title Tech4Health - push to GitHub
cd /d "%~dp0.."
echo Current branch:
git branch --show-current
echo.
git status --short
echo.
git push
echo.
if errorlevel 1 (echo PUSH FAILED - copy the red text above to Claude.) else (echo Pushed to GitHub.)
pause
