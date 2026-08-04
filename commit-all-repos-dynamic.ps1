param (
    [string]$Root = "C:\DevWork",
    [string]$CommitMessage = "chore: automated workspace update",
    [switch]$DryRun,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$excludeDirs = @('node_modules', '.pnpm-store', 'temp', '_backups', '.next', 'dist', 'build', '.venv')

function Get-RegisteredRepositoryPaths {
    param ([string]$SearchRoot)

    $registryPath = Join-Path $SearchRoot '_workspace\project-registry.json'
    if (-not (Test-Path -LiteralPath $registryPath)) { return @() }
    try {
        $registry = Get-Content -LiteralPath $registryPath -Raw -Encoding utf8 | ConvertFrom-Json
    } catch {
        return @()
    }
    $paths = New-Object System.Collections.Generic.List[string]
    foreach ($project in $registry.projects) {
        $root = [string]$project.root
        if ([string]::IsNullOrWhiteSpace($root)) { continue }
        if (Test-Path -LiteralPath (Join-Path $root '.git')) {
            $paths.Add((Get-Item -LiteralPath $root).FullName)
        }
    }
    return @($paths)
}

function Get-RepositoryPaths {
    param ([string]$SearchRoot)

    $paths = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

    if (Test-Path -LiteralPath (Join-Path $SearchRoot '.git')) {
        $null = $paths.Add((Get-Item -LiteralPath $SearchRoot).FullName)
    }

    Get-ChildItem -LiteralPath $SearchRoot -Directory -Recurse -Depth 3 -ErrorAction SilentlyContinue |
        Where-Object {
            $relativePath = $_.FullName.Substring($SearchRoot.Length).TrimStart('\')
            $segments = $relativePath -split '\\'
            (Test-Path -LiteralPath (Join-Path $_.FullName '.git')) -and
            -not ($segments | Where-Object { $excludeDirs -contains $_ })
        } |
        ForEach-Object {
            $null = $paths.Add($_.FullName)
        }

    foreach ($registeredPath in (Get-RegisteredRepositoryPaths -SearchRoot $SearchRoot)) {
        $null = $paths.Add($registeredPath)
    }

    return @($paths | Sort-Object)
}

function Get-UnbornNestedRepos {
    param ([string]$RepositoryPath)

    $unborn = New-Object System.Collections.Generic.List[string]
    Get-ChildItem -LiteralPath $RepositoryPath -Directory -Recurse -Depth 3 -ErrorAction SilentlyContinue |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName '.git') } |
        ForEach-Object {
            $nestedFullName = $_.FullName
            $relative = $nestedFullName.Substring($RepositoryPath.Length).TrimStart('\') -replace '\\', '/'
            Push-Location $nestedFullName
            try {
                $null = git rev-parse HEAD 2>$null
                if (-not $?) {
                    $unborn.Add($relative)
                }
            }
            catch {
                $unborn.Add($relative)
            }
            finally {
                Pop-Location
            }
        }
    return @($unborn)
}

function Get-Divergence {
    param ([string]$Upstream)

    $counts = (git rev-list --left-right --count "HEAD...$Upstream") -split '\s+'
    if ($LASTEXITCODE -ne 0 -or $counts.Count -lt 2) {
        throw "Unable to calculate branch divergence."
    }

    return @{
        Ahead = [int]$counts[0]
        Behind = [int]$counts[1]
    }
}

function Show-RepositoryPlan {
    param ($Plan)

    Write-Host ""
    Write-Host "------------------------------"
    Write-Host "Repo: $($Plan.Path)"
    Write-Host "Branch: $($Plan.Branch)"
    Write-Host "------------------------------"

    if ($Plan.FetchFailed) {
        Write-Host "Fetch failed. This repository will not be changed." -ForegroundColor Red
        return
    }

    if (-not $Plan.HasUpstream) {
        Write-Host "No upstream tracking branch. This repository will not be changed." -ForegroundColor Yellow
        return
    }

    Write-Host "Remote: $($Plan.Upstream)"
    Write-Host "Ahead: $($Plan.Ahead) | Behind: $($Plan.Behind)"

    if ($Plan.HasChanges) {
        Write-Host ""
        Write-Host "Working-tree changes:"
        $Plan.Status | ForEach-Object { Write-Host $_ }
        Write-Host ""
        Write-Host "Tracked change estimate:"
        git --no-pager diff --stat
    } else {
        Write-Host "Working tree: clean"
    }

    $actions = New-Object System.Collections.Generic.List[string]
    if ($Plan.Behind -gt 0) {
        $actions.Add("rebase onto $($Plan.Behind) incoming commit(s)")
    }
    if ($Plan.HasChanges) {
        $actions.Add("commit working-tree changes")
    }
    if ($Plan.Ahead -gt 0 -or $Plan.HasChanges) {
        $actions.Add("push local commits")
    }

    if ($actions.Count -eq 0) {
        Write-Host "Planned action: none"
    } else {
        Write-Host "Planned action: $($actions -join '; ')"
    }
}

Write-Host ""
Write-Host "Scanning for git repositories under $Root ..."

$repositoryPaths = Get-RepositoryPaths -SearchRoot $Root
$plans = New-Object System.Collections.Generic.List[object]

foreach ($repositoryPath in $repositoryPaths) {
    Push-Location $repositoryPath
    try {
        $status = @(git status --porcelain=v1)
        if ($LASTEXITCODE -ne 0) {
            throw "Unable to read repository status."
        }

        $branch = git branch --show-current
        $upstream = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
        $hasUpstream = $LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($upstream)
        $fetchFailed = $false
        $ahead = 0
        $behind = 0

        if ($hasUpstream) {
            git fetch
            if ($LASTEXITCODE -ne 0) {
                $fetchFailed = $true
            } else {
                $divergence = Get-Divergence -Upstream $upstream
                $ahead = $divergence.Ahead
                $behind = $divergence.Behind
            }
        }

        $plan = [pscustomobject]@{
            Path = $repositoryPath
            Branch = $branch
            Status = $status
            HasChanges = $status.Count -gt 0
            HasUpstream = $hasUpstream
            Upstream = $upstream
            FetchFailed = $fetchFailed
            Ahead = $ahead
            Behind = $behind
            Selected = $false
        }

        $plans.Add($plan)
        Show-RepositoryPlan -Plan $plan
    }
    catch {
        Write-Host "Error inspecting repository: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

$actionablePlans = @(
    $plans | Where-Object {
        -not $_.FetchFailed -and
        $_.HasUpstream -and
        ($_.HasChanges -or $_.Ahead -gt 0 -or $_.Behind -gt 0)
    }
)

if ($actionablePlans.Count -eq 0) {
    Write-Host ""
    Write-Host "All repositories are already synchronized."
    return
}

if ($DryRun) {
    Write-Host ""
    Write-Host "Dry run complete. No pull, commit, or push was performed."
    return
}

if ($Yes) {
    $choice = 'A'
} else {
    Write-Host ""
    $choice = (Read-Host "Accept all changes [A], select repositories [S], or cancel [N]").Trim().ToUpperInvariant()
}

if ($choice -eq 'S') {
    foreach ($plan in $actionablePlans) {
        $answer = (Read-Host "Process $($plan.Path)? [Y/N]").Trim().ToUpperInvariant()
        $plan.Selected = $answer -eq 'Y'
    }
} elseif ($choice -eq 'A') {
    foreach ($plan in $actionablePlans) {
        $plan.Selected = $true
    }
} else {
    Write-Host "Cancelled. No pull, commit, or push was performed."
    return
}

foreach ($plan in $actionablePlans | Where-Object { $_.Selected }) {
    Write-Host ""
    Write-Host "Processing $($plan.Path) ..."
    Push-Location $plan.Path
    try {
        if ($plan.Behind -gt 0) {
            if ($plan.HasChanges) {
                git pull --rebase --autostash
            } else {
                git pull --rebase
            }
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Pull/rebase failed. Resolve this repository manually before retrying." -ForegroundColor Red
                continue
            }
        }

        $currentStatus = @(git status --porcelain=v1)
        if ($currentStatus.Count -gt 0) {
            $unbornNested = Get-UnbornNestedRepos -RepositoryPath $plan.Path
            if ($unbornNested.Count -gt 0) {
                foreach ($skipped in $unbornNested) {
                    Write-Host "Skipping nested repository with no commits yet: $skipped" -ForegroundColor Yellow
                }
                $trackableUnborn = $unbornNested | Where-Object {
                    git check-ignore -q -- $_ 2>$null | Out-Null
                    $LASTEXITCODE -ne 0
                }
                if ($trackableUnborn.Count -gt 0) {
                    $pathspecs = @('.') + ($trackableUnborn | ForEach-Object { ":(exclude)$_" })
                    git add -A -- @pathspecs
                } else {
                    git add -A
                }
            } else {
                git add -A
            }
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Staging failed." -ForegroundColor Red
                continue
            }

            git commit -m $CommitMessage
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Commit failed." -ForegroundColor Red
                continue
            }
        }

        $currentUpstream = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
        $currentDivergence = Get-Divergence -Upstream $currentUpstream
        if ($currentDivergence.Behind -gt 0) {
            git pull --rebase
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Final pull/rebase failed. Resolve this repository manually before pushing." -ForegroundColor Red
                continue
            }
            $currentDivergence = Get-Divergence -Upstream $currentUpstream
        }

        if ($currentDivergence.Ahead -gt 0) {
            git push
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Push failed." -ForegroundColor Red
                continue
            }
            Write-Host "Push completed successfully." -ForegroundColor Green
        } else {
            Write-Host "No local commits need pushing."
        }
    }
    catch {
        Write-Host "Error processing repository: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Selected repositories processed."
