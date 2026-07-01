import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiAuthHeaders } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JsonRecord = Record<string, unknown>;

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  title?: string;
  role: string;
  roles: string[];
  permissions: string[];
  client_id: number | null;
  active: boolean;
  created_at: string;
  last_login: string | null;
  has_signature?: boolean;
  signature_image?: string;
  signature_updated_by?: string;
  signature_updated_at?: string;
};

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  vat_number: string;
  address: string;
  notes: string;
  is_active: number;
  contacts: Array<{
    contact_name: string;
    email: string;
    phone: string;
    title: string;
    is_primary: number;
  }>;
};

type Attachment = {
  id: number;
  entity_type: string;
  entity_ref: string;
  original_name: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  created_at: string;
};

type MutableRow = {
  id: number;
  ref_id: string;
  [key: string]: unknown;
};

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const ALLOWED_UPLOAD_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const publicDirCandidates = [
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'apps', 'web', 'public'),
  path.resolve(process.cwd(), '..', '..', 'apps', 'web', 'public'),
];
const publicDir = publicDirCandidates.find((candidate) => fs.existsSync(candidate)) || publicDirCandidates[0];

const json = (body: JsonRecord, status = 200) => NextResponse.json(body, { status });

// Forward mutations to the PHP backend using auth from the httpOnly bf_portal cookie.
// Returns null only when API_BASE is not configured — callers fall through to the in-memory mock.
// skipAuthCheck=true forwards without requiring a bf_portal cookie (used for login).
async function proxyMutation(
  method: string,
  phpPath: string,
  searchParams: URLSearchParams,
  rawBody: string,
  contentType: string | null,
  skipAuthCheck = false,
): Promise<NextResponse | null> {
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/+$/, '');
  if (!API_BASE) return null;
  try {
    const authHeaders: Record<string, string> = {};
    if (!skipAuthCheck) {
      const cookieStore = await cookies();
      const h = getApiAuthHeaders(cookieStore.get('bf_portal')?.value);
      if (!h) return json({ success: false, error: 'Not authenticated' }, 401);
      Object.assign(authHeaders, h);
    }
    const qs = searchParams.toString();
    const phpUrl = `${API_BASE}/${phpPath}${qs ? '?' + qs : ''}`;
    const phpRes = await fetch(phpUrl, {
      method,
      headers: { 'Content-Type': contentType || 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...authHeaders },
      body: rawBody || undefined,
    });
    const data: JsonRecord = await phpRes.json().catch(() => ({ success: false, error: 'Invalid API response' }));
    return json(data, phpRes.status);
  } catch {
    // API_BASE is configured but the backend is unreachable — surface the error rather than
    // silently falling through to the in-memory mock (which would give a false success).
    return json({ success: false, error: 'Backend unavailable' }, 502);
  }
}

function parseBody(raw: string): JsonRecord {
  if (!raw) return {};
  try { return JSON.parse(raw) as JsonRecord; } catch { /* empty */ }
  const body: JsonRecord = {};
  new URLSearchParams(raw).forEach((value, key) => { body[key] = value; });
  return body;
}

function routeName(req: Request) {
  const url = new URL(req.url);
  const pathAfterApi = url.pathname.startsWith('/api/')
    ? url.pathname.slice(5)
    : url.pathname.replace(/^\/api\/?/, '');
  return {
    name: pathAfterApi.split('/').filter(Boolean)[0] || '',
    searchParams: url.searchParams,
    origin: url.origin,
  };
}


function nextRef(prefix: string, rows: Array<{ ref_id?: string }>) {
  const max = rows.reduce((m, r) => {
    const n = parseInt(String(r.ref_id ?? '').split('-').pop() ?? '0', 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function quoteTotal(row: MutableRow) {
  if (row.total != null) return toNumber(row.total);
  if (row.total_amount != null) return toNumber(row.total_amount); // PHP column name
  if (row.amount != null) return toNumber(row.amount);
  const items = Array.isArray(row.items) ? row.items : [];
  return items.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const record = item as JsonRecord;
    return sum + toNumber(record.total ?? toNumber(record.qty) * toNumber(record.unit_price));
  }, 0);
}

function normalizeQuote(row: MutableRow) {
  const total = quoteTotal(row);
  const items = Array.isArray(row.items)
    ? row.items.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const record = item as JsonRecord;
        const lineTotal = toNumber(record.total ?? toNumber(record.qty) * toNumber(record.unit_price));
        return { ...record, total: lineTotal };
      })
    : [];
  return {
    ...row,
    quote_number: String(row.quote_number ?? row.quote_no ?? row.ref_id),
    total,
    subtotal: toNumber(row.subtotal ?? total),
    tax: toNumber(row.tax),
    items,
    created_at: String(row.created_at ?? row.quote_date ?? nowIso()),
  };
}

