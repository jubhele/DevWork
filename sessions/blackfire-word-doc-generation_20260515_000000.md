# Session: BlackFire AECI — Branded Word Document Generation
Date: 2026-05-15
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Generate 6 professionally branded Microsoft Word (.docx) documents from existing Markdown (.md) files in `C:\DevWork\BlackFire\` using BlackFire brand assets (logo, colors, fonts). No Python/Node/Pandoc available — solution required PowerShell 5.1 Word COM automation entirely. First run produced encoding-corrupted output (`â€¢` bullets); session involved diagnosing and fixing multiple COM and encoding issues until all 6 documents generated correctly.

## Decisions
- Word COM automation (`New-Object -ComObject Word.Application`) chosen as only available generation method — no Pandoc, Python, or Node on this machine
- Logo inserted as floating `Shapes.AddPicture` (W=140, H=53) instead of InlineShape — InlineShape resize (Height/Width/LockAspectRatio/ScaleWidth) all throw COM exceptions on this machine
- A4 page size set via `PageWidth/PageHeight` points (595.28 × 841.89) instead of `PaperSize = 9` — PaperSize throws "not available on selected printer" error
- All non-ASCII characters in the .ps1 script use `[char]` escapes (`[char]0x2022` for •) — PS5.1 reads files as CP1252 without BOM, corrupting UTF-8 literals
- SaveAs uses `$doc.SaveAs2($path, 16)` not `$doc.SaveAs([ref]$path, [ref]16)` — ref syntax fails with COM
- Cursor reset to document body after header setup using `$doc.Content.Select()` — `HomeKey` can leave selection in header story
- Word RGB encoding: R + G×256 + B×65536 (not BGR)

## Work Done
- `C:\DevWork\BlackFire\generate_docs.ps1` — Created from scratch; full Markdown parser (headings, tables, code blocks, blockquotes, bullets, inline bold/italic/code) with BlackFire branding; iterated through multiple debug/fix cycles
- `AECI_Current_vs_Proposed_Comparison.docx` — Generated ✅
- `AECI_Drone_Surveillance_Addendum.docx` — Generated ✅
- `AECI_Executive_Summary.docx` — Generated ✅
- `AECI_Proposal_Letter.docx` — Generated ✅
- `AECI_Tactical_Armed_Guard_Portfolio_Pack.docx` — Generated ✅ (required user to close the file in Word first)
- `AECI_Tactical_Operations_Manual.docx` — Generated ✅
- Memory: `feedback_word_com_automation.md` — Created with all COM pitfalls documented for future sessions
- Memory: `project_blackfire_aeci.md` — Created with project context
- Memory: `MEMORY.md` — Created as memory index

## Blockers / Next Steps
- [ ] Verify documents render correctly when opened — only user can confirm visual output matches branding spec
- [ ] `test_shape.docx`, `test_debug.docx`, `test_logo.docx` etc. left in `C:\DevWork\BlackFire\` root — should be moved to `C:\DevWork\temp\` per constitution rule 7b (temp files)
- [ ] `generate_docs.ps1` remains at repo root `BlackFire\` — constitution rule 7c says artifacts belong in named folders; consider moving to `BlackFire\tools\` or similar
