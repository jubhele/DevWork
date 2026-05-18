# BlackFire Solutions · Portal Ecosystem Strategic Plan
**BLKFR · IZILO-V-MASTER-001**

**Date:** 2026-05-17  
**Prepared for:** Jubhele (BlackFire Solutions)  
**Status:** DRAFT — Ready for Approval  
**Version:** 1.0

---

## Executive Summary

This document outlines a four-stream initiative to design, enhance, and deploy a comprehensive business management portal ecosystem for BlackFire Solutions. Work is organized into four parallel tracks:

1. **Brand Portal Enhancement** — Expand design system showcase with interactive components
2. **AECI Portal Refinement** — UX improvements, feature expansion, production hardening
3. **PHP/MySQL Backend Deployment** — Production-ready database layer on Afrihost cPanel
4. **Missing Portal Creation** — Build Secure Command, Internal Ops, Hub portals from specification

**Total Estimated Effort:** ~180–220 hours  
**Timeline:** 6–8 weeks (concurrent work streams)  
**Cost Range (R450/hr Day 1, R350/hr subsequent, +30% equipment markup):** ~R90K–R110K

---

## Project Context

### Current State
- **Brand Portal** (`blackfire-portal.html`, 43KB): Brand system showcase with dark/light toggle
- **AECI Portal** (`BlackFire_Portal_AECI_v9.html`, 685KB): Feature-rich HTML dashboard for Chemhold/AECI
- **PHP Backend** (incomplete installation guide): Database-backed multi-user system, Afrihost-ready
- **Utility Tools**: Password manager, bcrypt hash generator, installer
- **Missing Portals**: Secure Command, Internal Ops (Izilo Mission Control), Portal Hub (orchestration layer)

### Quality Standard
- Museum-quality craftsmanship: zero AI slop, pristine execution
- Deliberate naming (BLKFR prefix, IZILO-[M/C/T/V/G/X] spec codes)
- Conceptual depth over decoration (Thermal Geometry philosophy)
- Honest progress assessment; identify what didn't land

### Infrastructure Context
- Hosting: Afrihost Silver Home Linux (cPanel, `blackfm6w9f9`)
- Domain: `blackfiresolutions.co.za`
- Supported stack: PHP 7.4+, MySQL 5.7+, Apache with mod_rewrite
- Budget ceiling: ~R2,000/month for infrastructure

---

## STREAM 1: Brand Portal Enhancement

### Current State
- Single-file HTML artifact (43KB)
- Displays color system, typography, geometric patterns (IZILO-G-001)
- Dark/light toggle functional
- **Gap:** Limited interactivity; no "living" documentation; design tokens not consumable by dev teams

### Objectives
1. **Elevate to "living brand system"** — move beyond static display toward *interactive design tool*
2. **Add component library** — showcase portal UI components in action (buttons, forms, alerts, cards)
3. **Implement token export** — allow CSS/JSON download of theme variables for consumption
4. **Enhance documentation** — add voice guidance, thermal geometry philosophy, naming conventions
5. **Create dark/light variant parity** — ensure all components render flawlessly in both themes

### Deliverables

#### Phase 1A: Interactive Component Library (Weeks 1–2)
**Spec:** IZILO-BRAND-001

| Component | Purpose | Status |
|-----------|---------|--------|
| Color Swatches | Interactive thermal gradient with temperature labels | New |
| Typography Specimens | Showcase font pairings, weights, use cases | New |
| Button States | Primary, secondary, danger + hover/active/disabled | New |
| Form Elements | Input, textarea, select, checkbox, radio + validation states | New |
| Card Layouts | Content cards for various use cases (hero, feature, stat) | New |
| Alert/Toast | Notification patterns (success, error, warning, info) | New |
| Modal/Overlay | Dialog patterns with dismissal states | New |
| Navigation Patterns | Tab, breadcrumb, pagination | New |
| Data Table | Sortable, filterable table with dark/light styles | New |

**Implementation approach:**
- Expand existing 43KB HTML to ~120–150KB single file (all-in-one artifact)
- Each component includes: visual showcase, HTML/CSS code block (copyable), usage notes
- CSS variables auto-applied to all components on theme toggle
- Tabbed navigation for sections: colors → typography → components → patterns → downloads

