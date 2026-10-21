
param([switch]$WhatIf)
$files = @(
  'C:\DevWork\.claude\settings.json',
  'C:\Projects\BlackFire\.claude\settings.json',
  'C:\DevWork\.codex\hooks.json',
  'C:\DevWork\.cursor\hooks.json',
  'C:\DevWork\.factory\hooks.json',
  'C:\DevWork\.kiro\hooks\constitution.json',
  'C:\Projects\BlackFire\.kiro\hooks\constitution.json',
  'C:\DevWork\.agents\hooks.json'
)
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
function Remove-PreHooks($node) {
  if ($node -is [System.Management.Automation.PSCustomObject]) {
    foreach ($p in @($node.PSObject.Properties)) {
      if ($p.Name -match '^pre_?tool_?use$') { $node.PSObject.Properties.Remove($p.Name); continue }
      $p.Value = Remove-PreHooks $p.Value
    }
    return $node
  }
  if ($node -is [System.Array]) {
    $keep = @()
    foreach ($i in $node) {
      if ($i -is [System.Management.Automation.PSCustomObject] -and $i.trigger -match '^pre_?tool_?use$') { continue }
      $keep += ,(Remove-PreHooks $i)
    }
    return ,$keep
  }
  return $node
}
foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "SKIP (missing): $f"; continue }
  $json = Get-Content $f -Raw | ConvertFrom-Json
  $new  = Remove-PreHooks $json | ConvertTo-Json -Depth 100
  if ($WhatIf) { Write-Host "WOULD UPDATE: $f"; continue }
  $dir = Join-Path (Split-Path $f) '_backups'
  New-Item -ItemType Directory -Force $dir | Out-Null
  Copy-Item $f (Join-Path $dir ((Split-Path $f -Leaf) + ".backup_$ts"))
  [IO.File]::WriteAllText($f, $new, (New-Object Text.UTF8Encoding $false))
  Write-Host "UPDATED: $f"
}
