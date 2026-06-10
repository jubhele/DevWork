import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Resolve the public directory robustly (handle different process.cwd() during dev)
let publicDir = path.join(process.cwd(), 'apps', 'web', 'public');
if (!fs.existsSync(publicDir)) {
  const alt = path.join(process.cwd(), 'public');
  if (fs.existsSync(alt)) publicDir = alt;
  else {
    const up = path.join(process.cwd(), '..', 'apps', 'web', 'public');
    if (fs.existsSync(up)) publicDir = up;
  }
}

function json(obj: any) {
  return NextResponse.json(obj);
}

// In-memory pilot state for dashboard prefs to allow GET/PUT during dev
let dashboardState: any = { success: true, user_layout: null, default_layout: { enabled: {}, order: ['w-ops','w-fin'] } };

export async function GET(req: Request, { params }: { params: { slug?: string[] } }) {
  try {
    const url = new URL(req.url);
    // derive slug from the request pathname to handle dotted segments
    const pathname = url.pathname || '';
    const afterApi = pathname.startsWith('/api/') ? pathname.slice(5) : pathname.replace(/^\/api\/?/, '');
    const slug = afterApi ? afterApi.split('/').filter(Boolean) : [];
    const name = slug[0] || '';
    const qs = url.searchParams;

    // files.php?action=view -> redirect to public static image
    if (name === 'files.php' && qs.get('action') === 'view') {
      return NextResponse.redirect(new URL('/blackfire_logo_transparent.png', url.origin).toString());
    }
    // Simulate common endpoints with realistic shapes
    if (name === 'auth.php') {
      const action = qs.get('action') || '';
      switch (action) {
        case 'captcha':
          return json({ success: true, question: '8 + 10 = ?' });
        case 'check':
          return json({ success: true, session: null });
        default:
          // default session check
          return json({ success: true, session: null });
      }
    }

    if (name === 'files.php') {
      const action = qs.get('action') || '';
      if (action === 'list') {
        return json({ success: true, attachments: [ { id: 1, filename: 'blackfire_logo_transparent.png', url: '/blackfire_logo_transparent.png', size: 265110, mime: 'image/png', created_at: Date.now() } ] });
      }
      if (action === 'view') {
        // served by redirect above
      }
      if (action === 'download') {
        return json({ success: true, url: '/blackfire_logo_transparent.png' });
      }
      return json({ success: true, attachments: [] });
    }

    if (name === 'callouts.php') {
      return json({ success: true, data: [ { id: 'JOB-001', client: 'AECI Chempark', service: 'Security Pilot', status: 'Open' } ] });
    }

    if (name === 'quotes.php') {
      return json({ success: true, data: [] });
    }

    if (name === 'invoices.php') {
      return json({ success: true, data: [] });
    }

    if (name === 'transactions.php') {
      return json({ success: true, data: [] });
    }

    if (name === 'safety.php') {
      return json({ success: true, data: [] });
    }

    if (name === 'clients.php') {
      return json({ success: true, data: [ { id: 1, name: 'AECI Chempark', email: 'info@aeci.co.za', phone: null } ] });
    }

    if (name === 'users.php') {
      return json({ success: true, data: [] });
    }

    if (name === 'dashboard_prefs.php') {
      return json(dashboardState);
    }

    return json({ success: true, message: 'stub' });
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

// In-memory pilot state for dashboard prefs to allow GET/PUT during dev
let __placeholder_for_helpers = null;

// Minimal multipart parser for development uploads
function parseMultipart(buffer: Buffer, boundary: string) {
  const parts: any[] = [];
  const boundaryBuf = Buffer.from('--' + boundary);
  let start = buffer.indexOf(boundaryBuf);
  while (start !== -1) {
    const next = buffer.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (next === -1) break;
    const partStart = start + boundaryBuf.length + 2; // skip CRLF
    const partEnd = next - 2; // trim trailing CRLF
    if (partEnd <= partStart) { start = next; continue; }
    const partBuf = buffer.slice(partStart, partEnd);
    const headerEnd = partBuf.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = next; continue; }
    const headerText = partBuf.slice(0, headerEnd).toString('utf8');
    const bodyBuf = partBuf.slice(headerEnd + 4);
    const headers: any = {};
    headerText.split('\r\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        headers[line.slice(0, idx).toLowerCase()] = line.slice(idx + 1).trim();
      }
    });
    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^\"]+)"/);
    const filenameMatch = disposition.match(/filename="([^\"]+)"/);
    const part: any = {
      headers,
      name: nameMatch ? nameMatch[1] : undefined,
      filename: filenameMatch ? filenameMatch[1] : undefined,
      contentType: headers['content-type'] || undefined,
      data: bodyBuf,
    };
    parts.push(part);
    start = next;
  }
  return parts;
}

