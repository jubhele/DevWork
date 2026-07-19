# Umlilo Workflow Platform: Implementation and QA TODO

Status: Active backlog  
Branch: `feat/umlilo-workflow-platform`  
Platforms: PHP portal, Next.js web, Expo mobile  
Shared layers: MySQL schema, PHP APIs, TypeScript contracts, API client, design tokens

## Goal

Evolve Umlilo from a BlackFire operations portal into a security workflow and field-operations platform without weakening the existing callout-to-cash, safety, approval, RBAC, and audit controls.

## Completion Rule

A feature is complete only when all applicable boxes are checked:

- [ ] Shared database/API contract is implemented and migrated safely.
- [ ] PHP portal supports the workflow.
- [ ] Next.js web supports the workflow.
- [ ] Expo mobile supports the field-appropriate workflow.
- [ ] uMvavanyi functional QA passes.
- [ ] uMcwaningi code-quality and regression review passes.
- [ ] uMbheki visual, responsive, accessibility, and brand QA passes.
- [ ] Role, client, and tenant boundaries are verified server-side.
- [ ] Audit events, documentation, and rollback instructions are complete.

## Platform Labels

- `[SHARED]`: schema, API, contracts, API client, permissions, audit, notifications.
- `[PHP]`: `BlackFire Portal/`.
- `[WEB]`: `apps/web/`.
- `[MOBILE]`: `apps/mobile/`.
- `[QA]`: automated and manual verification across all three platforms.

---

## Phase 0: Baseline, Ownership, and Parity

### 0.1 Current-capability audit

- [ ] `[SHARED]` Inventory every implemented endpoint, permission, status, transition, notification, cron task, and audit event.
- [ ] `[PHP]` Map portal pages and actions to their API endpoints and permissions.
- [ ] `[WEB]` Map routes and actions to PHP/source APIs; identify fixtures, proxies, and incomplete mutations.
- [ ] `[MOBILE]` Map screens and actions; separate read-only views from fully supported mutations.
- [ ] `[SHARED]` Mark each capability as source-of-truth, duplicated, proxied, fixture-only, or absent.
- [ ] `[SHARED]` Remove stale help text that contradicts implemented behaviour.
- [ ] `[SHARED]` Publish one parity matrix covering PHP, web, and mobile.

### 0.2 Contract and migration discipline

- [ ] `[SHARED]` Define versioned contracts for tasks, callouts, incidents, schedules, shifts, SLAs, forms, assets, notifications, and audit events.
- [ ] `[SHARED]` Generate TypeScript types and API-client methods from the canonical contracts.
- [ ] `[SHARED]` Add contract-shape tests against live PHP API responses.
- [ ] `[SHARED]` Add preflight, forward migration, rollback, and verification scripts for every schema change.
- [ ] `[SHARED]` Enforce `host_company_id` and client/site scoping on every new table and query.
- [ ] `[QA]` Add cross-platform parity tests that fail when a visible navigation item has no working route or supported action.

### 0.3 Test infrastructure

- [ ] `[PHP]` Add one command that runs PHP syntax checks and every `BlackFire Portal/tests/*regression*` test.
- [ ] `[WEB]` Keep `typecheck`, `lint`, `build`, and `test:portal-parity` as mandatory gates.
- [ ] `[WEB]` Add Playwright authentication and role-matrix tests for critical workflows.
- [ ] `[MOBILE]` Add explicit `typecheck`, `lint`, unit-test, and Expo Doctor scripts to `apps/mobile/package.json`.
- [ ] `[MOBILE]` Add component tests for loading, empty, error, offline, and permission-denied states.
- [ ] `[QA]` Create repeatable seed fixtures with no live credentials or customer secrets.
- [ ] `[QA]` Define supported browsers, phone sizes, tablets, Android versions, and iOS versions.

---

## Phase 1: SLA, Notifications, and Escalations

### 1.1 SLA policy engine

- [ ] `[SHARED]` Add SLA policies by host company, client, site, contract, service, priority, and record type.
- [ ] `[SHARED]` Support acknowledgement, response, arrival, resolution, and closure targets.
- [ ] `[SHARED]` Add business-hours calendars, holidays, pause reasons, and resume rules.
- [ ] `[SHARED]` Persist SLA start, pause, resume, warning, breach, and completion events.
- [ ] `[SHARED]` Calculate SLA state server-side; never trust a client-calculated deadline.
- [ ] `[SHARED]` Add permissions for policy administration, override, and breach review.
- [ ] `[PHP]` Show countdown, warning, breach, pause reason, and attainment on records and dashboards.
- [ ] `[WEB]` Implement equivalent SLA indicators and policy administration.
- [ ] `[MOBILE]` Show field-relevant countdowns, breach warnings, and acknowledgement actions.

