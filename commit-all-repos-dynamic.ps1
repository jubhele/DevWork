param (
    [string]$Root = "C:\DevWork",
    [string]$CommitMessage = "chore: automated workspace update",
    [switch]$DryRun
)

Write-Host ""
Write-Host "Scanning for git repositories under $Root ..."
Write-Host ""

$excludeDirs = @('node_modules', '.pnpm-store', 'temp', '_backups', '.next', 'dist', 'build')

$repos = Get-ChildItem -Path $Root -Directory -Recurse -Depth 3 -ErrorAction SilentlyContinue |
    Where-Object {
        $rel = $_.FullName.Substring($Root.Length).TrimStart('\')
        $segments = $rel -split '\\'
        (Test-Path (Join-Path $_.FullName ".git") -PathType Container) -and
        -not ($segments | Where-Object { $excludeDirs -contains $_ })
    }

foreach ($repo in $repos) {
    Write-Host "------------------------------"
    Write-Host "Repo: $($repo.FullName)"
    Write-Host "------------------------------"

    try {
        Set-Location $repo.FullName -ErrorAction Stop

        $status = git status --porcelain
        if ($status) {
            Write-Host "Changes detected:`n$status"
            Write-Host "`nChange estimate:"
            git diff --stat

            if ($DryRun) {
                Write-Host "`nDry run enabled. No commit or push."
                continue
            }

            git add .
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Error: Failed to stage changes."
                continue
            }

            git commit -m $CommitMessage
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Nothing to commit or commit failed."
                continue
            }
        } else {
            Write-Host "Clean working tree."
        }

        # Sync with remote after any local commit, so rebase has nothing to conflict with
        $hasUpstream = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
        if (-not $hasUpstream) {
            Write-Host "No upstream tracking branch configured. Skipping sync/push."
            continue
        }

        Write-Host "Syncing with remote..."
        git fetch
        $pullOutput = git pull --rebase 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Pull --rebase failed. Output: $pullOutput"
            Write-Host "Resolve manually in $($repo.FullName) before re-running."
            continue
        }

        if (-not $status) {
            Write-Host "Nothing local to push."
            continue
        }

        if ($DryRun) {
            continue
        }

        git push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Push completed successfully."
        } else {
            Write-Host "Error: Push failed."
        }
    }
    catch {
        Write-Host "Error processing repository: $_"
    }
    finally {
        # Return to original directory
        Set-Location $PSScriptRoot
    }
}

Write-Host ""
Write-Host "All repositories processed."
