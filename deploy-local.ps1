# deploy-local.ps1 — Build e reinicia o servidor local no Windows
# Uso: .\deploy-local.ps1
# Ou para so reiniciar sem rebuild: .\deploy-local.ps1 -SkipBuild

param(
    [switch]$SkipBuild
)

$Port    = 3000
$LogOut  = "$PSScriptRoot\portal-esol.log"
$LogErr  = "$PSScriptRoot\portal-esol-err.log"

# ── 1. Encerrar processo que ocupa a porta ─────────────────────────────────
Write-Host "`n[1/3] Verificando porta $Port..." -ForegroundColor Cyan

$conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $pid_ = $conn.OwningProcess | Select-Object -First 1
    Write-Host "      Encerrando processo PID $pid_ na porta $Port..." -ForegroundColor Yellow
    Stop-Process -Id $pid_ -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "      Porta $Port liberada." -ForegroundColor Green
} else {
    Write-Host "      Porta $Port ja esta livre." -ForegroundColor Green
}

# ── 2. Build (opcional) ────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Host "`n[2/3] Executando build..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nERRO: Build falhou. Deploy cancelado." -ForegroundColor Red
        exit 1
    }
    Write-Host "      Build concluido." -ForegroundColor Green
} else {
    Write-Host "`n[2/3] Build ignorado (-SkipBuild)." -ForegroundColor DarkGray
}

# ── 3. Iniciar servidor ────────────────────────────────────────────────────
Write-Host "`n[3/3] Iniciando servidor..." -ForegroundColor Cyan

$env:NODE_ENV = "production"

# stdout e stderr em arquivos separados (exigencia do PowerShell)
$process = Start-Process -FilePath "node" `
    -ArgumentList "dist/index.js" `
    -RedirectStandardOutput $LogOut `
    -RedirectStandardError  $LogErr `
    -NoNewWindow `
    -PassThru

Start-Sleep -Seconds 4

# ── 4. Verificar se subiu ──────────────────────────────────────────────────
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:$Port/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "      Servidor no ar — HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host "      PID : $($process.Id)" -ForegroundColor DarkGray
    Write-Host "      Log : $LogOut" -ForegroundColor DarkGray
    Write-Host "`n  Acesse: http://localhost:$Port/`n" -ForegroundColor White
} catch {
    Write-Host "      AVISO: servidor nao respondeu na porta $Port." -ForegroundColor Red
    Write-Host ""
    if (Test-Path $LogErr) {
        Write-Host "--- STDERR ---" -ForegroundColor Yellow
        Get-Content $LogErr -Tail 20
    }
    if (Test-Path $LogOut) {
        Write-Host "--- STDOUT ---" -ForegroundColor Yellow
        Get-Content $LogOut -Tail 20
    }
}
