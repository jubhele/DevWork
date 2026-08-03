param(
  [string]$Owner = "jubhele",
  [string[]]$Repos = @(
    "BlackFire",
    "DevWork",
    "Umsebenzi_SBG",
    "JS_Resume",
    "ilahle-portal",
    "Astute",
    "GovTender",
    "llm-fx-trader"
  ),
  [string]$FilePath = "Multi-Agent Workforce Architecture & System Prompts.md",
  [string]$SourceRepo = "DevWork",
  [string]$CommitMessage = "chore(docs): align Multi-Agent Workforce Architecture & System Prompts.md to v3.8.0 across repos"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required: https://cli.github.com/"
}

gh auth status | Out-Null

Write-Host "Fetching canonical file from $Owner/$SourceRepo ..."
$encodedPath = [uri]::EscapeDataString($FilePath)
$sourceContent = gh api -H "Accept: application/vnd.github.raw" "/repos/$Owner/$SourceRepo/contents/$encodedPath"
if (-not $sourceContent) { throw "Could not read source file." }

$results = @()

foreach ($repo in $Repos) {
  Write-Host "`n--- $Owner/$repo ---"
  try {
    $defaultBranch = gh api "/repos/$Owner/$repo" --jq ".default_branch"
    if (-not $defaultBranch) { throw "No default branch" }

    $sha = $null
    try {
      $sha = (gh api "/repos/$Owner/$repo/contents/$encodedPath?ref=$defaultBranch" --jq ".sha").Trim()
      if ($sha -eq "null") { $sha = $null }
    } catch { $sha = $null }

    if ($sha) {
      $current = gh api -H "Accept: application/vnd.github.raw" "/repos/$Owner/$repo/contents/$encodedPath?ref=$defaultBranch"
      if ($current -eq $sourceContent) {
        $results += [pscustomobject]@{ Repo="$Owner/$repo"; Status="UNCHANGED"; Branch=$defaultBranch; Note="Already aligned" }
        Write-Host "Already aligned."
        continue
      }
    }

    $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($sourceContent))
    $payload = @{
      message = $CommitMessage
      content = $b64
      branch  = $defaultBranch
    }
    if ($sha) { $payload.sha = $sha }

    $jsonFile = Join-Path $env:TEMP ("gh_payload_" + [guid]::NewGuid().ToString() + ".json")
    $payload | ConvertTo-Json -Compress | Set-Content -Path $jsonFile -Encoding utf8

    gh api --method PUT "/repos/$Owner/$repo/contents/$encodedPath" --input $jsonFile | Out-Null
    Remove-Item $jsonFile -ErrorAction SilentlyContinue

    $status = if ($sha) { "UPDATED" } else { "CREATED" }
    $results += [pscustomobject]@{ Repo="$Owner/$repo"; Status=$status; Branch=$defaultBranch; Note="Committed" }
    Write-Host "$status on $defaultBranch"
  }
  catch {
    $results += [pscustomobject]@{ Repo="$Owner/$repo"; Status="FAILED"; Branch=""; Note=$_.Exception.Message }
    Write-Warning $_.Exception.Message
  }
}

Write-Host "`n===== Sync Report ====="
$results | Format-Table -AutoSize