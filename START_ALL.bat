@echo off
setlocal
cd /d "%~dp0"

echo Starting ECOM 3D STORE...
echo.
echo Frontend: http://127.0.0.1:5173/
echo Backend:  http://127.0.0.1:8000/api/
echo.

start "ECOM 3D STORE Backend" cmd /k "%~dp0START_BACKEND.bat"
start "ECOM 3D STORE Frontend" cmd /k "%~dp0START_FRONTEND.bat"

echo Backend and frontend terminals are opening.
echo Keep both windows open while developing locally.
echo.
pause

endlocal
