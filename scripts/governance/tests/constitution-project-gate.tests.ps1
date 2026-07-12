$ErrorActionPreference = 'Stop'

$workspace = 'C:\DevWork'
$fixture = Join-Path $workspace 'temp\constitution-project-gate-tests'
$hook = Join-Path $workspace 'scripts\governance\constitution-hook.ps1'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

function Invoke-HookProcess {
    param([string]$Payload, [string]$Arguments)
    $process = New-Object Diagnostics.Process
    $process.StartInfo.FileName = 'powershell.exe'
    $process.StartInfo.Arguments = '-NonInteractive -ExecutionPolicy Bypass -File "' + $hook + '" ' + $Arguments
    $process.StartInfo.RedirectStandardInput = $true
    $process.StartInfo.RedirectStandardOutput = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.StartInfo.UseShellExecute = $false
    $null = $process.Start()
    $process.StandardInput.WriteLine($Payload)
    $process.StandardInput.Close()
    $output = $process.StandardOutput.ReadToEnd()
    $errorText = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    return [pscustomobject]@{ exit_code = $process.ExitCode; stdout = $output; stderr = $errorText }
}

if (Test-Path -LiteralPath $fixture) {
    $resolved = [IO.Path]::GetFullPath($fixture)
    Assert-True ($resolved -eq 'C:\DevWork\temp\constitution-project-gate-tests') 'Unsafe fixture cleanup path.'
    Remove-Item -LiteralPath $resolved -Recurse -Force
}

try {
    New-Item -ItemType Directory -Path $fixture -Force | Out-Null
    Copy-Item (Join-Path $workspace 'CLAUDE.md') (Join-Path $fixture 'CLAUDE.md')
    New-Item -ItemType Directory -Path (Join-Path $fixture '_workspace') -Force | Out-Null
    $fixtureScripts = Join-Path $fixture 'scripts\governance'
    New-Item -ItemType Directory -Path $fixtureScripts -Force | Out-Null
    Copy-Item (Join-Path $workspace 'scripts\governance\initialize-project.ps1') (Join-Path $fixtureScripts 'initialize-project.ps1')

    $knownProject = Join-Path $fixture 'KnownProject'
    New-Item -ItemType Directory -Path $knownProject | Out-Null
    Copy-Item (Join-Path $workspace 'CLAUDE.md') (Join-Path $knownProject 'README.md')

    $startPayload = [pscustomobject]@{ hook_event_name = 'SessionStart'; session_id = 'existing-project'; cwd = $fixture; model = 'test' } | ConvertTo-Json -Compress
    $start = Invoke-HookProcess $startPayload ('-Provider GateTest -WorkspaceRoot "' + $fixture + '"')
    Assert-True ($start.exit_code -eq 0 -and $start.stdout -match 'PROJECT UNRESOLVED') 'Root session did not enter unresolved state.'

    $statePath = Join-Path $fixture '_workspace\temp\constitution-hooks\gatetest_existing-project.json'
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    Assert-True ($state.project_status -eq 'unresolved') 'Unresolved state was not persisted.'
    Assert-True ($state.log_path -like "$fixture\_workspace\sessions\*") 'Bootstrap log is not under _workspace sessions.'

    $mutationPayload = [pscustomobject]@{ session_id = 'existing-project'; cwd = $fixture; tool_input = [pscustomobject]@{ file_path = (Join-Path $fixture 'blocked.txt') } } | ConvertTo-Json -Compress
    $unresolvedMutation = Invoke-HookProcess $mutationPayload ('-Event PreChange -Provider GateTest -WorkspaceRoot "' + $fixture + '"')
    Assert-True ($unresolvedMutation.exit_code -eq 2) 'Unresolved mutation was not blocked.'

    $bindPayload = [pscustomobject]@{ session_id = 'existing-project'; cwd = $fixture } | ConvertTo-Json -Compress
    $invalidBind = Invoke-HookProcess $bindPayload ('-Event ProjectBind -Provider GateTest -WorkspaceRoot "' + $fixture + '" -RequestedProjectRoot "' + (Join-Path $fixture 'scripts') + '"')
    Assert-True ($invalidBind.exit_code -ne 0) 'Invalid support-directory binding was accepted.'

    $validBind = Invoke-HookProcess $bindPayload ('-Event ProjectBind -Provider GateTest -WorkspaceRoot "' + $fixture + '" -RequestedProjectRoot "' + $knownProject + '"')
    Assert-True ($validBind.exit_code -eq 0) ('Valid project binding failed: ' + $validBind.stderr)
    $boundState = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    Assert-True ($boundState.project_status -eq 'resolved' -and $boundState.project_root -eq $knownProject) 'Project state binding failed.'
    Assert-True ($boundState.log_path -like "$knownProject\sessions\*") 'Bootstrap log did not migrate to project sessions.'

    $newStartPayload = [pscustomobject]@{ hook_event_name = 'SessionStart'; session_id = 'new-project'; cwd = $fixture; model = 'test' } | ConvertTo-Json -Compress
    $null = Invoke-HookProcess $newStartPayload ('-Provider GateTest -WorkspaceRoot "' + $fixture + '"')
    $newPayload = [pscustomobject]@{ session_id = 'new-project'; cwd = $fixture } | ConvertTo-Json -Compress
    $created = Invoke-HookProcess $newPayload ('-Event ProjectCreate -Provider GateTest -WorkspaceRoot "' + $fixture + '" -ProjectName "Fresh Project"')
    Assert-True ($created.exit_code -eq 0) ('ProjectCreate failed: ' + $created.stderr)
    $freshRoot = Join-Path $fixture 'Fresh Project'
    foreach ($relative in @('.git', 'sessions', 'artifacts\drafts', 'artifacts\generated', 'artifacts\reports', 'archive', 'temp', 'logs', '_backups', 'docs', 'README.md', '.gitignore')) {
        Assert-True (Test-Path -LiteralPath (Join-Path $freshRoot $relative)) "Missing scaffold path: $relative"
    }

    $outsideTarget = Join-Path $fixture 'outside.txt'
    Copy-Item (Join-Path $workspace 'CLAUDE.md') $outsideTarget
    $crossPayload = [pscustomobject]@{ session_id = 'existing-project'; cwd = $knownProject; tool_input = [pscustomobject]@{ file_path = $outsideTarget } } | ConvertTo-Json -Compress
    $crossMutation = Invoke-HookProcess $crossPayload ('-Event PreChange -Provider GateTest -WorkspaceRoot "' + $fixture + '"')
    Assert-True ($crossMutation.exit_code -eq 2) 'Cross-project mutation was not blocked.'

    [pscustomobject]@{ status = 'PASS'; tests = 7; fixture = $fixture } | ConvertTo-Json -Compress
} finally {
    if (Test-Path -LiteralPath $fixture) {
        $resolved = [IO.Path]::GetFullPath($fixture)
        if ($resolved -eq 'C:\DevWork\temp\constitution-project-gate-tests') { Remove-Item -LiteralPath $resolved -Recurse -Force }
    }
}
