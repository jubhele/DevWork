param(
  [int]$Port = 8790,
  [switch]$WatchFull,
  [int]$WatchIntervalSeconds = 60
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DocsDir = Join-Path $RepoRoot 'docs'
$WebRoot = Join-Path $RepoRoot 'apps\web'
$PhpRoot = Join-Path $RepoRoot 'BlackFire Portal'
$StatusMd = Join-Path $DocsDir 'pbi-rollout-status.md'
$QueueMd = Join-Path $DocsDir 'pbi-task-queue.md'
$ProgressMd = Join-Path $DocsDir 'pbi-progress-detail.md'
$StatusHtml = Join-Path $DocsDir 'pbi-rollout-status.html'
$RuntimeJson = Join-Path $RepoRoot 'tmp\pbi-rollout-status.runtime.json'
$WatchPidFile = Join-Path $RepoRoot 'tmp\pbi-rollout-status.watch.pid'
$PhpLogDir = Join-Path $RepoRoot 'tmp'

if (-not (Test-Path $PhpLogDir)) {
  New-Item -ItemType Directory -Path $PhpLogDir | Out-Null
}

function Read-TextFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return '' }
  return Get-Content -LiteralPath $Path -Raw
}

function Convert-MarkdownTable {
  param(
    [string]$Markdown,
    [string]$Heading
  )

  $lines = $Markdown -split "`r?`n"
  $start = -1
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Trim() -eq $Heading.Trim()) {
      $start = $i
      break
    }
  }

  if ($start -lt 0) { return @() }

  $rows = @()
  $started = $false
  for ($j = $start + 1; $j -lt $lines.Count; $j++) {
    $line = $lines[$j].Trim()
    if (-not $line) {
      if ($started) { break }
      continue
    }
    if (-not $line.StartsWith('|')) { continue }
    if ($line -match '^\|\s*-{3,}') { continue }
    $started = $true
    $cells = ($line.Trim('|') -split '\|') | ForEach-Object { $_.Trim() }
    $rows += ,$cells
  }
  return $rows
}

function Get-Snapshot {
  $statusRows = Convert-MarkdownTable -Markdown (Read-TextFile $StatusMd) -Heading '| Platform | Status | What is green | What is yellow | What is red |'
  $queueRows = Convert-MarkdownTable -Markdown (Read-TextFile $QueueMd) -Heading '| Order | Session | Status | Why |'
  $progressRows = Convert-MarkdownTable -Markdown (Read-TextFile $ProgressMd) -Heading '| Order | Action | Status | Done | Left |'
  $doneFiles = Convert-MarkdownTable -Markdown (Read-TextFile $ProgressMd) -Heading '| Done File | Area | Notes |'
  $leftFiles = Convert-MarkdownTable -Markdown (Read-TextFile $ProgressMd) -Heading '| Layer | File | Status | Why |'

  $runtime = @{}
  if (Test-Path -LiteralPath $RuntimeJson) {
    try {
      $runtime = Get-Content -LiteralPath $RuntimeJson -Raw | ConvertFrom-Json
    } catch {
      $runtime = @{}
    }
  }

  return @{
    generatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    statusRows = $statusRows
    queueRows = $queueRows
    progressRows = $progressRows
    doneFiles = $doneFiles
    leftFiles = $leftFiles
    watchActive = (Test-WatchRunning)
    watchPid = Get-WatchPid
    runtime = $runtime
  }
}

function Write-RuntimeState {
  param(
    [string]$Task,
    [string]$Status,
    [string]$Message,
    [int]$ExitCode,
    [hashtable]$Extra
  )

  $payload = [ordered]@{
    lastTask = $Task
    lastStatus = $Status
    lastMessage = $Message
    lastExitCode = $ExitCode
    updatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  }
  if ($Extra) {
    foreach ($key in $Extra.Keys) {
      $payload[$key] = $Extra[$key]
    }
  }
  $json = $payload | ConvertTo-Json -Depth 5
  $tempPath = "$RuntimeJson.tmp"
  $json | Set-Content -LiteralPath $tempPath -Encoding utf8
  Move-Item -LiteralPath $tempPath -Destination $RuntimeJson -Force
}