function normalizeInvoice(row: MutableRow) {
  const total = toNumber(row.total ?? row.amount);
  return {
    ...row,
    invoice_number: String(row.invoice_number ?? row.invoice_no ?? row.ref_id),
    amount: toNumber(row.amount ?? total),
    total,
    tax: toNumber(row.tax),
    created_at: String(row.created_at ?? row.invoice_date ?? nowIso()),
    paid_date: row.paid_date ?? null,
  };
}

function dashboardKPIs() {
  const outstanding = invoices.filter((invoice) => invoice.status !== 'Paid');
  const todayStr = today();
  return {
    open_tasks: tasks.filter((t) => !['Done', 'Cancelled'].includes(String(t.status))).length,
    urgent_tasks: tasks.filter((t) => t.priority === 'Urgent' && !['Done', 'Cancelled'].includes(String(t.status))).length,
    tasks_due_today: tasks.filter((t) => String(t.due_date ?? '').slice(0, 10) === todayStr && !['Done', 'Cancelled'].includes(String(t.status))).length,
    open_callouts: callouts.filter((callout) => ['Open', 'In Progress'].includes(String(callout.status))).length,
    overdue_invoices: invoices.filter((invoice) => invoice.status === 'Overdue').length,
    mtd_revenue: invoices
      .filter((invoice) => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + toNumber(invoice.amount ?? invoice.total), 0),
    safety_score: null,
    pending_quotes: quotes.filter((quote) => ['Draft', 'Sent', 'Pending Approval'].includes(String(quote.status))).length,
    active_clients: clients.filter((client) => client.is_active).length,
    outstanding_total: outstanding.reduce((sum, invoice) => sum + toNumber(invoice.amount ?? invoice.total), 0),
  };
}

const MOCK_CREATED_AT = '2026-01-01T00:00:00.000Z';

const users: User[] = [
  {
    id: 1,
    username: 'j.shange',
    name: 'Jughele Shange',
    email: 'j.shange@blackfiresolutions.co.za',
    title: 'Administrator',
    role: 'sysadmin',
    roles: ['sysadmin', 'admin', 'manager', 'safety_officer'],
    permissions: [],
    client_id: null,
    active: true,
    created_at: MOCK_CREATED_AT,
    last_login: null,
  },
  {
    id: 2,
    username: 'z.myeza',
    name: 'Z. Myeza',
    email: 'z.myeza@aeci.example',
    title: 'AECI Contact',
    role: 'client_support',
    roles: ['client_support', 'viewer'],
    permissions: ['callout.view', 'quote.view', 'invoice.view'],
    client_id: 1,
    active: true,
    created_at: MOCK_CREATED_AT,
    last_login: null,
  },
  {
    id: 3,
    username: 'sibu',
    name: 'Sibu',
    email: 'sibu@aeci.example',
    title: 'AECI Contact',
    role: 'viewer',
    roles: ['viewer'],
    permissions: ['callout.view', 'quote.view'],
    client_id: 1,
    active: true,
    created_at: MOCK_CREATED_AT,
    last_login: null,
  },
  {
    id: 4,
    username: 'penny.nzimande',
    name: 'Penny Nzimande',
    email: 'penny.nzimande@aeci.example',
    title: 'AECI Contact',
    role: 'viewer',
    roles: ['viewer'],
    permissions: ['callout.view', 'quote.view'],
    client_id: 1,
    active: true,
    created_at: MOCK_CREATED_AT,
    last_login: null,
  },
  {
    id: 5,
    username: 'field.tech',
    name: 'Field Technician',
    email: 'field.tech@blackfiresolutions.co.za',
    title: 'Technician',
    role: 'senior_tech',
    roles: ['senior_tech'],
    permissions: ['callout.view', 'callout.create', 'callout.update', 'quote.view', 'quote.create'],
    client_id: null,
    active: true,
    created_at: MOCK_CREATED_AT,
    last_login: null,
  },
];

const clients: Client[] = [
  {
    id: 1,
    name: 'AECI Chempark',
    email: 'j.shange@blackfiresolutions.co.za',
    phone: '+27 11 000 0000',
    vat_number: '',
    address: 'Chempark, South Africa',
    notes: 'Pilot-phase client record.',
    is_active: 1,
    contacts: [
      {
        contact_name: 'Jughele Shange',
        email: 'j.shange@blackfiresolutions.co.za',
        phone: '',
        title: 'Primary Contact',
        is_primary: 1,
      },
    ],
  },
];

