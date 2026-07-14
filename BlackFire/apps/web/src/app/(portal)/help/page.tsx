const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    sub: 'Portal home & navigation',
    purpose:
      'The portal is your single workspace for all BlackFire operational, financial, and safety work. Your role controls which modules and actions are visible — items you cannot access will not appear in the navigation.',
    steps: [
      'Check your displayed name and role in the top bar — this determines which modules and actions you can access.',
      'Use the top navigation tabs (Dashboard, Operations, Finance, Support) to move between areas.',
      'The secondary bar below the tabs shows sub-sections within the active area.',
      'Use the Help (?) button at any time to return to this guide.',
      'If you cannot find a module you expect to see, contact your Admin — your role may need to be updated.',
    ],
    tips: [
      'Bookmark the portal URL in your browser for fast daily access.',
      'Use the theme (☾) button in the top bar to switch between light and dark mode. Your preference is saved.',
      'The refresh button (↻) reloads the current page data without navigating away.',
    ],
    faqs: [
      { q: "I can't see a module I need. What should I do?", a: 'Contact your Admin. Access is controlled by your role — they can update it.' },
      { q: 'How do I change my password?', a: 'Use the Forgot Password link on the login screen, or ask an Admin to reset it from the Users & Roles page.' },
      { q: 'Can I use the portal on my phone?', a: 'Yes — the portal is fully responsive. A dedicated mobile app is also available for Android and iOS.' },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    sub: 'Your control centre',
    purpose:
      'The central hub showing live tracker work, operational callouts, invoices, and recent activity at a glance. Tasks and callouts are counted separately so internal work never inflates field-operations figures.',
    steps: [
      'Review Urgent Tracker Tasks and Quotes Pending Approval at the top — these need immediate action.',
      'Check Open Tasks (Admin, Sales, General), Open Callouts (field jobs only), Due Today, and Overdue Invoices.',
      'Scan Recent Tracker Activity for work that has not been assigned or progressed.',
      'Click any KPI card or activity row to jump directly to that record in the relevant module.',
      'Use Open Work by Stream to see how work is distributed across Admin, Sales, General, and Call Log.',
    ],
    tips: [
      'Check the dashboard every morning before starting work — it gives the full picture in under a minute.',
      'The dashboard does not auto-refresh. Use the ↻ button to get the latest data.',
      'If Recent Tracker Activity shows the same open work day after day, escalate it to the stream owner.',
    ],
    faqs: [
      { q: 'Why does Open Callouts only show some callouts?', a: 'Open Callouts counts only genuine operational field jobs in the Call Log stream. Internal tasks in Admin, Sales, and General are counted separately as Open Tasks.' },
      { q: 'What does MTD Revenue mean?', a: 'Month-to-date revenue — the total amount invoiced since the first of the current month.' },
    ],
  },
  {
    id: 'tracker',
    title: 'Tracker',
    sub: 'Company workstreams and operational call log',
    purpose:
      'One workspace for all company work. Admin, Sales, and General contain internal tasks; Call Log contains only real client incidents, dispatched service work, and field jobs. Choose the correct stream before you log work — misclassification distorts dashboard counts and reporting.',
    steps: [
      'Choose the stream tab first: Admin for finance, compliance, recruitment; Sales for opportunities and proposals; General for internal systems and training; Call Log for genuine operational events.',
      'Click + New Task while an internal stream is active. The selected stream is pre-filled in the form.',
      'Set a title, owner, priority, status, and Created/Start/End/Due date and time values.',
      'Open a task row to add a labelled description. Each description entry is a separate record and can be edited later — previous versions are preserved.',
      'Use the Files section inside a task to upload PDF, Word, Excel, JPEG, or PNG files (max 10 MB each).',
      'Update the status from Open → In Progress → Done as work progresses.',
      'Use the Call Log tab only for a genuine operational event that may require dispatch, a quote, or an invoice.',
    ],
    tips: [
      'A banking change, payment follow-up, compliance document, portal fix, or team training item is a task — put it in Admin or General, not Call Log.',
      'A client request likely to become quoted work belongs in Sales until it is a confirmed operational job.',
      'Schedule changes, description edits, and file uploads are all written to the Audit Log.',
      'Description edits preserve the prior revision so there is always a full history.',
    ],
    faqs: [
      { q: 'Why did the Open Callouts count drop?', a: "Internal work logged as callouts was moved into the correct Tracker streams. Open Callouts now measures operational jobs only." },
      { q: 'Where is the old Call Log page?', a: 'Call Log is the fourth tab inside Tracker. Old direct links redirect to that tab automatically.' },
      { q: 'Can I overwrite an existing description?', a: 'Edit that description record and save. The visible record changes; the earlier version is preserved as a revision and the action is audited.' },
      { q: 'Which stream should portal bugs use?', a: 'Use General for internal portal defects and system improvements. Only use Call Log when the portal issue is part of a client operational job.' },
    ],
  },
  {
    id: 'call-log',
    title: 'Call Log',
    sub: 'Incident & service callout tracker',
    purpose:
      'The Call Log tab inside Tracker is the complete, auditable record of every genuine security or service callout — incident type, client, assigned technician, PO number, status, and resolution.',
    steps: [
      'Open the Call Log tab in Tracker, then click + Log Call.',
      'Complete all required fields: client, site, service type, description, and priority.',
      'Assign a technician and enter a PO number if available (required before dispatching subcontractors).',
      'Update the status as work progresses: Open → Assigned → In Progress → Closed.',
      'Open a callout record to add descriptions, upload files, or convert to an invoice once work is complete.',
    ],
    tips: [
      'Always assign a PO number before dispatching a subcontractor. Finance requires it for invoice matching.',
      'Update status to In Progress when a technician is on-site — this gives the ops team real-time visibility.',
      'Close callouts within 24 hours of completion. Every open callout inflates dashboard counts.',
      'Never delete a callout that has a linked invoice or quote. Use Closed status instead.',
    ],
    faqs: [
      { q: 'How do I link a callout to an invoice?', a: "Open the callout record and click 'Convert to Invoice' — it pre-fills the invoice with the service type and description." },
      { q: "What's the difference between Assigned and In Progress?", a: 'Assigned means a technician is scheduled but has not started. In Progress means they are actively on-site.' },
      { q: 'Can I attach files to a callout?', a: 'Yes — open the callout record and use the Files section to upload photos, reports, or supporting documents.' },
    ],
  },
  {
    id: 'quotes',
    title: 'Quotes',
    sub: 'Quotation management',
    purpose:
      'Create, track, and approve service quotations. Every approved quote can convert directly into an invoice, eliminating manual re-entry.',
    steps: [
      'Navigate to Finance -> Quote Log, then click + Submit Quote.',
      'Select the client, set a valid-until date, and add an internal reference note.',
      'Add line items: description, quantity, and unit rate. Keep labour and materials as separate lines.',
      'Submit — the quote moves to Pending Approval and the approver is notified.',
      'A Manager or Admin reviews: Approved unlocks Convert to Invoice; Declined returns with a reason.',
      'To convert an approved quote, click Convert to Invoice — billing details are pre-filled.',
    ],
    tips: [
      'Double-check the VAT treatment (inclusive vs exclusive) before submitting.',
      'Set the valid-until date at least 2 weeks out to avoid re-approval cycles.',
      'If you need urgent approval, notify the approver directly — email notifications may be missed.',
    ],
    faqs: [
      { q: 'Can I edit a quote after submitting?', a: "Not once it is Pending Approval — it is in the approver's queue. Only Admins can edit at that stage. Ask your Admin or withdraw and resubmit." },
      { q: 'What happens when a quote expires?', a: 'It is automatically marked Expired. A new quote must be raised with an updated valid-until date.' },
      { q: 'How long should approval take?', a: 'The target is same business day. If a quote has been pending more than 24 hours, follow up with the approver directly.' },
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices',
    sub: 'Billing and payment tracking',
    purpose:
      'Create invoices from scratch, from approved quotes, or from closed callouts. Record payments against open invoices and track outstanding balances.',
    steps: [
      'Navigate to Finance → Invoices to see all open and paid invoices.',
      'Click + New Invoice to create from scratch, or use Convert to Invoice from an approved quote or closed callout.',
      'Set payment terms (30, 60, or 90 days), review line items, and save.',
      'Send the invoice to the client — use the Download action to get a PDF.',
      'When payment is received, click Log Payment to record it against the invoice. Partial payments are supported.',
      'A fully paid invoice automatically moves to Paid status.',
    ],
    tips: [
      'Convert quotes to invoices whenever possible — it eliminates re-entry errors and keeps the audit trail intact.',
      'Log payments on the same day they are received. Delayed entry makes the outstanding balance inaccurate.',
      'Invoices cannot be deleted after a payment has been logged against them.',
    ],
    faqs: [
      { q: 'How do I record a partial payment?', a: "Click Log Payment, enter the amount received, and the system records the balance outstanding. Log subsequent payments the same way." },
      { q: 'Can I edit an invoice after sending?', a: 'Minor edits are allowed by Admins if no payment has been logged. Once a payment exists, the invoice is locked for audit integrity.' },
      { q: 'What are Overdue Invoices on the dashboard?', a: 'Invoices where the due date (invoice date + payment terms) has passed and no full payment is recorded. These should be chased immediately.' },
    ],
  },
  {
    id: 'safety',
    title: 'Safety Files',
    sub: 'Compliance and safety document management',
    purpose:
      'Store, track, and audit the compliance documents required for each site or project. Expiry tracking ensures you are notified before a file lapses and becomes non-compliant.',
    steps: [
      'Navigate to Support → Safety Files to see all current compliance documents.',
      'Use the filter to show All, Compliant, Expiring Soon, or Expired files.',
      'Click a file row to open it and see its full detail, review history, and associated documents.',
      'Click + New Audit to create a new safety assessment or inspection record.',
      'Upload the signed or completed document in the Files tab of each record.',
      'Update the review date whenever a file is renewed — this resets the expiry countdown.',
    ],
    tips: [
      'Files expiring within 30 days appear in the Expiring Soon filter. Review these weekly.',
      'The Safety Compliance percentage on the Dashboard drops when files expire — keep it above 90%.',
      'Documents uploaded here are stored securely and are not accessible to external parties.',
    ],
    faqs: [
      { q: 'Who can add or edit safety files?', a: 'Users with the safety.view permission can view. Creation and editing requires safety.create or admin access.' },
      { q: 'What file types can I upload?', a: 'PDF, Word (.docx), Excel (.xlsx), JPEG, and PNG. Maximum 10 MB per file.' },
      { q: "What does 'Expired' mean?", a: 'The review date has passed and no renewed document has been uploaded. This lowers the compliance score and needs immediate attention.' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance Overview',
    sub: 'Financial health at a glance',
    purpose:
      'A real-time financial snapshot — invoiced, collected, outstanding, and transaction activity. Use this daily to stay on top of cash flow.',
    steps: [
      'Navigate to Finance → Finance Overview.',
      'Review the KPI row: Total Invoiced, Total Collected, Outstanding Balance, and Overdue amount.',
      'Check Invoice Aging — the breakdown shows how much is 0–30, 30–60, and 60+ days overdue.',
      'Use the Transactions list to verify that payments are being logged correctly.',
      'Navigate to Finance → Statements to see a period-level summary for a specific client.',
    ],
    tips: [
      'Invoice Aging over 60 days signals a collection problem. Escalate these to a Manager.',
      'MTD Revenue on the Dashboard reflects only the current calendar month. Finance Overview gives you a wider view.',
    ],
    faqs: [
      { q: 'What is the difference between Invoiced and Collected?', a: 'Invoiced is the total amount billed to clients this period. Collected is what has actually been received and logged as a payment.' },
      { q: 'Who can see the Finance section?', a: 'Users with the finance.income permission — typically Managers, Admins, and Finance staff.' },
    ],
  },
  {
    id: 'support',
    title: 'Support & Admin',
    sub: 'Users, access, and audit',
    purpose:
      'Manage portal users and roles, review the full audit log, and access support resources. Only Admins and Sysadmins can create or modify users.',
    steps: [
      'Navigate to Support → Users & Roles to view all portal users.',
      'Click a user to edit their name, role, or reset their password.',
      'To add a new user, click + New User and complete the required fields.',
      'Navigate to Support → Audit Log to search all recorded actions across the portal.',
      'Filter the audit log by user, date range, or action type to investigate specific events.',
    ],
    tips: [
      'Review the Audit Log weekly for any unexpected actions — especially login attempts, deletions, and role changes.',
      "Use the Audit Log to answer 'who did this and when?' questions before escalating to IT.",
      'Deactivate users immediately when staff leave the organisation — do not delete, as records must be preserved.',
    ],
    faqs: [
      { q: 'Can I delete a user?', a: 'No — users are deactivated, not deleted. This preserves their associated records for audit purposes.' },
      { q: 'What roles are available?', a: 'sysadmin, admin, manager, admin_clerk, call_logger, senior_tech, junior_tech, client_support, safety_officer, viewer. Each controls a different permission set.' },
      { q: 'How do I reset a user password?', a: "Open the user record in Users & Roles, click Reset Password, and the user receives an email with a reset link." },
    ],
  },
]

const guideOverrides = {
  quotes: {
    purpose:
      'Create, track, and approve service quotations from Finance. Standard calls keep one quote and one matching invoice; upgraded call types can carry multiple quotes or staged invoices while keeping the original call log as the source record.',
    steps: [
      'Navigate to Finance -> Quote Log, then click + Submit Quote.',
      'Select the client, set a valid-until date, and add an internal reference note.',
      'Add line items: description, quantity, and unit rate. Keep labour and materials as separate lines.',
      'Submit the quote for approval.',
      'A Manager or Admin reviews: Approved unlocks Convert to Invoice; Declined returns with a reason.',
      'If the same call needs another quote because work was declined, split, or staged, use Upgrade Call Type from the call log and enter a clear reason.',
    ],
    faqs: [
      { q: 'Why is Quote Log under Finance?', a: 'Quotes are commercial documents, so the quote lifecycle now sits with Finance beside Overview and Invoices. Operations keeps only the work execution tracker.' },
      { q: 'Can one call log have multiple quotes?', a: 'Only after an Administrator approves Upgrade Call Type. The reason is saved against the call and written to the Audit Log.' },
      { q: 'What happens when a quote expires?', a: 'It is automatically marked Expired. A new quote must be raised with an updated valid-until date.' },
    ],
  },
  invoices: {
    purpose:
      'Create invoices from scratch, from approved quotes, or from callouts where billing is allowed. New invoices default to a due date 14 days after issue/submission, but the due date can be changed for agreed exceptions.',
    steps: [
      'Navigate to Finance -> Invoices to see all open and paid invoices.',
      'Click + New Invoice to create from scratch, or use Convert to Invoice from an approved quote or allowed callout.',
      'Review the due date. The default is issue/submission date + 14 days, but you may override it for agreed exceptions.',
      'Send or download the invoice once line items and totals are correct.',
      'When payment is received, click Log Payment to record it against the invoice. Partial payments are supported.',
    ],
    faqs: [
      { q: 'Can I edit an invoice after sending?', a: 'Minor edits are allowed by Admins if no payment has been logged. Once a payment exists, the invoice is locked for audit integrity.' },
      { q: 'Can a call log have multiple invoices?', a: 'Yes, after Upgrade Call Type approval. Each invoice should still correspond to its matching quote or billing stage so the commercial audit trail remains clear.' },
      { q: 'What are Overdue Invoices on the dashboard?', a: 'Invoices where the due date has passed and no full payment is recorded. These should be chased immediately.' },
    ],
  },
  finance: {
    purpose:
      'A real-time financial snapshot for Quote Log, invoices, collections, outstanding balances, and transaction activity. Use this daily to stay on top of cash flow.',
    steps: [
      'Navigate to Finance -> Overview.',
      'Use Finance -> Quote Log for quotations and Finance -> Invoices for billing.',
      'Review the KPI row: Total Invoiced, Total Collected, Outstanding Balance, and Overdue amount.',
      'Use Ledger to verify that payments and transactions are being logged correctly.',
    ],
  },
  support: {
    sub: 'Clients, site records, reports, users, access, and audit',
    purpose:
      'Manage Support-owned reference and oversight areas: Clients, Site Timeline, Reports, users, roles, safety files, and the full Audit Log. Only Admins and Sysadmins can create or modify users.',
    steps: [
      'Navigate to Support -> Clients for client records used by call logs, quotes, and invoices.',
      'Keep Site Timeline and Reports grouped under Support whenever those pages are enabled.',
      'Navigate to Support -> Users & Roles to view all portal users.',
      'Navigate to Support -> Audit Log to search all recorded actions across the portal.',
      'Filter the Audit Log by user, date range, or action type to investigate Upgrade Call Type reasons and approvals.',
    ],
  },
} as const

SECTIONS.forEach(section => {
  const override = guideOverrides[section.id as keyof typeof guideOverrides]
  if (override) Object.assign(section, override)
})

function Section({ s }: { s: (typeof SECTIONS)[0] }) {
  return (
    <section className="mb-8 rounded border border-steel-dark bg-white shadow-sm overflow-hidden" id={s.id}>
      <div className="border-b border-steel-dark bg-charcoal px-6 py-4">
        <h2 className="font-display text-2xl text-ink-text">{s.title}</h2>
        <p className="text-xs uppercase tracking-[0.22em] text-ash mt-1">{s.sub}</p>
      </div>
      <div className="p-6 space-y-6">
        <p className="text-sm leading-7 text-ash">{s.purpose}</p>

        <div>
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-ash mb-3 font-semibold">How to use this section</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm leading-6 text-ash">
            {s.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>

        {s.tips.length > 0 && (
          <div className="border-l-2 border-fire-orange bg-[#fff3e8] px-4 py-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-fire-orange mb-2 font-semibold">Tips</h3>
            <ul className="list-disc pl-4 space-y-1.5 text-sm leading-6 text-fire-orange">
              {s.tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
        )}

        {s.faqs.length > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-ash mb-3 font-semibold">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {s.faqs.map((faq, i) => (
                <div key={i} className="border border-steel-dark rounded p-4">
                  <p className="text-sm font-semibold text-ink-text mb-1">{faq.q}</p>
                  <p className="text-sm leading-6 text-ash">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default function HelpPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-5xl text-ink-text">Help & Guide</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Portal and app — complete user guide</p>

      <nav className="mb-8 flex flex-wrap gap-2">
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} className="rounded border border-steel-dark bg-white px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-ash hover:text-ink-text hover:border-fire-orange transition-colors">
            {s.title}
          </a>
        ))}
      </nav>

      {SECTIONS.map(s => <Section key={s.id} s={s} />)}

      <section className="rounded border border-steel-dark bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-ink-text mb-1">Emergency &amp; Support Contacts</h2>
        <p className="text-xs uppercase tracking-[0.2em] text-ash mb-5">For urgent incidents, do not use the portal — call directly</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-l-2 border-fire-orange bg-charcoal p-4">
            <h3 className="font-semibold text-ink-text text-sm">BlackFire Emergency Line</h3>
            <p className="mt-1 text-sm text-ash">+27 68 912 6581</p>
            <p className="text-xs text-ash mt-1">Active security incidents, on-site emergencies, immediate dispatch</p>
          </div>
          <div className="border-l-2 border-steel-dark bg-charcoal p-4">
            <h3 className="font-semibold text-ink-text text-sm">Portal Support</h3>
            <p className="mt-1 text-sm text-ash">Contact your portal Admin for access issues, role changes, or technical problems with the platform.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
