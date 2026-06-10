import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JsonRecord = Record<string, unknown>;

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  title: string;
  role: string;
  roles: string[];
  active: number;
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

const publicDirCandidates = [
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'apps', 'web', 'public'),
  path.resolve(process.cwd(), '..', '..', 'apps', 'web', 'public'),
];
const publicDir = publicDirCandidates.find((candidate) => fs.existsSync(candidate)) || publicDirCandidates[0];

const json = (body: JsonRecord, status = 200) => NextResponse.json(body, { status });

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

async function requestBody(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await req.json().catch(() => ({}))) as JsonRecord;
  }
  const raw = await req.text().catch(() => '');
  const body: JsonRecord = {};
  if (!raw) return body;
  try {
    return JSON.parse(raw) as JsonRecord;
  } catch {
    new URLSearchParams(raw).forEach((value, key) => {
      body[key] = value;
    });
    return body;
  }
}

function nextRef(prefix: string, rows: Array<{ ref_id?: string }>) {
  const next = rows.length + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

const users: User[] = [
  {
    id: 1,
    username: 'j.shange',
    name: 'Jughele Shange',
    email: 'j.shange@blackfiresolutions.co.za',
    title: 'Administrator',
    role: 'sysadmin',
    roles: ['sysadmin', 'admin', 'manager', 'safety_officer'],
    active: 1,
  },
  {
    id: 2,
    username: 'z.myeza',
    name: 'Z. Myeza',
    email: 'z.myeza@aeci.example',
    title: 'AECI Contact',
    role: 'client_support',
    roles: ['client_support', 'viewer'],
    active: 1,
  },
  {
    id: 3,
    username: 'sibu',
    name: 'Sibu',
    email: 'sibu@aeci.example',
    title: 'AECI Contact',
    role: 'viewer',
    roles: ['viewer'],
    active: 1,
  },
  {
    id: 4,
    username: 'penny.nzimande',
    name: 'Penny Nzimande',
    email: 'penny.nzimande@aeci.example',
    title: 'AECI Contact',
    role: 'viewer',
    roles: ['viewer'],
    active: 1,
  },
  {
    id: 5,
    username: 'field.tech',
    name: 'Field Technician',
    email: 'field.tech@blackfiresolutions.co.za',
    title: 'Technician',
    role: 'senior_tech',
    roles: ['senior_tech'],
    active: 1,
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

    if (name === 'callouts.php') return json({ success: true, data: callouts });
    if (name === 'quotes.php') return json({ success: true, data: quotes });
    if (name === 'invoices.php') return json({ success: true, data: invoices });
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
          from_options: users.filter((user) => user.email && user.active),
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
        return json({ success: true, attachment: saved[0] || null, attachments: saved, uploaded: saved });
      }
      return json({ success: true });
    }

    const body = await requestBody(req);

    if (name === 'auth.php') {
      if (action === 'reset_request') return json({ success: true, message: 'Reset email sent if account exists.' });
      if (action === 'reset_password') return json({ success: true, message: 'Password updated. Please log in.' });
      if (action === 'logout') return json({ success: true });
      const username = String(body.username || 'j.shange').toLowerCase();
      const user = users.find((item) => item.username === username && item.active) || users[0];
      return json({ success: true, user, session: { user_id: user.id, expires_at: addDays(1) } });
    }

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
      return json({ success: true, data: row });
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
      return json({ success: true, data: row });
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
        active: 1,
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
    const body = await requestBody(req);

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
      if (row && body.action === 'reject') Object.assign(row, { status: 'Declined', approval_status: 'declined' });
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
    const id = searchParams.get('id');

    if (name === 'files.php') {
      attachments = attachments.filter((attachment) => String(attachment.id) !== String(id));
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
