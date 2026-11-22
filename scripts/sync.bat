@echo off
title Tech4Health - sync with GitHub
cd /d "%~dp0.."
echo Getting everyone's latest work from GitHub...
git fetch --all --prune || goto fail
echo.
echo Updating your current branch:
git branch --show-current
git pull --no-edit || goto fail
echo.
echo Sending your commits to GitHub...
git push || goto fail
echo.
echo All synced.
pause
exit /b 0
:fail
echo.
echo SYNC FAILED - copy the red text above to Claude.
pause
exit /b 1
