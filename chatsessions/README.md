# Chat Sessions Archive

This folder contains archived/organized Copilot session references by project.

For live session file copies, see: `c:\DevWork\sessions\system_chatsessions\`
To sync latest files: `& "c:\DevWork\.claude\scripts\sync-sessions.ps1"`

---

## Folder Structure

```
chatsessions/
├── blackfire-aeci/    ← BlackFire Portal & AECI Chempark sessions
├── astute/            ← Astute project sessions
└── _archive/          ← Completed sessions no longer active
```

## Session Index

| Session ID | Folder | Project | Description | Status |
|---|---|---|---|---|
| 188be5c3 | blackfire-aeci | BlackFire/AECI | AECI Portfolio Pack & Comparison | Complete |
| 4593b082 | blackfire-aeci | BlackFire Portal | PHP UI — Logo & Favicon | Paused |
| 606cfd63 | blackfire-aeci | BlackFire Portal | Bcrypt Hash Generator | Complete |

## Session File Locations (VS Code System Storage)

DevWork workspace ID: `da6518229af7ddab166ad8bc4da6ee72`

| Type | Path |
|---|---|
| Chat sessions | `%APPDATA%\Code\User\workspaceStorage\da6518229af7ddab166ad8bc4da6ee72\chatSessions\` |
| Copilot transcripts | `%APPDATA%\Code\User\workspaceStorage\da6518229af7ddab166ad8bc4da6ee72\GitHub.copilot-chat\transcripts\` |
| Debug logs | `%APPDATA%\Code\User\workspaceStorage\da6518229af7ddab166ad8bc4da6ee72\GitHub.copilot-chat\debug-logs\` |
| Synced copies | `c:\DevWork\sessions\system_chatsessions\` |

## Adding New Sessions

When starting a new session:
1. Note the session ID from VS Code (shown in the terminal/output)
2. Create a session log in `c:\DevWork\sessions\YYYY-MM-DD_<topic>.md`
3. After the session, run the sync script to copy the latest files here
