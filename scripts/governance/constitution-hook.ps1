param(
    [ValidateSet('SessionStart', 'UserPromptSubmit', 'PreChange', 'PostChange', 'Stop', 'SessionEnd', 'PreInvocation')]
    [string]$Event = 'UserPromptSubmit',
    [string]$Provider = 'Unknown',
    [string]$Model = 'Unknown',
    [string]$WorkspaceRoot = 'C:\DevWork',
    [string]$MemoryPath = 'C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\MEMORY.md'
)

$ErrorActionPreference = 'Stop'

function Get-SafeName {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return 'unknown' }
    return (($Value.ToLowerInvariant() -replace '[^a-z0-9_-]', '_').Trim('_'))
}

function Get-HookInput {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    try { return ($raw | ConvertFrom-Json) } catch { return $null }
}

function Get-InputValue {
    param($InputObject, [string[]]$Names)
    if ($null -eq $InputObject) { return $null }
    foreach ($name in $Names) {
        $property = $InputObject.PSObject.Properties[$name]
        if ($null -ne $property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
            return [string]$property.Value
        }
    }
    return $null
}

function Test-RequiredSections {
    param([string]$Content)
    $required = @('Goal', 'Model Recommendation', 'Decisions', 'Work Done', 'Agent Accountability', 'Blockers / Next Steps', 'Learnings', 'Goal Status')
    $missing = @()
    foreach ($heading in $required) {
        if ($Content -notmatch ('(?m)^## ' + [regex]::Escape($heading) + '\s*$')) { $missing += $heading }
    }
    return $missing
}

function Get-SectionBody {
    param([string]$Content, [string]$Heading)
    $pattern = '(?ms)^## ' + [regex]::Escape($Heading) + '\s*\r?\n(.*?)(?=^## |\z)'
    if ($Content -match $pattern) { return $Matches[1].Trim() }
    return ''
}

function Test-SectionFilled {
    param([string]$Content, [string]$Heading)
    $body = Get-SectionBody $Content $Heading
    if ([string]::IsNullOrWhiteSpace($body)) { return $false }
    if ($body -match '(?i)pending first-prompt|pending reflect|replace this sentence|pending completion|add goal here|<[^>]+>') { return $false }
    $meaningful = @($body -split '\r?\n' | Where-Object {
        $line = $_.Trim()
        $line -ne '' -and $line -ne '-' -and $line -notmatch '^<!--' -and $line -notmatch '^\|[-\s|]+\|$' -and $line -notmatch '^\|\s*Task ID\s*\|'
    })
    return $meaningful.Count -gt 0
}

function Copy-SessionMirror {
    param([string]$LogPath)
    $projectRoot = Split-Path (Split-Path $LogPath -Parent) -Parent
    $projectSlug = Get-SafeName (Split-Path $projectRoot -Leaf)
    $mirrorRoot = 'G:\My Drive\JS\Agentic AI\sessions'
    $mirrorDir = Join-Path $mirrorRoot $projectSlug
    if (Test-Path -LiteralPath $mirrorRoot) {
        New-Item -ItemType Directory -Path $mirrorDir -Force | Out-Null
        $destination = Join-Path $mirrorDir ((Split-Path $LogPath -Leaf) + '.tbl.bk')
        try {
            Copy-Item -LiteralPath $LogPath -Destination $destination -Force
        } catch {
            Write-Warning "Session mirror unavailable: $($_.Exception.Message)"
        }
    }
}

