# System Chat Sessions

This folder mirrors live chat session files from VS Code's internal workspaceStorage.
Files here are **read-only copies** — do not edit; originals are managed by VS Code/Copilot.

To refresh: `& "c:\DevWork\.claude\scripts\sync-sessions.ps1"`

---

## DevWork Workspace — da6518229af7ddab166ad8bc4da6ee72

**Source root**: `%APPDATA%\Code\User\workspaceStorage\da6518229af7ddab166ad8bc4da6ee72\`
- chatSessions: `...\chatSessions\`
- transcripts: `...\GitHub.copilot-chat\transcripts\`
- debug-logs: `...\GitHub.copilot-chat\debug-logs\<session-id>\main.jsonl`

| Session File | Project | Description | Status |
|---|---|---|---|
| 188be5c3-7828-4a21-b51e-334388ef0d84.jsonl | BlackFire/AECI | AECI Portfolio Pack & Market Comparison | Complete |
| 4593b082-9d04-43b3-ac77-cd3db5329dca.jsonl | BlackFire Portal | PHP Portal UI — Logo & Favicon | Paused |
| 606cfd63-8399-488c-8752-08306743445a.jsonl | BlackFire Portal | Bcrypt Hash Generator | Complete |

---

## Other Workspaces — 64f9f73b41aec3b96d469cb6a8bc5971

**Source root**: `%APPDATA%\Code\User\workspaceStorage\64f9f73b41aec3b96d469cb6a8bc5971\`

| Session File | Project | Description | Status |
|---|---|---|---|
| 26abd443-cd29-404c-afc0-3d717ae7f0b6.jsonl | Unknown | To be identified | Unknown |
| ed13547b-6c2a-4155-b173-da4ebca0baad.jsonl | Unknown | To be identified | Unknown |

---

## Searching Sessions

```powershell
Select-String -Path "c:\DevWork\sessions\system_chatsessions\*.jsonl" -Pattern "search-term" |
  Select-Object Filename, LineNumber, Line
```
