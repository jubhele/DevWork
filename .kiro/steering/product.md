---
inclusion: always
---

# DevWork — Product Overview

This workspace's project repos live as siblings at `c:\Projects\<name>` — DevWork itself is the
template/control-plane only. Authoritative list: `_workspace/project-registry.json`.

## BlackFire / AECI
Security company client portal and proposals platform, including the Next.js + Expo monorepo
(formerly a separate "Umlilo Portal" project, consolidated into BlackFire). Serves AECI Chempark.
- **Portal**: PHP/MySQL web application at `c:\Projects\BlackFire\BlackFire Portal\`
- **Web/mobile monorepo**: `c:\Projects\BlackFire\apps\` (Next.js web, Expo mobile)
- **Proposals**: 7 branded .docx proposals generated via PowerShell COM automation
- **Generator**: `c:\Projects\BlackFire\generate_docs.ps1`
- **Users**: 4 confirmed AECI users (j.shange, z.myeza, sibu, penny.nzimande)
- **Repo**: github.com/jubhele/BlackFire

## Multi-Agent Workforce
9 named agents (Zulu names) handle specialized domains:
- **uSibali** — cost governance
- **uMlawuli** — supervisor/routing
- **Sebenza agents** (7): uNkanyezi, uSiba, uMhloli, uMakhi, uMdwebi, uMvavanyi, uMlindi
- System prompts: `c:\DevWork\agents\`