async function ensureDir(dirPath: string) {
  try { await fs.promises.mkdir(dirPath, { recursive: true }); } catch (e) { /* ignore */ }
}

export async function POST(req: Request, { params }: { params: { slug?: string[] } }) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname || '';
    const afterApi = pathname.startsWith('/api/') ? pathname.slice(5) : pathname.replace(/^\/api\/?/, '');
    const slug = afterApi ? afterApi.split('/').filter(Boolean) : [];
    const name = slug[0] || '';

    // files.php - support multipart uploads and simple JSON/urlencoded fallbacks
    if (name === 'files.php') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('multipart/form-data')) {
        const m = contentType.match(/boundary=(.+)$/);
        if (m) {
          const boundary = m[1];
          const arr = Buffer.from(await req.arrayBuffer());
          const parts = parseMultipart(arr, boundary);
          const uploadsDir = path.join(publicDir, 'uploads');
          await ensureDir(uploadsDir);
          const saved: any[] = [];
          for (const p of parts) {
            if (p.filename) {
              const ext = path.extname(p.filename) || '';
              const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
              const outPath = path.join(uploadsDir, filename);
              await fs.promises.writeFile(outPath, p.data);
              saved.push({ original_name: p.filename, url: `/uploads/${filename}`, size: p.data.length });
            }
          }
          return json({ success: true, uploaded: saved });
        }
      }

      // fallback: try JSON or urlencoded body
      const raw = await req.text().catch(() => '');
      let body: any = {};
      if (raw) {
        try { body = JSON.parse(raw); } catch (e) { const sp = new URLSearchParams(raw); sp.forEach((v,k)=>body[k]=v); }
      }
      if (body.action === 'upload' || body.upload) {
        return json({ success: true, id: 123, original_name: body.filename || 'uploaded-file.pdf' });
      }
      return json({ success: true });
    }

    // auth.php - login/logout/session
    if (name === 'auth.php') {
      const raw = await req.text().catch(() => '');
      let body: any = {};
      if (raw) {
        try { body = JSON.parse(raw); } catch (e) { const sp = new URLSearchParams(raw); sp.forEach((v,k)=>body[k]=v); }
      }
      if (body.action === 'login' || body.username) {
        const user = { id: 1, username: body.username || 'pilot_user', name: 'Pilot User', role: 'admin', email: 'pilot@local' };
        const session = { id: 'sess-1', token: 'pilot-token', user_id: user.id, expires: Date.now() + 3600 * 1000 };
        return json({ success: true, user, session });
      }
      if (body.action === 'logout') {
        return json({ success: true });
      }
      return json({ success: true });
    }

    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}



export async function DELETE(req: Request, { params }: { params: { slug?: string[] } }) {
  const url = new URL(req.url);
  const pathname = url.pathname || '';
  const afterApi = pathname.startsWith('/api/') ? pathname.slice(5) : pathname.replace(/^\/api\/?/, '');
  const slug = afterApi ? afterApi.split('/').filter(Boolean) : [];
  const name = slug[0] || '';
  return json({ success: true, name });
}

export async function PUT(req: Request, { params }: { params: { slug?: string[] } }) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname || '';
    const afterApi = pathname.startsWith('/api/') ? pathname.slice(5) : pathname.replace(/^\/api\/?/, '');
    const slug = afterApi ? afterApi.split('/').filter(Boolean) : [];
    const name = slug[0] || '';
    if (name === 'dashboard_prefs.php') {
      const body = await req.json().catch(() => ({}));
      dashboardState = { ...dashboardState, ...body, success: true };
      return json(dashboardState);
    }
    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}
