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
# FILE GENERATION
# =====================================================

# ---------- ORCHESTRATOR ----------
@'
while ($true) {
    $q = Get-Content queue\tasks.json | ConvertFrom-Json
    if (git status --porcelain) {
        $q += @{ id = (Get-Date -Format "yyyyMMddHHmmss"); type="build"; status="pending" }
        $q | ConvertTo-Json -Depth 5 | Out-File queue\tasks.json
    }
    Start-Sleep 15
}
'@ | Out-File orchestrator.ps1 -Force

# ---------- UMakhi (BUILDER + PATCH) ----------
@'
while ($true) {
    $tasks = Get-Content queue\tasks.json | ConvertFrom-Json
    $t = $tasks | Where-Object { $_.type -eq "build" -and $_.status -eq "pending" } | Select-Object -First 1
    if ($t) {
        $t.status="running"; $tasks | ConvertTo-Json -Depth 5 | Out-File queue\tasks.json
        git add .
        $diff = git diff --cached
        if ($diff) {
            $patch = ollama run deepseek-coder "Return a git patch to improve or fix errors:`n$diff"
            $patch | Out-File fix.patch
            git apply fix.patch
            git add .
            $msg = ollama run deepseek-coder "Write commit message"
            git commit -m "$msg"
            git push
        }
        $t.status="done"; $tasks | ConvertTo-Json -Depth 5 | Out-File queue\tasks.json
    }
    Start-Sleep 10
}
'@ | Out-File worker-umakhi.ps1 -Force

# ---------- QA ----------
@'
while ($true) {
    try {
        if (Test-Path package.json) { npm run build | Out-Null }
        if (Get-ChildItem *.py -ErrorAction SilentlyContinue) { python -m pytest | Out-Null }
    } catch {
        Add-Content logs\agent.log "QA fail: $_"
    }
    Start-Sleep 20
}
'@ | Out-File worker-mvavanyi.ps1 -Force

# ---------- SECURITY ----------
@'
while ($true) {
    $files = git diff --name-only
    foreach ($f in $files) {
        if ((Get-Content $f -Raw) -match "password|api_key|secret") {
            Add-Content logs\agent.log "SECURITY BLOCK $f"
        }
    }
    Start-Sleep 30
}
'@ | Out-File worker-umlindi.ps1 -Force

# ---------- PR AGENT ----------
@'
while ($true) {
    gh pr create --fill --base master --head (git branch --show-current) 2>$null
    Start-Sleep 60
}
'@ | Out-File worker-pr.ps1 -Force

# =====================================================
# WINDOWS SERVICES
# =====================================================
$n = @(
    @{name="AI-Orchestrator"; file="orchestrator.ps1"},
    @{name="AI-Umakhi"; file="worker-umakhi.ps1"},
    @{name="AI-QA"; file="worker-mvavanyi.ps1"},
    @{name="AI-Security"; file="worker-umlindi.ps1"},
    @{name="AI-PR"; file="worker-pr.ps1"}
)

foreach ($s in $n) {
    nssm install $s.name powershell.exe "-ExecutionPolicy Bypass -File `"$Root\$($s.file)`""
    nssm start $s.name
}

Write-Host "✅ Distributed AI Workforce ONLINE"