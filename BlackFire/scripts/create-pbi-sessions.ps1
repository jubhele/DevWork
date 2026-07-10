param(
    [ValidateSet('Root', 'PortalSessions', 'MirrorOnly')]
    [string]$Target = 'PortalSessions',
    [string]$StartTimestamp,
    [string]$BatchName,
    [switch]$DryRun,
    [string]$Provider = 'OpenAI Codex',
    [string]$Model = 'GPT-5',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$WorkspaceRoot = 'C:\DevWork'
$MirrorRoot = 'G:\My Drive\JS\Agentic AI\sessions'

function Get-TargetDirectories {
    param([string]$Mode)

    switch ($Mode) {
        'Root' {
            return @($WorkspaceRoot, $MirrorRoot)
        }
        'PortalSessions' {
            return @((Join-Path $RepoRoot 'sessions'), $MirrorRoot)
        }
        'MirrorOnly' {
            return @($MirrorRoot)
        }
        default {
            throw "Unsupported target mode: $Mode"
        }
    }
}

function New-Slug {
    param([string]$Text)
    $slug = $Text.ToLowerInvariant()
    $slug = $slug -replace '[^a-z0-9]+', '_'
    $slug = $slug.Trim('_')
    return $slug
}

function Get-BatchStamp {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return (Get-Date -Format 'yyyyMMdd_HHmmss')
    }

    $normalized = $Value.Trim()
    $formats = @(
        'yyyyMMdd_HHmmss',
        'yyyy-MM-dd_HH-mm-ss',
        'yyyy-MM-dd HH:mm:ss',
        'yyyy-MM-ddTHH:mm:ss',
        'yyyy-MM-ddTHH:mm:ssZ'
    )

    foreach ($format in $formats) {
        try {
            $parsed = [datetime]::ParseExact($normalized, $format, $null)
            return $parsed.ToString('yyyyMMdd_HHmmss')
        } catch {
        }
    }

    $parsedLoose = [datetime]::Parse($normalized)
    return $parsedLoose.ToString('yyyyMMdd_HHmmss')
}

function Get-SessionHeading {
    param(
        [string]$BatchLabel,
        [string]$Topic
    )

    if ([string]::IsNullOrWhiteSpace($BatchLabel)) {
        return "blackfire power bi $Topic"
    }

    return "blackfire power bi [$BatchLabel] $Topic"
}

function Get-KickoffTemplate {
    param(
        [string]$Heading,
        [string]$DateText,
        [string]$BriefPath
    )

@"
# Session: $Heading
Date: $DateText
Provider: $Provider
Model: $Model

## Goal
Kick off the PBI brief pack run using $BriefPath so the shared foundation starts the rollout sequence.

## Goal Status
PENDING

## Decisions
- The brief pack is the process starter for this rollout batch.
- Shared foundation remains the first implementation session after kickoff.
- Each rerun of the generator should keep producing a fresh kickoff file even if the same timestamp is reused.

## Work Done

## Blockers / Next Steps
- Start the shared foundation session after kickoff.

## Learnings

## Session Brief
- Owner: Mlawuli
- Supporting owners: Sibali, Umdwebi, Umakhi, Umbheki, Mvavanyi

## Tasks
- Confirm the queue and brief pack are in place.
- Start the shared foundation brief first.
- Keep the remaining page briefs staged for parallel rollout after foundation.

## Deliverables
- Kickoff confirmation
- Shared foundation start signal

## Done When
- The brief pack run has been kicked off.
- The shared foundation session is ready to start.
"@
}