function Get-WatchPid {
  if (-not (Test-Path -LiteralPath $WatchPidFile)) { return $null }
  try {
    $raw = Get-Content -LiteralPath $WatchPidFile -Raw
    if (-not $raw) { return $null }
    return [int]$raw.Trim()
  } catch {
    return $null
  }
}

function Test-WatchRunning {
  $watchPid = Get-WatchPid
  if (-not $watchPid) { return $false }
  return [bool](Get-Process -Id $watchPid -ErrorAction SilentlyContinue)
}

function Write-WatchPid {
  param([int]$WatchPid)
  Set-Content -LiteralPath $WatchPidFile -Value $WatchPid -Encoding ascii
}

function Clear-WatchPid {
  Remove-Item -LiteralPath $WatchPidFile -ErrorAction SilentlyContinue
}

function Start-VerificationWatchLoop {
  Write-RuntimeState -Task 'watch-full' -Status 'watching' -Message "Watch mode active. Running every $WatchIntervalSeconds seconds." -ExitCode 0 -Extra @{
    watchActive = $true
    watchIntervalSeconds = $WatchIntervalSeconds
    watchIteration = 0
    watchStartedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    watchLastCycleAt = ''
    watchLastCycleMessage = ''
    watchLastCycleStatus = 'idle'
    watchPid = $PID
  }

  $iteration = 0
  try {
    while ($true) {
      $iteration++
      $cycleStartedAt = Get-Date
      try {
        $message = Invoke-Task -Task 'full'
        Write-RuntimeState -Task 'watch-full' -Status 'watching' -Message $message -ExitCode 0 -Extra @{
          watchActive = $true
          watchIntervalSeconds = $WatchIntervalSeconds
          watchIteration = $iteration
          watchStartedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
          watchLastCycleAt = $cycleStartedAt.ToString('yyyy-MM-dd HH:mm:ss')
          watchLastCycleMessage = $message
          watchLastCycleStatus = 'ok'
          watchPid = $PID
        }
      } catch {
        Write-RuntimeState -Task 'watch-full' -Status 'watching' -Message $_.Exception.Message -ExitCode 1 -Extra @{
          watchActive = $true
          watchIntervalSeconds = $WatchIntervalSeconds
          watchIteration = $iteration
          watchStartedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
          watchLastCycleAt = $cycleStartedAt.ToString('yyyy-MM-dd HH:mm:ss')
          watchLastCycleMessage = $_.Exception.Message
          watchLastCycleStatus = 'error'
          watchPid = $PID
        }
      }

      $sleepEnd = (Get-Date).AddSeconds($WatchIntervalSeconds)
      while ((Get-Date) -lt $sleepEnd) {
        Start-Sleep -Seconds 1
      }
    }
  } finally {
    Clear-WatchPid
  }
}

function Start-WatchProcess {
  if (Test-WatchRunning) {
    $watchPid = Get-WatchPid
    return "Watch mode is already running (PID $watchPid)."
  }

  $args = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', $PSCommandPath,
    '-WatchFull',
    '-WatchIntervalSeconds', $WatchIntervalSeconds
  )
  $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList $args -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru
  Write-WatchPid -WatchPid $proc.Id
  Start-Sleep -Seconds 1
  return "Watch mode started (PID $($proc.Id))."
}

function Stop-WatchProcess {
  $watchPid = Get-WatchPid
  if (-not $watchPid) {
    return 'Watch mode is not running.'
  }

  Stop-Process -Id $watchPid -ErrorAction SilentlyContinue
  Clear-WatchPid
  Write-RuntimeState -Task 'watch-full' -Status 'stopped' -Message 'Watch mode stopped.' -ExitCode 0 -Extra @{
    watchActive = $false
    watchIntervalSeconds = $WatchIntervalSeconds
    watchIteration = 0
    watchStartedAt = ''
    watchLastCycleAt = ''
    watchLastCycleMessage = 'Watch mode stopped.'
    watchLastCycleStatus = 'stopped'
    watchPid = $null
  }
  return "Watch mode stopped (PID $watchPid)."
}

