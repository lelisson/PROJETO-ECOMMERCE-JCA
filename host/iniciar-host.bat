@echo off
cd /d "%~dp0.."
if not exist ".venv\Scripts\python.exe" (
  echo Criando venv...
  python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo.
echo JCA Store em http://127.0.0.1:5000
python run.py
pause
