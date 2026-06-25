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
# WRITE ORCHESTRATOR
# ============================================
@"
while (\$true) {
    \$tasks = Get-Content queue\tasks.json | ConvertFrom-Json
    if (git status --porcelain) {
        \$tasks += @{ id=(Get-Date -Format 'yyyyMMddHHmmss'); type='build'; status='pending' }
        \$tasks | ConvertTo-Json -Depth 5 | Out-File queue\tasks.json
    }
    Start-Sleep 15
}
"@ | Out-File orchestrator.ps1 -Force

# ============================================
# WRITE UMAKHI (PATCH APPLY)
# ============================================
@"
while (\$true) {
    \$tasks = Get-Content queue\tasks.json | ConvertFrom-Json
    \$t = \$tasks | Where-Object { \$_['type'] -eq 'build' -and \$_['status'] -eq 'pending' } | Select-Object -First 1

    if (\$t) {
        \$t['status'] = 'running'
        \$tasks | ConvertTo-Json -Depth 5 | Out-File queue\tasks.json

        git add .
        \$diff = git diff --cached

        if (\$diff) {
            \$patch = ollama run deepseek-coder "Return ONLY a valid git patch:`n\$diff"
            \$patch | Out-File fix.patch
            git apply fix.patch
            git add .
            git commit -m "AI auto-fix"
            git push
        }

        \$t['status'] = 'done'
        \$tasks | ConvertTo-Json -Depth 5 | Out-File queue\tasks.json
    }

    Start-Sleep 10
}
"@ | Out-File worker-umakhi.ps1 -Force

# ============================================
# REGISTER SERVICES
# ============================================
nssm install AI-Orchestrator powershell.exe "-ExecutionPolicy Bypass -File `"$Root\orchestrator.ps1`""
nssm install AI-Umakhi powershell.exe "-ExecutionPolicy Bypass -File `"$Root\worker-umakhi.ps1`""

nssm start AI-Orchestrator
nssm start AI-Umakhi

Write-Host "Distributed AI agents installed and running."