### 1.2 Notification service

- [ ] `[SHARED]` Add event-driven email notifications for assignment, reassignment, status change, approval, warning, breach, and closure.
- [ ] `[SHARED]` Add SMS and mobile-push provider adapters through environment variables.
- [ ] `[SHARED]` Add user notification preferences, quiet hours, and escalation overrides.
- [ ] `[SHARED]` Add delivery queue, retry policy, idempotency key, failure state, and delivery audit history.
- [ ] `[SHARED]` Prevent unauthorized record details from leaking into notification content.
- [ ] `[PHP]` Add notification inbox and preference management.
- [ ] `[WEB]` Add notification inbox, unread count, deep links, and preference management.
- [ ] `[MOBILE]` Add push registration, secure deep links, read state, and notification preferences.

### 1.3 Escalation rules

- [ ] `[SHARED]` Support ordered escalation levels by priority, service, site, and time elapsed.
- [ ] `[SHARED]` Support acknowledgement timeout and automatic reassignment.
- [ ] `[SHARED]` Support phone/manual escalation confirmation for critical incidents.
- [ ] `[SHARED]` Record who was notified, who acknowledged, and when ownership changed.
- [ ] `[QA]` Verify SLA timers across timezone, daylight-saving, holiday, pause, reopen, and migrated-record cases.
- [ ] `[QA]` Verify duplicate cron/queue execution cannot send duplicate notifications or escalation actions.

---

## Phase 2: Workforce Scheduling, Dispatch, and Timekeeping

### 2.1 Workforce model

- [ ] `[SHARED]` Add employees, teams, roles, skills, certifications, expiry dates, and availability.
- [ ] `[SHARED]` Add client sites, posts, zones, shift templates, rotations, and required qualifications.
- [ ] `[SHARED]` Add leave, unavailability, replacement, overtime, fatigue, and conflict rules.
- [ ] `[SHARED]` Link scheduled work to contracts and billable service definitions.
- [ ] `[SHARED]` Enforce site/client boundaries and protect employee personal information.

### 2.2 Schedule and roster experience

- [ ] `[PHP]` Add day/week/month roster, open-shift queue, conflict indicators, and printable roster.
- [ ] `[WEB]` Add responsive schedule, drag/reschedule controls, filters, and workload view.
- [ ] `[MOBILE]` Add My Shifts, shift details, availability, accept/decline, and replacement request.
- [ ] `[MOBILE]` Add local reminders for upcoming shifts and certification expiries.

### 2.3 Live dispatch

- [ ] `[SHARED]` Define dispatch states: queued, offered, acknowledged, en route, on site, paused, completed, cancelled.
- [ ] `[SHARED]` Link dispatches to callouts, incidents, assignees, vehicles, sites, and SLA events.
- [ ] `[PHP]` Add control-room dispatch board and exception queue.
- [ ] `[WEB]` Add live dispatch board, map/list views, filters, and acknowledgement status.
- [ ] `[MOBILE]` Add dispatch offer, accept/decline, navigation handoff, status updates, and evidence capture.
- [ ] `[QA]` Verify concurrent dispatch, reassignment, no-response, cancellation, reopen, and duplicate-action behaviour.

### 2.4 Attendance and billing inputs

- [ ] `[SHARED]` Add clock-in/out, breaks, corrections, supervisor approval, and immutable revision history.
- [ ] `[SHARED]` Add scheduled-versus-actual hours and approved billable/payable time.
- [ ] `[SHARED]` Feed approved operational records into invoice preparation without automatically posting financial entries.
- [ ] `[QA]` Verify rounding, overnight shifts, missing clock-out, overlapping shifts, and approval separation of duties.

---

## Phase 3: Offline Field Operations and Proof of Presence

### 3.1 Offline architecture

- [ ] `[SHARED]` Define syncable entities, server revisions, idempotency keys, tombstones, and conflict rules.
- [ ] `[MOBILE]` Add encrypted local storage for assigned shifts, dispatches, tasks, forms, and permitted attachments.
- [ ] `[MOBILE]` Add offline create/update queue with visible pending, synced, failed, and conflicted states.
- [ ] `[MOBILE]` Add retry, resumable uploads, low-bandwidth mode, and manual sync.
- [ ] `[MOBILE]` Prevent one user from accessing another user's cached records after logout or account switch.
- [ ] `[PHP]` Add sync diagnostics and failed-operation review for administrators.
- [ ] `[WEB]` Add connection-state messaging; do not imply offline support where it does not exist.

