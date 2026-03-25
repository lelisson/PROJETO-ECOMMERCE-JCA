$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
Write-Host "JCA Store: http://127.0.0.1:5000"
python run.py
