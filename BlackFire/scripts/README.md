# PBI Session Generator

`create-pbi-sessions.ps1` stamps the Power BI rollout queue into session markdown files.

`pbi-rollout-status-server.ps1` serves the clickable local status dashboard at `http://localhost:8790/`.

## Target Modes

- `Root` writes to `C:\DevWork\sessions` and mirrors to `G:\My Drive\JS\Agentic AI\sessions`.
- `PortalSessions` writes to `C:\DevWork\BlackFire\sessions` and mirrors to `G:\My Drive\JS\Agentic AI\sessions`.
- `MirrorOnly` writes only to `G:\My Drive\JS\Agentic AI\sessions`.

## Copy-Paste Examples

## Run Steps

1. Open PowerShell.
2. Change into the repo root:

```powershell
cd C:\DevWork\BlackFire
```

3. Set a batch timestamp if you want the filenames to line up across a run:

```powershell
$currentTimestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
```

4. Run the generator with the target mode you need:

```powershell
.\scripts\create-pbi-sessions.ps1 -Target PortalSessions -StartTimestamp $currentTimestamp -BatchName "Power BI Rollout"
```

5. The generator also creates a brief-pack kickoff file before the shared foundation batch starts.
6. Use `-DryRun` first if you want to preview the file list.

### Root

```powershell
.\scripts\create-pbi-sessions.ps1 -Target Root
```

```powershell
$currentTimestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
.\scripts\create-pbi-sessions.ps1 -Target Root -StartTimestamp $currentTimestamp -BatchName "Power BI Rollout" -DryRun
```

### PortalSessions

```powershell
.\scripts\create-pbi-sessions.ps1 -Target PortalSessions
```

```powershell
$currentTimestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
.\scripts\create-pbi-sessions.ps1 -Target PortalSessions -StartTimestamp $currentTimestamp -BatchName "Power BI Rollout"
```

### MirrorOnly

```powershell
.\scripts\create-pbi-sessions.ps1 -Target MirrorOnly -DryRun
```

```powershell
$currentTimestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
.\scripts\create-pbi-sessions.ps1 -Target MirrorOnly -StartTimestamp $currentTimestamp -BatchName "Power BI Rollout"
```

## PBI Status Dashboard

Run the local dashboard server from the repo root:

```powershell
.\scripts\pbi-rollout-status-server.ps1
```

Then open:

```text
http://localhost:8790/
```

From the page you can run:

- `Run Full Verification`
- `Start Services`
- `Web Typecheck`
- `Mobile Typecheck`
- `PHP Lint`
- `Live Parity`

## Notes

- `-DryRun` prints the files that would be created and writes nothing.
- If you skip `-StartTimestamp`, the generator uses the current time automatically.
- `-StartTimestamp` accepts common timestamp formats and normalizes them into the session suffix.
- `-BatchName` adds a human-friendly label to the session title.
- `-Force` overwrites existing files if you intentionally regenerate a batch.
- If you rerun the same batch stamp, the generator creates fresh `_runNN` files instead of failing on duplicates.