### 3.2 GPS, geofence, QR, and NFC

- [ ] `[SHARED]` Add site coordinates, permitted radius, checkpoint definitions, and privacy/retention rules.
- [ ] `[MOBILE]` Capture consented GPS evidence for arrival, checkpoint, incident, and completion events.
- [ ] `[MOBILE]` Add QR checkpoint scanning.
- [ ] `[MOBILE]` Add NFC checkpoint support where device capability permits.
- [ ] `[MOBILE]` Detect mocked location where technically feasible and flag rather than silently reject.
- [ ] `[PHP]` Add checkpoint configuration and exception review.
- [ ] `[WEB]` Add patrol progress and checkpoint exception views.
- [ ] `[QA]` Test permission denied, inaccurate GPS, stale position, offline scan, duplicate scan, and clock manipulation.

### 3.3 Lone-worker and panic workflows

- [ ] `[SHARED]` Add scheduled check-ins, missed-check escalation, emergency contacts, and panic events.
- [ ] `[MOBILE]` Add prominent panic action with confirmation design that remains fast under stress.
- [ ] `[MOBILE]` Add periodic lone-worker check-in and background-state handling.
- [ ] `[PHP]` Add control-room alert queue, acknowledgement, escalation, and resolution record.
- [ ] `[WEB]` Add equivalent monitoring and incident linkage.
- [ ] `[QA]` Test denied background permissions, killed app, no signal, duplicate alert, false alarm, and escalation timeout.

---

## Phase 4: Configurable Workflows and Dynamic Forms

### 4.1 Workflow definition engine

- [ ] `[SHARED]` Add workflow definitions, versions, record types, statuses, transitions, guards, and actions.
- [ ] `[SHARED]` Support role-, client-, site-, field-, and condition-based transition rules.
- [ ] `[SHARED]` Support triggers for creation, assignment, field change, time elapsed, SLA event, approval, and external event.
- [ ] `[SHARED]` Support actions for assignment, status update, task creation, notification, approval request, and webhook.
- [ ] `[SHARED]` Add simulation, draft, publish, rollback, and execution history.
- [ ] `[SHARED]` Preserve existing callout, quote, invoice, payment, and safety invariants as protected rules.
- [ ] `[PHP]` Add workflow administration and execution-history views.
- [ ] `[WEB]` Add visual workflow editor and validation feedback.
- [ ] `[MOBILE]` Render permitted transitions and actions from the published workflow definition.

### 4.2 Dynamic form builder

- [ ] `[SHARED]` Add versioned form templates, sections, questions, validation, conditional visibility, and scoring.
- [ ] `[SHARED]` Support text, number, currency, date/time, choice, multi-choice, table, calculated field, signature, photo/video, barcode/QR, GPS, and file inputs.
- [ ] `[SHARED]` Support required evidence, approval stages, expiry, and template rollout by client/site/service.
- [ ] `[PHP]` Add form/template administration and desktop form completion.
- [ ] `[WEB]` Add accessible form builder, preview, completion, and review.
- [ ] `[MOBILE]` Add touch-friendly, offline-capable form completion with media compression and draft recovery.
- [ ] `[QA]` Verify form-version immutability: historical submissions must retain the version completed.
- [ ] `[QA]` Verify conditional logic, calculations, signatures, media limits, accessibility, and malformed-schema rejection.

### 4.3 Task and collaboration maturity

- [ ] `[SHARED]` Add subtasks, checklists, dependencies, blockers, recurring tasks, and templates.
- [ ] `[SHARED]` Add threaded comments, mentions, watchers, edits, deletions, and moderation audit events.
- [ ] `[SHARED]` Add saved filters, bulk actions, and server-side pagination/sorting.
- [ ] `[PHP]` Add Kanban, calendar, filtered timeline, and workload views.
- [ ] `[WEB]` Add equivalent list, board, calendar, timeline, and workload views.
- [ ] `[MOBILE]` Add My Work, mentions, checklists, comments, and compact calendar agenda.
- [ ] `[QA]` Verify dependency cycles, recurrence timezones, comment permissions, mention leakage, and bulk-action authorization.

---

## Phase 5: Incident, Safety CAPA, Assets, and Client Self-Service

### 5.1 Incident lifecycle