function Resolve-ProjectRoot {
    param([string]$WorkingDirectory)
    $workspace = [IO.Path]::GetFullPath($WorkspaceRoot).TrimEnd('\')
    if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) { return (Join-Path $workspace '_workspace') }
    try { $candidate = [IO.Path]::GetFullPath($WorkingDirectory) } catch { return (Join-Path $workspace '_workspace') }
    if (-not $candidate.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) { return (Join-Path $workspace '_workspace') }
    $relative = $candidate.Substring($workspace.Length).TrimStart('\')
    if ([string]::IsNullOrWhiteSpace($relative)) { return (Join-Path $workspace '_workspace') }
    $first = ($relative -split '\\')[0]
    $root = Join-Path $workspace $first
    $controlPlane = @('.agents', '.claude', '.codex', '.cursor', '.factory', '.git', '.github', '.gstack', '.kiro', '.memory', '.pnpm-store', '.venv', '.vscode', '_backups', '_workspace', 'agents', 'chatsessions', 'design', 'docs', 'logs', 'mysql-data', 'queue', 'scripts', 'sessions', 'temp', 'updates')
    if ($controlPlane -contains $first.ToLowerInvariant()) { return (Join-Path $workspace '_workspace') }
    foreach ($signal in @('.git', 'AGENTS.md', 'CLAUDE.md', 'package.json', 'pyproject.toml', 'composer.json', 'README.md')) {
        if (Test-Path -LiteralPath (Join-Path $root $signal)) { return $root }
    }
    return (Join-Path $workspace '_workspace')
}

$inputObject = Get-HookInput
$nativeEvent = Get-InputValue $inputObject @('hook_event_name', 'eventName', 'event_name')
if (-not [string]::IsNullOrWhiteSpace($nativeEvent)) {
    switch -Regex ($nativeEvent) {
        '^(sessionStart|SessionStart|agentSpawn)$' { $Event = 'SessionStart' }
        '^(userPromptSubmitted|userPromptSubmit|UserPromptSubmit|beforeSubmitPrompt)$' { $Event = 'UserPromptSubmit' }
        '^(PreInvocation|preInvocation)$' { $Event = 'PreInvocation' }
        '^(sessionEnd|SessionEnd)$' { $Event = 'SessionEnd' }
        '^(stop|Stop|agentStop)$' { $Event = 'Stop' }
    }
}

$nativeSessionId = Get-InputValue $inputObject @('session_id', 'sessionId', 'conversation_id', 'conversationId')
if ([string]::IsNullOrWhiteSpace($nativeSessionId)) { $nativeSessionId = $env:AGENT_SESSION_ID }
if ([string]::IsNullOrWhiteSpace($nativeSessionId)) {
    $transcriptPath = Get-InputValue $inputObject @('transcript_path', 'transcriptPath')
    if (-not [string]::IsNullOrWhiteSpace($transcriptPath)) { $nativeSessionId = $transcriptPath }
}
if ([string]::IsNullOrWhiteSpace($nativeSessionId)) {
    if ($Event -eq 'SessionStart' -or $Event -eq 'PreInvocation') {
        $nativeSessionId = 'generated-' + [guid]::NewGuid().ToString('N')
    } else {
        Write-Error 'No native session ID or transcript path was supplied; refusing to guess the active session log.'
        exit 1
    }
}

$nativeModel = Get-InputValue $inputObject @('model', 'model_name')
if (-not [string]::IsNullOrWhiteSpace($nativeModel)) { $Model = $nativeModel }

$constitutionPath = Join-Path $WorkspaceRoot 'CLAUDE.md'
$memoryPath = $MemoryPath
if (-not (Test-Path -LiteralPath $memoryPath)) {
    $repoMemory = Join-Path $WorkspaceRoot 'memory\MEMORY.md'
    if (Test-Path -LiteralPath $repoMemory) { $memoryPath = $repoMemory }
}
$workingDirectory = Get-InputValue $inputObject @('cwd', 'working_directory', 'workingDirectory')
$projectRoot = Resolve-ProjectRoot $workingDirectory
$projectSlug = if ((Split-Path $projectRoot -Leaf) -eq '_workspace') { '_workspace' } else { Get-SafeName (Split-Path $projectRoot -Leaf) }
$sessionsDir = Join-Path $projectRoot 'sessions'
$stateDir = Join-Path $WorkspaceRoot '_workspace\temp\constitution-hooks'

if (-not (Test-Path -LiteralPath $constitutionPath)) { throw "Constitution missing: $constitutionPath" }
if (-not (Test-Path -LiteralPath $memoryPath)) { throw "Memory index missing: $memoryPath" }
New-Item -ItemType Directory -Path $sessionsDir -Force | Out-Null
New-Item -ItemType Directory -Path $stateDir -Force | Out-Null

$providerSlug = Get-SafeName $Provider
$sessionSlug = Get-SafeName $nativeSessionId
$statePath = Join-Path $stateDir ($providerSlug + '_' + $sessionSlug + '.json')
$state = $null
if (Test-Path -LiteralPath $statePath) {
    try { $state = Get-Content -LiteralPath $statePath -Raw -Encoding utf8 | ConvertFrom-Json }
    catch { throw "Corrupt constitution hook state: $statePath" }
}
if ($null -eq $state) {
    $legacyStatePath = Join-Path (Join-Path $WorkspaceRoot 'temp\constitution-hooks') ($providerSlug + '_' + $sessionSlug + '.json')
    if (Test-Path -LiteralPath $legacyStatePath) {
        try { $state = Get-Content -LiteralPath $legacyStatePath -Raw -Encoding utf8 | ConvertFrom-Json }
        catch { throw "Corrupt legacy constitution hook state: $legacyStatePath" }
    }
}

if ($null -eq $state -and ($Event -eq 'Stop' -or $Event -eq 'SessionEnd' -or $Event -eq 'PreChange' -or $Event -eq 'PostChange')) {
    Write-Error "No state mapping exists for $Provider session $nativeSessionId; refusing to create a session from $Event."
    exit 1
}

if ($null -eq $state) {
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $sessionFragment = $sessionSlug.Substring(0, [Math]::Min(12, $sessionSlug.Length))
    $logPath = Join-Path $sessionsDir ('agent_session_' + $providerSlug + '_' + $sessionFragment + '_' + $stamp + '.md')
    $initialGoal = 'Initialize a constitution-compliant agent session; replace this sentence with the concrete user goal on the first prompt before substantive work.'
    $log = @"
# Session: Constitution-enforced $Provider session
Date: $(Get-Date -Format 'yyyy-MM-dd')
Provider: $Provider
Model: $Model
Project: $projectSlug
Project Root: $projectRoot

## Goal
$initialGoal

## Model Recommendation
Pending first-prompt Sibali classification; the agent must fill this before substantive work.

## Decisions
- Session created automatically by the SessionStart enforcement hook.

## Work Done
- Constitution, memory index, and session-log schema verified at session start.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|

## Blockers / Next Steps
- First response must classify the request through Sibali, route it through Mlawuli, and replace the Goal placeholder.

## Learnings
- Pending Reflect phase.

## Goal Status
PENDING
"@
    Set-Content -LiteralPath $logPath -Value $log -Encoding utf8
    $state = [pscustomobject]@{
        provider = $Provider
        session_id = $nativeSessionId
        log_path = $logPath
        prompt_count = 0
        created_at = (Get-Date).ToString('o')
        updated_at = (Get-Date).ToString('o')
    }
}

$logPath = [string]$state.log_path
if (-not (Test-Path -LiteralPath $logPath)) { throw "Mapped session log missing: $logPath" }

if ($Event -eq 'UserPromptSubmit' -or $Event -eq 'PreInvocation') {
    $state.prompt_count = [int]$state.prompt_count + 1
}
$state.updated_at = (Get-Date).ToString('o')
$stateTemp = $statePath + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
$state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $stateTemp -Encoding utf8
Move-Item -LiteralPath $stateTemp -Destination $statePath -Force

$content = Get-Content -LiteralPath $logPath -Raw -Encoding utf8
$missingSections = @(Test-RequiredSections $content)
if ($missingSections.Count -gt 0) { throw ('Session log is missing mandatory sections: ' + ($missingSections -join ', ')) }

if ($Event -eq 'PreChange') {
    $toolInput = if ($null -ne $inputObject) { $inputObject.PSObject.Properties['tool_input'].Value } else { $null }
    $targetPath = Get-InputValue $toolInput @('file_path', 'filePath', 'path')
    if (-not [string]::IsNullOrWhiteSpace($targetPath)) {
        try {
            $candidate = [IO.Path]::GetFullPath((Join-Path ([string](Get-InputValue $inputObject @('cwd'))) $targetPath))
            if ([IO.Path]::IsPathRooted($targetPath)) { $candidate = [IO.Path]::GetFullPath($targetPath) }
            if ($candidate.Equals([IO.Path]::GetFullPath($logPath), [StringComparison]::OrdinalIgnoreCase)) { exit 0 }
        } catch { $candidate = $null }
    }
    $preflightMissing = @()
    foreach ($heading in @('Goal', 'Model Recommendation')) {
        if (-not (Test-SectionFilled $content $heading)) { $preflightMissing += $heading }
    }
    if ($preflightMissing.Count -gt 0) {
        [Console]::Error.WriteLine('Constitution preflight incomplete before mutation: ' + ($preflightMissing -join ', '))
        exit 2
    }
    if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        $targetDirectory = Split-Path $candidate -Parent
        $backupDirectory = Join-Path $targetDirectory '_backups'
        $baseName = [IO.Path]::GetFileNameWithoutExtension($candidate)
        $extension = [IO.Path]::GetExtension($candidate)
        $backupPattern = $baseName + '_backup_*' + $extension
        $backup = Get-ChildItem -LiteralPath $backupDirectory -Filter $backupPattern -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $targetItem = Get-Item -LiteralPath $candidate
        if ($null -eq $backup -or $backup.LastWriteTime -lt $targetItem.LastWriteTime) {
            [Console]::Error.WriteLine("Current timestamped backup required before modifying existing file: $candidate")
            exit 2
        }
    }
}