const callouts: MutableRow[] = [
  {
    id: 1,
    ref_id: 'CALL-0001',
    job_no: 'JOB-0001',
    client_id: 1,
    client_name: 'AECI Chempark',
    client_email: 'j.shange@blackfiresolutions.co.za',
    service: 'Alarm response validation',
    location: 'Chempark Gatehouse',
    tech: 'Field Technician',
    assigned_to: 'field.tech',
    priority: 'Urgent',
    status: 'In Progress',
    callout_date: today(),
    callout_time: '08:30:00',
    notes: 'Runtime validation callout for portal migration.',
    logged_by: 'j.shange',
    po: 'PO-2026-001',
    invoice_generated: false,
    closure_confirmed: false,
    closure_confirmed_by: '',
    closure_notes: '',
  },
];

const quotes: MutableRow[] = [
  {
    id: 1,
    ref_id: 'QTE-0001',
    quote_no: 'QTE-2026-0001',
    client_id: 1,
    client_name: 'AECI Chempark',
    items: [
      { description: 'Alarm response validation', qty: 1, unit_price: 2500 },
      { description: 'Control room reporting', qty: 1, unit_price: 950 },
    ],
    status: 'Pending Approval',
    valid_until: addDays(30),
    quote_date: today(),
    submitted_by: 'field.tech',
    source: 'senior_tech',
    approval_status: 'pending',
    callout_ref: 'CALL-0001',
  },
];

const invoices: MutableRow[] = [
  {
    id: 1,
    ref_id: 'INV-0001',
    invoice_no: 'INV-2026-0001',
    client_id: 1,
    client_name: 'AECI Chempark',
    client_email: 'j.shange@blackfiresolutions.co.za',
    amount: 3967.5,
    due_date: addDays(14),
    status: 'Sent',
    quote_ref: 'QTE-0001',
    callout_ref: 'CALL-0001',
    po: 'PO-2026-001',
    invoice_date: today(),
    sent_at: nowIso(),
    sent_by: 'j.shange',
  },
];

const transactions: Array<{ id: number; [key: string]: unknown }> = [
  {
    id: 1,
    trans_date: today(),
    description: 'Invoice issued - AECI Chempark',
    category: 'Invoice Payment',
    reference: 'INV-0001',
    credit: 0,
    debit: 0,
  },
];

const safetyFiles: MutableRow[] = [
  {
    id: 1,
    ref_id: 'SAF-202606-001',
    contractor: 'AECI Chempark',
    contractor_rep_name: 'Jughele Shange',
    contractor_rep_id: 1,
    appointee162_name: 'Field Technician',
    appointee162_id: 5,
    audit_date: today(),
    region: 'Chempark',
    audit_team: 'BlackFire Safety',
    scope_of_work: 'Pilot compliance validation',
    manpower: 4,
    supervisors: 1,
    she_reps: 1,
    first_aiders: 1,
    auditor_name: 'Jughele Shange',
    sign_off_date: '',
    status: 'Draft',
    score: null,
    to_std_count: 0,
    not_std_count: 0,
    na_count: 0,
    policy_email_sent: false,
    policy_email_date: null,
    sections: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  },
];

let attachments: Attachment[] = [
  {
    id: 1,
    entity_type: 'callout',
    entity_ref: 'CALL-0001',
    original_name: 'blackfire_logo_transparent.png',
    filename: 'blackfire_logo_transparent.png',
    url: '/blackfire_logo_transparent.png',
    size: 0,
    mime_type: 'image/png',
    created_at: nowIso(),
  },
];

let dashboardState: JsonRecord = {
  success: true,
  user_layout: null,
  default_layout: { enabled: {}, order: ['w-ops', 'w-fin'] },
};

const auditLog: JsonRecord[] = [];
const statements: JsonRecord[] = [];