- [ ] `[SHARED]` Define incident severity, classification, triage, containment, investigation, recovery, closure, and review.
- [ ] `[SHARED]` Link incidents to callouts, dispatches, people, sites, assets, evidence, approvals, and SLA history.
- [ ] `[SHARED]` Add major-incident roles, stakeholder communication log, and immutable timeline.
- [ ] `[PHP]` Add incident command and investigation views.
- [ ] `[WEB]` Add incident workspace, timeline, linked records, and review report.
- [ ] `[MOBILE]` Add fast incident capture using text, voice, photo/video, GPS, and witnesses.

### 5.2 Corrective and preventive action

- [ ] `[SHARED]` Generalize safety action-plan items into CAPA records with owner, due date, evidence, approval, and effectiveness review.
- [ ] `[SHARED]` Add root-cause methods, contributing factors, recurrence links, and control changes.
- [ ] `[SHARED]` Escalate overdue corrective actions through the SLA/notification engine.
- [ ] `[QA]` Verify an incident cannot close until required actions, evidence, and approvals are complete.

### 5.3 Asset, vehicle, and site registry

- [ ] `[SHARED]` Add sites, zones, posts, assets, vehicles, devices, warranties, maintenance schedules, and service histories.
- [ ] `[SHARED]` Link assets to callouts, incidents, inspections, contracts, invoices, and recurring failures.
- [ ] `[PHP]` Add administration, maintenance, expiry, and assignment views.
- [ ] `[WEB]` Add searchable asset/site workspace and service history.
- [ ] `[MOBILE]` Add scan-to-open asset, inspection, fault report, and maintenance evidence.
- [ ] `[QA]` Verify asset transfer, retirement, duplicate identifiers, client scoping, and historical-link retention.

### 5.4 Client self-service

- [ ] `[SHARED]` Add request catalogue, client contacts, site-scoped permissions, notification contacts, and satisfaction surveys.
- [ ] `[PHP]` Provide client request creation, approvals, invoices, reports, documents, and status visibility.
- [ ] `[WEB]` Provide branded client dashboard, request tracking, SLA visibility, schedules, reports, approvals, and knowledge articles.
- [ ] `[MOBILE]` Provide client-appropriate request, approval, status, document, and contact workflows where justified.
- [ ] `[QA]` Run a client-isolation matrix proving one client cannot enumerate or access another client's records, files, dashboards, URLs, notifications, or exports.

---

## Phase 6: Integrations, Reporting, and AI

### 6.1 Integration platform

- [ ] `[SHARED]` Publish authenticated, versioned API documentation for approved external consumers.
- [ ] `[SHARED]` Add signed webhooks, subscriptions, retry history, replay protection, and secret rotation.
- [ ] `[SHARED]` Add email-to-request/callout ingestion with sender verification and attachment controls.
- [ ] `[SHARED]` Add Microsoft Teams/Slack notification adapters.
- [ ] `[SHARED]` Add alarm, CCTV, access-control, accounting, payroll, and BI connector framework.
- [ ] `[QA]` Verify rate limits, idempotency, signature validation, replay prevention, timeout, retry, and dead-letter handling.

### 6.2 Operational reporting

- [ ] `[SHARED]` Define trusted metrics for SLA attainment, acknowledgement time, response time, resolution time, backlog age, reopen rate, first-time fix, repeat incidents, patrol completion, missed checkpoints, utilization, CAPA age, and client satisfaction.
- [ ] `[PHP]` Add live supervisor exception dashboards and scheduled branded reports.
- [ ] `[WEB]` Add drill-down dashboards and Power BI-aligned management reporting.
- [ ] `[MOBILE]` Add role-specific summary and exception cards, not desktop report replicas.
- [ ] `[SHARED]` Add export permissions, data masking, scheduled delivery, and export audit events.
- [ ] `[QA]` Reconcile every reported metric to source rows and test role/client/date filters.

### 6.3 Embedded AI with human control

- [ ] `[SHARED]` Inventory existing AI endpoints and classify each as production-ready, experimental, fixture-backed, or disabled.
- [ ] `[SHARED]` Add structured voice-to-incident/callout capture with user confirmation before save.
- [ ] `[SHARED]` Add duplicate/recurring-incident suggestions with evidence links.
- [ ] `[SHARED]` Add shift, incident, safety, and client-report summaries.
- [ ] `[SHARED]` Add risk flags for likely SLA breach, missing evidence, and overdue corrective action.
- [ ] `[SHARED]` Record model, prompt version, source records, output, reviewer decision, and final human-authored change.
- [ ] `[SHARED]` Prevent AI from approving, invoicing, dispatching, changing permissions, or closing incidents without an authorized human action.
- [ ] `[QA]` Test prompt injection, cross-client data leakage, hallucinated facts, unsafe action attempts, unavailable provider, and manual fallback.

