$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$env:PORT = "8080"
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    py -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
Write-Host "JCA Store: http://127.0.0.1:8080/ (use 127.0.0.1 se localhost falhar)"
& .\.venv\Scripts\python.exe run.py
