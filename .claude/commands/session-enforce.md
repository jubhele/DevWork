# /session-enforce — Session Discipline Enforcer

Enforce the workspace constitution session requirements. Run at session START or END depending on $ARGUMENTS.
Usage: `/session-enforce start` | `/session-enforce end` | `/session-enforce status`

## On START

1. **Classify the task** into Tier 1 / 2 / 3 (see CLAUDE.md § 11).
2. **Check memory** — read `MEMORY.md` and surface any entries relevant to the work about to begin.
3. **Check for an existing session log** in `c:\DevWork\sessions\` matching today's date and topic.
   - If found: offer to resume (append `## Resumed YYYY-MM-DD` section).
   - If not found: create a new log from the template below.
4. **Output the model recommendation block** if the active model is not optimal for the detected tier.
5. **Remind about backup rule**: before modifying any file, create a timestamped backup in `_backups/`.

### New session log template
```
# Session: <topic derived from first user message>
Date: YYYY-MM-DD
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
<one paragraph>

## Model Recommendation
Task tier: <1-Fast | 2-Medium | 3-Complex>
Recommended model: <name>  Trust score: <X>/10
Active model: claude-sonnet-4-6  Status: <correct | over/under-powered>

## Decisions

## Work Done

## Blockers / Next Steps

## Learnings
```

## On END

1. **Verify session log completeness**:
   - Goal: filled? ✓/✗
   - Decisions: at least one entry? ✓/✗
   - Work Done: at least one file listed? ✓/✗
   - Learnings: filled? ✓/✗ (MANDATORY — block close if missing)
2. **Check backup compliance**: for every file in Work Done, confirm a `_backups/` entry exists.
3. **Check memory updates**: did any decisions or preferences come up that should be saved to memory?
   If yes, list them and save them.
4. **Mirror the session log** to `G:\My Drive\JS\Agentic AI\sessions\` with `.tbl.bk` appended.
5. **Output a session close summary**:
   ```
   Session closed: <topic>
   Files changed: <N>
   Memory updated: <yes — <what> | no>
   Log mirrored: <yes | failed — <reason>>
   ```

## On STATUS

Check the current session log and output:
- Which sections are complete vs empty
- Whether memory has been updated this session
- Whether backups exist for all modified files (per git status)
- A pass/fail for each mandatory constitution requirement
