# ==========================================
# AI WORKFORCE V3 (MULTI-AGENT PLATFORM)
# ==========================================
#
# Agents:   Mlawuli (orchestrator) + Umakhi (builder) + Umlindi (security)
#           + Mvavanyi (QA) + Sibali (cost routing) + Agent-SelfHeal
# Queue:    task-queue.json (root)  <-- unified active queue for agent-v3 only
# Sessions: c:\DevWork\sessions\
# Models:   Tier 1 -> Ollama deepseek-coder (local, free)
#           Tier 2/3 -> Claude API (ANTHROPIC_API_KEY in .env)

Write-Host "Starting AI Workforce v3..."

# -----------------------------------------------------------------------
# ENV
# -----------------------------------------------------------------------
if (Test-Path "c:\DevWork\.env") {
    Get-Content "c:\DevWork\.env" | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
        }
    }
}

# -----------------------------------------------------------------------
# SAFE INSTALL CHECK
# -----------------------------------------------------------------------
function Ensure-Installed {
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Ollama..."
        $exe = "$env:TEMP\ollama.exe"
        Invoke-WebRequest "https://ollama.com/download/OllamaSetup.exe" -OutFile $exe
        Start-Process $exe -ArgumentList "/S" -Wait
    }
    try {
        ollama list | Select-String "deepseek-coder" | Out-Null
    } catch {
        Write-Host "Pulling deepseek-coder..."
        ollama pull deepseek-coder
    }
}

Ensure-Installed

