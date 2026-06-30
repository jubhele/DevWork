# =====================================================
# DISTRIBUTED AI AGENT WORKFORCE – ONE FILE BOOTSTRAP
# Uses: NSSM + Ollama + DeepSeek + GitHub PRs
# =====================================================

$Root = Get-Location
$Queue = "$Root\queue"
$Memory = "$Root\.memory"
$Logs = "$Root\logs"

# -----------------------------
# UTILS
# -----------------------------
function Ensure-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null } }

Ensure-Dir $Queue
Ensure-Dir "$Queue\locks"
Ensure-Dir $Memory
Ensure-Dir $Logs

# -----------------------------
# INSTALLS (IDEMPOTENT)
# -----------------------------
function Ensure-Command($cmd, $installer) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        & $installer
    }
}

Ensure-Command ollama {
    Invoke-WebRequest https://ollama.com/download/OllamaSetup.exe -OutFile $env:TEMP\ollama.exe
    Start-Process $env:TEMP\ollama.exe -ArgumentList "/S" -Wait
}

if (-not (ollama list | Select-String deepseek-coder)) {
    ollama pull deepseek-coder
}

if (-not (Test-Path "$env:LOCALAPPDATA\Programs\Cursor")) {
    Invoke-WebRequest "https://cursor.sh/api/download?platform=windows" -OutFile $env:TEMP\cursor.exe
    Start-Process $env:TEMP\cursor.exe -ArgumentList "/S" -Wait
}

Ensure-Command nssm {
    Invoke-WebRequest https://nssm.cc/release/nssm-2.24.zip -OutFile $env:TEMP\nssm.zip
    Expand-Archive $env:TEMP\nssm.zip $env:TEMP\nssm -Force
    Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" "$env:WINDIR\System32\nssm.exe" -Force
}

Ensure-Command gh {
    winget install --id GitHub.cli -e --silent
}

# -----------------------------
# MEMORY FILES
# -----------------------------
"[]" | Out-File "$Memory\decisions.json" -Force
"[]" | Out-File "$Memory\failures.json" -Force
"[]" | Out-File "$Memory\fixes.json" -Force

# -----------------------------
# QUEUE INIT
# -----------------------------
if (-not (Test-Path "$Queue\tasks.json")) {
    "[]" | Out-File "$Queue\tasks.json"
}

# =====================================================
# LEGACY DISTRIBUTED RUNTIME (DISABLED)
# =====================================================
Write-Warning "Legacy distributed worker runtime is disabled by Phase 0 hardening."
Write-Host "Use unified runtime instead: powershell.exe -File 'c:\DevWork\agent-v3.ps1'"
Write-Host "No legacy worker files are generated and no NSSM services are installed."