function Invoke-InDirectory {
  param(
    [string]$Path,
    [scriptblock]$ScriptBlock
  )

  Push-Location $Path
  try {
    & $ScriptBlock
  } finally {
    Pop-Location
  }
}

function Start-PortalServicesIfNeeded {
  $webUp = Test-NetConnection -ComputerName 'localhost' -Port 3000 -InformationLevel Quiet
  $phpUp = Test-NetConnection -ComputerName 'localhost' -Port 8080 -InformationLevel Quiet
  if ($webUp -and $phpUp) { return }

  $startScript = Join-Path $RepoRoot 'start-dev.ps1'
  if (-not (Test-Path -LiteralPath $startScript)) {
    throw "Cannot start services because $startScript was not found."
  }

  Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', $startScript,
    '-NoMobile'
  ) -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null

  $deadline = (Get-Date).AddMinutes(2)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 750
    $webUp = Test-NetConnection -ComputerName 'localhost' -Port 3000 -InformationLevel Quiet
    $phpUp = Test-NetConnection -ComputerName 'localhost' -Port 8080 -InformationLevel Quiet
    if ($webUp -and $phpUp) { return }
  }

  throw 'Timed out waiting for localhost:3000 and localhost:8080.'
}

function Invoke-Task {
  param([string]$Task)

  switch ($Task) {
    'start-services' {
      Start-PortalServicesIfNeeded
      return 'Portal services are running.'
    }
    'web-typecheck' {
      Invoke-InDirectory -Path $WebRoot -ScriptBlock { & pnpm typecheck }
      return 'Web typecheck passed.'
    }
    'mobile-typecheck' {
      Invoke-InDirectory -Path (Join-Path $RepoRoot 'apps\mobile') -ScriptBlock { & pnpm exec tsc --noEmit }
      return 'Mobile TypeScript check passed.'
    }
    'php-lint' {
      $phpFiles = Get-ChildItem -Path $PhpRoot -Recurse -Filter *.php -File
      foreach ($file in $phpFiles) {
        & php -l $file.FullName | Out-Null
      }
      return "PHP lint passed for $($phpFiles.Count) files."
    }
    'parity' {
      Start-PortalServicesIfNeeded
      Invoke-InDirectory -Path $WebRoot -ScriptBlock { & node scripts/check-portal-parity.mjs }
      return 'Live parity check passed.'
    }
    'full' {
      $messages = New-Object System.Collections.Generic.List[string]
      try {
        Invoke-InDirectory -Path $WebRoot -ScriptBlock { & pnpm typecheck | Out-Null }
        $messages.Add('Web typecheck passed.')

        Invoke-InDirectory -Path (Join-Path $RepoRoot 'apps\mobile') -ScriptBlock { & pnpm exec tsc --noEmit | Out-Null }
        $messages.Add('Mobile TypeScript check passed.')

        $phpFiles = Get-ChildItem -Path $PhpRoot -Recurse -Filter *.php -File
        foreach ($file in $phpFiles) {
          & php -l $file.FullName | Out-Null
        }
        $messages.Add("PHP lint passed for $($phpFiles.Count) files.")

        Start-PortalServicesIfNeeded

        Invoke-InDirectory -Path $WebRoot -ScriptBlock { & node scripts/check-portal-parity.mjs | Out-Null }
        $messages.Add('Live parity check passed.')
      } catch {
        throw
      }
      return ($messages -join ' ')
    }
    'watch-start' {
      return Start-WatchProcess
    }
    'watch-stop' {
      return Stop-WatchProcess
    }
    default {
      throw "Unsupported task: $Task"
    }
  }
}