const tasks: MutableRow[] = [
  {
    id: 1,
    ref_id: 'TASK-0001',
    category: 'general',
    title: 'Portal migration validation',
    description: 'Verify all portal pages render correctly after the Umlilo migration.',
    status: 'In Progress',
    priority: 'High',
    assigned_to: 'j.shange',
    assignee_name: 'Jughele Shange',
    created_by: 'j.shange',
    creator_name: 'Jughele Shange',
    created_by_user_id: 1,
    assigned_to_user_id: 1,
    source_callout_ref: null,
    due_date: addDays(7),
    start_at: null,
    end_at: null,
    due_at: null,
    completed_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: 2,
    ref_id: 'TASK-0002',
    category: 'admin',
    title: 'Review AECI contract terms',
    description: null,
    status: 'Open',
    priority: 'Normal',
    assigned_to: 'j.shange',
    assignee_name: 'Jughele Shange',
    created_by: 'j.shange',
    creator_name: 'Jughele Shange',
    created_by_user_id: 1,
    assigned_to_user_id: 1,
    source_callout_ref: null,
    due_date: addDays(14),
    start_at: null,
    end_at: null,
    due_at: null,
    completed_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  },
];

const trackerUpdates: MutableRow[] = [];

function listAttachments(searchParams: URLSearchParams) {
  const entityType = searchParams.get('entity_type') || '';
  const entityRef = searchParams.get('entity_ref') || '';
  return attachments.filter((attachment) => {
    if (entityType && attachment.entity_type !== entityType) return false;
    if (entityRef && attachment.entity_ref !== entityRef) return false;
    return true;
  });
}

function updateByRef<T extends { ref_id?: string; id?: number }>(rows: T[], id: string | null, body: JsonRecord) {
  const row = rows.find((item) => String(item.ref_id || item.id) === String(id));
  if (!row) return null;
  Object.assign(row, body);
  return row;
}

function deleteByRef<T extends { ref_id?: string; id?: number }>(rows: T[], id: string | null) {
  const index = rows.findIndex((item) => String(item.ref_id || item.id) === String(id));
  if (index === -1) return false;
  rows.splice(index, 1);
  return true;
}

