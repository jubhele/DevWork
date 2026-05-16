# BlackFire Solutions — Branded Word Document Generator
# Converts .md files in C:\DevWork\BlackFire to branded .docx
# NOTE: Uses [char] escapes for all non-ASCII to avoid PS5.1 UTF-8/CP1252 mismatch.

$ErrorActionPreference = 'Continue'

# === BRAND COLORS  (Word RGB integer: R + G*256 + B*65536) ===
function WdRGB($r, $g, $b) { [int]($r + ($g * 256) + ($b * 65536)) }

$FC = @{
    FireOrange = WdRGB 224 90  26   # #E05A1A
    EmberRed   = WdRGB 192 57  43   # #C0392B
    Ash        = WdRGB 122 134 153  # #7A8699
    DarkText   = WdRGB 26  24  20   # #1A1814
    White      = WdRGB 255 255 255
    BonePaper  = WdRGB 245 241 234  # #F5F1EA
    Divider    = WdRGB 200 193 179  # #C8C1B3
    CodeBg     = WdRGB 243 242 240
    NavyHdr    = WdRGB 20  27  38   # #141B26
    Auto       = -16777216          # wdColorAutomatic
}

$LOGO    = 'C:\DevWork\BlackFire\BlackFire-Brand-Pack\blackfire-logo.png'
$MD_DIR  = 'C:\DevWork\BlackFire'
$BULLET  = [char]0x2022             # avoid CP1252 encoding problem

# Word constants
$wdFormatDocx          = 16
$wdAlignLeft           = 0
$wdAlignCenter         = 1
$wdAlignRight          = 2
$wdCollapseEnd         = 0
$wdCollapseStart       = 1
$wdHeaderFooterPrimary = 1
$wdBorderTop           = -1
$wdBorderLeft          = -4
$wdBorderBottom        = -3
$wdLineStyleSingle     = 1
$wdLineWidth050pt      = 4
$wdLineWidth100pt      = 8
$wdLineWidth150pt      = 12

# ── Strip all inline markers for plain text (table cells, etc.)
function Remove-InlineMarkdown($text) {
    $text -replace '\*\*', '' -replace '`([^`]+)`', '$1' -replace '(?<!\*)\*(?!\*)([^*]+)\*(?!\*)', '$1'
}

# ── Write inline **bold**, *italic*, and `code` to current Selection
function Write-Inline($sel, $text) {
    # Split on **, *italic*, and `code` spans — order matters (** before *)
    $pattern = '(\*\*|`[^`]+`|\*(?!\*)[^*]+\*(?!\*))'
    $parts   = [regex]::Split($text, $pattern)
    $bold    = $false

    foreach ($p in $parts) {
        if ($p -eq '')   { continue }
        if ($p -eq '**') { $bold = !$bold; continue }

        if ($p -match '^`(.+)`$') {
            $pn = $sel.Font.Name; $ps = $sel.Font.Size
            $sel.Font.Name = 'Consolas'; $sel.Font.Size = 9; $sel.Font.Bold = 0; $sel.Font.Italic = 0
            $sel.TypeText($Matches[1])
            $sel.Font.Name = $pn; $sel.Font.Size = $ps
            continue
        }

        if ($p -match '^\*(?!\*)([^*]+)\*(?!\*)$') {
            $sel.Font.Italic = -1
            $sel.Font.Bold   = if ($bold) { -1 } else { 0 }
            $sel.TypeText($Matches[1])
            $sel.Font.Italic = 0
            continue
        }

        $sel.Font.Bold = if ($bold) { -1 } else { 0 }
        $sel.TypeText($p)
    }
    $sel.Font.Bold   = 0
    $sel.Font.Italic = 0
}

# ── Reset to standard body text
function Reset-Sel($sel) {
    $sel.Font.Name   = 'Calibri'
    $sel.Font.Size   = 11
    $sel.Font.Bold   = 0
    $sel.Font.Italic = 0
    $sel.Font.Color  = $FC.DarkText
    $sel.Shading.BackgroundPatternColor = $FC.Auto
    $pf = $sel.ParagraphFormat
    $pf.LeftIndent   = 0
    $pf.RightIndent  = 0
    $pf.SpaceBefore  = 0
    $pf.SpaceAfter   = 6
    $pf.Alignment    = $wdAlignLeft
    try { $pf.Borders.Item($wdBorderLeft).LineStyle   = 0 } catch {}
    try { $pf.Borders.Item($wdBorderBottom).LineStyle = 0 } catch {}
    try { $pf.Borders.Item($wdBorderTop).LineStyle    = 0 } catch {}
}