function Get-SessionTemplate {
    param(
        [string]$Topic,
        [string]$DateText,
        [string]$Heading,
        [string]$BriefPath,
        [string]$Owner,
        [string]$SupportingOwners,
        [string[]]$Tasks,
        [string[]]$Deliverables,
        [string[]]$DoneWhen,
        [string]$Dependency
    )

    $taskLines = ($Tasks | ForEach-Object { "- $_" }) -join [Environment]::NewLine
    $deliverableLines = ($Deliverables | ForEach-Object { "- $_" }) -join [Environment]::NewLine
    $doneLines = ($DoneWhen | ForEach-Object { "- $_" }) -join [Environment]::NewLine

@"
# Session: $Heading
Date: $DateText
Provider: $Provider
Model: $Model

## Goal
Run the $Topic session from the PBI queue using $BriefPath and deliver the page or foundation work in a cross-layer pass.

## Goal Status
PENDING

## Decisions
- Use Power BI as the layout reference only.
- Keep this session aligned with the shared queue order and the source brief.
- Treat the relevant Next.js, PHP, and mobile surfaces as the execution targets for this session.

## Work Done

## Blockers / Next Steps
- Next dependency: $Dependency

## Learnings

## Session Brief
- Owner: $Owner
- Supporting owners: $SupportingOwners

## Tasks
$taskLines

## Deliverables
$deliverableLines

## Done When
$doneLines
"@
}

$briefPackKickoff = @{
    Topic = 'brief_pack_kickoff'
    Brief = 'docs/pbi-session-briefs/index.md'
    Owner = 'Mlawuli'
    Support = 'Sibali, Umdwebi, Umakhi, Umbheki, Mvavanyi'
    Tasks = @(
        'Confirm the brief pack index and queue are present.',
        'Start the shared foundation brief first.',
        'Stage the remaining page briefs for the later parallel run.'
    )
    Deliverables = @(
        'Kickoff confirmation',
        'Shared foundation start signal'
    )
    DoneWhen = @(
        'The brief pack run has been kicked off.',
        'The shared foundation session is ready to start.'
    )
    Dependency = 'None; this is the process starter.'
}