#### Phase 1B: Design Token Exporter (Week 2–3)
**Spec:** IZILO-BRAND-TOKEN-001

- **Feature:** Export color palette as JSON/CSS/SCSS/Tailwind config
- **Feature:** Download typography scale (font stacks, sizes, weights)
- **Feature:** Generate theme CSS files for import into dev projects
- **Use case:** Dev teams can consume tokens directly into build pipelines

**Deliverable:** JavaScript function that serializes all CSS custom properties and downloads as user-selected format

#### Phase 1C: Thermal Geometry Deep Dive (Week 3)
**Spec:** IZILO-BRAND-PHILOSOPHY-001

- **Addition:** Expanded section on design philosophy
- **Content:** 
  - Thermal Geometry concept (fire as engineered phenomenon)
  - Zulu Geometric Ancestry connection (IZILO-G-001)
  - Naming conventions (BLKFR prefix, spec codes)
  - Light system philosophy ("the light system is the dark system's evidence")
- **Format:** Scrollytelling (text + visual parallax) for conceptual narrative
- **References:** Links to brand book PDFs, external resources

### Success Criteria
- ✅ All components functional in both dark/light themes
- ✅ Code samples copy-paste ready
- ✅ Token export produces valid CSS/JSON
- ✅ Load time < 2 seconds on 4G connection
- ✅ Mobile-responsive (tested at 375px, 1024px, 1920px widths)

### Timeline
- **Weeks 1–2:** Component library implementation
- **Week 2–3:** Token exporter + philosophy section
- **Deliverable date:** End of Week 3
- **Estimated hours:** 40–50

---

## STREAM 2: AECI Portal Refinement

### Current State
- **File:** `BlackFire_Portal_AECI_v9.html` (685KB)
- **Features:** 8 user roles, RBAC, 9 modules (dashboard, callouts, quotes, invoices, etc.), dark/light theme, localStorage persistence
- **Gaps:** 
  - No database persistence (localStorage only — loses data on cache clear)
  - No audit trail
  - Single-user (concurrent sessions not supported)
  - Incomplete error handling
  - Mobile UX needs refinement

### Objectives
1. **UX Polish** — refine form interactions, error messaging, loading states
2. **Mobile-first redesign** — adapt dense dashboard for mobile/tablet
3. **Feature completion** — implement missing modules (reporting, bulk actions, export)
4. **Error handling** — comprehensive error boundaries, graceful degradation
5. **Performance optimization** — reduce bundle size, lazy-load modules, optimize SVGs
6. **Transition path to PHP backend** — document data migration strategy

### Deliverables

#### Phase 2A: Mobile UX Redesign (Weeks 1–2)
**Spec:** IZILO-AECI-MOBILE-001

| Area | Current | Improved |
|------|---------|----------|
| Dashboard | 4-column grid | Responsive grid (1–4 cols based on breakpoint) |
| Sidebar Nav | Fixed, wide | Collapsible hamburger on mobile, sticky top on tablet |
| Data Tables | Horizontal scroll | Card-stack layout on mobile (one row per card) |
| Forms | Full-width inputs | Optimized spacing, mobile keyboard awareness |
| Modal Dialogs | Centered overlay | Full-screen slide-in on mobile |
| Bottom actions | Sticky footer | Touch-friendly button sizing (44px+ min) |

**Implementation:**
- Audit current breakpoints (likely missing mid-range tablets)
- Refactor Tailwind breakpoints: `sm: 375px, md: 768px, lg: 1024px, xl: 1280px`
- Test on real devices: iPhone 12/14 Pro, iPad Pro, Samsung Galaxy Tab
- Ensure all buttons/links ≥44px touch targets (WCAG compliance)

#### Phase 2B: Enhanced Error Handling & Loading States (Week 2–3)
**Spec:** IZILO-AECI-RESILIENCE-001

**Additions:**
- Error boundaries around module containers
- User-facing error messages (not technical dumps)
- Retry logic for failed operations
- Loading skeleton screens (not just spinners)
- Offline detection + graceful messaging
- Form validation: real-time + submit-time checks
- Timeout handling (localStorage operations, async calculations)

