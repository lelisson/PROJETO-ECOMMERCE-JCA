@echo off
cd /d "%~dp0.."
title JCA Store - porta 8080
set PORT=8080
set PYTHON_EXE=%~dp0..\.venv\Scripts\python.exe
if not exist "%PYTHON_EXE%" (
  echo Criando ambiente virtual...
  py -m venv .venv
  set PYTHON_EXE=%~dp0..\.venv\Scripts\python.exe
  call .venv\Scripts\activate.bat
  pip install -r requirements.txt
)
echo.
echo Servidor em http://127.0.0.1:8080/
echo Aguarde 2 segundos e o navegador abrira sozinho.
echo Feche esta janela para parar o servidor.
echo.
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8080/"
"%PYTHON_EXE%" "%~dp0..\run.py"
pause
