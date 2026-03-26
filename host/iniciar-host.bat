@echo off
cd /d "%~dp0.."
set PORT=8080
if not exist ".venv\Scripts\python.exe" (
  echo Criando venv...
  py -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo.
echo JCA Store em http://127.0.0.1:8080/
echo Use 127.0.0.1 se localhost nao abrir.
".venv\Scripts\python.exe" run.py
pause