**Example:** When offline, show badge on sidebar "OFFLINE MODE · Read-only" with sync-ready indicator

#### Phase 2C: Feature Completeness (Weeks 3–4)
**Spec:** IZILO-AECI-FEATURES-002

**New modules/features:**
1. **Reporting Module** — Custom report builder (select date range, filters, columns), export CSV/PDF
2. **Bulk Actions** — Multi-select rows in tables, bulk status change, bulk delete with confirmation
3. **Export/Import** — CSV import for bulk callouts/quotes, batch invoice generation
4. **Search/Filter Enhancement** — Global search across all modules, saved filter presets
5. **Audit Trail** — View of who did what when (localStorage-based timeline)
6. **Notes/Annotations** — Attach notes to callouts/quotes/invoices, edit history
7. **Templates** — Save quote/invoice templates for rapid re-use
8. **Print Preview** — Professional print layouts for quotes, invoices, callout reports

#### Phase 2D: Performance Optimization (Week 4)
**Spec:** IZILO-AECI-PERF-001

| Metric | Target | Method |
|--------|--------|--------|
| Bundle size | < 650KB | Remove unused code, minify SVGs, lazy-load modules |
| First paint | < 1.2s | Split JS, defer non-critical scripts |
| Module load | < 300ms | Lazy-load tab contents on click |
| Search | < 100ms | Index data on first load, use Web Workers for filtering |
| Export (CSV) | < 500ms | Stream output, no blocking operations |

**Tools:** Lighthouse audits at each checkpoint, WebPageTest profiling

#### Phase 2E: Migration Strategy Documentation (Week 4)
**Spec:** IZILO-AECI-MIGRATION-001

- **Document:** Step-by-step guide to migrate localStorage data to PHP/MySQL backend
- **Tooling:** Export JSON from v9 → JSON schema validator → Importer for backend
- **Testing:** Set up test database, validate data integrity post-migration

### Success Criteria
- ✅ Mobile layout passes responsive testing (375–1920px)
- ✅ All touch targets ≥44px
- ✅ Form validation works smoothly (no jarring errors)
- ✅ All 9 modules + 3 new features functional
- ✅ Bundle size ≤ 650KB (gzipped < 200KB)
- ✅ Lighthouse score ≥ 85 (mobile & desktop)

### Timeline
- **Weeks 1–2:** Mobile redesign
- **Weeks 2–3:** Error handling + resilience
- **Weeks 3–4:** Features + optimization
- **Deliverable date:** End of Week 4
- **Estimated hours:** 60–80

---

## STREAM 3: PHP/MySQL Backend Deployment

### Current State
- **Installation guide** exists (README.md in portal directory)
- **File structure** defined: API endpoints, auth system, RBAC, database schema
- **Status:** Ready for deployment to Afrihost
- **Gap:** Not yet tested on live server; encryption config needs setup; database creation needed

### Objectives
1. **Prepare Afrihost environment** — create database, configure cPanel, set permissions
2. **Configure encryption** — generate APP_KEY, set up .env variables
3. **Deploy files** — upload portal to cPanel, validate structure
4. **Run installer** — execute database initialization
5. **Security hardening** — set headers, remove install directory, test access controls
6. **Testing** — smoke tests for all 8 user roles, API endpoint validation

### Deliverables

#### Phase 3A: Afrihost Environment Setup (Week 1)
**Spec:** IZILO-DEPLOY-AFRIHOST-001

**Tasks:**
1. **cPanel Login** → Navigate to MySQL Databases
   - Create database: `blackfm6w9f9_portal`
   - Create user: `blackfm6w9f9_izilo` with strong password
   - Grant ALL PRIVILEGES
2. **Create required directories** (via File Manager):
   - `/public_html/portal/` (main)
   - `/public_html/portal/config/` (writable, 755)
   - `/public_html/portal/api/` (755)
   - `/public_html/portal/includes/` (755)
3. **Enable mod_rewrite** — check cPanel for Apache modules (should be enabled by default)
4. **SSL certificate** — ensure Let's Encrypt (free) is active on domain

**Deliverable:** cPanel screenshot proof + .env template file

