'use strict';

/* ═══════════════════════════════════════════════════════
   API LAYER - PHP/MySQL Backend
   All data operations go through fetch() to /api/ endpoints
═══════════════════════════════════════════════════════ */

const API_BASE = (() => {
  // Derive API base relative to current page so it works both locally and in production
  const p = window.location.pathname.replace(/\/[^\/]*$/, '');
  return (p || '') + '/api';
})();

async function api(method, endpoint, data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  };
  if (data) opts.body = JSON.stringify(data);
  try {
    const res = await fetch(API_BASE + '/' + endpoint, opts);
    if (res.status === 401) {
      const body = await res.json().catch(() => ({}));
      if (SESSION) {
        // Active session was invalidated server-side
        SESSION = null;
        document.documentElement.dataset.state = 'login';
        showLoginPanel();
        toast('Session expired. Please log in again.', 'err');
        return { success: false, error: 'Session expired' };
      }
      // No session — pass server error through (e.g. failed login attempt)
      return { success: false, ...body };
    }
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return { success: false, error: String(e) };
  }
}

/* ── File upload helper (multipart, not JSON) ──────────────────────── */
async function apiUpload(entityType, entityRef, fileInput) {
  if (!fileInput.files.length) return { success: false, error: 'No file selected' };
  const fd = new FormData();
  fd.append('entity_type', entityType);
  fd.append('entity_ref',  entityRef);
  fd.append('file', fileInput.files[0]);
  try {
    const res = await fetch(API_BASE + '/files.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: fd,
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/* ── data-action click dispatcher ──────────────────────────────────── */
document.addEventListener('click', function(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  switch (action) {
    case 'toggleTheme':         toggleTheme(); break;
    case 'goLogin':             goLogin(); break;
    case 'goPublic':            goPublic(); break;
    case 'goPublicFullscreen':  goPublicFullscreen(); break;
    case 'doLogin':             doLogin(); break;
    case 'showForgotPassword':  showForgotPassword(); break;
    case 'showLoginPanel':      showLoginPanel(); break;
    case 'doRequestReset':      doRequestReset(); break;
    case 'doResetPassword':     doResetPassword(); break;
    case 'doLogout':            doLogout(); break;
    case 'submitContact':       submitContact(); break;
    case 'openTxModal':         openTxModal(); break;
    case 'saveCallout':         saveCallout(); break;
    case 'addLine':             addLine(); break;
    case 'saveQuote':           saveQuote(); break;
    case 'saveInvoice':         saveInvoice(); break;
    case 'logPayment':          logPayment(); break;
    case 'openCreateUserModal': openCreateUserModal(); break;
    case 'closeModalDirect':    closeModalDirect(); break;
    case 'scrollToTop':         scrollToTop(); break;
  }
});

/* ── Attachments modal / panel ─────────────────────────────────────── */
function openAttachmentsModal(entityType, entityRef) {
  openModal('Attachments — ' + entityRef,
    `<div id="attach-modal-area"></div>`);
  loadAttachments(entityType, entityRef);
}

async function loadAttachments(entityType, entityRef) {
  const area = document.getElementById('attach-modal-area');
  if (!area) return;
  const r = await api('GET', `files.php?action=list&entity_type=${encodeURIComponent(entityType)}&entity_ref=${encodeURIComponent(entityRef)}`);
  const canDel = SESSION && ['admin','manager'].includes(SESSION.role);
  const list = (r.attachments || []);
  const fileIcon = m => m === 'application/pdf' ? '📄' : m.includes('sheet') || m.includes('excel') ? '📊' : m.includes('word') ? '📝' : m.includes('image') ? '🖼' : '📎';
  const fmtBytes = b => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(1) + ' MB';
  area.innerHTML = `
    <div style="margin-bottom:12px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">📎 Files (${list.length})</div>
      ${list.length ? list.map(a => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:2px;margin-bottom:6px">
          <span style="font-size:18px">${fileIcon(a.mime_type)}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.original_name)}</div>
            <div style="font-size:10px;color:var(--muted)">${fmtBytes(a.file_size)} · ${esc(a.uploaded_by)} · ${(a.created_at||'').slice(0,10)}</div>
          </div>
          <a href="${API_BASE}/files.php?action=download&id=${a.id}" target="_blank" class="btn btn-g btn-s" style="text-decoration:none">↓ Download</a>
          ${canDel ? `<button class="btn btn-g btn-s" style="color:var(--ember)" onclick="deleteAttachment(${a.id},'${esc(entityType)}','${esc(entityRef)}')">✕</button>` : ''}
        </div>`).join('') : '<div style="font-size:11px;color:var(--muted);font-style:italic;margin-bottom:8px">No files attached yet</div>'}
    </div>
    <div style="padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Upload File</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input type="file" id="attach-file-input" accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png"
          style="flex:1;min-width:0;font-size:11px;padding:6px;background:var(--surface2);border:1px solid var(--border);border-radius:2px;color:var(--text)">
        <button class="btn btn-p btn-s" onclick="uploadAttachment('${esc(entityType)}','${esc(entityRef)}')">Upload</button>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:4px">PDF, Excel, Word, JPEG, PNG · Max 10 MB</div>
    </div>`;
}

async function uploadAttachment(entityType, entityRef) {
  const inp = document.getElementById('attach-file-input');
  if (!inp || !inp.files.length) { toast('Select a file first', 'err'); return; }
  const btn = document.querySelector('#attach-modal-area .btn-p');
  if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }
  const r = await apiUpload(entityType, entityRef, inp);
  if (!r.success) {
    toast(r.error || 'Upload failed', 'err');
    if (btn) { btn.disabled = false; btn.textContent = 'Upload'; }
    return;
  }
  toast('File attached', 'ok');
  await loadAttachments(entityType, entityRef);
}

async function deleteAttachment(id, entityType, entityRef) {
  if (!confirm('Remove this file?')) return;
  const r = await api('DELETE', `files.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Delete failed', 'err'); return; }
  toast('File removed', 'ok');
  await loadAttachments(entityType, entityRef);
}

/* ═══════════════════════════════════════════════════════
   PERMISSIONS MAP (mirrors server-side PERMS)
═══════════════════════════════════════════════════════ */
const PERMS = {
  'callout.view':          ['admin','manager','call_logger','junior_tech','senior_tech','client_support','admin_clerk','viewer'],
  'callout.create':        ['admin','manager','call_logger','client_support'],
  'callout.update_status': ['admin','manager','call_logger','junior_tech','senior_tech','admin_clerk'],
  'callout.assign_po':     ['admin','manager','admin_clerk'],
  'callout.assign_tech':   ['admin','manager','admin_clerk'],
  'callout.delete':        ['admin','manager'],
  'quote.view':            ['admin','manager','senior_tech','client_support','admin_clerk','viewer'],
  'quote.create':          ['admin','manager','senior_tech'],
  'quote.approve':         ['admin','manager'],
  'quote.convert':         ['admin','manager','admin_clerk'],
  'quote.delete':          ['admin','manager'],
  'invoice.view':          ['admin','manager','client_support','admin_clerk','viewer'],
  'invoice.create':        ['admin','manager','admin_clerk'],
  'invoice.mark_paid':     ['admin','manager','admin_clerk'],
  'invoice.delete':        ['admin','manager'],
  'finance.transactions':  ['admin','manager','admin_clerk'],
  'finance.statement':     ['admin','manager','client_support','admin_clerk'],
  'finance.income':        ['admin','manager','admin_clerk'],
  'capture.new_callout':   ['admin','manager','call_logger','client_support'],
  'capture.new_quote':     ['admin','manager','senior_tech'],
  'capture.new_invoice':   ['admin','manager','admin_clerk'],
  'capture.log_payment':   ['admin','manager','admin_clerk'],
  'security.audit':        ['admin'],
  'security.users':        ['admin','manager','admin_clerk'],
  'user.create':           ['admin','manager','admin_clerk'],
  'user.update':           ['admin'],
  'callout.confirm_closure':   ['admin','manager'],
  'invoice.send':              ['admin','manager','admin_clerk'],
  'finance.statement.release': ['admin','manager','admin_clerk'],
  'finance.statement.generate':['admin'],
};
function can(perm){ return (PERMS[perm]||[]).includes(SESSION?.role); }

/* ═══════════════════════════════════════════════════════
   IN-MEMORY CACHE (populated from API on login/refresh)
═══════════════════════════════════════════════════════ */
let DB = { callouts:[], quotes:[], invoices:[], bank:[], users:[] };
let SESSION = null;
let AUDIT_LOG = [];

/* ── Data Refresh Functions ─────────────────────────── */
async function refreshCallouts() {
  const r = await api('GET', 'callouts.php?limit=500');
  if (r.success) DB.callouts = r.data || [];
}
async function refreshQuotes() {
  const r = await api('GET', 'quotes.php?limit=500');
  if (r.success) DB.quotes = r.data || [];
}
async function refreshInvoices() {
  const r = await api('GET', 'invoices.php?limit=500');
  if (r.success) DB.invoices = r.data || [];
}
async function refreshTransactions() {
  const r = await api('GET', 'transactions.php?limit=500');
  if (r.success) DB.bank = r.data || [];
}
async function refreshUsers() {
  if (!can('security.users')) return;
  const r = await api('GET', 'users.php');
  if (r.success) DB.users = r.data || [];
}
async function refreshAll() {
  const tasks = [refreshCallouts(), refreshQuotes(), refreshInvoices(), refreshTransactions()];
  if (can('security.users')) tasks.push(refreshUsers());
  await Promise.all(tasks);
}

/* ── Normalize DB fields from API ────────────────────── */
// API returns snake_case; map to camelCase expected by render functions
function normalizeCallout(c) {
  return {
    id:               c.ref_id || c.id,
    client:           c.client_name,
    clientEmail:      c.client_email || '',
    service:          c.service,
    location:         c.location,
    tech:             c.tech,
    assignedTo:       c.assigned_to,
    priority:         c.priority,
    status:           c.status,
    date:             c.callout_date,
    time:             c.callout_time?.slice(0,5) || '',
    notes:            c.notes || '',
    loggedBy:         c.logged_by,
    po:               c.po || '',
    invoiceGenerated: !!c.invoice_generated,
    closureConfirmed: !!c.closure_confirmed,
    closureConfirmedBy: c.closure_confirmed_by || '',
    closureNotes:     c.closure_notes || '',
  };
}
function normalizeQuote(q) {
  const items = (q.items || []).map(i => ({ desc: i.description, qty: Number(i.qty), unit: Number(i.unit_price) }));
  return {
    id:             q.ref_id || q.id,
    client:         q.client_name,
    items,
    status:         q.status,
    validUntil:     q.valid_until,
    date:           q.quote_date,
    submittedBy:    q.submitted_by,
    source:         q.source,
    approvalStatus: q.approval_status,
  };
}
function normalizeInvoice(i) {
  return {
    id:          i.ref_id || i.id,
    client:      i.client_name,
    clientEmail: i.client_email || '',
    amount:      Number(i.amount),
    dueDate:     i.due_date,
    status:      i.status,
    ref:         i.quote_ref || i.callout_ref || '',
    calloutRef:  i.callout_ref || '',
    po:          i.po || '',
    date:        i.invoice_date,
    sentAt:      i.sent_at || '',
    sentBy:      i.sent_by || '',
  };
}
function normalizeBank(b) {
  return {
    date:   b.trans_date,
    desc:   b.description,
    cat:    b.category,
    ref:    b.reference,
    credit: Number(b.credit),
    debit:  Number(b.debit),
  };
}

// Override DB getters to normalize on read
const _DB = DB;
const proxyDB = {
  get callouts() { return _DB.callouts.map(normalizeCallout); },
  get quotes()   { return _DB.quotes.map(normalizeQuote); },
  get invoices() { return _DB.invoices.map(normalizeInvoice); },
  get bank()     { return _DB.bank.map(normalizeBank); },
  get users()    { return _DB.users; },
  get counters() { return { co:0, q:0, inv:0 }; },
};

/* ═══════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════ */

async function loadCaptcha(){
  const r = await api('GET', 'auth.php?action=captcha');
  if (r.success) {
    document.getElementById('captcha-question').textContent = 'Security check: ' + r.question;
    document.getElementById('l-captcha').value = '';
  }
}

function showLoginPanel(){
  document.getElementById('login-panel').style.display  = '';
  document.getElementById('forgot-panel').style.display = 'none';
  document.getElementById('newpass-panel').style.display = 'none';
  loadCaptcha();
}

function showForgotPassword(){
  document.getElementById('login-panel').style.display  = 'none';
  document.getElementById('forgot-panel').style.display = '';
  document.getElementById('newpass-panel').style.display = 'none';
  document.getElementById('forgot-msg').style.display = 'none';
  document.getElementById('fp-user').value = '';
}

async function doRequestReset(){
  const u = document.getElementById('fp-user').value.trim().toLowerCase();
  if (!u) return;
  const msgEl = document.getElementById('forgot-msg');
  const r = await api('POST', 'auth.php?action=reset_request', { username: u });
  msgEl.textContent = r.message || (r.success ? 'Reset email sent if account exists.' : r.error);
  msgEl.style.background = r.success ? 'var(--grn-glow)' : 'var(--emb-glow)';
  msgEl.style.borderColor = r.success ? 'rgba(26,122,64,.3)' : 'rgba(192,57,43,.3)';
  msgEl.style.color = r.success ? 'var(--pill-paid-txt)' : 'var(--pill-ovr-txt)';
  msgEl.style.display = 'block';
}

async function doResetPassword(){
  const p1 = document.getElementById('np-pass1').value;
  const p2 = document.getElementById('np-pass2').value;
  const msgEl = document.getElementById('newpass-msg');
  if (!p1 || !p2) return;
  if (p1 !== p2) {
    msgEl.textContent = 'Passwords do not match.';
    msgEl.style.display = 'block';
    return;
  }
  const token = new URLSearchParams(window.location.search).get('reset_token');
  if (!token) { msgEl.textContent = 'Invalid reset link.'; msgEl.style.display = 'block'; return; }
  const r = await api('POST', 'auth.php?action=reset_password', { token, password: p1 });
  msgEl.textContent = r.message || (r.success ? 'Password updated. Please log in.' : r.error);
  msgEl.style.background = r.success ? 'var(--grn-glow)' : 'var(--emb-glow)';
  msgEl.style.borderColor = r.success ? 'rgba(26,122,64,.3)' : 'rgba(192,57,43,.3)';
  msgEl.style.color = r.success ? 'var(--pill-paid-txt)' : 'var(--pill-ovr-txt)';
  msgEl.style.display = 'block';
  if (r.success) {
    setTimeout(()=>{ history.replaceState(null,'',window.location.pathname); showLoginPanel(); }, 2500);
  }
}

/* ── Session idle timeout (30 minutes) ── */
let _idleTimer = null;
const IDLE_MS = 30 * 60 * 1000;
function _onActivity(){ clearTimeout(_idleTimer); _idleTimer = setTimeout(()=>{ toast('Session expired due to inactivity.','err'); doLogout(); }, IDLE_MS); }
const _ACTIVITY_EVENTS = ['mousemove','keydown','click','scroll','touchstart'];
function startIdleTimer(){ _ACTIVITY_EVENTS.forEach(e=>document.addEventListener(e,_onActivity,{passive:true})); _onActivity(); }
function stopIdleTimer(){ clearTimeout(_idleTimer); _ACTIVITY_EVENTS.forEach(e=>document.removeEventListener(e,_onActivity)); }

async function doLogin(){
  const u = document.getElementById('l-user').value.trim().toLowerCase();
  const p = document.getElementById('l-pass').value;
  const captcha = parseInt(document.getElementById('l-captcha').value, 10);
  if (!u || !p || isNaN(captcha)) {
    document.getElementById('login-error').textContent = 'Please fill in all fields including the security check.';
    document.getElementById('login-error').classList.add('show');
    return;
  }

  const loginBtn = document.querySelector('#login-screen .btn-login-main');
  if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = 'Signing in…'; }

  const r = await api('POST', 'auth.php?action=login', { username: u, password: p, captcha });

  if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Sign In'; }

  if (!r.success) {
    document.getElementById('login-error').textContent = r.error || 'Incorrect username or password.';
    document.getElementById('login-error').classList.add('show');
    loadCaptcha(); // refresh captcha on failure
    return;
  }
  document.getElementById('login-error').classList.remove('show');

  SESSION = r.user;

  // Build dynamic nav and set identity
  buildNav();
  document.getElementById('pnav-user').textContent = SESSION.name;

  document.documentElement.dataset.state = 'portal';
  document.getElementById('dash-sub').textContent = `AECI CHEMPARK  -  ${(ROLE_LABELS[SESSION.role]||SESSION.role).toUpperCase()} VIEW`;

  // Load all data from API
  toast('Loading data…', 'ok');
  await refreshAll();

  // Navigate to first page for role
  const firstPage = {
    call_logger:'p-new-callout', junior_tech:'p-callouts',
    senior_tech:'p-callouts', client_support:'p-dashboard', admin_clerk:'p-callouts',
  }[SESSION.role] || 'p-dashboard';
  showPortalPage(firstPage, null);
  updateBadges();
  startIdleTimer();
}

