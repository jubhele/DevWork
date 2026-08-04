---
inclusion: always
---

# DevWork — Tech Stack

## BlackFire Portal
- **Language**: PHP 8.x
- **Database**: MySQL
- **Hosting**: Afrihost (shared)
- **Auth**: Session-based (PHP)

## BlackFire Web/Mobile (formerly "Umlilo Portal")
- **Framework**: Next.js (web) + Expo (mobile) — monorepo, consolidated into `c:\Projects\BlackFire\`
- **Package manager**: pnpm
- **Deployment**: Vercel (web)
- **Backend**: PHP (Afrihost, shared with BlackFire portal)

## Document Generation
- **Runtime**: PowerShell 5.1 only (COM automation, requires Windows)
- **COM object**: Microsoft Word via `New-Object -ComObject Word.Application`
- **Output**: .docx files

## Scripting / Automation
- **Python**: 3.10+ with workspace venv at `c:\DevWork\.venv`
- **Packages**: anthropic, python-dotenv, requests
- **PowerShell**: 5.1 syntax only — no `&&`/`||`, no ternary `?:`

## Secrets
- All secrets in `.env` (not in repo)
- Template at `.env.example` (in repo)
- PHP: `getenv('KEY')` | Python: `os.getenv('KEY')` | Node: `process.env.KEY`

## Version Control
- Git, hosted on GitHub
- Branch: master (main branch)
