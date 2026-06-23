@echo off
setlocal
cd /d "%~dp0backend"

set "PYTHON_EXE=C:\Users\asus\Desktop\codx\.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

echo Starting ECOM 3D STORE backend...
echo Backend API: http://127.0.0.1:8000/api/
"%PYTHON_EXE%" manage.py runserver 127.0.0.1:8000

endlocal
