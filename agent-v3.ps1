# ==========================================
# AI WORKFORCE V3 (MULTI-AGENT PLATFORM)
# ==========================================

Write-Host "Starting AI Workforce v3..."

# -------------------------------
# SAFE INSTALL CHECK
# -------------------------------
function Ensure-Installed {

    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Ollama..."
        $exe = "$env:TEMP\ollama.exe"
        Invoke-WebRequest "https://ollama.com/download/OllamaSetup.exe" -OutFile $exe
        Start-Process $exe -ArgumentList "/S" -Wait
    } else {
        Write-Host "Ollama already installed"
    }

    if (-not (Test-Path "$env:LOCALAPPDATA\Programs\Cursor")) {
        Write-Host "Installing Cursor..."
        $exe = "$env:TEMP\cursor.exe"
        Invoke-WebRequest "https://cursor.sh/api/download?platform=windows" -OutFile $exe
        Start-Process $exe -ArgumentList "/S" -Wait
    } else {
        Write-Host "Cursor already installed"
    }

    try {
        ollama list | Select-String "deepseek-coder" | Out-Null
    } catch {
        Write-Host "Installing DeepSeek..."
        ollama pull deepseek-coder
    }
}

Ensure-Installed

# -------------------------------
# MULTI-MODEL ROUTER
# -------------------------------
function Invoke-Model {
    param($prompt, $type)

    switch ($type) {

        "code" { return (ollama run deepseek-coder $prompt) }

        "analysis" { return (ollama run deepseek-coder $prompt) }

        default { return (ollama run deepseek-coder $prompt) }
    }
}

# -------------------------------
# TASK QUEUE SYSTEM
# -------------------------------
$QueueFile = "task-queue.json"

function Get-Queue {
    if (Test-Path $QueueFile) {
        return Get-Content $QueueFile | ConvertFrom-Json
    }
    return @()
}

function Save-Queue($q) {
    $q | ConvertTo-Json -Depth 5 | Out-File $QueueFile
}

function Add-Task {
    param($type, $payload)

    $q = Get-Queue

    $task = @{
        id = Get-Date -Format "yyyyMMddHHmmss"
        type = $type
        payload = $payload
        status = "pending"
    }

    $q += $task
    Save-Queue $q
}

# -------------------------------
# AGENTS
# -------------------------------

# BUILDER
function Agent-Umakhi {
    param($task)

    git add .
    $changes = git diff --cached

    if (-not $changes) {
        return @{ status = "NO_CHANGES" }
    }

    $msg = Invoke-Model -prompt "Write commit message:`n$changes" -type "code"

    return @{
        status = "OK"
        commit = $msg
        changes = $changes
    }
}

# QA
function Agent-Mvavanyi {
    Write-Host "QA running..."

    try {
        if (Test-Path "package.json") { npm run build | Out-Null }
        if (Get-ChildItem "*.py" -ErrorAction SilentlyContinue) { python -m pytest | Out-Null }
        return @{ status = "PASS" }
    } catch {
        return @{ status = "FAIL"; error = $_ }
    }
}

# SECURITY
function Agent-Umlindi {
    $files = git diff --name-only

    foreach ($f in $files) {
        if (Test-Path $f) {
            $c = Get-Content $f -Raw

            if ($c -match "password|api_key|secret") {
                return @{ status = "BLOCK"; reason = $f }
            }
        }
    }

    return @{ status = "PASS" }
}

# SELF-HEAL
function Agent-SelfHeal {
    param($error)

    $fix = Invoke-Model -prompt "Fix error:`n$error" -type "analysis"
    $fix | Out-File "auto-fix.txt"
}

# -------------------------------
# MLAWULI (PROCESS TASKS)
# -------------------------------
function Process-Tasks {

    $queue = Get-Queue

    foreach ($task in $queue) {

        if ($task.status -eq "done") { continue }

        Write-Host "Processing task $($task.id)..."

        switch ($task.type) {

            "commit" {

                $build = Agent-Umakhi $task

                if ($build.status -eq "NO_CHANGES") {
                    $task.status = "done"
                    continue
                }

                $sec = Agent-Umlindi
                if ($sec.status -eq "BLOCK") {
                    Write-Host "Security blocked"
                    $task.status = "blocked"
                    continue
                }

                $qa = Agent-Mvavanyi
                if ($qa.status -eq "FAIL") {
                    Write-Host "QA failed"
                    Agent-SelfHeal $qa.error
                    $task.status = "retry"
                    continue
                }

                git commit -m "$($build.commit)"
                git push

                Write-Host "Commit done"
                $task.status = "done"
            }
        }
    }

    Save-Queue $queue
}

# -------------------------------
# AUTO ADD TASK (repo watcher)
# -------------------------------
function Auto-Queue {

    $changes = git status --porcelain

    if ($changes) {
        Add-Task "commit" "repo changes"
    }
}

# -------------------------------
# LOOP
# -------------------------------
$delay = 20

Write-Host "AI system running..."

while ($true) {

    Auto-Queue
    Process-Tasks

    Start-Sleep -Seconds $delay
}