$queue = @(
    @{
        Topic = 'shared_foundation'
        Brief = 'docs/pbi-session-briefs/shared-foundation.md'
        Owner = 'Umdwebi'
        Support = 'Umakhi, Umbheki, Mvavanyi, Sibali'
        Tasks = @(
            'Audit the Power BI tokens and current UI primitives.',
            'Define shared color, typography, spacing, elevation, and border tokens.',
            'Build reusable header, KPI card, chart wrapper, and list fallback patterns.',
            'Define the mobile collapse rules and narrow-width behavior.',
            'Review the foundation with UX and functional QA.'
        )
        Deliverables = @(
            'Shared design token spec',
            'Shared layout primitive spec',
            'Mobile collapse rules',
            'QA notes for the foundation'
        )
        DoneWhen = @(
            'PHP, Next.js, and mobile can all reuse the same visual language.',
            'The shared primitives are ready for the page sessions.'
        )
        Dependency = 'None; this is the first session.'
    }
    @{
        Topic = 'executive_dashboard'
        Brief = 'docs/pbi-session-briefs/executive-dashboard.md'
        Owner = 'Umakhi'
        Support = 'Umdwebi, Mvavanyi, Umbheki'
        Tasks = @(
            'Review the Executive Dashboard page structure from Power BI.',
            'Build the PHP dashboard shell and responsive card stack.',
            'Build or align the Next.js /dashboard page with the same section order.',
            'Update the mobile dashboard screen to mirror the hero, KPI strip, trend row, and status cards.',
            'Verify desktop, tablet, and phone layouts.'
        )
        Deliverables = @(
            'Dashboard page in PHP',
            'Dashboard page in Next.js',
            'Dashboard screen in mobile',
            'QA notes and screenshots'
        )
        DoneWhen = @(
            'The page order and hierarchy match across all three surfaces.',
            'The dashboard reads clearly on mobile.'
        )
        Dependency = 'Shared Foundation'
    }
    @{
        Topic = 'finance_reporting'
        Brief = 'docs/pbi-session-briefs/finance-reporting.md'
        Owner = 'Umakhi'
        Support = 'Umdwebi, Mvavanyi, Umbheki'
        Tasks = @(
            'Review the Finance Reporting page structure from Power BI.',
            'Build the PHP finance summary blocks and list/table fallback.',
            'Align the Next.js /finance route with the native shell and embedded reporting view.',
            'Rework the mobile finance view so it stays readable without horizontal scrolling.',
            'Validate finance KPIs, trends, breakdowns, and aging/status views.'
        )
        Deliverables = @(
            'Finance page in PHP',
            'Finance page in Next.js',
            'Finance screen in mobile',
            'QA notes and screenshots'
        )
        DoneWhen = @(
            'Finance data is readable without pinch-zoom.',
            'The Power BI embed and native shell feel visually consistent.'
        )
        Dependency = 'Executive Dashboard or Shared Foundation if run independently'
    }
    @{
        Topic = 'safety_compliance'
        Brief = 'docs/pbi-session-briefs/safety-compliance.md'
        Owner = 'Umakhi'
        Support = 'Umdwebi, Mvavanyi, Umbheki'
        Tasks = @(
            'Review the Safety & Compliance page structure from Power BI.',
            'Build compliance summary cards and regional blocks in PHP.',
            'Build the matching Next.js safety route and section order.',
            'Update the mobile safety/compliance screen to show status first and detail second.',
            'Confirm the page stays readable on narrow screens.'
        )
        Deliverables = @(
            'Safety/compliance page in PHP',
            'Safety/compliance page in Next.js',
            'Safety/compliance screen in mobile',
            'QA notes and screenshots'
        )
        DoneWhen = @(
            'Compliance state is obvious in the first screenful.',
            'The page degrades cleanly on mobile.'
        )
        Dependency = 'Finance Reporting or Shared Foundation if run independently'
    }
    @{
        Topic = 'operations_tasks'
        Brief = 'docs/pbi-session-briefs/operations-tasks.md'
        Owner = 'Umakhi'
        Support = 'Umdwebi, Mvavanyi, Umbheki'
        Tasks = @(
            'Review the Operations Tasks page structure from Power BI.',
            'Build open-task, assignee-load, and due/overdue sections in PHP.',
            'Align the Next.js /ops/tasks and /tracker routes with the same hierarchy.',
            'Rework the mobile tracker and operations screens to use cards and compact lists.',
            'Validate tap targets and small-screen readability.'
        )
        Deliverables = @(
            'Operations/tasks page in PHP',
            'Operations/tasks page in Next.js',
            'Operations/task screens in mobile',
            'QA notes and screenshots'
        )
        DoneWhen = @(
            'The open-work picture is clear at a glance.',
            'The page remains usable on phones.'
        )
        Dependency = 'Safety & Compliance or Shared Foundation if run independently'
    }
    @{
        Topic = 'ledger'
        Brief = 'docs/pbi-session-briefs/ledger.md'
        Owner = 'Umakhi'
        Support = 'Umdwebi, Umcwaningi, Mvavanyi, Umbheki'
        Tasks = @(
            'Review the Ledger page structure from Power BI.',
            'Build the ledger summary cards and transaction trend in PHP.',
            'Add the ledger deep-dive section under finance in Next.js.',
            'Create the mobile ledger view with a vertical transaction feed or expandable rows.',
            'Run code QA because this is the most detail-heavy page.'
        )
        Deliverables = @(
            'Ledger page in PHP',
            'Ledger page in Next.js',
            'Ledger view in mobile',
            'QA notes and screenshots'
        )
        DoneWhen = @(
            'The ledger remains audit-friendly.',
            'No important information is trapped in a wide table.'
        )
        Dependency = 'Operations Tasks or Shared Foundation if run independently'
    }
    @{
        Topic = 'integration_release_qa'
        Brief = 'docs/pbi-session-briefs/integration-release-qa.md'
        Owner = 'Mvavanyi'
        Support = 'Umbheki, Umcwaningi, Umlindi'
        Tasks = @(
            'Run end-to-end checks across all pages.',
            'Verify route order and shared hierarchy.',
            'Check desktop, tablet, and phone layouts.',
            'Confirm no page depends on brittle SVG card rendering.',
            'Perform governance and compliance review.'
        )
        Deliverables = @(
            'Cross-layer QA report',
            'Final issues list',
            'Release-ready signoff notes'
        )
        DoneWhen = @(
            'All pages match the shared layout language.',
            'The rollout is ready for ship or final implementation.'
        )
        Dependency = 'All page sessions completed'
    }
)

