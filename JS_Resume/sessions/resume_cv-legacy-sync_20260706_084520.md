# Goal
Update the older resume document variants so they match the newer Azure project framing for Standard Bank, Coca-Cola, Inventec, and RMB.

## Decisions
- Used the same Azure Data Factory, Synapse, Storage and PySpark project framing that was already added to the newer resume files.
- Preserved the existing formatting of the legacy Word documents by inserting a new section rather than rewriting the full document.

## Work Done
- Backed up `Jubhele Shange CV.docx` and `JubheleShange_CV.docx` before editing.
- Inserted a `Selected Azure Data Platform Projects` section into both legacy Word CVs.
- Verified that the new section appears cleanly before the next heading in each document.
- Added a memory note so the older resume variants are recorded as synced.

## Blockers
- None.

## Learnings
- The legacy Word resumes use different layouts, so inserting a short project section is safer than trying to normalize the whole document structure.
- Word COM typed insertion preserved the document formatting better than text replacement.

## Goal Status
ACHIEVED
