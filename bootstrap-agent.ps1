# ==========================================
# AI DEV WORKFORCE BOOTSTRAP (FIXED)
# ==========================================

Write-Host "Bootstrapping AI Dev Environment..."

# -------------------------------
# 1. INSTALL CURSOR
# -------------------------------
try {
    Write-Host "Installing Cursor..."
    $cursorExe = "$env:TEMP\CursorSetup.exe"
    Invoke-WebRequest "https://cursor.sh/api/download?platform=windows" -OutFile $cursorExe
    Start-Process $cursorExe -ArgumentList "/S" -Wait
} catch {
    Write-Host "Cursor install failed. Open https://cursor.sh manually"
}

# -------------------------------
# 2. INSTALL OLLAMA
# -------------------------------
try {
    Write-Host "Installing Ollama..."
    $ollamaExe = "$env:TEMP\OllamaSetup.exe"
    Invoke-WebRequest "https://ollama.com/download/OllamaSetup.exe" -OutFile $ollamaExe
    Start-Process $ollamaExe -ArgumentList "/S" -Wait
} catch {
    Write-Host "Ollama install failed."
}

# -------------------------------
# 3. FIX PATH (SAFE VERSION)
# -------------------------------
$cursorPath = "$env:LOCALAPPDATA\Programs\Cursor\resources\app\bin"
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama"

# Update current session
$env:PATH = "$env:PATH;$cursorPath;$ollamaPath"

# Persist PATH properly
[System.Environment]::SetEnvironmentVariable(
    "PATH",
    [System.Environment]::GetEnvironmentVariable("PATH","User") + ";$cursorPath;$ollamaPath",
    "User"
)

Write-Host "PATH configured"

# -------------------------------
# 4. INSTALL DEEPSEEK
# -------------------------------
try {
    Write-Host "Pulling DeepSeek..."
    & "ollama" "pull" "deepseek-coder"
} catch {
    Write-Host "Run manually later: ollama pull deepseek-coder"
}

# -------------------------------
# 5. LOGGING
# -------------------------------
function Write-Log {
    param($msg)
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path "agent-log.txt" -Value "[$time] $msg"
}

# -------------------------------
# 6. BUILDER
# -------------------------------
function Invoke-Umakhi {

    git add .
    $changes = git diff --cached

    if (-not $changes) {
        return @{ status = "NO_CHANGES" }
    }

    $commit = ollama run deepseek-coder "Write a short git commit message:`n$changes"

    return @{
        status = "OK"
        commit = $commit
    }
}

# -------------------------------
# 7. QA
# -------------------------------
function Invoke-Mvavanyi {

    Write-Host "Running QA..."

    if (Test-Path "package.json") {
        try {
            npm run build | Out-Null
        } catch {
            return @{ status = "FAIL"; error = $_ }
        }
    }

    if (Get-ChildItem -Filter "*.py" -ErrorAction SilentlyContinue) {
        try {
            python -m pytest | Out-Null
        } catch {
            return @{ status = "FAIL"; error = $_ }
        }
    }

    return @{ status = "PASS" }
}

# -------------------------------
# 8. SECURITY
# -------------------------------
function Invoke-Umlindi {

    Write-Host "Security check..."

    $files = git diff --name-only

    foreach ($f in $files) {
        if (Test-Path $f) {
            $c = Get-Content $f -Raw

            if ($c -match "password\s*=" -or
                $c -match "api_key" -or
                $c -match "secret") {

                return @{ status = "BLOCK"; reason = "$f contains secrets" }
            }
        }
    }

    return @{ status = "PASS" }
}

# -------------------------------
# 9. SELF HEAL
# -------------------------------
function Invoke-SelfHeal {
    param($err)

    Write-Host "Attempting fix..."

    $fix = ollama run deepseek-coder "Fix this error:`n$err"

    $fix | Out-File "auto-fix.txt"
}

# -------------------------------
# 10. ORCHESTRATOR
# -------------------------------
function Invoke-Mlawuli {

    Write-Host "Running agent cycle..."
    Write-Log "Cycle start"

    $build = Invoke-Umakhi

    if ($build.status -eq "NO_CHANGES") {
        Write-Host "No changes"
        return
    }

    $sec = Invoke-Umlindi
    if ($sec.status -eq "BLOCK") {
        Write-Host "Blocked: $($sec.reason)"
        Write-Log "Security blocked"
        return
    }

    $qa = Invoke-Mvavanyi
    if ($qa.status -ne "PASS") {
        Write-Host "QA failed"
        Invoke-SelfHeal $qa.error
        return
    }

    git commit -m "$($build.commit)"
    git push

    Write-Host "Commit pushed"
    Write-Log "Success"
}

# -------------------------------
# 11. LOOP
# -------------------------------
$runLoop = $true
$delay = 20

if ($runLoop) {
    Write-Host "Agent running..."

    while ($true) {
        Invoke-Mlawuli
        Start-Sleep -Seconds $delay
    }
}
else {
    Invoke-Mlawuli
}