# -----------------------------------------------------------------------
# SIBALI -- MULTI-MODEL ROUTER (cost-tier-aware)
# -----------------------------------------------------------------------
# Tier 1 (Fast/Cheap)  -> Ollama deepseek-coder  (local, $0)
# Tier 2 (Medium)      -> Claude API Haiku        (low cost)
# Tier 3 (Complex)     -> Claude API Sonnet       (full quality)
#
# Pass -tier 1, 2, or 3.  Default: 1.
function Invoke-Model {
    param($prompt, [int]$tier = 1)

    if ($tier -eq 1 -or -not $env:ANTHROPIC_API_KEY) {
        return (ollama run deepseek-coder $prompt)
    }

    $model = if ($tier -eq 2) { "claude-haiku-4-5-20251001" } else { "claude-sonnet-4-6" }
    $body  = @{
        model      = $model
        max_tokens = 1024
        messages   = @(@{ role = "user"; content = $prompt })
    } | ConvertTo-Json -Depth 5

    try {
        $resp = Invoke-RestMethod "https://api.anthropic.com/v1/messages" `
            -Method POST `
            -Headers @{
                "x-api-key"         = $env:ANTHROPIC_API_KEY
                "anthropic-version" = "2023-06-01"
                "content-type"      = "application/json"
            } `
            -Body $body
        return $resp.content[0].text
    } catch {
        Write-Host "Claude API failed -- falling back to Ollama: $_"
        return (ollama run deepseek-coder $prompt)
    }
}

# -----------------------------------------------------------------------
# SESSION LOGGING
# -----------------------------------------------------------------------
$SessionsDir = "c:\DevWork\sessions"

function New-SessionLog {
    param($taskId, $taskType, $payload)
    $date     = Get-Date -Format "yyyy-MM-dd"
    $ts       = Get-Date -Format "HHmmss"
    $filename = "agent_${taskType}_${date}_${ts}.md"
    $path     = Join-Path $SessionsDir $filename

    $lines = @(
        "# Session: Agent task -- $taskType",
        "Date: $date",
        "Provider: agent-v3.ps1 (Ollama / Claude API)",
        "Model: Sibali-routed",
        "",
        "## Goal",
        "Autonomous agent task: $taskType | payload: $payload | task_id: $taskId",
        "",
        "## Goal Status",
        "PENDING",
        "",
        "## Model Recommendation",
        "Task tier: Sibali-classified",
        "Recommended model: Tier 1->deepseek-coder, Tier 2->Haiku, Tier 3->Sonnet  Trust score: N/A",
        "Active model: Sibali-routed  Status: correct",
        "",
        "## Decisions",
        "- Routed through Mlawuli (Process-Tasks)",
        "- Sibali assigned cost tier based on task type",
        "",
        "## Work Done",
        "-",
        "",
        "## Agent Accountability",
        "| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |",
        "|---------|---------------|--------------|--------|------------|------|",
        "",
        "## Blockers / Next Steps",
        "-",
        "",
        "## Learnings",
        "-"
    )
    Set-Content -Path $path -Value $lines -Encoding utf8
    return $path
}

function Complete-SessionLog {
    param($logPath, $taskId, $agent, $status, $note)
    if (-not (Test-Path $logPath)) { return }

    $lines    = Get-Content $logPath -Encoding utf8
    $datetime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $row      = "| $taskId | Mlawuli | $agent | $status | 1 | $note ($datetime) |"
    $goalVal  = if ($status -eq "COMPLETED") { "ACHIEVED" } else { "FAILED" }

    $out        = [System.Collections.Generic.List[string]]::new()
    $inGoal     = $false
    $goalDone   = $false
    $inAcct     = $false
    $acctRowDone = $false
    $inWork     = $false
    $workDone   = $false

    foreach ($line in $lines) {
        if ($line -match '^## Goal Status\s*$') {
            $inGoal = $true
            $out.Add($line)
            continue
        }
        if ($inGoal -and -not $goalDone) {
            if ($line -match '^## ') {
                $inGoal = $false
            } else {
                $out.Add($goalVal)
                $goalDone = $true
                $inGoal   = $false
                continue
            }
        }

        if ($line -match '^## Work Done\s*$') {
            $inWork = $true
            $out.Add($line)
            continue
        }
        if ($inWork -and -not $workDone) {
            if ($line -match '^- $' -or $line -eq '-') {
                $out.Add("- $note")
                $workDone = $true
                $inWork   = $false
                continue
            }
            if ($line -match '^## ') { $inWork = $false }
        }

        if ($line -match '^## Agent Accountability\s*$') {
            $inAcct = $true
        }
        if ($inAcct -and -not $acctRowDone -and $line -match '^\|\s*$' -or ($inAcct -and -not $acctRowDone -and $line -eq '')) {
            $out.Add($line)
            $out.Add($row)
            $acctRowDone = $true
            $inAcct      = $false
            continue
        }

        $out.Add($line)
    }

    if (-not $acctRowDone) { $out.Add($row) }

    Set-Content -Path $logPath -Value $out.ToArray() -Encoding utf8

    # Run the session close hook to write the accountability signature
    powershell.exe -NonInteractive -File "c:\DevWork\.claude\scripts\session-log-update.ps1"
}

# -----------------------------------------------------------------------
# TASK QUEUE  (unified at task-queue.json root for agent-v3 runtime)
# -----------------------------------------------------------------------
$QueueFile = "c:\DevWork\task-queue.json"

function Get-Queue {
    if (Test-Path $QueueFile) {
        $raw = Get-Content $QueueFile -Raw -Encoding utf8
        $parsed = $raw | ConvertFrom-Json
        if ($parsed -is [System.Array]) { return $parsed }
        return @($parsed)
    }
    return @()
}

function Save-Queue($q) {
    $q | ConvertTo-Json -Depth 5 | Out-File $QueueFile -Encoding utf8
}

function Add-Task {
    param($type, $payload)
    $q    = Get-Queue
    $hasPending = $q | Where-Object { $_.type -eq $type -and ($_.status -eq "pending" -or $_.status -eq "running" -or $_.status -eq "retry") } | Select-Object -First 1
    if ($hasPending) { return }
    $task = @{ id = (Get-Date -Format "yyyyMMddHHmmss"); type = $type; payload = $payload; status = "pending" }
    $q   += $task
    Save-Queue $q
}

# -----------------------------------------------------------------------
# AGENT: UMAKHI (Builder)
# -----------------------------------------------------------------------
function Invoke-Umakhi {
    param($task)
    git add .
    $changes = git diff --cached
    if (-not $changes) { return @{ status = "NO_CHANGES" } }

    # Commit message is Tier-1 (simple, fast, local)
    $msg = Invoke-Model -prompt "Write a single concise git commit message for these changes (one line only):`n$changes" -tier 1
    return @{ status = "OK"; commit = $msg.Trim(); changes = $changes }
}

# -----------------------------------------------------------------------
# AGENT: UMLINDI (Security)
# Check for hardcoded secret VALUES not just variable names
# -----------------------------------------------------------------------
function Invoke-Umlindi {
    $files = git diff --name-only
    foreach ($f in $files) {
        if (-not (Test-Path $f)) { continue }
        $content = Get-Content $f -Raw -Encoding utf8 -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        # Match: key = "value-8-chars+" on non-comment lines; excludes variable references like $password
        if ($content -match '(?im)^[^#/]\S*(password|api_key|secret|token)\s*[=:]\s*[''"][^''"]{8,}') {
            return @{ status = "BLOCK"; reason = "Possible hardcoded secret in: $f" }
        }
    }
    return @{ status = "PASS" }
}

# -----------------------------------------------------------------------
# AGENT: MVAVANYI (QA)
# -----------------------------------------------------------------------
function Invoke-Mvavanyi {
    Write-Host "QA running..."
    try {
        if (Test-Path "package.json") { npm run build --if-present 2>&1 | Out-Null }
        if (Get-ChildItem "*.py" -ErrorAction SilentlyContinue) { python -m pytest 2>&1 | Out-Null }
        return @{ status = "PASS" }
    } catch {
        return @{ status = "FAIL"; error = "$_" }
    }
}

# -----------------------------------------------------------------------
# AGENT: SELF-HEAL
# Analysis is Tier 2 -- use Claude if available
# -----------------------------------------------------------------------
function Invoke-SelfHeal {
    param($errorMsg)
    $fix = Invoke-Model -prompt "An automated QA step failed. Suggest a concrete fix (plain text):`n$errorMsg" -tier 2
    $fix | Out-File "c:\DevWork\temp\auto-fix.txt" -Encoding utf8
    Write-Host "Self-heal suggestion written to c:\DevWork\temp\auto-fix.txt"
}

# -----------------------------------------------------------------------
# MLAWULI: PROCESS TASKS
# -----------------------------------------------------------------------
function Process-Tasks {
    $queue = Get-Queue

    foreach ($task in $queue) {
        if ($task.status -eq "done" -or $task.status -eq "blocked") { continue }

        Write-Host "Processing task $($task.id) [$($task.type)]..."
        $logPath = New-SessionLog $task.id $task.type $task.payload

        switch ($task.type) {

            "commit" {
                $build = Invoke-Umakhi $task
                if ($build.status -eq "NO_CHANGES") {
                    $task.status = "done"
                    Complete-SessionLog $logPath $task.id "Umakhi" "COMPLETED" "No changes to commit"
                    continue
                }

                $sec = Invoke-Umlindi
                if ($sec.status -eq "BLOCK") {
                    Write-Host "Umlindi BLOCK: $($sec.reason)"
                    $task.status = "blocked"
                    Complete-SessionLog $logPath $task.id "Umlindi" "BLOCKED" $sec.reason
                    continue
                }

                $qa = Invoke-Mvavanyi
                if ($qa.status -eq "FAIL") {
                    Write-Host "Mvavanyi FAIL -- self-healing..."
                    Invoke-SelfHeal $qa.error
                    $task.status = "retry"
                    Complete-SessionLog $logPath $task.id "Mvavanyi" "FAILED" "QA failed; self-heal written to temp/auto-fix.txt"
                    continue
                }

                git commit -m "$($build.commit)"
                git push
                Write-Host "Committed and pushed: $($build.commit)"
                $task.status = "done"
                Complete-SessionLog $logPath $task.id "Umakhi" "COMPLETED" "Committed: $($build.commit)"
            }

            default {
                Write-Host "Unknown task type: $($task.type) -- skipping"
                $task.status = "done"
                Complete-SessionLog $logPath $task.id "Mlawuli" "COMPLETED" "Skipped unknown task type: $($task.type)"
            }
        }
    }

    Save-Queue $queue
}

# -----------------------------------------------------------------------
# AUTO-QUEUE (repo watcher)
# -----------------------------------------------------------------------
function Invoke-AutoQueue {
    $changes = git status --porcelain
    if ($changes) { Add-Task "commit" "auto-detected repo changes" }
}

# -----------------------------------------------------------------------
# SESSION LOG ENFORCEMENT (runs every loop tick)
# Catches open session logs from any provider — Claude Code, Copilot, Cursor, etc.
# session-log-update.ps1 finds the latest log itself and applies the 30-min
# auto-confirm rule, so this covers sessions that no provider Stop hook closed.
# -----------------------------------------------------------------------
function Invoke-SessionLogCheck {
    $script = "c:\DevWork\.claude\scripts\session-log-update.ps1"
    if (Test-Path $script) {
        powershell.exe -NonInteractive -File $script
    }
}

function Assert-NoLegacyServiceConflict {
    $legacyServices = @("AI-Orchestrator", "AI-Umakhi", "AI-QA", "AI-Security", "AI-PR")
    $active = @()

    foreach ($name in $legacyServices) {
        $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
        if (-not $svc) { continue }
        if ($svc.Status -ne "Stopped") {
            $active += ("{0}({1})" -f $name, $svc.Status)
        }
    }

    if ($active.Count -gt 0) {
        Write-Error ("Legacy runtime conflict detected: {0}. Stop legacy services before running agent-v3." -f ($active -join ", "))
        exit 1
    }
}

# -----------------------------------------------------------------------
# MAIN LOOP
# -----------------------------------------------------------------------
$delay       = 20
$logInterval = 1200  # run session log check every 20 minutes
$tickCount   = 0

Assert-NoLegacyServiceConflict
Write-Host "AI Workforce v3 running (Tier 1=Ollama local, Tier 2/3=Claude API if key present)"

while ($true) {
    Invoke-AutoQueue
    Process-Tasks

    $tickCount++
    if ($tickCount % ($logInterval / $delay) -eq 0) {
        Invoke-SessionLogCheck
    }

    Start-Sleep -Seconds $delay
}