---

## Cross-Platform QA Matrix

Run this matrix for every phase before release.

### Functional QA: uMvavanyi

- [ ] PHP happy path, validation failures, permission failures, concurrency, and recovery.
- [ ] Next.js happy path, API/proxy failure, expired session, stale data, and retry.
- [ ] Mobile happy path, offline path, reconnect/sync, denied permissions, background/foreground, and device rotation.
- [ ] End-to-end record parity: an action on one platform appears correctly and only once on the other two.
- [ ] Role matrix: sysadmin, admin, manager, finance, safety, call logger, technician, viewer, client, and client support.
- [ ] Tenant/client/site isolation for list, detail, mutation, file, export, notification, and deep-link paths.
- [ ] Audit completeness for create, update, assign, approve, reject, send, close, reopen, override, delete, and failed privileged actions.

### Code QA: uMcwaningi

- [ ] Schema migration preflight, backup, forward migration, rollback, and post-migration verification.
- [ ] Server-side authorization on every query and mutation.
- [ ] Transaction boundaries protect coupled state and audit-event changes.
- [ ] Idempotency for queue, sync, notification, webhook, approval, billing, and dispatch operations.
- [ ] No hardcoded secrets, live credentials, client data, or environment-specific URLs.
- [ ] No duplication of canonical status, role, permission, metric, or contract definitions.
- [ ] PHP regression suite passes.
- [ ] Next.js typecheck, lint, production build, parity test, and Playwright suite pass.
- [ ] Mobile typecheck, lint, component tests, Expo Doctor, Android build, and iOS build pass.
- [ ] Performance budgets cover list queries, dashboards, sync batches, attachments, and notification jobs.

### Visual, UX, and accessibility QA: uMbheki

- [ ] PHP, web, and mobile use shared brand tokens and the same information hierarchy.
- [ ] Desktop, tablet, narrow phone, large text, zoom, landscape, and reduced-motion layouts pass.
- [ ] Keyboard navigation, focus order, focus visibility, skip links, dialogs, and escape behaviour pass on web surfaces.
- [ ] Screen-reader names, roles, states, errors, live regions, and table/card alternatives pass.
- [ ] Touch targets are at least 44px and critical field actions are usable one-handed.
- [ ] Loading, empty, partial, stale, offline, syncing, conflict, warning, breach, error, and success states are visibly distinct.
- [ ] Colour is never the only carrier of priority, status, safety, or SLA meaning.
- [ ] Visual regression captures are approved for every affected route/screen on all three platforms.

### Security and governance release gate: uMlindi

- [ ] Authentication, session/token rotation, logout, expiry, and revoked-user behaviour pass.
- [ ] File upload/download authorization, malware-control integration point, MIME validation, size limits, and retention pass.
- [ ] GPS, biometric, employee, incident, and client data have documented purpose, consent, access, retention, and deletion rules.
- [ ] Audit records are tamper-resistant and exportable only by authorized roles.
- [ ] Production migration and rollback have named owners and verified backups.
- [ ] No deployment occurs until uMvavanyi, uMcwaningi, uMbheki, and uMlindi gates are recorded as passed.

---

## Recommended Delivery Order

- [ ] Milestone 1: Phase 0 baseline and automated three-platform QA foundation.
- [ ] Milestone 2: SLA engine, notification queue, and escalation rules.
- [ ] Milestone 3: workforce model, scheduling, live dispatch, and timekeeping.
- [ ] Milestone 4: mobile offline sync, GPS/QR proof-of-presence, lone-worker, and panic workflows.
- [ ] Milestone 5: configurable workflows, forms, collaboration, and advanced work views.
- [ ] Milestone 6: incident/CAPA, assets, and expanded client self-service.
- [ ] Milestone 7: integrations, operational reporting, and governed AI.

## Immediate Next Sprint

- [ ] Complete the Phase 0 parity matrix using current branch behaviour, not filenames alone.
- [ ] Add missing mobile typecheck, lint, test, and Expo Doctor scripts.
- [ ] Create one command that runs the existing PHP regression suite.
- [ ] Add authenticated Playwright smoke tests for PHP and Next.js critical routes.
- [ ] Define the SLA policy, event, and timer contract before creating UI.
- [ ] Define notification events and delivery/audit schema.
- [ ] Prototype one complete vertical slice: urgent callout creation → assignment notification → acknowledgement timer → SLA warning → escalation → completion → cross-platform audit verification.

