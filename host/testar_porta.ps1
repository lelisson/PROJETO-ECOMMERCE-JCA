# Testa se o Flask responde na porta (padrao 8080). Executa na pasta host\ ou informe a raiz do repo.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$port = if ($env:PORT) { $env:PORT } else { "8080" }
$env:PORT = $port
$py = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    Write-Host "ERRO: venv nao encontrado. Rode: py -m venv .venv ; .\.venv\Scripts\pip install -r requirements.txt"
    exit 1
}

Write-Host "Subindo servidor em segundo plano na porta $port ..."
$proc = Start-Process -FilePath $py -ArgumentList "run.py" -WorkingDirectory $root -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3
try {
    $url = "http://127.0.0.1:$port/"
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8
    Write-Host "OK: $url retornou HTTP $($r.StatusCode) (corpo: $($r.Content.Length) bytes)"
    Write-Host "Use no navegador: $url"
} catch {
    Write-Host "FALHA ao acessar ${url}: $($_.Exception.Message)"
    exit 2
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
