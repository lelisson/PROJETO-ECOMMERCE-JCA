@echo off
chcp 65001 >nul
cd /d "%~dp0"
title JCA Store
set OPEN_BROWSER=1
set PORT=8080

if not exist ".venv\Scripts\python.exe" (
  echo [1/3] Criando ambiente virtual em .venv ...
  where py >nul 2>&1
  if %errorlevel%==0 (
    py -m venv .venv
  ) else (
    python -m venv .venv
  )
  if errorlevel 1 (
    echo ERRO: Instale Python 3 e marque "Add to PATH", ou use o instalador da Microsoft Store.
    pause
    exit /b 1
  )
  echo [2/3] Instalando dependencias ...
  call .venv\Scripts\activate.bat
  pip install -r requirements.txt
  if errorlevel 1 (
    echo ERRO: pip falhou.
    pause
    exit /b 1
  )
)

echo [3/3] Iniciando loja. Mantenha esta janela aberta.
echo.
".venv\Scripts\python.exe" "%~dp0run.py"
echo.
pause
