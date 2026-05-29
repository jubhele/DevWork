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
  if (data && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') opts.body = JSON.stringify(data);
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
    if (res.status === 401) {
      if (typeof SESSION !== 'undefined' && SESSION) {
        SESSION = null;
        document.documentElement.dataset.state = 'login';
        if (typeof showLoginPanel === 'function') showLoginPanel();
        if (typeof toast === 'function') toast('Session expired. Please log in again.', 'err');
      }
      return { success: false, error: 'Session expired' };
    }
    return await res.json();
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/* ── data-action click dispatcher ──────────────────────────────────── */
document.addEventListener('click', function(e) {
  // Close mobile nav when tapping outside it
  const mobNav = document.getElementById('pub-mob-nav');
  if (mobNav && mobNav.classList.contains('open')) {
    if (!mobNav.contains(e.target) && !e.target.closest('.pub-ham-btn')) {
      closeMobileMenu();
    }
  }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  switch (action) {
    // Navigation / auth
    case 'toggleTheme':          toggleTheme(); break;
    case 'toggleMobileMenu':     toggleMobileMenu(); break;
    case 'toggleInfoMode':       toggleInfoMode(); break;
    case 'pubNav':               pubNav(el.dataset.pubPage); break;
    case 'pubNavMobile':         pubNav(el.dataset.pubPage); closeMobileMenu(); break;
    case 'goLogin':              goLogin(); break;
    case 'goLoginMobile':        goLogin(); closeMobileMenu(); break;
    case 'goPublic':             goPublic(); break;
    case 'goPublicFullscreen':   goPublicFullscreen(); break;
    case 'navPage':              showPortalPage(el.dataset.page, null); break;
    case 'navSafety':            showPortalPage('p-safety', null); renderSafetyFiles(); break;
    case 'refreshPage':          refreshCurrentPage(el); break;
    case 'scrollToTop':          scrollToTop(); break;
    case 'filterSvc':            filterSvc(el, el.dataset.cat, el.dataset.ctx); break;
    case 'pubNavCat':            pubNav('services'); break;
    // Auth forms
    case 'doLogin':              doLogin(); break;
    case 'showForgotPassword':   showForgotPassword(); break;
    case 'showLoginPanel':       showLoginPanel(); break;
    case 'doRequestReset':       doRequestReset(); break;
    case 'doResetPassword':      doResetPassword(); break;
    case 'doLogout':             doLogout(); break;
    // Contact / enquiry
    case 'submitContact':        submitContact(); break;
    case 'submitEnquiry':        toast('Enquiry submitted — we\'ll be in touch.', 'ok'); break;
    // Modals
    case 'openTxModal':          openTxModal(); break;
    case 'closeModalDirect':     closeModalDirect(); break;
    case 'closeModalBackdrop':   if (e.target === el) closeModal(e); break;
    // Operations — callouts
    case 'saveCallout':          saveCallout(); break;
    case 'openStatusModal':      openStatusModal(el.dataset.id); break;
    case 'saveStatus':           saveStatus(el.dataset.id); break;
    case 'openAssignPO':         openAssignPO(el.dataset.id); break;
    case 'assignPO':             assignPO(el.dataset.id); break;
    case 'openAssignTech':       openAssignTech(el.dataset.id); break;
    case 'saveTechAssign':       saveTechAssign(el.dataset.id); break;
    case 'prefillQuoteFromJob':  prefillQuoteFromJob(el.dataset.id); break;
    case 'openConfirmClosureModal': openConfirmClosureModal(el.dataset.id); break;
    case 'saveConfirmClosure':   saveConfirmClosure(el.dataset.id); break;
    case 'deleteCallout':        deleteCallout(el.dataset.id); break;
    // Operations — quotes
    case 'addLine':              addLine(); break;
    case 'removeLine':           el.closest('tr').remove(); recalcQ(); break;
    case 'saveQuote':            saveQuote(); break;
    case 'previewQuote':         previewQuote(el.dataset.id); break;
    case 'approveQuote':         approveQuote(el.dataset.id); break;
    case 'rejectQuote':          rejectQuote(el.dataset.id); break;
    case 'convertToInvoice':     convertToInvoice(el.dataset.id); break;
    case 'deleteQuote':          deleteQuote(el.dataset.id); break;
    // Operations — invoices
    case 'saveInvoice':          saveInvoice(); break;
    case 'previewInvoice':       previewInvoice(el.dataset.id); break;
    case 'openSendInvoiceModal': openSendInvoiceModal(el.dataset.id); break;
    case 'markPaid':             markPaid(el.dataset.id); break;
    case 'deleteInvoice':        deleteInvoice(el.dataset.id); break;
    case 'sendInvoiceEmail':     sendInvoiceEmail(el.dataset.id); break;
    // Finance
    case 'logPayment':           logPayment(); break;
    case 'saveTx':               saveTx(); break;
    case 'downloadStatement':    downloadStatement(el.dataset.id); break;
    case 'openReleaseStatementModal': openReleaseStatementModal(el.dataset.id); break;
    case 'releaseStatement':     releaseStatement(el.dataset.id); break;
    case 'generateStatement':    generateStatement(); break;
    // Files
    case 'openAttachmentsModal': openAttachmentsModal(el.dataset.entityType, el.dataset.entityRef); break;
    case 'openDocViewer':        openDocViewer(+el.dataset.id, el.dataset.name, el.dataset.mime); break;
    case 'deleteAttachment':     deleteAttachment(+el.dataset.id, el.dataset.entityType, el.dataset.entityRef); break;
    case 'uploadAttachment':     uploadAttachment(el.dataset.entityType, el.dataset.entityRef); break;
    case 'openBlobPreview':      { const u = el.dataset.blobUrl; window.open(u, '_blank'); URL.revokeObjectURL(u); } break;
    case 'revokeBlobOnDownload': setTimeout(() => URL.revokeObjectURL(el.dataset.blobUrl), 2000); break;
    case 'triggerFileInput':     document.getElementById(el.dataset.targetId)?.click(); break;
    case 'printPage':            window.print(); break;
    // Users
    case 'openCreateUserModal':  openCreateUserModal(); break;
    case 'openEditUserModal':    openEditUserModal(+el.dataset.id); break;
    case 'toggleUserActive':     toggleUserActive(+el.dataset.id, +el.dataset.active); break;
    case 'saveNewUser':          saveNewUser(); break;
    case 'saveEditUser':         saveEditUser(); break;
    case 'togglePermCols':       togglePermCols(); break;
    // Dashboard
    case 'showDashEditor':       showDashEditor(); break;
    case 'saveDashEditorPrefs':  saveDashEditorPrefs(); break;
    // Clients
    case 'openClientModal':      openClientModal(el.dataset.id ? +el.dataset.id : null); break;
    case 'closeClientModal':     closeClientModal(); break;
    case 'saveClient':           saveClient(); break;
    case 'deactivateClient':     deactivateClient(+el.dataset.id); break;
    // Safety
    case 'newSafetyAudit':       newSafetyAudit(); break;
    case 'saveSafetyDraft':      saveSafetyDraft(); break;
    case 'submitSafetyAudit':    submitSafetyAudit(); break;
    case 'editSafetyFile':       editSafetyFile(); break;
    case 'approveSafetyFile':    approveSafetyFile(); break;
    case 'deactivateSafetyFile': deactivateSafetyFile(); break;
    case 'safGenerateTracker':   safGenerateTracker(document.getElementById('saf-detail-content')?.dataset.fileId); break;
    case 'safDownloadPack':      safDownloadPack(document.getElementById('saf-detail-content')?.dataset.fileId); break;
    case 'safViewFile':          safViewFile(el.dataset.id); break;
    case 'safToggleSection':     safToggleSection(el.dataset.sectionKey); break;
    case 'safSaveSection':       e.stopPropagation(); safSaveSection(el.dataset.sectionKey); break;
    case 'safSendPolicyToPersonnel': safSendPolicyToPersonnel(+el.dataset.id); break;
    case 'safAddPersonnel':      safAddPersonnel(el.dataset.id); break;
    case 'safLinkPortalUser':    safLinkPortalUser(el.dataset.id); break;
    case 'safAddCompliance':     safAddCompliance(el.dataset.id); break;
    case 'safAddPolicyAck':      safAddPolicyAck(el.dataset.id); break;
    case 'safGenDocs':           safGenDocs(el.dataset.id); break;
    case 'safSavePersonnel':     safSavePersonnel(el.dataset.id); break;
    case 'safConfirmRemovePerson': safConfirmRemovePerson(+el.dataset.id, el.dataset.fileId, el.dataset.name); break;
    case 'safConfirmLinkUser':   safConfirmLinkUser(el.dataset.id); break;
    case 'safDeleteCompliance':  safDeleteCompliance(+el.dataset.id, el.dataset.fileId); break;
    case 'safEditCompliance':    safEditCompliance(+el.dataset.id, el.dataset.fileId); break;
    case 'safReplaceComplianceDoc': safReplaceComplianceDoc(+el.dataset.id, el.dataset.fileId, +el.dataset.attId); break;
    case 'safSaveCompliance':    safSaveCompliance(el.dataset.id); break;
    case 'safSaveEditCompliance':safSaveEditCompliance(+el.dataset.id, el.dataset.fileId); break;
    case 'safManualAck':         safManualAck(+el.dataset.id, el.dataset.fileId); break;
    case 'safResendPolicyAck':   safResendPolicyAck(+el.dataset.id, el.dataset.fileId); break;
    case 'safDeletePolicyAck':   safDeletePolicyAck(+el.dataset.id, el.dataset.fileId); break;
    case 'safSavePolicyAck':     safSavePolicyAck(el.dataset.id); break;
    case 'safDeleteAttachment':  safDeleteAttachment(+el.dataset.id, el.dataset.fileId); break;
    case 'safShowItemDocs':      safShowItemDocs(el.dataset.evSec, +el.dataset.evIdx, el.dataset.fileId || null); break;
    case 'safPersonnelSendPolicy': safPersonnelSendPolicy(+el.dataset.id); break;
    case 'safUnlinkUser':        safUnlinkUser(+el.dataset.id, el.dataset.fileId, el.dataset.name); break;
    case 'safRemovePerson':      safRemovePerson(+el.dataset.id, el.dataset.fileId, el.dataset.name); break;
    case 'safReinstatePerson':   safReinstatePerson(+el.dataset.id, el.dataset.fileId); break;
    // Info/guide panel
    case 'submitInfoSuggestion': submitInfoSuggestion(el.dataset.page); break;
    case 'activateNavGroupAndNavigate': activateNavGroupAndNavigate(el.dataset.group); break;
  }
});

/* ── Post-render helpers for dynamic styles ────────────────────────── */
function applyProgFills(root) {
  (root||document).querySelectorAll('.prog-fill[data-w]').forEach(el => {
    el.style.width = el.dataset.w + '%';
    if (el.dataset.bg) el.style.background = el.dataset.bg;
  });
}

/* ── input / change event delegation ───────────────────────────────── */
document.addEventListener('input', function(e) {
  const t = e.target;
  if (t.id === 'tx-search')    { renderTransactions(t.value); return; }
  if (t.id === 'inv-search')   { renderInvoices(t.value); return; }
  if (t.id === 'qte-search')   { renderQuotes(t.value); return; }
  if (t.id === 'co-search')    { renderCallouts(t.value); return; }
  if (t.id === 'cli-search')   { renderClients(t.value); return; }
  if (t.id === 'sf-search')    { renderSafetyFiles(t.value); return; }
  if (t.id === 'audit-search') { filterAudit(t.value); return; }
  if (t.matches('.li-qty,.li-price,.liinput')) { recalcQ(); return; }
  if (t.dataset.action === 'safAppointeeChanged') {
    safAppointeeChanged(t.dataset.sectionKey, +t.dataset.itemIdx, t); return;
  }
  if (t.dataset.action === 'safCommentChanged') {
    safCommentChanged(t.dataset.sectionKey, +t.dataset.itemIdx, t); return;
  }
});

document.addEventListener('change', function(e) {
  const t = e.target;
  if (t.id === 'inv-filter')       { renderInvoices('', t.value); return; }
  if (t.id === 'qte-filter')       { renderQuotes('', t.value); return; }
  if (t.id === 'co-filter')        { renderCallouts('', t.value); return; }
  if (t.id === 'sf-filter-status') { renderSafetyFiles(); return; }
  if (t.id === 'saf-det-upload')   { safDetailUpload(t); return; }
  if (t.id === 'cmp-type-sel')     { safCmpTypeChanged(); return; }
  if (t.id === 'cmp-scope')        { safCmpScopeChanged(); return; }
  if (t.id === 'cmp-issue')        { safCmpCalcExpiry(); return; }
  if (t.id === 'cmp-months')       { safCmpCalcExpiry(); return; }
  if (t.id === 'cedit-issue')      { safCEditCalcExpiry(); return; }
  if (t.id === 'cedit-months')     { safCEditCalcExpiry(); return; }
  if (t.dataset.action === 'safItemChanged') {
    safItemChanged(t.dataset.sectionKey, +t.dataset.itemIdx, t); return;
  }
  if (t.dataset.action === 'safHandleUpload') {
    safHandleUpload(t.dataset.sectionKey, +t.dataset.itemIdx, t); return;
  }
  if (t.dataset.action === 'safSectionUpload') {
    safSectionUpload(t, t.dataset.fileId, t.dataset.sectionKey); return;
  }
  if (t.dataset.action === 'safUploadComplianceDoc') {
    safUploadComplianceDoc(+t.dataset.id, t.dataset.fileId, t); return;
  }
  if (t.dataset.action === 'safApSetStatus') {
    safApSetStatus(t.dataset.fileId, t.dataset.sectionKey, +t.dataset.itemIdx, t.value); return;
  }
});

/* ── Login / reset keydown wiring (runs after DOM is ready) ─────────── */
document.addEventListener('DOMContentLoaded', function() {
  const loginEnter = e => { if (e.key === 'Enter') doLogin(); };
  ['l-user', 'l-pass', 'l-captcha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', loginEnter);
  });
  const fpEl = document.getElementById('fp-user');
  if (fpEl) fpEl.addEventListener('keydown', e => { if (e.key === 'Enter') doRequestReset(); });
  const resetEnter = e => { if (e.key === 'Enter') doResetPassword(); };
  ['np-pass1', 'np-pass2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', resetEnter);
  });
});