if ($Event -eq 'Stop') {
    $stopAlreadyActive = Get-InputValue $inputObject @('stop_hook_active', 'stopHookActive')
    $incomplete = @()
    foreach ($heading in @('Goal', 'Model Recommendation', 'Decisions', 'Work Done', 'Learnings')) {
        if (-not (Test-SectionFilled $content $heading)) { $incomplete += $heading }
    }
    if ($content -notmatch '(?mi)^\|[^\r\n]*\|\s*(COMPLETED|FAILED)\s*\|') { $incomplete += 'Agent Accountability result row' }
    if ($incomplete.Count -gt 0 -and $stopAlreadyActive -notmatch '^(?i:true|1)$') {
        $reason = 'Constitution gate: update the exact session log before stopping. Incomplete: ' + ($incomplete -join ', ') + '. Log: ' + $logPath
        @{ decision = 'block'; reason = $reason } | ConvertTo-Json -Compress | Write-Output
        exit 0
    }
}

$isClosingEvent = ($Event -eq 'SessionEnd' -or ($Event -eq 'Stop' -and $content -match '(?m)^## Goal Status\s*\r?\nACHIEVED\s*$'))
$indexFailure = $null
if ($isClosingEvent) {
    $alreadyEnded = $content -match '(?m)^_Session ended:'
    $signingIncomplete = @()
    foreach ($heading in @('Goal', 'Model Recommendation', 'Decisions', 'Work Done', 'Learnings')) {
        if (-not (Test-SectionFilled $content $heading)) { $signingIncomplete += $heading }
    }
    $completedMatch = [regex]::Match($content, '(?mi)^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*COMPLETED\s*\|')
    if (-not $completedMatch.Success) { $signingIncomplete += 'completed accountability row' }
    if ($content -match '(?m)^## Goal Status\s*\r?\nACHIEVED\s*$' -and $content -notmatch '(?m)^> Completed by:' -and $signingIncomplete.Count -eq 0) {
        $taskId = $completedMatch.Groups[1].Value.Trim()
        $completedBy = $completedMatch.Groups[3].Value.Trim()
        Add-Content -LiteralPath $logPath -Value "`r`n> Completed by: $completedBy  |  Task: $taskId  |  Status: COMPLETED  |  Confirmed: User confirmed ACHIEVED  |  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Encoding utf8
    } elseif ($signingIncomplete.Count -gt 0 -and -not $alreadyEnded) {
        Add-Content -LiteralPath $logPath -Value "`r`n## Warning: Session End Validation`r`nIncomplete: $($signingIncomplete -join ', '). No signature written." -Encoding utf8
    }
    if (-not $alreadyEnded) {
        Add-Content -LiteralPath $logPath -Value "`r`n_Session ended: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ($Provider / $Model)_" -Encoding utf8
    }

    $indexScript = Join-Path $WorkspaceRoot 'scripts\governance\update-workspace-index.ps1'
    try {
        if (-not (Test-Path -LiteralPath $indexScript)) { throw "Workspace index updater missing: $indexScript" }
        $indexOutput = & $indexScript -WorkspaceRoot $WorkspaceRoot -SessionLogPath $logPath | Select-Object -Last 1
        $indexResult = $indexOutput | ConvertFrom-Json
        if ($content -notmatch '(?m)^_Workspace index:') {
            Add-Content -LiteralPath $logPath -Value "`r`n_Workspace index: $($indexResult.status) - $($indexResult.workspace_index)_" -Encoding utf8
        }
    } catch {
        $indexFailure = $_.Exception.Message
        Add-Content -LiteralPath $logPath -Value "`r`n_Workspace index: FAILED - $indexFailure" -Encoding utf8
    }
}

if ($Event -eq 'SessionStart' -or $Event -eq 'PreInvocation' -or $Event -eq 'PostChange' -or $Event -eq 'Stop' -or $Event -eq 'SessionEnd') {
    Copy-SessionMirror $logPath
}

if ($indexFailure) { throw $indexFailure }

$relativeLog = $logPath.Substring($WorkspaceRoot.Length).TrimStart('\')
if ($Event -eq 'SessionStart' -or $Event -eq 'UserPromptSubmit' -or $Event -eq 'PreInvocation') {
    Write-Output "[constitution-hook] ACTIVE. Exact log: $relativeLog. Before substantive work: read CLAUDE.md and MEMORY.md; replace the Goal placeholder; run Sibali tier/model clearance; route through Mlawuli; record task IDs and accountability; back up existing files before edits; update Decisions, Work Done, Blockers, and Learnings; keep Goal Status PENDING until explicit user confirmation. This reminder applies to this prompt."
} elseif ($Event -eq 'PostChange') {
    Write-Output "[constitution-hook] Change recorded. Update Work Done and verify the timestamped backup for every modified existing file. Exact log: $relativeLog."
}

exit 0
