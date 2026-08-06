@echo off
echo Starting SalesSaathi...
echo.

echo [1/2] Starting Backend (port 3001)...
start "CRM Backend" cmd /k "cd /d %~dp0backend && node index.js"

echo [2/2] Starting Frontend (port 5173)...
timeout /t 2 /nobreak >nul
start "CRM Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo CRM started!
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Login: admin@salessaathi.com / admin123
pause