/* ── Attachments modal / panel ─────────────────────────────────────── */
function openAttachmentsModal(entityType, entityRef) {
  let ctxHtml = '';
  if (entityType === 'callout') {
    const c = proxyDB.callouts.find(x => x.id === entityRef);
    if (c) ctxHtml = `<div class="att-ctx"><span class="fw-600">${esc(c.service)}</span>  —  ${esc(c.location||'')}  ·  ${fmtD(c.date)}</div>`;
  } else if (entityType === 'quote') {
    const q = proxyDB.quotes.find(x => x.id === entityRef);
    if (q) ctxHtml = `<div class="att-ctx"><span class="fw-600">${esc(q.client)}</span>  —  Quote ${esc(q.id)}  ·  ${fmtD(q.date)}</div>`;
  } else if (entityType === 'invoice') {
    const inv = proxyDB.invoices.find(x => x.id === entityRef);
    if (inv) ctxHtml = `<div class="att-ctx"><span class="fw-600">${esc(inv.client)}</span>  —  Invoice ${esc(inv.id)}  ·  ${fmt(inv.amount)}</div>`;
  }
  openModal('Attachments — ' + entityRef,
    `${ctxHtml}<div id="attach-modal-area"></div>`);
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
    <div class="mb-12">
      <div class="att-slbl">📎 Files (${list.length})</div>
      ${list.length ? list.map(a => `
        <div class="att-row">
          <span class="att-icon">${fileIcon(a.mime_type)}</span>
          <div class="att-info">
            <div class="att-name">${esc(a.original_name)}</div>
            <div class="att-meta">${fmtBytes(a.file_size)} · ${esc(a.uploaded_by)} · ${(a.created_at||'').slice(0,10)}</div>
          </div>
          ${(a.mime_type==='application/pdf'||a.mime_type?.startsWith('image/'))?`<button class="btn btn-g btn-s" data-action="openDocViewer" data-id="${a.id}" data-name="${esc(a.original_name)}" data-mime="${esc(a.mime_type)}">&#128065; View</button>`:''}
          <a href="${API_BASE}/files.php?action=download&id=${a.id}" target="_blank" class="btn btn-g btn-s">&#8595; Download</a>
          ${canDel ? `<button class="btn btn-g btn-s att-del" data-action="deleteAttachment" data-id="${a.id}" data-entity-type="${esc(entityType)}" data-entity-ref="${esc(entityRef)}">&#10005;</button>` : ''}
        </div>`).join('') : '<div class="att-empty">No files attached yet</div>'}
    </div>
    <div class="att-upsec">
      <div class="att-slbl">Upload File</div>
      <div class="att-uprow">
        <input type="file" id="attach-file-input" accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png" class="att-finp">
        <button class="btn btn-p btn-s" data-action="uploadAttachment" data-entity-type="${esc(entityType)}" data-entity-ref="${esc(entityRef)}">Upload</button>
      </div>
      <div class="att-fhint">PDF, Excel, Word, JPEG, PNG · Max 10 MB</div>
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

/* ── Document viewer (inline PDF / image preview) ─────────────────── */
function openDocViewer(id, name, mime) {
  const isPdf = mime === 'application/pdf';
  const isImg = mime && mime.startsWith('image/');
  const src   = `${API_BASE}/files.php?action=view&id=${id}`;
  let body;
  if (isPdf) {
    body = `<div class="dv-wrap">
      <div class="dv-hdr">
        <span class="dv-name">${esc(name)}</span>
        <a href="${API_BASE}/files.php?action=download&id=${id}" class="btn btn-g btn-s">&#8595; Download</a>
      </div>
      <iframe src="${src}" class="dv-iframe" title="${esc(name)}"></iframe>
    </div>`;
  } else if (isImg) {
    body = `<div class="text-center">
      <div class="dv-hdr">
        <span class="dv-name">${esc(name)}</span>
        <a href="${API_BASE}/files.php?action=download&id=${id}" class="btn btn-g btn-s">&#8595; Download</a>
      </div>
      <img src="${src}" alt="${esc(name)}" class="dv-img">
    </div>`;
  } else {
    body = `<div class="dv-unsup">
      <div class="fs-32 mb-12">📄</div>
      <div class="fs-13 mb-16">${esc(name)}</div>
      <p class="fs-11 mb-16">This file type cannot be previewed in the browser.</p>
      <a href="${API_BASE}/files.php?action=download&id=${id}" class="btn btn-p">&#8595; Download to Open</a>
    </div>`;
  }
  openModal(name, body);
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
  'finance.transactions':  ['admin','sysadmin','manager','admin_clerk'],
  'finance.statement':     ['admin','sysadmin','manager','client_support','admin_clerk'],
  'finance.income':        ['admin','sysadmin','manager','admin_clerk'],
  'capture.new_callout':   ['admin','sysadmin','manager','call_logger','client_support'],
  'capture.new_quote':     ['admin','sysadmin','manager','senior_tech'],
  'capture.new_invoice':   ['admin','sysadmin','manager','admin_clerk'],
  'capture.log_payment':   ['admin','sysadmin','manager','admin_clerk'],
  'security.audit':        ['admin','sysadmin'],
  'security.users':        ['admin','sysadmin','manager','admin_clerk'],
  'user.create':           ['admin','sysadmin','manager','admin_clerk'],
  'user.update':           ['admin','sysadmin'],
  'callout.confirm_closure':   ['admin','sysadmin','manager'],
  'invoice.send':              ['admin','sysadmin','manager','admin_clerk'],
  'finance.statement.release': ['admin','sysadmin','manager','admin_clerk'],
  'finance.statement.generate':['admin','sysadmin'],
  'clients.view':              ['admin','sysadmin','manager','admin_clerk','client_support'],
  'clients.create':            ['admin','sysadmin','manager','admin_clerk'],
  'clients.update':            ['admin','sysadmin','manager','admin_clerk'],
  'safety.view':               ['admin','sysadmin','manager','admin_clerk','safety_officer','junior_tech','senior_tech','call_logger','client_support','viewer'],
  'safety.create':             ['admin','sysadmin','manager','admin_clerk','safety_officer','senior_tech'],
  'safety.update':             ['admin','sysadmin','manager','admin_clerk','safety_officer','senior_tech'],
  'safety.delete':             ['admin','sysadmin','manager'],
  'safety.approve':            ['admin','sysadmin','manager'],
};
function can(perm){ return SESSION?.role==='sysadmin' || (PERMS[perm]||[]).includes(SESSION?.role); }

/* ═══════════════════════════════════════════════════════
   IN-MEMORY CACHE (populated from API on login/refresh)
═══════════════════════════════════════════════════════ */
let DB = { callouts:[], quotes:[], invoices:[], bank:[], users:[], safetyFiles:[], clients:[] };
let SESSION = null;
let AUDIT_LOG = [];

/* ── Data Refresh Functions ─────────────────────────── */
async function refreshSafetyFiles() {
  const r = await api('GET', 'safety.php?limit=500');
  if (r.success) DB.safetyFiles = r.data || [];
}
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
async function refreshClients() {
  if (!can('clients.view')) return;
  const r = await api('GET', 'clients.php?active=1');
  if (r.success) {
    DB.clients = r.data || [];
    populateClientDropdowns();
  }
}
function populateClientDropdowns() {
  const opts = DB.clients.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  ['nc-client','nq-client','ni-client'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">— Select Client —</option>' + opts;
    if (cur) el.value = cur;
  });
}

function populateLinkedDropdowns() {
  // Tech dropdown — dynamic from users list, filtered to tech roles
  const techEl = document.getElementById('nc-tech');
  if (techEl) {
    const TECH_ROLES = ['junior_tech', 'senior_tech'];
    const techs = (DB.users || []).filter(u => TECH_ROLES.includes(u.role) && u.active != 0);
    const techOpts = techs.map(u => `<option value="${esc(u.username)}">${esc(u.name)} (${esc(ROLE_LABELS[u.role]||u.role)})</option>`).join('');
    const cur = techEl.value;
    techEl.innerHTML = '<option value="">— Unassigned —</option>' + techOpts;
    if (cur) techEl.value = cur;
  }

  // Quote linked callout select (open/in-progress callouts only)
  const nqCalloutEl = document.getElementById('nq-callout-ref');
  if (nqCalloutEl) {
    const openCos = proxyDB.callouts.filter(c => ['Open','In Progress'].includes(c.status));
    const coOpts  = openCos.map(c => `<option value="${esc(c.id)}">${esc(c.id)} — ${esc(c.service)} (${esc(c.client)})</option>`).join('');
    const cur = nqCalloutEl.value;
    nqCalloutEl.innerHTML = '<option value="">— None (standalone quote) —</option>' + coOpts;
    if (cur) nqCalloutEl.value = cur;
  }

  // Invoice linked quote select (all non-cancelled quotes)
  const niQuoteEl = document.getElementById('ni-quote-ref');
  if (niQuoteEl) {
    const quotes = proxyDB.quotes.filter(q => q.status !== 'Cancelled');
    const qOpts  = quotes.map(q => `<option value="${esc(q.id)}">${esc(q.id)} — ${esc(q.client)} (${esc(q.status)})</option>`).join('');
    const cur = niQuoteEl.value;
    niQuoteEl.innerHTML = '<option value="">— None —</option>' + qOpts;
    if (cur) niQuoteEl.value = cur;
  }

  // Invoice linked callout select (completed callouts without invoice, or all active)
  const niCalloutEl = document.getElementById('ni-callout-ref');
  if (niCalloutEl) {
    const callouts = proxyDB.callouts.filter(c => c.status !== 'Invoiced');
    const coOpts2  = callouts.map(c => `<option value="${esc(c.id)}">${esc(c.id)} — ${esc(c.service)} (${esc(c.status)})</option>`).join('');
    const cur = niCalloutEl.value;
    niCalloutEl.innerHTML = '<option value="">— None —</option>' + coOpts2;
    if (cur) niCalloutEl.value = cur;
  }
}
async function refreshAll() {
  const tasks = [refreshCallouts(), refreshQuotes(), refreshInvoices(), refreshTransactions(), refreshSafetyFiles(), refreshClients()];
  if (can('security.users')) tasks.push(refreshUsers());
  await Promise.all(tasks);
  populateLinkedDropdowns();
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
    clientId:       q.client_id ? Number(q.client_id) : null,
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

function normalizeSafetyFile(f) {
  return {
    id:               f.ref_id,
    contractor:       f.contractor       || '',
    contractorRep:    f.contractor_rep   || '',
    appointee162:     f.appointee162     || '',
    auditDate:        f.audit_date       || '',
    region:           f.region           || '',
    auditTeam:        f.audit_team       || '',
    scopeOfWork:      f.scope_of_work    || '',
    manpower:         Number(f.manpower  || 0),
    supervisors:      Number(f.supervisors || 0),
    sheReps:          Number(f.she_reps  || 0),
    firstAiders:      Number(f.first_aiders || 0),
    auditorName:      f.auditor_name     || '',
    signOffDate:      f.sign_off_date    || '',
    status:           f.status           || 'Draft',
    score:            f.score !== null && f.score !== undefined ? Number(f.score) : null,
    toStdCount:       f.to_std_count  !== undefined ? Number(f.to_std_count)  : null,
    notStdCount:      f.not_std_count !== undefined ? Number(f.not_std_count) : null,
    naCount:          f.na_count      !== undefined ? Number(f.na_count)      : null,
    policyEmailSent:  !!f.policy_email_sent,
    policyEmailDate:  f.policy_email_date || null,
    sections:         f.sections         || null,
    createdAt:        f.created_at       || '',
    updatedAt:        f.updated_at       || '',
  };
}

// Override DB getters to normalize on read
// NOTE: reads DB directly (not a captured snapshot) so refreshAll() results are visible immediately
const proxyDB = {
  get callouts()    { return DB.callouts.map(normalizeCallout); },
  get quotes()      { return DB.quotes.map(normalizeQuote); },
  get invoices()    { return DB.invoices.map(normalizeInvoice); },
  get bank()        { return DB.bank.map(normalizeBank); },
  get users()       { return DB.users; },
  get safetyFiles() { return (DB.safetyFiles || []).map(normalizeSafetyFile); },
  get clients()     { return DB.clients || []; },
  get counters()    { return { co:0, q:0, inv:0 }; },
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
  document.getElementById('forgot-panel').style.display = 'block';
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
function initStickyHeaders(){
  document.querySelectorAll('.ppage').forEach(page=>{
    const title=page.querySelector('.ptitle');
    if(!title||title.parentElement.classList.contains('ppage-hdr')) return;
    const sub=title.nextElementSibling;
    const hdr=document.createElement('div');
    hdr.className='ppage-hdr';
    title.parentNode.insertBefore(hdr,title);
    hdr.appendChild(title);
    if(sub&&sub.classList.contains('psub')) hdr.appendChild(sub);
  });
}
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

  const loginBtn = document.querySelector('#login-screen .btn-login-submit');
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
  document.getElementById('ptb-user').textContent = SESSION.name;

  document.documentElement.dataset.state = 'portal';
  document.getElementById('dash-sub').textContent = `AECI CHEMPARK  -  ${(ROLE_LABELS[SESSION.role]||SESSION.role).toUpperCase()} VIEW`;

  // Load all data from API
  toast('Loading data…', 'ok');
  await refreshAll();

  // Navigate to first page for role
  const firstPage = {
    call_logger:'p-new-callout', junior_tech:'p-callouts',
    senior_tech:'p-callouts', client_support:'p-dashboard', admin_clerk:'p-callouts',
    safety_officer:'p-safety',
  }[SESSION.role] || 'p-dashboard';
  showPortalPage(firstPage, null);
  updateBadges();
  startIdleTimer();
  initStickyHeaders();
}

async function doLogout(){
  stopIdleTimer();
  await api('POST', 'auth.php?action=logout');
  SESSION = null;
  DB = { callouts:[], quotes:[], invoices:[], bank:[], users:[], safetyFiles:[], clients:[] };
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
  {
    id: 'group-dashboard', label: 'Dashboard',
    page: 'p-dashboard', perm: null,
    items: [],
  },
  {
    id: 'group-operations', label: 'Operations', perm: null,
    page: 'p-ops-dashboard',
    items: [
      { id:'p-ops-dashboard', label:'Overview',  perm: null },
      { id:'p-timeline',      label:'Timeline',  perm: null },
      { id:'p-callouts',      label:'Call Log',  perm:'callout.view', badge:'nb-co' },
      { id:'p-quotes',        label:'Quote Log', perm:'quote.view',   badge:'nb-qte' },
    ],
  },
  {
    id: 'group-finance', label: 'Finance', perm: null,
    page: 'p-finance-dashboard',
    items: [
      { id:'p-finance-dashboard', label:'Overview',         perm: null },
      { id:'p-invoices',          label:'Invoices',         perm:'invoice.view',         badge:'nb-inv' },
      { id:'p-statement',         label:'Statements',       perm:'finance.statement' },
      { id:'p-transactions',      label:'Transactions',     perm:'finance.transactions' },
      { id:'p-income',            label:'Income Stmt',      perm:'finance.income' },
      { id:'p-reconcile',         label:'Reconciliation',   perm:'finance.transactions' },
      { id:'p-clients',           label:'Clients',          perm:'clients.view' },
    ],
  },
  {
    id: 'group-support', label: 'Support', perm: null,
    page: 'p-support-dashboard',
    items: [
      { id:'p-support-dashboard', label:'Overview',      perm: null },
      { id:'p-users',             label:'Users & Roles', perm:'security.users' },
      { id:'p-safety',            label:'Safety Files',  perm: 'safety.view', badge:'nb-saf' },
      { id:'p-audit',             label:'Audit Log',     perm:'security.audit' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════
   DASHBOARD WIDGET REGISTRY
   Each entry is a logical card group. Users can toggle
   any widget their role can see. Prefs stored per-user
   in localStorage so they survive page reload.
═══════════════════════════════════════════════════════ */
const DASH_WIDGETS = [
  { id:'w-ops',        label:'Operations',         desc:'Open callouts · pending quotes · recent job log',    perm:'callout.view' },
  { id:'w-fin',        label:'Finance',             desc:'Invoiced MTD · net balance · 6-month revenue chart', perm:'invoice.view' },
  { id:'w-alerts',     label:'Live Alerts',         desc:'Overdue invoices · urgent callouts · pending approvals', perm: null },
  { id:'w-compliance', label:'Compliance Alerts',   desc:'Expiring and overdue safety certificates',          perm:'safety.view' },
];

function getDashPrefs() {
  try { return JSON.parse(localStorage.getItem('bf_dash_' + (SESSION?.username||'')) || '{}'); }
  catch { return {}; }
}
function saveDashPrefs(prefs) {
  localStorage.setItem('bf_dash_' + (SESSION?.username||''), JSON.stringify(prefs));
}
function isWidgetOn(id) {
  const p = getDashPrefs();
  return p[id] !== false;
}

function findGroupForPage(pageId) {
  return NAV_CONFIG.find(g => g.page === pageId || (g.items||[]).some(i => i.id === pageId));
}

function activateNavGroup(groupId) {
  document.querySelectorAll('.pnav-group').forEach(g => g.classList.remove('active'));
  const groupEl = document.querySelector(`.pnav-group[data-group="${groupId}"]`);
  if (groupEl) groupEl.classList.add('active');

  const group = NAV_CONFIG.find(g => g.id === groupId);
  if (!group) return;

  const linksEl = document.getElementById('pnav-links');
  const subBar  = document.getElementById('pnav-bar');
  if (!linksEl) return;

  const visible = (group.items || []).filter(i => !i.perm || can(i.perm));

  if (!visible.length) {
    linksEl.innerHTML = '';
    if (subBar) subBar.style.visibility = 'hidden';
    return;
  }
  if (subBar) subBar.style.visibility = '';
  linksEl.innerHTML = visible.map(item => {
    const badge = item.badge ? `<span class="pnbadge" id="${item.badge}">0</span>` : '';
    return `<div class="pnitem" data-page="${item.id}" data-action="navPage">${item.label}${badge}</div>`;
  }).join('');
}

function activateNavGroupAndNavigate(groupId) {
  activateNavGroup(groupId);
  const group = NAV_CONFIG.find(g => g.id === groupId);
  if (!group) return;
  showPortalPage(group.page || (group.items||[]).find(i=>!i.perm||can(i.perm))?.id, null);
}

function buildNav() {
  const primary = document.getElementById('pnav-primary');
  if (!primary) return;
  let html = '';
  NAV_CONFIG.forEach(group => {
    const accessible = (group.items||[]).some(i => !i.perm || can(i.perm)) || (!group.perm || can(group.perm));
    if (!accessible) return;
    html += `<div class="pnav-group" data-group="${group.id}" data-action="activateNavGroupAndNavigate">${group.label}</div>`;
  });
  primary.innerHTML = html;
}

/* ═══════════════════════════════════════════════════════
   DATA STORE
═══════════════════════════════════════════════════════ */
const STORE='bf_v10';
DB = load();

function load(){
  try{ const d=localStorage.getItem(STORE); if(d) return JSON.parse(d); }catch(e){}
  return { callouts:[], quotes:[], invoices:[], bank:[], safetyFiles:[], clients:[], counters:{co:0,q:0,inv:0} };
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
const fmtD  = d =>d?new Date(d+'T00:00:00').toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'}):'-';
const fmtDT = dt=>dt?new Date(dt).toLocaleString('en-ZA',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
const esc = s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const ROLE_LABELS = {
  sysadmin:'Sys Admin',
  admin:'Admin',manager:'Manager',call_logger:'Call Logger',
  junior_tech:'Junior Tech',senior_tech:'Senior Tech',
  client_support:'Client Support',admin_clerk:'Admin Clerk',viewer:'Viewer',
  safety_officer:'Safety Officer'
};
const ROLE_COLORS = {
  sysadmin:'emergency',
  admin:'emergency',manager:'progress',call_logger:'open',
  junior_tech:'draft',senior_tech:'sent',client_support:'invoiced',
  admin_clerk:'paid',viewer:'draft',safety_officer:'approved'
};

function pillH(s){
  const m={Open:'open','In Progress':'progress',Completed:'invoiced',Invoiced:'invoiced',Draft:'draft',Sent:'sent',Approved:'approved',Paid:'paid',Overdue:'overdue',Emergency:'emergency',Urgent:'progress',Normal:'draft','Pending Approval':'pending-approval'};
  const cls=m[s]||'draft';
  if(cls==='pending-approval') return`<span class="pill pill--pending">${esc(s)}</span>`;
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
  c.appendChild(t);
  setTimeout(()=>{t.classList.add('hiding');setTimeout(()=>t.remove(),400);},6000);
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
   INFO / GUIDE MODE
═══════════════════════════════════════════════════════ */
let INFO_MODE = localStorage.getItem('bf-info') === 'on';

/* How-to guide content for each portal page */
const PAGE_INFO = {
  'p-dashboard': {
    title: 'Dashboard',
    sub: 'Your control centre',
    purpose: 'The central hub showing live activity across the entire portal — callouts, invoices, safety compliance, and recent audit events at a glance.',
    steps: [
      'Review the key metric cards at the top — badge numbers flag items needing attention.',
      'Check the recent callouts and outstanding invoices panels for anything requiring follow-up.',
      'Use the quick-action buttons to jump directly to the relevant module.',
      'The safety compliance summary shows whether any OHS documents are overdue.',
      'The audit feed at the bottom shows the 5 most recent actions across all users.',
    ],
    tips: [
      'Refresh the dashboard when you arrive each morning — it reflects the live state of the system.',
      'Red badge numbers on the nav indicate urgent items — don\'t ignore them.',
    ],
    faqs: [
      { q: 'Why are my badge counts different from what I expect?', a: 'Badges update every time you navigate to a page. Click away and back to force a refresh.' },
      { q: 'Can I customise which cards appear on the dashboard?', a: 'Not yet — layout customisation is a planned feature. Submit a suggestion below to prioritise it.' },
    ],
    linked: 'Operations, Finance, Support — all modules feed into this view.',
    access: ['admin','sysadmin','manager','admin_clerk','senior_tech','call_logger','viewer','client_support','junior_tech'],
  },
  'p-ops-dashboard': {
    title: 'Operations Overview',
    sub: 'Operational health at a glance',
    purpose: 'Shows real-time status of callouts and quotes — active incidents, open items, and team workload in one view.',
    steps: [
      'Check pending callouts — anything in Open status needs a technician assigned.',
      'Review quotes awaiting approval — managers can approve directly from here.',
      'Use quick-action buttons to log a new callout or submit a new quote.',
      'Click any summary card to drill into the full list for that module.',
    ],
    tips: [
      'If the open callout count is high, check the Call Log for items stuck in Open for more than 24 hours.',
      'Pending approval quotes block the billing cycle — review them daily.',
    ],
    faqs: [
      { q: 'What\'s the difference between Operations Overview and the main Dashboard?', a: 'The main Dashboard covers all modules. Operations Overview focuses only on callouts and quotes.' },
      { q: 'How do I assign a technician to a callout from here?', a: 'Navigate to the Call Log using the quick action button and expand the callout row.' },
    ],
    linked: 'Callouts, Quotes, Timeline.',
    access: ['admin','sysadmin','manager','call_logger','senior_tech','junior_tech','client_support','admin_clerk','viewer'],
  },
  'p-timeline': {
    title: 'Timeline',
    sub: 'Chronological event view',
    purpose: 'A time-ordered view of callouts and quotes, useful for spotting busy periods and understanding workload patterns.',
    steps: [
      'Scroll through the timeline to see events plotted by date.',
      'Use this to plan resource allocation during known busy periods.',
      'Click any event to see its full detail in the Call Log or Quote Log.',
    ],
    tips: [
      'Dense clusters on the timeline indicate high-demand days — use this to plan staffing.',
      'If events look sparse, check that callouts are being logged promptly and not batched.',
    ],
    faqs: [
      { q: 'How far back does the timeline go?', a: 'The timeline shows all available records. Scroll up to go back further in time.' },
      { q: 'Can I filter by client or technician?', a: 'Not yet — submit a suggestion below to prioritise it.' },
    ],
    linked: 'Callouts, Quotes.',
    access: ['admin','sysadmin','manager','call_logger','senior_tech','junior_tech','client_support','admin_clerk','viewer'],
  },
  'p-callouts': {
    title: 'Call Log',
    sub: 'Incident & service callout tracker',
    purpose: 'The complete record of every security callout — incident type, location, assigned technician, PO number, and resolution status.',
    steps: [
      'Click "+ Log Call" to create a new callout. Fill in the client, site, service type, and description.',
      'Use the search box to filter by client name, reference number, or status.',
      'Click any row to expand it — update status, assign a technician, or add a PO number.',
      'Once work is complete, update status to Closed. A manager must confirm closure.',
      'Closed callouts can be converted to invoices from the expanded row.',
    ],
    tips: [
      'Always assign a PO number before sending a job to a subcontractor — finance needs it for reconciliation.',
      'Close callouts within 24 hours of completion. Open callouts inflate the ops dashboard counts.',
      'Never delete a callout unless it was logged in error — use Closed status to archive.',
    ],
    faqs: [
      { q: 'Can I edit a callout after saving?', a: 'Yes — expand the row. Most fields remain editable until the callout is Closed.' },
      { q: 'How do I link a callout to an invoice?', a: 'Open the callout and use "Convert to Invoice" — it pre-fills the line item with the service details.' },
      { q: 'Why can\'t I delete a callout?', a: 'Only Admins and Managers can delete records. Contact your manager if a record needs removing.' },
    ],
    linked: 'Clients, Technicians, Quotes, Invoices.',
    access: ['admin','sysadmin','manager','call_logger','senior_tech','junior_tech','client_support','admin_clerk','viewer'],
  },
  'p-quotes': {
    title: 'Quote Log',
    sub: 'Quotation management',
    purpose: 'Create, track, and approve service quotations. Approved quotes convert directly into invoices.',
    steps: [
      'Click "+ Submit Quote" to draft a new quotation. Select the client and set a valid-until date.',
      'Add line items — each needs a description, quantity, and unit rate. Totals are calculated automatically.',
      'Submit the quote — it moves to Pending Approval. You will be notified when it is reviewed.',
      'A manager or admin can approve or decline. Declined quotes can be revised and resubmitted.',
      'Approved quotes can be converted to an invoice with one click from the expanded row.',
    ],
    tips: [
      'Double-check the VAT treatment before submitting — incorrect VAT causes billing issues downstream.',
      'Set realistic valid-until dates — expired quotes cannot be converted without re-approval.',
    ],
    faqs: [
      { q: 'Can I edit a quote after submitting?', a: 'Not once it is Pending Approval. Only Admins can edit at that stage — withdraw and resubmit if you made an error.' },
      { q: 'What happens when a quote expires?', a: 'It is marked Expired. The client must accept a revised quote before it can be converted.' },
      { q: 'Can I send the quote directly to the client?', a: 'Not yet — export the details and send manually. A direct send feature is planned.' },
    ],
    linked: 'Clients, Invoices (conversion), Callouts.',
    access: ['admin','sysadmin','manager','senior_tech','client_support','admin_clerk','viewer'],
  },
  'p-finance-dashboard': {
    title: 'Finance Overview',
    sub: 'Financial health summary',
    purpose: 'High-level financial snapshot — total invoiced, amount collected, outstanding balance, and recent bank activity.',
    steps: [
      'Review the total outstanding balance — this is money owed across all active invoices.',
      'Check recent transactions to confirm payments are being logged correctly.',
      'Use quick links to drill into Invoices, Transactions, or the Income Statement.',
      'Alert the billing team if outstanding balance is growing without corresponding new payments.',
    ],
    tips: [
      'If outstanding is high but transactions look normal, check for invoices marked Sent but not followed up.',
      'Month-end: ensure all transactions for the period are captured before generating the Income Statement.',
    ],
    faqs: [
      { q: 'Why does my outstanding not match the bank statement?', a: 'Invoices are logged when created, but payments may not be logged yet. Check the Transactions module.' },
      { q: 'Who can see financial data?', a: 'Finance data is restricted to Admin, Sysadmin, Manager, and Admin Clerk roles.' },
    ],
    linked: 'Invoices, Transactions, Statements, Income Statement.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-invoices': {
    title: 'Invoices',
    sub: 'Invoice management',
    purpose: 'Create, send, and track all invoices — from draft through to paid.',
    steps: [
      'Click "+ New Invoice" to create. Select the client and billing period.',
      'Add line items — description, quantity, and unit rate. VAT is calculated automatically.',
      'Use the Send button to email the invoice directly to the client.',
      'Mark an invoice as Paid once payment is confirmed. This updates the finance dashboard immediately.',
      'Invoices can also be generated automatically from an approved quote.',
    ],
    tips: [
      'Send invoices promptly — a delay between work completion and invoicing slows cash flow.',
      'Never mark an invoice as Paid until you have confirmed the bank deposit. Reversing a payment is disruptive.',
      'If a client queries an invoice, use the attachment feature to add supporting documentation.',
    ],
    faqs: [
      { q: 'Can I edit an invoice after sending it?', a: 'Contact an admin — sent invoices are locked to maintain the audit trail.' },
      { q: 'What if a client pays partially?', a: 'Log a partial payment in Log Payment. The invoice status will reflect the outstanding amount.' },
      { q: 'How do I void a cancelled invoice?', a: 'Delete it (Admin/Manager only). Add a note in the suggestion box below for the record.' },
    ],
    linked: 'Clients, Quotes (conversion), Transactions, Statements.',
    access: ['admin','sysadmin','manager','client_support','admin_clerk','viewer'],
  },
  'p-statement': {
    title: 'Statements',
    sub: 'Client account statements',
    purpose: 'Generate a statement of account for any client — a summary of invoices and payments for a selected period.',
    steps: [
      'Select the client from the dropdown.',
      'Choose the statement period (date range).',
      'Review the statement — it lists all invoices, payment dates, and running balance.',
      'Download as PDF, or release it directly to the client via the portal.',
    ],
    tips: [
      'Send statements monthly even if the balance is zero — it builds client trust and reduces disputes.',
      'Confirm all transactions for the period are logged before releasing a statement.',
    ],
    faqs: [
      { q: 'Can clients view their own statements?', a: 'Not directly in this portal version. Download and email the PDF to the client.' },
      { q: 'What if a statement shows the wrong balance?', a: 'Check that all payments for the period are logged in Log Payment. Missing payments cause discrepancies.' },
    ],
    linked: 'Invoices, Clients.',
    access: ['admin','sysadmin','manager','client_support','admin_clerk'],
  },
  'p-transactions': {
    title: 'Transactions',
    sub: 'Bank transaction log',
    purpose: 'Record every money-in and money-out bank transaction for reconciliation and income reporting.',
    steps: [
      'Log each transaction as it appears on the bank statement — date, description, and amount.',
      'Set the type: Income or Expense.',
      'Use the description field to note the invoice reference or supplier name for easy reconciliation.',
      'This data feeds the Income Statement — accurate entries mean accurate reports.',
    ],
    tips: [
      'Log transactions daily, not in batches at month-end — batching leads to errors and missed entries.',
      'Use consistent descriptions, e.g. "INV-001 PAYMENT" not just "payment" — so reconciliation is simple.',
    ],
    faqs: [
      { q: 'Do I log invoices here too?', a: 'No — invoices are logged in the Invoices module. Transactions are only actual bank movements.' },
      { q: 'I logged the wrong amount — how do I fix it?', a: 'Contact an Admin. Only Admins can edit or delete transaction records to maintain the audit trail.' },
    ],
    linked: 'Invoices, Income Statement.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-income': {
    title: 'Income Statement',
    sub: 'Profit & loss summary',
    purpose: 'A period-based income versus expense report showing net financial performance.',
    steps: [
      'Select the reporting period (month or custom date range).',
      'Review total income, total expenses, and the net profit/loss figure.',
      'Verify the figures match expectations before exporting.',
      'Export for use in accounting software or management reporting.',
    ],
    tips: [
      'Only generate this report after confirming all transactions for the period are captured.',
      'If income looks unexpectedly low, check for invoices not yet marked as paid.',
    ],
    faqs: [
      { q: 'Does this report include VAT?', a: 'It reflects transaction values as logged. Ensure VAT is handled consistently when logging transactions.' },
      { q: 'Can I export to Excel?', a: 'PDF download is available. Excel export is on the roadmap — submit a suggestion below to prioritise it.' },
    ],
    linked: 'Transactions, Invoices.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-reconcile': {
    title: 'Reconciliation',
    sub: 'Portal vs external statement',
    purpose: 'Compare the portal\'s transaction total against your bank or client statement to identify missing, duplicate, or incorrect entries.',
    steps: [
      'Enter the closing balance from your external statement in the input at the top.',
      'The portal calculates its own net balance and shows the difference.',
      'Review the transactions listed — look for duplicates or entries that don\'t match the statement.',
      'Log any missing transactions via the Transactions page, then refresh.',
    ],
    tips: [
      'A zero difference means the portal matches the statement exactly.',
      'Positive difference (portal > statement) usually means a duplicate credit in the portal.',
      'Negative difference (portal < statement) usually means a missing payment entry.',
    ],
    faqs: [
      { q: 'Where does the portal balance come from?', a: 'It is SUM(credit) − SUM(debit) across all rows in the Transactions ledger.' },
      { q: 'Can I delete a duplicate transaction?', a: 'Only Admins can delete transactions. Use the Transactions page to identify and remove duplicates.' },
    ],
    linked: 'Transactions, Income Statement.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-clients': {
    title: 'Clients',
    sub: 'Client master records',
    purpose: 'The master list of all clients — company name, contact person, billing address, and account status.',
    steps: [
      'Add a new client before creating invoices or statements for them.',
      'Ensure the billing contact email is accurate — it is used when sending invoices.',
      'Keep the physical address current — it appears on invoices and statements.',
      'Deactivate a client record when they are no longer active — preserves history without cluttering dropdowns.',
    ],
    tips: [
      'Create the client record before logging their first callout or quote — you cannot link records to an unlisted client.',
      'Use the company trading name exactly as it should appear on invoices.',
    ],
    faqs: [
      { q: 'Can I delete a client?', a: 'Not if they have linked invoices or callouts. Deactivate the record instead to preserve history.' },
      { q: 'What is the Account Reference field?', a: 'Your internal client code for cross-referencing with accounting systems or filing.' },
    ],
    linked: 'Invoices, Statements, Callouts.',
    access: ['admin','sysadmin','manager','admin_clerk','client_support'],
  },
  'p-support-dashboard': {
    title: 'Support Overview',
    sub: 'Administration health check',
    purpose: 'A daily admin snapshot — user account status, safety file compliance, and recent system activity.',
    steps: [
      'Check for any user accounts that need attention (new requests, role changes).',
      'Review the safety compliance status — flag any documents nearing their review date.',
      'Scan the recent audit feed for any unusual or unexpected actions.',
      'Use quick links to manage Users, Safety Files, or view the full Audit Log.',
    ],
    tips: [
      'Review this dashboard at the start of each week — compliance issues caught early are easier to resolve.',
      'Unexpected audit entries outside business hours warrant immediate investigation.',
    ],
    faqs: [
      { q: 'Who has access to this dashboard?', a: 'Admin, Sysadmin, Manager, Admin Clerk, and Viewer roles. Sensitive sub-pages have additional permission gates.' },
    ],
    linked: 'Users & Roles, Safety Files, Audit Log.',
    access: ['admin','sysadmin','manager','admin_clerk','viewer'],
  },
  'p-users': {
    title: 'Users & Roles',
    sub: 'User account management',
    purpose: 'Create and manage portal user accounts. Roles control exactly what each person can see and do.',
    steps: [
      'Click "+ New User" to create an account. Set username, email, and a temporary password.',
      'Assign the correct role — this determines which modules and actions are available.',
      'Use the edit button to change a user\'s role or reset their password.',
      'Deactivate accounts immediately when staff leave — do not delete them, to preserve audit history.',
      'All user changes are automatically logged in the Audit Log.',
    ],
    tips: [
      'Apply least privilege — assign the minimum role that lets someone do their job.',
      'Never share login credentials. Every person must have their own account for audit integrity.',
      'Deactivate ex-staff accounts the same day they leave — not the following week.',
    ],
    faqs: [
      { q: 'What is the difference between Admin and Sysadmin?', a: 'Sysadmin has unrestricted access to all functions. Admin has broad access but some restrictions remain.' },
      { q: 'Can a user change their own password?', a: 'Yes — there is a Forgot Password flow on the login screen. Admins can also reset passwords from here.' },
      { q: 'What happens to data when I deactivate a user?', a: 'Their records remain intact. They just cannot log in. All historical actions are preserved in the Audit Log.' },
    ],
    linked: 'Audit Log (all changes are recorded automatically).',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-safety': {
    title: 'Safety Files',
    sub: 'OHS compliance document store',
    purpose: 'Store, track, and manage all Occupational Health & Safety compliance documents — policies, appointments, and audit reports.',
    steps: [
      'Upload a new safety document using the "+ New File" button. Tag it with the correct document type.',
      'Set a review date so the system alerts you when it is nearing expiry.',
      'Once a document has been signed off, mark it as Approved.',
      'Monitor the compliance dashboard — expired or expiring documents are highlighted automatically.',
      'Use the Safety Audit tab to conduct a formal OHS audit against the Act.',
    ],
    tips: [
      'Keep your Section 16.2 appointment letters current — they expire when a responsible person changes role.',
      'Upload the signed version of each document, not the draft. Unsigned documents provide no legal protection.',
      'Set review dates 2 weeks before actual expiry to allow processing time.',
    ],
    faqs: [
      { q: 'Who can approve a safety document?', a: 'Admins and Managers only. The approver must verify the document is signed and current before approving.' },
      { q: 'What file formats are accepted?', a: 'PDF, Word (DOC/DOCX), Excel (XLS/XLSX), and JPEG/PNG. Maximum 10 MB per file.' },
      { q: 'Can I attach multiple files to one safety record?', a: 'Yes — use the attachments panel on the record to upload supplementary documents.' },
    ],
    linked: 'Safety Audit, Clients, Audit Log.',
    access: ['admin','sysadmin','manager','senior_tech','junior_tech','call_logger','client_support','admin_clerk','viewer'],
  },
  'p-safety-audit': {
    title: 'Safety Audit',
    sub: 'OHS Act formal audit form',
    purpose: 'Conduct and record a formal safety audit against OHS Act requirements. Creates a permanent compliance record.',
    steps: [
      'Click "+ New Audit" to start. Enter the contractor, representative, and Section 16.2 appointee.',
      'Set the audit date, region, team members, and scope of work.',
      'Work through each section of the checklist — record findings, ratings, and corrective actions.',
      'Click Save Draft at any point. You can return and continue later.',
      'Once all sections are completed, click Submit. The audit is locked from this point.',
      'Attach the signed audit report PDF to the submitted record.',
    ],
    tips: [
      'Complete audits in one sitting where possible — returning to a draft after a long gap risks inconsistent findings.',
      'Document corrective action owners and deadlines in findings fields — vague findings are not actionable.',
      'Get the Section 16.2 appointee to sign off physically before attaching the document.',
    ],
    faqs: [
      { q: 'Can I edit a submitted audit?', a: 'No — submitted audits are locked. Contact an Admin if a genuine amendment is needed; they will note the change in the audit log.' },
      { q: 'What is a Section 16.2 appointee?', a: 'Under the OHS Act, the employer (16.1) must appoint someone in writing to assist with compliance. This person is the 16.2 appointee.' },
      { q: 'How often should audits be conducted?', a: 'At minimum annually, or whenever significant site changes occur. High-risk sites should audit more frequently.' },
    ],
    linked: 'Safety Files, Clients, Audit Log.',
    access: ['admin','sysadmin','manager','senior_tech'],
  },
  'p-audit': {
    title: 'Audit Log',
    sub: 'Immutable system activity record',
    purpose: 'A tamper-evident log of every significant action in the portal — who did what, and when.',
    steps: [
      'Use the search box to filter by username, action keyword, or record reference.',
      'Look for PAGE_SUGGESTION entries — these are comments left by users via this Guide panel.',
      'Cross-reference timestamps with user reports when investigating discrepancies.',
      'Logs are read-only and cannot be altered — this is by design.',
    ],
    tips: [
      'Check the audit log before making bulk changes — you need a baseline of what "normal" looks like.',
      'PAGE_SUGGESTION entries are valuable user feedback — review them weekly and act on recurring themes.',
      'Unusual activity outside business hours warrants immediate investigation.',
    ],
    faqs: [
      { q: 'Can audit entries be deleted?', a: 'No — the audit log is immutable by design. This is a legal and compliance requirement.' },
      { q: 'How far back do logs go?', a: 'All entries since the portal went live are retained. No automatic expiry is applied.' },
      { q: 'Who can see the audit log?', a: 'Only Admin and Sysadmin roles. If a manager needs access, contact a Sysadmin to review the role configuration.' },
    ],
    linked: 'All modules — every significant action across the portal is recorded here.',
    access: ['admin','sysadmin'],
  },
  'p-new-callout': {
    title: 'Log New Callout',
    sub: 'Create an incident or service record',
    purpose: 'Log a new security incident or service callout as it comes in.',
    steps: [
      'Select the client and their site location.',
      'Choose the service type from the dropdown.',
      'Write a clear, specific description of the incident or service request.',
      'Assign a technician if already known — you can update this later from the Call Log.',
      'Click Save — the callout is created immediately with a unique reference number.',
    ],
    tips: [
      'Log callouts as they happen, not hours later — accurate timestamps matter for incident reporting.',
      'Be specific in the description: "CCTV Camera 3 offline, Sector B" is more useful than "CCTV issue".',
    ],
    faqs: [
      { q: 'What if I don\'t know which technician to assign?', a: 'Leave it blank and save. Assign the technician from the Call Log once one is confirmed.' },
      { q: 'Is there a limit to how many callouts I can log?', a: 'No limit. Log every callout — it builds your response history and supports billing.' },
    ],
    linked: 'Call Log, Clients.',
    access: ['admin','sysadmin','manager','call_logger','client_support'],
  },
  'p-new-quote': {
    title: 'New Quote',
    sub: 'Draft a service quotation',
    purpose: 'Create a quotation for services to be rendered. Must be approved before being sent to a client.',
    steps: [
      'Select the client and set a valid-until date.',
      'Add line items — description, quantity, and unit rate for each service.',
      'Review the calculated total and confirm VAT treatment.',
      'Click Submit to send for approval. You will be notified when it is reviewed.',
      'Once approved, convert it to an invoice from the Quote Log.',
    ],
    tips: [
      'Break labour and materials into separate line items — clients prefer itemised quotes.',
      'Set the valid-until date at least 2 weeks out — rushed quotes that expire before sign-off cause rework.',
    ],
    faqs: [
      { q: 'Can I save a quote as a draft?', a: 'Save it at any point — it stays in Draft status until you click Submit.' },
      { q: 'Can I duplicate an existing quote for a similar job?', a: 'Not yet — recreate it manually. Submit a suggestion below to request this feature.' },
    ],
    linked: 'Quote Log, Invoices, Clients.',
    access: ['admin','sysadmin','manager','senior_tech'],
  },
  'p-new-invoice': {
    title: 'New Invoice',
    sub: 'Create a client invoice',
    purpose: 'Generate an invoice for services delivered. Can be created from scratch or from an approved quote.',
    steps: [
      'Select the client and billing period.',
      'Add line items — description, quantity, and unit rate. VAT is calculated automatically.',
      'Review the total carefully before saving.',
      'Click Save. The invoice is live in the Invoices module immediately.',
      'Go to Invoices and use the Send button to email it to the client.',
    ],
    tips: [
      'Always cross-reference the invoice against the callout or quote it relates to before saving.',
      'Use a consistent description format, e.g. "Armed Response Retainer — May 2026".',
    ],
    faqs: [
      { q: 'Can I add a discount line item?', a: 'Yes — add a line item with a negative amount to represent a discount.' },
      { q: 'What invoice number format is used?', a: 'The system auto-generates a sequential reference (INV-XXX). Do not set it manually.' },
    ],
    linked: 'Invoices, Clients, Quotes.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-log-payment': {
    title: 'Log Payment',
    sub: 'Record a payment received',
    purpose: 'Record a payment against an outstanding invoice, marking it as settled.',
    steps: [
      'Select the invoice from the dropdown — only outstanding invoices are listed.',
      'Enter the amount received and the date the payment cleared.',
      'Add a bank reference number (EFT reference or cheque number).',
      'Click Confirm — the invoice status updates to Paid instantly.',
    ],
    tips: [
      'Only log a payment once it has cleared the bank — do not log pending EFTs.',
      'Always include the bank reference. Without it, the payment cannot be matched during reconciliation.',
    ],
    faqs: [
      { q: 'What if a client pays two invoices in one EFT?', a: 'Log a separate payment entry for each invoice. Use the same bank reference for both.' },
      { q: 'I logged the wrong amount — how do I fix it?', a: 'Contact an Admin. Payment records cannot be self-corrected to maintain the audit trail.' },
    ],
    linked: 'Invoices, Transactions.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-safety-detail': {
    title: 'Safety File Detail',
    sub: 'Compliance score & action plan',
    purpose: 'View and manage the full compliance record for a single safety file — overall audit score, section-by-section breakdown, corrective action plan, personnel, attachments, and policy acknowledgements.',
    steps: [
      'Check the audit score badge at the top: GREEN (90%+), YELLOW (75–89%), ORANGE (51–74%), or RED (below 51% — critical).',
      'Review the Summary of Compliance table to see which sections have the most non-compliant items.',
      'Expand the Action Plan to see every item not to standard. Assign an owner and target date in the Notes field.',
      'Use the Status dropdown on each action item to track progress: Open → In Progress → Fixed.',
      'Upload the signed corrective action documents in the Attachments section.',
      'Click "Approve" once all items are resolved and the file is ready to be locked as compliant.',
    ],
    tips: [
      'Address RED and ORANGE sections first — these carry the highest legal and compliance risk.',
      'Always record the corrective action owner and deadline in the Notes field. Vague findings cannot be enforced.',
      'Use the "Generate Docs" button to create template corrective action documents for all non-compliant items in one step.',
      'Use the "Tracker" button to download a standalone action tracker you can share with the contractor.',
      'Print the full pack (Print / Download Pack) before each compliance review meeting.',
    ],
    faqs: [
      { q: 'What do the score colour bands mean?', a: 'GREEN = 90%+ (fully compliant), YELLOW = 75–89% (monitor), ORANGE = 51–74% (action required within 30 days), RED = below 51% (critical — immediate corrective action).' },
      { q: 'Can I edit the audit once it is submitted?', a: 'Use the Edit button while the file is in Draft or Active status. Once Approved, the record is locked. Contact an Admin if an amendment is genuinely needed.' },
      { q: 'How do I track corrective actions?', a: 'Use the Status dropdown and Notes field on each Action Plan item. For a printable version to share with the contractor, click the Tracker button.' },
      { q: 'What is the Baseline audit score?', a: 'The score the file received when it was first submitted to AST. The Projected score updates as you mark items Fixed, showing what the score will be on re-submission.' },
      { q: 'Who can approve a safety file?', a: 'Only Admin and Manager roles. The approver should verify all corrective actions are closed and supporting documents are attached before approving.' },
    ],
    linked: 'Safety Files, Safety Audit, Clients, Audit Log.',
    access: ['admin','sysadmin','manager','senior_tech'],
  },
};

/* Per-page permission capabilities (for role-specific guidance) */
const PAGE_PERMS = {
  'p-callouts': [
    { perm: 'callout.view',            label: 'View callout records' },
    { perm: 'callout.create',          label: 'Log new callouts' },
    { perm: 'callout.update_status',   label: 'Update callout status' },
    { perm: 'callout.assign_tech',     label: 'Assign technicians' },
    { perm: 'callout.assign_po',       label: 'Assign PO numbers' },
    { perm: 'callout.confirm_closure', label: 'Confirm closure' },
    { perm: 'callout.delete',          label: 'Delete callout records' },
  ],
  'p-quotes': [
    { perm: 'quote.view',    label: 'View quotes' },
    { perm: 'quote.create',  label: 'Create & submit quotes' },
    { perm: 'quote.approve', label: 'Approve or decline quotes' },
    { perm: 'quote.convert', label: 'Convert quotes to invoices' },
    { perm: 'quote.delete',  label: 'Delete quote records' },
  ],
  'p-finance-dashboard': [
    { perm: 'finance.transactions', label: 'View financial overview' },
  ],
  'p-invoices': [
    { perm: 'invoice.view',      label: 'View invoices' },
    { perm: 'invoice.create',    label: 'Create new invoices' },
    { perm: 'invoice.mark_paid', label: 'Mark invoices as paid' },
    { perm: 'invoice.send',      label: 'Send invoices to clients' },
    { perm: 'invoice.delete',    label: 'Delete invoice records' },
  ],
  'p-statement': [
    { perm: 'finance.statement',          label: 'View & generate statements' },
    { perm: 'finance.statement.release',  label: 'Release statements to clients' },
    { perm: 'finance.statement.generate', label: 'Generate PDF statements' },
  ],
  'p-transactions': [
    { perm: 'finance.transactions', label: 'View & log transactions' },
  ],
  'p-income': [
    { perm: 'finance.income', label: 'View income statement' },
  ],
  'p-clients': [
    { perm: 'clients.view', label: 'View & manage client records' },
  ],
  'p-users': [
    { perm: 'security.users', label: 'View user accounts' },
    { perm: 'user.create',    label: 'Create new accounts' },
    { perm: 'user.update',    label: 'Edit roles & reset passwords' },
  ],
  'p-audit': [
    { perm: 'security.audit', label: 'View the full audit log' },
  ],
  'p-new-callout':  [{ perm: 'capture.new_callout',  label: 'Log new callouts' }],
  'p-new-quote':    [{ perm: 'capture.new_quote',    label: 'Submit new quotes' }],
  'p-new-invoice':  [{ perm: 'capture.new_invoice',  label: 'Create new invoices' }],
  'p-log-payment':  [{ perm: 'capture.log_payment',  label: 'Log payments' }],
};

/* Per-page quick navigation actions (filtered to user's permissions at render time) */
const PAGE_ACTIONS = {
  'p-dashboard':         [{ label:'Operations', page:'p-ops-dashboard' }, { label:'Finance', page:'p-finance-dashboard' }, { label:'Support', page:'p-support-dashboard' }],
  'p-ops-dashboard':     [{ label:'Call Log', page:'p-callouts', perm:'callout.view' }, { label:'Quotes', page:'p-quotes', perm:'quote.view' }, { label:'Timeline', page:'p-timeline' }],
  'p-timeline':          [{ label:'Call Log', page:'p-callouts', perm:'callout.view' }, { label:'Quotes', page:'p-quotes', perm:'quote.view' }],
  'p-callouts':          [{ label:'+ Log Call', page:'p-new-callout', perm:'capture.new_callout' }, { label:'Quotes', page:'p-quotes', perm:'quote.view' }, { label:'Timeline', page:'p-timeline' }],
  'p-quotes':            [{ label:'+ Submit Quote', page:'p-new-quote', perm:'capture.new_quote' }, { label:'Call Log', page:'p-callouts', perm:'callout.view' }, { label:'Invoices', page:'p-invoices', perm:'invoice.view' }],
  'p-finance-dashboard': [{ label:'Invoices', page:'p-invoices', perm:'invoice.view' }, { label:'Transactions', page:'p-transactions', perm:'finance.transactions' }, { label:'Income Stmt', page:'p-income', perm:'finance.income' }],
  'p-invoices':          [{ label:'+ New Invoice', page:'p-new-invoice', perm:'capture.new_invoice' }, { label:'Log Payment', page:'p-log-payment', perm:'capture.log_payment' }, { label:'Statements', page:'p-statement', perm:'finance.statement' }],
  'p-statement':         [{ label:'Invoices', page:'p-invoices', perm:'invoice.view' }, { label:'Clients', page:'p-clients' }],
  'p-transactions':      [{ label:'Invoices', page:'p-invoices', perm:'invoice.view' }, { label:'Income Stmt', page:'p-income', perm:'finance.income' }],
  'p-income':            [{ label:'Transactions', page:'p-transactions', perm:'finance.transactions' }, { label:'Invoices', page:'p-invoices', perm:'invoice.view' }],
  'p-clients':           [{ label:'Invoices', page:'p-invoices', perm:'invoice.view' }, { label:'Statements', page:'p-statement', perm:'finance.statement' }],
  'p-support-dashboard': [{ label:'Users', page:'p-users', perm:'security.users' }, { label:'Safety Files', page:'p-safety' }, { label:'Audit Log', page:'p-audit', perm:'security.audit' }],
  'p-users':             [{ label:'Audit Log', page:'p-audit', perm:'security.audit' }],
  'p-safety':            [{ label:'+ New Audit', page:'p-safety-audit' }, { label:'Audit Log', page:'p-audit', perm:'security.audit' }],
  'p-safety-audit':      [{ label:'Safety Files', page:'p-safety' }],
  'p-safety-detail':     [{ label:'Safety Files', page:'p-safety' }, { label:'+ New Audit', page:'p-safety-audit' }],
  'p-audit':             [{ label:'Users', page:'p-users', perm:'security.users' }, { label:'Support', page:'p-support-dashboard' }],
  'p-new-callout':       [{ label:'Call Log', page:'p-callouts', perm:'callout.view' }],
  'p-new-quote':         [{ label:'Quote Log', page:'p-quotes', perm:'quote.view' }],
  'p-new-invoice':       [{ label:'Invoices', page:'p-invoices', perm:'invoice.view' }],
  'p-log-payment':       [{ label:'Invoices', page:'p-invoices', perm:'invoice.view' }, { label:'Transactions', page:'p-transactions', perm:'finance.transactions' }],
};

const ADMIN_ROLES = new Set(['admin','sysadmin']);
const MANAGER_ROLES = new Set(['manager']);

let _infoCurPage = null;

function toggleInfoMode(){
  INFO_MODE = !INFO_MODE;
  localStorage.setItem('bf-info', INFO_MODE ? 'on' : 'off');
  document.documentElement.dataset.info = INFO_MODE ? 'on' : 'off';
  const btn = document.getElementById('info-mode-btn');
  if(btn) btn.classList.toggle('active', INFO_MODE);
  if(INFO_MODE && _infoCurPage) renderInfoPanel(_infoCurPage);
}

function renderInfoPanel(pageId){
  _infoCurPage = pageId;
  if(!INFO_MODE) return;
  const panel = document.getElementById('info-panel-inner');
  if(!panel) return;
  const info = PAGE_INFO[pageId];

  /* Populate sticky header */
  const hdrTitle = document.getElementById('info-panel-hdr-title');
  const hdrSub   = document.getElementById('info-panel-hdr-sub');
  if(hdrTitle) hdrTitle.textContent = info ? (info.title || 'Page Guide') : 'Page Guide';
  if(hdrSub)   hdrSub.textContent   = info ? (info.sub   || '')           : '';

  if(!info){
    panel.innerHTML = `<div class="ipanel-empty">No guide available for this screen yet.</div>`;
    return;
  }

  /* Role-specific capabilities */
  const pageCaps = PAGE_PERMS[pageId] || [];
  const myCaps    = pageCaps.filter(c => can(c.perm));
  const notMyCaps = pageCaps.filter(c => !can(c.perm));
  const roleSection = pageCaps.length && SESSION ? `
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">Your access — ${esc(ROLE_LABELS[SESSION.role]||SESSION.role)}</div>
      ${myCaps.length
        ? myCaps.map(c=>`<div class="ipanel-can"><span class="ipanel-can-icon">✓</span>${esc(c.label)}</div>`).join('')
        : '<div class="ro-note">Read-only access on this page.</div>'}
      ${notMyCaps.length
        ? `<div class="ipanel-cannot-wrap">${notMyCaps.map(c=>`<div class="ipanel-cannot"><span class="ipanel-cannot-icon">–</span>${esc(c.label)}</div>`).join('')}</div>`
        : ''}
    </div>` : '';

  /* Quick actions — filtered to what the user can do */
  const pageActs = (PAGE_ACTIONS[pageId]||[]).filter(a => !a.perm || can(a.perm));
  const actionsSection = pageActs.length ? `
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">Quick actions</div>
      <div class="ipanel-actions-row">${pageActs.map(a=>`<button class="ipanel-action-btn" data-action="navPage" data-page="${a.page}">${esc(a.label)}</button>`).join('')}</div>
    </div>` : '';

  /* Steps */
  const steps = (info.steps||[]).map((s,i)=>`
    <li><span class="ipanel-step-num">${i+1}</span><span>${esc(s)}</span></li>`).join('');

  /* Tips */
  const tipsSection = (info.tips||[]).length ? `
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">Tips &amp; warnings</div>
      ${info.tips.map(t=>`<div class="ipanel-tip"><span class="ipanel-tip-icon">!</span><span>${esc(t)}</span></div>`).join('')}
    </div>` : '';

  /* FAQs */
  const faqsSection = (info.faqs||[]).length ? `
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">Frequently asked</div>
      ${info.faqs.map(f=>`
        <div class="ipanel-faq">
          <div class="ipanel-faq-q">${esc(f.q)}</div>
          <div class="ipanel-faq-a">${esc(f.a)}</div>
        </div>`).join('')}
    </div>` : '';

  /* Access chips */
  const chips = (info.access||[]).map(r=>{
    const cls = ADMIN_ROLES.has(r)?'chip-admin':MANAGER_ROLES.has(r)?'chip-manager':'';
    return `<span class="ipanel-chip ${cls}">${ROLE_LABELS[r]||r}</span>`;
  }).join('');

  panel.innerHTML = `
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">What this page is for</div>
      <div class="ipanel-section-body">${esc(info.purpose)}</div>
    </div>
    ${roleSection}
    ${actionsSection}
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">How to use it</div>
      <ul class="ipanel-steps">${steps}</ul>
    </div>
    ${tipsSection}
    ${faqsSection}
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">Linked to</div>
      <div class="ipanel-section-body">${esc(info.linked)}</div>
    </div>
    <div class="ipanel-section">
      <div class="ipanel-section-lbl">Who has access</div>
      <div class="ipanel-access-chips">${chips}</div>
    </div>
    <div class="ipanel-divider"></div>
    <div class="ipanel-suggest-lbl">Suggestions &amp; comments</div>
    <div class="suggest-hint">Your feedback is logged to the audit trail and reviewed by admins.</div>
    <textarea id="info-suggestion" placeholder="Write a suggestion or note about this page…"></textarea>
    <button id="info-suggest-btn" data-action="submitInfoSuggestion" data-page="${pageId}">Log Suggestion</button>`;
}

async function submitInfoSuggestion(pageId){
  const ta = document.getElementById('info-suggestion');
  const btn = document.getElementById('info-suggest-btn');
  if(!ta) return;
  const comment = ta.value.trim();
  if(!comment){ toast('Write a suggestion first','err'); return; }
  if(btn){ btn.disabled=true; btn.textContent='Logging…'; }
  const r = await api('POST','audit.php',{page:pageId,comment});
  if(!r.success){
    toast(r.error||'Could not save suggestion','err');
    if(btn){ btn.disabled=false; btn.textContent='Log Suggestion'; }
    return;
  }
  audit('PAGE_SUGGESTION',`[${pageId}] ${comment}`);
  ta.value='';
  if(btn){ btn.disabled=false; btn.textContent='Log Suggestion'; }
  toast('Suggestion logged to audit trail','ok');
}

/* ═══════════════════════════════════════════════════════
   PUBLIC NAVIGATION
═══════════════════════════════════════════════════════ */
function pubNav(page){
  closeMobileMenu();
  document.querySelectorAll('.pub-page').forEach(p=>p.classList.remove('active'));
  document.getElementById('pub-'+page).classList.add('active');
  document.querySelectorAll('.pub-nav-link').forEach(l=>l.classList.remove('active'));
  const lnk=document.getElementById('pnl-'+page);if(lnk)lnk.classList.add('active');
  // sync mobile nav active state
  document.querySelectorAll('.pub-mob-nav-link').forEach(l=>l.classList.remove('active'));
  const ml=document.getElementById('pmnl-'+page);if(ml)ml.classList.add('active');
  window.scrollTo(0,0);
  if(page==='services') buildSvcGrid('pub');
}
function toggleMobileMenu(){
  const nav=document.getElementById('pub-mob-nav');
  const btn=document.querySelector('.pub-ham-btn');
  if(!nav||!btn) return;
  const opening=!nav.classList.contains('open');
  nav.classList.toggle('open',opening);
  btn.classList.toggle('open',opening);
  btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
}
function closeMobileMenu(){
  const nav=document.getElementById('pub-mob-nav');
  const btn=document.querySelector('.pub-ham-btn');
  if(!nav||!btn) return;
  nav.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded','false');
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
  document.getElementById('home-cats').innerHTML=CATEGORIES.map(c=>`<div class="cat-card" data-action="pubNavCat"><span class="cat-icon">${c.icon}</span><div class="cat-name">${esc(c.name)}</div><div class="cat-count">${c.count} SERVICES</div></div>`).join('');
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
  document.getElementById(filterId).innerHTML=chips.map(c=>`<div class="filter-chip ${c==='All'?'active':''}" data-action="filterSvc" data-cat="${esc(c)}" data-ctx="${ctx}">${esc(c)}</div>`).join('');
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
  closeMobileMenu();
  document.documentElement.dataset.state='login';
  // Check for reset_token in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('reset_token')) {
    document.getElementById('login-panel').style.display  = 'none';
    document.getElementById('forgot-panel').style.display = 'none';
    document.getElementById('newpass-panel').style.display = 'block';
  } else {
    showLoginPanel();
  }
}
function fillCreds(u,p){ document.getElementById('l-user').value=u; document.getElementById('l-pass').value=p; }

function showPortalPage(id, el){
  document.querySelectorAll('.ppage').forEach(p=>p.classList.remove('active'));
  const page=document.getElementById(id);
  if(page) page.classList.add('active');

  // Sync the primary group tab and sub-nav
  const group = findGroupForPage(id);
  if(group){
    const currentGroupEl = document.querySelector('.pnav-group.active');
    if(!currentGroupEl || currentGroupEl.dataset.group !== group.id){
      activateNavGroup(group.id);
    }
  }

  document.querySelectorAll('.pnitem').forEach(n=>n.classList.remove('active'));
  if(el) el.classList.add('active');
  else { const found=document.querySelector(`.pnitem[data-page="${id}"]`); if(found) found.classList.add('active'); }
  audit('VIEW',id);
  renderInfoPanel(id);
  // Render with current data immediately, then async-refresh and re-render
  const renders={
    'p-dashboard':         async()=>{ renderDashboard(); await refreshAll(); renderDashboard(); updateBadges(); safLoadDashCompliance(); },
    'p-ops-dashboard':     async()=>{ renderOpsDashboard(); await Promise.all([refreshCallouts(),refreshQuotes()]); renderOpsDashboard(); updateBadges(); },
    'p-finance-dashboard': async()=>{ renderFinDashboard(); await Promise.all([refreshInvoices(),refreshTransactions()]); renderFinDashboard(); updateBadges(); },
    'p-support-dashboard': async()=>{ renderSupDashboard(); await Promise.all([refreshUsers(),refreshSafetyFiles()]); renderSupDashboard(); updateBadges(); },
    'p-transactions': async()=>{ renderTransactions(''); await refreshTransactions(); renderTransactions(''); },
    'p-invoices':     async()=>{ renderInvoices(''); await refreshInvoices(); renderInvoices(''); updateBadges(); },
    'p-quotes':       async()=>{ renderQuotes(''); await refreshQuotes(); renderQuotes(''); updateBadges(); },
    'p-callouts':     async()=>{ renderCallouts(''); await refreshCallouts(); renderCallouts(''); updateBadges(); },
    'p-timeline':     async()=>{ renderTimeline(); },
    'p-statement':    async()=>{ renderStatement(); },
    'p-income':       async()=>{ await Promise.all([refreshInvoices(), refreshTransactions()]); renderIncome(); },
    'p-reconcile':    async()=>{ await refreshTransactions(); renderReconcile(); },
    'p-log-payment':  async()=>{ await refreshInvoices(); renderPayList(); },
    'p-audit':        async()=>{ const r=await api('GET','audit.php?limit=200'); AUDIT_LOG=(r.data||[]).map(e=>({ts:e.created_at?.slice(11,19)||'',user:e.username,role:'',action:e.action,detail:e.detail,level:'info'})); renderAudit(); },
    'p-home':         async()=>{ renderPortalHome(); },
    'p-services':     async()=>{ buildSvcGrid('portal'); },
    'p-new-quote':    async()=>{ initNewQuote(); },
    'p-new-callout':  async()=>{ initNewCallout(); },
    'p-new-invoice':  async()=>{ initNewInvoice(); },
    'p-users':        async()=>{ await refreshUsers(); renderUsers(); },
    'p-safety':       async()=>{ const sf=document.getElementById('sf-filter-status'); if(sf) sf.value=''; renderSafetyFiles(); await refreshSafetyFiles(); renderSafetyFiles(); updateBadges(); },
    'p-clients':      async()=>{ renderClients(''); await refreshClients(); renderClients(''); },
  };
  if(renders[id]) renders[id]();
}

function refreshCurrentPage(btn) {
  const active = document.querySelector('.ppage.active');
  if (!active) return;
  if (btn) {
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 800);
  }
  showPortalPage(active.id, document.querySelector(`.pnitem[data-page="${active.id}"]`));
}

function toggleSb(){ }
function closeSb(){ }

/* ═══════════════════════════════════════════════════════
   PORTAL HOME EMBED
═══════════════════════════════════════════════════════ */
function renderPortalHome(){
  document.getElementById('portal-home-embed').innerHTML=`
    <div class="kcard-cats-grid mb-20">
      ${CATEGORIES.map(c=>`<div class="kcard kcard-amber" data-action="navPage" data-page="p-services"><div class="fs-22 mb-6">${c.icon}</div><div class="klbl">${esc(c.name)}</div><div class="kval kval-18">${c.count}</div><div class="ksub">services</div></div>`).join('')}
    </div>
    <div class="cbar-brand-wrap">
      <div class="brand-eyebrow">Fire, taught to behave.</div>
      <div class="brand-display">BlackFire Solutions</div>
      <div class="brand-sub">Professional Security Services  -  Gauteng  -  24/7</div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD  (fully dynamic — driven by DASH_WIDGETS prefs)
═══════════════════════════════════════════════════════ */
function renderDashboard(){
  const container = document.getElementById('dash-main-content');
  if(!container) return;

  // Resolve which widgets are on for this user
  const showOps  = isWidgetOn('w-ops')        && can('callout.view');
  const showFin  = isWidgetOn('w-fin')        && (can('invoice.view') || can('finance.income'));
  const showAlrt = isWidgetOn('w-alerts');
  const showComp = isWidgetOn('w-compliance') && can('safety.view');

  const now = new Date();

  // Compute data values once
  const open = proxyDB.callouts.filter(c=>c.status==='Open'||c.status==='In Progress').length;
  const pq   = proxyDB.quotes.filter(q=>q.status==='Draft'||q.status==='Sent'||q.status==='Pending Approval').length;
  const mtd  = proxyDB.invoices.filter(i=>{const d=new Date(i.date+'T00:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((a,i)=>a+i.amount,0);
  const net  = proxyDB.bank.reduce((a,b)=>a+(b.credit||0)-(b.debit||0),0);

  // KPI cards — build only the ones the user has on and can see
  const kpiCards=[];
  const kv=(v)=>String(v).length>8?' kval--compact':'';
  if(showOps){
    const sOpen=String(open), sPq=String(pq);
    kpiCards.push(`<div class="kcard k1"><div class="klbl">Open Callouts</div><div class="kval${kv(sOpen)}">${sOpen}</div><div class="ksub">Active on site</div></div>`);
    if(can('quote.view')) kpiCards.push(`<div class="kcard k3"><div class="klbl">Pending Quotes</div><div class="kval${kv(sPq)}">${sPq}</div><div class="ksub">Awaiting approval</div></div>`);
  }
  if(showFin){
    const fmtMtd=fmt(mtd), fmtNet=fmt(net);
    if(can('invoice.view')) kpiCards.push(`<div class="kcard k2"><div class="klbl">Invoiced MTD</div><div class="kval${kv(fmtMtd)}">${fmtMtd}</div><div class="ksub">Month to date</div></div>`);
    if(can('finance.income')) kpiCards.push(`<div class="kcard k4"><div class="klbl">Net Balance</div><div class="kval${kv(fmtNet)}">${fmtNet}</div><div class="ksub">Credits − Debits</div></div>`);
  }

  // Alerts
  const overdue=proxyDB.invoices.filter(i=>i.status==='Overdue').length;
  const urgent=proxyDB.callouts.filter(c=>(c.priority==='Urgent'||c.priority==='Emergency')&&(c.status==='Open'||c.status==='In Progress')).length;
  const pendingQA=proxyDB.quotes.filter(q=>q.approvalStatus==='pending').length;
  let alertsHtml='';
  if(showAlrt){
    if(overdue>0&&can('invoice.view')) alertsHtml+=`<div class="acard danger"><div class="albl">Overdue Invoices</div><div class="acount">${overdue}</div><div class="adesc">Immediate follow-up</div></div>`;
    if(urgent>0) alertsHtml+=`<div class="acard warn"><div class="albl">Urgent Callouts</div><div class="acount">${urgent}</div><div class="adesc">Priority dispatch</div></div>`;
    if(pendingQA>0&&can('quote.approve')) alertsHtml+=`<div class="acard info"><div class="albl">Quotes Pending Approval</div><div class="acount">${pendingQA}</div><div class="adesc">Tech-submitted, awaiting review</div></div>`;
  }

  // Recent callouts
  const rc=[...proxyDB.callouts].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const rcRows=rc.length
    ?rc.map(c=>`<tr><td class="mono">${esc(c.id)}</td><td class="tc-11">${esc(c.service.substring(0,30))}${c.service.length>30?'…':''}</td><td>${pillH(c.status)}</td></tr>`).join('')
    :'<tr><td colspan="3" class="tc-empty-sm">No callouts</td></tr>';

  // Revenue chart
  const months=[];
  for(let i=5;i>=0;i--){const dt=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({lbl:dt.toLocaleDateString('en-ZA',{month:'short'}),m:dt.getMonth(),y:dt.getFullYear()});}
  const revData=months.map(m=>proxyDB.invoices.filter(i=>{const d=new Date(i.date+'T00:00:00');return d.getMonth()===m.m&&d.getFullYear()===m.y;}).reduce((a,i)=>a+i.amount,0));
  const maxRev=Math.max(...revData,1);
  const chartBars=revData.map((v,i)=>`<div class="cbar-w"><div class="cval">${v>0?'R'+Math.round(v/1000)+'K':''}</div><div class="cbar" data-h="${Math.max(4,Math.round((v/maxRev)*100))}" title="${fmt(v)}"></div><div class="clbl">${months[i].lbl}</div></div>`).join('');

  // Build HTML
  let html='';

  if(kpiCards.length) html+=`<div class="kgrid kgrid--auto">${kpiCards.join('')}</div>`;

  if(showAlrt) html+=`<div class="alert-strip" id="dash-alerts">${alertsHtml}</div>`;

  if(showComp) html+=`<div class="panel mt2 d-none" id="dash-comp-widget">
    <div class="ph">
      <div class="ph-title">Compliance Alerts</div>
      <button class="btn btn-g btn-s" data-action="navPage" data-page="p-safety">View Safety Files</button>
    </div>
    <div id="dash-comp-body"></div>
  </div>`;

  const panelL=showOps?`<div class="panel">
    <div class="ph"><div class="ph-title">Recent Callouts</div><button class="btn btn-g btn-s" data-action="navPage" data-page="p-callouts">View All</button></div>
    <div class="tw"><table><thead><tr><th>Job ID</th><th>Service</th><th>Status</th></tr></thead><tbody>${rcRows}</tbody></table></div>
  </div>`:null;
  const panelR=(showFin&&can('finance.income'))?`<div class="panel">
    <div class="ph"><div class="ph-title">Revenue — 6 Months</div></div>
    <div class="rev-chart-wrap"><div class="chart-bars">${chartBars}</div></div>
  </div>`:null;

  if(panelL&&panelR)      html+=`<div class="twocol">${panelL}${panelR}</div>`;
  else if(panelL)         html+=panelL;
  else if(panelR)         html+=panelR;

  if(!kpiCards.length&&!showAlrt&&!showComp&&!panelL&&!panelR)
    html=`<div class="dash-empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><p>Your dashboard is empty.<br><button class="btn btn-g btn-s" data-action="showDashEditor">Edit Layout</button> to add widgets.</p></div>`;

  container.innerHTML=html;
  container.querySelectorAll('.cbar[data-h]').forEach(b=>{ b.style.height=b.dataset.h+'px'; });

  // Nav badges (always update regardless of widget visibility)
  const nbCo=document.getElementById('nb-co');if(nbCo)nbCo.textContent=open;
  const nbInv=document.getElementById('nb-inv');if(nbInv)nbInv.textContent=proxyDB.invoices.filter(i=>i.status==='Sent'||i.status==='Overdue').length;
  const nbQte=document.getElementById('nb-qte');if(nbQte)nbQte.textContent=proxyDB.quotes.filter(q=>q.status==='Pending Approval').length;
}

async function safLoadDashCompliance(){
  if(!isWidgetOn('w-compliance')||!can('safety.view')) return;
  const panel=document.getElementById('dash-comp-widget');
  const body=document.getElementById('dash-comp-body');
  if(!panel||!body) return;
  try {
    const r=await api('GET','safety_compliance.php?action=due_soon');
    const rows=r.data||[];
    if(!rows.length){ panel.classList.add('d-none'); return; }

    const today=new Date(); today.setHours(0,0,0,0);
    const isOverdue=row=>{ const e=new Date(row.expiry_date+'T00:00:00'); e.setHours(0,0,0,0); return e<today; };

    const overdueTot=rows.filter(isOverdue).length;
    const soonTot=rows.length-overdueTot;

    // Inject alert cards into the dash-alerts strip (prepend)
    const strip=document.getElementById('dash-alerts');
    if(strip){
      let extra='';
      if(overdueTot>0) extra+=`<div class="acard danger"><div class="albl">Compliance Overdue</div><div class="acount">${overdueTot}</div><div class="adesc">Certificates expired</div></div>`;
      if(soonTot>0)   extra+=`<div class="acard warn"><div class="albl">Compliance Due Soon</div><div class="acount">${soonTot}</div><div class="adesc">Renewing within 60 days</div></div>`;
      strip.innerHTML=extra+strip.innerHTML;
    }

    // Build details table (cap at 15 rows; show "N more" footer)
    const visible=rows.slice(0,15);
    let html=`<div class="tw"><table><thead><tr><th>File</th><th>Contractor</th><th>Type</th><th>Person / Scope</th><th>Expiry</th><th>Status</th></tr></thead><tbody>`;
    visible.forEach(row=>{
      const ovr=isOverdue(row);
      const who=row.full_name?esc(row.full_name):`<span class="text-muted">Company</span>`;
      const badge=ovr?`<span class="badge-ovr">Overdue</span>`:`<span class="badge-soon">Due Soon</span>`;
      html+=`<tr>
        <td class="mono tc-11">${esc(row.file_ref)}</td>
        <td class="tc-11">${esc(row.contractor||'')}</td>
        <td class="tc-11">${esc(row.compliance_type)}</td>
        <td class="tc-11">${who}</td>
        <td class="mono tc-11">${esc(row.expiry_date)}</td>
        <td>${badge}</td>
      </tr>`;
    });
    html+='</tbody></table></div>';
    if(rows.length>15) html+=`<div class="more-items">${rows.length-15} more item${rows.length-15>1?'s':''} — open Safety / EHS for full list</div>`;

    body.innerHTML=html;
    panel.classList.remove('d-none');
  } catch(e){ /* compliance widget is non-critical — silent on API failure */ }
}

/* ═══════════════════════════════════════════════════════
   SECTION LANDING DASHBOARDS
═══════════════════════════════════════════════════════ */
function renderOpsDashboard() {
  const el = document.getElementById('ops-dash-content');
  if (!el) return;
  const now = new Date();
  const open       = proxyDB.callouts.filter(c => c.status === 'Open').length;
  const inProg     = proxyDB.callouts.filter(c => c.status === 'In Progress').length;
  const urgent     = proxyDB.callouts.filter(c => (c.priority === 'Urgent' || c.priority === 'Emergency') && (c.status === 'Open' || c.status === 'In Progress')).length;
  const pendingQA  = proxyDB.quotes.filter(q => q.approvalStatus === 'pending').length;
  const qMTD       = proxyDB.quotes.filter(q => { const d=new Date(q.date+'T00:00:00'); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  const recent     = [...proxyDB.callouts].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const statuses   = ['Open','In Progress','Completed','Invoiced'];
  const total      = proxyDB.callouts.length || 1;

  const statBars = statuses.map(s=>{
    const cnt = proxyDB.callouts.filter(c=>c.status===s).length;
    const pct = Math.round(cnt/total*100);
    const col = s==='Open'?'var(--blue)':s==='In Progress'?'var(--amber)':s==='Completed'?'var(--green)':'var(--muted)';
    return `<div class="mb-14">
      <div class="flex-sb mb-5">
        <span class="mlbl-xs">${s}</span>
        <span class="mlbl-sm">${cnt}</span>
      </div>
      <div class="prog-bar">
        <div class="prog-fill" data-w="${pct}" data-bg="${col}"></div>
      </div>
    </div>`;
  }).join('');

  const recentRows = recent.length
    ? recent.map(c=>`<tr>
        <td class="mono tc-13">${esc(c.id)}</td>
        <td class="tc-trunc">${esc(c.service)}</td>
        <td>${pillH(c.priority)}</td>
        <td>${pillH(c.status)}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" class="tc-empty">No callouts yet</td></tr>`;

  const qas = can('capture.new_callout') || can('capture.new_quote');
  el.innerHTML = `
    <div class="kgrid">
      <div class="kcard k1"><div class="klbl">Open Callouts</div><div class="kval">${open}</div><div class="ksub">Awaiting dispatch</div></div>
      <div class="kcard k2"><div class="klbl">In Progress</div><div class="kval">${inProg}</div><div class="ksub">Active on site</div></div>
      <div class="kcard kcard-ember"><div class="klbl">Urgent / Emergency</div><div class="kval kval-ember">${urgent}</div><div class="ksub">Priority dispatch</div></div>
      <div class="kcard k3"><div class="klbl">Quotes This Month</div><div class="kval">${qMTD}</div><div class="ksub">${pendingQA} pending approval</div></div>
    </div>
    <div class="twocol">
      <div class="panel">
        <div class="ph">
          <div class="ph-title">Recent Callouts</div>
          <button class="btn btn-g btn-s" data-action="navPage" data-page="p-callouts">View All →</button>
        </div>
        <div class="tw"><table><thead><tr><th>Job ID</th><th>Service</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>${recentRows}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Callout Breakdown</div></div>
        <div class="pb">${statBars}</div>
      </div>
    </div>
    ${qas ? `<div class="panel mt2">
      <div class="ph"><div class="ph-title">Quick Actions</div></div>
      <div class="pb dash-acts">
        ${can('capture.new_callout')?`<button class="btn btn-p" data-action="navPage" data-page="p-new-callout">+ Log Call</button>`:''}
        ${can('capture.new_quote')?`<button class="btn btn-g" data-action="navPage" data-page="p-new-quote">+ Submit Quote</button>`:''}
        <button class="btn btn-g" data-action="navPage" data-page="p-timeline">View Timeline →</button>
      </div>
    </div>` : ''}`;
  applyProgFills(el);
}

function renderFinDashboard() {
  const el = document.getElementById('fin-dash-content');
  if (!el) return;
  const now = new Date();
  const mtd         = proxyDB.invoices.filter(i=>{ const d=new Date(i.date+'T00:00:00'); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).reduce((a,i)=>a+i.amount,0);
  const overdue     = proxyDB.invoices.filter(i=>i.status==='Overdue');
  const sent        = proxyDB.invoices.filter(i=>i.status==='Sent');
  const outstanding = [...overdue,...sent].reduce((a,i)=>a+i.amount,0);
  const net         = proxyDB.bank.reduce((a,b)=>a+(b.credit||0)-(b.debit||0),0);

  // Revenue 6-month chart data
  const months=[];
  for(let i=5;i>=0;i--){const dt=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({lbl:dt.toLocaleDateString('en-ZA',{month:'short'}),m:dt.getMonth(),y:dt.getFullYear()});}
  const revData = months.map(m=>proxyDB.invoices.filter(i=>{const d=new Date(i.date+'T00:00:00');return d.getMonth()===m.m&&d.getFullYear()===m.y;}).reduce((a,i)=>a+i.amount,0));
  const maxRev  = Math.max(...revData,1);

  const invStatuses = ['Draft','Sent','Paid','Overdue'];
  const invTotal    = proxyDB.invoices.length || 1;
  const statBars    = invStatuses.map(s=>{
    const cnt = proxyDB.invoices.filter(i=>i.status===s).length;
    const pct = Math.round(cnt/invTotal*100);
    const col = s==='Paid'?'var(--green)':s==='Overdue'?'var(--ember)':s==='Sent'?'var(--amber)':'var(--muted)';
    return `<div class="mb-14">
      <div class="flex-sb mb-5">
        <span class="mlbl-xs">${s}</span>
        <span class="mlbl-sm">${cnt}</span>
      </div>
      <div class="prog-bar">
        <div class="prog-fill" data-w="${pct}" data-bg="${col}"></div>
      </div>
    </div>`;
  }).join('');

  const chartBars = revData.map((v,i)=>`
    <div class="cbar-w">
      <div class="cbar" data-h="${Math.max(Math.round(v/maxRev*100),2)}" title="${fmt(v)}"></div>
      <div class="clbl">${months[i].lbl}</div>
      <div class="cval">${v>0?fmt(v):''}</div>
    </div>`).join('');

  const qas = can('capture.new_invoice') || can('capture.log_payment');
  el.innerHTML = `
    <div class="kgrid">
      <div class="kcard k2"><div class="klbl">Invoiced MTD</div><div class="kval">${fmt(mtd)}</div><div class="ksub">Month to date</div></div>
      <div class="kcard kcard-ember"><div class="klbl">Outstanding</div><div class="kval kval-ember">${fmt(outstanding)}</div><div class="ksub">${overdue.length} overdue · ${sent.length} sent</div></div>
      <div class="kcard k4"><div class="klbl">Net Balance</div><div class="kval">${fmt(net)}</div><div class="ksub">Credits − Debits</div></div>
      <div class="kcard k1"><div class="klbl">Total Invoices</div><div class="kval">${proxyDB.invoices.length}</div><div class="ksub">All time</div></div>
    </div>
    <div class="twocol">
      <div class="panel">
        <div class="ph"><div class="ph-title">Revenue — 6 Months</div></div>
        <div class="rev-chart-wrap"><div class="chart-bars">${chartBars}</div></div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Invoice Status Breakdown</div></div>
        <div class="pb">${statBars}</div>
      </div>
    </div>
    ${qas ? `<div class="panel mt2">
      <div class="ph"><div class="ph-title">Quick Actions</div></div>
      <div class="pb dash-acts">
        ${can('capture.new_invoice')?`<button class="btn btn-p" data-action="navPage" data-page="p-new-invoice">+ New Invoice</button>`:''}
        ${can('capture.log_payment')?`<button class="btn btn-g" data-action="navPage" data-page="p-log-payment">Log Payment</button>`:''}
        <button class="btn btn-g" data-action="navPage" data-page="p-transactions">View Transactions →</button>
      </div>
    </div>` : ''}`;
  el.querySelectorAll('.cbar[data-h]').forEach(b=>{ b.style.height=b.dataset.h+'%'; });
  applyProgFills(el);
}

function renderSupDashboard() {
  const el = document.getElementById('sup-dash-content');
  if (!el) return;
  const safFiles      = proxyDB.safetyFiles || [];
  const safApproved   = safFiles.filter(f=>(f.status||'').toLowerCase()==='approved').length;
  const safSubmitted  = safFiles.filter(f=>(f.status||'').toLowerCase()==='submitted').length;
  const users         = DB.users || [];

  // Users by role
  const roleGroups = {};
  users.forEach(u=>{ roleGroups[u.role]=(roleGroups[u.role]||0)+1; });
  const roleRows = Object.entries(roleGroups).length
    ? Object.entries(roleGroups).map(([role,cnt])=>`
        <tr>
          <td>${rolePill(role)}</td>
          <td class="mono tc-15">${cnt}</td>
        </tr>`).join('')
    : `<tr><td colspan="2" class="tc-empty-xs">No users loaded</td></tr>`;

  // Recent audit
  const auditRows = AUDIT_LOG.slice(0,5).length
    ? AUDIT_LOG.slice(0,5).map(e=>`
        <div class="audit-row">
          <div class="audit-ts">${esc(e.ts||'')}</div>
          <div class="audit-user">${esc(e.user||'')}</div>
          <div class="audit-action">${esc(e.detail||e.action||'')}</div>
        </div>`).join('')
    : `<div class="p-14 fs-12 text-center italic text-muted">No recent activity</div>`;

  el.innerHTML = `
    <div class="kgrid">
      <div class="kcard kcard-blue"><div class="klbl">Safety Files</div><div class="kval">${safFiles.length}</div><div class="ksub">Total contractor files</div></div>
      <div class="kcard kcard-green"><div class="klbl">Approved</div><div class="kval kval-paid">${safApproved}</div><div class="ksub">Compliant files</div></div>
      <div class="kcard k3"><div class="klbl">Awaiting Review</div><div class="kval">${safSubmitted}</div><div class="ksub">Submitted for approval</div></div>
      <div class="kcard k1"><div class="klbl">Portal Users</div><div class="kval">${users.length}</div><div class="ksub">Active accounts</div></div>
    </div>
    <div class="twocol">
      <div class="panel">
        <div class="ph">
          <div class="ph-title">Users by Role</div>
          ${can('security.users')?`<button class="btn btn-g btn-s" data-action="navPage" data-page="p-users">Manage →</button>`:''}
        </div>
        <div class="tw"><table><thead><tr><th>Role</th><th>Count</th></tr></thead>
          <tbody>${roleRows}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <div class="ph">
          <div class="ph-title">Recent Audit Activity</div>
          ${can('security.audit')?`<button class="btn btn-g btn-s" data-action="navPage" data-page="p-audit">View All →</button>`:''}
        </div>
        ${auditRows}
      </div>
    </div>
    <div class="panel mt2">
      <div class="ph"><div class="ph-title">Quick Actions</div></div>
      <div class="pb dash-acts">
        <button class="btn btn-g" data-action="navPage" data-page="p-safety">Safety Files →</button>
        ${can('security.users')?`<button class="btn btn-g" data-action="navPage" data-page="p-users">Manage Users →</button>`:''}
        ${can('security.audit')?`<button class="btn btn-g" data-action="navPage" data-page="p-audit">Audit Log →</button>`:''}
      </div>
    </div>`;
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
      ?`<span class="mono fs-10">${esc(c.po)}</span>`
      :(canPO?`<button class="btn btn-g btn-s" data-action="openAssignPO" data-id="${esc(c.id)}">Assign</button>`:`<span class="text-muted fs-11">-</span>`);
    const loggedByUser=proxyDB.users.find(u=>u.username===c.loggedBy);
    const assignedUser=proxyDB.users.find(u=>u.username===c.assignedTo);
    const assignedDisplay=assignedUser?assignedUser.name:(c.tech||'-');

    const actions=[];
    if(canStatus) actions.push(`<button class="btn btn-g btn-s" data-action="openStatusModal" data-id="${esc(c.id)}">Update Status</button>`);
    if(canTech&&!c.assignedTo) actions.push(`<button class="btn btn-g btn-s" data-action="openAssignTech" data-id="${esc(c.id)}">Assign Tech</button>`);
    if(can('capture.new_quote')) actions.push(`<button class="btn btn-g btn-s" data-action="prefillQuoteFromJob" data-id="${esc(c.id)}">Quote</button>`);
    actions.push(`<button class="btn btn-g btn-s" data-action="openAttachmentsModal" data-entity-type="callout" data-entity-ref="${esc(c.id)}">Files</button>`);
    if(can('callout.confirm_closure')&&c.status==='Completed'&&!c.closureConfirmed&&!c.invoiceGenerated){
      actions.push(`<button class="btn btn-p btn-s" data-action="openConfirmClosureModal" data-id="${esc(c.id)}">Confirm Closure</button>`);
    }
    if(canDel) actions.push(`<button class="btn btn-g btn-s" data-action="deleteCallout" data-id="${esc(c.id)}">Del</button>`);

    return`<tr>
      <td class="mono">${esc(c.id)}</td>
      <td class="tc-12 max-180">${esc(c.service)}<div class="mlbl-9 mt-2">${esc(c.location||'')}</div></td>
      <td class="tc-11">${esc(assignedDisplay)}</td>
      <td>${poCell}</td>
      <td>${pillH(c.priority)}</td>
      <td>${pillH(c.status)}</td>
      <td class="fs-10 text-muted">${esc(loggedByUser?.name||c.loggedBy||'-')}</td>
      <td class="tc-11 nowrap">${fmtD(c.date)}${c.time?'  -  '+esc(c.time):''}</td>
      <td><div class="bgrp">${actions.join('')}</div></td>
    </tr>`;
  }).join(''):'<tr><td colspan="9" class="tc-empty">'+(SESSION?.role==='junior_tech'||SESSION?.role==='senior_tech'?'No callouts assigned to you':'No callouts found')+'</td></tr>';
}

function openStatusModal(id){
  const c=proxyDB.callouts.find(x=>x.id===id);if(!c)return;
  openModal(`Update Status - ${c.id}`,`
    <div class="att-ctx mb-14">
      <div class="mlbl-9 mb-4">Service</div>
      <div class="fs-13 fw-600">${esc(c.service)}</div>
      <div class="fs-11 text-muted mt-2">${esc(c.location||'')}  -  Logged ${fmtD(c.date)}</div>
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
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveStatus" data-id="${esc(c.id)}">Save Update</button></div>
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
    <div class="fs-12 text-muted mb-14">Assign a Purchase Order number to this job. The PO will be referenced on the invoice.</div>
    <div class="fgroup"><label class="flbl">Purchase Order Number</label><input class="finput" id="po-input" value="${esc(c.po||'')}" placeholder="e.g. PO-2026-045"></div>
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="assignPO" data-id="${esc(c.id)}">Assign PO</button></div>
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
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveTechAssign" data-id="${esc(id)}">Assign</button></div>
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
    <div class="closure-warn mb-14">
      <div class="fs-11 text-ovr font-mono ls-1 mb-6">MANAGER CONFIRMATION REQUIRED</div>
      <div class="fs-12">This callout was not closed by the client. A written confirmation and an uploaded document are required before an invoice can be generated.</div>
    </div>
    <div class="att-ctx mb-12">
      <div class="fs-11 fw-600">${esc(c.id)}  —  ${esc(c.service)}</div>
      <div class="fs-10 text-muted">${esc(c.client)}  ·  ${esc(c.location||'')}  ·  ${fmtD(c.date)}</div>
    </div>
    <div class="fgroup mb-12">
      <label class="flbl">Confirmation Notes <span class="text-ember">*</span></label>
      <textarea class="finput" id="cc-notes" rows="4" placeholder="Describe why the client did not close this callout and what written confirmation was received..."></textarea>
    </div>
    <div class="att-ctx mb-14">
      <div class="fs-11 fw-600 mb-6">Upload Confirmation Document <span class="text-ember">*</span></div>
      <div class="fs-10 text-muted mb-8">Upload the signed/written document confirming this closure. PDF, Word, or image accepted.</div>
      <input type="file" id="cc-doc" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" class="fs-11">
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveConfirmClosure" data-id="${esc(c.id)}">Confirm &amp; Generate Invoice</button></div>
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
  populateLinkedDropdowns();
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
    const submitterCell=submitter?`${esc(submitter.name)}<div class="mlbl-9 mt-2">${esc(ROLE_LABELS[submitter.role]||submitter.role)}</div>`:'<span class="text-muted">-</span>';
    const actions=[];
    actions.push(`<button class="btn btn-g btn-s" data-action="previewQuote" data-id="${esc(q.id)}">View</button>`);
    actions.push(`<button class="btn btn-g btn-s" data-action="openAttachmentsModal" data-entity-type="quote" data-entity-ref="${esc(q.id)}">Files</button>`);
    if(canApprove&&q.approvalStatus==='pending'){
      actions.push(`<button class="btn btn-s bg-grn" data-action="approveQuote" data-id="${esc(q.id)}">Approve</button>`);
      actions.push(`<button class="btn btn-s bg-emb" data-action="rejectQuote" data-id="${esc(q.id)}">Decline</button>`);
    }
    if(canConvert&&q.status!=='Pending Approval') actions.push(`<button class="btn btn-g btn-s" data-action="convertToInvoice" data-id="${esc(q.id)}">Invoice</button>`);
    if(canDel) actions.push(`<button class="btn btn-g btn-s" data-action="deleteQuote" data-id="${esc(q.id)}">Del</button>`);
    return`<tr>
      <td class="mono">${esc(q.id)}</td>
      <td>${esc(q.client)}</td>
      <td class="amt">${fmt(total)}</td>
      <td class="tc-11">${submitterCell}</td>
      <td class="tc-11 nowrap">${fmtD(q.validUntil)}</td>
      <td>${pillH(q.status)}</td>
      <td><div class="bgrp">${actions.join('')}</div></td>
    </tr>`;
  }).join(''):'<tr><td colspan="7" class="tc-empty">No quotes</td></tr>';
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
        <div class="doc-contact">+27 68 912 6581<br>info@blackfiresolutions.co.za</div>
      </div>
      <div class="doc-type">QUOTATION</div>
      <div class="doc-meta">
        <div><div class="dml">Quote #</div><div class="dmv font-mono">${esc(q.id)}</div></div>
        <div><div class="dml">Client</div><div class="dmv">${esc(q.client)}</div></div>
        <div><div class="dml">Date</div><div class="dmv">${fmtD(q.date)}</div></div>
        <div><div class="dml">Valid Until</div><div class="dmv">${fmtD(q.validUntil)}</div></div>
      </div>
      ${q.approvalStatus==='pending'?'<div class="qte-pending-warn">⚠ Pending Manager Approval - not yet issued to client</div>':''}
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
    <div id="attach-modal-area" class="inv-att-area"></div>`);
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
  populateLinkedDropdowns();
}
function addLine(){
  const r=document.createElement('tr');
  r.innerHTML=`<td><input class="liinput" placeholder="Service / item description"></td><td><input class="liinput li-qty" type="number" value="1" min="0"></td><td><input class="liinput li-price" type="number" value="0" min="0" step="0.01"></td><td class="mono lt li-total">R0.00</td><td><button class="btn btn-g btn-s" data-action="removeLine">✕</button></td>`;
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
    <tr><td class="mono">${esc(inv.id)}</td><td>${esc(inv.client)}</td><td class="amt">${fmt(inv.amount)}</td><td class="tc-11 nowrap">${fmtD(inv.dueDate)}</td><td>${pillH(inv.status)}</td>
    <td><div class="bgrp">
      <button class="btn btn-g btn-s" data-action="previewInvoice" data-id="${esc(inv.id)}">View</button>
      <button class="btn btn-g btn-s" data-action="openAttachmentsModal" data-entity-type="invoice" data-entity-ref="${esc(inv.id)}">Files</button>
      ${canSend&&inv.status!=='Paid'&&inv.status!=='Cancelled'&&inv.amount>0?`<button class="btn btn-p btn-s" data-action="openSendInvoiceModal" data-id="${esc(inv.id)}">Send</button>`:''}
      ${canPaid&&inv.status!=='Paid'?`<button class="btn btn-g btn-s" data-action="markPaid" data-id="${esc(inv.id)}">Paid</button>`:''}
      ${canDel?`<button class="btn btn-g btn-s" data-action="deleteInvoice" data-id="${esc(inv.id)}">Del</button>`:''}
    </div></td></tr>`).join(''):'<tr><td colspan="6" class="tc-empty">No invoices</td></tr>';
}

function openSendInvoiceModal(id){
  const inv=proxyDB.invoices.find(x=>x.id===id);if(!inv)return;
  if(inv.amount<=0){toast('Set the invoice amount before sending','err');return;}
  openModal(`Send Invoice — ${inv.id}`,`
    <div class="att-ctx mb-14">
      <div class="fs-12 fw-600">${esc(inv.id)}  —  ${esc(inv.client)}</div>
      <div class="fs-11 text-muted mt-2">Amount: R ${Number(inv.amount).toLocaleString('en-ZA',{minimumFractionDigits:2})}  ·  Due: ${fmtD(inv.dueDate)}</div>
    </div>
    <div class="fgroup">
      <label class="flbl">Send to (email address) <span class="text-ember">*</span></label>
      <input class="finput" id="si-email" type="email" value="${esc(inv.clientEmail||'')}" placeholder="client@company.co.za">
    </div>
    <div class="fs-10 text-muted mt-4 mb-14">
      The invoice will be sent from noreply@blackfiresolutions.co.za and the invoice status will change to Sent.
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="sendInvoiceEmail" data-id="${esc(inv.id)}">Send Invoice</button></div>
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
        <div class="doc-contact">+27 68 912 6581<br>info@blackfiresolutions.co.za</div>
      </div>
      <div class="doc-type">TAX INVOICE</div>
      <div class="doc-meta">
        <div><div class="dml">Invoice #</div><div class="dmv font-mono">${esc(inv.id)}</div></div>
        <div><div class="dml">Client</div><div class="dmv">${esc(inv.client)}</div></div>
        <div><div class="dml">PO Reference</div><div class="dmv">${esc(inv.po||'N/A')}</div></div>
        <div><div class="dml">Due Date</div><div class="dmv">${fmtD(inv.dueDate)}</div></div>
      </div>
      <div class="doc-tots w-full">
        <div class="doc-tot-row"><span>Excl. VAT</span><span>${fmt(inv.amount/1.15)}</span></div>
        <div class="doc-tot-row"><span>VAT (15%)</span><span>${fmt(inv.amount-inv.amount/1.15)}</span></div>
        <div class="doc-tot-row grand"><span>TOTAL DUE</span><span>${fmt(inv.amount)}</span></div>
      </div>
      <div class="mt-12">${pillH(inv.status)}</div>
      <div class="doc-note">Fire, taught to behave.  -  BlackFire Solutions (Pty) Ltd</div>
    </div>
    <div id="attach-modal-area" class="inv-att-area"></div>`);
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
  populateLinkedDropdowns();
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
    <tr><td class="nowrap">${fmtD(b.date)}</td><td>${esc(b.desc)}</td><td><span class="mlbl-9">${esc(b.cat)}</span></td><td class="mono">${esc(b.ref||'-')}</td>
    <td class="amt text-ok">${b.credit>0?fmt(b.credit):'-'}</td>
    <td class="amt text-ovr">${b.debit>0?fmt(b.debit):'-'}</td></tr>`).join(''):'<tr><td colspan="6" class="tc-empty">No transactions</td></tr>';
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
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveTx">Save</button></div>`);
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
  document.getElementById('stmt-content').innerHTML=`<div class="stmt-loading">Loading statements…</div>`;
  const r=await api('GET','statements.php?action=list');
  if(!r.success){document.getElementById('stmt-content').innerHTML=`<div class="stmt-error">${esc(r.error||'Failed to load statements')}</div>`;return;}

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
      <td class="tc-11">${esc(inv.client_name)}</td>
      <td class="tc-11">${esc(inv.invoice_date||'')}</td>
      <td class="tc-11">${esc(inv.due_date||'')}</td>
      <td>${pillH(inv.status)}</td>
      <td class="amt">${fmt(Number(inv.amount))}</td>
    </tr>`).join('');

  const pendingCards=pending.map(s=>`
    <div class="stmt-pcard">
      <div class="stmt-pcrd-hdr">
        <div>
          <div class="stmt-pcrd-ref">${esc(s.ref_id)}  ·  PENDING APPROVAL</div>
          <div class="stmt-pcrd-sub">Generated ${fmtD(s.created_at?.slice(0,10)||'')}  ·  ${s.invoice_refs?.split(',').filter(Boolean).length||0} invoices  ·  Total R ${Number(s.total_outstanding||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}</div>
        </div>
        ${canRelease?`<button class="btn btn-p btn-s" data-action="openReleaseStatementModal" data-id="${esc(s.ref_id)}">Release Statement</button>`:'<span class="fs-10 text-muted">Awaiting release by authorised user</span>'}
      </div>
    </div>`).join('');

  const releasedRows=released.slice(0,10).map(s=>`
    <tr>
      <td class="mono">${esc(s.ref_id)}</td>
      <td>${fmtD(s.scheduled_for||'')}</td>
      <td>${fmtD(s.released_at?.slice(0,10)||'')} by ${esc(s.released_by||'')}</td>
      <td>${esc(s.from_email||'')}</td>
      <td>${esc(s.to_emails||'')}</td>
      <td class="amt">R ${Number(s.total_outstanding||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}</td>
      <td><button class="btn btn-g btn-s" data-action="downloadStatement" data-id="${esc(s.ref_id)}">Download</button></td>
    </tr>`).join('');

  const outRowsLimited=outstanding.slice(0,10).map(inv=>`
    <tr>
      <td class="mono">${esc(inv.ref_id)}</td>
      <td>${esc(inv.client_name)}</td>
      <td>${esc(inv.invoice_date||'')}</td>
      <td>${esc(inv.due_date||'')}</td>
      <td>${pillH(inv.status)}</td>
      <td class="amt">${fmt(Number(inv.amount))}</td>
    </tr>`).join('');

  const outValClass = outTotal>0?'text-ovr':'text-ok';
  const pendValClass = pending.length?'text-amber':'text-muted';

  document.getElementById('stmt-content').innerHTML=`
    <div class="stmt-kgrid">
      <div class="stmt-kcard"><div class="stmt-klbl">Outstanding</div><div class="stmt-kval ${outValClass}">R ${outTotal.toLocaleString('en-ZA',{minimumFractionDigits:2})}</div></div>
      <div class="stmt-kcard"><div class="stmt-klbl">Pending Statements</div><div class="stmt-kval ${pendValClass}">${pending.length}</div></div>
      <div class="stmt-kcard"><div class="stmt-klbl">Statements Sent</div><div class="stmt-kval">${released.length}</div></div>
    </div>

    ${released.length?`
    <div class="stmt-slbl">RECENT STATEMENTS SENT</div>
    <div class="panel stmt-mb18"><div class="tw stmt-tbl-wrap"><table>
      <thead><tr><th>Ref</th><th>Scheduled</th><th>Released</th><th>From</th><th>To</th><th>Total</th><th></th></tr></thead>
      <tbody>${releasedRows}</tbody>
    </table></div></div>`:''}

    ${pending.length?`
    <div class="stmt-mb18">
      <div class="stmt-slbl">PENDING RELEASE</div>
      ${pendingCards}
    </div>`:''}

    ${canGenerate?`
    <div class="stmt-gen-row">
      <div class="stmt-gen-txt">Statements are auto-generated every Monday at 09:00 via cron. You can also generate one manually for current outstanding invoices.</div>
      <button class="btn btn-g btn-s stmt-gen-btn" data-action="generateStatement">Generate Now</button>
    </div>`:''}

    <div class="stmt-slbl">OUTSTANDING INVOICES</div>
    <div class="panel stmt-mb18"><div class="tw stmt-tbl-wrap"><table>
      <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Due</th><th>Status</th><th>Amount</th></tr></thead>
      <tbody>${outRowsLimited||'<tr><td colspan="6" class="tc-empty">No outstanding invoices</td></tr>'}</tbody>
    </table></div></div>
  `;
}

async function generateStatement(){
  const r=await api('POST','statements.php?action=generate');
  if(!r.success){toast(r.error||'Error generating statement','err');return;}
  toast(r.message||'Statement generated','ok');
  renderStatement();
}
async function downloadStatement(ref_id){
  const r=await api('GET',`statements.php?action=download&id=${encodeURIComponent(ref_id)}`);
  if(!r.success){toast(r.error||'Could not load statement','err');return;}
  const s=r.data;
  const rows=(s.invoices||[]).map(inv=>`<tr><td>${esc(inv.ref_id)}</td><td>${esc(inv.client_name)}</td><td>${esc(inv.invoice_date||'')}</td><td>${esc(inv.due_date||'')}</td><td>${esc(inv.status)}</td><td style="text-align:right">R ${Number(inv.amount).toLocaleString('en-ZA',{minimumFractionDigits:2})}</td></tr>`).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Statement ${esc(s.ref_id)}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1814}h1{font-size:22px;margin-bottom:4px}p{font-size:12px;color:#666;margin:2px 0}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}th{background:#f5f1ea;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #c8c1b3}td{padding:9px 12px;border-bottom:1px solid #e4ded2}.total{font-weight:700;font-size:15px;text-align:right;padding-top:12px}@media print{button{display:none}}</style>
</head><body>
<h1>Account Statement — ${esc(s.ref_id)}</h1>
<p>Released: ${esc(s.released_at?.slice(0,10)||'')} by ${esc(s.released_by||'')}</p>
<p>To: ${esc(s.to_emails||'')} | From: ${esc(s.from_email||'')}</p>
<table><thead><tr><th>Invoice #</th><th>Client</th><th>Invoice Date</th><th>Due Date</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="total">Total Outstanding: R ${Number(s.total_outstanding||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}</p>
<br><button onclick="window.print()">Print / Save as PDF</button>
</body></html>`;
  const blob=new Blob([html],{type:'text/html'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`Statement_${ref_id}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function openReleaseStatementModal(ref_id){
  const re=await api('GET','statements.php?action=email_options');
  if(!re.success){toast(re.error||'Could not load email options','err');return;}
  const fromOpts=re.from_options||[];
  const toOpts=re.to_options||[];

  const fromSel=fromOpts.map(u=>`<option value="${esc(u.email)}">${esc(u.name)} &lt;${esc(u.email)}&gt; (${esc(u.role)})</option>`).join('');
  const toSel=toOpts.map(u=>`<option value="${esc(u.email)}">${esc(u.name)} &lt;${esc(u.email)}&gt;</option>`).join('');

  openModal(`Release Statement — ${ref_id}`,`
    <div class="fs-12 mb-14">Review the FROM and TO addresses below. The statement will be emailed immediately when you click Release.</div>
    <div class="fgrid">
      <div class="fgroup ffull">
        <label class="flbl">From Address <span class="text-ember">*</span></label>
        <select class="finput" id="rs-from">${fromSel||'<option value="">No permitted email addresses found</option>'}</select>
        <div class="fs-10 text-muted mt-4">Only email addresses you are authorised to send from are shown.</div>
      </div>
      <div class="fgroup ffull">
        <label class="flbl">To Address <span class="text-ember">*</span></label>
        <select class="finput" id="rs-to">${toSel||'<option value="">No users found</option>'}</select>
        <div class="fs-10 text-muted mt-4">You may also type a custom address below.</div>
      </div>
      <div class="fgroup ffull">
        <label class="flbl">Additional Recipients (comma-separated)</label>
        <input class="finput" id="rs-extra" placeholder="extra@client.co.za, cc@firm.co.za">
      </div>
    </div>
    <div class="mt3 flex-end">
      <button class="btn btn-g mr-8" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p" data-action="releaseStatement" data-id="${esc(ref_id)}">Release &amp; Send Statement</button>
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
  const netPos=net>=0;
  document.getElementById('pl-rows').innerHTML=`
    <div class="pl-sec-lbl">Revenue</div>
    <div class="pl-row pl-row-val"><span>Paid Invoices</span><span class="font-mono">${fmt(rev)}</span></div>
    <div class="pl-sec-lbl">Expenses</div>
    ${proxyDB.bank.filter(b=>b.debit>0).map(b=>`<div class="pl-row pl-row-val"><span>${esc(b.desc)}</span><span class="font-mono text-ovr">(${fmt(b.debit)})</span></div>`).join('')||'<div class="pl-row-empty">No expenses recorded</div>'}
    <div class="pl-row pl-row-gross"><span>Operating Profit</span><span class="font-mono">${fmt(gross)}</span></div>
    <div class="pl-row pl-row-tax"><span>Tax (28%)</span><span class="font-mono text-muted">(${fmt(tax)})</span></div>
    <div class="pl-row pl-row-net ${netPos?'pl-net-pos':'pl-net-neg'}"><span>NET ${netPos?'PROFIT':'LOSS'}</span><span class="font-mono">${fmt(Math.abs(net))}</span></div>`;
  document.getElementById('pl-summary').innerHTML=`
    <div class="sumrow"><span>Revenue</span><span class="mono">${fmt(rev)}</span></div>
    <div class="sumrow"><span>Expenses</span><span class="mono">(${fmt(exp)})</span></div>
    <div class="sumrow tot"><span>Gross Profit</span><span class="mono">${fmt(gross)}</span></div>
    <div class="sumrow sm"><span>Tax @ 28%</span><span class="mono">(${fmt(tax)})</span></div>
    <div class="sumrow tot ${netPos?'text-ok':'text-ovr'}"><span>Net ${netPos?'Profit':'Loss'}</span><span class="mono">${fmt(Math.abs(net))}</span></div>`;
}

/* ═══════════════════════════════════════════════════════
   RECONCILIATION
═══════════════════════════════════════════════════════ */
function renderReconcile(){
  const txns = [...proxyDB.bank].sort((a,b)=>a.date.localeCompare(b.date));
  const totalCredits = txns.reduce((s,t)=>s+(t.credit||0),0);
  const totalDebits  = txns.reduce((s,t)=>s+(t.debit||0),0);
  const portalNet    = totalCredits - totalDebits;

  // Duplicate detection: same date + desc + credit + debit
  const seen = {};
  txns.forEach(t=>{
    const k=`${t.date}|${t.desc}|${t.credit||0}|${t.debit||0}`;
    seen[k]=(seen[k]||0)+1;
  });
  const dupeKeys = new Set(Object.keys(seen).filter(k=>seen[k]>1));

  // Category breakdown
  const byCat = {};
  txns.forEach(t=>{
    const c=t.cat||t.category||'Uncategorised';
    if(!byCat[c]) byCat[c]={cr:0,db:0};
    byCat[c].cr+=(t.credit||0);
    byCat[c].db+=(t.debit||0);
  });

  const savedExternal = parseFloat(localStorage.getItem('bf_recon_ext')||'0');

  document.getElementById('recon-content').innerHTML=`
    <div class="panel mb2">
      <div class="ph"><div class="ph-title">Statement Comparison</div></div>
      <div class="pb">
        <div class="fgrid" style="max-width:480px">
          <div class="fgroup ffull">
            <label class="flbl">External Statement Closing Balance (R)</label>
            <input type="number" class="finput" id="recon-ext" value="${savedExternal||''}" placeholder="Paste balance from your statement" step="0.01">
          </div>
        </div>
        <div id="recon-diff-box" class="mt2"></div>
      </div>
    </div>

    <div class="twocol mb2">
      <div class="panel">
        <div class="ph"><div class="ph-title">Portal Totals</div></div>
        <div class="pb">
          <div class="sumrow"><span>Total Credits</span><span class="mono text-ok">${fmt(totalCredits)}</span></div>
          <div class="sumrow"><span>Total Debits</span><span class="mono text-ovr">(${fmt(totalDebits)})</span></div>
          <div class="sumrow tot"><span>Net Balance</span><span class="mono">${fmt(portalNet)}</span></div>
          <div class="sumrow sm text-muted"><span>Transactions</span><span class="mono">${txns.length}</span></div>
          ${dupeKeys.size>0?`<div class="sumrow sm text-ovr"><span>⚠ Possible duplicates</span><span class="mono">${dupeKeys.size} group(s)</span></div>`:''}
        </div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Credits by Category</div></div>
        <div class="pb">
          ${Object.entries(byCat).sort((a,b)=>b[1].cr-a[1].cr).map(([cat,v])=>`
            <div class="sumrow"><span>${esc(cat)}</span><span class="mono ${v.cr>0?'text-ok':'text-ovr'}">${v.cr>0?fmt(v.cr):'('+fmt(v.db)+')'}</span></div>
          `).join('')||'<div class="pl-row-empty">No data</div>'}
        </div>
      </div>
    </div>

    ${dupeKeys.size>0?`
    <div class="panel mb2" style="border-top:2px solid var(--pill-ovr)">
      <div class="ph"><div class="ph-title">⚠ Possible Duplicate Transactions</div></div>
      <div class="pb">
        <table class="dtable">
          <thead><tr><th>Date</th><th>Description</th><th>Credit</th><th>Debit</th><th>Count</th></tr></thead>
          <tbody>${[...dupeKeys].map(k=>{const [date,desc,cr,db]=k.split('|');return`<tr>
            <td>${esc(date)}</td><td>${esc(desc)}</td>
            <td class="amt text-ok">${parseFloat(cr)>0?fmt(parseFloat(cr)):'-'}</td>
            <td class="amt text-ovr">${parseFloat(db)>0?fmt(parseFloat(db)):'-'}</td>
            <td style="color:var(--pill-ovr-txt);font-weight:bold">${seen[k]}×</td>
          </tr>`;}).join('')}</tbody>
        </table>
      </div>
    </div>`:''}

    <div class="panel">
      <div class="ph"><div class="ph-title">All Transactions — Running Balance</div></div>
      <div class="pb">
        <table class="dtable">
          <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Ref</th><th>Credit</th><th>Debit</th><th>Running Bal</th></tr></thead>
          <tbody>${(()=>{
            let run=0;
            return txns.map(t=>{
              run+=(t.credit||0)-(t.debit||0);
              const k=`${t.date}|${t.desc}|${t.credit||0}|${t.debit||0}`;
              const isDupe=dupeKeys.has(k);
              return`<tr ${isDupe?'style="background:rgba(244,67,54,.08)"':''}>
                <td class="nowrap">${fmtD(t.date)}</td>
                <td>${esc(t.desc)}${isDupe?' <span style="color:var(--pill-ovr-txt);font-size:10px">DUP</span>':''}</td>
                <td><span class="mlbl-9">${esc(t.cat||t.category||'')}</span></td>
                <td class="mono" style="font-size:11px">${esc(t.ref||'-')}</td>
                <td class="amt text-ok">${(t.credit||0)>0?fmt(t.credit):'-'}</td>
                <td class="amt text-ovr">${(t.debit||0)>0?fmt(t.debit):'-'}</td>
                <td class="amt ${run>=0?'text-ok':'text-ovr'}">${fmt(run)}</td>
              </tr>`;
            }).join('');
          })()}</tbody>
        </table>
      </div>
    </div>`;

  // Attach live diff calculator
  const extInput = document.getElementById('recon-ext');
  function calcDiff(){
    const ext = parseFloat(extInput.value)||0;
    localStorage.setItem('bf_recon_ext', ext);
    const diff = portalNet - ext;
    const box  = document.getElementById('recon-diff-box');
    if(!ext){ box.innerHTML=''; return; }
    const sign = diff>0?'+':'';
    const cls  = Math.abs(diff)<0.01?'text-ok':diff>0?'text-ovr':'text-amber';
    const msg  = Math.abs(diff)<0.01
      ? '✓ Portal matches statement exactly.'
      : diff>0
        ? `Portal is ${fmt(Math.abs(diff))} higher than statement — check for duplicate credits or unmatched debit entries.`
        : `Portal is ${fmt(Math.abs(diff))} lower than statement — check for missing payment entries.`;
    box.innerHTML=`<div class="sumbox" style="margin:0">
      <div class="sumrow"><span>External Statement</span><span class="mono">${fmt(ext)}</span></div>
      <div class="sumrow"><span>Portal Net Balance</span><span class="mono">${fmt(portalNet)}</span></div>
      <div class="sumrow tot ${cls}"><span>Difference (Portal − Statement)</span><span class="mono">${sign}${fmt(diff)}</span></div>
      <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">${msg}</div>
    </div>`;
  }
  extInput.addEventListener('input', calcDiff);
  if(savedExternal) calcDiff();
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
      <div class="tl-dot tl-dot-${e.type}"></div>
      <div class="tl-date">${fmtD(e.date)}</div>
      <div class="tl-content"><div class="tl-title">${esc(e.title)}</div><div class="tl-sub">${esc(e.sub)}</div></div>
    </div>`).join(''):'<div class="stmt-loading">No activity yet</div>';
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
    <label class="pay-inv-row">
      <input type="checkbox" name="pay-sel" value="${esc(inv.id)}" data-amount="${inv.amount}" class="pay-inv-cb">
      <span class="pay-inv-info fs-12"><span class="mono">${esc(inv.id)}</span>${inv.po?'  —  PO: '+esc(inv.po):''}</span>
      <span class="amt">${fmt(inv.amount)}</span>
      <span>${pillH(inv.status)}</span>
    </label>`).join(''):'<div class="pay-inv-empty">No outstanding invoices</div>';
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
    </div>`).join(''):'<div class="stmt-loading">No audit records</div>';
}
function filterAudit(v){ renderAudit(v); }

/* ═══════════════════════════════════════════════════════
   USERS TABLE
═══════════════════════════════════════════════════════ */
function renderUsers(){
  const matrix = {
    sysadmin:      {create:'✓',status:'✓',po:'✓',finance:'✓',quote:'✓',approve:'✓',admin:'✓'},
    admin:         {create:'✓',status:'✓',po:'✓',finance:'✓',quote:'✓',approve:'✓',admin:'-'},
    manager:       {create:'✓',status:'✓',po:'✓',finance:'✓',quote:'✓',approve:'✓',admin:'-'},
    call_logger:   {create:'✓',status:'✓',po:'-',finance:'-',quote:'-',approve:'-',admin:'-'},
    junior_tech:   {create:'-',status:'✓',po:'-',finance:'-',quote:'-',approve:'-',admin:'-'},
    senior_tech:   {create:'-',status:'✓',po:'-',finance:'-',quote:'Submit',approve:'-',admin:'-'},
    client_support:{create:'✓',status:'-',po:'-',finance:'View',quote:'-',approve:'-',admin:'-'},
    admin_clerk:   {create:'-',status:'✓',po:'✓',finance:'✓',quote:'-',approve:'-',admin:'-'},
    viewer:        {create:'-',status:'-',po:'-',finance:'View',quote:'-',approve:'-',admin:'-'},
  };
  const tick=(v)=>v==='✓'?`<span class="text-ok">✓</span>`:v==='-'?`<span class="text-muted">-</span>`:`<span class="text-warn fs-10">${v}</span>`;
  const bar = document.getElementById('users-create-bar');
  if (bar) bar.style.display = can('user.create') ? 'block' : 'none';
  const canEdit = can('user.update');
  const thActions = document.getElementById('users-th-actions');
  if (thActions) thActions.style.display = canEdit ? 'table-cell' : 'none';
  document.getElementById('users-table-body').innerHTML=proxyDB.users.map(u=>{
    const m=matrix[u.role]||{create:'-',status:'-',po:'-',finance:'-',quote:'-',approve:'-',admin:'-'};
    const actionCell = canEdit ? `<td>
      <button class="btn btn-g btn-xs" data-action="openEditUserModal" data-id="${u.id}">Edit</button>
      ${u.active!=0 ? `<button class="btn btn-d btn-xs" data-action="toggleUserActive" data-id="${u.id}" data-active="0">Disable</button>` : `<button class="btn btn-xs btn-enable" data-action="toggleUserActive" data-id="${u.id}" data-active="1">Enable</button>`}
    </td>` : '';
    return`<tr${u.active==0?' class="row-inactive"':''}>
      <td class="mono">${esc(u.username)}</td>
      <td>${esc(u.name)}</td>
      <td>${rolePill(u.role)}</td>
      <td class="perm-col text-center">${tick(m.create)}</td>
      <td class="perm-col text-center">${tick(m.status)}</td>
      <td class="perm-col text-center">${tick(m.po)}</td>
      <td class="perm-col text-center">${tick(m.finance)}</td>
      <td class="perm-col text-center">${tick(m.quote)}</td>
      <td class="perm-col text-center">${tick(m.approve)}</td>
      <td class="perm-col text-center">${m.admin==='✓'?`<span class="text-ember fw-700">★</span>`:`<span class="text-muted">-</span>`}</td>
      ${actionCell}
    </tr>`;
  }).join('');
}

function togglePermCols(){
  const table = document.getElementById('users-rbac-table');
  const btn   = document.getElementById('perm-cols-btn');
  if (!table || !btn) return;
  const collapsed = table.classList.toggle('perms-collapsed');
  btn.textContent = collapsed ? '► Expand Permissions' : '◄ Collapse Permissions';
}

function openCreateUserModal(){
  if (!can('user.create')) return;
  const roles = ['admin','manager','call_logger','junior_tech','senior_tech','client_support','admin_clerk','viewer'];
  if (SESSION?.role === 'sysadmin') roles.unshift('sysadmin');
  const opts = roles.map(r=>`<option value="${r}">${r==='sysadmin'?'System Administrator':r.replace(/_/g,' ')}</option>`).join('');
  openModal('New User', `
    <div class="login-group"><label class="login-label">Username</label><input class="login-input" id="nu-user" placeholder="username"></div>
    <div class="login-group"><label class="login-label">Full Name</label><input class="login-input" id="nu-name" placeholder="First Last"></div>
    <div class="login-group"><label class="login-label">Email</label><input class="login-input" type="email" id="nu-email" placeholder="user@example.com"></div>
    <div class="login-group"><label class="login-label">Title / Position</label><input class="login-input" id="nu-title" placeholder="e.g. Field Technician"></div>
    <div class="login-group"><label class="login-label">Role</label><select class="login-input" id="nu-role">${opts}</select></div>
    <div class="login-group"><label class="login-label">Password</label><input class="login-input" type="password" id="nu-pass" placeholder="min 8 characters"></div>
    <button class="btn-login-submit mt-8" data-action="saveNewUser">Create User</button>
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

function openEditUserModal(id) {
  if (!can('user.update')) return;
  const u = (DB.users || []).find(x => x.id === id);
  if (!u) return;
  const roles = ['admin','manager','call_logger','junior_tech','senior_tech','client_support','admin_clerk','viewer'];
  if (SESSION?.role === 'sysadmin') roles.unshift('sysadmin');
  const opts = roles.map(r=>`<option value="${r}"${r===u.role?' selected':''}>${r==='sysadmin'?'System Administrator':r.replace(/_/g,' ')}</option>`).join('');
  openModal(`Edit User — ${esc(u.username)}`, `
    <input type="hidden" id="eu-id" value="${u.id}">
    <div class="login-group"><label class="login-label">Username</label><input class="login-input" value="${esc(u.username)}" readonly class="login-input inp-readonly"></div>
    <div class="login-group"><label class="login-label">Full Name</label><input class="login-input" id="eu-name" value="${esc(u.name)}" placeholder="First Last"></div>
    <div class="login-group"><label class="login-label">Title / Position</label><input class="login-input" id="eu-title" value="${esc(u.title||'')}" placeholder="e.g. Field Technician"></div>
    <div class="login-group"><label class="login-label">Role</label><select class="login-input" id="eu-role">${opts}</select></div>
    <div class="login-group"><label class="login-label">New Password <span class="pass-hint">(leave blank to keep)</span></label><input class="login-input" type="password" id="eu-pass" placeholder="min 8 characters"></div>
    <button class="btn-login-submit mt-8" data-action="saveEditUser">Save Changes</button>
  `);
}

async function saveEditUser() {
  const id    = parseInt(document.getElementById('eu-id')?.value) || 0;
  const name  = document.getElementById('eu-name')?.value?.trim();
  const title = document.getElementById('eu-title')?.value?.trim();
  const role  = document.getElementById('eu-role')?.value;
  const pass  = document.getElementById('eu-pass')?.value;
  if (!id || !name) { toast('Name is required', 'err'); return; }
  if (pass && pass.length < 8) { toast('Password must be at least 8 characters', 'err'); return; }
  const payload = { name, title, role };
  if (pass) payload.password = pass;
  const r = await api('PUT', `users.php?id=${id}`, payload);
  if (!r.success) { toast(r.error || 'Error saving user', 'err'); return; }
  closeModalDirect();
  await refreshUsers();
  renderUsers();
  toast('User updated', 'ok');
}

async function toggleUserActive(id, active) {
  if (!can('user.update')) return;
  const u = (DB.users || []).find(x => x.id === id);
  const label = active ? 'enable' : 'disable';
  if (!confirm(`${active?'Enable':'Disable'} user ${u?.username || id}?`)) return;
  const r = await api('PUT', `users.php?id=${id}`, { active: active ? 1 : 0 });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshUsers();
  renderUsers();
  toast(`User ${label}d`, 'ok');
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD EDITOR
═══════════════════════════════════════════════════════ */
function showDashEditor(){
  const prefs   = getDashPrefs();
  const widgets = DASH_WIDGETS.filter(w=>!w.perm||can(w.perm));
  const rows    = widgets.map(w=>{
    const on=prefs[w.id]!==false;
    return `<label class="dash-widget-toggle">
      <div class="dwt-info">
        <div class="dwt-label">${esc(w.label)}</div>
        <div class="dwt-desc">${esc(w.desc)}</div>
      </div>
      <div class="dwt-switch">
        <input type="checkbox" id="dw-${w.id}"${on?' checked':''}>
        <span class="dwt-track"></span>
      </div>
    </label>`;
  }).join('');

  openModal('Edit Dashboard Layout',`
    <p class="dash-editor-hint">Choose which sections appear on your dashboard. Changes apply to your account only and persist across sessions.</p>
    <div class="dash-editor-list">
      ${rows||'<p class="text-muted text-center p-20">No widgets available for your role.</p>'}
    </div>
    <div class="flex-end gap-10 mt-18">
      <button class="btn btn-g btn-s" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p btn-s" data-action="saveDashEditorPrefs">Save Layout</button>
    </div>`);
}

function saveDashEditorPrefs(){
  const prefs=getDashPrefs();
  DASH_WIDGETS.forEach(w=>{
    const cb=document.getElementById('dw-'+w.id);
    if(cb) prefs[w.id]=cb.checked;
  });
  saveDashPrefs(prefs);
  closeModalDirect();
  renderDashboard();
  if(isWidgetOn('w-compliance')&&can('safety.view')) safLoadDashCompliance();
  toast('Dashboard layout saved','ok');
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
  // Restore info mode button state on load
  if(INFO_MODE){
    document.documentElement.dataset.info='on';
    const btn=document.getElementById('info-mode-btn');
    if(btn) btn.classList.add('active');
  }
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
    document.getElementById('newpass-panel').style.display = 'block';
    return;
  }
  // Restore session on page reload — skip probe (and its 401) when no session hint cookie exists
  const hasHint = document.cookie.split(';').some(c => c.trim().startsWith('bf_session_hint='));
  const me = hasHint ? await api('GET','auth.php?action=me') : { success: false };
  if(me.success && me.user){
    SESSION = me.user;
    buildNav();
    document.getElementById('ptb-user').textContent = SESSION.name;
    document.documentElement.dataset.state = 'portal';
    document.getElementById('dash-sub').textContent = `AECI CHEMPARK  -  ${(ROLE_LABELS[SESSION.role]||SESSION.role).toUpperCase()} VIEW`;
    await refreshAll();
    const firstPage = {
      call_logger:'p-new-callout', junior_tech:'p-callouts',
      senior_tech:'p-callouts', client_support:'p-dashboard', admin_clerk:'p-callouts',
      safety_officer:'p-safety',
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
  const nbSaf=document.getElementById('nb-saf');
  if(nbSaf) nbSaf.textContent=typeof safBadgeCount==='function'?safBadgeCount()||'':'';
}

/* ── Override: saveCallout ───────────────────────────── */
async function saveCallout(){
  const clientId = parseInt(document.getElementById('nc-client')?.value) || 0;
  const service = document.getElementById('nc-service')?.value?.trim();
  const location = document.getElementById('nc-location')?.value?.trim() || '';
  const priority = document.getElementById('nc-priority')?.value || 'Normal';
  const tech = document.getElementById('nc-tech')?.value?.trim() || '';
  const assignedTo = document.getElementById('nc-assign')?.value?.trim() || '';
  const notes = document.getElementById('nc-notes')?.value?.trim() || '';
  const calloutTime = document.getElementById('nc-time')?.value || '08:00';
  const po = document.getElementById('nc-po')?.value?.trim() || '';

  if (!clientId) { toast('Please select a client', 'err'); return; }
  if (!service) { toast('Please fill in the service field', 'err'); return; }

  const r = await api('POST', 'callouts.php', {
    client_id: clientId,
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
  const clientId = parseInt(document.getElementById('nq-client')?.value) || 0;
  const validUntil = document.getElementById('nq-valid')?.value;
  const notes = document.getElementById('nq-notes')?.value?.trim() || '';

  if (!clientId) { toast('Please select a client', 'err'); return; }

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

  const calloutRef = document.getElementById('nq-callout-ref')?.value || '';
  const r = await api('POST', 'quotes.php', { client_id: clientId, items, valid_until: validUntil, notes, callout_ref: calloutRef });
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
  const payload = {
    amount: Math.round(total*100)/100,
    due_date: localDateStr(due),
    status: 'Draft',
    quote_ref: id,
  };
  if (q.clientId) payload.client_id = q.clientId;
  else payload.client_name = q.client;
  const r = await api('POST', 'invoices.php', payload);
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
  const clientId   = parseInt(document.getElementById('ni-client')?.value) || 0;
  const amount     = parseFloat(document.getElementById('ni-amount')?.value) || 0;
  const dueDate    = document.getElementById('ni-due')?.value;
  const status     = document.getElementById('ni-status')?.value || 'Draft';
  const po         = document.getElementById('ni-po')?.value?.trim() || '';
  const quoteRef   = document.getElementById('ni-quote-ref')?.value || '';
  const calloutRef = document.getElementById('ni-callout-ref')?.value || '';

  if (!clientId) { toast('Please select a client', 'err'); return; }
  if (!amount || !dueDate) { toast('Fill in amount and due date', 'err'); return; }

  const r = await api('POST', 'invoices.php', { client_id: clientId, amount, due_date: dueDate, status, po, quote_ref: quoteRef, callout_ref: calloutRef });
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




/* ═══════════════════════════════════════════════════════
   CLIENTS MODULE
═══════════════════════════════════════════════════════ */

function renderClients(search = '') {
  const tbody = document.getElementById('clients-table');
  if (!tbody) return;
  let rows = [...(DB.clients || [])];
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(c =>
      (c.name||'').toLowerCase().includes(q) ||
      (c.email||'').toLowerCase().includes(q) ||
      (c.contact_person||'').toLowerCase().includes(q)
    );
  }
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="tbl-empty-cell">No clients found</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.phone)}</td>
      <td>${esc(c.contact_person)}</td>
      <td>${esc(c.vat_number)}</td>
      <td><span class="badge badge-${c.is_active ? 'ok' : 'grey'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn btn-g btn-xs" data-action="openClientModal" data-id="${c.id}">Edit</button>
        ${c.is_active ? `<button class="btn btn-d btn-xs" data-action="deactivateClient" data-id="${c.id}">Deactivate</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function openClientModal(id) {
  const modal = document.getElementById('client-modal');
  if (!modal) return;
  document.getElementById('cm-id').value = id || '';
  document.getElementById('client-modal-title').textContent = id ? 'Edit Client' : 'Add Client';
  if (id) {
    const c = (DB.clients || []).find(x => x.id === id);
    if (c) {
      document.getElementById('cm-name').value            = c.name || '';
      document.getElementById('cm-email').value           = c.email || '';
      document.getElementById('cm-phone').value           = c.phone || '';
      document.getElementById('cm-vat').value             = c.vat_number || '';
      document.getElementById('cm-address').value         = c.address || '';
      document.getElementById('cm-contact').value         = c.contact_person || '';
      document.getElementById('cm-contact-details').value = c.contact_details || '';
      document.getElementById('cm-notes').value           = c.notes || '';
    }
  } else {
    ['cm-name','cm-email','cm-phone','cm-vat','cm-address','cm-contact','cm-contact-details','cm-notes']
      .forEach(f => { const el = document.getElementById(f); if (el) el.value = ''; });
  }
  modal.style.display = 'flex';
}

function closeClientModal() {
  const modal = document.getElementById('client-modal');
  if (modal) modal.style.display = 'none';
}

async function saveClient() {
  const id   = parseInt(document.getElementById('cm-id')?.value) || 0;
  const name = document.getElementById('cm-name')?.value?.trim();
  if (!name) { toast('Client name is required', 'err'); return; }

  const payload = {
    name,
    email:           document.getElementById('cm-email')?.value?.trim()           || '',
    phone:           document.getElementById('cm-phone')?.value?.trim()           || '',
    vat_number:      document.getElementById('cm-vat')?.value?.trim()             || '',
    address:         document.getElementById('cm-address')?.value?.trim()         || '',
    contact_person:  document.getElementById('cm-contact')?.value?.trim()         || '',
    contact_details: document.getElementById('cm-contact-details')?.value?.trim() || '',
    notes:           document.getElementById('cm-notes')?.value?.trim()           || '',
  };

  const r = id
    ? await api('PUT', `clients.php?id=${id}`, payload)
    : await api('POST', 'clients.php', payload);

  if (!r.success) { toast(r.error || 'Error saving client', 'err'); return; }
  closeClientModal();
  await refreshClients();
  renderClients('');
  toast(id ? 'Client updated' : `Client ${name} added`, 'ok');
}

async function deactivateClient(id) {
  if (!confirm('Deactivate this client? They will be removed from dropdowns.')) return;
  const r = await api('DELETE', `clients.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshClients();
  renderClients('');
  toast('Client deactivated');
}

/* ── Back to Top Functionality ──────────────────────── */
const backToTopBtn = document.getElementById('back-to-top');

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (backToTopBtn) {
  backToTopBtn.innerHTML = '↑';
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });
}

/* ═══════════════════════════════════════════════════════
   ■ SAFETY FILES MODULE  (BF-SHE-FRM-010 Rev 01)
═══════════════════════════════════════════════════════ */

const SAFETY_SECTIONS = [
  { key:'A', title:'Section A — Agreement', items:[
    {no:1,  ref:'Optional',               criteria:'Proof of valid/current SHE Management System (e.g. NOSA Grading, ISO Certification, etc.)'},
    {no:2,  ref:'Sec 37.2',               criteria:'Written contract (SLA or 37.2 agreement) between AST & Contractor'},
    {no:3,  ref:'CR5',                    criteria:'AST representative must appoint every principal contractor in writing for the project or part thereof on the construction site. Check if the letter is in the file.'},
    {no:4,  ref:'COIDA Sec.89 / CR5(1)j', criteria:'Letter of Good Standing (include Registration No.) including signed WCL 2 form.'},
    {no:5,  ref:'Construction reg 3(1)',  criteria:'Construction work permit — work exceeds 180 days; or involves more than 1800 person days; or contract value ≥ R13M / CIDB grading level 6.'},
    {no:6,  ref:'CR 4(1)',                criteria:'Notification of Construction Work'},
    {no:7,  ref:'AECI',                   criteria:'Public Liability Insurance'},
    {no:8,  ref:'Section 7 OHS Act',      criteria:'Health and Safety or EHS Policies'},
    {no:9,  ref:'AECI — Accountability',  criteria:'Company Organogram & Onsite employees Organogram'},
  ]},
  { key:'B', title:'Section B — Risk Management', items:[
    {no:1, ref:'CR 9(1)',    criteria:'List of all main activities to be performed according to the scope of work.'},
    {no:2, ref:'CR 9(1)',    criteria:'Risk Register — Task Specific Risk Assessments (include list of tasks)'},
    {no:3, ref:'CR 5(1)',    criteria:'Baseline Risk Assessment'},
    {no:4, ref:'AECI',       criteria:'Continuous Risk Assessments'},
    {no:5, ref:'CR 9(1)e',   criteria:'Risk Review Plan'},
    {no:6, ref:'CR 9(1)c',   criteria:"Safe Work/Operating Procedures (include list of all SOPs)"},
    {no:7, ref:'Haz. Chem.', criteria:'Safety Data Sheets for any material to be used onsite'},
  ]},
  { key:'C', title:'Section C — Medical Fitness', items:[
    {no:1, ref:'CR 7(1)(g)', criteria:'Employees have a valid medical certificate of fitness specific to the construction work (Annexure 3).'},
    {no:2, ref:'',           criteria:'Drug & Alcohol Policy. Arrangements for random testing. Arrangements for return to work after sickness/injury assessment.'},
  ]},
  { key:'D', title:'Section D — Employees, Training, Competency & Induction', items:[
    {no:1, ref:'',           criteria:'Proof of Company Induction'},
    {no:2, ref:'',           criteria:'Training Matrix'},
    {no:3, ref:'',           criteria:'Competency records as per Matrix'},
    {no:4, ref:'CR 29(j)',   criteria:'List of workers trained in the use of fire-extinguishing equipment'},
    {no:5, ref:'CR 10(2)c',  criteria:'Programme for training of employees working from a fall risk position and records thereof'},
    {no:6, ref:'',           criteria:'Proof of AECI or site-specific Induction (before commencing work)'},
  ]},
  { key:'E', title:'Section E — Operations (SHE Plan, FPP, Environmental, Incident & PPE)', items:[
    {no:1,  ref:'CR 7(1)(a)', criteria:'Documented Health & Safety plan based on scope of work. AST to provide site-specific H&S specification.'},
    {no:2,  ref:'',           criteria:'Documented Environmental Management Plan covering applicable aspects (waste, HCS, monitoring, etc.).'},
    {no:3,  ref:'CR 10(1)a',  criteria:'Documented Fall Protection Plan (by trained Fall Protection Planner) based on scope of work.'},
    {no:4,  ref:'CR 10(1)b',  criteria:'Fall Protection Risk Assessment of all work from fall risk positions with procedures and methods per location.'},
    {no:5,  ref:'',           criteria:'Documented Contractor Management Procedure (managing subcontractors). Principal contractor to provide relevant H&S specs to subcontractors.'},
    {no:6,  ref:'',           criteria:'Principal contractor to provide proof of SHE file requirements by all sub-contractors.'},
    {no:7,  ref:'',           criteria:'Documented Incident Management Procedure.'},
    {no:8,  ref:'',           criteria:'24 months of Incident Statistics.'},
    {no:9,  ref:'',           criteria:'Documented PPE Management Procedure.'},
    {no:10, ref:'',           criteria:'Proof of training on PPE management (limitations, use and care of).'},
    {no:11, ref:'',           criteria:'Proof of PPE issued.'},
    {no:12, ref:'',           criteria:'Proof of inspections conducted on PPE.'},
  ]},
  { key:'F', title:'Section F — Control & Maintenance of Equipment', items:[
    {no:1, ref:'', criteria:"Equipment Register (Vehicles/LDVs, trucks, Cranes, etc.)"},
    {no:2, ref:'', criteria:'Statutory & Mandatory scheduled inspections.'},
    {no:3, ref:'', criteria:'Maintenance Records'},
  ]},
  { key:'G', title:'Section G — Emergency Preparedness', items:[
    {no:1, ref:'CR 29(i)(i-iii)', criteria:'Documented Emergency Preparedness Procedure and proof of training.'},
    {no:2, ref:'GSR 3',           criteria:'Emergency drill schedule & proof of drills conducted.'},
    {no:3, ref:'',                criteria:'Proof of emergency equipment (fire extinguishers if own), use, inspection & maintenance thereof.'},
  ]},
  { key:'H', title:'Section H — Legal Appointments', items:[
    {no:1,  ref:'Sec 16.2',    criteria:'Manager'},
    {no:2,  ref:'Sec 8',       criteria:'General Supervision'},
    {no:3,  ref:'Sec 17',      criteria:'SHE Representative (more than 20 employees) — NB Training required'},
    {no:4,  ref:'Sec 19',      criteria:'SHE Committee Chairman (two or more H&S representatives designated)'},
    {no:5,  ref:'Sec 19.3',    criteria:'SHE Committee Member (two or more H&S representatives designated)'},
    {no:6,  ref:'CR8(6)',      criteria:'Construction Health & Safety Officer (registered with statutory body)'},
    {no:7,  ref:'CR8(1)',      criteria:'Construction Manager'},
    {no:8,  ref:'CR8(2)',      criteria:'Assistant Construction Manager (in absence of Construction Manager)'},
    {no:9,  ref:'CR8(7)',      criteria:'Construction Supervisor'},
    {no:10, ref:'CR8(8)',      criteria:'Assistant Construction Supervisor'},
    {no:11, ref:'CR9(1)',      criteria:'Risk Assessor'},
    {no:12, ref:'CR10(1)',     criteria:'Fall Protection Planner'},
    {no:13, ref:'CR11(1)',     criteria:'Structure Inspector'},
    {no:14, ref:'CR12(1)',     criteria:'Temporary Works Designer'},
    {no:15, ref:'CR12(2)',     criteria:'Temporary Works Supervisor'},
    {no:16, ref:'CR13(1)a',    criteria:'Excavation Supervisor'},
    {no:17, ref:'CR14(1)',     criteria:'Demolition Supervisor'},
    {no:18, ref:'CR16(1)',     criteria:'Scaffolding Supervisor'},
    {no:19, ref:'CR17(1)',     criteria:'Suspended Platform Supervisor'},
    {no:20, ref:'CR17(2)(ii)', criteria:'Suspended Platform Erectors, Operators and Inspector Competency'},
    {no:21, ref:'CR18(1)',     criteria:'Rope Access Supervisor'},
    {no:22, ref:'CR19(6)',     criteria:'Material Hoist Operator'},
    {no:23, ref:'CR19(8)(a)',  criteria:'Material Hoist Inspector'},
    {no:24, ref:'CR20(1)',     criteria:'Bulk Mixing Plant Supervisor'},
    {no:25, ref:'CR20(2)',     criteria:'Bulk Mixing Plant Operator'},
    {no:26, ref:'CR21(1)(b)',  criteria:'Explosive Actuated Tool Operator'},
    {no:27, ref:'CR21(2)(b)',  criteria:'Explosive Actuated Tool Inspector'},
    {no:28, ref:'CR21(2)(i)',  criteria:'Explosive Actuated Tool Controller'},
    {no:29, ref:'CR23(K)',     criteria:'Construction Vehicle Operator / Inspector'},
    {no:30, ref:'CR28(a)',     criteria:'Stacking and Storage Supervisor'},
    {no:31, ref:'CR29(h)',     criteria:'Fire Equipment Inspector'},
    {no:32, ref:'GAR9(2)',     criteria:'Incident Investigator'},
    {no:33, ref:'GSR3(1)&(4)', criteria:'First Aider'},
    {no:34, ref:'',            criteria:'Radiation Protection Officer'},
  ]},
  { key:'I', title:'Section I — Advanced & Best Practice (Bonus +10%)', bonus:true, items:[
    {no:1,  ref:'ISO 45001:2018',  criteria:'ISO 45001:2018 / OHSAS 18001 or NOSA Grade A Certification currently in place.'},
    {no:2,  ref:'OHS Act Sec 17',  criteria:'Weekly Toolbox Talk register with signed attendance sheet, topics recorded, and filed.'},
    {no:3,  ref:'GAR 9',           criteria:'Near Miss Reporting Register with investigation close-out and trend analysis report.'},
    {no:4,  ref:'Best Practice',   criteria:'Behavioral-Based Safety (BBS) Observation Programme with recorded observations and feedback loop.'},
    {no:5,  ref:'Best Practice',   criteria:'Employee Assistance Programme (EAP) in place and communicated to all workers on site.'},
    {no:6,  ref:'NEMA',            criteria:'Environmental Legal Register listing applicable legislation, reviewed and updated annually.'},
    {no:7,  ref:'NEMA / NEMWA',    criteria:'Hazardous Waste Disposal Records and consignment notes / manifests for all hazardous waste streams.'},
    {no:8,  ref:'Best Practice',   criteria:'Digital / Electronic Safety Record-Keeping system in active use for all SHE documentation.'},
    {no:9,  ref:'OMP Reg.',        criteria:'Occupational Health Surveillance Programme — baseline and periodic medical surveillance records.'},
    {no:10, ref:'Best Practice',   criteria:'Monthly Safety Performance Report issued to management (LTIFR, TRIR, near misses, training hours).'},
  ]},
];

/* ── Safety: data model helpers ──────────────────────── */

function safNextId(){
  if(!DB.safetyFiles) DB.safetyFiles=[];
  const nums=DB.safetyFiles.map(f=>parseInt((f.ref_id||f.id||'').replace(/^SAF-\d{6}-/,''))||0);
  const n=nums.length?Math.max(...nums)+1:1;
  return 'SAF-'+String(n).padStart(3,'0'); // temp local ID before API assigns real ref
}

function safBlankFile(id){
  const sections = {};
  SAFETY_SECTIONS.forEach(sec=>{
    sections[sec.key] = sec.items.map(item=>({
      no: item.no, result: null, appointee: '', comments: '', uploads: [],
    }));
  });
  return {
    id, contractor:'', contractorRep:'', appointee162:'',
    auditDate: localDateStr(), region:'', auditTeam:'', scopeOfWork:'',
    manpower:0, supervisors:0, sheReps:0, firstAiders:0,
    sections, status:'Draft', auditorName:'', signOffDate:'',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    policyEmailSent: false, policyEmailDate: null,
  };
}

function safCalcScore(file){
  let total=0, na=0, std=0, filled=0;
  let bTotal=0, bNa=0, bStd=0, bFilled=0;
  SAFETY_SECTIONS.forEach(sec=>{
    (file.sections[sec.key]||[]).forEach(item=>{
      if(sec.bonus){
        bTotal++;
        if(item.result) bFilled++;
        if(item.result==='N/A') bNa++; else if(item.result==='To Standard') bStd++;
      } else {
        total++;
        if(item.result) filled++;
        if(item.result==='N/A') na++; else if(item.result==='To Standard') std++;
      }
    });
  });
  const applicable  = total  - na;
  const bApplicable = bTotal - bNa;
  const mainScore   = applicable  ? (std  / applicable)  * 100 : null;
  const bonusScore  = bApplicable ? (bStd / bApplicable) * 10  : 0;
  const score = mainScore !== null ? mainScore + bonusScore : null;
  const notStd  = applicable  - std;
  const bNotStd = bApplicable - bStd;
  // Completion: items with any result filled in (N/A counts as assessed; blank = not yet rated)
  const allTotal  = total + bTotal;
  const allFilled = filled + bFilled;
  const completionPct = allTotal ? Math.round(allFilled / allTotal * 100) : 0;
  return { score, mainScore, bonusScore, total: total+bTotal, na: na+bNa, std: std+bStd, notStd: notStd+bNotStd, bApplicable, bStd, bNotStd, allTotal, allFilled, completionPct };
}

function safBand(score){
  if(score===null) return { label:'Not scored', cls:'saf-unscored', color:'#64748b', actionDays:null };
  if(score>=90)    return { label:'Green — Complying', cls:'saf-green', color:'#22c55e', actionDays:null };
  if(score>=75)    return { label:'Yellow — Minor concerns', cls:'saf-yellow', color:'#eab308', actionDays:7, note:'Action plan required within 7 working days.' };
  if(score>=51)    return { label:'Orange — Not complying', cls:'saf-orange', color:'#f97316', actionDays:7, note:'Action plan required within 7 calendar days. Re-assessment required.' };
  return              { label:'Red — Critical', cls:'saf-red', color:'#ef4444', actionDays:14, note:'Action plan within 14 working days. Re-assessment within 45 working days.' };
}

/* ── Safety: audit form ──────────────────────────────── */

function safCurrentId(){
  return document.getElementById('saf-current-id')?.value || null;
}

function safEnsureIdField(){
  if(!document.getElementById('saf-current-id')){
    const inp = document.createElement('input');
    inp.type='hidden'; inp.id='saf-current-id'; inp.value='';
    document.getElementById('safety-sections')?.appendChild(inp);
  }
}

function safBuildSections(){
  const wrap = document.getElementById('safety-sections');
  if(!wrap) return;
  safEnsureIdField();
  const fileId = safCurrentId();
  const file = fileId && fileId!=='null' ? proxyDB.safetyFiles.find(f=>f.id===fileId) : null;
  let html = '';
  SAFETY_SECTIONS.forEach(sec=>{
    const saved = file ? (file.sections[sec.key]||[]) : [];
    const pct = (() => {
      let t=0,n=0,s=0;
      saved.forEach(i=>{ t++; if(i.result==='N/A') n++; else if(i.result==='To Standard') s++; });
      const a=t-n; return a?Math.round(s/a*100):null;
    })();
    const pctLabel = `<span class="saf-sec-pct${pct!==null?' '+safBand(pct).cls:''}" id="saf-sec-hdr-pct-${sec.key}">${pct!==null?pct+'%':''}</span>`;
    html += `<div class="panel mt2 saf-section-panel${sec.bonus?' saf-section-bonus':''}" data-sec="${sec.key}">
      <div class="ph saf-sec-hdr${sec.bonus?' saf-sec-hdr-bonus':''}" data-action="safToggleSection" data-section-key="${sec.key}">
        <div class="ph-title">${esc(sec.title)}</div>
        <div class="saf-sec-hdr-right">
          ${pctLabel}
          <button class="btn btn-g btn-xs saf-sec-save-btn" id="saf-sec-save-${sec.key}"
                  data-action="safSaveSection" data-section-key="${sec.key}"
                  title="Save this section only">Save</button>
          <span class="saf-toggle" id="saf-tog-${sec.key}">&#9660;</span>
        </div>
      </div>
      <div class="saf-sec-body" id="saf-sec-${sec.key}">
        <div class="tw saf-criteria-wrap">
          <table class="saf-criteria-tbl">
            <thead><tr>
              <th class="col-num">#</th>
              <th class="col-ref">Ref</th>
              <th>Criteria</th>
              <th class="col-na">N/A</th>
              <th class="col-nts">Not to Std</th>
              <th class="col-ts">To Std</th>
              ${sec.key==='H'?'<th class="col-apo">Appointee</th>':''}
              <th class="col-cmt">Comments / Findings</th>
              <th class="col-docs">Docs</th>
            </tr></thead>
            <tbody>`;
    sec.items.forEach((item,idx)=>{
      const s = saved[idx] || {};
      const rNA  = s.result==='N/A'             ? 'checked' : '';
      const rNot = s.result==='Not to Standard' ? 'checked' : '';
      const rStd = s.result==='To Standard'     ? 'checked' : '';
      const apo  = esc(s.appointee||'');
      const cmt  = esc(s.comments||'');
      const upCount = (s.uploads||[]).length;
      const rowCls = s.result==='N/A'?'saf-row-na':s.result==='Not to Standard'?'saf-row-nts':s.result==='To Standard'?'saf-row-ts':'';
      html += `<tr class="saf-item-row ${rowCls}" data-sec="${sec.key}" data-idx="${idx}">
        <td class="saf-no">${item.no}</td>
        <td class="saf-ref">${esc(item.ref||'')}</td>
        <td class="saf-crit">${esc(item.criteria)}</td>
        <td class="saf-radio-cell"><label class="saf-radio-lbl"><input type="radio" name="saf_${sec.key}_${idx}" value="N/A" ${rNA} data-action="safItemChanged" data-section-key="${sec.key}" data-item-idx="${idx}"> N/A</label></td>
        <td class="saf-radio-cell saf-nts"><label class="saf-radio-lbl"><input type="radio" name="saf_${sec.key}_${idx}" value="Not to Standard" ${rNot} data-action="safItemChanged" data-section-key="${sec.key}" data-item-idx="${idx}"> NTS</label></td>
        <td class="saf-radio-cell saf-ts"><label class="saf-radio-lbl"><input type="radio" name="saf_${sec.key}_${idx}" value="To Standard" ${rStd} data-action="safItemChanged" data-section-key="${sec.key}" data-item-idx="${idx}"> TS</label></td>
        ${sec.key==='H'?`<td><input class="finput finput-sm" placeholder="Name" value="${apo}" data-action="safAppointeeChanged" data-section-key="${sec.key}" data-item-idx="${idx}"></td>`:''}
        <td><textarea class="finput finput-sm saf-cmt" rows="1" placeholder="Findings..." data-action="safCommentChanged" data-section-key="${sec.key}" data-item-idx="${idx}">${cmt}</textarea></td>
        <td class="saf-upload-cell">${_safUploadCellInner(sec.key, idx, upCount, s.result)}</td>
      </tr>`;
    });
    html += `</tbody></table></div></div></div>`;
  });
  wrap.innerHTML = html;
  safEnsureIdField();
  // Restore the ID that innerHTML replacement wiped out
  const idField = document.getElementById('saf-current-id');
  if(idField && fileId) idField.value = fileId;
}

function safToggleSection(key){
  const body = document.getElementById('saf-sec-'+key);
  const tog  = document.getElementById('saf-tog-'+key);
  if(!body) return;
  const open = !body.classList.contains('collapsed');
  body.classList.toggle('collapsed', open);
  if(tog) tog.innerHTML = open ? '&#9654;' : '&#9660;';
}

/* ── item state ─────────────────────────────────────── */

function safGetOrInitFile(){
  safEnsureIdField();
  if(!DB.safetyFiles) DB.safetyFiles=[];
  let id = document.getElementById('saf-current-id')?.value;
  if(!id || id==='null' || id===''){
    // Allocate a client-side temp ID; will be replaced by API ref on first save
    id = '_new_';
    const inp = document.getElementById('saf-current-id');
    if(inp) inp.value = id;
  }
  let mem = DB.safetyFiles.find(f=>(f.ref_id||f.id)===id);
  if(!mem){
    mem = safBlankFile(id);
    DB.safetyFiles.unshift(mem);
  }
  // Always return the raw record so mutations by safItemChanged persist.
  // Initialize blank sections in-place when not yet loaded from API.
  if(!mem.sections){
    mem.sections = {};
    SAFETY_SECTIONS.forEach(sec=>{
      mem.sections[sec.key] = sec.items.map(item=>({no:item.no, result:null, appointee:'', comments:'', uploads:[]}));
    });
  }
  return mem;
}

function safItemChanged(sec, idx, radio){
  const file = safGetOrInitFile();
  if(!file || !file.sections[sec]) return;
  file.sections[sec][idx].result = radio.value;
  file.updatedAt = new Date().toISOString();
  const row = radio.closest('tr');
  if(row){
    row.classList.remove('saf-row-na','saf-row-nts','saf-row-ts');
    if(radio.value==='N/A') row.classList.add('saf-row-na');
    else if(radio.value==='Not to Standard') row.classList.add('saf-row-nts');
    else if(radio.value==='To Standard') row.classList.add('saf-row-ts');
    // Refresh upload cell so evidence warning appears / disappears immediately
    const cell = row.querySelector('.saf-upload-cell');
    if(cell){
      const cnt = (file.sections[sec][idx].uploads||[]).length;
      cell.innerHTML = _safUploadCellInner(sec, idx, cnt, radio.value);
    }
  }
  safUpdateScore();
}

function safAppointeeChanged(sec, idx, inp){
  const file = safGetOrInitFile();
  if(!file||!file.sections[sec]) return;
  file.sections[sec][idx].appointee = inp.value;
  file.updatedAt = new Date().toISOString();
}

function safCommentChanged(sec, idx, ta){
  const file = safGetOrInitFile();
  if(!file||!file.sections[sec]) return;
  file.sections[sec][idx].comments = ta.value;
  file.updatedAt = new Date().toISOString();
}

/* ── section save ───────────────────────────────────── */

async function safSaveSection(secKey){
  const id  = safCurrentId();
  const mem = safGetOrInitFile();
  if(!mem){toast('No active audit','err');return;}

  const btn = document.getElementById('saf-sec-save-'+secKey);
  const restore = () => { if(btn){btn.disabled=false;btn.textContent='Save';} };

  // New file: must have contractor name, then do a full create first
  if(!id||id==='null'||id===''||id==='_new_'){
    const contractor=(document.getElementById('sah-contractor')?.value||'').trim();
    if(!contractor){toast('Enter contractor name before saving','err');return;}
    if(btn){btn.disabled=true;btn.textContent='…';}
    safReadHeader(mem);
    mem.status='Draft';
    const body=_safBuildApiBody(mem,'Draft');
    const r=await api('POST','safety.php',body);
    restore();
    if(!r.success){toast(r.error||'Save failed','err');return;}
    const saved=normalizeSafetyFile(r.data);
    _safMergeToDb(saved);
    document.getElementById('saf-current-id').value=saved.id;
    document.getElementById('saf-page-title').textContent='Edit — '+saved.id;
    renderSafetyFiles(); updateBadges();
    toast(saved.id+' created — Section '+secKey+' saved','ok');
    return;
  }

  // Existing file: upsert only this section's items
  const sectionItems=(mem.sections[secKey]||[]).map(item=>({
    no:        item.no,
    result:    item.result||null,
    appointee: item.appointee||'',
    comments:  item.comments||'',
    ap_status: item.apStatus||item.ap_status||'Open',
  }));
  if(btn){btn.disabled=true;btn.textContent='…';}
  const r=await api('PUT','safety.php?id='+id,{sections:{[secKey]:sectionItems}});
  restore();
  if(!r.success){toast(r.error||'Save failed','err');return;}
  toast('Section '+secKey+' saved','ok');
  safUpdateScore();
}

/* ── upload helpers ─────────────────────────────────── */

async function _safUploadFd(fd){
  try {
    const res = await fetch(API_BASE + '/files.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: fd,
    });
    if (res.status === 401) {
      if (typeof SESSION !== 'undefined' && SESSION) {
        SESSION = null;
        document.documentElement.dataset.state = 'login';
        if (typeof showLoginPanel === 'function') showLoginPanel();
        if (typeof toast === 'function') toast('Session expired. Please log in again.', 'err');
      }
      return { success: false, error: 'Session expired' };
    }
    return await res.json();
  } catch(e) {
    return { success: false, error: String(e) };
  }
}

function _safSlugifyName(filename){
  let base = filename.includes('.') ? filename.slice(0, filename.lastIndexOf('.')) : filename;
  base = base.replace(/^\d+[\.\s\-]+\s*/, '');
  return base.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/^-|-$/g, '').slice(0, 40) || 'document';
}

function _safCanonicalName(sec, idx, filename){
  const ext = filename.includes('.') ? '.'+filename.split('.').pop().toLowerCase() : '';
  const doctype = ['jpg','jpeg','png'].includes(ext.slice(1)) ? 'photo' : 'document';
  const nn = String(idx+1).padStart(2,'0');
  return `${sec}${nn}_${doctype}_${_safSlugifyName(filename)}${ext}`;
}

function _safUploadCellInner(sec, idx, upCount, result){
  const needsEvidence = result === 'To Standard' && upCount === 0;
  const inputId  = `saf-up-${sec}-${idx}`;
  const warnStyle= needsEvidence ? ' style="background:#f97316;color:#fff;border-color:#f97316"' : '';
  const title    = needsEvidence ? 'To Standard — attach supporting evidence'
                 : upCount > 0   ? `${upCount} evidence file(s) — click to upload more`
                 :                 'Attach evidence document';
  const lbl      = upCount > 0   ? `<span class="saf-up-count">${upCount}</span>+`
                 : needsEvidence  ? '&#9888;+'
                 :                  '+';
  const viewBtn  = upCount > 0
    ? `<button class="btn btn-g btn-xs" data-action="safShowItemDocs" data-ev-sec="${sec}" data-ev-idx="${idx}" title="View evidence files">&#128065;</button>`
    : '';
  return `<input type="file" id="${inputId}" class="hidden" data-action="safHandleUpload" data-section-key="${sec}" data-item-idx="${idx}">${viewBtn}<button class="btn btn-g btn-xs"${warnStyle} data-action="triggerFileInput" data-target-id="${inputId}" title="${title}">${lbl}</button>`;
}

async function safShowItemDocs(sec, idx, fileId){
  const file = fileId
    ? proxyDB.safetyFiles.find(f => f.id === fileId)
    : safGetOrInitFile();
  if(!file || !file.sections[sec]) return;
  const uploads = (file.sections[sec][idx]?.uploads || []).filter(u => typeof u === 'object' && u !== null);
  if(!uploads.length){ toast('No evidence attached to this item','err'); return; }

  const existing = document.getElementById('saf-item-docs-popup');
  if(existing) existing.remove();

  const fileIcon = m => m==='application/pdf' ? '&#128196;' : (m||'').startsWith('image/') ? '&#128444;' : '&#128196;';
  const fmtSz    = b => b<1024 ? b+'B' : b<1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';
  const rows = uploads.map(u=>`
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
      <span>${fileIcon(u.mime_type)}</span>
      <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(u.original_name)}">${esc(u.original_name)}</span>
      <span style="font-size:10px;color:var(--muted)">${fmtSz(u.file_size)}</span>
      ${(u.mime_type==='application/pdf'||(u.mime_type||'').startsWith('image/'))?`<button class="btn btn-g btn-xs" data-action="openDocViewer" data-id="${u.id}" data-name="${esc(u.original_name)}" data-mime="${esc(u.mime_type||'')}">&#128065; View</button>`:''}
      <a class="btn btn-g btn-xs" href="api/files.php?action=download&id=${u.id}" download="${esc(u.original_name)}">&#8595;</a>
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'saf-item-docs-popup';
  overlay.className = 'saf-rename-overlay';
  overlay.innerHTML = `
    <div class="saf-rename-box" style="max-width:480px;width:92vw">
      <div class="saf-rename-title">Evidence — Section ${sec}, Item ${idx+1} (${uploads.length} file${uploads.length!==1?'s':''})</div>
      <div style="margin-top:10px;max-height:320px;overflow-y:auto">${rows}</div>
      <div style="margin-top:14px;text-align:right">
        <button class="btn btn-g" id="saf-item-docs-close">Close</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('saf-item-docs-close').onclick = () => overlay.remove();
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

function safRenameModal(suggested, originalName){
  return new Promise(resolve => {
    const existing = document.getElementById('saf-rename-modal');
    if(existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'saf-rename-modal';
    overlay.className = 'saf-rename-overlay';
    overlay.innerHTML = `
      <div class="saf-rename-box">
        <div class="saf-rename-title">Name this document</div>
        <div class="saf-rename-orig">Original: <em>${esc(originalName)}</em></div>
        <input class="finput saf-rename-inp" id="saf-rename-inp" value="${esc(suggested)}" spellcheck="false" autocomplete="off">
        <div class="saf-rename-hint">Convention: <code>SECTION-NN_doctype_description.ext</code></div>
        <div class="saf-rename-btns">
          <button class="btn btn-g" id="saf-rename-cancel">Cancel</button>
          <button class="btn btn-primary" id="saf-rename-ok">Upload</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const inp = document.getElementById('saf-rename-inp');
    inp.focus(); inp.select();
    const done = v => { overlay.remove(); resolve(v); };
    document.getElementById('saf-rename-ok').onclick = () => done(inp.value.trim() || suggested);
    document.getElementById('saf-rename-cancel').onclick = () => done(null);
    inp.addEventListener('keydown', e => {
      if(e.key==='Enter')  done(inp.value.trim() || suggested);
      if(e.key==='Escape') done(null);
    });
  });
}

async function safHandleUpload(sec, idx, input){
  if(!input.files.length) return;
  const file=safGetOrInitFile();
  if(!file||!file.sections[sec]) return;
  const ref=safCurrentId();
  if(!ref||ref==='null'||ref===''){
    toast('Save the audit first before uploading documents','err');
    input.value=''; return;
  }
  const itemNo   = idx + 1;
  const entityRef = `${ref}:${sec}:${itemNo}`;
  let uploaded=0;
  for(const f of Array.from(input.files)){
    const finalName = await safRenameModal(_safCanonicalName(sec, idx, f.name), f.name);
    if(finalName===null){ input.value=''; return; }
    const renamed = new File([f], finalName, {type: f.type});
    const fd=new FormData();
    fd.append('entity_type','safety_item');
    fd.append('entity_ref', entityRef);
    fd.append('file', renamed);
    const r=await _safUploadFd(fd);
    if(r.success && r.attachment){
      uploaded++;
      file.sections[sec][idx].uploads=[...(file.sections[sec][idx].uploads||[]), r.attachment];
    } else {
      toast(r.error||'Upload failed for '+f.name,'err');
    }
  }
  file.updatedAt=new Date().toISOString();
  if(uploaded){
    toast(uploaded+' evidence file(s) uploaded','ok');
    // Refresh the upload cell to reflect new count and evidence state
    const cell = document.querySelector(`.saf-item-row[data-sec="${sec}"][data-idx="${idx}"] .saf-upload-cell`);
    if(cell){
      const cnt    = file.sections[sec][idx].uploads.length;
      const result = file.sections[sec][idx].result;
      cell.innerHTML = _safUploadCellInner(sec, idx, cnt, result);
    }
  }
  input.value='';
}

/* ── live score ─────────────────────────────────────── */

function safUpdateScore(){
  const id = safCurrentId();
  if(!id) return;
  const file = safGetOrInitFile();
  if(!file || !file.sections) return;
  const {score, mainScore, bonusScore, std, notStd, na, bApplicable, bStd, allTotal, allFilled, completionPct} = safCalcScore(file);
  const band = safBand(score);
  const valEl  = document.getElementById('saf-score-val');
  const bandEl = document.getElementById('saf-score-band');
  const ruleEl = document.getElementById('saf-score-rule');
  const bonusEl = document.getElementById('saf-bonus-score');
  const compEl  = document.getElementById('saf-completion-pct');
  if(valEl){ valEl.textContent = score!==null ? Math.round(score)+' pts' : '—'; valEl.className='safety-score-big '+band.cls; }
  if(bandEl) bandEl.textContent = band.label;
  if(ruleEl) ruleEl.textContent = band.note||'';
  if(compEl) compEl.innerHTML = `<span class="saf-comp-label">Completion:</span> <span class="saf-comp-count">${allFilled}/${allTotal} items rated</span> <span class="saf-comp-pct">(${completionPct}%)</span>`;
  if(bonusEl){
    const mainDisp  = mainScore!==null  ? Math.round(mainScore)+'%'  : '—';
    const bonusDisp = bApplicable ? '+'+Math.round(bonusScore*10)/10+'%' : '+0%';
    bonusEl.innerHTML = `<span class="saf-bonus-main">Main A–H: ${mainDisp}</span><span class="saf-bonus-pts saf-bonus-gold">${bonusDisp} bonus (${bStd}/${bApplicable} pts)</span>`;
  }
  const secEl = document.getElementById('saf-section-scores');
  if(secEl){
    let html='';
    SAFETY_SECTIONS.forEach(sec=>{
      const items = file.sections[sec.key]||[];
      let t=0,n=0,s=0;
      items.forEach(i=>{ t++; if(i.result==='N/A') n++; else if(i.result==='To Standard') s++; });
      const a=t-n;
      if(sec.bonus){
        const pts = a ? `${s}/${a} pts` : '—';
        const bonus = a ? Math.round((s/a)*10*10)/10+'%' : null;
        html+=`<div class="saf-sec-score-row saf-sec-bonus-row">
          <span class="saf-sec-key saf-bonus-gold">${sec.key}</span>
          <span class="saf-sec-score-label">${sec.title.replace(/^Section I — /,'')}</span>
          <span class="saf-sec-pct saf-bonus-gold">${bonus!==null?'+'+bonus:'—'}</span>
        </div>`;
      } else {
        const pct=a?Math.round(s/a*100):null;
        const b=safBand(pct);
        html+=`<div class="saf-sec-score-row">
          <span class="saf-sec-key ${b.cls}">${sec.key}</span>
          <span class="saf-sec-score-label">${sec.title.replace(/^Section [A-H] — /,'')}</span>
          <span class="saf-sec-pct ${b.cls}">${pct!==null?pct+'%':'—'}</span>
        </div>`;
        const hdrPct=document.getElementById('saf-sec-hdr-pct-'+sec.key);
        if(hdrPct){ hdrPct.textContent=pct!==null?pct+'%':''; hdrPct.className='saf-sec-pct'+(pct!==null?' '+b.cls:''); }
      }
    });
    secEl.innerHTML=html;
  }
}

/* ── header read/fill ───────────────────────────────── */

function safReadHeader(file){
  const g=id=>(document.getElementById(id)?.value||'').trim();
  const n=id=>parseInt(document.getElementById(id)?.value)||0;
  file.contractor=g('sah-contractor'); file.contractorRep=g('sah-rep');
  file.appointee162=g('sah-appointee'); file.auditDate=g('sah-date');
  file.region=g('sah-region'); file.auditTeam=g('sah-team');
  file.scopeOfWork=g('sah-scope'); file.manpower=n('sah-manpower');
  file.supervisors=n('sah-supervisors'); file.sheReps=n('sah-shereps');
  file.firstAiders=n('sah-firstaiders'); file.auditorName=g('sah-auditor-name');
  file.signOffDate=g('sah-signoff-date');
}

function safFillHeader(file){
  const s=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
  s('sah-contractor',file.contractor); s('sah-rep',file.contractorRep);
  s('sah-appointee',file.appointee162); s('sah-date',file.auditDate);
  s('sah-region',file.region); s('sah-team',file.auditTeam);
  s('sah-scope',file.scopeOfWork); s('sah-manpower',file.manpower||0);
  s('sah-supervisors',file.supervisors||0); s('sah-shereps',file.sheReps||0);
  s('sah-firstaiders',file.firstAiders||0); s('sah-auditor-name',file.auditorName);
  s('sah-signoff-date',file.signOffDate);
}

/* ── actions (called from handleAction) ─────────────── */

function newSafetyAudit(){
  safEnsureIdField();
  const inp = document.getElementById('saf-current-id');
  if(inp) inp.value='';
  document.getElementById('saf-page-title').textContent='New Safety Audit';
  const today=localDateStr();
  const fields=['sah-contractor','sah-rep','sah-appointee','sah-region','sah-team','sah-scope','sah-auditor-name'];
  fields.forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  ['sah-manpower','sah-supervisors','sah-shereps','sah-firstaiders'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='0';});
  document.getElementById('sah-date').value=today;
  document.getElementById('sah-signoff-date').value=today;
  safBuildSections();
  safUpdateScore();
  showPortalPage('p-safety-audit',null);
}

async function saveSafetyDraft(){
  const contractor=(document.getElementById('sah-contractor')?.value||'').trim();
  if(!contractor){toast('Contractor name is required','err');return;}
  const id=safCurrentId();
  const mem=safGetOrInitFile();
  if(!mem){toast('No active audit','err');return;}
  safReadHeader(mem);
  mem.status='Draft';
  const body=_safBuildApiBody(mem,'Draft');
  let r;
  if(!id||id==='null'||id===''){
    r=await api('POST','safety.php',body);
  } else {
    r=await api('PUT','safety.php?id='+id,body);
  }
  if(!r.success){toast(r.error||'Save failed','err');return;}
  const saved=normalizeSafetyFile(r.data);
  _safMergeToDb(saved);
  document.getElementById('saf-current-id').value=saved.id;
  document.getElementById('saf-page-title').textContent='Edit — '+saved.id;
  renderSafetyFiles(); updateBadges();
  audit('SAVE','Safety draft '+saved.id);
  toast(saved.id+' saved as Draft','ok');
}

async function submitSafetyAudit(){
  const contractor=(document.getElementById('sah-contractor')?.value||'').trim();
  if(!contractor){toast('Contractor name is required','err');return;}
  const id=safCurrentId();
  const mem=safGetOrInitFile();
  if(!mem){toast('No active audit','err');return;}
  safReadHeader(mem);
  mem.status='Submitted';
  const body=_safBuildApiBody(mem,'Submitted');
  let r;
  if(!id||id==='null'||id===''){
    r=await api('POST','safety.php',body);
  } else {
    r=await api('PUT','safety.php?id='+id,body);
  }
  if(!r.success){toast(r.error||'Submit failed','err');return;}
  const saved=normalizeSafetyFile(r.data);
  _safMergeToDb(saved);
  renderSafetyFiles(); updateBadges();
  audit('SUBMIT','Safety audit '+saved.id);
  toast(saved.id+' submitted','ok');
  showPortalPage('p-safety',null);
}

async function editSafetyFile(){
  const id=document.getElementById('saf-detail-content')?.dataset?.fileId;
  if(!id){toast('No file selected','err');return;}
  let file=proxyDB.safetyFiles.find(f=>f.id===id);
  if(!file){toast('File not found','err');return;}
  // Load full item data if not yet in memory
  if(!file.sections){
    const r=await api('GET','safety.php?id='+id);
    if(!r.success){toast(r.error||'Could not load file','err');return;}
    const raw=DB.safetyFiles.find(f=>(f.ref_id||f.id)===id);
    if(raw) raw.sections=r.data.sections;
    file=normalizeSafetyFile(r.data);
  }
  document.getElementById('saf-page-title').textContent='Edit — '+file.id;
  safEnsureIdField();
  document.getElementById('saf-current-id').value=id;
  safFillHeader(file);
  // Sync sections to the in-memory working file
  const mem=safGetOrInitFile();
  if(mem&&file.sections) mem.sections=file.sections;
  safBuildSections();
  safUpdateScore();
  showPortalPage('p-safety-audit',null);
}

/* ── API body builder ───────────────────────────────── */

function _safBuildApiBody(file, status){
  const body={
    contractor:    file.contractor,    contractor_rep: file.contractorRep,
    appointee162:  file.appointee162,  audit_date:     file.auditDate,
    region:        file.region,        audit_team:     file.auditTeam,
    scope_of_work: file.scopeOfWork,   manpower:       file.manpower,
    supervisors:   file.supervisors,   she_reps:       file.sheReps,
    first_aiders:  file.firstAiders,   auditor_name:   file.auditorName,
    sign_off_date: file.signOffDate,   status:         status,
  };
  // Build sections from in-memory item state
  const sections={};
  SAFETY_SECTIONS.forEach(sec=>{
    sections[sec.key]=(file.sections[sec.key]||[]).map(item=>({
      no:         item.no,
      result:     item.result||null,
      appointee:  item.appointee||'',
      comments:   item.comments||'',
      ap_status:  item.apStatus||item.ap_status||'Open',
    }));
  });
  body.sections=sections;
  return body;
}

function _safMergeToDb(normalized){
  if(!DB.safetyFiles) DB.safetyFiles=[];
  const idx=DB.safetyFiles.findIndex(f=>(f.ref_id||f.id)===normalized.id);
  if(idx>=0){
    // Preserve the raw ref_id shape the API returned
    const raw=DB.safetyFiles[idx];
    DB.safetyFiles[idx]={...raw, ...{
      ref_id:normalized.id, contractor:normalized.contractor,
      status:normalized.status, score:normalized.score,
      updated_at:normalized.updatedAt,
    }};
  } else {
    DB.safetyFiles.unshift({ref_id:normalized.id,...normalized});
  }
}

/* ── dashboard render ───────────────────────────────── */

function _safScore(f){
  if(f.sections) return safCalcScore(f);
  const s=f.score!==null&&f.score!==undefined?Number(f.score):null;
  const std    = f.toStdCount  !== null && f.toStdCount  !== undefined ? f.toStdCount  : 0;
  const notStd = f.notStdCount !== null && f.notStdCount !== undefined ? f.notStdCount : 0;
  const na     = f.naCount     !== null && f.naCount     !== undefined ? f.naCount     : 0;
  return {score:s, std, notStd, na, total: std+notStd+na};
}

function renderSafetyFiles(search){
  if(search===undefined) search=(document.querySelector('#p-safety .sinput')||{}).value||'';
  // Populate contractor datalist from all known safety files
  const contractorDl=document.getElementById('sah-contractor-dl');
  if(contractorDl){
    const names=[...new Set(proxyDB.safetyFiles.map(f=>f.contractor).filter(Boolean))];
    contractorDl.innerHTML=names.map(n=>`<option value="${esc(n)}">`).join('');
  }
  const statusFilter=document.getElementById('sf-filter-status')?.value||'';
  let files=[...proxyDB.safetyFiles];
  if(statusFilter) files=files.filter(f=>f.status===statusFilter);
  if(search) files=files.filter(f=>
    (f.contractor||'').toLowerCase().includes(search.toLowerCase())||
    (f.id||'').toLowerCase().includes(search.toLowerCase())
  );

  const remDiv=document.getElementById('safety-reminders');
  if(remDiv){
    const overdue=proxyDB.safetyFiles.filter(f=>{
      const {score}=_safScore(f); const band=safBand(score);
      if(!band.actionDays||!f.auditDate) return false;
      const due=new Date(f.auditDate+'T00:00:00');
      due.setDate(due.getDate()+band.actionDays);
      return new Date()>due && f.status!=='Approved';
    });
    remDiv.innerHTML=overdue.length
      ? `<div class="alert-strip alert-err">Action plan overdue for: ${overdue.map(f=>f.id).join(', ')}</div>`
      : '';
  }

  const grid=document.getElementById('safety-files-grid');
  if(!grid) return;
  if(!files.length){
    grid.classList.remove('safety-grid--single');
    grid.innerHTML=`<div class="empty-state"><div class="empty-icon empty-icon-lg">🛡</div><div>No safety files — start a new audit.</div></div>`;
    return;
  }
  grid.classList.toggle('safety-grid--single', files.length===1);
  grid.innerHTML=files.map(f=>{
    const {score,std,notStd,na}=_safScore(f);
    const band=safBand(score);
    const scoreDisp=score!==null?Math.round(score)+' pts':'—';
    const dateDisp=f.auditDate?fmtD(f.auditDate):'No date';
    const polBadge=f.policyEmailSent?`<span class="saf-pol-badge">Policy sent</span>`:'';
    const isSubmitted = f.status === 'Submitted' || f.status === 'Approved';
    const submissionBar = isSubmitted && f.updatedAt
      ? `<div class="saf-submission-bar">&#10003; Submitted ${fmtDT(f.updatedAt)} &middot; Audit Score: ${scoreDisp}</div>`
      : '';
    return `<div class="saf-card" data-action="safViewFile" data-id="${f.id}">
      <div class="saf-card-hdr">
        <div class="saf-card-id">${esc(f.id)}</div>
        <div class="saf-status-pill saf-status-${(f.status||'draft').toLowerCase().replace(/ /g,'-')}">${esc(f.status||'Draft')}</div>
      </div>
      <div class="saf-card-contractor">${esc(f.contractor||'Untitled')}</div>
      <div class="saf-card-scope">${esc((f.scopeOfWork||'').substring(0,80))||'&mdash;'}</div>
      <div class="saf-card-meta"><span>${dateDisp}</span><span>${esc(f.region||'')}</span>${polBadge}</div>
      <div class="saf-card-score-row">
        <div class="saf-score-chip ${band.cls}">${scoreDisp}</div>
        <div class="saf-band-label">${band.label}</div>
      </div>
      <div class="saf-card-stats">
        <span class="saf-stat saf-stat-ts">${std} To Std</span>
        <span class="saf-stat saf-stat-nts">${notStd} Not to Std</span>
        <span class="saf-stat saf-stat-na">${na} N/A</span>
      </div>
      ${submissionBar}
    </div>`;
  }).join('');
}

/* ── detail view ────────────────────────────────────── */

async function safViewFile(id){
  try {
  let file=proxyDB.safetyFiles.find(f=>f.id===id);
  if(!file){toast('File not found','err');return;}
  if(!file.sections){
    const r=await api('GET','safety.php?id='+id);
    if(!r.success){
      const msg = r.error && r.error.startsWith('SyntaxError') ? 'Server error — check PHP logs or run safety migration SQL' : (r.error||'Could not load file');
      toast(msg,'err'); return;
    }
    const full=normalizeSafetyFile(r.data);
    // Store sections on the raw DB record
    const raw=DB.safetyFiles.find(f=>(f.ref_id||f.id)===id);
    if(raw) raw.sections=r.data.sections;
    file=full;
  }
  const {score,mainScore,bonusScore,std,notStd,na,total,bApplicable,bStd,allTotal,allFilled,completionPct}=safCalcScore(file);
  const band=safBand(score);
  const scoreDisp=score!==null?Math.round(score)+' pts':'—';
  const mainDisp =mainScore!==null?Math.round(mainScore)+' pts':'—';
  const bonusDisp=bApplicable?'+'+Math.round(bonusScore*10)/10+' pts':'';

  document.getElementById('saf-detail-title').textContent=file.id+' — '+(file.contractor||'Untitled');
  document.getElementById('saf-detail-sub').textContent=(file.status||'DRAFT').toUpperCase()+'  ·  '+(file.auditDate||'No date')+'  ·  Audit Score: '+scoreDisp+(bonusDisp?' ('+mainDisp+' A–H '+bonusDisp+' bonus)':'')+'  ·  '+completionPct+'% complete';

  const content=document.getElementById('saf-detail-content');
  content.dataset.fileId=id;
  _safUpdateApproveBtn(id);
  _safUpdateDeactivateBtn(id);

  let sumRows='';
  SAFETY_SECTIONS.forEach(sec=>{
    const items=file.sections[sec.key]||[];
    let t=0,n=0,s=0,ns=0;
    items.forEach(i=>{ t++; if(i.result==='N/A') n++; else if(i.result==='To Standard') s++; else if(i.result==='Not to Standard') ns++; });
    const bonusTag=sec.bonus?` <span class="saf-bonus-tag">Bonus</span>`:'';
    sumRows+=`<tr${sec.bonus?' class="saf-sum-bonus-row"':''} id="sum-row-${sec.key}">
      <td>${esc(sec.title)}${bonusTag}</td><td>${t}</td><td>${n}</td><td>${ns}</td><td>${s}</td>
      <td class="saf-sec-doc-cell" id="saf-sec-doc-${sec.key}">
        <input type="file" id="saf-sec-file-${sec.key}" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" data-action="safSectionUpload" data-file-id="${id}" data-section-key="${sec.key}">
        <button class="btn btn-g btn-xs saf-sec-doc-btn" data-action="triggerFileInput" data-target-id="saf-sec-file-${sec.key}" title="Upload combined sign-off document for this section">&#128196; Upload</button>
      </td>
    </tr>`;
  });

  let actionRows='';
  SAFETY_SECTIONS.forEach(sec=>{
    const saved=file.sections[sec.key]||[];
    sec.items.forEach((item,idx)=>{
      const s=saved[idx]||{};
      if(s.result==='Not to Standard'){
        const bonusLabel=sec.bonus?` <span class="saf-bonus-tag">Bonus</span>`:'';
        actionRows+=`<tr${sec.bonus?' class="saf-ap-bonus-row"':''}>
          <td>${esc(sec.key+'.'+item.no)}${bonusLabel}</td>
          <td>${esc(item.ref||'')}</td>
          <td>${esc(item.criteria)}</td>
          <td>${esc(s.comments||'')}</td>
          <td><select class="finput finput-sm saf-ap-sel" data-action="safApSetStatus" data-file-id="${id}" data-section-key="${sec.key}" data-item-idx="${idx}">
            <option ${!s.apStatus||s.apStatus==='Open'?'selected':''}>Open</option>
            <option ${s.apStatus==='In Progress'?'selected':''}>In Progress</option>
            <option ${s.apStatus==='Resolved'?'selected':''}>Resolved</option>
          </select></td>
        </tr>`;
      }
    });
  });

  let checkHtml='';
  SAFETY_SECTIONS.forEach(sec=>{
    const saved=file.sections[sec.key]||[];
    let t=0,n=0,s=0;
    saved.forEach(i=>{ t++; if(i.result==='N/A') n++; else if(i.result==='To Standard') s++; });
    const a=t-n; const pct=a?Math.round(s/a*100):null;
    const rptBonusLabel = sec.bonus ? ` <span class="saf-bonus-tag">Bonus +10%</span>` : '';
    const rptPctLabel   = sec.bonus
      ? (a ? `<span class="saf-sec-pct saf-bonus-gold">+${Math.round((s/a)*10*10)/10}%</span>` : '')
      : (pct!==null ? `<span class="saf-sec-pct ${safBand(pct).cls}">${pct}%</span>` : '');
    checkHtml+=`<div class="saf-rpt-section${sec.bonus?' saf-rpt-section-bonus':''}">
      <div class="saf-rpt-sec-hdr">${esc(sec.title)}${rptBonusLabel} ${rptPctLabel}</div>
      <table class="saf-rpt-tbl">
        <thead><tr><th>#</th><th>Ref</th><th>Criteria</th><th>Result</th>${sec.key==='H'?'<th>Appointee</th>':''}<th>Comments</th><th class="saf-rpt-ev-hdr">Evidence</th></tr></thead>
        <tbody>`;
    sec.items.forEach((item,idx)=>{
      const sv=saved[idx]||{};
      const resCls=sv.result==='To Standard'?'saf-ts':sv.result==='Not to Standard'?'saf-nts-text':sv.result==='N/A'?'saf-na-text':'';
      const ups=(sv.uploads||[]).filter(u=>typeof u==='object'&&u!==null);
      const evCell=ups.length
        ?`<button class="btn btn-g btn-xs" data-action="safShowItemDocs" data-ev-sec="${sec.key}" data-ev-idx="${idx}" data-file-id="${id}" title="${ups.length} file${ups.length!==1?'s':''}">&#128065; ${ups.length}</button>`
        :'<span class="saf-rpt-no-ev">—</span>';
      checkHtml+=`<tr>
        <td>${item.no}</td><td>${esc(item.ref||'')}</td><td>${esc(item.criteria)}</td>
        <td class="${resCls}">${esc(sv.result||'—')}</td>
        ${sec.key==='H'?`<td>${esc(sv.appointee||'')}</td>`:''}
        <td>${esc(sv.comments||'')}</td>
        <td class="saf-rpt-ev-cell">${evCell}</td>
      </tr>`;
    });
    checkHtml+=`</tbody></table></div>`;
  });

  const isSubmitted = file.status === 'Submitted' || file.status === 'Approved';
  const submissionBanner = isSubmitted
    ? `<div class="saf-submission-banner">
        <div class="saf-sb-icon">&#10003;</div>
        <div class="saf-sb-meta">
          <strong>Safety File ${esc(file.status)}</strong>
          <span>Submitted ${fmtDT(file.updatedAt)} &middot; Score at submission: ${scoreDisp} (${band.label})</span>
        </div>
        <div class="saf-sb-score-pill">${scoreDisp}</div>
      </div>`
    : '';

  content.innerHTML=`
    ${submissionBanner}
    <div class="panel mt0 saf-att-section">
      <div class="ph">
        <div class="ph-title">Supporting Documents</div>
        <div>
          <input type="file" id="saf-det-upload" class="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png">
          <button class="btn btn-g btn-s" data-action="triggerFileInput" data-target-id="saf-det-upload">+ Upload Document</button>
        </div>
      </div>
      <div class="pb" id="saf-att-panel"><div class="saf-att-empty">Loading documents…</div></div>
    </div>
    <div class="panel mt2 saf-personnel-section">
      <div class="ph">
        <div class="ph-title">People on File</div>
        <div class="saf-sec-act">
          <button class="btn btn-g btn-s" data-action="safSendPolicyToPersonnel" data-id="${id}">&#9993; Send Policy</button>
          <button class="btn btn-g btn-s" data-action="safAddPersonnel" data-id="${id}">+ Add Person</button>
          <button class="btn btn-g btn-s" data-action="safLinkPortalUser" data-id="${id}">+ Link Portal User</button>
        </div>
      </div>
      <div class="pb" id="saf-personnel-panel"><div class="saf-att-empty">Loading personnel…</div></div>
    </div>
    <div class="panel mt2 saf-compliance-section">
      <div class="ph">
        <div class="ph-title">Training &amp; Compliance Tracking</div>
        <button class="btn btn-g btn-s" data-action="safAddCompliance" data-id="${id}">+ Add Record</button>
      </div>
      <div class="pb" id="saf-compliance-panel"><div class="saf-att-empty">Loading compliance records…</div></div>
    </div>
    <div class="panel mt2 saf-policy-ack-section">
      <div class="ph">
        <div class="ph-title">Policies &amp; Procedures — Acknowledgments</div>
        <button class="btn btn-g btn-s" data-action="safAddPolicyAck" data-id="${id}">+ Send Policy</button>
      </div>
      <div class="pb" id="saf-policy-ack-panel"><div class="saf-att-empty">Loading policy acknowledgments…</div></div>
    </div>
    <div class="panel saf-detail-cover">
      <div class="saf-cover-grid">
        <div><span class="saf-cover-lbl">Contractor</span><span class="saf-cover-val">${esc(file.contractor||'—')}</span></div>
        <div><span class="saf-cover-lbl">Contractor Rep</span><span class="saf-cover-val">${esc(file.contractorRep||'—')}</span></div>
        <div><span class="saf-cover-lbl">16.2 Appointee</span><span class="saf-cover-val">${esc(file.appointee162||'—')}</span></div>
        <div><span class="saf-cover-lbl">Audit Team</span><span class="saf-cover-val">${esc(file.auditTeam||'—')}</span></div>
        <div><span class="saf-cover-lbl">Audit Date</span><span class="saf-cover-val">${file.auditDate?fmtD(file.auditDate):'—'}</span></div>
        <div><span class="saf-cover-lbl">Region / Site</span><span class="saf-cover-val">${esc(file.region||'—')}</span></div>
        <div><span class="saf-cover-lbl">Scope of Work</span><span class="saf-cover-val">${esc(file.scopeOfWork||'—')}</span></div>
        <div><span class="saf-cover-lbl">Manpower</span><span class="saf-cover-val">${file.manpower||0} total (Supervisors: ${file.supervisors||0}, SHE Reps: ${file.sheReps||0}, First Aiders: ${file.firstAiders||0})</span></div>
        <div><span class="saf-cover-lbl">Auditor</span><span class="saf-cover-val">${esc(file.auditorName||'—')}</span></div>
        <div><span class="saf-cover-lbl">Sign-Off Date</span><span class="saf-cover-val">${file.signOffDate?fmtD(file.signOffDate):'—'}</span></div>
      </div>
      <div class="saf-cover-score-block ${band.cls}">
        <div class="saf-cover-score-lbl">Audit Score</div>
        <div class="saf-cover-score">${scoreDisp}</div>
        <div class="saf-cover-band">${band.label}</div>
        ${bonusDisp?`<div class="saf-cover-breakdown">${mainDisp} A–H &nbsp;|&nbsp; <span class="saf-bonus-gold">${bonusDisp} bonus</span></div>`:''}
        ${band.note?`<div class="saf-cover-note">${esc(band.note)}</div>`:''}
        <div class="saf-cover-completion">Completion: ${allFilled}/${allTotal} items rated (${completionPct}%)</div>
        <div id="saf-comp-health-block" class="saf-ch-loading">Checking compliance health…</div>
        <div class="saf-cover-doc">Doc No: BF-SHE-FRM-010 Rev 01</div>
      </div>
    </div>

    <div class="panel mt2">
      <div class="ph"><div class="ph-title">Summary of Compliance</div></div>
      <div class="tw"><table class="saf-sum-tbl">
        <thead><tr><th>Section</th><th>Total Items</th><th>N/A</th><th>Not to Std</th><th>To Std</th><th>Combined Sign-Off</th></tr></thead>
        <tbody>${sumRows}</tbody>
        <tfoot><tr><td><strong>Total</strong></td><td><strong>${total}</strong></td><td><strong>${na}</strong></td><td><strong>${notStd}</strong></td><td><strong>${std}</strong></td></tr></tfoot>
      </table></div>
    </div>

    ${actionRows?`<div class="panel mt2">
      <div class="ph"><div class="ph-title">Action Plan — Items Not to Standard</div>
        <div class="flex-row gap-8 flex-wrap">
          ${band.actionDays?`<div class="saf-ap-deadline ${band.cls}">Action required within ${band.actionDays} ${band.note&&band.note.includes('working')?'working ':'calendar '}days</div>`:''}
          <button class="btn btn-g btn-s" data-action="safGenDocs" data-id="${id}" title="Generate template documents for all Not to Standard items">&#128196; Generate Docs</button>
        </div>
      </div>
      <div class="tw"><table class="saf-ap-tbl">
        <thead><tr><th>Item</th><th>Ref</th><th>Criteria</th><th>Findings</th><th>Status</th></tr></thead>
        <tbody>${actionRows}</tbody>
      </table></div>
    </div>`:''}

    <div class="mt2 saf-rpt-full">${checkHtml}</div>
  `;

  showPortalPage('p-safety-detail',null);
  // Load all async panels after page is shown
  _safComplianceCache = null; _safPersonnelCache = null; _safLinkedUsersCache = null;
  safLoadAttachments(id).then(atts=>safRenderAttachments(id, atts));
  safLoadPersonnel(id).then(p=>safRenderPersonnel(id,p));
  safLoadCompliance(id).then(recs=>safRenderCompliance(id,recs));
  safLoadPolicyAcks(id).then(acks=>safRenderPolicyAcks(id,acks));
  } catch(e) { toast('Error loading file: '+e.message,'err'); console.error('safViewFile error:',e); }
}

function safGenDocs(fileId){
  if(!fileId || fileId==='_new_' || fileId==='null') {
    toast('Save the safety file before generating documents.','warn'); return;
  }
  const url = 'api/safety_doc_gen.php?file_ref=' + encodeURIComponent(fileId);
  window.open(url, '_blank');
}

async function safApSetStatus(fileId, sec, idx, val){
  const file=proxyDB.safetyFiles.find(f=>f.id===fileId);
  if(!file||!file.sections[sec]) return;
  file.sections[sec][idx].apStatus=val;
  file.updatedAt=new Date().toISOString();
  save();
  audit('ACTION_PLAN',`${fileId} ${sec}.${idx+1} → ${val}`);
  try {
    await api('PUT','safety.php?id='+encodeURIComponent(fileId),
      {action:'update_ap_status',section_key:sec,item_no:idx+1,ap_status:val});
  } catch(e){
    toast('Status saved locally — sync failed, will retry on next save','warn');
  }
}

/* ── print ──────────────────────────────────────────── */

/* ── generate downloadable action-plan tracker ───────── */

async function safGenerateTracker(id) {
  if (!id) { toast('No file open', 'err'); return; }
  let file = proxyDB.safetyFiles.find(f => f.id === id);
  if (!file) { toast('File not found', 'err'); return; }
  if (!file.sections) {
    const r = await api('GET', 'safety.php?id=' + id);
    if (!r.success) { toast(r.error || 'Could not load file', 'err'); return; }
    const full = normalizeSafetyFile(r.data);
    const raw = DB.safetyFiles.find(f => (f.ref_id || f.id) === id);
    if (raw) raw.sections = r.data.sections;
    file = full;
  }

  const PRI = { A:'high', B:'high', C:'med', D:'high', E:'high', F:'med', G:'high', H:'med' };
  const sections = [];
  let origPass = 0, origApplicable = 0;

  SAFETY_SECTIONS.filter(s => !s.bonus).forEach(sec => {
    const saved = file.sections[sec.key] || [];
    const failItems = [];
    sec.items.forEach((item, idx) => {
      const sv = saved[idx] || {};
      if (sv.result === 'N/A') return;
      origApplicable++;
      if (sv.result === 'To Standard') { origPass++; return; }
      if (sv.result === 'Not to Standard') {
        failItems.push({
          id:       sec.key + item.no,
          ref:      item.ref || '—',
          criteria: item.criteria,
          comment:  sv.comments || 'Not to Standard — action required',
          priority: PRI[sec.key] || 'med',
        });
      }
    });
    if (failItems.length) sections.push({ id: sec.key, label: sec.title, items: failItems });
  });

  if (!sections.length) {
    toast('No non-conformances to track — all scored items are To Standard or N/A', 'ok');
    return;
  }

  const html = _buildTrackerHTML({
    fileId:          id,
    contractor:      file.contractor || 'Contractor',
    auditDate:       file.auditDate ? fmtD(file.auditDate) : '—',
    region:          file.region    || '',
    auditorName:     file.auditorName || '',
    sections,
    totalApplicable: sections.reduce((t, s) => t + s.items.length, 0),
    origPass,
    origApplicable,
  });

  const blob   = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const fname   = id + '_Action_Tracker.html';

  openModal('Action Plan Tracker — ' + id, `
    <div class="att-ctx mb-16 fs-11">
      <strong>${esc(file.contractor || id)}</strong> — ${sections.reduce((t,s)=>t+s.items.length,0)} non-conformance${sections.reduce((t,s)=>t+s.items.length,0)===1?'':'s'} across ${sections.length} section${sections.length===1?'':'s'}
    </div>
    <div class="flex-row gap-10 flex-wrap">
      <button class="btn btn-p" data-action="openBlobPreview" data-blob-url="${blobUrl}">&#128065; Preview in Browser</button>
      <a class="btn btn-g" id="tracker-dl-btn" href="${blobUrl}" download="${esc(fname)}" data-action="revokeBlobOnDownload" data-blob-url="${blobUrl}">&#8595; Download</a>
    </div>
    <div class="fs-10 text-muted mt-10">The tracker opens as a self-contained page — no internet connection required.</div>
  `);
}

function _buildTrackerHTML(o) {
  const esc   = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const base  = o.origApplicable ? (o.origPass / o.origApplicable * 100).toFixed(2) : '0.00';
  const secOpts = o.sections.map(s =>
    `<option value="${s.id}">${s.id} — ${s.label.replace(/^Section [A-I] — /,'')}</option>`
  ).join('');
  const sectionsJson      = JSON.stringify(o.sections);
  const totalApplicable   = o.totalApplicable;
  const origPass          = o.origPass;
  const origApplicable    = o.origApplicable;
  const baselineScore     = base;
  const storageKey        = 'bf_tracker_' + o.fileId;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BF-SHE-FRM-010 · Action Tracker — ${esc(o.contractor)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#F5F1EA;--surface:#FFFFFF;--surface2:#EDE8DE;--surface3:#E4DED2;
  --border:#C8C1B3;--border2:#B8B1A3;
  --text:#1A1814;--text2:#4A4638;--muted:#7A7566;--muted2:#5A5448;
  --accent:#C94A10;--accent2:#E05A1A;
  --red:#A82A1E;--red-bg:rgba(168,42,30,.08);--red-bdr:rgba(168,42,30,.25);
  --amber:#9A6A0A;--amber-bg:rgba(212,138,21,.1);--amber-bdr:rgba(212,138,21,.28);
  --green:#1A6633;--green-bg:rgba(26,122,64,.08);--green-bdr:rgba(26,122,64,.25);
  --blue:#2563EB;--blue-bg:rgba(59,130,246,.07);--blue-bdr:rgba(59,130,246,.2);
  --row-odd:#FAFAF8;--row-even:#FFFFFF;--row-hover:rgba(200,193,179,.28);
  --scrolltrack:#EDE8DE;--scrollthumb:#C8C1B3;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Instrument Sans',system-ui,sans-serif;font-size:13px;background:var(--bg);color:var(--text);min-height:100vh;position:relative}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:40px 40px;opacity:.18}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:var(--scrolltrack)}
::-webkit-scrollbar-thumb{background:var(--scrollthumb);border-radius:2px}
.topbar{position:sticky;top:0;z-index:300;background:var(--surface);border-bottom:2px solid var(--accent);box-shadow:0 1px 8px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:space-between;padding:10px 24px;gap:16px;flex-wrap:wrap}
.brand{font-size:15px;font-weight:700;letter-spacing:.01em;color:var(--accent)}
.brand small{display:block;font-size:11px;font-weight:400;color:var(--muted)}
.score-block{display:flex;align-items:center;gap:14px}
.ring-wrap{position:relative;width:64px;height:64px;flex-shrink:0}
.ring-wrap svg{transform:rotate(-90deg)}
.ring-bg{fill:none;stroke:var(--surface3);stroke-width:6}
.ring-fill{fill:none;stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset .6s ease,stroke .4s}
.ring-label{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.ring-pct{font-size:13px;font-weight:700}
.ring-tag{font-size:8px;color:var(--muted);font-weight:600;letter-spacing:.04em}
.score-meta{font-size:11px;color:var(--muted2);line-height:1.9}
.score-meta strong{color:var(--accent)}
.submit-banner{display:none;align-items:center;gap:16px;padding:11px 24px;background:var(--green-bg);border-bottom:2px solid var(--green-bdr);position:relative;z-index:1;flex-wrap:wrap}
.sb-check{font-size:20px;color:var(--green);flex-shrink:0;line-height:1}
.sb-meta{flex:1;min-width:180px}
.sb-meta strong{font-size:13px;color:var(--green);display:block;line-height:1.4}
.sb-meta span{font-size:11px;color:var(--muted2)}
.sb-score-pill{background:var(--green);color:#fff;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap;flex-shrink:0}
.sb-resubmit{font-size:11px;font-family:inherit;font-weight:600;padding:5px 12px;border-radius:5px;border:1px solid var(--green-bdr);background:transparent;color:var(--green);cursor:pointer;white-space:nowrap;transition:all .15s;flex-shrink:0}
.sb-resubmit:hover{background:var(--green);color:#fff}
.prog-bar-wrap{background:var(--surface2);position:relative;z-index:1}
.prog-bar-bg{height:3px;background:var(--surface3)}
.prog-bar-fill{height:3px;background:var(--accent);transition:width .5s ease}
.controls{padding:10px 24px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;align-items:center;position:relative;z-index:1}
.controls select,.controls input{background:var(--surface);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:5px;font-family:inherit;font-size:12px;transition:border-color .15s}
.controls select:focus,.controls input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(201,74,16,.12)}
.btn{font-size:12px;font-family:inherit;font-weight:600;padding:6px 16px;border-radius:5px;border:none;cursor:pointer;white-space:nowrap;transition:all .15s}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{background:var(--accent2)}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.ctrl-spacer{flex:1}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:var(--muted);padding:8px 24px;border-bottom:1px solid var(--border);background:var(--surface);position:relative;z-index:1}
.legend span{display:flex;align-items:center;gap:5px}
.section-group{margin:20px 24px 0;position:relative;z-index:1}
.section-head{display:flex;align-items:center;gap:10px;padding:9px 16px;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:6px 6px 0 0;cursor:pointer;user-select:none;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.section-head h2{font-size:12px;font-weight:700;color:var(--accent);flex:1;letter-spacing:.01em;text-transform:uppercase}
.section-head .s-stats{font-size:10px;color:var(--muted);display:flex;gap:8px;flex-wrap:wrap}
.section-head .chevron{font-size:11px;color:var(--muted);transition:transform .2s}
.section-head.collapsed .chevron{transform:rotate(-90deg)}
.section-head.collapsed{border-radius:6px}
.tbl-wrap{overflow-x:auto;border:1px solid var(--border);border-top:none;border-radius:0 0 6px 6px;margin-bottom:6px;box-shadow:0 1px 4px rgba(0,0,0,.05)}
table{border-collapse:collapse;width:100%;min-width:720px}
thead th{background:var(--surface2);color:var(--text2);padding:8px 14px;text-align:left;border-right:1px solid var(--border);border-bottom:1px solid var(--border);white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
tbody td{padding:8px 14px;border-right:1px solid var(--surface3);border-bottom:1px solid var(--surface3);vertical-align:top;color:var(--text2);font-size:12px}
tbody tr:nth-child(odd) td{background:var(--row-odd)}
tbody tr:nth-child(even) td{background:var(--row-even)}
tbody tr:hover td{background:var(--row-hover)}
tbody tr.hidden{display:none}
td.num{color:var(--muted);width:48px;text-align:center;font-size:11px;font-weight:600}
td.criteria{max-width:260px;line-height:1.55;color:var(--text)}
td.comment{max-width:220px;color:var(--muted2);font-size:11px;line-height:1.5;font-style:italic}
td.status-cell{width:130px}
td.rejection-cell{min-width:160px;background:rgba(168,42,30,.04)}
td.notes-cell{min-width:160px}
.rejection-in{border-color:var(--red-bdr)!important;color:var(--red)!important}
.rejection-in:placeholder-shown{color:var(--border2)!important;border-color:transparent!important}
.rejection-in:not(:placeholder-shown){background:var(--red-bg)!important}
.status-sel{width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:4px;font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
.status-sel:focus{outline:none}
.status-sel.s-open{background:var(--red-bg);border-color:var(--red-bdr);color:var(--red)}
.status-sel.s-wip{background:var(--amber-bg);border-color:var(--amber-bdr);color:var(--amber)}
.status-sel.s-done{background:var(--green-bg);border-color:var(--green-bdr);color:var(--green)}
.status-sel.s-na{background:var(--surface2);border-color:var(--border);color:var(--muted)}
.notes-in{width:100%;background:transparent;border:1px solid transparent;color:var(--muted2);padding:4px 6px;border-radius:4px;font-family:inherit;font-size:11px;resize:none;transition:border-color .15s}
.notes-in:focus{outline:none;border-color:var(--border);background:var(--surface);box-shadow:0 0 0 2px rgba(201,74,16,.08)}
.notes-in::placeholder{color:var(--border2)}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;flex-shrink:0;vertical-align:middle}
.p-high .dot{background:var(--red)}
.p-med .dot{background:var(--amber)}
.p-low .dot{background:var(--blue)}
.pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:.03em;text-transform:uppercase}
.pill-fail{background:var(--red-bg);color:var(--red);border:1px solid var(--red-bdr)}
.pill-pass{background:var(--green-bg);color:var(--green);border:1px solid var(--green-bdr)}
.pill-na{background:var(--surface2);color:var(--muted);border:1px solid var(--border)}
.pill-wip{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-bdr)}
.toast{position:fixed;bottom:24px;right:24px;background:var(--text);color:var(--surface);padding:10px 18px;border-radius:6px;font-size:12px;font-weight:500;opacity:0;pointer-events:none;transition:opacity .3s;z-index:999;box-shadow:0 4px 16px rgba(0,0,0,.2)}
.toast.show{opacity:1}
#content{padding-bottom:40px}
@media print{
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body::before{display:none}
  .topbar{position:static!important;box-shadow:none}
  .controls,.prog-bar-wrap,.submit-banner,.guide-panel,.guide-overlay{display:none!important}
  .section-group{page-break-inside:avoid;margin:12px 0}
  .tbl-wrap{box-shadow:none}
}
.guide-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:499;display:none}
.guide-overlay.open{display:block}
.guide-panel{position:fixed;top:0;right:-400px;width:360px;height:100vh;background:var(--surface);border-left:2px solid var(--accent);box-shadow:-6px 0 28px rgba(0,0,0,.14);z-index:500;display:flex;flex-direction:column;transition:right .3s ease}
.guide-panel.open{right:0}
.guide-hdr{background:var(--accent);color:#fff;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.guide-hdr h3{font-size:13px;font-weight:700;margin:0;letter-spacing:.02em}
.guide-hdr small{display:block;font-size:10px;font-weight:400;opacity:.8;margin-top:2px}
.guide-close{background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;padding:0 2px;opacity:.85}
.guide-close:hover{opacity:1}
.guide-body{overflow-y:auto;padding:16px;flex:1}
.guide-body::-webkit-scrollbar{width:4px}
.guide-body::-webkit-scrollbar-track{background:var(--surface2)}
.guide-body::-webkit-scrollbar-thumb{background:var(--scrollthumb);border-radius:2px}
.g-section{margin-bottom:18px}
.g-section h4{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border)}
.g-section p{font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:6px}
.g-section ul{padding-left:15px;margin:4px 0}
.g-section li{font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:3px}
.g-band{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text2);margin-bottom:5px}
.g-band-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.g-tip{background:var(--amber-bg);border:1px solid var(--amber-bdr);border-radius:4px;padding:9px 12px;margin-top:8px;font-size:11px;color:var(--amber);line-height:1.65}
</style>
</head>
<body>
<div class="topbar">
  <div class="brand">
    BF-SHE-FRM-010 · Action Tracker
    <small>${esc(o.contractor)}${o.region ? ' · ' + esc(o.region) : ''} · Audit: ${esc(o.auditDate)}${o.auditorName ? ' · ' + esc(o.auditorName) : ''}</small>
  </div>
  <div class="score-block">
    <div class="ring-wrap">
      <svg viewBox="0 0 64 64" width="64" height="64">
        <circle class="ring-bg" cx="32" cy="32" r="27"/>
        <circle class="ring-fill" id="ringFill" cx="32" cy="32" r="27" stroke-dasharray="169.6" stroke-dashoffset="169.6"/>
      </svg>
      <div class="ring-label">
        <span class="ring-pct" id="ringPct">0%</span>
        <span class="ring-tag" id="ringTag">RED</span>
      </div>
    </div>
    <div class="score-meta" id="scoreMeta">Loading…</div>
  </div>
</div>
<div class="prog-bar-wrap">
  <div class="prog-bar-bg"><div class="prog-bar-fill" id="progBar" style="width:0%"></div></div>
</div>
<div class="submit-banner" id="submitBanner">
  <div class="sb-check">&#10003;</div>
  <div class="sb-meta">
    <strong>File Submitted to AST</strong>
    <span id="sbDetail">—</span>
  </div>
  <div class="sb-score-pill" id="sbScorePill">—</div>
  <button class="sb-resubmit" onclick="submitFile()">Re-Submit</button>
</div>
<div class="controls">
  <select id="filterSection"><option value="">All Sections</option>${secOpts}</select>
  <select id="filterStatus">
    <option value="">All Statuses</option>
    <option value="open">Open</option>
    <option value="wip">In Progress</option>
    <option value="done">Fixed</option>
    <option value="na">N/A</option>
  </select>
  <input type="text" id="search" placeholder="Search items…" style="min-width:160px">
  <div class="ctrl-spacer"></div>
  <button class="btn btn-ghost" onclick="toggleGuide()" title="How to use this tracker" style="padding:6px 11px;font-size:15px;line-height:1">?</button>
  <button class="btn btn-ghost" onclick="resetAll()">Reset</button>
  <button class="btn btn-ghost" id="btnSubmit" onclick="submitFile()" style="border-color:var(--green-bdr);color:var(--green)">Submit to AST</button>
  <button class="btn btn-primary" onclick="window.print()">Print / PDF</button>
</div>
<div class="legend">
  <span><span style="width:9px;height:9px;border-radius:2px;background:var(--red);display:inline-block"></span> Open</span>
  <span><span style="width:9px;height:9px;border-radius:2px;background:var(--amber);display:inline-block"></span> In Progress</span>
  <span><span style="width:9px;height:9px;border-radius:2px;background:var(--green);display:inline-block"></span> Fixed</span>
  <span><span style="width:9px;height:9px;border-radius:2px;background:var(--border2);display:inline-block"></span> N/A</span>
  <span style="margin-left:14px"><span class="dot" style="background:var(--red)"></span> High priority</span>
  <span><span class="dot" style="background:var(--amber)"></span> Medium</span>
</div>
<div id="content"></div>
<div class="toast" id="toast"></div>
<div class="guide-overlay" id="guideOverlay" onclick="toggleGuide()"></div>
<div class="guide-panel" id="guidePanel" role="complementary" aria-label="How-to Guide">
  <div class="guide-hdr">
    <div>
      <h3>How to use this tracker</h3>
      <small>BF-SHE-FRM-010 · Action Tracker</small>
    </div>
    <button class="guide-close" onclick="toggleGuide()" aria-label="Close guide">&times;</button>
  </div>
  <div class="guide-body">
    <div class="g-section">
      <h4>Purpose</h4>
      <p>This standalone tracker lets you record and manage corrective actions for a safety file audit. Share it with the contractor or use it internally to track progress toward re-submission. All changes are saved automatically in your browser.</p>
    </div>
    <div class="g-section">
      <h4>Step-by-step</h4>
      <ul>
        <li>Work through each non-conformance item section by section.</li>
        <li>Set the <strong>Status</strong> dropdown as you address each finding: Open &rarr; In Progress &rarr; Fixed.</li>
        <li>Record your corrective action, the responsible owner, and target date in the <strong>Notes / Action</strong> column.</li>
        <li>If AST returned a rejection note for an item, log it in the <strong>AST Rejection Note</strong> column.</li>
        <li>Use the filters at the top to focus on one section or status at a time.</li>
        <li>When ready to record progress with AST, click <strong>Submit to AST</strong>.</li>
        <li>Use <strong>Print / PDF</strong> to generate a printable copy for meetings or filing.</li>
      </ul>
    </div>
    <div class="g-section">
      <h4>Score bands</h4>
      <div class="g-band"><span class="g-band-dot" style="background:#22c55e"></span><span><strong>GREEN 90 %+</strong> — Fully compliant</span></div>
      <div class="g-band"><span class="g-band-dot" style="background:#f59e0b"></span><span><strong>YELLOW 75–89 %</strong> — Monitor, plan improvements</span></div>
      <div class="g-band"><span class="g-band-dot" style="background:#f97316"></span><span><strong>ORANGE 51–74 %</strong> — Action required within 30 days</span></div>
      <div class="g-band"><span class="g-band-dot" style="background:#ef4444"></span><span><strong>RED below 51 %</strong> — Critical, immediate corrective action</span></div>
      <p style="margin-top:8px;font-size:11px;color:var(--muted)">The <em>Projected score</em> updates live as you mark items Fixed. The <em>Baseline</em> is the original audit score.</p>
    </div>
    <div class="g-section">
      <h4>Column guide</h4>
      <ul>
        <li><strong>Criteria / Requirement</strong> — The specific clause or standard being assessed.</li>
        <li><strong>Audit Finding</strong> — The auditor's observation recorded at inspection.</li>
        <li><strong>AST Rejection Note</strong> — Any rejection feedback received from AST on re-submission.</li>
        <li><strong>Status</strong> — Open &rarr; In Progress &rarr; Fixed &rarr; N/A.</li>
        <li><strong>Notes / Action</strong> — Corrective action taken, assigned owner, and target completion date.</li>
      </ul>
    </div>
    <div class="g-section">
      <h4>Priority dots</h4>
      <div class="g-band"><span class="g-band-dot" style="background:#A82A1E"></span><span><strong>High</strong> — Legal or safety-critical risk</span></div>
      <div class="g-band"><span class="g-band-dot" style="background:#9A6A0A"></span><span><strong>Medium</strong> — Significant gap, address within 30 days</span></div>
    </div>
    <div class="g-section">
      <h4>Tips</h4>
      <div class="g-tip">
        Address <strong>High priority</strong> (red dot) items first — they carry the greatest legal and compliance risk.<br><br>
        Always record the <strong>owner and target date</strong> in the Notes field, not just the action description.<br><br>
        Your data is saved in <strong>this browser only</strong>. If you share the file with someone else, they start fresh — their changes do not affect yours.
      </div>
    </div>
  </div>
</div>
<script>
const SECTIONS = ${sectionsJson};
const TOTAL_APPLICABLE = ${totalApplicable};
const ORIG_PASS = ${origPass};
const ORIG_APPLICABLE = ${origApplicable};
const BASELINE = ${baselineScore};
const KEY = '${storageKey}';

function loadState(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); } catch{ return {}; } }
function saveState(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
let state = loadState();
function getStatus(id)     { return state[id]?.status     ||'open'; }
function getNotes(id)      { return state[id]?.notes      ||''; }
function getRejection(id)  { return state[id]?.rejection  ||''; }
function setStatus(id,v)    { state[id]={...(state[id]||{}),status:v};    saveState(state); updateScore(); applyFilters(); }
function setNotes(id,v)     { state[id]={...(state[id]||{}),notes:v};     saveState(state); }
function setRejection(id,v) { state[id]={...(state[id]||{}),rejection:v}; saveState(state); }

function render(){
  const c=document.getElementById('content'); c.innerHTML='';
  SECTIONS.forEach(sec=>{
    const g=document.createElement('div'); g.className='section-group'; g.dataset.section=sec.id;
    const h=document.createElement('div'); h.className='section-head';
    h.innerHTML='<h2>'+sec.label+'</h2><div class="s-stats" id="stats-'+sec.id+'"></div><span class="chevron">▾</span>';
    h.onclick=()=>{ const b=document.getElementById('tbody-'+sec.id).closest('.tbl-wrap'); const col=h.classList.toggle('collapsed'); b.style.display=col?'none':''; };
    const w=document.createElement('div'); w.className='tbl-wrap';
    w.innerHTML='<table><thead><tr><th class="col-num">#</th><th class="col-ref">Ref</th><th>Criteria / Requirement</th><th>Audit Finding</th><th>AST Rejection Note</th><th class="col-status">Status</th><th>Notes / Action</th></tr></thead><tbody id="tbody-'+sec.id+'"></tbody></table>';
    g.appendChild(h); g.appendChild(w); c.appendChild(g);
    const tb=document.getElementById('tbody-'+sec.id);
    sec.items.forEach(item=>{
      const tr=document.createElement('tr');
      tr.className='p-'+item.priority; tr.dataset.id=item.id; tr.dataset.section=sec.id;
      tr.dataset.criteria=item.criteria.toLowerCase(); tr.dataset.comment=(item.comment||'').toLowerCase();
      const st=getStatus(item.id); const nt=getNotes(item.id); const rj=getRejection(item.id);
      tr.innerHTML='<td class="num"><span class="dot"></span>'+item.id+'</td>'
        +'<td style="font-size:9px;color:var(--muted);white-space:nowrap">'+escH(item.ref)+'</td>'
        +'<td class="criteria">'+escH(item.criteria)+'</td>'
        +'<td class="comment">'+escH(item.comment)+'</td>'
        +'<td class="rejection-cell"><textarea class="notes-in rejection-in" rows="2" data-id="'+item.id+'" placeholder="Rejection note from AST…" onchange="rejectionChanged(this)">'+escH(rj)+'</textarea></td>'
        +'<td class="status-cell"><select class="status-sel s-'+st+'" data-id="'+item.id+'" onchange="statusChanged(this)">'
        +'<option value="open" '+(st==='open'?'selected':'')+'>Open</option>'
        +'<option value="wip" '+(st==='wip'?'selected':'')+'>In Progress</option>'
        +'<option value="done" '+(st==='done'?'selected':'')+'>Fixed ✓</option>'
        +'<option value="na" '+(st==='na'?'selected':'')+'>N/A</option>'
        +'</select></td>'
        +'<td class="notes-cell"><textarea class="notes-in" rows="2" data-id="'+item.id+'" placeholder="Action / owner / date…" onchange="notesChanged(this)">'+escH(nt)+'</textarea></td>';
      tb.appendChild(tr);
    });
  });
  updateScore();
}
function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function statusChanged(sel){ const id=sel.dataset.id; sel.className='status-sel s-'+sel.value; setStatus(id,sel.value); toast(id+' → '+sel.options[sel.selectedIndex].text); }
function notesChanged(ta)     { setNotes(ta.dataset.id,ta.value); }
function rejectionChanged(ta) { setRejection(ta.dataset.id,ta.value); }

function updateScore(){
  let done=0,wip=0,open=0,na=0;
  SECTIONS.forEach(sec=>{
    let sd=0,sw=0,so=0,sna=0;
    sec.items.forEach(item=>{
      const st=getStatus(item.id);
      if(st==='done'){done++;sd++;} else if(st==='wip'){wip++;sw++;} else if(st==='na'){na++;sna++;} else{open++;so++;}
    });
    const el=document.getElementById('stats-'+sec.id);
    if(el) el.innerHTML=(so?'<span class="pill pill-fail">'+so+' open</span>':'')+
      (sw?'<span class="pill pill-wip">'+sw+' wip</span>':'')+
      (sd?'<span class="pill pill-pass">'+sd+' fixed</span>':'')+
      (sna?'<span class="pill pill-na">'+sna+' n/a</span>':'');
  });
  const applicable=TOTAL_APPLICABLE-na;
  const pct=applicable>0?Math.round((done/applicable)*100):0;
  const newPass=ORIG_PASS+done;
  const projectedScore=ORIG_APPLICABLE?Math.round((newPass/ORIG_APPLICABLE)*100*100)/100:0;
  const rf=document.getElementById('ringFill'),rp=document.getElementById('ringPct'),rt=document.getElementById('ringTag'),se=document.getElementById('scoreMeta'),pb=document.getElementById('progBar');
  const circ=169.6; rf.style.strokeDashoffset=circ-(projectedScore/100)*circ;
  let color,tag;
  if(projectedScore>=90){color='#22c55e';tag='GREEN';} else if(projectedScore>=75){color='#f59e0b';tag='YELLOW';} else if(projectedScore>=51){color='#f97316';tag='ORANGE';} else{color='#ef4444';tag='RED';}
  rf.style.stroke=color; rp.style.color=color; rp.textContent=projectedScore.toFixed(1)+'%'; rt.textContent=tag; rt.style.color=color;
  pb.style.width=pct+'%'; pb.style.background=color;
  const sub=state._submission;
  const subLine=sub?'Submitted: <strong style="color:var(--green)">'+sub.score.toFixed(1)+'% ('+sub.tag+')</strong> on '+fmtDate(sub.at)+'<br>':'';
  se.innerHTML='Projected score: <strong>'+projectedScore.toFixed(1)+'%</strong> ('+tag+')<br>'
    +'Baseline audit: <strong>'+BASELINE+'%</strong><br>'
    +subLine
    +'Fixed: <strong style="color:var(--green)">'+done+'</strong> / '+TOTAL_APPLICABLE
    +' &nbsp;WIP: <strong style="color:var(--amber)">'+wip+'</strong>'
    +' &nbsp;Open: <strong style="color:var(--red)">'+open+'</strong>';
}

function fmtDate(iso){ const d=new Date(iso); return d.toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})+' '+d.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}); }

function applyFilters(){
  const sec=document.getElementById('filterSection').value;
  const st=document.getElementById('filterStatus').value;
  const q=document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.section-group').forEach(grp=>{
    const gid=grp.dataset.section; let any=false;
    grp.querySelectorAll('tbody tr').forEach(tr=>{
      const ms=!sec||tr.dataset.section===sec;
      const mst=!st||getStatus(tr.dataset.id)===st;
      const mq=!q||tr.dataset.criteria.includes(q)||tr.dataset.comment.includes(q)||tr.dataset.id.toLowerCase().includes(q);
      const show=ms&&mst&&mq; tr.classList.toggle('hidden',!show); if(show) any=true;
    });
    grp.style.display=(!sec||gid===sec)?'':'none';
  });
}
document.getElementById('filterSection').onchange=applyFilters;
document.getElementById('filterStatus').onchange=applyFilters;
document.getElementById('search').oninput=applyFilters;

function resetAll(){
  if(!confirm('Reset all statuses and notes?')) return;
  state={}; saveState(state); render(); renderSubmission(); toast('Reset.');
}

function submitFile(){
  let done=0,applicable=0;
  SECTIONS.forEach(s=>s.items.forEach(i=>{ const st=getStatus(i.id); if(st!=='na') applicable++; if(st==='done') done++; }));
  const pct=parseFloat(document.getElementById('ringPct').textContent);
  const tag=document.getElementById('ringTag').textContent;
  const lbl=state._submission?'Re-submit':'Submit';
  if(!confirm(lbl+' this action plan at '+pct.toFixed(1)+'% ('+tag+')?\\n\\nThis records the current score and date for AST.')) return;
  state._submission={at:new Date().toISOString(),score:pct,tag,done,applicable};
  saveState(state); renderSubmission(); updateScore();
  toast('Submitted at '+pct.toFixed(1)+'%');
}

function renderSubmission(){
  const banner=document.getElementById('submitBanner');
  const btn=document.getElementById('btnSubmit');
  const sub=state._submission;
  if(!sub){ banner.style.display='none'; if(btn) btn.textContent='Submit to AST'; return; }
  document.getElementById('sbDetail').textContent='Submitted '+fmtDate(sub.at)+' · '+sub.done+' of '+sub.applicable+' items resolved';
  document.getElementById('sbScorePill').textContent=sub.score.toFixed(1)+'% '+sub.tag;
  banner.style.display='flex'; if(btn) btn.textContent='Re-Submit';
}

let _tt;
function toast(msg){ const e=document.getElementById('toast'); e.textContent=msg; e.classList.add('show'); clearTimeout(_tt); _tt=setTimeout(()=>e.classList.remove('show'),2200); }

function toggleGuide(){
  document.getElementById('guidePanel').classList.toggle('open');
  document.getElementById('guideOverlay').classList.toggle('open');
}

render();
renderSubmission();
</script>
</body>
</html>`;
}

function safPrintReport(){
  const id=document.getElementById('saf-detail-content')?.dataset?.fileId;
  if(!id){toast('No file open','err');return;}
  toast('Opening print dialog…','ok');
  setTimeout(()=>window.print(),400);
}

/* ── download full safety file report pack ───────────── */

async function safDownloadPack(id){
  if(!id||id==='_new_'||id==='null'){toast('No file open','err');return;}
  let file=proxyDB.safetyFiles.find(f=>f.id===id);
  if(!file){toast('File not found','err');return;}
  if(!file.sections){
    const r=await api('GET','safety.php?id='+id);
    if(!r.success){toast(r.error||'Could not load file','err');return;}
    const full=normalizeSafetyFile(r.data);
    const raw=DB.safetyFiles.find(f=>(f.ref_id||f.id)===id);
    if(raw) raw.sections=r.data.sections;
    file=full;
  }

  const {score,mainScore,bonusScore,std,notStd,na,total,bApplicable,completionPct}=safCalcScore(file);
  const band=safBand(score);
  const scoreDisp=score!==null?Math.round(score)+' pts':'—';
  const bonusDisp=bApplicable?'+'+Math.round(bonusScore*10)/10+' pts':'';
  const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // Summary rows
  let sumRows='';
  SAFETY_SECTIONS.forEach(sec=>{
    const items=file.sections[sec.key]||[];
    let t=0,n=0,s2=0,ns=0;
    items.forEach(i=>{ t++; if(i.result==='N/A') n++; else if(i.result==='To Standard') s2++; else if(i.result==='Not to Standard') ns++; });
    sumRows+=`<tr${sec.bonus?' style="background:#fffdf0"':''}>
      <td>${e(sec.title)}${sec.bonus?' <span class="bonus-tag">Bonus</span>':''}</td>
      <td class="num">${t}</td><td class="num">${n}</td><td class="num red">${ns}</td><td class="num grn">${s2}</td>
    </tr>`;
  });

  // Action plan rows
  let apRows='';let apCount=0;
  SAFETY_SECTIONS.forEach(sec=>{
    const saved=file.sections[sec.key]||[];
    sec.items.forEach((item,idx)=>{
      const sv=saved[idx]||{};
      if(sv.result==='Not to Standard'){
        apCount++;
        apRows+=`<tr>
          <td>${e(sec.key+'.'+item.no)}</td>
          <td>${e(item.ref||'')}</td>
          <td>${e(item.criteria)}</td>
          <td>${e(sv.comments||'')}</td>
          <td class="ap-status ap-${(sv.apStatus||'Open').toLowerCase().replace(/ /g,'-')}">${e(sv.apStatus||'Open')}</td>
        </tr>`;
      }
    });
  });

  // Full checklist
  let checkHtml='';
  SAFETY_SECTIONS.forEach(sec=>{
    const saved=file.sections[sec.key]||[];
    checkHtml+=`<div class="sec-block${sec.bonus?' sec-bonus':''}">
      <div class="sec-hdr">${e(sec.title)}${sec.bonus?' <span class="bonus-tag">Bonus +10%</span>':''}</div>
      <table><thead><tr><th>#</th><th>Ref</th><th>Criteria</th><th>Result</th>${sec.key==='H'?'<th>Appointee</th>':''}<th>Comments</th></tr></thead><tbody>`;
    sec.items.forEach((item,idx)=>{
      const sv=saved[idx]||{};
      const rc=sv.result==='To Standard'?'grn':sv.result==='Not to Standard'?'red':sv.result==='N/A'?'muted':'';
      checkHtml+=`<tr><td class="num">${item.no}</td><td class="ref">${e(item.ref||'')}</td><td>${e(item.criteria)}</td>
        <td class="${rc}">${e(sv.result||'—')}</td>${sec.key==='H'?`<td>${e(sv.appointee||'')}</td>`:''}
        <td class="comment">${e(sv.comments||'')}</td></tr>`;
    });
    checkHtml+='</tbody></table></div>';
  });

  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Safety File Report — ${e(file.contractor||id)} — ${e(id)}</title>
