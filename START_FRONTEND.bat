@echo off
setlocal
cd /d "%~dp0frontend"

echo Starting ECOM 3D STORE frontend...
echo Frontend: http://127.0.0.1:5173/
npm run dev -- --host 127.0.0.1

endlocal