async function doLogout(){
  stopIdleTimer();
  await api('POST', 'auth.php?action=logout');
  SESSION = null;
  DB = { callouts:[], quotes:[], invoices:[], bank:[], users:[] };
  document.getElementById('l-user').value = '';
  document.getElementById('l-pass').value = '';
  document.getElementById('login-error').classList.remove('show');
  document.documentElement.dataset.state = 'public';
  pubNav('home');
}

/* ═══════════════════════════════════════════════════════
   AUDIT (client-side, server logs via session)
═══════════════════════════════════════════════════════ */
function audit(action, detail) {
  if (!SESSION) return;
  AUDIT_LOG.unshift({ username: SESSION.username, action, detail, created_at: new Date().toISOString() });
}

// Returns YYYY-MM-DD in the local timezone (not UTC), avoiding date shift for SAST/UTC+2.
function localDateStr(d = new Date()) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

const NAV_CONFIG = [
  { sec:'Overview', items:[
    { id:'p-dashboard', label:'Dashboard', perm:null, icon:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  ]},
  { sec:'Operations', items:[
    { id:'p-callouts', label:'Callouts',  perm:'callout.view', badge:'nb-co',  icon:'<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    { id:'p-timeline', label:'Timeline',  perm:null, icon:'<line x1="3" y1="12" x2="21" y2="12"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>' },
  ]},
  { sec:'Finance', items:[
    { id:'p-transactions', label:'Transactions',     perm:'finance.transactions', icon:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>' },
    { id:'p-invoices',     label:'Invoices',         perm:'invoice.view',         badge:'nb-inv', icon:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { id:'p-quotes',       label:'Quotes',           perm:'quote.view',           badge:'nb-qte', icon:'<path d="M9 14l6-6M9 9h.01M15 15h.01M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>' },
    { id:'p-statement',    label:'Statement',        perm:'finance.statement',    icon:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>' },
    { id:'p-income',       label:'Income Statement', perm:'finance.income',       icon:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
  ]},
  { sec:'Capture', items:[
    { id:'p-new-callout', label:'Log Call',     perm:'capture.new_callout', icon:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
    { id:'p-new-quote',   label:'Submit Quote', perm:'capture.new_quote',   icon:'<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>' },
    { id:'p-new-invoice', label:'New Invoice',  perm:'capture.new_invoice', icon:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
    { id:'p-log-payment', label:'Log Payment',  perm:'capture.log_payment', icon:'<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
  ]},
  { sec:'Security', items:[
    { id:'p-audit', label:'Audit Log',      perm:'security.audit', icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
    { id:'p-users', label:'Users & Roles',  perm:'security.users', icon:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>' },
  ]},
];

function buildNav(){
  const nav = document.getElementById('pnav-links');
  if(!nav) return;
  let html = '';
  let first = true;
  NAV_CONFIG.forEach(group => {
    const visible = group.items.filter(item => !item.perm || can(item.perm));
    if(!visible.length) return;
    if(!first) html += '<div class="pnav-sep"></div>';
    first = false;
    visible.forEach(item => {
      const badge = item.badge ? `<span class="pnbadge" id="${item.badge}">0</span>` : '';
      html += `<div class="pnitem" data-page="${item.id}" onclick="showPortalPage('${item.id}',this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${item.icon}</svg>
        ${item.label}${badge}
      </div>`;
    });
  });
  nav.innerHTML = html;
}

/* ═══════════════════════════════════════════════════════
   DATA STORE
═══════════════════════════════════════════════════════ */
const STORE='bf_v9';
DB = load();

function load(){
  try{ const d=localStorage.getItem(STORE); if(d) return JSON.parse(d); }catch(e){}
  return { callouts:[], quotes:[], invoices:[], bank:[], counters:{co:0,q:0,inv:0} };
}
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(DB)); }catch(e){} }
function nextId(t){
  DB.counters[t] = (DB.counters[t]||0)+1;
  return {co:'JOB',q:'QTE',inv:'INV'}[t]+'-'+String(DB.counters[t]).padStart(3,'0');
}

/* Seed */
function seedData(){
  if(proxyDB.callouts.length||proxyDB.quotes.length||proxyDB.invoices.length) return;
  const d=(o=0)=>{const dt=new Date();dt.setDate(dt.getDate()+o);return localDateStr(dt);};
  proxyDB.callouts=[
    {id:'JOB-001',client:'AECI Chempark',service:'Armed Response - Perimeter Breach',location:'Sector C Gate',tech:'R. Khumalo',assignedTo:'stech',priority:'Emergency',status:'In Progress',date:d(-2),time:'14:22',notes:'Perimeter breach alert. Unit dispatched. Client notified.',loggedBy:'calllog',po:''},
    {id:'JOB-002',client:'AECI Chempark',service:'CCTV System Monthly Sweep',location:'All sectors',tech:'J. Mthembu',assignedTo:'jtech',priority:'Normal',status:'Completed',date:d(-5),time:'08:00',notes:'Monthly camera maintenance completed. Report attached.',loggedBy:'calllog',po:'PO-2026-041'},
    {id:'JOB-003',client:'AECI Chempark',service:'Access Control - Biometric Fault',location:'Gate 2',tech:'J. Mthembu',assignedTo:'jtech',priority:'Urgent',status:'Open',date:d(0),time:'09:15',notes:'Biometric reader offline. Temporary access manual.',loggedBy:'calllog',po:''},
    {id:'JOB-004',client:'AECI Chempark',service:'Weekend Patrol - Full Site',location:'Full site',tech:'R. Khumalo',assignedTo:'stech',priority:'Normal',status:'Invoiced',date:d(-8),time:'06:00',notes:'Scheduled weekend patrol completed without incident.',loggedBy:'manager',po:'PO-2026-039'},
  ];
  proxyDB.quotes=[
    {id:'QTE-001',client:'AECI Chempark',items:[{desc:'Armed Response Contract (12 months)',qty:12,unit:3200},{desc:'Perimeter Patrol - 4 Officers (monthly)',qty:1,unit:28000}],status:'Approved',validUntil:d(30),date:d(-7),submittedBy:'manager',source:'staff',approvalStatus:null},
    {id:'QTE-002',client:'AECI Chempark',items:[{desc:'CCTV System Upgrade - 24 IP Cameras',qty:1,unit:45000},{desc:'Installation, Config & Commissioning',qty:1,unit:8500}],status:'Sent',validUntil:d(14),date:d(-3),submittedBy:'manager',source:'staff',approvalStatus:null},
    {id:'QTE-003',client:'AECI Chempark',items:[{desc:'Electric Fence Repair - Sector B',qty:1,unit:4200},{desc:'Labour & Materials',qty:1,unit:1800}],status:'Pending Approval',validUntil:d(21),date:d(-1),submittedBy:'stech',source:'senior_tech',approvalStatus:'pending'},
  ];
  proxyDB.invoices=[
    {id:'INV-001',client:'AECI Chempark',amount:41975,dueDate:d(14),status:'Sent',ref:'QTE-001',po:'PO-2026-038',date:d(-7)},
    {id:'INV-002',client:'AECI Chempark',amount:18800,dueDate:d(-5),status:'Overdue',ref:'JOB-004',po:'PO-2026-039',date:d(-20)},
    {id:'INV-003',client:'AECI Chempark',amount:9560,dueDate:d(7),status:'Paid',ref:'JOB-002',po:'PO-2026-041',date:d(-10)},
  ];
  proxyDB.bank=[
    {date:d(-10),desc:'Payment received - INV-003',cat:'Invoice Payment',ref:'INV-003',credit:9560,debit:0},
    {date:d(-12),desc:'Fuel - patrol vehicles x3',cat:'Vehicle',ref:'',credit:0,debit:1840},
    {date:d(-15),desc:'Uniform procurement - 6 units',cat:'Equipment',ref:'',credit:0,debit:3200},
  ];
  proxyDB.counters={co:4,q:3,inv:3};
  save();
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const fmt = n=>'R'+Number(n).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'}):'-';
const esc = s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const ROLE_LABELS = {
  admin:'Admin',manager:'Manager',call_logger:'Call Logger',
  junior_tech:'Junior Tech',senior_tech:'Senior Tech',
  client_support:'Client Support',admin_clerk:'Admin Clerk',viewer:'Viewer'
};
const ROLE_COLORS = {
  admin:'emergency',manager:'progress',call_logger:'open',
  junior_tech:'draft',senior_tech:'sent',client_support:'invoiced',
  admin_clerk:'paid',viewer:'draft'
};

function pillH(s){
  const m={Open:'open','In Progress':'progress',Completed:'invoiced',Invoiced:'invoiced',Draft:'draft',Sent:'sent',Approved:'approved',Paid:'paid',Overdue:'overdue',Emergency:'emergency',Urgent:'progress',Normal:'draft','Pending Approval':'pending-approval'};
  const cls=m[s]||'draft';
  if(cls==='pending-approval') return`<span class="pill" style="background:rgba(230,126,34,.1);border-color:rgba(230,126,34,.3);color:var(--warn)">${esc(s)}</span>`;
  return`<span class="pill ${cls}">${esc(s)}</span>`;
}
function rolePill(role){
  const lbl=ROLE_LABELS[role]||role;
  const cls=ROLE_COLORS[role]||'draft';
  return`<span class="pill ${cls}">${esc(lbl)}</span>`;
}
function qtot(items){const s=(items||[]).reduce((a,i)=>a+(+i.qty||0)*(+i.unit||0),0);return{sub:s,vat:s*.15,total:s*1.15};}

function toast(msg,type=''){
  const c=document.getElementById('toaster');
  const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;
  c.appendChild(t);setTimeout(()=>t.remove(),3500);
}
function audit(action,detail=''){
  AUDIT_LOG.unshift({ts:new Date().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),user:SESSION?.username||'?',role:SESSION?.role||'?',action,detail,level:'info'});
  if(AUDIT_LOG.length>200) AUDIT_LOG.pop();
}

/* ═══════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════ */
function toggleTheme(){
  const h=document.documentElement;
  h.dataset.theme=h.dataset.theme==='dark'?'light':'dark';
  localStorage.setItem('bf-theme',h.dataset.theme);
}

/* ═══════════════════════════════════════════════════════
   PUBLIC NAVIGATION
═══════════════════════════════════════════════════════ */
function pubNav(page){
  document.querySelectorAll('.pub-page').forEach(p=>p.classList.remove('active'));
  document.getElementById('pub-'+page).classList.add('active');
  document.querySelectorAll('.pub-nav-link').forEach(l=>l.classList.remove('active'));
  const lnk=document.getElementById('pnl-'+page);if(lnk)lnk.classList.add('active');
  window.scrollTo(0,0);
  if(page==='services') buildSvcGrid('pub');
}
function goPublicFullscreen(){
  document.documentElement.dataset.state='public';
  pubNav('home');
}
function goPublic(){ document.documentElement.dataset.state='public'; }

/* Services / Home utils */
const CATEGORIES=[
  {name:'Armed Response',icon:'&#x1F6A8;',count:7},{name:'CCTV & Surveillance',icon:'&#x1F4F7;',count:8},
  {name:'Access Control',icon:'&#x1F510;',count:6},{name:'Guard Services',icon:'&#x1F46E;',count:8},
  {name:'Electronic Security',icon:'&#x26A1;',count:6},{name:'Investigations',icon:'&#x1F50D;',count:5},
  {name:'Risk Management',icon:'&#x1F6E1;&#xFE0F;',count:5},{name:'Event Security',icon:'&#x1F3AF;',count:5},
];
const SERVICES=[
  {name:'Armed Response 24/7',cat:'Armed Response'},{name:'Panic Button Monitoring',cat:'Armed Response'},
  {name:'Perimeter Patrol',cat:'Armed Response'},{name:'Alarm Response',cat:'Armed Response'},
  {name:'Rapid Reaction Unit',cat:'Armed Response'},{name:'High-Risk Escort',cat:'Armed Response'},{name:'Armed Standby Guard',cat:'Armed Response'},
  {name:'CCTV Installation',cat:'CCTV & Surveillance'},{name:'Camera System Maintenance',cat:'CCTV & Surveillance'},
  {name:'Remote Video Monitoring',cat:'CCTV & Surveillance'},{name:'Control Room Services',cat:'CCTV & Surveillance'},
  {name:'Thermal Imaging',cat:'CCTV & Surveillance'},{name:'License Plate Recognition',cat:'CCTV & Surveillance'},
  {name:'Drone Surveillance',cat:'CCTV & Surveillance'},{name:'Analogue-to-IP Upgrades',cat:'CCTV & Surveillance'},
  {name:'Biometric Access Control',cat:'Access Control'},{name:'Turnstile Installation',cat:'Access Control'},
  {name:'Electric Gates & Booms',cat:'Access Control'},{name:'Visitor Management System',cat:'Access Control'},
  {name:'Card & FOB Systems',cat:'Access Control'},{name:'Intercom & Video Entry',cat:'Access Control'},
  {name:'Industrial Guard Deployment',cat:'Guard Services'},{name:'Retail Floor Security',cat:'Guard Services'},
  {name:'Concierge Security Officers',cat:'Guard Services'},{name:'Cash-in-Transit Escort',cat:'Guard Services'},
  {name:'Parking Marshal Services',cat:'Guard Services'},{name:'Site Security Manager',cat:'Guard Services'},
  {name:'Construction Site Security',cat:'Guard Services'},{name:'Estate & Complex Guarding',cat:'Guard Services'},
  {name:'Alarm System Installation',cat:'Electronic Security'},{name:'Alarm Monitoring',cat:'Electronic Security'},
  {name:'Electric Fence Installation',cat:'Electronic Security'},{name:'Intruder Detection Systems',cat:'Electronic Security'},
  {name:'Smoke & Gas Detection',cat:'Electronic Security'},{name:'Fire Alarm Integration',cat:'Electronic Security'},
  {name:'Corporate Investigations',cat:'Investigations'},{name:'Insurance Fraud Investigation',cat:'Investigations'},
  {name:'Background Screening',cat:'Investigations'},{name:'Asset Tracing',cat:'Investigations'},{name:'Witness Protection',cat:'Investigations'},
  {name:'Security Risk Assessment',cat:'Risk Management'},{name:'Business Continuity Planning',cat:'Risk Management'},
  {name:'Threat & Vulnerability Analysis',cat:'Risk Management'},{name:'Security Audit',cat:'Risk Management'},{name:'Emergency Response Planning',cat:'Risk Management'},
  {name:'Festival & Concert Security',cat:'Event Security'},{name:'Corporate Event Security',cat:'Event Security'},
  {name:'VIP & Executive Protection',cat:'Event Security'},{name:'Crowd Management',cat:'Event Security'},{name:'Sports Event Security',cat:'Event Security'},
];
function buildHomeCats(){
  document.getElementById('home-cats').innerHTML=CATEGORIES.map(c=>`<div class="cat-card" onclick="pubNav('services')"><span class="cat-icon">${c.icon}</span><div class="cat-name">${esc(c.name)}</div><div class="cat-count">${c.count} SERVICES</div></div>`).join('');
}
function buildTicker(){
  const items=SERVICES.slice(0,20).map(s=>`<div class="live-item"><span class="live-dot"></span>${esc(s.name)}</div>`).join('');
  const el=document.getElementById('ticker');if(el)el.innerHTML=items+items;
}
function buildSvcGrid(ctx){
  const gridId=ctx==='pub'?'svc-grid':'portal-svc-grid';
  const filterId=ctx==='pub'?'svc-filters':'portal-svc-filters';
  let active='all';
  const render=()=>{
    const items=active==='all'?SERVICES:SERVICES.filter(s=>s.cat===active);
    document.getElementById(gridId).innerHTML=items.map(s=>`<div class="svc-card"><div class="svc-cat-dot"></div><div><div class="svc-name">${esc(s.name)}</div><div class="svc-cat">${esc(s.cat)}</div></div></div>`).join('');
  };
  const chips=['All',...CATEGORIES.map(c=>c.name)];
  document.getElementById(filterId).innerHTML=chips.map(c=>`<div class="filter-chip ${c==='All'?'active':''}" onclick="filterSvc(this,'${esc(c)}','${ctx}')">${esc(c)}</div>`).join('');
  render();
  window._svcF=window._svcF||{};
  window._svcF[ctx]={setActive:(v)=>{active=v==='All'?'all':v;render();}};
}
function filterSvc(el,cat,ctx){
  document.querySelectorAll(`#${ctx==='pub'?'svc-filters':'portal-svc-filters'} .filter-chip`).forEach(c=>c.classList.remove('active'));
  el.classList.add('active');window._svcF[ctx].setActive(cat);
}
function submitContact(){
  const n=document.getElementById('cf-name').value.trim();
  if(!n){alert('Please fill in your name');return;}
  document.getElementById('cf-success').style.display='block';
  ['cf-name','cf-company','cf-phone','cf-email','cf-location','cf-message'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
}

/* ═══════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════ */
function goLogin(){
  document.documentElement.dataset.state='login';
  // Check for reset_token in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('reset_token')) {
    document.getElementById('login-panel').style.display  = 'none';
    document.getElementById('forgot-panel').style.display = 'none';
    document.getElementById('newpass-panel').style.display = '';
  } else {
    showLoginPanel();
  }
}
function fillCreds(u,p){ document.getElementById('l-user').value=u; document.getElementById('l-pass').value=p; }

function showPortalPage(id, el){
  document.querySelectorAll('.ppage').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.pnitem').forEach(n=>n.classList.remove('active'));
  const page=document.getElementById(id);
  if(page) page.classList.add('active');
  if(el) el.classList.add('active');
  else { const found=document.querySelector(`.pnitem[data-page="${id}"]`); if(found) found.classList.add('active'); }
  audit('VIEW',id);
  // Render with current data immediately, then async-refresh and re-render
  const renders={
    'p-dashboard':    async()=>{ renderDashboard(); await refreshAll(); renderDashboard(); updateBadges(); },
    'p-transactions': async()=>{ renderTransactions(''); await refreshTransactions(); renderTransactions(''); },
    'p-invoices':     async()=>{ renderInvoices(''); await refreshInvoices(); renderInvoices(''); updateBadges(); },
    'p-quotes':       async()=>{ renderQuotes(''); await refreshQuotes(); renderQuotes(''); updateBadges(); },
    'p-callouts':     async()=>{ renderCallouts(''); await refreshCallouts(); renderCallouts(''); updateBadges(); },
    'p-timeline':     async()=>{ renderTimeline(); },
    'p-statement':    async()=>{ renderStatement(); },
    'p-income':       async()=>{ renderIncome(); },
    'p-log-payment':  async()=>{ await refreshInvoices(); renderPayList(); },
    'p-audit':        async()=>{ const r=await api('GET','audit.php?limit=200'); AUDIT_LOG=(r.data||[]).map(e=>({ts:e.created_at?.slice(11,19)||'',user:e.username,role:'',action:e.action,detail:e.detail,level:'info'})); renderAudit(); },
    'p-home':         async()=>{ renderPortalHome(); },
    'p-services':     async()=>{ buildSvcGrid('portal'); },
    'p-new-quote':    async()=>{ initNewQuote(); },
    'p-new-callout':  async()=>{ initNewCallout(); },
    'p-new-invoice':  async()=>{ initNewInvoice(); },
    'p-users':        async()=>{ await refreshUsers(); renderUsers(); },
  };
  if(renders[id]) renders[id]();
}

function toggleSb(){ }
function closeSb(){ }

/* ═══════════════════════════════════════════════════════
   PORTAL HOME EMBED
═══════════════════════════════════════════════════════ */
function renderPortalHome(){
  document.getElementById('portal-home-embed').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:20px">
      ${CATEGORIES.map(c=>`<div class="kcard" style="border-top:2px solid var(--amber);cursor:pointer" onclick="showPortalPage('p-services',null)"><div style="font-size:22px;margin-bottom:6px">${c.icon}</div><div class="klbl">${esc(c.name)}</div><div class="kval" style="font-size:18px">${c.count}</div><div class="ksub">services</div></div>`).join('')}
    </div>
    <div style="padding:18px;background:var(--surface2);border:1px solid var(--border);border-radius:2px;text-align:center">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--ember);letter-spacing:3px;margin-bottom:5px">Fire, taught to behave.</div>
      <div style="font-family:'Big Shoulders Display',sans-serif;font-size:18px;font-weight:700">BlackFire Solutions</div>
      <div style="font-size:11px;color:var(--muted);margin-top:3px">Professional Security Services  -  Gauteng  -  24/7</div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
function renderDashboard(){
  const open=proxyDB.callouts.filter(c=>c.status==='Open'||c.status==='In Progress').length;
  const now=new Date();
  const mtd=proxyDB.invoices.filter(i=>{const d=new Date(i.date+'T00:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((a,i)=>a+i.amount,0);
  const pq=proxyDB.quotes.filter(q=>q.status==='Draft'||q.status==='Sent'||q.status==='Pending Approval').length;
  const net=proxyDB.bank.reduce((a,b)=>a+(b.credit||0)-(b.debit||0),0);
  document.getElementById('kv-co').textContent=open;
  document.getElementById('kv-rev').textContent=fmt(mtd);
  document.getElementById('kv-q').textContent=pq;
  document.getElementById('kv-bal').textContent=fmt(net);

  // Alerts
  const overdue=proxyDB.invoices.filter(i=>i.status==='Overdue').length;
  const urgent=proxyDB.callouts.filter(c=>c.priority==='Urgent'||c.priority==='Emergency').length;
  const pendingQApproval=proxyDB.quotes.filter(q=>q.approvalStatus==='pending').length;
  let alerts='';
  if(overdue>0&&can('invoice.view')) alerts+=`<div class="acard danger"><div class="albl">Overdue Invoices</div><div class="acount">${overdue}</div><div class="adesc">Immediate follow-up</div></div>`;
  if(urgent>0) alerts+=`<div class="acard warn"><div class="albl">Urgent Callouts</div><div class="acount">${urgent}</div><div class="adesc">Priority dispatch</div></div>`;
  if(pendingQApproval>0&&can('quote.approve')) alerts+=`<div class="acard info"><div class="albl">Quotes Pending Approval</div><div class="acount">${pendingQApproval}</div><div class="adesc">Tech-submitted, awaiting review</div></div>`;
  document.getElementById('dash-alerts').innerHTML=alerts;

  // Recent callouts
  const rc=[...proxyDB.callouts].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById('dash-co-tbl').innerHTML=rc.length
    ?rc.map(c=>`<tr><td class="mono">${esc(c.id)}</td><td style="font-size:11px">${esc(c.service.substring(0,30))}${c.service.length>30?'…':''}</td><td>${pillH(c.status)}</td></tr>`).join('')
    :'<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--muted);font-style:italic">No callouts</td></tr>';

  // Revenue chart (only for finance roles)
  const revPanel=document.getElementById('dash-rev-panel');
  if(revPanel) revPanel.style.display=can('finance.income')?'':'none';
  if(can('finance.income')){
    const months=[];const n2=new Date();
    for(let i=5;i>=0;i--){const dt=new Date(n2.getFullYear(),n2.getMonth()-i,1);months.push({lbl:dt.toLocaleDateString('en-ZA',{month:'short'}),m:dt.getMonth(),y:dt.getFullYear()});}
    const data=months.map(m=>proxyDB.invoices.filter(i=>{const d=new Date(i.date+'T00:00:00');return d.getMonth()===m.m&&d.getFullYear()===m.y;}).reduce((a,i)=>a+i.amount,0));
    const max=Math.max(...data,1);
    document.getElementById('rev-chart').innerHTML=data.map((v,i)=>`
      <div class="cbar-w">
        <div class="cval">${v>0?'R'+Math.round(v/1000)+'K':''}</div>
        <div class="cbar" style="height:${Math.max(4,Math.round((v/max)*100))}px" title="${fmt(v)}"></div>
        <div class="clbl">${months[i].lbl}</div>
      </div>`).join('');
  }

  // Nav badges
  const nbCo=document.getElementById('nb-co');if(nbCo)nbCo.textContent=open;
  const nbInv=document.getElementById('nb-inv');if(nbInv)nbInv.textContent=proxyDB.invoices.filter(i=>i.status==='Sent'||i.status==='Overdue').length;
  const nbQte=document.getElementById('nb-qte');if(nbQte)nbQte.textContent=proxyDB.quotes.filter(q=>q.status==='Pending Approval').length;
}

/* ═══════════════════════════════════════════════════════
   CALLOUTS - with PO, status-update, assign-tech, assign-PO
═══════════════════════════════════════════════════════ */
function renderCallouts(search='',filter=''){
  let items=[...proxyDB.callouts].sort((a,b)=>b.date.localeCompare(a.date));
  if(search) items=items.filter(c=>c.id.toLowerCase().includes(search.toLowerCase())||c.service.toLowerCase().includes(search.toLowerCase())||c.location.toLowerCase().includes(search.toLowerCase()));
  if(filter) items=items.filter(c=>c.status===filter);

  // For junior/senior tech: only show assigned to them
  if(SESSION?.role==='junior_tech'||SESSION?.role==='senior_tech'){
    items=items.filter(c=>c.assignedTo===SESSION.username);
  }

  const canStatus=can('callout.update_status');
  const canPO=can('callout.assign_po');
  const canTech=can('callout.assign_tech');
  const canDel=can('callout.delete');
  const canCreate=can('callout.create');

  // Show/hide new callout button
  const btn=document.getElementById('btn-newco');if(btn)btn.style.display=canCreate?'':'none';

  const tbody=document.getElementById('co-table');
  tbody.innerHTML=items.length?items.map(c=>{
    const poCell=c.po
      ?`<span class="mono" style="font-size:10px">${esc(c.po)}</span>`
      :(canPO?`<button class="btn btn-g btn-s" onclick="openAssignPO('${esc(c.id)}')">Assign</button>`:`<span style="color:var(--muted);font-size:11px">-</span>`);
    const loggedByUser=proxyDB.users.find(u=>u.username===c.loggedBy);
    const assignedUser=proxyDB.users.find(u=>u.username===c.assignedTo);
    const assignedDisplay=assignedUser?assignedUser.name:(c.tech||'-');

    const actions=[];
    if(canStatus) actions.push(`<button class="btn btn-g btn-s" onclick="openStatusModal('${esc(c.id)}')">Update Status</button>`);
    if(canTech&&!c.assignedTo) actions.push(`<button class="btn btn-g btn-s" onclick="openAssignTech('${esc(c.id)}')">Assign Tech</button>`);
    if(can('capture.new_quote')) actions.push(`<button class="btn btn-g btn-s" onclick="prefillQuoteFromJob('${esc(c.id)}')">Quote</button>`);
    actions.push(`<button class="btn btn-g btn-s" onclick="openAttachmentsModal('callout','${esc(c.id)}')">Files</button>`);
    // Confirm Closure: shown when status=Completed, not yet confirmed, invoice not yet generated
    if(can('callout.confirm_closure')&&c.status==='Completed'&&!c.closureConfirmed&&!c.invoiceGenerated){
      actions.push(`<button class="btn btn-p btn-s" onclick="openConfirmClosureModal('${esc(c.id)}')">Confirm Closure</button>`);
    }
    if(canDel) actions.push(`<button class="btn btn-g btn-s" onclick="deleteCallout('${esc(c.id)}')">Del</button>`);

    return`<tr>
      <td class="mono">${esc(c.id)}</td>
      <td style="font-size:12px;max-width:180px">${esc(c.service)}<div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px">${esc(c.location||'')}</div></td>
      <td style="font-size:11px">${esc(assignedDisplay)}</td>
      <td>${poCell}</td>
      <td>${pillH(c.priority)}</td>
      <td>${pillH(c.status)}</td>
      <td style="font-size:10px;color:var(--muted)">${esc(loggedByUser?.name||c.loggedBy||'-')}</td>
      <td style="font-size:11px;white-space:nowrap">${fmtD(c.date)}${c.time?'  -  '+esc(c.time):''}</td>
      <td><div class="bgrp">${actions.join('')}</div></td>
    </tr>`;
  }).join(''):'<tr><td colspan="9" style="text-align:center;padding:18px;color:var(--muted);font-style:italic">'+(SESSION?.role==='junior_tech'||SESSION?.role==='senior_tech'?'No callouts assigned to you':'No callouts found')+'</td></tr>';
}

function openStatusModal(id){
  const c=proxyDB.callouts.find(x=>x.id===id);if(!c)return;
  openModal(`Update Status - ${c.id}`,`
    <div style="margin-bottom:14px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:2px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:4px">Service</div>
      <div style="font-size:13px;font-weight:600">${esc(c.service)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">${esc(c.location||'')}  -  Logged ${fmtD(c.date)}</div>
    </div>
    <div class="fgrid">
      <div class="fgroup"><label class="flbl">New Status</label>
        <select class="finput" id="su-status">
          ${['Open','In Progress','Completed','Invoiced'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup"><label class="flbl">Current Priority</label>
        <select class="finput" id="su-priority">
          ${['Normal','Urgent','Emergency'].map(p=>`<option ${c.priority===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup ffull"><label class="flbl">Update Notes</label><textarea class="finput" id="su-notes" rows="3" placeholder="What was done, findings, next steps...">${esc(c.notes||'')}</textarea></div>
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" onclick="saveStatus('${esc(c.id)}')">Save Update</button></div>
  `);
}
async function saveStatus(id){
  const status   = document.getElementById('su-status').value;
  const priority = document.getElementById('su-priority').value;
  const notes    = document.getElementById('su-notes').value.trim();
  const r = await api('PUT', `callouts.php?id=${id}`, { status, priority, notes });
  if (!r.success) { toast(r.error || 'Error updating callout', 'err'); return; }
  await refreshCallouts();
  updateBadges();
  closeModalDirect();
  renderCallouts('');
  renderDashboard();
  toast(`${id} updated → ${status}`, 'ok');
}

function openAssignPO(id){
  const c=proxyDB.callouts.find(x=>x.id===id);if(!c)return;
  openModal(`Assign PO - ${c.id}`,`
    <div style="margin-bottom:14px;font-size:12px;color:var(--muted)">Assign a Purchase Order number to this job. The PO will be referenced on the invoice.</div>
    <div class="fgroup"><label class="flbl">Purchase Order Number</label><input class="finput" id="po-input" value="${esc(c.po||'')}" placeholder="e.g. PO-2026-045"></div>
    <div class="mt3 flex-end"><button class="btn btn-p" onclick="assignPO('${esc(c.id)}')">Assign PO</button></div>
  `);
}

function openAssignTech(id){
  const techs=proxyDB.users.filter(u=>u.role==='junior_tech'||u.role==='senior_tech');
  openModal(`Assign Technician - ${id}`,`
    <div class="fgroup"><label class="flbl">Select Technician</label>
      <select class="finput" id="tech-sel">
        <option value="">- Select -</option>
        ${techs.map(t=>`<option value="${esc(t.username)}">${esc(t.name)}  -  ${esc(ROLE_LABELS[t.role])}</option>`).join('')}
      </select>
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" onclick="saveTechAssign('${esc(id)}')">Assign</button></div>
  `);
}
async function saveTechAssign(id){
  const sel=document.getElementById('tech-sel').value;if(!sel)return;
  const tech=proxyDB.users.find(u=>u.username===sel);if(!tech)return;
  const r = await api('PUT', `callouts.php?id=${id}`, { assigned_to: sel, tech: tech.name });
  if (!r.success) { toast(r.error || 'Error assigning tech', 'err'); return; }
  await refreshCallouts();
  closeModalDirect();
  renderCallouts('');
  toast(`${tech.name} assigned to ${id}`,'ok');
}

/* ── Closure Confirmation ───────────────────────────── */
function openConfirmClosureModal(id){
  const c=proxyDB.callouts.find(x=>x.id===id);if(!c)return;
  openModal(`Confirm Closure — ${c.id}`,`
    <div style="margin-bottom:14px;padding:12px;background:var(--emb-glow);border:1px solid rgba(192,57,43,.3);border-radius:2px">
      <div style="font-size:11px;color:var(--pill-ovr-txt);font-family:'IBM Plex Mono',monospace;letter-spacing:1px;margin-bottom:6px">MANAGER CONFIRMATION REQUIRED</div>
      <div style="font-size:12px;color:var(--text2)">This callout was not closed by the client. A written confirmation and an uploaded document are required before an invoice can be generated.</div>
    </div>
    <div style="margin-bottom:12px;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:2px">
      <div style="font-size:11px;font-weight:600">${esc(c.id)}  —  ${esc(c.service)}</div>
      <div style="font-size:10px;color:var(--muted)">${esc(c.client)}  ·  ${esc(c.location||'')}  ·  ${fmtD(c.date)}</div>
    </div>
    <div class="fgroup" style="margin-bottom:12px">
      <label class="flbl">Confirmation Notes <span style="color:var(--ember)">*</span></label>
      <textarea class="finput" id="cc-notes" rows="4" placeholder="Describe why the client did not close this callout and what written confirmation was received..."></textarea>
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:2px;padding:10px;margin-bottom:14px">
      <div style="font-size:11px;font-weight:600;margin-bottom:6px">Upload Confirmation Document <span style="color:var(--ember)">*</span></div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:8px">Upload the signed/written document confirming this closure. PDF, Word, or image accepted.</div>
      <input type="file" id="cc-doc" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" style="font-size:11px">
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" onclick="saveConfirmClosure('${esc(c.id)}')">Confirm &amp; Generate Invoice</button></div>
  `);
}

async function saveConfirmClosure(id){
  const notes=document.getElementById('cc-notes')?.value?.trim();
  const fileInput=document.getElementById('cc-doc');
  if(!notes){toast('Confirmation notes are required','err');return;}
  if(!fileInput?.files.length){toast('Please upload the confirmation document','err');return;}

  // Upload document first
  const up=await apiUpload('callout',id,fileInput);
  if(!up.success){toast(up.error||'Document upload failed','err');return;}

  // Then confirm closure
  const r=await api('PUT',`callouts.php?id=${id}`,{action:'confirm_closure',closure_notes:notes});
  if(!r.success){toast(r.error||'Error confirming closure','err');return;}

  await refreshCallouts();
  updateBadges();
  closeModalDirect();
  renderCallouts('');
  renderDashboard();
  toast(`${id} closure confirmed — Invoice ${r.invoice_ref||''} created`,'ok');
}

function prefillQuoteFromJob(id){
  const c=proxyDB.callouts.find(x=>x.id===id);if(!c)return;
  showPortalPage('p-new-quote',null);
  setTimeout(()=>{
    const el=document.getElementById('nq-jobref');if(el)el.value=id;
    const cl=document.getElementById('nq-client');if(cl)cl.value=c.client;
  },50);
}

function initNewCallout(){
  document.getElementById('nc-date').value=localDateStr();
  const nt=new Date();
  document.getElementById('nc-time').value=nt.toTimeString().slice(0,5);
}
function saveCallout(){
  const client=document.getElementById('nc-client').value.trim();
  const service=document.getElementById('nc-service').value.trim();
  if(!client||!service){toast('Client and service are required','err');return;}
  const techSel=document.getElementById('nc-tech').value;
  const techUser=proxyDB.users.find(u=>u.username===techSel);
  const id=nextId('co');
  proxyDB.callouts.unshift({
    id,client,service,
    location:document.getElementById('nc-location').value.trim(),
    tech:techUser?techUser.name:'',
    assignedTo:techSel||'',
    priority:document.getElementById('nc-priority').value,
    status:document.getElementById('nc-status').value,
    date:document.getElementById('nc-date').value,
    time:document.getElementById('nc-time').value,
    notes:document.getElementById('nc-notes').value.trim(),
    loggedBy:SESSION?.username||'',
    po:'',
  });
  // Reset form
  ['nc-service','nc-location','nc-notes'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  document.getElementById('nc-priority').value='Normal';
  document.getElementById('nc-status').value='Open';
  document.getElementById('nc-tech').value='';
  save();
  toast(`${id} logged`,'ok');
  audit('CREATE',`New callout: ${id}  -  ${service}`);
  // Route back to callouts list
  showPortalPage('p-callouts',null);
}

function delCo(id){
  if(!confirm(`Delete ${id}?`))return;
  proxyDB.callouts=proxyDB.callouts.filter(c=>c.id!==id);
  save();renderCallouts();renderDashboard();toast('Callout deleted');audit('DELETE',`${id}`);
}

/* ═══════════════════════════════════════════════════════
   QUOTES - with approval workflow
═══════════════════════════════════════════════════════ */
function renderQuotes(search='',filter=''){
  let items=[...proxyDB.quotes].sort((a,b)=>b.date.localeCompare(a.date));
  if(search) items=items.filter(q=>q.id.toLowerCase().includes(search.toLowerCase())||q.client.toLowerCase().includes(search.toLowerCase()));
  if(filter) items=items.filter(q=>q.status===filter);

  // Senior tech only sees their own
  if(SESSION?.role==='senior_tech') items=items.filter(q=>q.submittedBy===SESSION.username||q.approvalStatus!=null);

  const canApprove=can('quote.approve');
  const canConvert=can('quote.convert');
  const canDel=can('quote.delete');

  const btn=document.getElementById('btn-newq');
  if(btn)btn.style.display=can('capture.new_quote')?'':'none';

  document.getElementById('qte-table').innerHTML=items.length?items.map(q=>{
    const{total}=qtot(q.items);
    const submitter=proxyDB.users.find(u=>u.username===q.submittedBy);
    const submitterCell=submitter?`${esc(submitter.name)}<div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted)">${esc(ROLE_LABELS[submitter.role]||submitter.role)}</div>`:'<span style="color:var(--muted)">-</span>';
    const actions=[];
    actions.push(`<button class="btn btn-g btn-s" onclick="previewQuote('${esc(q.id)}')">View</button>`);
    if(canApprove&&q.approvalStatus==='pending'){
      actions.push(`<button class="btn btn-s" style="background:var(--grn-glow);border-color:var(--green);color:var(--pill-paid-txt)" onclick="approveQuote('${esc(q.id)}')">Approve</button>`);
      actions.push(`<button class="btn btn-s" style="background:var(--emb-glow);border-color:var(--ember);color:var(--pill-ovr-txt)" onclick="rejectQuote('${esc(q.id)}')">Decline</button>`);
    }
    if(canConvert&&q.status!=='Pending Approval') actions.push(`<button class="btn btn-g btn-s" onclick="convertToInvoice('${esc(q.id)}')">Invoice</button>`);
    if(canDel) actions.push(`<button class="btn btn-g btn-s" onclick="deleteQuote('${esc(q.id)}')">Del</button>`);
    return`<tr>
      <td class="mono">${esc(q.id)}</td>
      <td>${esc(q.client)}</td>
      <td class="amt">${fmt(total)}</td>
      <td style="font-size:11px">${submitterCell}</td>
      <td style="font-size:11px;white-space:nowrap">${fmtD(q.validUntil)}</td>
      <td>${pillH(q.status)}</td>
      <td><div class="bgrp">${actions.join('')}</div></td>
    </tr>`;
  }).join(''):'<tr><td colspan="7" style="text-align:center;padding:18px;color:var(--muted);font-style:italic">No quotes</td></tr>';
}

function approveQuote(id){
  const q=proxyDB.quotes.find(x=>x.id===id);if(!q)return;
  q.approvalStatus=null;q.status='Sent';
  save();renderQuotes();renderDashboard();toast(`${id} approved - status: Sent`,'ok');
  audit('APPROVE_QUOTE',`${id} approved by ${SESSION?.username}`);
}
function declineQuote(id){
  const q=proxyDB.quotes.find(x=>x.id===id);if(!q)return;
  q.approvalStatus='declined';q.status='Declined';
  save();renderQuotes();renderDashboard();toast(`${id} declined`,'err');
  audit('DECLINE_QUOTE',`${id} declined by ${SESSION?.username}`);
}

function previewQuote(id){
  const q=proxyDB.quotes.find(x=>x.id===id);if(!q)return;
  const{sub,vat,total}=qtot(q.items);
  openModal(`Quote - ${q.id}`,`
    <div class="doc-preview">
      <div class="doc-logo-row">
        <div><div class="doc-bname">BLACK<em>FIRE</em></div><div class="doc-btag">Security Solutions</div></div>
        <div style="text-align:right;font-size:11px;color:#7A7566">+27 68 912 6581<br>info@blackfiresolutions.co.za</div>
      </div>
      <div class="doc-type">QUOTATION</div>
      <div class="doc-meta">
        <div><div class="dml">Quote #</div><div class="dmv" style="font-family:'IBM Plex Mono',monospace">${esc(q.id)}</div></div>
        <div><div class="dml">Client</div><div class="dmv">${esc(q.client)}</div></div>
        <div><div class="dml">Date</div><div class="dmv">${fmtD(q.date)}</div></div>
        <div><div class="dml">Valid Until</div><div class="dmv">${fmtD(q.validUntil)}</div></div>
      </div>
      ${q.approvalStatus==='pending'?'<div style="padding:8px 12px;background:#fff3e0;border-left:3px solid #E67E22;margin-bottom:14px;font-size:11px;color:#E67E22">⚠ Pending Manager Approval - not yet issued to client</div>':''}
      <table class="doc-t">
        <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>${(q.items||[]).map(i=>`<tr><td>${esc(i.desc)}</td><td>${i.qty}</td><td>${fmt(i.unit)}</td><td>${fmt(i.qty*i.unit)}</td></tr>`).join('')}</tbody>
      </table>
      <div class="doc-tots">
        <div class="doc-tot-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
        <div class="doc-tot-row"><span>VAT (15%)</span><span>${fmt(vat)}</span></div>
        <div class="doc-tot-row grand"><span>TOTAL</span><span>${fmt(total)}</span></div>
      </div>
      <div class="doc-note">Fire, taught to behave.  -  BlackFire Solutions (Pty) Ltd</div>
    </div>
    <div id="attach-modal-area" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)"></div>`);
  loadAttachments('quote', id);
}

function convertQtoInv(id){
  const q=proxyDB.quotes.find(x=>x.id===id);if(!q)return;
  const{total}=qtot(q.items);
  const invId=nextId('inv');
  const due=new Date();due.setDate(due.getDate()+30);
  proxyDB.invoices.unshift({id:invId,client:q.client,amount:total,dueDate:localDateStr(due),status:'Draft',ref:q.id,po:'',date:localDateStr()});
  save();showPortalPage('p-invoices',null);toast(`Invoice ${invId} created from ${id}`,'ok');audit('CREATE',`Invoice ${invId} from ${id}`);
}

function delQuote(id){
  if(!confirm(`Delete ${id}?`))return;
  proxyDB.quotes=proxyDB.quotes.filter(q=>q.id!==id);save();renderQuotes();toast('Quote deleted');audit('DELETE',id);
}

function initNewQuote(){
  const isSeniorTech=SESSION?.role==='senior_tech';
  document.getElementById('nq-page-title').textContent=isSeniorTech?'Submit Quote for Approval':'New Quote';
  document.getElementById('nq-page-sub').textContent=isSeniorTech?'SENIOR TECH  -  PENDING MANAGER REVIEW':'BUILD PROPOSAL';
  document.getElementById('nq-pending-notice').style.display=isSeniorTech?'block':'none';
  document.getElementById('nq-status-group').style.display=isSeniorTech?'none':'block';
  document.getElementById('nq-submit-btn').textContent=isSeniorTech?'Submit for Approval →':'Save Quote';
  const due=new Date();due.setDate(due.getDate()+30);
  document.getElementById('nq-valid').value=localDateStr(due);
  document.getElementById('li-body').innerHTML='';
  addLine();addLine();recalcQ();
}
function addLine(){
  const r=document.createElement('tr');
  r.innerHTML=`<td><input class="liinput" placeholder="Service / item description" oninput="recalcQ()"></td><td><input class="liinput" type="number" value="1" min="0" style="width:60px" oninput="recalcQ()"></td><td><input class="liinput" type="number" value="0" min="0" step="0.01" style="width:90px" oninput="recalcQ()"></td><td class="mono lt" style="font-size:11px">R0.00</td><td><button class="btn btn-g btn-s" onclick="this.closest('tr').remove();recalcQ()">✕</button></td>`;
  document.getElementById('li-body').appendChild(r);recalcQ();
}
function recalcQ(){
  let sub=0;
  document.querySelectorAll('#li-body tr').forEach(r=>{
    const ins=r.querySelectorAll('input');const q2=parseFloat(ins[1]?.value)||0,u=parseFloat(ins[2]?.value)||0,lt=q2*u;sub+=lt;
    const ltc=r.querySelector('.lt');if(ltc)ltc.textContent=fmt(lt);
  });
  const s=document.getElementById('quote-sum');
  if(s)s.innerHTML=`<div class="sumbox"><div class="sumrow"><span>Subtotal</span><span class="mono">${fmt(sub)}</span></div><div class="sumrow sm"><span>VAT (15%)</span><span class="mono">${fmt(sub*.15)}</span></div><div class="sumrow tot"><span>Total</span><span class="mono">${fmt(sub*1.15)}</span></div></div>`;
}
function saveQuote(){
  const client=document.getElementById('nq-client').value.trim();
  if(!client){toast('Client required','err');return;}
  const rows=document.querySelectorAll('#li-body tr');const items=[];
  rows.forEach(r=>{const ins=r.querySelectorAll('input');const desc=ins[0]?.value?.trim();const qty=parseFloat(ins[1]?.value)||0;const unit=parseFloat(ins[2]?.value)||0;if(desc)items.push({desc,qty,unit});});
  const isSeniorTech=SESSION?.role==='senior_tech';
  const id=nextId('q');
  proxyDB.quotes.unshift({
    id,client,items,
    status:isSeniorTech?'Pending Approval':(document.getElementById('nq-status')?.value||'Draft'),
    validUntil:document.getElementById('nq-valid').value,
    date:localDateStr(),
    submittedBy:SESSION?.username||'',
    source:isSeniorTech?'senior_tech':'staff',
    approvalStatus:isSeniorTech?'pending':null,
    jobRef:document.getElementById('nq-jobref')?.value?.trim()||'',
  });
  save();
  if(isSeniorTech){
    toast(`${id} submitted for approval`,'ok');
    audit('SUBMIT_QUOTE',`${id} submitted by ${SESSION.username} - pending approval`);
    showPortalPage('p-quotes',null);
  } else {
    toast(`Quote ${id} saved`,'ok');
    audit('CREATE',`Quote ${id}`);
    showPortalPage('p-quotes',null);
  }
}

/* ═══════════════════════════════════════════════════════
   INVOICES
═══════════════════════════════════════════════════════ */
function renderInvoices(search='',filter=''){
  let items=[...proxyDB.invoices].sort((a,b)=>b.date.localeCompare(a.date));
  if(search) items=items.filter(i=>i.id.toLowerCase().includes(search.toLowerCase())||i.client.toLowerCase().includes(search.toLowerCase()));
  if(filter) items=items.filter(i=>i.status===filter);
  const canMod=can('invoice.create');const canPaid=can('invoice.mark_paid');const canDel=can('invoice.delete');const canSend=can('invoice.send');
  const btn=document.getElementById('btn-newinv');if(btn)btn.style.display=canMod?'':'none';
  document.getElementById('inv-table').innerHTML=items.length?items.map(inv=>`
    <tr><td class="mono">${esc(inv.id)}</td><td>${esc(inv.client)}</td><td class="amt">${fmt(inv.amount)}</td><td style="font-size:11px;white-space:nowrap">${fmtD(inv.dueDate)}</td><td>${pillH(inv.status)}</td>
    <td><div class="bgrp">
      <button class="btn btn-g btn-s" onclick="previewInvoice('${esc(inv.id)}')">View</button>
      ${canSend&&inv.status!=='Paid'&&inv.status!=='Cancelled'&&inv.amount>0?`<button class="btn btn-p btn-s" onclick="openSendInvoiceModal('${esc(inv.id)}')">Send</button>`:''}
      ${canPaid&&inv.status!=='Paid'?`<button class="btn btn-g btn-s" onclick="markPaid('${esc(inv.id)}')">Paid</button>`:''}
      ${canDel?`<button class="btn btn-g btn-s" onclick="deleteInvoice('${esc(inv.id)}')">Del</button>`:''}
    </div></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--muted);font-style:italic">No invoices</td></tr>';
}

function openSendInvoiceModal(id){
  const inv=proxyDB.invoices.find(x=>x.id===id);if(!inv)return;
  if(inv.amount<=0){toast('Set the invoice amount before sending','err');return;}
  openModal(`Send Invoice — ${inv.id}`,`
    <div style="margin-bottom:14px;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:2px">
      <div style="font-size:12px;font-weight:600">${esc(inv.id)}  —  ${esc(inv.client)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">Amount: R ${Number(inv.amount).toLocaleString('en-ZA',{minimumFractionDigits:2})}  ·  Due: ${fmtD(inv.dueDate)}</div>
    </div>
    <div class="fgroup">
      <label class="flbl">Send to (email address) <span style="color:var(--ember)">*</span></label>
      <input class="finput" id="si-email" type="email" value="${esc(inv.clientEmail||'')}" placeholder="client@company.co.za">
    </div>
    <div style="font-size:10px;color:var(--muted);margin-top:4px;margin-bottom:14px">
      The invoice will be sent from noreply@blackfiresolutions.co.za and the invoice status will change to Sent.
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" onclick="sendInvoiceEmail('${esc(inv.id)}')">Send Invoice</button></div>
  `);
}

async function sendInvoiceEmail(id){
  const email=document.getElementById('si-email')?.value?.trim();
  if(!email){toast('Email address required','err');return;}
  const r=await api('PUT',`invoices.php?id=${id}`,{action:'send_invoice',to_email:email});
  if(!r.success){toast(r.error||'Error sending invoice','err');return;}
  await refreshInvoices();
  renderInvoices('');
  closeModalDirect();
  toast(`Invoice ${id} sent to ${email}`,'ok');
}

function previewInvoice(id){
  const inv=proxyDB.invoices.find(x=>x.id===id);if(!inv)return;
  openModal(`Invoice - ${inv.id}`,`
    <div class="doc-preview">
      <div class="doc-logo-row">
        <div><div class="doc-bname">BLACK<em>FIRE</em></div><div class="doc-btag">Security Solutions</div></div>
        <div style="text-align:right;font-size:11px;color:#7A7566">+27 68 912 6581<br>info@blackfiresolutions.co.za</div>
      </div>
      <div class="doc-type">TAX INVOICE</div>
      <div class="doc-meta">
        <div><div class="dml">Invoice #</div><div class="dmv" style="font-family:'IBM Plex Mono',monospace">${esc(inv.id)}</div></div>
        <div><div class="dml">Client</div><div class="dmv">${esc(inv.client)}</div></div>
        <div><div class="dml">PO Reference</div><div class="dmv">${esc(inv.po||'N/A')}</div></div>
        <div><div class="dml">Due Date</div><div class="dmv">${fmtD(inv.dueDate)}</div></div>
      </div>
      <div class="doc-tots" style="width:100%">
        <div class="doc-tot-row"><span>Excl. VAT</span><span>${fmt(inv.amount/1.15)}</span></div>
        <div class="doc-tot-row"><span>VAT (15%)</span><span>${fmt(inv.amount-inv.amount/1.15)}</span></div>
        <div class="doc-tot-row grand"><span>TOTAL DUE</span><span>${fmt(inv.amount)}</span></div>
      </div>
      <div style="margin-top:12px">${pillH(inv.status)}</div>
      <div class="doc-note">Fire, taught to behave.  -  BlackFire Solutions (Pty) Ltd</div>
    </div>
    <div id="attach-modal-area" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)"></div>`);
  loadAttachments('invoice', id);
}

function markPaid(id){
  const inv=proxyDB.invoices.find(i=>i.id===id);if(!inv)return;
  inv.status='Paid';
  proxyDB.bank.unshift({date:localDateStr(),desc:`Payment received - ${inv.client}`,cat:'Invoice Payment',ref:inv.id,credit:inv.amount,debit:0});
  save();renderInvoices();renderDashboard();toast(`${id} marked paid`,'ok');audit('MARK_PAID',`${id}`);
}
function delInvoice(id){
  if(!confirm(`Delete ${id}?`))return;
  proxyDB.invoices=proxyDB.invoices.filter(i=>i.id!==id);
  save();renderInvoices();renderDashboard();toast('Invoice deleted');audit('DELETE',id);
}

function initNewInvoice(){
  const due=new Date();due.setDate(due.getDate()+30);
  document.getElementById('ni-due').value=localDateStr(due);
}
function saveInvoice(){
  const client=document.getElementById('ni-client').value.trim();
  const amount=parseFloat(document.getElementById('ni-amount').value)||0;
  if(!client){toast('Client required','err');return;}
  const id=nextId('inv');
  proxyDB.invoices.unshift({id,client,amount,dueDate:document.getElementById('ni-due').value,status:document.getElementById('ni-status').value,po:document.getElementById('ni-po')?.value?.trim()||'',ref:document.getElementById('ni-ref').value.trim(),date:localDateStr()});
  save();showPortalPage('p-invoices',null);toast(`Invoice ${id} created`,'ok');audit('CREATE',`Invoice ${id}`);
}

/* ═══════════════════════════════════════════════════════
   TRANSACTIONS
═══════════════════════════════════════════════════════ */
function renderTransactions(search=''){
  let items=[...proxyDB.bank].sort((a,b)=>b.date.localeCompare(a.date));
  if(search) items=items.filter(b=>b.desc.toLowerCase().includes(search.toLowerCase())||b.cat.toLowerCase().includes(search.toLowerCase()));
  const tc=proxyDB.bank.reduce((a,b)=>a+(b.credit||0),0);
  const td=proxyDB.bank.reduce((a,b)=>a+(b.debit||0),0);
  const tn=tc-td;
  document.getElementById('tx-credits').textContent=fmt(tc);
  document.getElementById('tx-debits').textContent=fmt(td);
  const nel=document.getElementById('tx-net');nel.textContent=fmt(tn);nel.style.color=tn>=0?'var(--pill-paid-txt)':'var(--pill-ovr-txt)';
  document.getElementById('tx-table').innerHTML=items.length?items.map(b=>`
    <tr><td style="white-space:nowrap">${fmtD(b.date)}</td><td>${esc(b.desc)}</td><td><span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted)">${esc(b.cat)}</span></td><td class="mono">${esc(b.ref||'-')}</td>
    <td class="amt" style="color:var(--pill-paid-txt)">${b.credit>0?fmt(b.credit):'-'}</td>
    <td class="amt" style="color:var(--pill-ovr-txt)">${b.debit>0?fmt(b.debit):'-'}</td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--muted);font-style:italic">No transactions</td></tr>';
}

function openTxModal(){
  const cats=['Invoice Payment','Materials','Labour','Vehicle','Equipment','Utilities','Rent','Insurance','Marketing','Training','Professional Fees','Other'];
  openModal('Log Transaction',`
    <div class="fgrid">
      <div class="fgroup"><label class="flbl">Date</label><input type="date" class="finput" id="bk-date" value="${localDateStr()}"></div>
      <div class="fgroup"><label class="flbl">Type</label><select class="finput" id="bk-type"><option>Credit</option><option>Debit</option></select></div>
      <div class="fgroup ffull"><label class="flbl">Description</label><input class="finput" id="bk-desc" placeholder="Description"></div>
      <div class="fgroup"><label class="flbl">Amount (R)</label><input type="number" class="finput" id="bk-amount" placeholder="0.00"></div>
      <div class="fgroup"><label class="flbl">Category</label><select class="finput" id="bk-cat">${cats.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div class="fgroup ffull"><label class="flbl">Reference</label><input class="finput" id="bk-ref" placeholder="e.g. INV-001 or PO-2026-045"></div>
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" onclick="saveTx()">Save</button></div>`);
}
function saveTx(){
  const desc=document.getElementById('bk-desc').value.trim();
  const amount=parseFloat(document.getElementById('bk-amount').value)||0;
  if(!desc||!amount){toast('Description and amount required','err');return;}
  const type=document.getElementById('bk-type').value;
  proxyDB.bank.unshift({date:document.getElementById('bk-date').value,desc,cat:document.getElementById('bk-cat').value,ref:document.getElementById('bk-ref').value.trim(),credit:type==='Credit'?amount:0,debit:type==='Debit'?amount:0});
  save();closeModalDirect();renderTransactions();toast('Transaction logged','ok');audit('CREATE','Bank transaction: '+desc);
}

/* ═══════════════════════════════════════════════════════
   STATEMENT / INCOME
═══════════════════════════════════════════════════════ */
async function renderStatement(){
  document.getElementById('stmt-content').innerHTML=`<div style="text-align:center;padding:32px;color:var(--muted);font-style:italic">Loading statements…</div>`;
  const r=await api('GET','statements.php?action=list');
  if(!r.success){document.getElementById('stmt-content').innerHTML=`<div style="padding:16px;color:var(--pill-ovr-txt)">${esc(r.error||'Failed to load statements')}</div>`;return;}

  const pending=(r.data||[]).filter(s=>s.status==='pending_approval');
  const released=(r.data||[]).filter(s=>s.status==='released');
  const outstanding=r.outstanding||[];
  const outTotal=r.outstanding_total||0;
  const canRelease=can('finance.statement.release');
  const canGenerate=can('finance.statement.generate');

  // Outstanding invoices summary
  const outRows=outstanding.map(inv=>`
    <tr>
      <td class="mono">${esc(inv.ref_id)}</td>
      <td style="font-size:11px">${esc(inv.client_name)}</td>
      <td style="font-size:11px">${esc(inv.invoice_date||'')}</td>
      <td style="font-size:11px">${esc(inv.due_date||'')}</td>
      <td>${pillH(inv.status)}</td>
      <td class="amt">${fmt(Number(inv.amount))}</td>
    </tr>`).join('');

  const pendingCards=pending.map(s=>`
    <div style="border:1px solid var(--amber);background:var(--amb-glow);border-radius:2px;padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:var(--amber)">${esc(s.ref_id)}  ·  PENDING APPROVAL</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Generated ${fmtD(s.created_at?.slice(0,10)||'')}  ·  ${s.invoice_refs?.split(',').filter(Boolean).length||0} invoices  ·  Total R ${Number(s.total_outstanding||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}</div>
        </div>
        ${canRelease?`<button class="btn btn-p btn-s" onclick="openReleaseStatementModal('${esc(s.ref_id)}')">Release Statement</button>`:'<span style="font-size:10px;color:var(--muted)">Awaiting release by authorised user</span>'}
      </div>
    </div>`).join('');

  const releasedRows=released.slice(0,5).map(s=>`
    <tr>
      <td class="mono">${esc(s.ref_id)}</td>
      <td style="font-size:11px">${fmtD(s.scheduled_for||'')}</td>
      <td style="font-size:11px">${fmtD(s.released_at?.slice(0,10)||'')} by ${esc(s.released_by||'')}</td>
      <td style="font-size:11px">${esc(s.from_email||'')}</td>
      <td style="font-size:11px">${esc(s.to_emails||'')}</td>
      <td class="amt">R ${Number(s.total_outstanding||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}</td>
    </tr>`).join('');

  document.getElementById('stmt-content').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">
      <div style="background:var(--surface);border:1px solid var(--border);padding:14px;border-radius:2px">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Outstanding</div>
        <div style="font-family:'Big Shoulders Display',sans-serif;font-size:22px;font-weight:700;color:${outTotal>0?'var(--pill-ovr-txt)':'var(--pill-paid-txt)'}">R ${outTotal.toLocaleString('en-ZA',{minimumFractionDigits:2})}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:14px;border-radius:2px">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Pending Statements</div>
        <div style="font-family:'Big Shoulders Display',sans-serif;font-size:22px;font-weight:700;color:${pending.length?'var(--amber)':'var(--muted)'}">${pending.length}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:14px;border-radius:2px">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Statements Sent</div>
        <div style="font-family:'Big Shoulders Display',sans-serif;font-size:22px;font-weight:700">${released.length}</div>
      </div>
    </div>

    ${pending.length?`
    <div style="margin-bottom:18px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:8px">PENDING RELEASE</div>
      ${pendingCards}
    </div>`:''}

    ${canGenerate?`
    <div style="margin-bottom:18px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:2px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:12px;color:var(--text2)">Statements are auto-generated every Monday at 09:00 via cron. You can also generate one manually for current outstanding invoices.</div>
      <button class="btn btn-g btn-s" onclick="generateStatement()" style="white-space:nowrap;margin-left:16px">Generate Now</button>
    </div>`:''}

    <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:8px">OUTSTANDING INVOICES</div>
    <div class="panel" style="margin-bottom:18px"><div class="tw"><table>
      <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Due</th><th>Status</th><th>Amount</th></tr></thead>
      <tbody>${outRows||'<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--muted);font-style:italic">No outstanding invoices</td></tr>'}</tbody>
    </table></div></div>

    ${released.length?`
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:8px">RECENT STATEMENTS SENT</div>
    <div class="panel"><div class="tw"><table>
      <thead><tr><th>Ref</th><th>Scheduled</th><th>Released</th><th>From</th><th>To</th><th>Total</th></tr></thead>
      <tbody>${releasedRows}</tbody>
    </table></div></div>`:''}
  `;
}

async function generateStatement(){
  const r=await api('POST','statements.php?action=generate');
  if(!r.success){toast(r.error||'Error generating statement','err');return;}
  toast(r.message||'Statement generated','ok');
  renderStatement();
}

async function openReleaseStatementModal(ref_id){
  const re=await api('GET','statements.php?action=email_options');
  if(!re.success){toast(re.error||'Could not load email options','err');return;}
  const fromOpts=re.from_options||[];
  const toOpts=re.to_options||[];

  const fromSel=fromOpts.map(u=>`<option value="${esc(u.email)}">${esc(u.name)} &lt;${esc(u.email)}&gt; (${esc(u.role)})</option>`).join('');
  const toSel=toOpts.map(u=>`<option value="${esc(u.email)}">${esc(u.name)} &lt;${esc(u.email)}&gt;</option>`).join('');

  openModal(`Release Statement — ${ref_id}`,`
    <div style="margin-bottom:14px;font-size:12px;color:var(--text2)">Review the FROM and TO addresses below. The statement will be emailed immediately when you click Release.</div>
    <div class="fgrid">
      <div class="fgroup ffull">
        <label class="flbl">From Address <span style="color:var(--ember)">*</span></label>
        <select class="finput" id="rs-from">${fromSel||'<option value="">No permitted email addresses found</option>'}</select>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">Only email addresses you are authorised to send from are shown.</div>
      </div>
      <div class="fgroup ffull">
        <label class="flbl">To Address <span style="color:var(--ember)">*</span></label>
        <select class="finput" id="rs-to">${toSel||'<option value="">No users found</option>'}</select>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">You may also type a custom address below.</div>
      </div>
      <div class="fgroup ffull">
        <label class="flbl">Additional Recipients (comma-separated)</label>
        <input class="finput" id="rs-extra" placeholder="extra@client.co.za, cc@firm.co.za">
      </div>
    </div>
    <div class="mt3 flex-end">
      <button class="btn btn-g" onclick="closeModalDirect()" style="margin-right:8px">Cancel</button>
      <button class="btn btn-p" onclick="releaseStatement('${esc(ref_id)}')">Release &amp; Send Statement</button>
    </div>
  `);
}

async function releaseStatement(ref_id){
  const from=document.getElementById('rs-from')?.value;
  const to=document.getElementById('rs-to')?.value;
  const extra=document.getElementById('rs-extra')?.value?.trim();
  if(!from||!to){toast('From and To addresses are required','err');return;}

  const tos=[to];
  if(extra) extra.split(',').forEach(e=>{const t=e.trim();if(t)tos.push(t);});

  const r=await api('PUT',`statements.php?id=${ref_id}`,{from_email:from,to_emails:tos});
  if(!r.success){toast(r.error||'Error releasing statement','err');return;}
  closeModalDirect();
  toast(r.message||'Statement released','ok');
  renderStatement();
}

function renderIncome(){
  const rev=proxyDB.invoices.filter(i=>i.status==='Paid').reduce((a,i)=>a+i.amount,0);
  const exp=proxyDB.bank.filter(b=>b.debit>0).reduce((a,b)=>a+b.debit,0);
  const gross=rev-exp;const tax=Math.max(0,gross*.28);const net=gross-tax;
  document.getElementById('pl-rows').innerHTML=`
    <div style="background:var(--surface2);padding:8px 16px;font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:2px;text-transform:uppercase">Revenue</div>
    <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);font-size:12px"><span>Paid Invoices</span><span style="font-family:'IBM Plex Mono',monospace">${fmt(rev)}</span></div>
    <div style="background:var(--surface2);padding:8px 16px;font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:2px;text-transform:uppercase">Expenses</div>
    ${proxyDB.bank.filter(b=>b.debit>0).map(b=>`<div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);font-size:12px"><span>${esc(b.desc)}</span><span style="font-family:'IBM Plex Mono',monospace;color:var(--pill-ovr-txt)">(${fmt(b.debit)})</span></div>`).join('')||'<div style="padding:10px 16px;font-size:12px;color:var(--muted);font-style:italic">No expenses recorded</div>'}
    <div style="display:flex;justify-content:space-between;padding:12px 16px;font-size:13px;font-weight:600;border-top:1px solid var(--border)"><span>Operating Profit</span><span style="font-family:'IBM Plex Mono',monospace">${fmt(gross)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:12px;border-top:1px solid var(--border)"><span>Tax (28%)</span><span style="font-family:'IBM Plex Mono',monospace;color:var(--muted)">(${fmt(tax)})</span></div>
    <div style="display:flex;justify-content:space-between;padding:14px 16px;font-size:14px;font-weight:700;border-top:2px solid ${net>=0?'var(--green)':'var(--ember)'};background:${net>=0?'var(--grn-glow)':'var(--emb-glow)'}"><span>NET ${net>=0?'PROFIT':'LOSS'}</span><span style="font-family:'IBM Plex Mono',monospace;color:${net>=0?'var(--pill-paid-txt)':'var(--pill-ovr-txt)'}">${fmt(Math.abs(net))}</span></div>`;
  document.getElementById('pl-summary').innerHTML=`
    <div class="sumrow"><span>Revenue</span><span class="mono">${fmt(rev)}</span></div>
    <div class="sumrow"><span>Expenses</span><span class="mono">(${fmt(exp)})</span></div>
    <div class="sumrow tot"><span>Gross Profit</span><span class="mono">${fmt(gross)}</span></div>
    <div class="sumrow sm"><span>Tax @ 28%</span><span class="mono">(${fmt(tax)})</span></div>
    <div class="sumrow tot" style="color:${net>=0?'var(--pill-paid-txt)':'var(--pill-ovr-txt)'}"><span>Net ${net>=0?'Profit':'Loss'}</span><span class="mono">${fmt(Math.abs(net))}</span></div>`;
}

/* ═══════════════════════════════════════════════════════
   TIMELINE
═══════════════════════════════════════════════════════ */
function renderTimeline(){
  const all=[
    ...proxyDB.callouts.map(c=>({date:c.date,title:`${c.id}  -  ${c.service}`,sub:`${c.assignedTo?proxyDB.users.find(u=>u.username===c.assignedTo)?.name||c.tech:c.tech||'Unassigned'}  -  ${c.status}${c.po?'  -  PO: '+c.po:''}`,type:'callout'})),
    ...proxyDB.invoices.map(i=>({date:i.date,title:`${i.id}  -  ${fmt(i.amount)}`,sub:`${i.client}  -  ${i.status}${i.po?'  -  PO: '+i.po:''}`,type:'invoice'})),
    ...proxyDB.bank.map(b=>({date:b.date,title:b.desc,sub:`${b.cat}${b.credit>0?'  -  Credit: '+fmt(b.credit):'  -  Debit: '+fmt(b.debit)}`,type:'bank'})),
  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,40);
  document.getElementById('timeline-content').innerHTML=all.length?all.map(e=>`
    <div class="timeline-item">
      <div class="tl-dot" style="background:${e.type==='callout'?'var(--ember)':e.type==='invoice'?'var(--amber)':'var(--green)'}"></div>
      <div class="tl-date">${fmtD(e.date)}</div>
      <div class="tl-content"><div class="tl-title">${esc(e.title)}</div><div class="tl-sub">${esc(e.sub)}</div></div>
    </div>`).join(''):'<div style="text-align:center;padding:32px;color:var(--muted);font-style:italic">No activity yet</div>';
}

/* ═══════════════════════════════════════════════════════
   LOG PAYMENT
═══════════════════════════════════════════════════════ */
function renderPayList(){
  document.getElementById('pay-date').value=localDateStr();
  const fileEl=document.getElementById('pay-remittance');if(fileEl)fileEl.value='';
  document.getElementById('pay-sel-count').textContent='';
  document.getElementById('pay-amount').value='';
  const unpaid=proxyDB.invoices.filter(i=>i.status!=='Paid'&&i.status!=='Cancelled');
  document.getElementById('pay-inv-list').innerHTML=unpaid.length?unpaid.map(inv=>`
    <label style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:2px;cursor:pointer;margin-bottom:6px;background:var(--surface2)">
      <input type="checkbox" name="pay-sel" value="${esc(inv.id)}" data-amount="${inv.amount}" style="accent-color:var(--accent);width:16px;height:16px;flex-shrink:0">
      <span style="flex:1;font-size:12px"><span class="mono">${esc(inv.id)}</span>${inv.po?'  —  PO: '+esc(inv.po):''}</span>
      <span class="amt">${fmt(inv.amount)}</span>
      <span>${pillH(inv.status)}</span>
    </label>`).join(''):'<div style="color:var(--muted);font-style:italic;font-size:12px;padding:10px">No outstanding invoices</div>';
  function recalcTotal(){
    const boxes=[...document.querySelectorAll('input[name="pay-sel"]:checked')];
    const total=boxes.reduce((s,b)=>s+parseFloat(b.dataset.amount||0),0);
    document.getElementById('pay-amount').value=total?total.toFixed(2):'';
    document.getElementById('pay-sel-count').textContent=boxes.length?`(${boxes.length} selected)`:'';
  }
  document.querySelectorAll('input[name="pay-sel"]').forEach(b=>b.addEventListener('change',recalcTotal));
}
function logPayment(){
  const checked=[...document.querySelectorAll('input[name="pay-sel"]:checked')];
  if(!checked.length){toast('Select at least one invoice','err');return;}
  checked.forEach(b=>markPaid(b.value));
  showPortalPage('p-invoices',null);
}

/* ═══════════════════════════════════════════════════════
   AUDIT LOG
═══════════════════════════════════════════════════════ */
function renderAudit(filter=''){
  const items=filter?AUDIT_LOG.filter(e=>e.action.toLowerCase().includes(filter.toLowerCase())||e.user.toLowerCase().includes(filter.toLowerCase())||e.detail.toLowerCase().includes(filter.toLowerCase())):AUDIT_LOG;
  document.getElementById('audit-list').innerHTML=items.length?items.map(e=>`
    <div class="audit-row">
      <div class="audit-ts">${esc(e.ts)}</div>
      <div class="audit-user">${esc(e.user)}</div>
      <div class="audit-action"><strong>${esc(e.action)}</strong> - ${esc(e.detail)}</div>
      <div class="audit-lvl info">${esc(e.role||e.level)}</div>
    </div>`).join(''):'<div style="text-align:center;padding:32px;color:var(--muted);font-style:italic">No audit records</div>';
}
function filterAudit(v){ renderAudit(v); }

/* ═══════════════════════════════════════════════════════
   USERS TABLE
═══════════════════════════════════════════════════════ */
function renderUsers(){
  const matrix = {
    admin:         {create:'✓',status:'✓',po:'✓',finance:'✓',quote:'✓',approve:'✓'},
    manager:       {create:'✓',status:'✓',po:'✓',finance:'✓',quote:'✓',approve:'✓'},
    call_logger:   {create:'✓',status:'✓',po:'-',finance:'-',quote:'-',approve:'-'},
    junior_tech:   {create:'-',status:'✓',po:'-',finance:'-',quote:'-',approve:'-'},
    senior_tech:   {create:'-',status:'✓',po:'-',finance:'-',quote:'Submit',approve:'-'},
    client_support:{create:'✓',status:'-',po:'-',finance:'View',quote:'-',approve:'-'},
    admin_clerk:   {create:'-',status:'✓',po:'✓',finance:'✓',quote:'-',approve:'-'},
    viewer:        {create:'-',status:'-',po:'-',finance:'View',quote:'-',approve:'-'},
  };
  const tick=(v)=>v==='✓'?`<span style="color:var(--pill-paid-txt)">✓</span>`:v==='-'?`<span style="color:var(--muted)">-</span>`:`<span style="color:var(--warn);font-size:10px">${v}</span>`;
  const bar = document.getElementById('users-create-bar');
  if (bar) bar.style.display = can('user.create') ? '' : 'none';
  document.getElementById('users-table-body').innerHTML=proxyDB.users.map(u=>{
    const m=matrix[u.role]||{create:'-',status:'-',po:'-',finance:'-',quote:'-',approve:'-'};
    return`<tr>
      <td class="mono">${esc(u.username)}</td>
      <td>${esc(u.name)}</td>
      <td>${rolePill(u.role)}</td>
      <td style="text-align:center">${tick(m.create)}</td>
      <td style="text-align:center">${tick(m.status)}</td>
      <td style="text-align:center">${tick(m.po)}</td>
      <td style="text-align:center">${tick(m.finance)}</td>
      <td style="text-align:center">${tick(m.quote)}</td>
      <td style="text-align:center">${tick(m.approve)}</td>
    </tr>`;
  }).join('');
}

function openCreateUserModal(){
  if (!can('user.create')) return;
  const roles = ['admin','manager','call_logger','junior_tech','senior_tech','client_support','admin_clerk','viewer'];
  const opts = roles.map(r=>`<option value="${r}">${r.replace(/_/g,' ')}</option>`).join('');
  openModal('New User', `
    <div class="login-group"><label class="login-label">Username</label><input class="login-input" id="nu-user" placeholder="username"></div>
    <div class="login-group"><label class="login-label">Full Name</label><input class="login-input" id="nu-name" placeholder="First Last"></div>
    <div class="login-group"><label class="login-label">Email</label><input class="login-input" type="email" id="nu-email" placeholder="user@example.com"></div>
    <div class="login-group"><label class="login-label">Title / Position</label><input class="login-input" id="nu-title" placeholder="e.g. Field Technician"></div>
    <div class="login-group"><label class="login-label">Role</label><select class="login-input" id="nu-role">${opts}</select></div>
    <div class="login-group"><label class="login-label">Password</label><input class="login-input" type="password" id="nu-pass" placeholder="min 8 characters"></div>
    <button class="btn-login-submit" style="margin-top:8px" onclick="saveNewUser()">Create User</button>
  `);
}

async function saveNewUser(){
  const username = document.getElementById('nu-user')?.value?.trim().toLowerCase();
  const name     = document.getElementById('nu-name')?.value?.trim();
  const email    = document.getElementById('nu-email')?.value?.trim();
  const title    = document.getElementById('nu-title')?.value?.trim();
  const role     = document.getElementById('nu-role')?.value;
  const password = document.getElementById('nu-pass')?.value;
  if (!username || !name || !password) { toast('Username, name and password are required', 'err'); return; }
  if (password.length < 8) { toast('Password must be at least 8 characters', 'err'); return; }
  const r = await api('POST', 'users.php', { username, name, email, title, role, password });
  if (!r.success) { toast(r.error || 'Error creating user', 'err'); return; }
  closeModalDirect();
  await refreshUsers();
  renderUsers();
  toast(`User ${username} created`, 'ok');
}

/* ═══════════════════════════════════════════════════════
   MODAL / TOAST
═══════════════════════════════════════════════════════ */
function openModal(title,html){
  document.getElementById('modal-ttl').textContent=title;
  document.getElementById('modal-bdy').innerHTML=html;
  document.getElementById('modal-overlay').classList.add('show');
}
function closeModal(e){ if(e.target===document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect(){ document.getElementById('modal-overlay').classList.remove('show'); }

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
function syncPublicNavOffset(){
  const eb=document.querySelector('.emergency-bar');
  const pn=document.getElementById('pub-nav');
  if(eb&&pn) pn.style.top=eb.offsetHeight+'px';
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const t=localStorage.getItem('bf-theme');if(t)document.documentElement.dataset.theme=t;
  buildHomeCats();
  buildTicker();
  buildSvcGrid('pub');
  syncPublicNavOffset();
  window.addEventListener('resize',syncPublicNavOffset);
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(syncPublicNavOffset);
  }
  // If URL has reset_token, jump straight to new-password panel
  if(new URLSearchParams(window.location.search).get('reset_token')){
    document.documentElement.dataset.state='login';
    document.getElementById('login-panel').style.display  = 'none';
    document.getElementById('forgot-panel').style.display = 'none';
    document.getElementById('newpass-panel').style.display = '';
    return;
  }
  // Restore session on page reload — check server for active session
  const me = await api('GET','auth.php?action=me');
  if(me.success && me.user){
    SESSION = me.user;
    buildNav();
    document.getElementById('pnav-user').textContent = SESSION.name;
    document.documentElement.dataset.state = 'portal';
    document.getElementById('dash-sub').textContent = `AECI CHEMPARK  -  ${(ROLE_LABELS[SESSION.role]||SESSION.role).toUpperCase()} VIEW`;
    await refreshAll();
    const firstPage = {
      call_logger:'p-new-callout', junior_tech:'p-callouts',
      senior_tech:'p-callouts', client_support:'p-dashboard', admin_clerk:'p-callouts',
    }[SESSION.role] || 'p-dashboard';
    showPortalPage(firstPage, null);
    updateBadges();
    startIdleTimer();
  }
});

/* ═══════════════════════════════════════════════════════
   API MUTATION OVERRIDES
   These override the original in-memory mutations to call
   the PHP/MySQL API instead, then refresh the local cache.
═══════════════════════════════════════════════════════ */

/* ── Badge updater ───────────────────────────────────── */
function updateBadges(){
  const nbInv=document.getElementById('nb-inv');
  const nbQte=document.getElementById('nb-qte');
  const nbCo=document.getElementById('nb-co');
  if(nbInv) nbInv.textContent=proxyDB.invoices.filter(i=>i.status==='Sent'||i.status==='Overdue').length||'';
  if(nbQte) nbQte.textContent=proxyDB.quotes.filter(q=>q.status==='Pending Approval').length||'';
  if(nbCo)  nbCo.textContent=proxyDB.callouts.filter(c=>c.status==='Open'||c.status==='In Progress').length||'';
}

/* ── Override: saveCallout ───────────────────────────── */
async function saveCallout(){
  const client = (document.getElementById('nc-client')?.value || 'AECI Chempark').trim();
  const service = document.getElementById('nc-service')?.value?.trim();
  const location = document.getElementById('nc-location')?.value?.trim() || '';
  const priority = document.getElementById('nc-priority')?.value || 'Normal';
  const tech = document.getElementById('nc-tech')?.value?.trim() || '';
  const assignedTo = document.getElementById('nc-assign')?.value?.trim() || '';
  const notes = document.getElementById('nc-notes')?.value?.trim() || '';
  const calloutTime = document.getElementById('nc-time')?.value || '08:00';
  const po = document.getElementById('nc-po')?.value?.trim() || '';
  
  if (!service) { toast('Please fill in the service field', 'err'); return; }
  
  const r = await api('POST', 'callouts.php', {
    client_name: client,
    service,
    location,
    priority,
    tech,
    assigned_to: assignedTo,
    status: 'Open',
    callout_date: localDateStr(),
    callout_time: calloutTime,
    notes,
    po,
  });
  
  if (!r.success) { toast(r.error || 'Error saving callout', 'err'); return; }
  
  await refreshCallouts();
  updateBadges();
  showPortalPage('p-callouts', null);
  toast(`Callout ${r.data?.ref_id || ''} logged`, 'ok');
  audit('CREATE', r.data?.ref_id || 'Callout created');
}

/* ── Override: deleteCallout ─────────────────────────── */
async function deleteCallout(id){
  if (!confirm(`Delete ${id}?`)) return;
  const r = await api('DELETE', `callouts.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshCallouts();
  updateBadges();
  renderCallouts('');
  toast(`${id} deleted`);
  closeModalDirect();
}

/* ── Override: updateCalloutStatus ──────────────────── */
async function updateCalloutStatus(id, status){
  const r = await api('PUT', `callouts.php?id=${id}`, { status });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshCallouts();
  updateBadges();
  renderCallouts('');
  closeModalDirect();
  toast(`Status updated to ${status}`);
}

/* ── Override: assignPO ──────────────────────────────── */
async function assignPO(id){
  const po = document.getElementById('po-input')?.value?.trim();
  if (!po) return;
  const r = await api('PUT', `callouts.php?id=${id}`, { po });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshCallouts();
  renderCallouts('');
  closeModalDirect();
  toast(`PO ${po} assigned to ${id}`);
}

/* ── Override: approveQuote / rejectQuote ────────────── */
async function approveQuote(id){
  const r = await api('PUT', `quotes.php?id=${id}`, { action: 'approve' });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshQuotes();
  updateBadges();
  renderQuotes('');
  closeModalDirect();
  toast(`Quote ${id} approved`, 'ok');
}
async function rejectQuote(id){
  const r = await api('PUT', `quotes.php?id=${id}`, { action: 'reject' });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshQuotes();
  updateBadges();
  renderQuotes('');
  closeModalDirect();
  toast(`Quote ${id} rejected`);
}

/* ── Override: deleteQuote ───────────────────────────── */
async function deleteQuote(id){
  if (!confirm(`Delete ${id}?`)) return;
  const r = await api('DELETE', `quotes.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshQuotes();
  updateBadges();
  renderQuotes('');
  closeModalDirect();
  toast(`${id} deleted`);
}

/* ── Override: saveQuote ─────────────────────────────── */
async function saveQuote(){
  const client = (document.getElementById('nq-client')?.value || 'AECI Chempark').trim();
  const validUntil = document.getElementById('nq-valid')?.value;
  const notes = document.getElementById('nq-notes')?.value?.trim() || '';
  
  // Collect line items
  const rows = document.querySelectorAll('.qi-row');
  const items = [];
  rows.forEach(row => {
    const desc = row.querySelector('.qi-desc')?.value?.trim();
    const qty  = parseFloat(row.querySelector('.qi-qty')?.value) || 1;
    const unit = parseFloat(row.querySelector('.qi-unit')?.value) || 0;
    if (desc) items.push({ desc, qty, unit });
  });
  
  if (!items.length) { toast('Add at least one line item', 'err'); return; }
  
  const r = await api('POST', 'quotes.php', { client_name: client, items, valid_until: validUntil, notes });
  if (!r.success) { toast(r.error || 'Error saving quote', 'err'); return; }
  
  await refreshQuotes();
  updateBadges();
  showPortalPage('p-quotes', null);
  toast(`Quote ${r.data?.ref_id || ''} created`, 'ok');
}

/* ── Override: convertToInvoice ──────────────────────── */
async function convertToInvoice(id){
  const q = proxyDB.quotes.find(x=>x.id===id);
  if (!q) return;
  const total = q.items.reduce((a,i)=>a+(i.qty*i.unit),0) * 1.15;
  const due = new Date(); due.setDate(due.getDate()+30);
  const r = await api('POST', 'invoices.php', {
    client_name: q.client,
    amount: Math.round(total*100)/100,
    due_date: localDateStr(due),
    status: 'Draft',
    quote_ref: id,
  });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await Promise.all([refreshInvoices(), refreshQuotes()]);
  updateBadges();
  showPortalPage('p-invoices', null);
  toast(`Invoice ${r.data?.ref_id || ''} created from ${id}`, 'ok');
  closeModalDirect();
}

/* ── Override: markPaid ──────────────────────────────── */
async function markPaid(id){
  const r = await api('PUT', `invoices.php?id=${id}`, { action: 'mark_paid', pay_date: localDateStr() });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await Promise.all([refreshInvoices(), refreshTransactions()]);
  updateBadges();
  renderInvoices('');
  closeModalDirect();
  toast(`Invoice ${id} marked as paid`, 'ok');
}

/* ── Override: deleteInvoice ─────────────────────────── */
async function deleteInvoice(id){
  if (!confirm(`Delete ${id}?`)) return;
  const r = await api('DELETE', `invoices.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshInvoices();
  updateBadges();
  renderInvoices('');
  closeModalDirect();
  toast(`${id} deleted`);
}

/* ── Override: saveInvoice ───────────────────────────── */
async function saveInvoice(){
  const client = document.getElementById('ni-client')?.value?.trim() || 'AECI Chempark';
  const amount = parseFloat(document.getElementById('ni-amount')?.value) || 0;
  const dueDate = document.getElementById('ni-due')?.value;
  const status = document.getElementById('ni-status')?.value || 'Draft';
  const po = document.getElementById('ni-po')?.value?.trim() || '';
  const ref = document.getElementById('ni-ref')?.value?.trim() || '';
  
  if (!amount || !dueDate) { toast('Fill in amount and due date', 'err'); return; }
  
  const r = await api('POST', 'invoices.php', { client_name: client, amount, due_date: dueDate, status, po, quote_ref: ref.startsWith('QTE') ? ref : '', callout_ref: ref.startsWith('JOB') ? ref : '' });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  
  await refreshInvoices();
  updateBadges();
  showPortalPage('p-invoices', null);
  toast(`Invoice ${r.data?.ref_id || ''} created`, 'ok');
}

/* ── Override: logPayment ────────────────────────────── */
async function logPayment(){
  const checked = [...document.querySelectorAll('input[name="pay-sel"]:checked')];
  if (!checked.length) { toast('Select at least one invoice', 'err'); return; }
  const invoice_refs = checked.map(b => b.value);
  const date   = document.getElementById('pay-date')?.value || localDateStr();
  const amount = parseFloat(document.getElementById('pay-amount')?.value) || 0;
  const notes  = document.getElementById('pay-notes')?.value?.trim() || '';

  const r = await api('POST', 'payments.php', { invoice_refs, payment_date: date, amount, notes });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }

  const payRef = r.payment_ref;
  const fileInput = document.getElementById('pay-remittance');
  if (fileInput?.files?.length && payRef) {
    const fd = new FormData();
    fd.append('entity_type', 'payment');
    fd.append('entity_ref', payRef);
    fd.append('file', fileInput.files[0]);
    await fetch(API_BASE + '/files.php', {
      method: 'POST', body: fd, credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
  }

  await Promise.all([refreshInvoices(), refreshTransactions()]);
  updateBadges();
  renderPayList();
  const n = invoice_refs.length;
  toast(`Payment ${payRef} logged for ${n} invoice${n > 1 ? 's' : ''}`, 'ok');
}

/* ── Override: addTransaction ────────────────────────── */
async function addTransaction(){
  const date = document.getElementById('bk-date')?.value;
  const desc = document.getElementById('bk-desc')?.value?.trim();
  const type = document.getElementById('bk-type')?.value;
  const cat  = document.getElementById('bk-cat')?.value;
  const ref  = document.getElementById('bk-ref')?.value?.trim() || '';
  const amount = parseFloat(document.getElementById('bk-amount')?.value) || 0;
  
  if (!desc || !amount) { toast('Fill in description and amount', 'err'); return; }
  
  const r = await api('POST', 'transactions.php', {
    trans_date: date || localDateStr(),
    description: desc,
    category: cat || 'General',
    reference: ref,
    credit: type === 'Credit' ? amount : 0,
    debit:  type === 'Debit'  ? amount : 0,
  });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  
  await refreshTransactions();
  renderTransactions('');
  toast('Transaction added', 'ok');
}




/* ── Back to Top Functionality ──────────────────────── */
const backToTopBtn = document.getElementById('back-to-top');

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});

// Set button text with arrow
backToTopBtn.innerHTML = '↑';