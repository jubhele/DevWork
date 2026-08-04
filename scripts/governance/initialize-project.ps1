param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,
    [string]$ProjectRoot = '',
    [string]$WorkspaceRoot = 'C:\DevWork',
    [switch]$AdoptExisting
)

$ErrorActionPreference = 'Stop'

function Get-NormalizedPath {
    param([string]$Path)
    return [IO.Path]::GetFullPath($Path).TrimEnd('\')
}

$workspace = Get-NormalizedPath $WorkspaceRoot
if (-not (Test-Path -LiteralPath $workspace -PathType Container)) { throw "Workspace root does not exist: $workspace" }
if ([string]::IsNullOrWhiteSpace($ProjectName) -or $ProjectName -notmatch '^[A-Za-z0-9][A-Za-z0-9 _.-]{1,79}$') {
    throw 'ProjectName must be 2-80 characters and contain only letters, numbers, spaces, dot, underscore, or hyphen.'
}

$reserved = @('_workspace', 'agents', 'scripts', 'sessions', 'temp', 'logs', 'docs', 'design', 'queue', 'node_modules')
if ($reserved -contains $ProjectName.Trim().ToLowerInvariant()) { throw "Reserved project name: $ProjectName" }

$target = if ([string]::IsNullOrWhiteSpace($ProjectRoot)) { Join-Path $workspace $ProjectName.Trim() } else { $ProjectRoot }
$target = Get-NormalizedPath $target
$isNestedTarget = $target.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)
if ($isNestedTarget -and (Split-Path $target -Parent) -ne $workspace) { throw 'New nested projects must be direct children of the workspace root.' }
if (-not $isNestedTarget -and [string]::IsNullOrWhiteSpace($ProjectRoot)) { throw "Project root must stay inside $workspace unless -ProjectRoot is explicitly supplied." }
if ((Split-Path $target -Leaf) -ne $ProjectName.Trim()) { throw 'ProjectName must exactly match the target folder name.' }

$targetBytes = [Text.Encoding]::UTF8.GetBytes($target.ToLowerInvariant())
$lockName = (([Security.Cryptography.SHA256]::Create().ComputeHash($targetBytes) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 32)
$lockDirectory = Join-Path $workspace '_workspace\temp\project-locks'
New-Item -ItemType Directory -Path $lockDirectory -Force | Out-Null
$lockPath = Join-Path $lockDirectory ($lockName + '.lock')
$lock = $null
$stage = $null

try {
    $lock = New-Object IO.FileStream($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    $exists = Test-Path -LiteralPath $target
    if ($exists -and -not $AdoptExisting) {
        $items = @(Get-ChildItem -LiteralPath $target -Force -ErrorAction Stop)
        if ($items.Count -gt 0) { throw "Project directory already exists and is not empty: $target. Use -AdoptExisting only after user approval." }
    }

    if (-not $exists) {
        $stage = $target + '.creating-' + [guid]::NewGuid().ToString('N')
        New-Item -ItemType Directory -Path $stage | Out-Null
        $workingRoot = $stage
    } else {
        $workingRoot = $target
    }

    foreach ($relative in @('sessions', 'artifacts\drafts', 'artifacts\generated', 'artifacts\reports', 'archive', 'temp', 'logs', '_backups', 'docs')) {
        New-Item -ItemType Directory -Path (Join-Path $workingRoot $relative) -Force | Out-Null
    }

    $readmePath = Join-Path $workingRoot 'README.md'
    if (-not (Test-Path -LiteralPath $readmePath)) {
        @(
            '# ' + $ProjectName.Trim(),
            '',
            'Project workspace managed under the DevWork constitution.',
            '',
            '## Artifact custody',
            '',
            '- `sessions/` — project session logs',
            '- `artifacts/` — drafts, generated outputs, and reports',
            '- `archive/` — superseded or completed material',
            '- `temp/` and `logs/` — local operational data',
            '- `_backups/` — timestamped pre-change backups'
        ) | Set-Content -LiteralPath $readmePath -Encoding utf8
    }

    $gitignorePath = Join-Path $workingRoot '.gitignore'
    if (-not (Test-Path -LiteralPath $gitignorePath)) {
        @('.env', '*.env', 'config.local.*', 'temp/', 'logs/', '*.log', 'chatsessions/', '.DS_Store', 'Thumbs.db') |
            Set-Content -LiteralPath $gitignorePath -Encoding utf8
    }

    if (-not (Test-Path -LiteralPath (Join-Path $workingRoot '.git'))) {
        & git -C $workingRoot init --quiet
        if ($LASTEXITCODE -ne 0) { throw "git init failed for $workingRoot" }
    }

    if ($stage) {
        if (Test-Path -LiteralPath $target) { throw "Project target appeared during creation: $target" }
        Move-Item -LiteralPath $stage -Destination $target
        $stage = $null
    }

    $indexScript = Join-Path $workspace 'scripts\governance\update-workspace-index.ps1'
    $indexStatus = 'NOT_AVAILABLE'
    if (Test-Path -LiteralPath $indexScript) {
        try {
            $indexResult = & $indexScript -WorkspaceRoot $workspace | Select-Object -Last 1 | ConvertFrom-Json
            $indexStatus = $indexResult.status
        } catch {
            $indexStatus = 'FAILED: ' + $_.Exception.Message
        }
    }

    $registryPath = Join-Path $workspace '_workspace\project-registry.json'
    if (Test-Path -LiteralPath $registryPath) {
        try {
            $registry = Get-Content -LiteralPath $registryPath -Raw -Encoding utf8 | ConvertFrom-Json
            $already = $registry.projects | Where-Object { $_.root.TrimEnd('\').Equals($target, [StringComparison]::OrdinalIgnoreCase) }
            if (-not $already) {
                $registry.projects += [pscustomobject]@{
                    name = $ProjectName.Trim()
                    root = $target
                    status = if ($isNestedTarget) { 'nested' } else { 'sibling' }
                }
                $registry.updated_at = (Get-Date).ToString('o')
                $registry | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $registryPath -Encoding utf8
            }
        } catch {
            # Registry update is best-effort; creation must not fail because of it.
        }
    }

    [pscustomobject]@{
        status = if ($exists) { 'ADOPTED' } else { 'CREATED' }
        project_name = $ProjectName.Trim()
        project_root = $target
        git_repository = (Join-Path $target '.git')
        workspace_index = $indexStatus
    } | ConvertTo-Json -Compress
} catch {
    if ($stage -and (Test-Path -LiteralPath $stage)) {
        $resolvedStage = Get-NormalizedPath $stage
        $stageParent = Split-Path $target -Parent
        if ($resolvedStage.StartsWith($stageParent + '\', [StringComparison]::OrdinalIgnoreCase) -and $resolvedStage -like '*.creating-*') {
            Remove-Item -LiteralPath $resolvedStage -Recurse -Force
        }
    }
    throw
} finally {
    if ($lock) { $lock.Dispose() }
}