# ── Build Word table from collected MD rows
function Write-WordTable($doc, $sel, [string[]]$rows) {
    $parsed = [System.Collections.Generic.List[string[]]]::new()
    foreach ($row in $rows) {
        $r = $row.Trim()
        if ($r -match '^\|[-:\s|]+\|$') { continue }
        $cells = ($r -split '\|' | Where-Object { $_ -ne '' }) | ForEach-Object { $_.Trim() }
        if ($cells.Count) { $parsed.Add($cells) }
    }
    if ($parsed.Count -eq 0) { return }

    $numCols = ($parsed | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
    $numRows = $parsed.Count

    Reset-Sel $sel
    $tbl = $doc.Tables.Add($sel.Range, $numRows, $numCols)
    $tbl.Borders.Enable = 1

    for ($ri = 0; $ri -lt $parsed.Count; $ri++) {
        $rowData = $parsed[$ri]
        for ($ci = 0; $ci -lt [Math]::Min($rowData.Count, $numCols); $ci++) {
            $cell    = $tbl.Cell($ri + 1, $ci + 1)
            $cellTxt = Remove-InlineMarkdown $rowData[$ci]
            $cell.Range.Text                      = $cellTxt
            $cell.Range.Font.Name                 = 'Calibri'
            $cell.Range.Font.Size                 = 10
            $cell.Range.Font.Color                = $FC.DarkText
            $cell.Range.Font.Bold                 = if ($rowData[$ci] -match '\*\*') { -1 } else { 0 }
            $cell.Range.Paragraphs(1).Alignment   = $wdAlignLeft
            if ($ri -eq 0) {
                $cell.Shading.BackgroundPatternColor = $FC.NavyHdr
                $cell.Range.Font.Color               = $FC.White
                $cell.Range.Font.Bold                = -1
                $cell.Range.Font.Size                = 9
                $cell.Range.Paragraphs(1).Alignment  = $wdAlignCenter
            } elseif ($ri % 2 -eq 0) {
                $cell.Shading.BackgroundPatternColor = $FC.BonePaper
            }
        }
    }
    try { $tbl.Columns.AutoFit() } catch {}

    $after = $tbl.Range.Duplicate
    $after.Collapse($wdCollapseEnd)
    $after.Select()
}

# ── Write a code block (array of lines)
function Write-CodeBlock($sel, [string[]]$codeLines) {
    if (-not $codeLines -or $codeLines.Count -eq 0) { return }
    for ($li = 0; $li -lt $codeLines.Count; $li++) {
        if ($li -gt 0) { $sel.TypeParagraph() }
        $sel.Font.Name   = 'Consolas'
        $sel.Font.Size   = 8
        $sel.Font.Bold   = 0
        $sel.Font.Italic = 0
        $sel.Font.Color  = $FC.DarkText
        $sel.Shading.BackgroundPatternColor = $FC.CodeBg
        $pf = $sel.ParagraphFormat
        $pf.LeftIndent   = 14
        $pf.RightIndent  = 14
        $pf.SpaceBefore  = 0
        $pf.SpaceAfter   = 0
        try {
            $pf.Borders.Item($wdBorderLeft).LineStyle = $wdLineStyleSingle
            $pf.Borders.Item($wdBorderLeft).Color     = $FC.FireOrange
            $pf.Borders.Item($wdBorderLeft).LineWidth = $wdLineWidth150pt
        } catch {}
        $sel.TypeText($codeLines[$li])
    }
}

# ================================================================
# MAIN
# ================================================================
Write-Host ''
Write-Host 'BlackFire Document Generator' -ForegroundColor Yellow
Write-Host '=============================' -ForegroundColor Yellow
Write-Host ''

$word = New-Object -ComObject Word.Application
$word.Visible       = $false
$word.DisplayAlerts = 0

$mdFiles = Get-ChildItem $MD_DIR -Filter '*.md' -File | Sort-Object Name

foreach ($mdFile in $mdFiles) {
    Write-Host "  Processing: $($mdFile.Name)" -ForegroundColor Cyan
    $doc = $null
    try {
        $doc = $word.Documents.Add()

        # ── A4 page in points
        $doc.PageSetup.PageWidth      = 595.28
        $doc.PageSetup.PageHeight     = 841.89
        $doc.PageSetup.TopMargin      = 80
        $doc.PageSetup.BottomMargin   = 72
        $doc.PageSetup.LeftMargin     = 80
        $doc.PageSetup.RightMargin    = 72
        $doc.PageSetup.HeaderDistance = 28
        $doc.PageSetup.FooterDistance = 28

        # ── HEADER ──────────────────────────────────────────────
        $hdr = $doc.Sections(1).Headers($wdHeaderFooterPrimary)
        $hdr.LinkToPrevious = $false

        # Logo — floating shape anchored to header (W/H explicit, avoids COM resize bug)
        try {
            $logoShape = $doc.Shapes.AddPicture($LOGO, $false, $true, 0, 0, 140, 53, $hdr.Range)
            $logoShape.WrapFormat.Type = 3   # wdWrapNone
        } catch {}

        # Header paragraph: left-indent clears logo area; right-aligned company label
        $textW = $doc.PageSetup.PageWidth - $doc.PageSetup.LeftMargin - $doc.PageSetup.RightMargin
        try { $hdr.Range.Paragraphs(1).LeftIndent = 148 } catch {}
        try { $hdr.Range.Paragraphs(1).TabStops.Add($textW, $wdAlignRight, 0) | Out-Null } catch {}

        # Write the label (tab → right edge)
        $hdr.Range.Select()
        $word.Selection.Collapse($wdCollapseEnd)
        $word.Selection.MoveLeft(1, 1) | Out-Null
        $word.Selection.TypeText("`tBLACKFIRE SOLUTIONS  |  CONFIDENTIAL")

        # Style header text
        $hdr.Range.Font.Name  = 'Consolas'
        $hdr.Range.Font.Size  = 7.5
        $hdr.Range.Font.Color = $FC.Ash
        $hdr.Range.Font.Bold  = 0

        # Orange underline
        try {
            $hb = $hdr.Range.Paragraphs(1).Borders.Item($wdBorderBottom)
            $hb.LineStyle = $wdLineStyleSingle
            $hb.Color     = $FC.FireOrange
            $hb.LineWidth = $wdLineWidth100pt
        } catch {}

        # ── FOOTER ──────────────────────────────────────────────
        $ftr = $doc.Sections(1).Footers($wdHeaderFooterPrimary)
        $ftr.LinkToPrevious = $false
        $ftr.Range.Text = ([char]0x00A9) + ' 2026 BlackFire Solutions  ' + ([char]0x00B7) + '  Confidential'
        $ftr.Range.Font.Name  = 'Consolas'
        $ftr.Range.Font.Size  = 7.5
        $ftr.Range.Font.Color = $FC.Ash
        $ftr.Range.Font.Bold  = 0
        $ftr.Range.Paragraphs(1).Alignment = $wdAlignCenter
        try {
            $fb = $ftr.Range.Paragraphs(1).Borders.Item($wdBorderTop)
            $fb.LineStyle = $wdLineStyleSingle
            $fb.Color     = $FC.Divider
            $fb.LineWidth = $wdLineWidth050pt
        } catch {}

        # ── Move cursor to START OF DOCUMENT BODY (not header/footer) ──
        $doc.Content.Select()
        $sel = $word.Selection
        $sel.Collapse($wdCollapseStart)

        # ── PARSE AND WRITE CONTENT ──────────────────────────────
        $lines     = Get-Content $mdFile.FullName -Encoding UTF8
        $inCode    = $false
        $codeLines = [System.Collections.Generic.List[string]]::new()
        $inTable   = $false
        $tableRows = [System.Collections.Generic.List[string]]::new()
        $isFirst   = $true

        function NP {
            if (-not $isFirst) { $sel.TypeParagraph() }
            $script:isFirst = $false
        }

        foreach ($line in $lines) {

            # ── Code block toggle
            if ($line -match '^```') {
                if ($inCode) {
                    if (-not $isFirst) { NP }
                    Write-CodeBlock $sel $codeLines.ToArray()
                    $codeLines.Clear(); $inCode = $false; $isFirst = $false
                } else {
                    if ($inTable) {
                        NP; Write-WordTable $doc $sel $tableRows.ToArray()
                        $tableRows.Clear(); $inTable = $false; $isFirst = $false
                    }
                    $inCode = $true
                }
                continue
            }
            if ($inCode) { $codeLines.Add($line); continue }

            # ── Table
            if ($line -match '^\s*\|') {
                if (-not $inTable) { $inTable = $true; $tableRows.Clear() }
                $tableRows.Add($line); continue
            } elseif ($inTable) {
                NP; Write-WordTable $doc $sel $tableRows.ToArray()
                $tableRows.Clear(); $inTable = $false; $isFirst = $false
            }

            # ── Horizontal rule
            if ($line -match '^---+\s*$') {
                NP; Reset-Sel $sel
                $sel.Font.Size = 2; $sel.Font.Color = $FC.Auto
                $sel.ParagraphFormat.SpaceBefore = 4
                $sel.ParagraphFormat.SpaceAfter  = 4
                try {
                    $b = $sel.ParagraphFormat.Borders.Item($wdBorderBottom)
                    $b.LineStyle = $wdLineStyleSingle; $b.Color = $FC.Divider; $b.LineWidth = $wdLineWidth050pt
                } catch {}
                $sel.TypeText(' '); continue
            }

            # ── Heading
            if ($line -match '^(#{1,6})\s+(.+)') {
                $lvl  = $Matches[1].Length
                $text = Remove-InlineMarkdown $Matches[2]
                NP; Reset-Sel $sel
                $pf = $sel.ParagraphFormat
                switch ($lvl) {
                    1 {
                        $sel.Font.Name  = 'Arial Black'
                        $sel.Font.Size  = 20
                        $sel.Font.Color = $FC.FireOrange
                        $pf.SpaceBefore = 18; $pf.SpaceAfter = 10
                        try {
                            $b = $pf.Borders.Item($wdBorderBottom)
                            $b.LineStyle = $wdLineStyleSingle; $b.Color = $FC.FireOrange; $b.LineWidth = $wdLineWidth100pt
                        } catch {}
                    }
                    2 {
                        $sel.Font.Name  = 'Arial'
                        $sel.Font.Size  = 14
                        $sel.Font.Bold  = -1
                        $sel.Font.Color = $FC.EmberRed
                        $pf.SpaceBefore = 16; $pf.SpaceAfter = 6
                    }
                    3 {
                        $sel.Font.Name  = 'Arial'
                        $sel.Font.Size  = 12
                        $sel.Font.Bold  = -1
                        $sel.Font.Color = $FC.FireOrange
                        $pf.SpaceBefore = 12; $pf.SpaceAfter = 4
                    }
                    4 {
                        $sel.Font.Name  = 'Arial'
                        $sel.Font.Size  = 11
                        $sel.Font.Bold  = -1
                        $sel.Font.Color = $FC.DarkText
                        $pf.SpaceBefore = 8;  $pf.SpaceAfter = 3
                    }
                    default {
                        $sel.Font.Name  = 'Calibri'
                        $sel.Font.Size  = 11
                        $sel.Font.Bold  = -1
                        $sel.Font.Color = $FC.Ash
                        $pf.SpaceBefore = 6;  $pf.SpaceAfter = 2
                    }
                }
                $sel.TypeText($text); continue
            }

            # ── Blockquote
            if ($line -match '^>\s?(.*)') {
                $text = $Matches[1]; if ($text.Trim() -eq '') { continue }
                NP; Reset-Sel $sel
                $sel.Font.Italic = -1
                $sel.Font.Color  = $FC.Ash
                $sel.Font.Size   = 10
                $pf = $sel.ParagraphFormat
                $pf.LeftIndent  = 28; $pf.SpaceBefore = 2; $pf.SpaceAfter = 2
                try {
                    $b = $pf.Borders.Item($wdBorderLeft)
                    $b.LineStyle = $wdLineStyleSingle; $b.Color = $FC.FireOrange; $b.LineWidth = $wdLineWidth150pt
                } catch {}
                Write-Inline $sel $text; continue
            }

            # ── Bullet or numbered list
            if ($line -match '^(\s*)([-*]|\d+\.)\s+(.+)') {
                $indent = $Matches[1].Length
                $text   = $Matches[3]
                NP; Reset-Sel $sel
                $sel.Font.Size = 10.5
                $pf = $sel.ParagraphFormat
                $pf.LeftIndent  = 20 + ($indent * 5)
                $pf.SpaceBefore = 1
                $pf.SpaceAfter  = 2
                $sel.Font.Color = $FC.FireOrange; $sel.Font.Bold = -1
                $sel.TypeText($BULLET + '  ')
                $sel.Font.Color = $FC.DarkText;  $sel.Font.Bold  = 0
                Write-Inline $sel $text; continue
            }

            # ── Skip blank lines (spacing already handled by SpaceAfter)
            if ($line.Trim() -eq '') { continue }

            # ── Normal paragraph (strip trailing MD line-break spaces)
            NP; Reset-Sel $sel
            Write-Inline $sel ($line.TrimEnd().TrimEnd(' '))
        }

        # Flush any trailing table or code block
        if ($inTable -and $tableRows.Count -gt 0) {
            NP; Write-WordTable $doc $sel $tableRows.ToArray()
        }
        if ($inCode -and $codeLines.Count -gt 0) {
            if (-not $isFirst) { NP }
            Write-CodeBlock $sel $codeLines.ToArray()
        }

        # ── Save as .docx
        $outPath = [System.IO.Path]::ChangeExtension($mdFile.FullName, '.docx')
        $doc.SaveAs2($outPath, $wdFormatDocx)
        $doc.Close($false)
        $doc = $null
        Write-Host "    Saved: $(Split-Path $outPath -Leaf)" -ForegroundColor Green

    } catch {
        Write-Host "    ERROR: $_" -ForegroundColor Red
        if ($doc) { try { $doc.Close($false) } catch {}; $doc = $null }
    }
}

$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host ''
Write-Host 'Done.' -ForegroundColor Yellow