#### Phase 3B: Configuration & Encryption Setup (Week 1)
**Spec:** IZILO-DEPLOY-ENCRYPTION-001

**Tasks:**
1. **Generate APP_KEY** — 32-byte random string (use bcrypt generator utility)
2. **Create .env file** with:
   ```
   BF_APP_KEY=<generated-key>
   BF_DB_HOST=localhost
   BF_DB_NAME=blackfm6w9f9_portal
   BF_DB_USER=blackfm6w9f9_izilo
   BF_DB_PASS=<strong-password>
   BF_DB_CHARSET=utf8mb4
   BF_SESSION_TIMEOUT=7200
   BF_ADMIN_EMAIL=jubhele@astuteinsights.co.za
   ```
3. **Upload .env** to `/public_html/portal/.env` (add to .htaccess: don't serve .env files)
4. **Test config** — create simple test script to verify encryption/decryption works

**Deliverable:** Validated .env file + encryption test results

#### Phase 3C: File Deployment (Week 1)
**Spec:** IZILO-DEPLOY-FILES-001

**Method:** ZIP upload + extract via cPanel File Manager (fastest)

**Steps:**
1. Create `/BlackFire/BlackFire/BlackFire Portal/` as ZIP: `blackfire-portal-prod.zip`
2. Upload to cPanel → Extract to `/public_html/portal/`
3. Set permissions:
   - Directories: 755
   - Files: 644
   - `/config/`: 755 (must be writable for installer)
4. Verify structure matches README spec

**Deliverable:** Deployment log with directory listing proof

#### Phase 3D: Database Initialization (Week 1)
**Spec:** IZILO-DEPLOY-DB-INIT-001

**Steps:**
1. Access `/public_html/portal/install/` in browser
2. Installer checks:
   - ✅ PHP version ≥ 7.4
   - ✅ Extensions: PDO, PDO MySQL, JSON present
   - ✅ Database connection succeeds
   - ✅ Directory permissions correct
3. Run schema.sql:
   - Creates tables: users, callouts, quotes, invoices, transactions, audit_logs
   - Inserts default roles (8 types) and sample user accounts
4. Save database initialization log
5. **DELETE `/install/` directory** (security step)

**Deliverable:** Database schema validation report + sample user credentials

#### Phase 3E: Security Hardening (Week 2)
**Spec:** IZILO-DEPLOY-SECURITY-001

| Layer | Action | Verification |
|-------|--------|--------------|
| .htaccess | Block direct access to `/config/`, `/includes/`, `.env` | Test with curl (should return 403) |
| Headers | Set X-Frame-Options, CSP, X-Content-Type-Options | Inspect HTTP headers |
| Passwords | Hash all demo credentials with bcrypt | Verify in database |
| Session | Configure secure session cookies (HttpOnly, Secure flags) | Browser dev tools |
| Rate limiting | Optional: Add login attempt throttling | Manual test |
| SQL injection | Review all PDO queries for parameterization | Code audit checklist |

#### Phase 3F: Testing & Validation (Week 2)
**Spec:** IZILO-DEPLOY-QA-001

**Test matrix (8 roles × key workflows):**

| Role | Login | Dashboard | Create Callout | Edit Quote | Generate Invoice | View Audit |
|------|-------|-----------|----------------|-----------|------------------|-----------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Call Logger | ✅ | Read-only | ✅ | ❌ | ❌ | ❌ |
| Senior Tech | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ... | ... | ... | ... | ... | ... | ... |

**Smoke tests:**
- Login/logout works for all roles
- RBAC permissions enforced (e.g., Call Logger can't edit invoices)
- Data persists after refresh
- Cross-browser: Chrome, Firefox, Safari, Edge
- Mobile: responsive on iPhone, iPad, Android tablet
- Error handling: simulate network failures, invalid inputs

**Deliverable:** Test report with pass/fail matrix + screenshot evidence

### Success Criteria
- ✅ Portal accessible at `https://blackfiresolutions.co.za/portal/`
- ✅ Login works; dashboard displays without errors
- ✅ All 8 roles can authenticate; RBAC enforced
- ✅ Data persists in database (not localStorage)
- ✅ No PHP errors or warnings in cPanel error logs
- ✅ `.htaccess` blocks directory access (403 errors)
- ✅ SSL certificate active (no mixed content warnings)

### Timeline
- **Week 1:** Environment setup + deployment + DB init
- **Week 2:** Security hardening + testing
- **Deliverable date:** End of Week 2
- **Estimated hours:** 35–45

---

## STREAM 4: Missing Portal Creation

### Portals to Build

#### 4A: Secure Command Portal
**Spec:** IZILO-SECURE-001  
**Purpose:** Encrypted communication & incident response coordination  
**Audience:** Incident commanders, senior staff  
**Size estimate:** 120–150KB (single-file HTML)

**Features:**
1. **Incident Board** — active incidents with severity, owner, timeline
2. **Secure Messaging** — real-time chat with client-side encryption (TweetNaCl.js)
3. **Document Vault** — encrypted file storage/sharing with access logs
4. **Contact Directory** — emergency contacts with role-based visibility
5. **Response Playbooks** — step-by-step incident response templates
6. **Status Dashboard** — real-time system health + resource availability
7. **Audit Log** — all actions logged with timestamp + user

**UI Concept:** Command center aesthetic (industrial, precise, calm under pressure)
- Color palette: Uses BLKFR palette but with emphasis on status colors (green/amber/red)
- Typography: IBM Plex Mono for precision; Big Shoulders for section headers
- Layout: Command-center grid (4-column, data-dense but organized)
- Interaction: Keyboard shortcuts, dark theme mandatory (no light variant)
- Animation: Minimal (only status transitions); real-time data pushes without jarring reflows

**Wireframes / Sections:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔥 BLACKFIRE SECURE · INCIDENT COMMAND CENTER               │
├──────────────────────────────────────────────────────────────┤
│ INCIDENTS (6)      │ MESSAGING (4 unread)   │ VAULT          │
│  🔴 P1: Site Down  │ [Real-time chat]       │ [Files]        │
│  🟡 P2: Auth Loop  │                        │                │
│  🟢 P3: Slow API   │                        │                │
├──────────────────────────────────────────────────────────────┤
│ SYSTEM STATUS       │ PLAYBOOKS              │ CONTACTS       │
│  All systems ⬇️    │ [Template list]        │ [Directory]    │
└──────────────────────────────────────────────────────────────┘
```

**Implementation approach:**
- React 18 + TypeScript + Tailwind 3.4.1 (for scalability)
- Bundle as single-file HTML artifact
- Messaging: WebSocket simulation (localStorage for MVP)
- Encryption: TweetNaCl.js (simple NaCl.secretbox for demo)
- Storage: localStorage (production would use backend)

#### 4B: Internal Operations Portal (Izilo Mission Control)
**Spec:** IZILO-OPS-INTERNAL-001  
**Purpose:** Staff scheduling, task management, internal communications  
**Audience:** Operations team, supervisors  
**Size estimate:** 140–170KB

**Features:**
1. **Schedule Board** — staff shift calendar, drag-drop scheduling, time-off requests
2. **Task Manager** — team tasks with assignment, priority, deadline tracking
3. **Team Chat** — internal messaging by team/project
4. **Knowledge Base** — internal wiki (SOP, training, best practices)
5. **Announcements** — org-wide updates, important notices
6. **Time & Attendance** — punch in/out, overtime tracking, attendance reports
7. **Performance Metrics** — team KPIs, individual stats, leaderboards

**UI Concept:** Operations command post (organized, data-focused, productivity-focused)
- Color palette: BLKFR palette + team-color badges
- Typography: Instrument Sans for clarity; Instrument Serif for emphasis
- Layout: Multi-panel dashboard (schedule on left, tasks in center, comms on right)
- Interaction: Drag-drop for scheduling; quick-filters for tasks; search for wiki
- Animation: Smooth transitions between panels; real-time updates without page flicker

**Wireframes:**
```
┌──────────────────────────────────────────────────────────────┐
│ IZILO MISSION CONTROL · OPERATIONS DASHBOARD                │
├──────────┬──────────────────────┬─────────────────────────────┤
│ SCHEDULE │ TODAY'S TASKS        │ TEAM CHAT / ANNOUNCEMENTS   │
│ [Cal]    │ [ ] Set up callout   │ Announcement: New SOP...    │
│          │ [ ] Review invoices  │                             │
│          │ [ ] Update KB        │ #operations-team            │
│          │                      │ New shift requests pending  │
├──────────┴──────────────────────┴─────────────────────────────┤
│ KNOWLEDGE BASE                 │ METRICS                      │
│ [Wiki]                         │ Team: 23 calls/day, 98% SLA  │
└────────────────────────────────┴──────────────────────────────┘
```

#### 4C: Portal Hub (Orchestration Layer)
**Spec:** IZILO-HUB-001  
**Purpose:** Central dashboard to access all portals + user preferences  
**Audience:** All staff  
**Size estimate:** 80–100KB

**Features:**
1. **Portal Navigator** — grid/list of all available portals with quick-access buttons
2. **User Profile** — preferences, password change, API tokens (if applicable)
3. **Recent Activity** — last 10 actions across all systems
4. **Notifications Hub** — centralized alerts from all portals
5. **System Status** — health of all portals + backend services
6. **Help & Support** — contact info, documentation links, ticket submission
7. **Admin Panel** (admins only) — user management, system settings, portal configuration

**UI Concept:** Clean, modern dashboard launcher (iOS-style app grid aesthetic)
- Color palette: BLKFR palette with emphasis on card design
- Typography: Big Shoulders for portal names; Instrument Sans for metadata
- Layout: Customizable grid (2–4 columns based on preference)
- Interaction: Click to open portal in iframe overlay; search to filter portals; drag-reorder
- Animation: Card hover lift effect; icon transitions on state change

**Wireframe:**
```
┌──────────────────────────────────────────────────────────┐
│ ⚙️ Preferences  📢 Notifications  🆘 Help  👤 Profile      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │ 🔥 Brand    │  │ 🔐 Secure   │  │ 📋 AECI      │     │
│  │ System      │  │ Command     │  │ Chempark    │     │
│  └─────────────┘  └─────────────┘  └──────────────┘     │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │ 🏗️ Izilo   │  │ 📊 Legacy   │  │ [+] Add     │     │
│  │ Ops        │  │ Analytics   │  │ Portal      │     │
│  └─────────────┘  └─────────────┘  └──────────────┘     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Implementation Plan

#### Phase 4A: Secure Command Portal (Weeks 2–4)
**Spec:** IZILO-SECURE-001

**Breakdown:**
- **Week 2:** Design system integration, incident board layout, basic state management
- **Week 3:** Messaging component, encryption setup (TweetNaCl), vault UI
- **Week 4:** Playbooks, contacts, status dashboard, testing

**Deliverable:** Single-file HTML (`blackfire-secure.html`, ~130KB)

#### Phase 4B: Internal Ops Portal (Weeks 3–5)
**Spec:** IZILO-OPS-INTERNAL-001

**Breakdown:**
- **Week 3:** Schedule calendar (React Calendar or custom), task list
- **Week 4:** Team chat mockup, KB index
- **Week 5:** Analytics dashboard, time tracking, testing

**Deliverable:** Single-file HTML (`blackfire-internal-portal.html`, ~160KB)

#### Phase 4C: Portal Hub (Weeks 4–5)
**Spec:** IZILO-HUB-001

**Breakdown:**
- **Week 4:** Portal grid layout, user profile, notifications panel
- **Week 5:** Search, admin panel, testing, iframe integration with other portals

**Deliverable:** Single-file HTML (`blackfire-hub.html`, ~100KB)

#### Phase 4D: Integration & Testing (Week 5–6)
**Spec:** IZILO-PORTAL-INTEGRATION-001

**Tasks:**
1. **iframe Overlay System** — all portals load within Hub via iframes
2. **Cross-portal navigation** — consistent "back to hub" behavior
3. **Unified theming** — all portals respond to Hub theme preference
4. **Data synchronization** — shared data (user info, notifications) synced across portals
5. **Responsive testing** — all three new portals at 375px, 768px, 1024px, 1920px
6. **Accessibility audit** — WCAG 2.1 AA compliance (color contrast, keyboard navigation, screen reader)

### Success Criteria
- ✅ Secure Command portal: incident board functional, messaging works, encryption toggle validates
- ✅ Internal Ops portal: schedule, tasks, chat, KB all interactive
- ✅ Portal Hub: all portals accessible via grid, user profile editable, notifications render
- ✅ All portals load via iframe in Hub without layout shift
- ✅ Dark/light theme toggle cascades to all three new portals
- ✅ Mobile-responsive (375px minimum)
- ✅ Bundle sizes: Secure < 140KB, Ops < 180KB, Hub < 100KB

### Timeline
- **Weeks 2–4:** Secure Command portal
- **Weeks 3–5:** Internal Ops portal
- **Weeks 4–5:** Portal Hub
- **Weeks 5–6:** Integration + testing
- **Deliverable date:** End of Week 6
- **Estimated hours:** 80–120

---

## Cross-Stream Considerations

### Parallel Execution & Dependencies

```
STREAM 1: Brand Portal
├─ Week 1–2: Components
├─ Week 2–3: Tokens + Philosophy
└─ Deliverable: Week 3

STREAM 2: AECI Portal
├─ Week 1–2: Mobile redesign
├─ Week 2–3: Error handling
├─ Week 3–4: Features + perf
└─ Deliverable: Week 4

STREAM 3: PHP Backend
├─ Week 1: Setup + deploy
├─ Week 2: Security + testing
└─ Deliverable: Week 2

STREAM 4: New Portals
├─ Week 2–4: Secure Command
├─ Week 3–5: Internal Ops
├─ Week 4–5: Hub
├─ Week 5–6: Integration
└─ Deliverable: Week 6

TIMELINE: Weeks 1–6 concurrent
```

### File Management & Version Control

**Output directory:** `/mnt/user-data/outputs/`  
All final deliverables will be saved here and pushed to GitHub.

**GitHub workflow:**
1. Clone repo at session start
2. Create feature branches per stream:
   - `feature/brand-portal-enhance`
   - `feature/aeci-mobile-redesign`
   - `feature/php-backend-deploy`
   - `feature/secure-command-portal`
   - `feature/internal-ops-portal`
   - `feature/portal-hub`
3. Commit & push after each phase
4. PR review + merge to main

**Session logs:** Each session generates a `.md` log saved to repo `/sessions/` directory with:
- Date, provider, model used
- Phase completed
- Decisions made
- Blockers identified
- Next steps

### Quality Checkpoints

| Checkpoint | Phase | Reviewer | Criteria |
|-----------|-------|----------|----------|
| Design review | End of Week 1 | Jubhele | Aesthetic direction locked; no AI slop |
| Mobile QA | End of Week 2 | Real device testing | 375–1920px responsive |
| Security audit | End of Week 2 (Stream 3) | Code review | OWASP Top 10 compliance |
| Performance baseline | End of Week 3 | Lighthouse | ≥85 score, < 2s FCP |
| Integration test | End of Week 6 | Full portal stack | All portals load; data syncs |

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Scope creep | Medium | High | Locked deliverables per spec; change requests logged separately |
| Design direction misalignment | Low | High | Iterative feedback loops; early prototyping |
| Afrihost deployment issues | Low | High | Test environment setup first; Afrihost support contact on standby |
| Bundle size explosion | Medium | Medium | Webpack/minification strategy; lazy-loading for Stream 4 |
| Performance regression | Medium | Medium | Lighthouse CI at each phase; baseline established Week 1 |

---

## Budget & Timeline Summary

### Effort Estimation

| Stream | Phase | Hours | Notes |
|--------|-------|-------|-------|
| 1: Brand | Components + tokens + philosophy | 45 | Includes refinement iterations |
| 2: AECI | Mobile + error handling + features + perf | 70 | Largest effort; includes testing |
| 3: PHP | Setup + deploy + test | 40 | Straightforward if Afrihost cooperative |
| 4: Portals | Secure + Ops + Hub + integration | 100 | Highest complexity; 3 new systems |
| **Total** | | **255** | ~7 weeks @ 35–40 hrs/week |

### Cost Calculation

**Rate structure:**
- Day 1 (Week 1): R450/hr
- Subsequent (Weeks 2–7): R350/hr
- Equipment markup: +30%

**Calculation:**
- Week 1: 40 hrs × R450 = R18,000
- Weeks 2–7: 215 hrs × R350 = R75,250
- **Subtotal:** R93,250
- **Equipment markup (30%):** +R27,975
- **Grand total:** ~R121,225

**Alternative (conservative estimate — 200 hrs total):**
- Week 1: 40 hrs × R450 = R18,000
- Weeks 2–5: 160 hrs × R350 = R56,000
- Subtotal: R74,000 + 30% = **R96,200**

### Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Brand portal + AECI mobile + PHP setup | Interactive brand system + responsive AECI |
| 2 | AECI error handling + PHP deploy | Error-resilient AECI + live portal backend |
| 3 | AECI features + Secure Command design | Feature-complete AECI + Secure Command MVP |
| 4 | AECI perf + Secure Command build + Ops design | Optimized AECI + functional Secure Command + Ops portal start |
| 5 | Ops portal build + Hub design + integration | Ops portal MVP + Hub launcher + cross-portal links |
| 6 | Hub build + integration + full testing | All portals functional + comprehensive QA |
| 7 | Final refinements + documentation | Production-ready ecosystem |

**Go-live date (estimated):** End of Week 6 (MVP complete, Week 7 for polish)

---

## Success Metrics

### Brand Portal
- ✅ Component library showcases 12+ working components
- ✅ Token export generates valid CSS/JSON/SCSS
- ✅ Dark/light toggle works flawlessly on all components
- ✅ Load time < 2 seconds (4G)
- ✅ Philosophy section conveys BLKFR brand identity

### AECI Portal
- ✅ Mobile layout responsive at 375–1920px
- ✅ All touch targets ≥44px
- ✅ 5+ new features shipped (reporting, bulk actions, export, search, templates)
- ✅ Lighthouse score ≥85 (mobile)
- ✅ All 8 roles tested; RBAC enforced
- ✅ Error messages clear + actionable

### PHP Backend
- ✅ Portal accessible at live URL without errors
- ✅ All 8 roles authenticate; sessions persist
- ✅ Data stored in database (not localStorage)
- ✅ RBAC enforced (verified by role testing)
- ✅ No security warnings (SSL valid, no mixed content)
- ✅ Admin can manage users + roles

### Missing Portals
- ✅ Secure Command: messaging + encryption working
- ✅ Internal Ops: schedule + tasks functional
- ✅ Portal Hub: all portals accessible via iframe grid
- ✅ All three responsive + dark/light compatible
- ✅ Cross-portal navigation seamless

---

## Next Steps (Week 1 Preparation)

### Before work begins:
1. ✅ **Approve this plan** — confirm scope, timeline, budget
2. ✅ **Lock design direction** — review aesthetic concepts for portals (Secure Command command-center vs ops dashboard vibes)
3. ✅ **Afrihost access** — ensure cPanel login + FTP credentials available for Stream 3
4. ✅ **GitHub setup** — confirm MCP GitHub connector configured; ready for pushes
5. ✅ **Reference assets** — confirm BlackFire brand logo files available (`blackfire-icon.png`, `blackfire-logo.png`)
6. ✅ **Session discipline** — agree on logging protocol (after each phase, before session end)

### Week 1 kickoff tasks:
- Stream 1: Set up component structure, start dark/light theme parity testing
- Stream 2: Responsive testing on real mobile devices; identify mobile-specific UX issues
- Stream 3: cPanel database + user creation; verify PHP version
- Stream 4: Design mood boards + wireframes for Secure Command aesthetic

---

## Sign-Off

**Prepared by:** Claude (Anthropic)  
**For:** Jubhele (BlackFire Solutions)  
**Date:** 2026-05-17  
**Status:** DRAFT — Awaiting approval

**Approval checklist:**
- [ ] Scope accepted (all 4 streams, 6-week timeline)
- [ ] Budget approved (~R96K–R121K)
- [ ] Quality standards understood (zero AI slop, museum-quality)
- [ ] Design aesthetic direction locked
- [ ] GitHub + Afrihost access confirmed
- [ ] Session discipline agreement

---

*Fire, taught to behave. — BLKFR*
