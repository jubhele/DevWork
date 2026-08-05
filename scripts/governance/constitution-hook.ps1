param(
    [ValidateSet('SessionStart', 'UserPromptSubmit', 'ProjectBind', 'ProjectCreate', 'PreChange', 'PostChange', 'Stop', 'SessionEnd', 'PreInvocation')]
    [string]$HookEvent = 'UserPromptSubmit',
    [string]$Provider = 'Unknown',
    [string]$Model = 'Unknown',
    [string]$WorkspaceRoot = 'C:\DevWork',
    [string]$MemoryPath = 'C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\MEMORY.md',
    [string]$SessionId = '',
    [string]$RequestedProjectRoot = '',
    [string]$ProjectName = ''
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
    $required = @('Project Determination', 'Goal', 'Model Recommendation', 'Decisions', 'Work Done', 'Agent Accountability', 'Blockers / Next Steps', 'Learnings', 'Goal Status')
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

function Get-RegisteredProjectRoot {
    param([string]$Candidate, [string]$Workspace)
    $registryPath = Join-Path (Join-Path $Workspace '_workspace') 'project-registry.json'
    if (-not (Test-Path -LiteralPath $registryPath)) { return $null }
    try {
        $registry = Get-Content -LiteralPath $registryPath -Raw -Encoding utf8 | ConvertFrom-Json
    } catch {
        return $null
    }
    foreach ($project in $registry.projects) {
        $registeredRoot = [string]$project.root
        if ([string]::IsNullOrWhiteSpace($registeredRoot)) { continue }
        $normalizedRoot = $registeredRoot.TrimEnd('\')
        if ($Candidate.Equals($normalizedRoot, [StringComparison]::OrdinalIgnoreCase) -or
            $Candidate.StartsWith($normalizedRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
            return $normalizedRoot
        }
    }
    return $null
}

function Resolve-ProjectRoot {
    param([string]$WorkingDirectory)
    $workspace = [IO.Path]::GetFullPath($WorkspaceRoot).TrimEnd('\')
    if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) { return [pscustomobject]@{ status = 'unresolved'; root = (Join-Path $workspace '_workspace'); source = 'missing_cwd' } }
    try { $candidate = [IO.Path]::GetFullPath($WorkingDirectory) } catch { return [pscustomobject]@{ status = 'unresolved'; root = (Join-Path $workspace '_workspace'); source = 'invalid_cwd' } }
    if (-not $candidate.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) {
        $registeredRoot = Get-RegisteredProjectRoot -Candidate $candidate -Workspace $workspace
        if ($null -ne $registeredRoot) { return [pscustomobject]@{ status = 'resolved'; root = $registeredRoot; source = 'registry_project_signal' } }
        return [pscustomobject]@{ status = 'unresolved'; root = (Join-Path $workspace '_workspace'); source = 'outside_workspace' }
    }
    $relative = $candidate.Substring($workspace.Length).TrimStart('\')
    if ([string]::IsNullOrWhiteSpace($relative)) { return [pscustomobject]@{ status = 'unresolved'; root = (Join-Path $workspace '_workspace'); source = 'workspace_root' } }
    $first = ($relative -split '\\')[0]
    $root = Join-Path $workspace $first
    $controlPlane = @('.agents', '.claude', '.codex', '.cursor', '.factory', '.git', '.github', '.gstack', '.kiro', '.memory', '.pnpm-store', '.venv', '.vscode', '_backups', '_workspace', 'agents', 'chatsessions', 'design', 'docs', 'logs', 'mysql-data', 'queue', 'scripts', 'sessions', 'temp', 'updates')
    if ($controlPlane -contains $first.ToLowerInvariant()) { return [pscustomobject]@{ status = 'unresolved'; root = (Join-Path $workspace '_workspace'); source = 'control_plane_cwd' } }
    foreach ($signal in @('.git', 'AGENTS.md', 'CLAUDE.md', 'package.json', 'pyproject.toml', 'composer.json', 'README.md')) {
        if (Test-Path -LiteralPath (Join-Path $root $signal)) { return [pscustomobject]@{ status = 'resolved'; root = $root; source = 'cwd_project_signal' } }
    }
    return [pscustomobject]@{ status = 'unresolved'; root = (Join-Path $workspace '_workspace'); source = 'no_project_signal' }
}

$inputObject = Get-HookInput
$nativeEvent = Get-InputValue $inputObject @('hook_event_name', 'eventName', 'event_name')
if (-not [string]::IsNullOrWhiteSpace($nativeEvent)) {
    switch -Regex ($nativeEvent) {
        '^(sessionStart|SessionStart|agentSpawn)$' { $HookEvent = 'SessionStart' }
        '^(userPromptSubmitted|userPromptSubmit|UserPromptSubmit|beforeSubmitPrompt)$' { $HookEvent = 'UserPromptSubmit' }
        '^(PreInvocation|preInvocation)$' { $HookEvent = 'PreInvocation' }
        '^(sessionEnd|SessionEnd)$' { $HookEvent = 'SessionEnd' }
        '^(stop|Stop|agentStop)$' { $HookEvent = 'Stop' }
    }
}

$nativeSessionId = if (-not [string]::IsNullOrWhiteSpace($SessionId)) { $SessionId } else { Get-InputValue $inputObject @('session_id', 'sessionId', 'conversation_id', 'conversationId') }
if ([string]::IsNullOrWhiteSpace($nativeSessionId)) { $nativeSessionId = $env:AGENT_SESSION_ID }
if ([string]::IsNullOrWhiteSpace($nativeSessionId)) {
    $transcriptPath = Get-InputValue $inputObject @('transcript_path', 'transcriptPath')
    if (-not [string]::IsNullOrWhiteSpace($transcriptPath)) { $nativeSessionId = $transcriptPath }
}
if ([string]::IsNullOrWhiteSpace($nativeSessionId)) {
    Write-Error 'No stable session ID or transcript path was supplied. Configure the provider adapter or pass -SessionId; refusing to create an uncorrelatable session.'
    exit 1
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
$projectResolution = Resolve-ProjectRoot $workingDirectory
$cwdProjectRoot = if ($projectResolution.status -eq 'resolved') { [string]$projectResolution.root } else { '' }
$projectRoot = [string]$projectResolution.root
$projectStatus = [string]$projectResolution.status
$projectSource = [string]$projectResolution.source
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
$mutexBytes = [Text.Encoding]::UTF8.GetBytes($statePath.ToLowerInvariant())
$mutexHash = ([Security.Cryptography.SHA256]::Create().ComputeHash($mutexBytes) | ForEach-Object { $_.ToString('x2') }) -join ''
$stateMutex = New-Object Threading.Mutex($false, ('Global\DevWorkConstitution_' + $mutexHash.Substring(0, 24)))
try {
    $mutexAcquired = $stateMutex.WaitOne([TimeSpan]::FromSeconds(15))
    if (-not $mutexAcquired) { throw "Timed out waiting for session-state lock: $statePath" }
} catch [Threading.AbandonedMutexException] {
    $mutexAcquired = $true
}
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

if ($null -ne $state -and $state.PSObject.Properties['project_status'] -and $state.project_status -eq 'resolved') {
    $projectStatus = 'resolved'
    $projectRoot = [string]$state.project_root
    $projectSource = [string]$state.project_source
    $projectSlug = Get-SafeName ([string]$state.project_name)
    $sessionsDir = Join-Path $projectRoot 'sessions'
}
$projectDrift = -not [string]::IsNullOrWhiteSpace($cwdProjectRoot) -and $projectStatus -eq 'resolved' -and -not $cwdProjectRoot.Equals($projectRoot, [StringComparison]::OrdinalIgnoreCase)

if ($null -eq $state -and ($HookEvent -eq 'Stop' -or $HookEvent -eq 'SessionEnd' -or $HookEvent -eq 'PreChange' -or $HookEvent -eq 'PostChange')) {
    Write-Error "No state mapping exists for $Provider session $nativeSessionId; refusing to create a session from $HookEvent."
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
Project: $(if ($projectStatus -eq 'resolved') { $projectSlug } else { 'UNRESOLVED' })
Project Root: $(if ($projectStatus -eq 'resolved') { $projectRoot } else { 'UNRESOLVED' })

## Project Determination
Status: $projectStatus
Source: $projectSource

## Goal
$initialGoal

## Model Recommendation
Pending first-prompt uSibali classification; the agent must fill this before substantive work.

## Decisions
- Session created automatically by the SessionStart enforcement hook.

## Work Done
- Constitution, memory index, and session-log schema verified at session start.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|

## Blockers / Next Steps
- First response must classify the request through uSibali, route it through uMlawuli, and replace the Goal placeholder.

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
        project_status = $projectStatus
        project_name = if ($projectStatus -eq 'resolved') { Split-Path $projectRoot -Leaf } else { 'UNRESOLVED' }
        project_root = if ($projectStatus -eq 'resolved') { $projectRoot } else { '' }
        project_source = $projectSource
        binding_version = 1
        binding_updated_at = ''
        prompt_count = 0
        created_at = (Get-Date).ToString('o')
        updated_at = (Get-Date).ToString('o')
    }
}

if ($HookEvent -eq 'ProjectCreate') {
    if ([string]::IsNullOrWhiteSpace($ProjectName)) { throw 'ProjectCreate requires -ProjectName.' }
    $initializer = Join-Path $WorkspaceRoot 'scripts\governance\initialize-project.ps1'
    $created = & $initializer -ProjectName $ProjectName -WorkspaceRoot $WorkspaceRoot | Select-Object -Last 1 | ConvertFrom-Json
    $RequestedProjectRoot = [string]$created.project_root
    $HookEvent = 'ProjectBind'
}

if ($HookEvent -eq 'ProjectBind') {
    if ([string]::IsNullOrWhiteSpace($RequestedProjectRoot)) { throw 'ProjectBind requires -RequestedProjectRoot.' }
    $bindingRoot = [IO.Path]::GetFullPath($RequestedProjectRoot).TrimEnd('\')
    $workspace = [IO.Path]::GetFullPath($WorkspaceRoot).TrimEnd('\')
    $workspaceControl = Join-Path $workspace '_workspace'
    $isControlPlane = $bindingRoot.Equals($workspaceControl, [StringComparison]::OrdinalIgnoreCase)
    $isDirectProject = (Split-Path $bindingRoot -Parent).Equals($workspace, [StringComparison]::OrdinalIgnoreCase)
    $isRegisteredProject = $false
    $registryPath = Join-Path $workspaceControl 'project-registry.json'
    if (Test-Path -LiteralPath $registryPath) {
        try {
            $registry = Get-Content -LiteralPath $registryPath -Raw -Encoding utf8 | ConvertFrom-Json
            $isRegisteredProject = [bool]($registry.projects | Where-Object {
                $registeredItem = Get-Item -LiteralPath $_.root -ErrorAction SilentlyContinue
                ($null -ne $registeredItem -and $registeredItem.FullName.TrimEnd('\') -eq $bindingRoot) -or
                $_.root.TrimEnd('\').Equals($bindingRoot, [StringComparison]::OrdinalIgnoreCase)
            } | Select-Object -First 1)
        } catch {
            $isRegisteredProject = $false
        }
    }
    if (-not ($isControlPlane -or $isDirectProject -or $isRegisteredProject)) { throw 'Project binding must be exact _workspace, a direct child project root, or a path listed in _workspace/project-registry.json.' }
    if (-not (Test-Path -LiteralPath $bindingRoot -PathType Container)) { throw "Project root does not exist: $bindingRoot" }
    if (-not $isControlPlane) {
        $signals = @('.git', 'AGENTS.md', 'CLAUDE.md', 'package.json', 'pyproject.toml', 'composer.json', 'README.md')
        if (-not ($signals | Where-Object { Test-Path -LiteralPath (Join-Path $bindingRoot $_) } | Select-Object -First 1)) {
            throw "Project root has no recognized project signal: $bindingRoot"
        }
    }
    $newSessions = Join-Path $bindingRoot 'sessions'
    New-Item -ItemType Directory -Path $newSessions -Force | Out-Null
    $oldLog = [string]$state.log_path
    $newLog = Join-Path $newSessions (Split-Path $oldLog -Leaf)
    if (-not $oldLog.Equals($newLog, [StringComparison]::OrdinalIgnoreCase)) {
        if (Test-Path -LiteralPath $newLog) { throw "Target session log already exists: $newLog" }
        Move-Item -LiteralPath $oldLog -Destination $newLog
    }
    $bindingName = if ($bindingRoot.Equals($workspaceControl, [StringComparison]::OrdinalIgnoreCase)) { '_workspace' } else { Split-Path $bindingRoot -Leaf }
    $boundContent = Get-Content -LiteralPath $newLog -Raw -Encoding utf8
    $boundContent = $boundContent -replace '(?m)^Project:.*$', ('Project: ' + $bindingName)
    $boundContent = $boundContent -replace '(?m)^Project Root:.*$', ('Project Root: ' + $bindingRoot)
    $boundContent = $boundContent -replace '(?ms)^## Project Determination\s*\r?\n.*?(?=^## )', "## Project Determination`r`nStatus: resolved`r`nSource: explicit_user_binding`r`n`r`n"
    Set-Content -LiteralPath $newLog -Value $boundContent -Encoding utf8
    $state.log_path = $newLog
    $state.project_status = 'resolved'
    $state.project_name = $bindingName
    $state.project_root = $bindingRoot
    $state.project_source = 'explicit_user_binding'
    if ($state.PSObject.Properties['binding_updated_at']) {
        $state.binding_updated_at = (Get-Date).ToString('o')
    } else {
        $state | Add-Member -NotePropertyName binding_updated_at -NotePropertyValue (Get-Date).ToString('o')
    }
}

$logPath = [string]$state.log_path
if (-not (Test-Path -LiteralPath $logPath)) { throw "Mapped session log missing: $logPath" }

if ($HookEvent -eq 'UserPromptSubmit' -or $HookEvent -eq 'PreInvocation') {
    $state.prompt_count = [int]$state.prompt_count + 1
}
$state.updated_at = (Get-Date).ToString('o')
$stateTemp = $statePath + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
$state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $stateTemp -Encoding utf8
Move-Item -LiteralPath $stateTemp -Destination $statePath -Force

$content = Get-Content -LiteralPath $logPath -Raw -Encoding utf8
$missingSections = @(Test-RequiredSections $content)
if ($missingSections.Count -gt 0) { throw ('Session log is missing mandatory sections: ' + ($missingSections -join ', ')) }

if ($HookEvent -eq 'PreChange') {
    if (-not $state.PSObject.Properties['project_status'] -or $state.project_status -ne 'resolved') {
        [Console]::Error.WriteLine('Project is unresolved. Ask the user to select an existing project, create a new named project, or explicitly choose _workspace control-plane scope.')
        exit 2
    }
    if ($projectDrift) {
        [Console]::Error.WriteLine("Project context changed from $projectRoot to $cwdProjectRoot. Ask the user whether to switch projects or start a new session.")
        exit 2
    }
    $toolInput = if ($null -ne $inputObject) { $inputObject.PSObject.Properties['tool_input'].Value } else { $null }
    $targetPath = Get-InputValue $toolInput @('file_path', 'filePath', 'path')
    if (-not [string]::IsNullOrWhiteSpace($targetPath)) {
        try {
            $candidate = [IO.Path]::GetFullPath((Join-Path ([string](Get-InputValue $inputObject @('cwd'))) $targetPath))
            if ([IO.Path]::IsPathRooted($targetPath)) { $candidate = [IO.Path]::GetFullPath($targetPath) }
            if ($candidate.Equals([IO.Path]::GetFullPath($logPath), [StringComparison]::OrdinalIgnoreCase)) { exit 0 }
        } catch { $candidate = $null }
    }
    if (-not $candidate) {
        [Console]::Error.WriteLine('Mutation target path is missing or unparseable; refusing to fail open.')
        exit 2
    }
    $mutationRoot = [string]$state.project_root
    if ($state.project_name -eq '_workspace') {
        $fullCandidate = [IO.Path]::GetFullPath($candidate)
        $workspace = [IO.Path]::GetFullPath($WorkspaceRoot).TrimEnd('\')
        $relativeCandidate = $fullCandidate.Substring($workspace.Length).TrimStart('\')
        $firstSegment = ($relativeCandidate -split '\\')[0]
        $controlPlaneRoots = @('.agents', '.claude', '.codex', '.cursor', '.factory', '.github', '.kiro', '.vscode', '_workspace', 'agents', 'scripts', 'design')
        $controlPlaneFiles = @('CLAUDE.md', 'AGENTS.md', 'Multi-Agent Workforce Architecture & System Prompts.md', 'WORKSPACE_INDEX.md', 'agent-v3.ps1', 'bootstrap-agent.ps1')
        if (-not ($controlPlaneRoots -contains $firstSegment -or $controlPlaneFiles -contains $relativeCandidate)) {
            [Console]::Error.WriteLine("Control-plane session cannot mutate project-owned path without separate authorization: $candidate")
            exit 2
        }
        $mutationRoot = $workspace
    }
    $fullMutationRoot = [IO.Path]::GetFullPath($mutationRoot).TrimEnd('\')
    $fullCandidate = [IO.Path]::GetFullPath($candidate)
    if (-not ($fullCandidate.Equals($fullMutationRoot, [StringComparison]::OrdinalIgnoreCase) -or $fullCandidate.StartsWith(($fullMutationRoot + '\'), [StringComparison]::OrdinalIgnoreCase))) {
        [Console]::Error.WriteLine("Mutation target is outside the bound project $($state.project_root): $candidate")
        exit 2
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

if ($HookEvent -eq 'Stop') {
    $stopAlreadyActive = Get-InputValue $inputObject @('stop_hook_active', 'stopHookActive')
    $incomplete = @()
    if (-not $state.PSObject.Properties['project_status'] -or $state.project_status -ne 'resolved') { $incomplete += 'Project Determination' }
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

$isClosingEvent = ($HookEvent -eq 'SessionEnd' -or ($HookEvent -eq 'Stop' -and $content -match '(?m)^## Goal Status\s*\r?\nACHIEVED\s*$'))
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

if ($HookEvent -eq 'SessionStart' -or $HookEvent -eq 'PreInvocation' -or $HookEvent -eq 'PostChange' -or $HookEvent -eq 'Stop' -or $HookEvent -eq 'SessionEnd') {
    Copy-SessionMirror $logPath
}

if ($indexFailure) { throw $indexFailure }

$normalizedWorkspaceForLog = [IO.Path]::GetFullPath($WorkspaceRoot).TrimEnd('\')
$relativeLog = if ($logPath.StartsWith($normalizedWorkspaceForLog + '\', [StringComparison]::OrdinalIgnoreCase)) {
    $logPath.Substring($normalizedWorkspaceForLog.Length).TrimStart('\')
} else {
    $logPath
}
if ($HookEvent -eq 'SessionStart' -or $HookEvent -eq 'UserPromptSubmit' -or $HookEvent -eq 'PreInvocation') {
    if (-not $state.PSObject.Properties['project_status'] -or $state.project_status -ne 'resolved') {
        Write-Output "[constitution-hook] PROJECT UNRESOLVED. Before substantive work, ask the user: Which existing project does this belong to, is it a new named project, or is it genuine _workspace control-plane work? Then bind with ProjectBind or create with ProjectCreate. Exact bootstrap log: $relativeLog."
    } elseif ($projectDrift) {
        Write-Output "[constitution-hook] PROJECT CONTEXT CHANGED. This session is bound to $($state.project_root), but the current directory resolves to $cwdProjectRoot. Ask the user whether to switch projects or start a new session before substantive work."
    } else {
        Write-Output "[constitution-hook] ACTIVE. Project: $($state.project_name). Exact log: $relativeLog. Before substantive work: read CLAUDE.md and MEMORY.md; replace the Goal placeholder; run uSibali tier/model clearance; route through uMlawuli; record task IDs and accountability; back up existing files before edits; update Decisions, Work Done, Blockers, and Learnings; keep Goal Status PENDING until explicit user confirmation. This reminder applies to this prompt."
    }
} elseif ($HookEvent -eq 'PostChange') {
    Write-Output "[constitution-hook] Change recorded. Update Work Done and verify the timestamped backup for every modified existing file. Exact log: $relativeLog."
}

if ($stateMutex) { try { $stateMutex.ReleaseMutex() } catch { }; $stateMutex.Dispose() }
exit 0
