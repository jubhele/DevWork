# Session: Umlilo Company Tracker
Date: 2026-06-20
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Expand the Umlilo portal call log from site-only callout logging into a full company tracker supporting Admin, Sales, and General internal task categories alongside existing site callouts. Access is role-gated: each category is only visible to stakeholders whose role maps to that category.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: Sonnet 4.6  Status: under-powered
Note: Proceeding with Sonnet 4.6; multi-file feature build is within capability.

## Decisions
- New `bf_tasks` table (separate from `bf_callouts` to preserve existing callout workflow)
- Three categories: `admin` | `sales` | `general`
- Category→role visibility matrix enforced in PHP (not just frontend)
- URL-param-driven tab switching: `/tracker?category=admin`
- Server-component tracker pages (matches existing callout page pattern)
- Client component for New Task form (POST to PHP API → redirect)
- Ref IDs: TK-ADMIN-001, TK-SALES-001, TK-GEN-001 (per-category sequence)

## Work Done
- `BlackFire/BlackFire Portal/install/migration_tasks.sql` — NEW: bf_tasks table + bf_task_sequences (per-category ref counter) + RBAC permissions (task.view / task.create / task.update / task.delete)
- `BlackFire/BlackFire Portal/api/tasks.php` — NEW: full CRUD API with category→role visibility matrix enforced server-side; ref-ID generator (TK-ADMIN-001, TK-SALES-001, TK-GEN-001); ordered by priority then due date
- `BlackFire/contracts/portal.contract.json` — Added TaskCategory, TaskStatus, TaskPriority enums; Task and TaskListResponse interfaces
- `umlilo-portal/packages/types/index.ts` — Regenerated via sync script; now includes all task types
- `umlilo-portal/apps/web/src/lib/tracker.ts` — NEW: UI constants (CATEGORY_LABELS, CATEGORY_ROLES, PRIORITY_DOT, STATUS_BADGE) and visibleCategoriesForRole helper
- `umlilo-portal/apps/web/src/app/(portal)/tracker/page.tsx` — NEW: Tabbed list page (URL param ?category=); server component; shows tabs based on user role
- `umlilo-portal/apps/web/src/app/(portal)/tracker/new/page.tsx` — NEW: Server wrapper checking task.create permission
- `umlilo-portal/apps/web/src/app/(portal)/tracker/new/NewTaskForm.tsx` — NEW: Client component form (POST to PHP API → redirect)
- `umlilo-portal/apps/web/src/app/(portal)/tracker/[id]/page.tsx` — NEW: Task detail server page
- `umlilo-portal/apps/web/src/app/(portal)/tracker/[id]/TaskActions.tsx` — NEW: Client component for status change + delete
- `umlilo-portal/apps/web/src/components/Sidebar.tsx` — Added Tracker nav item (task.view permission gate)

## Blockers / Next Steps
- Run `migration_tasks.sql` on the live database before deploying
- Optional: add inline edit form to TaskActions (currently only status can be changed in UI; full edit could be a `/tracker/[id]/edit` page)
- Optional: add task count badges to sidebar tabs
- Optional: add filtering by assignee / status on the list page

## Learnings
- The portal.contract.json sync script only handles enums and interfaces; `const` exports (like label maps) must live in separate non-generated files (`src/lib/tracker.ts`)
- Running the sync script is the correct way to update `packages/types/index.ts` — never edit it manually or changes will be lost on next sync
- bf_task_sequences table with `ON DUPLICATE KEY UPDATE last_seq = last_seq + 1` is cleaner than MAX(id) for per-category ref counters; no table-wide lock

```json
{
  "session_id": "20260620_000000",
  "agent": "Umakhi",
  "model_endpoint": "claude-sonnet-4-6",
  "token_metrics": { "tokens_in": 0, "tokens_out": 0, "iteration_count": 1 },
  "outcome": { "status": "SUCCESS", "cost_category": "TIER_3_HIGH" },
  "optimization": { "action_taken": "None" }
}
```
_Session ended: 2026-06-20 16:10:55 (Claude Code / claude-sonnet-4-6)_