<style>
:root{--accent:#C94A10;--red:#A82A1E;--grn:#1A6633;--amber:#9A6A0A;--bg:#F5F1EA;--surface:#fff;--border:#C8C1B3;--muted:#7A7566;--text:#1A1814}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;font-size:12px;background:var(--bg);color:var(--text);padding:24px}
h1{font-size:18px;font-weight:700;color:var(--accent);margin-bottom:4px}
.sub{font-size:11px;color:var(--muted);margin-bottom:20px}
.cover{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:16px;margin-bottom:16px}
.cover-row{display:flex;flex-direction:column;gap:2px}
.cover-lbl{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.cover-val{font-size:12px;font-weight:500}
.score-box{grid-column:span 2;display:flex;align-items:center;gap:16px;padding:12px;border-top:1px solid var(--border);margin-top:4px}
.score-pill{font-size:22px;font-weight:700;padding:8px 20px;border-radius:30px;border:2px solid currentColor}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:6px;margin-bottom:16px;overflow:hidden}
.panel-hdr{padding:10px 14px;border-bottom:1px solid var(--border);font-weight:700;font-size:12px;background:#f9f7f3}
table{border-collapse:collapse;width:100%}
th{background:#f0ece4;padding:7px 10px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid var(--border)}
td{padding:6px 10px;border-bottom:1px solid #ede8de;vertical-align:top;font-size:11px}
td.num{text-align:center;width:56px;color:var(--muted);font-weight:600}
td.ref{white-space:nowrap;width:70px;color:var(--muted)}
td.comment{max-width:200px;color:var(--muted);font-style:italic}
td.red{color:var(--red);font-weight:600}
td.grn{color:var(--grn);font-weight:600}
td.muted{color:var(--muted)}
.sec-block{margin-bottom:20px}
.sec-block.sec-bonus{opacity:.9}
.sec-hdr{font-weight:700;font-size:12px;padding:8px 12px;background:#f0ece4;border:1px solid var(--border);border-radius:4px 4px 0 0;color:var(--accent)}
.sec-block table{border:1px solid var(--border);border-top:none;border-radius:0 0 4px 4px}
.bonus-tag{font-size:9px;font-weight:700;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:10px;border:1px solid #fcd34d;margin-left:6px;text-transform:uppercase;letter-spacing:.04em}
.ap-status{font-weight:600;font-size:10px;text-transform:uppercase}
.ap-open{color:var(--red)}.ap-in-progress{color:var(--amber)}.ap-resolved{color:var(--grn)}
.saf-band-A{color:var(--grn)}.saf-band-B{color:#2d6a4f}.saf-band-C{color:var(--amber)}.saf-band-D{color:#b45309}.saf-band-E{color:var(--red)}
@media print{body{padding:8px}h1{font-size:15px}.cover{page-break-inside:avoid}.sec-block{page-break-inside:avoid}}
</style>
</head>
<body>
<h1>BlackFire Safety File — ${e(id)}</h1>
<div class="sub">Generated ${new Date().toLocaleString('en-ZA')} &nbsp;|&nbsp; BF-SHE-FRM-010 Rev 01</div>

<div class="cover">
  <div class="cover-row"><span class="cover-lbl">Contractor</span><span class="cover-val">${e(file.contractor||'—')}</span></div>
  <div class="cover-row"><span class="cover-lbl">Contractor Rep</span><span class="cover-val">${e(file.contractorRep||'—')}</span></div>
  <div class="cover-row"><span class="cover-lbl">16.2 Appointee</span><span class="cover-val">${e(file.appointee162||'—')}</span></div>
  <div class="cover-row"><span class="cover-lbl">Audit Team</span><span class="cover-val">${e(file.auditTeam||'—')}</span></div>
  <div class="cover-row"><span class="cover-lbl">Audit Date</span><span class="cover-val">${file.auditDate?new Date(file.auditDate+'T00:00:00').toLocaleDateString('en-ZA'):'—'}</span></div>
  <div class="cover-row"><span class="cover-lbl">Region / Site</span><span class="cover-val">${e(file.region||'—')}</span></div>
  <div class="cover-row"><span class="cover-lbl">Scope of Work</span><span class="cover-val">${e(file.scopeOfWork||'—')}</span></div>
  <div class="cover-row"><span class="cover-lbl">Manpower</span><span class="cover-val">${file.manpower||0} total</span></div>
  <div class="cover-row"><span class="cover-lbl">Auditor</span><span class="cover-val">${e(file.auditorName||'—')}</span></div>
  <div class="cover-row"><span class="cover-lbl">Status</span><span class="cover-val">${e(file.status||'Draft')}</span></div>
  <div class="score-box">
    <div class="score-pill ${band.cls}">${scoreDisp}</div>
    <div>
      <div style="font-weight:700;font-size:14px;color:var(--accent)">${e(band.label)}</div>
      <div style="font-size:11px;color:var(--muted)">${bonusDisp?'Main '+Math.round(mainScore)+' pts A–H &nbsp;|&nbsp; Bonus '+bonusDisp+' &nbsp;|&nbsp; ':''}Completion: ${completionPct}%</div>
      ${band.note?`<div style="font-size:11px;color:var(--muted);margin-top:2px">${e(band.note)}</div>`:''}
    </div>
  </div>
</div>

<div class="panel">
  <div class="panel-hdr">Summary of Compliance</div>
  <table>
    <thead><tr><th>Section</th><th class="num">Total</th><th class="num">N/A</th><th class="num">Not to Std</th><th class="num">To Std</th></tr></thead>
    <tbody>${sumRows}</tbody>
    <tfoot><tr style="font-weight:700;background:#f0ece4"><td>Total</td><td class="num">${total}</td><td class="num">${na}</td><td class="num red">${notStd}</td><td class="num grn">${std}</td></tr></tfoot>
  </table>
</div>

${apCount?`<div class="panel">
  <div class="panel-hdr">Action Plan — ${apCount} Item${apCount===1?'':'s'} Not to Standard${band.actionDays?' &nbsp;|&nbsp; Action required within '+band.actionDays+' days':''}</div>
  <table>
    <thead><tr><th>Item</th><th>Ref</th><th>Criteria</th><th>Findings</th><th>Status</th></tr></thead>
    <tbody>${apRows}</tbody>
  </table>
</div>`:''}

<div style="margin-top:8px;margin-bottom:12px;font-weight:700;font-size:13px;color:var(--accent)">Full Compliance Checklist</div>
${checkHtml}
</body>
</html>`;

  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=id+'_Safety_File_Report.html';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},2000);
  toast('Safety file report downloaded','ok');
}

/* ── approve ────────────────────────────────────────── */

async function approveSafetyFile(){
  const id=document.getElementById('saf-detail-content')?.dataset?.fileId;
  if(!id){toast('No file open','err');return;}
  const file=proxyDB.safetyFiles.find(f=>f.id===id);
  if(!file){toast('File not found','err');return;}
  if(!confirm(`Approve safety file ${id} for ${file.contractor||'this contractor'}?\n\nThis will change the status to Approved.`)) return;
  const r=await api('PUT','safety.php?id='+id,{action:'approve'});
  if(!r.success){toast(r.error||'Approval failed','err');return;}
  const raw=DB.safetyFiles.find(f=>(f.ref_id||f.id)===id);
  if(raw) raw.status='Approved';
  toast(id+' approved','ok');
  renderSafetyFiles();
  updateBadges();
  // Refresh the detail header status text and button state
  const sub=document.getElementById('saf-detail-sub');
  if(sub) sub.textContent=sub.textContent.replace(/^[A-Z ]+(?=\s·)/,'APPROVED');
  _safUpdateApproveBtn(id);
}

function _safUpdateApproveBtn(fileId){
  const btn=document.getElementById('saf-approve-btn');
  if(!btn) return;
  const file=proxyDB.safetyFiles.find(f=>f.id===fileId);
  const st=file?.status||'';
  btn.style.display=(st==='Submitted'||st==='In Progress')?'inline-flex':'none';
}

function _safUpdateDeactivateBtn(fileId){
  const btn=document.getElementById('saf-deactivate-btn');
  if(!btn) return;
  const canDel=can('security.users')||can('safety.delete');
  btn.style.display=canDel&&fileId?'inline-flex':'none';
}

async function deactivateSafetyFile(){
  const id=document.getElementById('saf-detail-content')?.dataset?.fileId;
  const file=id?proxyDB.safetyFiles.find(f=>f.id===id):null;
  if(!file){toast('No file open','err');return;}
  if(!confirm('Deactivate safety file '+id+' for '+esc(file.contractor||'this contractor')+'?\n\nThe record will be hidden from the list but retained for audit purposes.\nContact an administrator to restore it if needed.')) return;
  const r=await api('DELETE','safety.php?id='+encodeURIComponent(id),{});
  if(!r.success){toast(r.error||'Failed to deactivate','err');return;}
  const idx=DB.safetyFiles.findIndex(f=>(f.ref_id||f.id)===id);
  if(idx!==-1) DB.safetyFiles.splice(idx,1);
  toast(id+' deactivated — record retained for audit','info');
  showPortalPage('p-safety',null);
  renderSafetyFiles();
  updateBadges();
}

/* ── attachments (detail view) ──────────────────────── */

async function safLoadAttachments(fileId){
  const r=await api('GET',`files.php?action=list&entity_type=safety_file&entity_ref=${encodeURIComponent(fileId)}`);
  return r.success?(r.data?.attachments||r.attachments||[]):[];
}

function safRenderAttachments(fileId, attachments){
  const panel=document.getElementById('saf-att-panel');
  if(!panel) return;
  if(!attachments.length){
    panel.innerHTML=`<div class="saf-att-empty">No documents uploaded yet. Use the button above to attach supporting documents.</div>`;
    return;
  }
  function fmtSize(b){ return b>1048576?(b/1048576).toFixed(1)+' MB':(b/1024).toFixed(0)+' KB'; }
  function rowHtml(a){
    return `<div class="saf-att-row">
      <span class="saf-att-icon">${a.mime_type==='application/pdf'?'📄':a.mime_type?.includes('image')?'🖼':'📁'}</span>
      <span class="saf-att-name">${esc(a.original_name)}</span>
      <span class="saf-att-meta">${fmtSize(a.file_size)} · ${esc(a.uploaded_by)} · ${fmtD(a.created_at?.split(' ')[0])}</span>
      ${(a.mime_type==='application/pdf'||a.mime_type?.startsWith('image/'))?`<button class="btn btn-g btn-xs" data-action="openDocViewer" data-id="${a.id}" data-name="${esc(a.original_name)}" data-mime="${esc(a.mime_type)}">&#128065; View</button>`:''}
      <a class="btn btn-g btn-xs saf-att-dl" href="api/files.php?action=download&id=${a.id}" download="${esc(a.original_name)}">&#8595; Download</a>
      <button class="btn btn-xs saf-att-del" data-action="safDeleteAttachment" data-id="${a.id}" data-file-id="${esc(fileId)}">&#10005;</button>
    </div>`;
  }
  // Build a key→title lookup from the global section list
  const secTitles = {};
  SAFETY_SECTIONS.forEach(s=>{ secTitles[s.key]=s.title; });
  // Group by section: first char A-I + second char is digit
  const groups={}, general=[];
  const secRecords={}; // section key → combined sign-off attachment (A00_record_* naming)
  attachments.forEach(a=>{
    const n=a.original_name||'';
    const k=n[0]?.toUpperCase();
    if(k&&/[A-I]/.test(k)&&/\d/.test(n[1]||'')){
      // Identify section sign-off record: second and third chars are "00"
      if(n[1]==='0'&&n[2]==='0'){
        secRecords[k]=a; // only one section sign-off per section
      } else {
        if(!groups[k]) groups[k]=[];
        groups[k].push(a);
      }
    } else general.push(a);
  });
  let html='';
  Object.keys(groups).sort().forEach(k=>{
    html+=`<div class="saf-att-sec-hdr">${esc(secTitles[k]||'Section '+k)}<span class="saf-att-sec-count">${groups[k].length}</span></div>`;
    html+=groups[k].map(rowHtml).join('');
  });
  if(general.length){
    if(Object.keys(groups).length) html+=`<div class="saf-att-sec-hdr">General / Unclassified<span class="saf-att-sec-count">${general.length}</span></div>`;
    html+=general.map(rowHtml).join('');
  }
  panel.innerHTML=html;
  // Update section sign-off cells in the compliance summary table
  SAFETY_SECTIONS.forEach(sec=>{
    const cell=document.getElementById('saf-sec-doc-'+sec.key);
    if(!cell) return;
    const rec=secRecords[sec.key];
    if(rec){
      const canView=rec.mime_type==='application/pdf'||rec.mime_type?.startsWith('image/');
      cell.innerHTML=`<span class="saf-sec-doc-link">
        ${canView?`<button class="btn btn-g btn-xs" data-action="openDocViewer" data-id="${rec.id}" data-name="${esc(rec.original_name)}" data-mime="${esc(rec.mime_type||'')}">&#128065; View</button>`:''}
        <a class="btn btn-g btn-xs" href="api/files.php?action=download&id=${rec.id}" download="${esc(rec.original_name)}">&#8595; Download</a>
        <button class="btn btn-xs saf-cs-del-btn" data-action="safDeleteAttachment" data-id="${rec.id}" data-file-id="${esc(fileId)}" title="Remove sign-off document">&#10005;</button>
      </span>`;
    } else {
      cell.innerHTML=`<input type="file" id="saf-sec-file-${sec.key}" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" data-action="safSectionUpload" data-file-id="${esc(fileId)}" data-section-key="${sec.key}"><button class="btn btn-g btn-xs saf-sec-doc-btn" data-action="triggerFileInput" data-target-id="saf-sec-file-${sec.key}" title="Upload combined sign-off for all employees">&#128196; Upload</button>`;
    }
  });
}

async function safDetailUpload(input){
  const fileId=document.getElementById('saf-detail-content')?.dataset?.fileId;
  if(!fileId){toast('No file open','err');return;}
  const file=proxyDB.safetyFiles.find(f=>f.id===fileId);
  if(!file||fileId==='_new_'){toast('Save the audit before uploading','err');input.value='';return;}
  if(!input.files.length) return;
  let uploaded=0;
  for(const f of input.files){
    const finalName = await safRenameModal(_safSlugifyName(f.name)+'.'+f.name.split('.').pop().toLowerCase(), f.name);
    if(finalName===null){ input.value=''; return; }
    const renamed = new File([f], finalName, {type: f.type});
    const fd=new FormData();
    fd.append('entity_type','safety_file');
    fd.append('entity_ref', fileId);
    fd.append('file', renamed);
    const r=await _safUploadFd(fd);
    if(r.success) uploaded++;
    else toast('Upload failed: '+esc(f.name),'err');
  }
  if(uploaded) toast(uploaded+' document(s) uploaded','ok');
  input.value='';
  const atts=await safLoadAttachments(fileId);
  safRenderAttachments(fileId, atts);
}

async function safDeleteAttachment(attId, fileId){
  if(!confirm('Remove this document from the safety file?')) return;
  const r=await api('DELETE','files.php?id='+attId);
  if(!r.success){toast(r.error||'Delete failed','err');return;}
  toast('Document removed','ok');
  const atts=await safLoadAttachments(fileId);
  safRenderAttachments(fileId, atts);
}

/* ── section combined sign-off upload ───────────────── */

async function safSectionUpload(input, fileId, sectionKey){
  const f=input.files[0];
  if(!f){input.value='';return;}
  const file=proxyDB.safetyFiles.find(x=>x.id===fileId);
  if(!file||fileId==='_new_'){toast('Save the audit before uploading','err');input.value='';return;}
  const ext=f.name.split('.').pop().toLowerCase();
  const canonName=sectionKey+'00_record_section-combined-signoff.'+ext;
  const renamed=new File([f],canonName,{type:f.type});
  const fd=new FormData();
  fd.append('file',renamed);
  fd.append('entity_type','safety_file');
  fd.append('entity_ref',fileId);
  toast('Uploading section record…','info');
  try{
    const r=await _safUploadFd(fd);
    if(!r.success){toast(r.error||'Upload failed','err');input.value='';return;}
    toast('Section '+sectionKey+' sign-off document uploaded','ok');
    const atts=await safLoadAttachments(fileId);
    safRenderAttachments(fileId,atts);
  }catch(e){toast('Upload error: '+e.message,'err');}
  input.value='';
}

/* ── personnel & compliance ─────────────────────────── */

const COMPLIANCE_TYPES=[
  {type:'AECI Site Induction',        category:'Induction',     scope:'Person',  months:12},
  {type:'First Aid Certificate',      category:'Certification', scope:'Person',  months:36},
  {type:'Fire Fighting Certificate',  category:'Certification', scope:'Person',  months:24},
  {type:'Working at Heights',         category:'Certification', scope:'Person',  months:24},
  {type:'Confined Space Entry',       category:'Certification', scope:'Person',  months:24},
  {type:'COIDA Good Standing',        category:'Submission',    scope:'Company', months:12},
  {type:'Public Liability Insurance', category:'Permit',        scope:'Company', months:12},
  {type:'H&S Policy Review',          category:'Policy',        scope:'Company', months:12},
  {type:'Risk Assessment Review',     category:'Submission',    scope:'Company', months:12},
  {type:'Legal Appointment (16.2)',   category:'Submission',    scope:'Company', months:0},
];

function _complianceStatus(expiryDate){
  if(!expiryDate) return {label:'No Expiry',cls:'saf-cs-none',days:null};
  const today=new Date(); const exp=new Date(expiryDate);
  today.setHours(0,0,0,0); exp.setHours(0,0,0,0);
  const days=Math.round((exp-today)/86400000);
  if(days<0)   return {label:'Overdue', cls:'saf-cs-overdue',days};
  if(days<=30) return {label:'Due Soon',cls:'saf-cs-soon',   days};
  return {label:'Current',cls:'saf-cs-ok',days};
}

/* Personnel */

async function safLoadPersonnel(fileId){
  const r=await api('GET','safety_personnel.php?file_ref='+encodeURIComponent(fileId));
  return r.success?(r.data||[]):[];
}

function safRenderPersonnel(fileId,people){
  const panel=document.getElementById('saf-personnel-panel');
  if(!panel) return;
  const active=people.filter(p=>p.is_active==1);
  const gone  =people.filter(p=>p.is_active==0);

  const activeRows=active.map(p=>{
    const portalTick = p.portal_user_id
      ? `<span class="saf-portal-tick" title="Has portal account">&#10003;</span>`
      : '';
    const actionBtns = p.portal_user_id
      ? `<button class="btn btn-g btn-xs" data-action="safPersonnelSendPolicy" data-id="${p.id}" title="Send policy">&#9993;</button>
         <button class="btn btn-xs saf-cs-del-btn" data-action="safUnlinkUser" data-id="${p.portal_user_id}" data-file-id="${esc(fileId)}" data-name="${esc(p.full_name)}" title="Unlink portal account">&#10005;</button>`
      : `<button class="btn btn-g btn-xs" data-action="safPersonnelSendPolicy" data-id="${p.id}" title="Send policy">&#9993;</button>
         <button class="btn btn-g btn-xs" data-action="safRemovePerson" data-id="${p.id}" data-file-id="${esc(fileId)}" data-name="${esc(p.full_name)}">Remove</button>`;
    return `<tr>
    <td>${esc(p.full_name)}</td>
    <td>${esc(p.id_number||'—')}</td>
    <td>${esc(p.role)}</td>
    <td>${esc(p.company||'—')}</td>
    <td>${p.email?`<a href="mailto:${esc(p.email)}" class="text-accent">${esc(p.email)}</a>`:'<span class="text-muted">—</span>'}</td>
    <td class="saf-portal-col">${portalTick}</td>
    <td>${actionBtns}</td>
  </tr>`;
  }).join('');

  let formerHtml='';
  if(gone.length){
    const rows=gone.map(p=>`<tr class="saf-prs-inactive-row">
      <td>${esc(p.full_name)}</td>
      <td>${esc(p.id_number||'—')}</td>
      <td>${esc(p.role)}</td>
      <td>${esc(p.company||'—')}</td>
      <td>${p.removed_at?fmtD(p.removed_at):'—'}</td>
      <td>${esc(p.removed_reason||'—')}</td>
      <td><button class="btn btn-g btn-xs" data-action="safReinstatePerson" data-id="${p.id}" data-file-id="${esc(fileId)}">Reinstate</button></td>
    </tr>`).join('');
    formerHtml=`<details class="saf-former-toggle mt1">
      <summary>Former Personnel (${gone.length}) — retained for audit</summary>
      <div class="tw mt1"><table class="saf-prs-tbl">
        <thead><tr><th>Name</th><th>ID/Passport</th><th>Role</th><th>Company</th><th>Removed</th><th>Reason</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </details>`;
  }

  panel.innerHTML=active.length?`
    <div class="tw"><table class="saf-prs-tbl">
      <thead><tr><th>Name</th><th>ID / Passport</th><th>Role</th><th>Company</th><th>Email</th><th class="saf-portal-col">Portal</th><th></th></tr></thead>
      <tbody>${activeRows}</tbody>
    </table></div>${formerHtml}`
    :`<div class="saf-att-empty">No active people on file.${gone.length?' See former personnel below.':''}</div>${formerHtml}`;
  _safPersonnelCache = people;
  _safLinkedUsersCache = active.filter(p => p.portal_user_id).map(p => ({ user_id: p.portal_user_id, name: p.full_name, role: p.role, title: p.role }));
  safUpdateComplianceHealth();
}

async function safAddPersonnel(fileId){
  // Gather existing names from all safety files for datalist suggestions
  const existing=[...new Set(
    (proxyDB.safetyFiles||[]).flatMap(f=>(f._personnel||[]).map(p=>p.full_name)).filter(Boolean)
      .concat((_safPersonnelCache||[]).map(p=>p.full_name))
  )];
  const dlOpts=existing.map(n=>`<option value="${esc(n)}">`).join('');
  openModal('Add Person to Safety File',`
    <div class="fgrid">
      <div class="fgroup ffull"><label class="flbl">Full Name <span class="text-ember">*</span></label>
        <input class="finput" id="prs-name" list="prs-name-dl" placeholder="Type or select name" autofocus autocomplete="off">
        <datalist id="prs-name-dl">${dlOpts}</datalist>
        <small class="flbl text-muted">Select existing or type a new name to create a new record</small></div>
      <div class="fgroup"><label class="flbl">ID / Passport No.</label>
        <input class="finput" id="prs-id" placeholder="8001015009087"></div>
      <div class="fgroup"><label class="flbl">Role <span class="text-ember">*</span></label>
        <select class="finput" id="prs-role">
          <option>Employee</option><option>Subcontractor</option><option>Supervisor</option>
          <option>SHE Rep</option><option>First Aider</option><option>Other</option>
        </select></div>
      <div class="fgroup ffull"><label class="flbl">Company (if different from contractor)</label>
        <input class="finput" id="prs-co" list="prs-co-dl" placeholder="Leave blank if same as contractor" autocomplete="off">
        <datalist id="prs-co-dl">${[...new Set((proxyDB.safetyFiles||[]).map(f=>f.contractor).filter(Boolean))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist></div>
      <div class="fgroup ffull"><label class="flbl">Email (used for policy acknowledgments)</label>
        <input class="finput" id="prs-email" type="email" placeholder="person@company.co.za" autocomplete="off"></div>
    </div>
    <div class="mt2 flex-end"><button class="btn btn-p" data-action="safSavePersonnel" data-id="${fileId}">Add Person</button></div>
  `);
}

async function safSavePersonnel(fileId){
  const name=(document.getElementById('prs-name')?.value||'').trim();
  if(!name){toast('Name is required','err');return;}
  const idNo =(document.getElementById('prs-id')?.value||'').trim();
  const role = document.getElementById('prs-role')?.value||'Employee';
  const co   =(document.getElementById('prs-co')?.value||'').trim();
  const email=(document.getElementById('prs-email')?.value||'').trim();
  const r=await api('POST','safety_personnel.php',{file_ref:fileId,full_name:name,id_number:idNo,role,company:co,email});
  if(!r.success){toast(r.error||'Failed to add person','err');return;}
  toast('Person added');
  closeModalDirect();
  const people=await safLoadPersonnel(fileId);
  safRenderPersonnel(fileId,people);
}

async function safRemovePerson(id,fileId,name){
  openModal('Remove Person from File',`
    <p class="mb-12 text-muted">
      The record for <strong>${esc(name)}</strong> will be marked inactive but <em>kept for audit purposes</em>.<br>
      This complies with the BF-SHE-FRM-010 audit trail requirement.
    </p>
    <div class="fgroup ffull"><label class="flbl">Reason for removal <span class="text-ember">*</span></label>
      <input class="finput" id="prs-reason" placeholder="e.g. Left employment 2026-05-21" autofocus></div>
    <div class="mt2 flex-end">
      <button class="btn btn-g btn-s mr-8" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-remove-person"
        data-action="safConfirmRemovePerson" data-id="${id}" data-file-id="${esc(fileId)}" data-name="${esc(name)}">Remove from File</button>
    </div>
  `);
}

async function safConfirmRemovePerson(id,fileId,name){
  const reason=(document.getElementById('prs-reason')?.value||'').trim();
  if(!reason){toast('Reason is required','err');return;}
  const r=await api('PUT',`safety_personnel.php?id=${id}&action=remove`,{reason});
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast(name+' removed — record retained for audit','info');
  closeModalDirect();
  const people=await safLoadPersonnel(fileId);
  safRenderPersonnel(fileId,people);
}

async function safReinstatePerson(id,fileId){
  const r=await api('PUT',`safety_personnel.php?id=${id}&action=reinstate`,{});
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast('Person reinstated');
  const people=await safLoadPersonnel(fileId);
  safRenderPersonnel(fileId,people);
}

/* ── compliance health ───────────────────────────── */

let _safComplianceCache  = null;
let _safPersonnelCache   = null;
let _safLinkedUsersCache = null;

function _calcComplianceHealth(records, people, linkedUsers, file) {
  const today = new Date(); today.setHours(0,0,0,0);
  const blockers = [];

  // ── 1. Expired or due-soon certificates ─────────────
  records.forEach(rec => {
    if (!rec.expiry_date) return;
    const exp = new Date(rec.expiry_date); exp.setHours(0,0,0,0);
    const days = Math.round((exp - today) / 86400000);
    const who = rec.full_name ? rec.full_name : 'Company';
    if (days < 0) {
      blockers.push({
        severity: 'expired',
        label: `${rec.compliance_type} — ${who}`,
        detail: `Expired ${Math.abs(days)} day${Math.abs(days)!==1?'s':''} ago (${fmtD(rec.expiry_date)})`
      });
    } else if (days <= 30) {
      blockers.push({
        severity: 'due_soon',
        label: `${rec.compliance_type} — ${who}`,
        detail: `Expires in ${days} day${days!==1?'s':''} (${fmtD(rec.expiry_date)})`
      });
    }
  });

  const active = people.filter(p => p.is_active == 1);

  // ── 2. Active person missing AECI induction ──────────
  active.forEach(person => {
    const hasInduction = records.some(r => r.personnel_id == person.id && r.compliance_type === 'AECI Site Induction');
    if (!hasInduction) {
      blockers.push({
        severity: 'missing',
        label: `AECI induction missing — ${person.full_name}`,
        detail: `${person.role||'Employee'} must have a valid AECI Site Induction on file`
      });
    }
  });

  // ── 3. Linked portal user not on active roster ───────
  (linkedUsers || []).forEach(lu => {
    const onFile = people.some(p => p.portal_user_id == lu.user_id && p.is_active == 1);
    if (!onFile) {
      blockers.push({
        severity: 'missing',
        label: `Portal user not on safety file — ${lu.name}`,
        detail: `${lu.title||lu.role||'Portal user'} is linked but not in the active personnel roster`
      });
    }
  });

  if (file) {
    // ── 4. Manpower count vs active roster ────────────
    if (file.manpower > 0 && active.length < file.manpower) {
      blockers.push({
        severity: 'missing',
        label: `Personnel roster incomplete (${active.length}/${file.manpower})`,
        detail: `File declares ${file.manpower} workers but only ${active.length} are on the active roster`
      });
    }

    // ── 5. Required roles ─────────────────────────────
    if (file.sheReps > 0 && !active.some(p => /she.?rep/i.test(p.role))) {
      blockers.push({
        severity: 'missing',
        label: 'SHE Rep not on personnel list',
        detail: `${file.sheReps} SHE Rep(s) declared in header but none found in the active roster`
      });
    }
    if (file.firstAiders > 0 && !active.some(p => /first.?aid/i.test(p.role))) {
      blockers.push({
        severity: 'missing',
        label: 'First Aider not on personnel list',
        detail: `${file.firstAiders} First Aider(s) declared in header but none found in the active roster`
      });
    }

    // ── 6. Required company compliance records ────────
    ['COIDA Good Standing','Public Liability Insurance','H&S Policy Review'].forEach(type => {
      if (!records.some(r => r.scope === 'Company' && r.compliance_type === type)) {
        blockers.push({
          severity: 'missing',
          label: `Company record missing — ${type}`,
          detail: 'Required company-scope compliance document not yet on file'
        });
      }
    });

    // ── 7. Audit date > 12 months → re-audit due ─────
    if (file.auditDate) {
      const audited = new Date(file.auditDate); audited.setHours(0,0,0,0);
      const daysSince = Math.round((today - audited) / 86400000);
      if (daysSince > 365) {
        blockers.push({
          severity: 'expired',
          label: 'Safety file review overdue',
          detail: `Last audited ${fmtD(file.auditDate)} — ${Math.floor(daysSince/30)} months ago (review required every 12 months)`
        });
      } else if (daysSince > 335) {
        blockers.push({
          severity: 'due_soon',
          label: 'Safety file review due soon',
          detail: `Last audited ${fmtD(file.auditDate)} — annual review due in ${365 - daysSince} days`
        });
      }
    }

    // ── 8. Action plan items Open past deadline ───────
    if (file.sections && file.auditDate) {
      const band = safBand(safCalcScore(file).score);
      if (band.actionDays) {
        const auditD = new Date(file.auditDate); auditD.setHours(0,0,0,0);
        const deadline = new Date(auditD); deadline.setDate(deadline.getDate() + band.actionDays);
        if (today > deadline) {
          let openCount = 0;
          SAFETY_SECTIONS.forEach(sec => {
            (file.sections[sec.key] || []).forEach(item => {
              if (item.result === 'Not to Standard' && (!item.apStatus || item.apStatus === 'Open')) openCount++;
            });
          });
          if (openCount > 0) {
            blockers.push({
              severity: 'expired',
              label: `Action plan overdue — ${openCount} item${openCount!==1?'s':''} still Open`,
              detail: `Deadline was ${fmtD(deadline.toISOString().slice(0,10))} (audit date + ${band.actionDays} working days)`
            });
          }
        }
      }
    }
  }

  const critical = blockers.filter(b => b.severity === 'expired' || b.severity === 'missing');
  const warnings = blockers.filter(b => b.severity === 'due_soon');
  const status = critical.length ? 'non_compliant' : warnings.length ? 'warning' : 'compliant';
  return { status, blockers, critical, warnings };
}

function safUpdateComplianceHealth() {
  if (_safComplianceCache === null || _safPersonnelCache === null) return;
  const el = document.getElementById('saf-comp-health-block');
  if (!el) return;
  const fileId = document.getElementById('saf-detail-content')?.dataset?.fileId;
  const file = fileId ? proxyDB.safetyFiles.find(f => f.id === fileId) : null;
  const linkedUsers = _safPersonnelCache.filter(p => p.portal_user_id).map(p => ({ user_id: p.portal_user_id, name: p.full_name, role: p.role, title: p.role }));
  const { status, blockers, critical, warnings } = _calcComplianceHealth(
    _safComplianceCache, _safPersonnelCache, linkedUsers, file
  );
  if (status === 'compliant') {
    el.className = 'saf-ch-block saf-ch-compliant';
    el.innerHTML = '<div class="saf-ch-title">&#10003; Compliance records current</div>';
    return;
  }
  const cls = status === 'non_compliant' ? 'saf-ch-non-compliant' : 'saf-ch-warning';
  const title = status === 'non_compliant'
    ? `&#9888; NON-COMPLIANT — ${critical.length} issue${critical.length!==1?'s':''}`
    : `&#9888; ACTION REQUIRED — ${warnings.length} expir${warnings.length!==1?'ies':'y'} within 30 days`;
  const items = blockers.map(b =>
    `<div class="saf-ch-item"><strong>${esc(b.label)}</strong><br><span class="saf-ch-item-detail">${esc(b.detail)}</span></div>`
  ).join('');
  el.className = `saf-ch-block ${cls}`;
  el.innerHTML = `<div class="saf-ch-title">${title}</div>${items}`;
}


async function safLinkPortalUser(fileId) {
  const allUsers = proxyDB.users || [];
  const linkedIds = new Set((_safPersonnelCache || []).filter(p => p.portal_user_id && p.is_active == 1).map(p => p.portal_user_id));
  const available = allUsers.filter(u => u.active != 0 && !linkedIds.has(u.id));
  if (!available.length) { toast('No available portal users to link', 'info'); return; }
  const opts = available.map(u => `<option value="${u.id}">${esc(u.name)} (${esc(u.role||u.title||'—')})</option>`).join('');
  openModal('Link Portal User to Safety File', `
    <p class="mb-10 text-muted fs-sm">
      Linking a user adds them to the personnel roster and triggers the AECI induction check.
    </p>
    <div class="fgroup ffull">
      <label class="flbl">Portal User <span class="text-ember">*</span></label>
      <select class="finput" id="link-user-sel">
        <option value="">— Select user —</option>
        ${opts}
      </select>
    </div>
    <div class="mt2 flex-end">
      <button class="btn btn-g btn-s mr-8" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p" data-action="safConfirmLinkUser" data-id="${fileId}">Link User</button>
    </div>
  `);
}

async function safConfirmLinkUser(fileId) {
  const uid = parseInt(document.getElementById('link-user-sel')?.value || '0');
  if (!uid) { toast('Select a user', 'err'); return; }
  const r = await api('POST', 'safety_personnel.php', { action: 'link_user', file_ref: fileId, user_id: uid });
  if (!r.success) { toast(r.error || 'Failed to link user', 'err'); return; }
  toast('User linked — added to personnel roster', 'ok');
  closeModalDirect();
  const people = await safLoadPersonnel(fileId);
  safRenderPersonnel(fileId, people);
}

async function safUnlinkUser(userId, fileId, name) {
  if (!confirm(`Unlink ${name} from this safety file? Their personnel record will be marked inactive.`)) return;
  const r = await api('DELETE', `safety_personnel.php?action=unlink_user&file_ref=${encodeURIComponent(fileId)}&user_id=${userId}`, {});
  if (!r.success) { toast(r.error || 'Failed to unlink', 'err'); return; }
  toast(name + ' unlinked', 'info');
  const people = await safLoadPersonnel(fileId);
  safRenderPersonnel(fileId, people);
}

/* Compliance */

async function safLoadCompliance(fileId){
  const r=await api('GET','safety_compliance.php?file_ref='+encodeURIComponent(fileId));
  return r.success?(r.data||[]):[];
}

function safRenderCompliance(fileId,records){
  const panel=document.getElementById('saf-compliance-panel');
  if(!panel) return;
  _safComplianceCache = records;
  safUpdateComplianceHealth();
  if(!records.length){
    panel.innerHTML='<div class="saf-att-empty">No compliance records yet. Add AECI inductions, certifications, and yearly submissions above.</div>';
    return;
  }
  const rows=records.map(rec=>{
    const st=_complianceStatus(rec.expiry_date);
    const dNote=st.days!==null?(st.days<0?`${Math.abs(st.days)}d overdue`:`${st.days}d left`):'';
    const holder=rec.full_name?`${esc(rec.full_name)} <span class="saf-cs-role">${esc(rec.role||'')}</span>`:'<em>Company</em>';
    const hasDoc=rec.att_id;
    const docCell=hasDoc
      ?`<span class="saf-doc-badge" title="${esc(rec.att_name||'')}">
           📄 ${(rec.att_mime==='application/pdf'||rec.att_mime?.startsWith('image/'))?`<button class="btn btn-xs" data-action="openDocViewer" data-id="${rec.att_id}" data-name="${esc(rec.att_name||'document')}" data-mime="${esc(rec.att_mime||'')}" title="View document">&#128065;</button>`:''}
           <a class="saf-doc-dl" href="api/files.php?action=download&id=${rec.att_id}" download="${esc(rec.att_name||'document')}">↓</a>
           <button class="btn btn-xs saf-cs-del-btn" data-action="safReplaceComplianceDoc" data-id="${rec.id}" data-file-id="${esc(fileId)}" data-att-id="${rec.att_id}" title="Replace document">↺</button>
         </span>`
      :`<input type="file" id="saf-cdoc-${rec.id}" class="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                data-action="safUploadComplianceDoc" data-id="${rec.id}" data-file-id="${esc(fileId)}">
         <button class="btn btn-g btn-xs" data-action="triggerFileInput" data-target-id="saf-cdoc-${rec.id}" title="Attach one document">+ Doc</button>`;
    return `<tr>
      <td>${esc(rec.compliance_type)}<br><small class="saf-cs-cat">${esc(rec.category)}</small></td>
      <td>${holder}</td>
      <td>${rec.issue_date?fmtD(rec.issue_date):'—'}</td>
      <td>${rec.expiry_date?fmtD(rec.expiry_date):'—'}</td>
      <td><span class="saf-cs-badge ${st.cls}">${st.label}</span>${dNote?` <small class="saf-cs-days">${dNote}</small>`:''}</td>
      <td class="saf-doc-cell">${docCell}</td>
      <td>
        <button class="btn btn-g btn-xs" data-action="safEditCompliance" data-id="${rec.id}" data-file-id="${esc(fileId)}">Edit</button>
        <button class="btn btn-xs saf-cs-del-btn" data-action="safDeleteCompliance" data-id="${rec.id}" data-file-id="${esc(fileId)}">&#10005;</button>
      </td>
    </tr>`;
  }).join('');
  panel.innerHTML=`<div class="tw"><table class="saf-comp-tbl">
    <thead><tr><th>Type / Category</th><th>Holder</th><th>Issued</th><th>Expires</th><th>Status</th><th>Doc</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

async function safAddCompliance(fileId){
  const people=await safLoadPersonnel(fileId);
  const active=people.filter(p=>p.is_active==1);
  // Datalist with active personnel names — allow typing a new name to create on the fly
  const prsOpts=active.map(p=>`<option data-id="${p.id}" value="${esc(p.full_name)}">`).join('');
  const typeOpts=COMPLIANCE_TYPES.map((t,i)=>
    `<option value="${i}" data-cat="${t.category}" data-scope="${t.scope}" data-months="${t.months}">${t.type}</option>`
  ).join('');

  openModal('Add Training / Compliance Record',`
    <div class="fgrid">
      <div class="fgroup ffull">
        <label class="flbl">Type <span class="text-ember">*</span></label>
        <select class="finput" id="cmp-type-sel">
          <option value="">— Select standard type —</option>
          ${typeOpts}
          <option value="custom">Custom / Other…</option>
        </select>
      </div>
      <div class="fgroup ffull d-none" id="cmp-custom-row">
        <label class="flbl">Custom type name</label>
        <input class="finput" id="cmp-custom-name" placeholder="e.g. Rigging Certificate">
      </div>
      <div class="fgroup">
        <label class="flbl">Category</label>
        <select class="finput" id="cmp-category">
          <option>Induction</option><option>Certification</option><option>Submission</option>
          <option>Permit</option><option>Policy</option><option selected>Other</option>
        </select>
      </div>
      <div class="fgroup">
        <label class="flbl">Scope</label>
        <select class="finput" id="cmp-scope">
          <option>Person</option><option>Company</option>
        </select>
      </div>
      <div class="fgroup ffull" id="cmp-person-row">
        <label class="flbl">Person (leave blank for company-level)</label>
        <input class="finput" id="cmp-person" list="cmp-person-dl" placeholder="Type or select person name, or leave blank" autocomplete="off">
        <datalist id="cmp-person-dl"><option value="">${prsOpts}</datalist>
        <small class="flbl text-muted">Type a new name to add them to the personnel roster automatically</small>
      </div>
      <div class="fgroup">
        <label class="flbl">Issue / Completion Date <span class="text-ember">*</span></label>
        <input class="finput" type="date" id="cmp-issue">
      </div>
      <div class="fgroup">
        <label class="flbl">Renewal cycle (months, 0 = never expires)</label>
        <input class="finput" type="number" id="cmp-months" value="12" min="0">
      </div>
      <div class="fgroup ffull">
        <label class="flbl">Expiry / Renewal date (auto-calculated — override if needed)</label>
        <input class="finput" type="date" id="cmp-expiry">
      </div>
      <div class="fgroup ffull">
        <label class="flbl">Notes</label>
        <input class="finput" id="cmp-notes" placeholder="e.g. Certificate no., training provider">
      </div>
    </div>
    <div class="mt2 flex-end"><button class="btn btn-p" data-action="safSaveCompliance" data-id="${fileId}">Add Record</button></div>
  `);
}

function safCmpTypeChanged(){
  const sel=document.getElementById('cmp-type-sel');
  const val=sel.value;
  document.getElementById('cmp-custom-row').classList.toggle('d-none', val!=='custom');
  if(val===''||val==='custom') return;
  const t=COMPLIANCE_TYPES[parseInt(val)];
  if(!t) return;
  document.getElementById('cmp-category').value=t.category;
  document.getElementById('cmp-scope').value=t.scope;
  document.getElementById('cmp-months').value=t.months;
  safCmpScopeChanged();
  safCmpCalcExpiry();
}

function safCmpScopeChanged(){
  const scope=document.getElementById('cmp-scope')?.value;
  const row=document.getElementById('cmp-person-row');
  if(row) row.classList.toggle('d-none', scope==='Company');
}

function safCmpCalcExpiry(){
  const issue=document.getElementById('cmp-issue')?.value;
  const months=parseInt(document.getElementById('cmp-months')?.value||'0');
  if(!issue||!months) return;
  const d=new Date(issue);
  d.setMonth(d.getMonth()+months);
  document.getElementById('cmp-expiry').value=d.toISOString().split('T')[0];
}

async function safSaveCompliance(fileId){
  const sel=document.getElementById('cmp-type-sel');
  const val=sel?.value||'';
  let cType,category,scope;
  if(val==='custom'){
    cType=(document.getElementById('cmp-custom-name')?.value||'').trim();
    if(!cType){toast('Enter a type name','err');return;}
  } else if(val!==''){
    cType=COMPLIANCE_TYPES[parseInt(val)]?.type;
  } else {toast('Select a compliance type','err');return;}
  category=document.getElementById('cmp-category')?.value||'Other';
  scope   =document.getElementById('cmp-scope')?.value||'Person';
  const issueDate =(document.getElementById('cmp-issue')?.value||null);
  const expiryDate=(document.getElementById('cmp-expiry')?.value||null);
  const months    =parseInt(document.getElementById('cmp-months')?.value||'12');
  const personName=(document.getElementById('cmp-person')?.value||'').trim();
  const notes     =(document.getElementById('cmp-notes')?.value||'').trim();
  if(!issueDate){toast('Issue date is required','err');return;}
  // Resolve person name → personnel ID; create if not on file yet
  let personId = null;
  if(personName && scope!=='Company'){
    const existing=(_safPersonnelCache||[]).find(p=>p.full_name===personName&&p.is_active==1);
    if(existing){
      personId=existing.id;
    } else {
      const nr=await api('POST','safety_personnel.php',{file_ref:fileId,full_name:personName,id_number:'',role:'Employee',company:''});
      if(!nr.success){toast('Could not create personnel record for '+personName,'err');return;}
      personId=nr.data?.id||null;
      // Refresh cache so health check sees the new person
      const freshPeople=await safLoadPersonnel(fileId);
      safRenderPersonnel(fileId,freshPeople);
    }
  }
  const r=await api('POST','safety_compliance.php',{
    file_ref:fileId,compliance_type:cType,category,scope,
    issue_date:issueDate,expiry_date:expiryDate,renewal_months:months,
    personnel_id:personId,notes
  });
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast('Compliance record added');
  closeModalDirect();
  const recs=await safLoadCompliance(fileId);
  safRenderCompliance(fileId,recs);
}

async function safEditCompliance(id,fileId){
  const r=await api('GET','safety_compliance.php?file_ref='+encodeURIComponent(fileId));
  if(!r.success) return;
  const rec=(r.data||[]).find(x=>x.id==id);
  if(!rec) return;
  openModal('Edit Compliance Record',`
    <div class="fgrid">
      <div class="fgroup ffull"><label class="flbl">Type</label>
        <input class="finput" id="cedit-type" value="${esc(rec.compliance_type)}" placeholder="Type name"></div>
      <div class="fgroup">
        <label class="flbl">Issue Date</label>
        <input class="finput" type="date" id="cedit-issue" value="${rec.issue_date||''}">
      </div>
      <div class="fgroup">
        <label class="flbl">Renewal (months)</label>
        <input class="finput" type="number" id="cedit-months" value="${rec.renewal_months||12}" min="0">
      </div>
      <div class="fgroup ffull">
        <label class="flbl">Expiry Date</label>
        <input class="finput" type="date" id="cedit-expiry" value="${rec.expiry_date||''}">
      </div>
      <div class="fgroup ffull"><label class="flbl">Notes</label>
        <input class="finput" id="cedit-notes" value="${esc(rec.notes||'')}" placeholder="Notes"></div>
    </div>
    <div class="mt2 flex-end"><button class="btn btn-p" data-action="safSaveEditCompliance" data-id="${id}" data-file-id="${esc(fileId)}">Save</button></div>
  `);
}

function safCEditCalcExpiry(){
  const issue=document.getElementById('cedit-issue')?.value;
  const months=parseInt(document.getElementById('cedit-months')?.value||'0');
  if(!issue||!months) return;
  const d=new Date(issue);
  d.setMonth(d.getMonth()+months);
  document.getElementById('cedit-expiry').value=d.toISOString().split('T')[0];
}

async function safSaveEditCompliance(id,fileId){
  const cType=(document.getElementById('cedit-type')?.value||'').trim();
  if(!cType){toast('Type name required','err');return;}
  const issueDate  =document.getElementById('cedit-issue')?.value||null;
  const expiryDate =document.getElementById('cedit-expiry')?.value||null;
  const months     =parseInt(document.getElementById('cedit-months')?.value||'12');
  const notes      =(document.getElementById('cedit-notes')?.value||'').trim();
  const r=await api('PUT','safety_compliance.php?id='+id,{
    compliance_type:cType,issue_date:issueDate,expiry_date:expiryDate,renewal_months:months,notes
  });
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast('Record updated');
  closeModalDirect();
  const recs=await safLoadCompliance(fileId);
  safRenderCompliance(fileId,recs);
}

async function safUploadComplianceDoc(recId, fileId, input){
  if(!input.files.length) return;
  const fd=new FormData();
  fd.append('entity_type','safety_compliance');
  fd.append('entity_ref', String(recId));
  fd.append('file', input.files[0]);
  input.value='';
  const r=await _safUploadFd(fd);
  if(!r.success){toast(r.error||'Upload failed','err');return;}
  toast('Document attached','ok');
  const recs=await safLoadCompliance(fileId);
  safRenderCompliance(fileId,recs);
}

async function safReplaceComplianceDoc(recId, fileId, attId){
  if(!confirm('Remove the existing document and attach a new one?')) return;
  const del=await api('DELETE','files.php?id='+attId);
  if(!del.success){toast(del.error||'Delete failed','err');return;}
  // Open file picker to immediately upload the replacement
  const inp=document.createElement('input');
  inp.type='file';
  inp.accept='.pdf,.doc,.docx,.jpg,.jpeg,.png';
  inp.onchange=()=>safUploadComplianceDoc(recId,fileId,inp);
  inp.click();
}

async function safDeleteCompliance(id,fileId){
  if(!confirm('Delete this compliance record?')) return;
  const r=await api('DELETE','safety_compliance.php?id='+id);
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast('Record deleted');
  const recs=await safLoadCompliance(fileId);
  safRenderCompliance(fileId,recs);
}

/* ── policy acknowledgments ─────────────────────────── */

async function safLoadPolicyAcks(fileId){
  const r=await api('GET','safety_policy.php?file_ref='+encodeURIComponent(fileId));
  return r.success?(r.data||[]):[];
}

function safRenderPolicyAcks(fileId,acks){
  const panel=document.getElementById('saf-policy-ack-panel');
  if(!panel) return;
  if(!acks.length){
    panel.innerHTML='<div class="saf-att-empty">No policy acknowledgment requests yet. Use "+ Send Policy" to create one.</div>';
    return;
  }
  const stMap={Pending:'saf-cs-none',Sent:'saf-cs-soon',Acknowledged:'saf-cs-ok',Declined:'saf-cs-overdue'};
  const rows=acks.map(a=>{
    const st=stMap[a.status]||'saf-cs-none';
    const acked=a.acked_at?fmtD(a.acked_at.split(' ')[0]):'—';
    return `<tr>
      <td>${esc(a.policy_title)}</td>
      <td>${esc(a.recipient_name)}</td>
      <td>${esc(a.recipient_email||'—')}</td>
      <td><span class="saf-cs-badge ${st}">${esc(a.status)}</span></td>
      <td>${acked}</td>
      <td>
        ${a.status!=='Acknowledged'&&a.status!=='Declined'?`<button class="btn btn-g btn-xs" data-action="safManualAck" data-id="${a.id}" data-file-id="${esc(fileId)}">&#10003; Mark Ack'd</button>`:''}
        ${a.recipient_email&&a.status!=='Acknowledged'?`<button class="btn btn-g btn-xs" data-action="safResendPolicyAck" data-id="${a.id}" data-file-id="${esc(fileId)}">&#9993; Resend</button>`:''}
        <button class="btn btn-xs saf-cs-del-btn" data-action="safDeletePolicyAck" data-id="${a.id}" data-file-id="${esc(fileId)}">&#10005;</button>
      </td>
    </tr>`;
  }).join('');
  panel.innerHTML=`<div class="tw"><table class="saf-comp-tbl">
    <thead><tr><th>Policy</th><th>Recipient</th><th>Email</th><th>Status</th><th>Acknowledged</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function safSendPolicyToPersonnel(fileId){
  const active=(_safPersonnelCache||[]).filter(p=>p.is_active==1);
  if(!active.length){
    toast('No active personnel on file — add personnel before sending policy emails.','warn');
    return;
  }
  safAddPolicyAck(fileId);
}

function safPersonnelSendPolicy(personId){
  const person=(_safPersonnelCache||[]).find(p=>p.id==personId);
  if(!person) return;
  const fileId=document.getElementById('saf-detail-content')?.dataset?.fileId;
  if(!fileId) return;
  safAddPolicyAck(fileId,{name:person.full_name, email:person.email||''});
}

function safAddPolicyAck(fileId, prefill={}){
  const people=_safPersonnelCache||[];
  const active=people.filter(p=>p.is_active==1);
  if(!active.length){
    toast('No active personnel on file — add personnel before sending policy emails.','warn');
    return;
  }
  const dlOpts=active.map(p=>`<option value="${esc(p.full_name)}">`).join('');
  const emailDlOpts=active.filter(p=>p.email).map(p=>`<option value="${esc(p.email)}">${esc(p.full_name)}</option>`).join('');
  const COMMON_POLICIES=[
    'Health & Safety Policy','PPE Policy & Procedure','Emergency Evacuation Procedure',
    'Incident & Near-Miss Reporting Procedure','Contractor Site Rules & Induction',
    'Working at Heights Procedure','Hazardous Chemical Handling Procedure',
    'Toolbox Talk — General Site Safety',
  ];
  const polOpts=COMMON_POLICIES.map(p=>`<option value="${esc(p)}">`).join('');
  const prefillName =prefill.name  ? esc(prefill.name)  : '';
  const prefillEmail=prefill.email ? esc(prefill.email) : '';
  openModal('Send Policy for Acknowledgment',`
    <div class="fgrid">
      <div class="fgroup ffull"><label class="flbl">Policy / Procedure Title <span class="text-ember">*</span></label>
        <input class="finput" id="pak-title" list="pak-title-dl" placeholder="Select or type policy name" autocomplete="off" autofocus>
        <datalist id="pak-title-dl">${polOpts}</datalist></div>
      <div class="fgroup ffull"><label class="flbl">Policy Content / Summary (optional — shown to recipient)</label>
        <textarea class="finput" id="pak-body" rows="4" placeholder="Paste key points or summary of the policy..."></textarea></div>
      <div class="fgroup"><label class="flbl">Recipient Name <span class="text-ember">*</span></label>
        <input class="finput" id="pak-name" list="pak-name-dl" placeholder="Type or select person" autocomplete="off" value="${prefillName}">
        <datalist id="pak-name-dl">${dlOpts}</datalist></div>
      <div class="fgroup"><label class="flbl">Recipient Email (leave blank for in-person sign-off)</label>
        <input class="finput" id="pak-email" type="email" list="pak-email-dl" placeholder="employee@company.co.za" value="${prefillEmail}">
        <datalist id="pak-email-dl">${emailDlOpts}</datalist></div>
    </div>
    <div class="mt2 flex-end">
      <button class="btn btn-g btn-s mr-8" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p" data-action="safSavePolicyAck" data-id="${fileId}">Create &amp; Send</button>
    </div>
  `);
}

async function safSavePolicyAck(fileId){
  const title=(document.getElementById('pak-title')?.value||'').trim();
  const body =(document.getElementById('pak-body')?.value||'').trim();
  const name =(document.getElementById('pak-name')?.value||'').trim();
  const email=(document.getElementById('pak-email')?.value||'').trim();
  if(!title){toast('Policy title is required','err');return;}
  if(!name) {toast('Recipient name is required','err');return;}
  const r=await api('POST','safety_policy.php',{file_ref:fileId,policy_title:title,policy_body:body,recipient_name:name,recipient_email:email});
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast(email?'Policy sent to '+email:'Acknowledgment request created — mark acknowledged when signed','ok');
  closeModalDirect();
  const acks=await safLoadPolicyAcks(fileId);
  safRenderPolicyAcks(fileId,acks);
}

async function safManualAck(id,fileId){
  if(!confirm('Mark this policy as acknowledged (in-person sign-off)?\n\nThis records the acknowledgment with the current date and time.')) return;
  const r=await api('PUT','safety_policy.php?id='+id,{action:'manual_ack'});
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast('Acknowledgment recorded','ok');
  const acks=await safLoadPolicyAcks(fileId);
  safRenderPolicyAcks(fileId,acks);
}

async function safResendPolicyAck(id,fileId){
  const r=await api('PUT','safety_policy.php?id='+id,{action:'resend'});
  if(!r.success){toast(r.error||'Failed to resend email','err');return;}
  toast('Email resent','ok');
  const acks=await safLoadPolicyAcks(fileId);
  safRenderPolicyAcks(fileId,acks);
}

async function safDeletePolicyAck(id,fileId){
  if(!confirm('Remove this policy acknowledgment record?')) return;
  const r=await api('DELETE','safety_policy.php?id='+id);
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast('Record removed');
  const acks=await safLoadPolicyAcks(fileId);
  safRenderPolicyAcks(fileId,acks);
}

/* ── badge count ────────────────────────────────────── */

function safBadgeCount(){
  if(!proxyDB.safetyFiles) return 0;
  return proxyDB.safetyFiles.filter(f=>f.status==='Submitted').length;
}