async function saveUpload(req: Request, entityType: string, entityRef: string) {
  const formData = await req.formData();
  const files = formData.getAll('file').filter((value): value is File => value instanceof File);
  if (!files.length) {
    formData.forEach((value) => {
      if (value instanceof File) files.push(value);
    });
  }
  const uploadsDir = path.join(publicDir, 'uploads');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const saved: Attachment[] = [];
  for (const file of files) {
    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_UPLOAD_MIME.has(mimeType)) {
      return NextResponse.json({ success: false, error: `File type not allowed: ${mimeType}` }, { status: 415 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    await fs.promises.writeFile(path.join(uploadsDir, filename), bytes);
    const attachment: Attachment = {
      id: attachments.length ? Math.max(...attachments.map((item) => item.id)) + 1 : 1,
      entity_type: entityType,
      entity_ref: entityRef,
      original_name: file.name,
      filename,
      url: `/uploads/${filename}`,
      size: bytes.length,
      mime_type: file.type || 'application/octet-stream',
      created_at: nowIso(),
    };
    attachments.push(attachment);
    saved.push(attachment);
  }

  return saved;
}

export async function GET(req: Request) {
  try {
    const { name, searchParams, origin } = routeName(req);
    const action = searchParams.get('action') || '';

    if (name === 'auth.php') {
      if (action === 'captcha') return json({ success: true, question: '8 + 10 = ?', answer_hint: 18 });
      if (action === 'me') return json({ success: false, user: null }, 401);
      return json({ success: true, session: null });
    }

    if (name === 'files.php') {
      const id = Number(searchParams.get('id'));
      const attachment = attachments.find((item) => item.id === id);
      if (action === 'list') return json({ success: true, data: { attachments: listAttachments(searchParams) }, attachments: listAttachments(searchParams) });
      if (action === 'view' && attachment) return NextResponse.redirect(new URL(attachment.url, origin));
      if (action === 'download' && attachment) return NextResponse.redirect(new URL(attachment.url, origin));
      return json({ success: true, data: { attachments: [] }, attachments: [] });
    }

    if (name === 'dashboard.php') return json({ success: true, data: dashboardKPIs() });
    if (name === 'callouts.php') {
      const id = searchParams.get('id');
      if (id) {
        const callout = callouts.find((c) => String(c.ref_id) === id || String(c.id) === id);
        return callout ? json({ success: true, data: callout }) : json({ success: false, error: 'Not found' }, 404);
      }
      return json({ success: true, data: callouts });
    }
    if (name === 'tasks.php') {
      const id = searchParams.get('id');
      if (id) {
        const task = tasks.find((t) => String(t.ref_id) === id || String(t.id) === id);
        return task ? json({ success: true, data: task }) : json({ success: false, error: 'Not found' }, 404);
      }
      const category = searchParams.get('category');
      const filtered = category ? tasks.filter((t) => t.category === category) : tasks;
      return json({ success: true, data: filtered, total: filtered.length, page: 1, limit: 50, categories: ['admin', 'sales', 'general'] });
    }
    if (name === 'tracker_updates.php') {
      const entityType = searchParams.get('entity_type');
      const entityRef  = searchParams.get('entity_ref');
      const filtered = trackerUpdates.filter((u) => {
        if (entityType && u.entity_type !== entityType) return false;
        if (entityRef  && u.entity_ref  !== entityRef)  return false;
        return true;
      });
      return json({ success: true, data: filtered });
    }
    if (name === 'quotes.php') return json({ success: true, data: quotes.map(normalizeQuote) });
    if (name === 'invoices.php') return json({ success: true, data: invoices.map(normalizeInvoice) });
    if (name === 'transactions.php') return json({ success: true, data: transactions });
    if (name === 'safety.php') {
      const id = searchParams.get('id');
      const row = id ? safetyFiles.find((item) => item.ref_id === id) : null;
      return json({ success: true, data: row || safetyFiles });
    }
    if (name === 'clients.php') return json({ success: true, data: clients.filter((client) => client.is_active || searchParams.get('active') !== '1') });
    if (name === 'users.php') return json({ success: true, data: users });
    if (name === 'dashboard_prefs.php') return json(dashboardState);
    if (name === 'audit.php') return json({ success: true, data: auditLog });
    if (name === 'statements.php') {
      if (action === 'email_options') {
        return json({
          success: true,
          from_options: users.filter((user) => user.email && user.active === true),
          to_options: clients.flatMap((client) => client.contacts.map((contact) => ({ name: contact.contact_name, email: contact.email }))),
        });
      }
      if (action === 'download') {
        const outstanding = invoices.filter((invoice) => invoice.status !== 'Paid');
        return json({
          success: true,
          data: {
            ref_id: searchParams.get('id') || 'STMT-0001',
            invoices: outstanding,
            total_outstanding: outstanding.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0),
            released_at: nowIso(),
            released_by: 'j.shange',
            from_email: 'j.shange@blackfiresolutions.co.za',
            to_emails: 'j.shange@blackfiresolutions.co.za',
          },
        });
      }
      const outstanding = invoices.filter((invoice) => invoice.status !== 'Paid');
      return json({
        success: true,
        data: statements,
        outstanding,
        outstanding_total: outstanding.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0),
      });
    }
    if (name === 'user_signature.php') {
      const user = users.find((item) => item.id === Number(searchParams.get('user_id')));
      return json({
        success: true,
        has_signature: !!user?.signature_image,
        signature_image: user?.signature_image || '',
        signature_updated_by: user?.signature_updated_by || '',
        signature_updated_at: user?.signature_updated_at || '',
      });
    }
    if (name.startsWith('safety_')) return json({ success: true, data: [] });

    return json({ success: true, data: [] });
  } catch (error) {
    return json({ success: false, error: String(error) }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const { name, searchParams } = routeName(req);
    const action = searchParams.get('action') || '';

    if (name === 'files.php') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.clone().formData();
        const entityType = String(formData.get('entity_type') || searchParams.get('entity_type') || 'general');
        const entityRef = String(formData.get('entity_ref') || searchParams.get('entity_ref') || '');
        const saved = await saveUpload(req, entityType, entityRef);
        if (saved instanceof NextResponse) return saved;
        return json({ success: true, attachment: saved[0] || null, attachments: saved, uploaded: saved });
      }
      return json({ success: true });
    }

    const rawBody = await req.text().catch(() => '');
    const body = parseBody(rawBody);

    // auth.php must be handled before proxyMutation — login has no bf_portal cookie yet
    if (name === 'auth.php') {
      const API_BASE_AUTH = process.env.NEXT_PUBLIC_API_BASE ?? '';
      if (API_BASE_AUTH) {
        const authResult = await proxyMutation('POST', name, searchParams, rawBody, req.headers.get('content-type'), true);
        if (authResult) return authResult;
      }
      if (action === 'reset_request') return json({ success: true, message: 'Reset email sent if account exists.' });
      if (action === 'reset_password') return json({ success: true, message: 'Password updated. Please log in.' });
      if (action === 'logout') return json({ success: true });
      const username = String(body.username || '').toLowerCase();
      const user = users.find((item) => item.username === username && item.active === true);
      if (!user) return json({ success: false, error: 'Invalid credentials' }, 401);
      return json({ success: true, user, session: { user_id: user.id, expires_at: addDays(1) } });
    }

    const proxyResult = await proxyMutation('POST', name, searchParams, rawBody, req.headers.get('content-type'));
    if (proxyResult) return proxyResult;

    if (name === 'callouts.php') {
      const client = clients.find((item) => item.id === Number(body.client_id || body.client)) || clients[0];
      const ref_id = nextRef('CALL', callouts);
      const row = {
        id: callouts.length + 1,
        ref_id,
        job_no: ref_id,
        client_id: client.id,
        client_name: client.name,
        client_email: client.email,
        service: String(body.service || ''),
        location: String(body.location || ''),
        tech: String(body.tech || ''),
        assigned_to: String(body.assigned_to || ''),
        priority: String(body.priority || 'Normal'),
        status: String(body.status || 'Open'),
        callout_date: String(body.callout_date || body.date || today()),
        callout_time: String(body.callout_time || body.time || '08:00'),
        notes: String(body.notes || ''),
        logged_by: 'j.shange',
        po: '',
        invoice_generated: false,
        closure_confirmed: false,
        closure_confirmed_by: '',
        closure_notes: '',
      };
      callouts.unshift(row);
      return json({ success: true, data: row });
    }

    if (name === 'quotes.php') {
      const client = clients.find((item) => item.id === Number(body.client_id || body.client)) || clients[0];
      const ref_id = nextRef('QTE', quotes);
      const row = {
        id: quotes.length + 1,
        ref_id,
        quote_no: ref_id,
        client_id: client.id,
        client_name: client.name,
        items: ((body.items as JsonRecord[]) || []).map((item) => ({
          description: String(item.description || item.desc || ''),
          qty: Number(item.qty || 0),
          unit_price: Number(item.unit_price || item.unit || 0),
        })),
        status: 'Draft',
        valid_until: String(body.valid_until || addDays(30)),
        quote_date: today(),
        submitted_by: 'j.shange',
        source: 'staff',
        approval_status: null,
        callout_ref: String(body.callout_ref || ''),
      };
      quotes.unshift(row);
      return json({ success: true, data: normalizeQuote(row) });
    }

    if (name === 'invoices.php') {
      const client = clients.find((item) => item.id === Number(body.client_id || body.client)) || clients[0];
      const ref_id = nextRef('INV', invoices);
      const row = {
        id: invoices.length + 1,
        ref_id,
        invoice_no: ref_id,
        client_id: client.id,
        client_name: client.name,
        client_email: client.email,
        amount: Number(body.amount || 0),
        due_date: String(body.due_date || addDays(30)),
        status: String(body.status || 'Draft'),
        quote_ref: String(body.quote_ref || ''),
        callout_ref: String(body.callout_ref || ''),
        po: String(body.po || ''),
        invoice_date: today(),
        sent_at: '',
        sent_by: '',
      };
      invoices.unshift(row);
      return json({ success: true, data: normalizeInvoice(row) });
    }

    if (name === 'tasks.php') {
      const ref_id = nextRef('TASK', tasks);
      const assignedUser = users.find((u) => u.username === String(body.assigned_to || ''));
      const task = {
        id: tasks.length + 1,
        ref_id,
        category: String(body.category || 'general'),
        title: String(body.title || ''),
        description: body.description ? String(body.description) : null,
        status: 'Open',
        priority: String(body.priority || 'Normal'),
        assigned_to: String(body.assigned_to || 'j.shange'),
        assignee_name: assignedUser?.name ?? String(body.assigned_to || 'Jughele Shange'),
        created_by: 'j.shange',
        creator_name: 'Jughele Shange',
        created_by_user_id: 1,
        assigned_to_user_id: assignedUser?.id ?? 1,
        source_callout_ref: null,
        due_date: body.due_date ? String(body.due_date) : null,
        start_at: null,
        end_at: null,
        due_at: null,
        completed_at: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      tasks.unshift(task);
      return json({ success: true, data: task });
    }

    if (name === 'tracker_updates.php') {
      const update = {
        id: trackerUpdates.length + 1,
        ref_id: `UPD-${String(trackerUpdates.length + 1).padStart(4, '0')}`,
        entity_type: String(body.entity_type || ''),
        entity_ref: String(body.entity_ref || ''),
        label: String(body.label || ''),
        content: String(body.content || ''),
        source_kind: 'manual',
        created_by: 'j.shange',
        updated_by: null,
        created_at: nowIso(),
        updated_at: nowIso(),
        revision_count: 0,
      };
      trackerUpdates.unshift(update);
      return json({ success: true, data: update });
    }

    if (name === 'payments.php') return json({ success: true });
    if (name === 'transactions.php') {
      transactions.unshift({
        id: transactions.length + 1,
        trans_date: String(body.trans_date || body.date || today()),
        description: String(body.description || body.desc || ''),
        category: String(body.category || body.cat || 'Other'),
        reference: String(body.reference || body.ref || ''),
        credit: Number(body.credit || 0),
        debit: Number(body.debit || 0),
      });
      return json({ success: true });
    }

    if (name === 'clients.php') {
      const row: Client = {
        id: clients.length ? Math.max(...clients.map((client) => client.id)) + 1 : 1,
        name: String(body.name || ''),
        email: String(body.email || ''),
        phone: String(body.phone || ''),
        vat_number: String(body.vat_number || ''),
        address: String(body.address || ''),
        notes: String(body.notes || ''),
        is_active: 1,
        contacts: (body.contacts as Client['contacts']) || [],
      };
      clients.push(row);
      return json({ success: true, data: row });
    }

    if (name === 'users.php') {
      const roles = Array.isArray(body.roles) ? body.roles.map(String) : ['viewer'];
      const row: User = {
        id: users.length ? Math.max(...users.map((user) => user.id)) + 1 : 1,
        username: String(body.username || ''),
        name: String(body.name || ''),
        email: String(body.email || ''),
        title: String(body.title || ''),
        role: roles[0] || 'viewer',
        roles,
        permissions: [],
        client_id: null,
        active: true,
        created_at: nowIso(),
        last_login: null,
      };
      users.push(row);
      return json({ success: true, data: row });
    }

    if (name === 'audit.php') {
      auditLog.unshift({ ...body, created_at: nowIso(), username: 'j.shange' });
      return json({ success: true });
    }

    if (name === 'enquiries.php') return json({ success: true, message: 'Enquiry submitted.' });
    if (name === 'statements.php' && action === 'generate') {
      const outstanding = invoices.filter((invoice) => invoice.status !== 'Paid');
      const statement = {
        ref_id: nextRef('STMT', statements as Array<{ ref_id?: string }>),
        status: 'pending_approval',
        created_at: nowIso(),
        invoice_refs: outstanding.map((invoice) => invoice.ref_id).join(','),
        total_outstanding: outstanding.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0),
      };
      statements.unshift(statement);
      return json({ success: true, data: statement, message: 'Statement generated.' });
    }

    if (name === 'safety.php') {
      const ref_id = nextRef('SAF-202606', safetyFiles);
      const row = { ...safetyFiles[0], ...body, id: safetyFiles.length + 1, ref_id, created_at: nowIso(), updated_at: nowIso() };
      safetyFiles.unshift(row);
      return json({ success: true, data: row });
    }

    if (name === 'user_signature.php') {
      const user = users.find((item) => item.id === Number(searchParams.get('user_id')));
      if (user) {
        user.signature_image = String(body.signature_image || '');
        user.signature_updated_by = 'j.shange';
        user.signature_updated_at = nowIso();
        user.has_signature = true;
      }
      return json({ success: true });
    }

    if (name.startsWith('safety_')) return json({ success: true, data: [] });

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: String(error) }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const { name, searchParams } = routeName(req);
    const action = searchParams.get('action') || '';
    const id = searchParams.get('id');
    const rawBody = await req.text().catch(() => '');
    const proxyResult = await proxyMutation('PUT', name, searchParams, rawBody, req.headers.get('content-type'));
    if (proxyResult) return proxyResult;
    const body = parseBody(rawBody);

    if (name === 'dashboard_prefs.php') {
      if (action === 'reset_all') {
        dashboardState = { success: true, user_layout: null, default_layout: { enabled: {}, order: ['w-ops', 'w-fin'] } };
        return json(dashboardState);
      }
      if (action === 'set_default') {
        dashboardState = { ...dashboardState, default_layout: body, success: true };
        return json(dashboardState);
      }
      dashboardState = { ...dashboardState, ...body, success: true };
      return json(dashboardState);
    }

    if (name === 'tasks.php') {
      const task = tasks.find((t) => String(t.ref_id) === id || String(t.id) === id);
      if (!task) return json({ success: false, error: 'Not found' }, 404);
      const allowed = ['status', 'priority', 'title', 'description', 'assigned_to', 'due_date', 'start_at', 'end_at', 'due_at'];
      for (const f of allowed) {
        if (f in body) Object.assign(task, { [f]: body[f] });
      }
      if (body.status === 'Done') task.completed_at = nowIso();
      task.updated_at = nowIso();
      return json({ success: true, data: task });
    }

    if (name === 'tracker_updates.php') {
      const update = trackerUpdates.find((u) => String(u.id) === id);
      if (!update) return json({ success: false, error: 'Not found' }, 404);
      if (body.label  !== undefined) update.label   = String(body.label);
      if (body.content !== undefined) update.content = String(body.content);
      update.updated_by = 'j.shange';
      update.updated_at = nowIso();
      (update.revision_count as number)++;
      return json({ success: true, data: update });
    }

    if (name === 'callouts.php') {
      const row = updateByRef(callouts, id, {
        status: body.status,
        priority: body.priority,
        notes: body.notes,
        assigned_to: body.assigned_to,
        tech: body.tech,
        po: body.po,
      });
      if (row && body.action === 'confirm_closure') {
        Object.assign(row, { closure_confirmed: true, closure_confirmed_by: 'j.shange', closure_notes: body.closure_notes });
      }
      return json({ success: true, data: row, invoice_ref: 'INV-0001' });
    }

    if (name === 'quotes.php') {
      const row = updateByRef(quotes, id, {});
      if (row && body.action === 'approve') Object.assign(row, { status: 'Approved', approval_status: null });
      if (row && body.action === 'reject') Object.assign(row, { status: 'Rejected', approval_status: 'rejected' });
      return json({ success: true, data: row });
    }

    if (name === 'invoices.php') {
      const row = updateByRef(invoices, id, {});
      if (row && body.action === 'send_invoice') Object.assign(row, { status: 'Sent', sent_at: nowIso(), sent_by: 'j.shange' });
      if (row && body.action === 'mark_paid') Object.assign(row, { status: 'Paid' });
      return json({ success: true, data: row, message: 'Invoice updated.' });
    }

    if (name === 'users.php') {
      const user = users.find((item) => item.id === Number(id));
      if (user) {
        Object.assign(user, body);
        if (Array.isArray(body.roles)) user.role = String(body.roles[0] || user.role);
      }
      return json({ success: true, data: user || null });
    }

    if (name === 'clients.php') {
      const client = clients.find((item) => item.id === Number(id));
      if (client) Object.assign(client, body);
      return json({ success: true, data: client || null });
    }

    if (name === 'statements.php') {
      const statement = statements.find((item) => item.ref_id === id);
      if (statement) Object.assign(statement, body, { status: 'released', released_at: nowIso(), released_by: 'j.shange' });
      return json({ success: true, data: statement || null, message: 'Statement released.' });
    }

    if (name === 'safety.php') {
      const row = updateByRef(safetyFiles, id, { ...body, updated_at: nowIso() });
      if (row && body.action === 'approve') Object.assign(row, { status: 'Approved', sign_off_date: today() });
      return json({ success: true, data: row });
    }

    if (name.startsWith('safety_')) return json({ success: true, data: [] });

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: String(error) }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const { name, searchParams } = routeName(req);
    const proxyResult = await proxyMutation('DELETE', name, searchParams, '', null);
    if (proxyResult) return proxyResult;
    const id = searchParams.get('id');

    if (name === 'files.php') {
      attachments = attachments.filter((attachment) => String(attachment.id) !== String(id));
      return json({ success: true });
    }
    if (name === 'tasks.php') {
      const idx = tasks.findIndex((t) => String(t.ref_id) === id || String(t.id) === id);
      if (idx === -1) return json({ success: false, error: 'Task not found' }, 404);
      tasks.splice(idx, 1);
      return json({ success: true });
    }
    if (name === 'callouts.php') return json({ success: deleteByRef(callouts, id) });
    if (name === 'quotes.php') return json({ success: deleteByRef(quotes, id) });
    if (name === 'invoices.php') return json({ success: deleteByRef(invoices, id) });
    if (name === 'clients.php') {
      const client = clients.find((item) => item.id === Number(id));
      if (client) client.is_active = 0;
      return json({ success: true });
    }
    if (name === 'safety.php') return json({ success: deleteByRef(safetyFiles, id) });
    if (name === 'user_signature.php') {
      const user = users.find((item) => item.id === Number(searchParams.get('user_id')));
      if (user) {
        user.signature_image = '';
        user.has_signature = false;
      }
      return json({ success: true });
    }
    if (name.startsWith('safety_')) return json({ success: true });

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: String(error) }, 500);
  }
}
