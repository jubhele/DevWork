# Memory Index — Umlilo Portal

- [Multi-Agent Workforce](project_multiagent_workforce.md) — repo-local constitution/provider mirror integration and workforce prompt locations.
- [cPanel Production Deployment](project_cpanel_deployment.md) — explicit PHP portal runtime allowlist, preserved operational directories, forbidden artifact policy, and tracked-secret follow-up.
- [QA Lessons](project_qa_lessons.md) - reusable lessons from credentialed browser QA, including auth, runtime route checks, legacy asset pitfalls, lint scope, and fix order.
- [Theme and Navigation Contract](project_theme_and_navigation.md) — permanent light/dark theme parity, persistence keys, accessible palettes, public-route auth rules, and dead-link prevention.
- [Power BI Portal Reporting](project_powerbi_reporting.md) — secure in-portal Power BI embeds replace legacy dashboard/invoice reporting surfaces via backend-issued embed tokens and service-principal auth.
- [PBI Layout Implementation Plan](docs/pbi-layout-implementation-plan.md) — concrete page-by-page map for applying the Power BI layout language across PHP, Next.js, and mobile
- [PBI Build Checklist](docs/pbi-build-checklist.md) — layer-by-layer and page-by-page task breakdown for parallel implementation
- [PBI Task Queue](docs/pbi-task-queue.md) — session order, owners, and execution steps for parallel page delivery
- [PBI Session Briefs](docs/pbi-session-briefs/index.md) — ready-to-run briefs for shared foundation, each page session, and final QA
- [PBI Session Generator](scripts/create-pbi-sessions.ps1) — PowerShell generator that stamps the queue into runnable session markdown files
- [PBI Session Generator Targets](scripts/create-pbi-sessions.ps1) — supports `Root`, `PortalSessions`, and `MirrorOnly` session output modes
- [PBI Session Generator Timestamp](scripts/create-pbi-sessions.ps1) — supports `-StartTimestamp` for fixed batch timestamps
- [PBI Session Generator Batch Name / Dry Run](scripts/create-pbi-sessions.ps1) — supports friendly batch labels in titles and write-free previews
- [Quote and Tracker Record UI](project_quote_tracker_record_ui.md) — PHP, Next.js, and Expo Quote records expose linked Call Log number/service; authorized Tracker editors can reassign one or more users consistently