function Send-Json {
  param(
    $Context,
    [int]$StatusCode,
    $Payload
  )

  $json = $Payload | ConvertTo-Json -Depth 8
  $buffer = [Text.Encoding]::UTF8.GetBytes($json)
  $Context.Response.StatusCode = $StatusCode
  $Context.Response.ContentType = 'application/json; charset=utf-8'
  $Context.Response.ContentLength64 = $buffer.Length
  $Context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
  $Context.Response.OutputStream.Close()
}

function Send-Text {
  param(
    $Context,
    [int]$StatusCode,
    [string]$Content,
    [string]$ContentType = 'text/plain; charset=utf-8'
  )

  $buffer = [Text.Encoding]::UTF8.GetBytes($Content)
  $Context.Response.StatusCode = $StatusCode
  $Context.Response.ContentType = $ContentType
  $Context.Response.ContentLength64 = $buffer.Length
  $Context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
  $Context.Response.OutputStream.Close()
}

function Send-File {
  param(
    $Context,
    [string]$Path,
    [string]$ContentType
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    Send-Text -Context $Context -StatusCode 404 -Content 'Not found.'
    return
  }

  $bytes = [IO.File]::ReadAllBytes($Path)
  $Context.Response.StatusCode = 200
  $Context.Response.ContentType = $ContentType
  $Context.Response.ContentLength64 = $bytes.Length
  $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Context.Response.OutputStream.Close()
}

$listener = [System.Net.HttpListener]::new()
$effectiveWatchRunning = Test-WatchRunning
if ($WatchFull) {
  Start-VerificationWatchLoop
  exit 0
}
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "PBI rollout dashboard server listening on http://localhost:$Port/" -ForegroundColor Green

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = $context.Request.Url.AbsolutePath.TrimEnd('/')
    if (-not $path) { $path = '/' }

    try {
      switch ($path) {
        '/' {
          Send-File -Context $context -Path $StatusHtml -ContentType 'text/html; charset=utf-8'
        }
        '/api/state' {
          Send-Json -Context $context -StatusCode 200 -Payload (Get-Snapshot)
        }
        '/api/run' {
          $task = $context.Request.QueryString['task']
          if (-not $task) {
            Send-Json -Context $context -StatusCode 400 -Payload @{ ok = $false; error = 'Missing task.' }
            continue
          }
          $message = Invoke-Task -Task $task
          Write-RuntimeState -Task $task -Status 'ok' -Message $message -ExitCode 0
          Send-Json -Context $context -StatusCode 200 -Payload @{ ok = $true; task = $task; message = $message }
        }
        '/api/watch/start' {
          $message = Start-WatchProcess
          Send-Json -Context $context -StatusCode 200 -Payload @{ ok = $true; task = 'watch-start'; message = $message }
        }
        '/api/watch/stop' {
          $message = Stop-WatchProcess
          Send-Json -Context $context -StatusCode 200 -Payload @{ ok = $true; task = 'watch-stop'; message = $message }
        }
        '/docs/pbi-rollout-status.md' {
          Send-File -Context $context -Path $StatusMd -ContentType 'text/markdown; charset=utf-8'
        }
        '/docs/pbi-task-queue.md' {
          Send-File -Context $context -Path $QueueMd -ContentType 'text/markdown; charset=utf-8'
        }
        default {
          Send-Text -Context $context -StatusCode 404 -Content 'Not found.'
        }
      }
    } catch {
      $failedTask = $context.Request.QueryString['task']
      if (-not $failedTask) {
        $failedTask = 'unknown'
      }
      Write-RuntimeState -Task $failedTask -Status 'error' -Message $_.Exception.Message -ExitCode 1 -Extra @{
        watchActive = (Test-WatchRunning)
        watchPid = Get-WatchPid
      }
      Send-Json -Context $context -StatusCode 500 -Payload @{ ok = $false; error = $_.Exception.Message }
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
