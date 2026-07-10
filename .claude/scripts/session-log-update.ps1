param(
    [Parameter(Mandatory = $true)]
    [string]$LogPath
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path -LiteralPath 'C:\DevWork').Path
$resolvedLog = (Resolve-Path -LiteralPath $LogPath).Path
if (-not $resolvedLog.StartsWith($workspaceRoot + '\', [System.StringComparison]::OrdinalIgnoreCase) -or (Split-Path (Split-Path $resolvedLog -Parent) -Leaf) -ne 'sessions') {
    throw "Session log must be inside a project-local sessions directory under $workspaceRoot"
}

$AUTO_CONFIRM_HOURS = 0.5
$logFile = $resolvedLog
$logItem = Get-Item -LiteralPath $logFile
$rawLines = Get-Content -LiteralPath $logFile -Encoding utf8
$content = $rawLines -join "`n"
$datetime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

function Sync-IndexAndMirror {
    param([string]$ExactLogPath)
    $indexScript = Join-Path $workspaceRoot 'scripts\governance\update-workspace-index.ps1'
    if (Test-Path -LiteralPath $indexScript) {
        $result = & $indexScript -WorkspaceRoot $workspaceRoot -SessionLogPath $ExactLogPath | Select-Object -Last 1 | ConvertFrom-Json
        $raw = Get-Content -LiteralPath $ExactLogPath -Raw -Encoding utf8
        if ($raw -notmatch '(?m)^_Workspace index:') {
            Add-Content -LiteralPath $ExactLogPath -Value "`r`n_Workspace index: $($result.status) - $($result.workspace_index)_" -Encoding utf8
        }
    }
    $sessionsDirectory = Split-Path $ExactLogPath -Parent
    $projectRoot = Split-Path $sessionsDirectory -Parent
    $projectSlug = if ($projectRoot.Equals($workspaceRoot, [StringComparison]::OrdinalIgnoreCase)) { '' } else { ((Split-Path $projectRoot -Leaf).ToLowerInvariant() -replace '[^a-z0-9_-]', '_') }
    $mirrorRoot = 'G:\My Drive\JS\Agentic AI\sessions'
    $mirrorDirectory = if ([string]::IsNullOrWhiteSpace($projectSlug)) { $mirrorRoot } else { Join-Path $mirrorRoot $projectSlug }
    if (Test-Path -LiteralPath $mirrorRoot) {
        New-Item -ItemType Directory -Path $mirrorDirectory -Force | Out-Null
        Copy-Item -LiteralPath $ExactLogPath -Destination (Join-Path $mirrorDirectory ((Split-Path $ExactLogPath -Leaf) + '.tbl.bk')) -Force
    }
}

function Test-SectionFilled {
    param([string[]]$Lines, [string]$Heading)
    $inSection = $false
    foreach ($line in $Lines) {
        if ($line -match ('^## ' + [regex]::Escape($Heading) + '\s*$')) { $inSection = $true; continue }
        if ($inSection) {
            if ($line -match '^## ') { break }
            $value = $line.Trim()
            if ($value -eq '' -or $value -eq '-' -or $value -match '(?i)pending|replace this|<[^>]+>') { continue }
            if ($value -match '^\|\s*(Task ID|[-\s|]+)\s*\|') { continue }
            return $true
        }
    }
    return $false
}

function Get-SectionValue {
    param([string[]]$Lines, [string]$Heading)
    $inSection = $false
    foreach ($line in $Lines) {
        if ($line -match ('^## ' + [regex]::Escape($Heading) + '\s*$')) { $inSection = $true; continue }
        if ($inSection) {
            if ($line -match '^## ') { break }
            $value = $line.Trim()
            if ($value -ne '') { return $value }
        }
    }
    return ''
}

$goalStatus = Get-SectionValue $rawLines 'Goal Status'
$decisionsOk = Test-SectionFilled $rawLines 'Decisions'
$workDoneOk = Test-SectionFilled $rawLines 'Work Done'
$learningsOk = Test-SectionFilled $rawLines 'Learnings'
$modelOk = Test-SectionFilled $rawLines 'Model Recommendation'
$hoursSinceWrite = (New-TimeSpan -Start $logItem.LastWriteTime -End (Get-Date)).TotalHours
$userConfirmed = $goalStatus -eq 'ACHIEVED'
$autoConfirm = (-not $userConfirmed) -and $hoursSinceWrite -ge $AUTO_CONFIRM_HOURS -and $decisionsOk -and $workDoneOk -and $learningsOk -and $modelOk
$shouldSign = $userConfirmed -or $autoConfirm

if ($content -match '(?m)^> Completed by:') {
    Sync-IndexAndMirror $logFile
    Write-Output "[session-log] Already signed: $logFile"
    exit 0
}

if (-not $shouldSign) {
    $missing = @()
    if (-not $modelOk) { $missing += 'Model Recommendation' }
    if (-not $decisionsOk) { $missing += 'Decisions' }
    if (-not $workDoneOk) { $missing += 'Work Done' }
    if (-not $learningsOk) { $missing += 'Learnings' }
    if ($goalStatus -eq 'PENDING') { $missing += 'Goal Status PENDING' }
    Write-Output ('[session-log] Not signed. Incomplete: ' + ($missing -join ', '))
    exit 0
}

$providerLine = @($rawLines | Where-Object { $_ -match '^Provider:\s*' } | Select-Object -First 1)
$provider = if ($providerLine.Count -gt 0) { ($providerLine[0] -replace '^Provider:\s*', '').Trim() } else { 'Unknown provider' }
$completed = [regex]::Match($content, '(?mi)^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*COMPLETED(?:\s*\[AUTOMATED\])?\s*\|')
if ($completed.Success) {
    $taskId = $completed.Groups[1].Value.Trim()
    $completedBy = $completed.Groups[3].Value.Trim()
} else {
    $taskId = [IO.Path]::GetFileNameWithoutExtension($logFile)
    $completedBy = "$provider (Mlawuli)"
}

if ($autoConfirm) {
    $status = 'COMPLETED [AUTOMATED]'
    $confirmation = "AUTOMATED -- no user confirmation after $([Math]::Round($hoursSinceWrite, 1))h"
} else {
    $status = 'COMPLETED'
    $confirmation = 'User confirmed ACHIEVED'
}

$signature = "> Completed by: $completedBy  |  Task: $taskId  |  Status: $status  |  Confirmed: $confirmation  |  $datetime"
Add-Content -LiteralPath $logFile -Value "`r`n$signature`r`n_Session ended: $datetime ($provider)_" -Encoding utf8

Sync-IndexAndMirror $logFile

Write-Output "[session-log] Signed exact log: $logFile"
