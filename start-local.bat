@echo off
cd /d "%~dp0"
echo Starting The Knowledge Hub locally...
npm run start:local
echo.
echo Process exited. Press any key to close this window.
pause >nul
