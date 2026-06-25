param (
    [string]$Root = "C:\DevWork",
    [string]$CommitMessage = "chore: automated workspace update",
    [switch]$DryRun
)

Write-Host ""
Write-Host "Scanning for git repositories under $Root ..."
Write-Host ""

$repos = Get-ChildItem -Path $Root -Directory -Recurse -Depth 3 -ErrorAction SilentlyContinue |
    Where-Object {
        Test-Path (Join-Path $_.FullName ".git") -PathType Container
    }

foreach ($repo in $repos) {
    Write-Host "------------------------------"
    Write-Host "Repo: $($repo.FullName)"
    Write-Host "------------------------------"

    try {
        Set-Location $repo.FullName -ErrorAction Stop

        # Sync with remote first
        Write-Host "Syncing with remote..."
        git fetch
        $pullOutput = git pull --rebase 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Pull failed. Output: $pullOutput"
            # Continue anyway since it might be a new branch or other non-critical issue
        }

        $status = git status --porcelain
        if (-not $status) {
            Write-Host "Clean repo, skipping."
            continue
        }

        Write-Host "Changes detected:`n$status"
        Write-Host "`nChange estimate:"
        git diff --stat

        if ($DryRun) {
            Write-Host "`nDry run enabled. No commit or push."
            continue
        }

        # Staging changes
        git add .
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Failed to stage changes."
            continue
        }

        # Committing changes
        git commit -m $CommitMessage
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Nothing to commit or commit failed."
            continue
        }

        # Pushing changes
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