$dateText = Get-Date -Format 'yyyy-MM-dd'
$runStamp = Get-BatchStamp -Value $StartTimestamp
$created = @()
$targetDirs = Get-TargetDirectories -Mode $Target

if (-not $DryRun.IsPresent) {
    foreach ($dir in $targetDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
        }
    }
}

function Get-UniqueTargetFileName {
    param(
        [string]$BaseName,
        [string[]]$Directories
    )

    $candidate = $BaseName
    $runIndex = 1

    while ($true) {
        $exists = $false
        foreach ($dir in $Directories) {
            if (Test-Path (Join-Path $dir $candidate)) {
                $exists = $true
                break
            }
        }

        if (-not $exists) {
            return $candidate
        }

        $runIndex++
        $candidate = '{0}_run{1:d2}.md' -f ([IO.Path]::GetFileNameWithoutExtension($BaseName)), $runIndex
    }
}

function Write-QueueItem {
    param(
        [hashtable]$Item,
        [int]$OrderNumber
    )

    $baseName = 'blackfire_power_bi_{0}_{1}_{2:d2}.md' -f (New-Slug $Item.Topic), $runStamp, $OrderNumber
    $fileName = if ($Force.IsPresent) { $baseName } else { Get-UniqueTargetFileName -BaseName $baseName -Directories $targetDirs }
    $heading = Get-SessionHeading -BatchLabel $BatchName -Topic $Item.Topic
    $content = Get-SessionTemplate `
        -Topic $Item.Topic `
        -DateText $dateText `
        -Heading $heading `
        -BriefPath $Item.Brief `
        -Owner $Item.Owner `
        -SupportingOwners $Item.Support `
        -Tasks $Item.Tasks `
        -Deliverables $Item.Deliverables `
        -DoneWhen $Item.DoneWhen `
        -Dependency $Item.Dependency

    if ($Item.Topic -eq 'brief_pack_kickoff') {
        $content = Get-KickoffTemplate -Heading $heading -DateText $dateText -BriefPath $Item.Brief
    }

    foreach ($dir in $targetDirs) {
        $path = Join-Path $dir $fileName

        if ($DryRun.IsPresent) {
            $script:created += $path
            continue
        }

        if ((Test-Path $path) -and $Force.IsPresent) {
            Set-Content -LiteralPath $path -Value $content -Encoding utf8
            $script:created += $path
            continue
        }

        if (Test-Path $path) {
            Set-Content -LiteralPath $path -Value $content -Encoding utf8
            $script:created += $path
            continue
        }

        Set-Content -LiteralPath $path -Value $content -Encoding utf8
        $script:created += $path
    }
}

Write-QueueItem -Item $briefPackKickoff -OrderNumber 0

foreach ($item in $queue) {
    $orderNumber = [array]::IndexOf($queue, $item) + 1
    Write-QueueItem -Item $item -OrderNumber $orderNumber
}

if ($created.Count -gt 0) {
    if ($DryRun.IsPresent) {
        Write-Host 'Would create session files:'
    } else {
        Write-Host 'Created session files:'
    }
    $created | ForEach-Object { Write-Host $_ }
} else {
    if ($DryRun.IsPresent) {
        Write-Host 'No session files would be created.'
    } else {
        Write-Host 'No new session files were created.'
    }
}
