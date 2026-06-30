# ============================================
# DISTRIBUTED AI AGENT WORKFORCE - SAFE BUILD
# ============================================

$Root = Get-Location
$Queue = "$Root\queue"
$Memory = "$Root\.memory"
$Logs = "$Root\logs"

function Ensure-Dir($p) {
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p | Out-Null
    }
}

Ensure-Dir $Queue
Ensure-Dir "$Queue\locks"
Ensure-Dir $Memory
Ensure-Dir $Logs

# --------------------------------------------
# ENSURE OLLAMA
# --------------------------------------------
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Ollama..."
    Invoke-WebRequest https://ollama.com/download/OllamaSetup.exe -OutFile $env:TEMP\ollama.exe
    Start-Process $env:TEMP\ollama.exe -ArgumentList "/S" -Wait
}

if (-not (ollama list | Select-String deepseek-coder)) {
    ollama pull deepseek-coder
}

# --------------------------------------------
# ENSURE CURSOR
# --------------------------------------------
if (-not (Test-Path "$env:LOCALAPPDATA\Programs\Cursor")) {
    Write-Host "Installing Cursor..."
    Invoke-WebRequest "https://cursor.sh/api/download?platform=windows" -OutFile $env:TEMP\cursor.exe
    Start-Process $env:TEMP\cursor.exe -ArgumentList "/S" -Wait
}

# --------------------------------------------
# ENSURE NSSM
# --------------------------------------------
if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing NSSM..."
    Invoke-WebRequest https://nssm.cc/release/nssm-2.24.zip -OutFile $env:TEMP\nssm.zip
    Expand-Archive $env:TEMP\nssm.zip $env:TEMP\nssm -Force
    Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" "$env:WINDIR\System32\nssm.exe" -Force
}

# --------------------------------------------
# MEMORY FILES
# --------------------------------------------
"[]" | Out-File "$Memory\decisions.json" -Force
"[]" | Out-File "$Memory\failures.json" -Force
"[]" | Out-File "$Memory\fixes.json" -Force
"[]" | Out-File "$Memory\cost.json" -Force
"[]" | Out-File "$Memory\health.json" -Force

if (-not (Test-Path "$Queue\tasks.json")) {
    "[]" | Out-File "$Queue\tasks.json"
}

# ============================================
# LEGACY DISTRIBUTED RUNTIME (DISABLED)
# ============================================
Write-Warning "Legacy orchestrator/worker runtime is disabled by Phase 0 hardening."
Write-Host "Use unified runtime instead: powershell.exe -File 'c:\DevWork\agent-v3.ps1'"
Write-Host "No NSSM services are installed from this bootstrap script."