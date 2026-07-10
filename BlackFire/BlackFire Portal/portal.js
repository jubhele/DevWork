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

/* ── CSP-safe style helpers ─────────────────────────────────────── */
const _cspNonce = document.querySelector('meta[name="csp-nonce"]')?.content ?? '';
function _injectStyle(id, css) {
  let s = document.getElementById(id);
  if (!s) {
    s = document.createElement('style');
    s.id = id;
    if (_cspNonce) s.setAttribute('nonce', _cspNonce);
    document.head.appendChild(s);
  }
  s.textContent = css;
}
const $show = (el, d = '') => {
  if (!el) return;
  ['d-none','d-block','d-flex','d-iflex','d-tcell'].forEach(c => el.classList.remove(c));
  if (d === 'flex')         el.classList.add('d-flex');
  else if (d === 'inline-flex') el.classList.add('d-iflex');
  else if (d === 'table-cell')  el.classList.add('d-tcell');
  else if (d === 'block')   el.classList.add('d-block');
};
const $hide = el => {
  if (!el) return;
  ['d-block','d-flex','d-iflex','d-tcell'].forEach(c => el.classList.remove(c));
  el.classList.add('d-none');
};

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

/* ── Table column sort ─────────────────────────────────────────────── */
function isSortableHeader(th) {
  if (!th) return false;
  if (th.dataset.nosort === '1' || th.dataset.sortable === '0') return false;
  const text = (th.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!text || text === 'actions' || text === 'action' || text === '—') return false;
  if (th.querySelector('button,a,input,select,textarea,svg')) return false;
  return true;
}

function refreshSortableHeaders(root = document) {
  root.querySelectorAll('table thead th').forEach(th => {
    const sortable = isSortableHeader(th);
    th.dataset.sortable = sortable ? '1' : '0';
    if (sortable) {
      if (!th.dataset.sortState) th.setAttribute('aria-sort', 'none');
    } else {
      delete th.dataset.sortState;
      th.setAttribute('aria-sort', 'none');
    }
  });
}

function tableSortValue(cell) {
  if (!cell) return '';
  return (cell.dataset.sortVal || cell.textContent || '').replace(/\s+/g, ' ').trim();
}

function sortRowGroups(tbody) {
  const groups = [];
  let activeGroup = null;
  Array.from(tbody.querySelectorAll('tr')).forEach(row => {
    const cells = row.querySelectorAll('td');
    const isChildRow = row.classList.contains('inv-detail') || row.classList.contains('detail') || (cells.length === 1 && cells[0]?.colSpan > 1);
    if (isChildRow && activeGroup) {
      activeGroup.children.push(row);
      return;
    }
    activeGroup = { row, children: [] };
    groups.push(activeGroup);
  });
  return groups;
}

function setSortState(table, activeTh, asc) {
  table.querySelectorAll('thead th').forEach(th => {
    if (th === activeTh) {
      th.dataset.sortState = asc ? 'asc' : 'desc';
      th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
    } else {
      delete th.dataset.sortState;
      if (th.dataset.sortable === '1') th.setAttribute('aria-sort', 'none');
    }
  });
}

function sortTableByCol(th) {
  if (!isSortableHeader(th)) return;
  const table = th.closest('table');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  const ths = Array.from(th.closest('tr').querySelectorAll('th'));
  const col = ths.indexOf(th);
  const asc = th.dataset.sort !== 'asc';
  ths.forEach(h => delete h.dataset.sort);
  th.dataset.sort = asc ? 'asc' : 'desc';
  setSortState(table, th, asc);
  const rows = sortRowGroups(tbody);
  rows.sort((a, b) => {
    const ac = a.row.querySelectorAll('td')[col];
    const bc = b.row.querySelectorAll('td')[col];
    const at = tableSortValue(ac);
    const bt = tableSortValue(bc);
    const an = parseFloat(at.replace(/[^0-9.\-]/g, ''));
    const bn = parseFloat(bt.replace(/[^0-9.\-]/g, ''));
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return asc ? an - bn : bn - an;
    const ad = Date.parse(at);
    const bd = Date.parse(bt);
    if (!Number.isNaN(ad) && !Number.isNaN(bd)) return asc ? ad - bd : bd - ad;
    return asc ? at.localeCompare(bt) : bt.localeCompare(at);
  });
  rows.forEach(group => {
    tbody.appendChild(group.row);
    group.children.forEach(child => tbody.appendChild(child));
  });
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
  const sortTh = e.target.closest('thead th');
  if (sortTh && isSortableHeader(sortTh)) { sortTableByCol(sortTh); return; }
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
    case 'pubNavCat':            pubNavCat(el); break;
    // Auth forms
    case 'doLogin':              doLogin(); break;
    case 'showForgotPassword':   showForgotPassword(); break;
    case 'showLoginPanel':       showLoginPanel(); break;
    case 'doRequestReset':       doRequestReset(); break;
    case 'doResetPassword':      doResetPassword(); break;
    case 'doLogout':             doLogout(); break;
    // Contact / enquiry
    case 'submitContact':        submitContact(); break;
    case 'submitEnquiry':        submitEnquiry(); break;
    // Modals
    case 'openTxModal':          openTxModal(); break;
    case 'closeModalDirect':     closeModalDirect(); break;
    case 'closeModalBackdrop':   if (e.target === el) closeModal(e); break;
    // Operations — tracker
    case 'switchTrackerCat':     renderTracker(el.dataset.cat); break;
    case 'saveNewTask':          saveNewTask(); break;
    case 'openTaskStatus':       openTaskStatus(el.dataset.id); break;
    case 'setTaskStatus':        setTaskStatus(el.dataset.id, el.dataset.status); break;
    case 'deleteTask':           deleteTask(el.dataset.id); break;
    case 'openTrackerRecord':    openTrackerRecord(el.dataset.entityType, el.dataset.id); break;
    case 'saveTrackerSchedule':  saveTrackerSchedule(el.dataset.entityType, el.dataset.id); break;
    case 'addTrackerUpdate':     addTrackerUpdate(el.dataset.entityType, el.dataset.id); break;
    case 'saveTrackerUpdate':    saveTrackerUpdate(+el.dataset.updateId); break;
    case 'uploadTrackerFile':    uploadTrackerFile(el.dataset.entityType, el.dataset.entityRef); break;
    case 'deleteTrackerFile':    deleteTrackerFile(+el.dataset.id, el.dataset.entityType, el.dataset.entityRef); break;
    // Operations — callouts
    case 'saveCallout':          saveCallout(); break;
    case 'openStatusModal':      openStatusModal(el.dataset.id); break;
    case 'saveStatus':           saveStatus(el.dataset.id); break;
    case 'openAssignPO':         openAssignPO(el.dataset.id); break;
    case 'assignPO':             assignPO(el.dataset.id); break;
    case 'openAssignTech':       openAssignTech(el.dataset.id); break;
    case 'saveTechAssign':       saveTechAssign(el.dataset.id); break;
    case 'prefillQuoteFromJob':  prefillQuoteFromJob(el.dataset.id); break;
    case 'openInvoiceFromCallout': openInvoiceFromCallout(el.dataset.id); break;
    case 'openConfirmClosureModal': openConfirmClosureModal(el.dataset.id); break;
    case 'saveConfirmClosure':   saveConfirmClosure(el.dataset.id); break;
    case 'deleteCallout':        deleteCallout(el.dataset.id); break;
    case 'openRecordChain':      openRecordChain(el.dataset.id); break;
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
    case 'openResendStatementModal':  openResendStatementModal(el.dataset.id); break;
    case 'releaseStatement':     releaseStatement(el.dataset.id); break;
    case 'generateStatement':    generateStatement(); break;
    case 'switchPLLedgerTab':    switchPLLedgerTab(el.dataset.pllTab); break;
    // Files
    case 'openAttachmentsModal': openAttachmentsModal(el.dataset.entityType, el.dataset.entityRef); break;
    case 'openDocViewer':        openDocViewer(+el.dataset.id, el.dataset.name, el.dataset.mime); break;
    case 'deleteAttachment':     deleteAttachment(+el.dataset.id, el.dataset.entityType, el.dataset.entityRef); break;
    case 'uploadAttachment':     uploadAttachment(el.dataset.entityType, el.dataset.entityRef); break;
    case 'openBlobPreview':      openTrackerPreview(); break;
    case 'revokeBlobOnDownload': downloadTrackerFile(); break;
    case 'triggerFileInput':     document.getElementById(el.dataset.targetId)?.click(); break;
    case 'printPage':            window.print(); break;
    // Users
    case 'openCreateUserModal':  openCreateUserModal(); break;
    case 'openEditUserModal':    openEditUserModal(+el.dataset.id); break;
    case 'toggleUserActive':     toggleUserActive(+el.dataset.id, +el.dataset.active); break;
    case 'saveNewUser':          saveNewUser(); break;
    case 'saveEditUser':         saveEditUser(); break;
    case 'togglePermCols':       togglePermCols(); break;
    case 'saveUserSignature':    saveUserSignature(); break;
    case 'removeUserSignature':  removeUserSignature(+el.dataset.id); break;
    case 'clearSigPreview':      clearSigPreview(); break;
    case 'openSignAsModal':      openSignAsModal(+el.dataset.id); break;
    case 'submitSignAs':         submitSignAs(); break;
    // Dashboard
    case 'showDashEditor':       showDashEditor(); break;
    case 'saveDashEditorPrefs':  saveDashEditorPrefs(); break;
    case 'setDashDefaultForAll':  setDashDefaultForAll(); break;
    case 'resetDashLayoutForAll': resetDashLayoutForAll(); break;
    // Clients
    case 'openClientModal':      openClientModal(el.dataset.id ? +el.dataset.id : null); break;
    case 'closeClientModal':     closeClientModal(); break;
    case 'saveClient':           saveClient(); break;
    case 'deactivateClient':     deactivateClient(+el.dataset.id); break;
    case 'addClientContact':     addClientContact(); break;
    case 'removeClientContact':  removeClientContact(+el.dataset.idx); break;
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
    case 'safLinkPortalUser':    safLinkPortalUser(el.dataset.id); break;
    case 'safAddCompliance':     safAddCompliance(el.dataset.id); break;
    case 'safAddPolicyAck':      safAddPolicyAck(el.dataset.id); break;
    case 'safGenDocs':           safGenDocs(el.dataset.id); break;
    case 'safConfirmLinkUser':   safConfirmLinkUser(el.dataset.id); break;
    case 'safConfirmRemovePerson': safConfirmRemovePerson(+el.dataset.id, el.dataset.fileId, el.dataset.name); break;
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
  let css = '';
  (root||document).querySelectorAll('.prog-fill[data-w]').forEach((el, i) => {
    el.dataset.pfi = i;
    css += `.prog-fill[data-pfi="${i}"]{width:${el.dataset.w}%;${el.dataset.bg ? `background:${el.dataset.bg};` : ''}}`;
  });
  if (css) _injectStyle('pf-css', css);
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
  refreshSortableHeaders();
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
  if (!await confirmDialog('Remove this attachment?\n\nThis action cannot be undone.', { title: 'Remove File', confirmLabel: 'Remove' })) return;
  const r = await api('DELETE', `files.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Delete failed', 'err'); return; }
  toast('File removed', 'ok');
  await loadAttachments(entityType, entityRef);
}

/* ── Document viewer (inline PDF / image preview) ─────────────────── */
let _dvBlobUrl = null;
let _trackerHtml = '';
let _trackerFileName = '';

async function openDocViewer(id, name, mime) {
  const isPdf = mime === 'application/pdf';
  const isImg = mime && mime.startsWith('image/');

  // Revoke any previous blob URL before creating a new one
  if (_dvBlobUrl) { URL.revokeObjectURL(_dvBlobUrl); _dvBlobUrl = null; }

  if (isPdf || isImg) {
    // Fetch as blob so the iframe/img uses a blob: URL — this bypasses any
    // server-level X-Frame-Options or CSP that would block an iframe pointing
    // directly at the API endpoint.
    try {
      const res = await fetch(`${API_BASE}/files.php?action=view&id=${id}`, { credentials: 'same-origin' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast(json.error || 'Could not load file', 'err');
        return;
      }
      _dvBlobUrl = URL.createObjectURL(await res.blob());
    } catch (e) {
      toast('Could not load file', 'err');
      return;
    }
  }

  let body;
  if (isPdf) {
    body = `<div class="dv-wrap">
      <div class="dv-hdr">
        <span class="dv-name">${esc(name)}</span>
        <a href="${API_BASE}/files.php?action=download&id=${id}" class="btn btn-g btn-s">&#8595; Download</a>
      </div>
      <iframe src="${_dvBlobUrl}" class="dv-iframe" title="${esc(name)}"></iframe>
    </div>`;
  } else if (isImg) {
    body = `<div class="text-center">
      <div class="dv-hdr">
        <span class="dv-name">${esc(name)}</span>
        <a href="${API_BASE}/files.php?action=download&id=${id}" class="btn btn-g btn-s">&#8595; Download</a>
      </div>
      <img src="${_dvBlobUrl}" alt="${esc(name)}" class="dv-img">
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
  'task.view':   ['admin','sysadmin','manager','admin_clerk','finance','safety_officer','call_logger','junior_tech','senior_tech','viewer'],
  'task.create': ['admin','sysadmin','manager','admin_clerk','call_logger','junior_tech','senior_tech'],
  'task.update': ['admin','sysadmin','manager','admin_clerk'],
  'task.delete': ['admin','sysadmin'],
};
function can(perm){
  const roles = SESSION?.roles?.length ? SESSION.roles : (SESSION?.role ? [SESSION.role] : []);
  return roles.includes('sysadmin') || (PERMS[perm]||[]).some(r => roles.includes(r));
}

/* ═══════════════════════════════════════════════════════
   IN-MEMORY CACHE (populated from API on login/refresh)
═══════════════════════════════════════════════════════ */
let DB = { callouts:[], quotes:[], invoices:[], bank:[], users:[], safetyFiles:[], clients:[], tasks:[] };
let SESSION = null;
let AUDIT_LOG = [];
let _dashPrefsCache = null; // populated from DB at login via loadDashPrefsFromAPI()
let modalContacts = [];

/* ── Data Refresh Functions ─────────────────────────── */
async function refreshSafetyFiles() {
  const r = await api('GET', 'safety.php?limit=500');
  if (r.success) DB.safetyFiles = r.data || [];
}
async function refreshCallouts() {
  const r = await api('GET', 'callouts.php?limit=500');
  if (r.success) DB.callouts = r.data || [];
}
async function refreshTasks() {
  if (!can('task.view')) return;
  const r = await api('GET', 'tasks.php?limit=500');
  if (r.success) DB.tasks = r.data || [];
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
  const opts = DB.clients.map(c => {
    const primary = (c.contacts || []).find(ct => +ct.is_primary) || (c.contacts || [])[0];
    const email   = primary?.email || c.email || '';
    const label   = c.name + (email ? ' — ' + email : '');
    return `<option value="${c.id}">${esc(label)}</option>`;
  }).join('');
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
    const techs = (DB.users || []).filter(u => { const rs = u.roles?.length ? u.roles : [u.role]; return rs.some(r=>TECH_ROLES.includes(r)) && u.active != 0; });
    const techOpts = techs.map(u => { const rs=u.roles?.length?u.roles:[u.role]; const lbl=rs.map(r=>ROLE_LABELS[r]||r).join(', '); return `<option value="${esc(u.username)}">${esc(u.name)} (${esc(lbl)})</option>`; }).join('');
    const cur = techEl.value;
    techEl.innerHTML = '<option value="">— Unassigned —</option>' + techOpts;
    if (cur) techEl.value = cur;
  }

  // Quote linked callout select (open/in-progress callouts that don't already have an approved quote)
  const nqCalloutEl = document.getElementById('nq-callout-ref');
  if (nqCalloutEl) {
    const openCos = proxyDB.callouts.filter(c =>
      ['Open','In Progress'].includes(c.status) &&
      !proxyDB.quotes.some(q => q.calloutRef === c.id && q.status === 'Approved')
    );
    const coOpts  = openCos.map(c => `<option value="${esc(c.id)}">${esc(c.id)} — ${esc(c.service)} (${esc(c.client)})</option>`).join('');
    const cur = nqCalloutEl.value;
    nqCalloutEl.innerHTML = '<option value="">— None (standalone quote) —</option>' + coOpts;
    if (cur) nqCalloutEl.value = cur;
  }

  // Invoice linked quote select:
  // - Always include the quote linked to the selected callout (any status)
  // - Plus all Approved quotes for the selected client
  const niQuoteEl = document.getElementById('ni-quote-ref');
  if (niQuoteEl) {
    const niClientId  = parseInt(document.getElementById('ni-client')?.value) || 0;
    const niCalloutId = document.getElementById('ni-callout-ref')?.value || '';
    const quotes = proxyDB.quotes.filter(q => {
      if (niCalloutId && q.calloutRef === niCalloutId) return true;
      return q.status === 'Approved' && (!niClientId || q.clientId === niClientId);
    });
    const qOpts = quotes.map(q => {
      const note = q.status !== 'Approved' ? ` (${esc(q.status)})` : '';
      return `<option value="${esc(q.id)}">${esc(q.quoteNo)} — ${esc(q.client)}${note}</option>`;
    }).join('');
    const cur = niQuoteEl.value;
    niQuoteEl.innerHTML = '<option value="">— None —</option>' + qOpts;
    if (cur) niQuoteEl.value = cur;
  }

  // Invoice linked callout select (Completed callouts only, filtered by selected client)
  const niCalloutEl = document.getElementById('ni-callout-ref');
  if (niCalloutEl) {
    const niClientId = parseInt(document.getElementById('ni-client')?.value) || 0;
    const callouts = proxyDB.callouts.filter(c => c.status === 'Completed' && (!niClientId || c.clientId === niClientId));
    const coOpts2  = callouts.map(c => `<option value="${esc(c.id)}">${esc(c.id)} — ${esc(c.service)}</option>`).join('');
    const cur = niCalloutEl.value;
    niCalloutEl.innerHTML = '<option value="">— Select Completed Callout —</option>' + coOpts2;
    if (cur) niCalloutEl.value = cur;
  }
}
async function refreshAll() {
  const tasks = [refreshCallouts(), refreshQuotes(), refreshInvoices(), refreshTransactions(), refreshSafetyFiles(), refreshClients()];
  if (can('task.view')) tasks.push(refreshTasks());
  if (can('security.users')) tasks.push(refreshUsers());
  await Promise.all(tasks);
  populateLinkedDropdowns();
}

/* ── Normalize DB fields from API ────────────────────── */
// API returns snake_case; map to camelCase expected by render functions
function normalizeCallout(c) {
  return {
    id:               c.ref_id || c.id,
    jobNo:            c.job_no || c.ref_id || c.id,
    client:           c.client_name,
    clientId:         c.client_id ? Number(c.client_id) : null,
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
    createdAt:        c.created_at || '',
    startAt:          c.start_at || '',
    endAt:            c.end_at || '',
    dueAt:            c.due_at || '',
  };
}
function normalizeQuote(q) {
  const items = (q.items || []).map(i => ({ desc: i.description, qty: Number(i.qty), unit: Number(i.unit_price) }));
  return {
    id:             q.ref_id || q.id,
    quoteNo:        q.quote_no || q.ref_id || q.id,
    client:         q.client_name,
    clientId:       q.client_id ? Number(q.client_id) : null,
    items,
    status:         q.status,
    validUntil:     q.valid_until,
    date:           q.quote_date,
    submittedBy:    q.submitted_by,
    source:         q.source,
    approvalStatus: q.approval_status,
    calloutRef:     q.callout_ref || '',
  };
}
function normalizeInvoice(i) {
  return {
    id:          i.ref_id || i.id,
    invoiceNo:   i.invoice_no || i.ref_id || i.id,
    client:      i.client_name,
    clientEmail: i.client_email || '',
    amount:      Number(i.amount),
    dueDate:     i.due_date,
    status:      i.status,
    ref:         i.quote_ref || i.callout_ref || '',
    calloutRef:  i.callout_ref || '',
    po:          i.po || '',
    date:        i.invoice_date,
    paidDate:    i.paid_date || '',
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
    calloutRef: b.callout_ref || '',
    credit: Number(b.credit),
    debit:  Number(b.debit),
  };
}

function invoicePaymentRevenue(year, month = null) {
  return proxyDB.bank
    .filter(t => {
      if (t.cat !== 'Invoice Payment' || t.credit <= 0 || !t.date) return false;
      const dt = new Date(t.date + 'T00:00:00');
      return dt.getFullYear() === year && (month === null || dt.getMonth() === month);
    })
    .reduce((sum, t) => sum + t.credit, 0);
}

function normalizeSafetyFile(f) {
  return {
    id:               f.ref_id,
    contractor:       f.contractor       || '',
    contractorRep:    f.contractor_rep_name  || '',
    contractorRepId:  f.contractor_rep_id   ? parseInt(f.contractor_rep_id)  : null,
    appointee162:     f.appointee162_name   || '',
    appointee162Id:   f.appointee162_id     ? parseInt(f.appointee162_id)    : null,
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
  get tasks()       { return DB.tasks || []; },
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
  $show(document.getElementById('login-panel'));
  $hide(document.getElementById('forgot-panel'));
  $hide(document.getElementById('newpass-panel'));
  loadCaptcha();
}

function showForgotPassword(){
  $hide(document.getElementById('login-panel'));
  $show(document.getElementById('forgot-panel'), 'block');
  $hide(document.getElementById('newpass-panel'));
  $hide(document.getElementById('forgot-msg'));
  document.getElementById('fp-user').value = '';
}

async function doRequestReset(){
  const u = document.getElementById('fp-user').value.trim().toLowerCase();
  if (!u) return;
  const msgEl = document.getElementById('forgot-msg');
  const r = await api('POST', 'auth.php?action=reset_request', { username: u });
  msgEl.textContent = r.message || (r.success ? 'Reset email sent if account exists.' : r.error);
  msgEl.classList.toggle('msg--ok', !!r.success);
  msgEl.classList.toggle('msg--err', !r.success);
  $show(msgEl, 'block');
}

async function doResetPassword(){
  const p1 = document.getElementById('np-pass1').value;
  const p2 = document.getElementById('np-pass2').value;
  const msgEl = document.getElementById('newpass-msg');
  if (!p1 || !p2) return;
  if (p1 !== p2) {
    msgEl.textContent = 'Passwords do not match.';
    $show(msgEl, 'block');
    return;
  }
  const token = new URLSearchParams(window.location.search).get('reset_token');
  if (!token) { msgEl.textContent = 'Invalid reset link.'; $show(msgEl, 'block'); return; }
  const r = await api('POST', 'auth.php?action=reset_password', { token, password: p1 });
  msgEl.textContent = r.message || (r.success ? 'Password updated. Please log in.' : r.error);
  msgEl.classList.toggle('msg--ok', !!r.success);
  msgEl.classList.toggle('msg--err', !r.success);
  $show(msgEl, 'block');
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
  { const _rl = SESSION.roles?.length > 1 ? SESSION.roles.map(r=>ROLE_LABELS[r]||r).join(' + ') : (ROLE_LABELS[SESSION.role]||SESSION.role);
    document.getElementById('dash-sub').textContent = `AECI CHEMPARK  -  ${_rl.toUpperCase()} VIEW`; }

  // Load all data from API (including dashboard layout)
  toast('Loading data…', 'info');
  _dashPrefsCache = null; // clear any previous user's cache before re-loading
  await Promise.all([refreshAll(), loadDashPrefsFromAPI()]);

  // Navigate to first page for role (supports multi-role — first match wins)
  const _roleMap2 = { call_logger:'p-new-callout', junior_tech:'p-tracker', senior_tech:'p-tracker', client_support:'p-dashboard', admin_clerk:'p-tracker', safety_officer:'p-safety' };
  const _allRoles2 = SESSION.roles?.length ? SESSION.roles : [SESSION.role];
  const firstPage = Object.entries(_roleMap2).find(([r])=>_allRoles2.includes(r))?.[1] || 'p-dashboard';
  showPortalPage(firstPage, null);
  updateBadges();
  startIdleTimer();
  initStickyHeaders();
}

async function doLogout(){
  stopIdleTimer();
  await api('POST', 'auth.php?action=logout');
  SESSION = null;
  _dashPrefsCache = null;
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
      { id:'p-reports',       label:'Reports',   perm: null },
      { id:'p-quotes',        label:'Quote Log', perm:'quote.view',   badge:'nb-qte' },
      { id:'p-tracker',       label:'Tracker',   perm:'task.view',    badge:'nb-co' },
      { id:'p-clients',       label:'Clients',   perm:'clients.view' },
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
      { id:'p-pl-ledger',         label:'P&L Ledger',        perm:'finance.income' },
      { id:'p-income',            label:'Income Stmt',      perm:'finance.income' },
      { id:'p-reconcile',         label:'Reconciliation',   perm:'finance.transactions' },
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
  { id:'w-ops',        label:'Operations & Tracker', desc:'Open tasks · operational callouts · work by stream', perm:'task.view' },
  { id:'w-fin',        label:'Finance',             desc:'Invoiced MTD · net balance · 6-month revenue chart', perm:'invoice.view' },
  { id:'w-alerts',     label:'Live Alerts',         desc:'Overdue invoices · urgent tasks · pending approvals', perm: null },
  { id:'w-compliance', label:'Compliance Alerts',   desc:'Expiring and overdue safety certificates',          perm:'safety.view' },
  { id:'w-compare',    label:'Period Comparisons',  desc:'MTD vs PY MTD · YTD vs PY YTD · QTD vs PY QTD',   perm:'invoice.view' },
];

function getDashPrefs() {
  // In-memory cache populated from DB at login — primary source of truth
  if (_dashPrefsCache) return _dashPrefsCache;
  // localStorage fallback: used before login completes or when API is unreachable
  try {
    const raw = localStorage.getItem('bf_dash_' + (SESSION?.username||''));
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') {
        // Migrate old flat format {w-ops: true, ...} → new structured format
        if (!p.enabled && !p.order) return { enabled: p, order: DASH_WIDGETS.map(w=>w.id), customized: true };
        return p;
      }
    }
  } catch {}
  // Fall through to admin default stored locally
  try {
    const def = localStorage.getItem('bf_dash_default');
    if (def) { const p = JSON.parse(def); if (p) return p; }
  } catch {}
  return { enabled: {}, order: DASH_WIDGETS.map(w=>w.id) };
}
function getDashWidgetOrder(prefs) {
  const allIds = DASH_WIDGETS.map(w=>w.id);
  const saved  = prefs?.order || [];
  const ordered = saved.filter(id => allIds.includes(id));
  allIds.forEach(id => { if (!ordered.includes(id)) ordered.push(id); });
  return ordered;
}
function saveDashPrefs(prefs) {
  const withTs = { ...prefs, savedAt: Date.now() };
  _dashPrefsCache = withTs;
  localStorage.setItem('bf_dash_' + (SESSION?.username||''), JSON.stringify(withTs));
  api('PUT', 'dashboard_prefs.php', withTs); // fire-and-forget DB persist
}

async function loadDashPrefsFromAPI() {
  const r = await api('GET', 'dashboard_prefs.php');
  if (!r.success) return; // keep localStorage fallback

  if (r.user_layout) {
    _dashPrefsCache = r.user_layout;
    localStorage.setItem('bf_dash_' + (SESSION?.username||''), JSON.stringify(r.user_layout));
    return;
  }

  // No server layout — check localStorage for migration of pre-DB data
  try {
    const localRaw = localStorage.getItem('bf_dash_' + (SESSION?.username||''));
    if (localRaw) {
      const lp = JSON.parse(localRaw);
      if (lp && lp.customized) {
        _dashPrefsCache = lp;
        api('PUT', 'dashboard_prefs.php', lp); // migrate to DB silently
        return;
      }
    }
  } catch {}

  // Use admin default from server
  if (r.default_layout) {
    _dashPrefsCache = r.default_layout;
    localStorage.setItem('bf_dash_default', JSON.stringify(r.default_layout));
  }
  // null _dashPrefsCache → getDashPrefs() falls through to system default
}
function isWidgetOn(id, prefs) {
  const p = prefs || getDashPrefs();
  if (p.enabled) return p.enabled[id] !== false;  // new format
  return p[id] !== false;                          // old format fallback
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
    if (subBar) subBar.classList.add('invis');
    return;
  }
  if (subBar) subBar.classList.remove('invis');
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
  return { callouts:[], quotes:[], invoices:[], bank:[], safetyFiles:[], clients:[], tasks:[], counters:{co:0,q:0,inv:0} };
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
const fmtDT = dt=>dt?new Date(String(dt).replace(' ','T')).toLocaleString('en-ZA',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
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
function quoteTotals(q){
  const items = q?.items || [];
  if (items.length) return qtot(items);
  const base = parseFloat(q?.total_amount ?? q?.amount ?? 0) || 0;
  return { sub: base, vat: base * 0.15, total: base * 1.15 };
}

function toast(msg,type=''){
  const c=document.getElementById('toaster');
  const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;
  c.appendChild(t);
  setTimeout(()=>{t.classList.add('hiding');setTimeout(()=>t.remove(),400);},6000);
}
function audit(action,detail=''){
  AUDIT_LOG.unshift({ts:new Date().toISOString(),user:SESSION?.username||'?',role:SESSION?.role||'?',action,detail,level:'info'});
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
  'p-home': {
    title: 'Portal Home',
    sub: 'Welcome & quick navigation',
    purpose: 'The starting point for every session — shows your role, available modules, and quick-access links to the areas most relevant to your work.',
    steps: [
      'Check your displayed role in the top bar — this determines which modules and actions you can access.',
      'Use the navigation panel on the left to move between modules. Items you do not have access to will not appear.',
      'Click any module card on the home screen to jump directly into that section.',
      'Use the Help (?) button at the top right on any page to open the how-to guide for that specific screen.',
      'If you cannot find a module you expect to see, contact your Admin — your role may need to be updated.',
    ],
    tips: [
      'Bookmark the portal URL in your browser for fast daily access.',
      'If the portal looks different from what you remember, check your role — an Admin may have adjusted your access.',
      'The nav badge numbers (red circles) highlight pages with items needing attention. Check these first each morning.',
    ],
    faqs: [
      { q: 'I can\'t see a module I need. What should I do?', a: 'Contact your Admin or Manager. Access is controlled by your role — they can update it.' },
      { q: 'How do I change my password?', a: 'Use the Forgot Password link on the login screen, or ask an Admin to reset it from the Users & Roles page.' },
      { q: 'Is the portal data live?', a: 'Yes — all data reflects the current state of the system. There is no offline or staging mode.' },
      { q: 'Can I use the portal on my phone?', a: 'Yes — the portal is mobile-responsive. Some data-dense pages (like the Call Log) are easier to use on a larger screen.' },
    ],
    linked: 'All modules.',
    access: ['admin','sysadmin','manager','admin_clerk','senior_tech','call_logger','viewer','client_support','junior_tech'],
  },
  'p-services': {
    title: 'Service Catalogue',
    sub: 'Available service types & categories',
    purpose: 'A reference list of all service categories and types used when logging callouts and quotes. Keeping this accurate ensures consistent reporting and correct billing.',
    steps: [
      'Browse the grid of service categories — each card shows the category name and number of active service types within it.',
      'Click a category card to see the individual service types it contains.',
      'Service types are used as the "Type" field when logging a new callout or creating a quote line item.',
      'If a service type you need is not listed, contact your Admin to have it added.',
      'Do not improvise service descriptions — always select from the catalogue to ensure consistency in reports.',
    ],
    tips: [
      'Consistent service type selection is critical for accurate operations reports. Avoid selecting "Other" unless nothing fits.',
      'If you find yourself regularly using "Other", submit a suggestion to get the relevant type added to the catalogue.',
      'Service categories group related types — e.g. all CCTV-related work falls under a single category for reporting.',
    ],
    faqs: [
      { q: 'Who can add or edit service types?', a: 'Only Admins and Sysadmins can modify the service catalogue. Contact your Admin with a description of the new type needed.' },
      { q: 'What if a service type has been discontinued?', a: 'Contact your Admin to deactivate it. Old records that reference it will be preserved.' },
      { q: 'How do service types affect billing?', a: 'Service type is used to categorise callouts and quote line items. Finance uses these categories for revenue reporting.' },
    ],
    linked: 'Callouts, Quotes.',
    access: ['admin','sysadmin','manager','admin_clerk','senior_tech','call_logger','viewer','client_support','junior_tech'],
  },
  'p-contact': {
    title: 'Enquiries',
    sub: 'Contact & quote requests',
    purpose: 'Submit a service enquiry or request a quote from within the portal. Use this page to raise a formal enquiry on behalf of a client or for your own site. The form captures your contact details and service requirement so the BlackFire team can follow up.',
    steps: [
      'Fill in your full name, company, phone number, and email address.',
      'Select the service type from the dropdown — choose the closest match to what is required.',
      'Write a brief message describing the requirement, site details, and any urgency.',
      'Click Submit Enquiry. The form is cleared and a confirmation is shown.',
      'A BlackFire team member will follow up within one business day.',
    ],
    tips: [
      'The more detail you include in the message field, the faster the team can prepare a tailored response.',
      'For urgent security incidents, use the Emergency Line (+27 68 912 6581) directly — do not submit a form.',
      'If you are requesting a quote for an existing client, include the client name in the message field.',
    ],
    faqs: [
      { q: 'How quickly will I get a response?', a: 'The target response time is one business day. For urgent matters, call the emergency line directly.' },
      { q: 'Can I submit multiple service types in one enquiry?', a: 'Yes — select "Multiple Services" from the dropdown and describe all requirements in the message field.' },
      { q: 'Is this form only for new clients?', a: 'No — existing clients and internal staff can use it to raise formal enquiries or quote requests that need to go through the standard review process.' },
    ],
    linked: 'Clients, Quotes.',
    access: ['admin','sysadmin','manager','admin_clerk','senior_tech','call_logger','viewer','client_support','junior_tech'],
  },
  'p-dashboard': {
    title: 'Dashboard',
    sub: 'Your control centre',
    purpose: 'The central hub showing live tracker work, operational callouts, invoices, safety compliance, and recent activity at a glance. Tasks and callouts are counted separately so internal work never inflates field-operations figures.',
    steps: [
      'Review Open Tasks, Urgent Tasks, and Due Today for work in the Admin, Sales, and General streams.',
      'Review Open Callouts separately — this count now contains only genuine client incidents and field jobs.',
      'Check Recent Tracker Activity for work that has not been assigned or progressed.',
      'Check the Outstanding Invoices panel — anything overdue (past payment terms) should be followed up today.',
      'Review the Safety Compliance summary — it shows the percentage of safety files currently compliant and flags any that are expiring within 30 days.',
      'Scan the Audit Feed at the bottom — it shows the 5 most recent actions across all users. Anything unexpected warrants investigation.',
      'Use the quick-action buttons on each panel to jump directly to that module without navigating the sidebar.',
      'Drag and drop dashboard panels to rearrange them into an order that suits your workflow.',
    ],
    tips: [
      'Check the dashboard every morning before starting work — it gives you the full picture in under a minute.',
      'Red badge numbers on the nav sidebar indicate urgent items across all pages. Clear these before end of day.',
      'If Recent Tracker Activity shows the same open work day after day, escalate it to the stream owner.',
      'The dashboard does not auto-refresh. Navigate away and back (or reload) to get the latest data.',
    ],
    faqs: [
      { q: 'Why are my badge counts different from what I expect?', a: 'Badges update every time you navigate to a page. Click away and back to force a refresh.' },
      { q: 'Can I customise which panels appear on the dashboard?', a: 'Yes — drag panels to reorder them. Your layout is saved automatically per user.' },
      { q: 'What does the compliance percentage on the dashboard mean?', a: 'It shows the proportion of active safety files with an Approved or compliant status. Files with expired review dates lower this score.' },
      { q: 'I see activity on the audit feed I don\'t recognise. What should I do?', a: 'Navigate to the full Audit Log (if you have access) and search by that username. If you cannot investigate yourself, contact your Sysadmin immediately.' },
    ],
    linked: 'Operations, Finance, Support — all modules feed into this view.',
    access: ['admin','sysadmin','manager','admin_clerk','senior_tech','call_logger','viewer','client_support','junior_tech'],
  },
  'p-ops-dashboard': {
    title: 'Operations Overview',
    sub: 'Operational health at a glance',
    purpose: 'A real-time snapshot of the operations workload — open callouts, pending quotes, technician utilisation, and a timeline summary. Use this page to quickly identify bottlenecks and prioritise follow-ups before they become delays.',
    steps: [
      'Check the Open Callouts count — anything above your expected daily average needs investigation. Click through to the Call Log.',
      'Review the Callouts by Status breakdown: Open means unassigned or not yet started; Assigned means a technician is scheduled; In Progress means active on-site work; Awaiting Parts means blocked on materials.',
      'Check the Quotes Pending Approval count — these block the billing cycle. Managers should clear these daily.',
      'Review the Quotes by Status panel to see how many are drafted, pending, approved, or expired.',
      'Use the quick-action buttons to log a new callout, submit a new quote, or view the full Timeline.',
    ],
    tips: [
      'Open callouts older than 24 hours without a status update are a red flag — check with the assigned technician.',
      'Pending approval quotes that are 48+ hours old should be chased — the approver may not have seen the notification.',
      'Use this page in your morning stand-up to quickly run through the team\'s active workload.',
    ],
    faqs: [
      { q: 'What\'s the difference between Operations Overview and the main Dashboard?', a: 'The main Dashboard shows a cross-module summary including finance and safety. Operations Overview focuses only on callouts and quotes — it is the ops team\'s daily work page.' },
      { q: 'How do I assign a technician to a callout from here?', a: 'Navigate to the Call Log using the quick action button, expand the callout row, and select the technician.' },
      { q: 'What does "Awaiting Parts" status mean?', a: 'The technician has been on-site but the job cannot be completed until materials or equipment arrive. These should have an expected resolution date noted in the callout description.' },
      { q: 'Why does the callout count on this page differ from the main Dashboard badge?', a: 'The main Dashboard badge counts all open callouts. This page may show a filtered view based on date range or status. Check the filter settings at the top.' },
    ],
    linked: 'Callouts, Quotes, Timeline.',
    access: ['admin','sysadmin','manager','call_logger','senior_tech','junior_tech','client_support','admin_clerk','viewer'],
  },
  'p-reports': {
    title: 'Operations Reports',
    sub: 'Structured reporting for operations workflows',
    purpose: 'A consolidated reporting surface for operations. It keeps the reporting view inside the portal so teams can move between live work, tracker activity, and formal reports without leaving the Operations area.',
    steps: [
      'Review the report tabs to switch between safety, business activity, finance, workforce, and document upload views.',
      'Use the report filters and exports to drill into the data you need for a meeting or audit.',
      'Return to Operations Overview when you need to jump back into live workflow pages.',
    ],
    tips: [
      'This view embeds the standalone reports page so the navigation stays inside the Operations workspace.',
    ],
    linked: 'Operations Overview, Tracker, Safety Files.',
    access: ['admin','sysadmin','manager','client_support','admin_clerk','viewer'],
  },
  'p-timeline': {
    title: 'Timeline',
    sub: 'Chronological event view',
    purpose: 'A time-ordered view of all callouts and quotes plotted against a calendar axis. Use it to spot demand peaks, plan technician availability, and identify periods of unusual activity.',
    steps: [
      'The timeline loads with all available records plotted by their logged date.',
      'Scroll horizontally to move through time — older events are to the left, newer ones to the right.',
      'Each event block shows the reference number, client, and status. Colour coding indicates type: callouts in one colour, quotes in another.',
      'Click any event block to see its summary. Use the link in the summary to open the full record in the Call Log or Quote Log.',
      'Use this view to identify busy periods and compare against current technician availability for scheduling.',
    ],
    tips: [
      'Dense clusters of events on a single day indicate high-demand periods — use this information when planning leave or shifts.',
      'If the timeline looks sparse for recent periods, check whether callouts are being logged in real-time or batched at the end of the day.',
      'The timeline is a read-only view — you cannot create or edit records here. Use it for visibility only.',
    ],
    faqs: [
      { q: 'How far back does the timeline go?', a: 'All available records are plotted — there is no cut-off. Scroll left to go further back.' },
      { q: 'Can I filter the timeline by client, technician, or service type?', a: 'Not yet — the timeline shows all events. Filtering is a planned enhancement. Submit a suggestion below to prioritise it.' },
      { q: 'Why do some events overlap on the timeline?', a: 'Overlapping blocks indicate multiple callouts or quotes logged on the same date. They are stacked vertically so each one remains visible.' },
      { q: 'Can I zoom in or out on the timeline?', a: 'Not currently. Use the scroll on your mouse or trackpad to move through dates horizontally.' },
    ],
    linked: 'Callouts, Quotes.',
    access: ['admin','sysadmin','manager','call_logger','senior_tech','junior_tech','client_support','admin_clerk','viewer'],
  },
  'p-tracker': {
    title: 'Tracker',
    sub: 'Company workstreams and operational call log',
    purpose: 'Use one workspace for all company work. Admin, Sales, and General contain internal tasks; Call Log contains only real client incidents, dispatched service work, and field jobs.',
    steps: [
      'Choose the stream first: Admin for finance, compliance, recruitment, and office work; Sales for opportunities and proposals; General for internal systems, training, and cross-functional work.',
      'Use Call Log only for a genuine operational event or client service job that may require dispatch, a quote, or an invoice.',
      'Click + New Task while an internal stream is active. The selected stream is carried into the task form.',
      'Set an owner, priority, and Created, Start, End, and Due date/time values. Update status from Open to In Progress and then Done as work progresses.',
      'Open Record on any row to add a labelled description. Each description remains a separate table record and can be edited later.',
      'Use Files on any row to upload PDF, Word, Excel, JPEG, or PNG evidence and open it again from the same record.',
      'Open the Call Log tab to search and manage operational jobs. Use + Log Call only from that stream.',
    ],
    tips: [
      'A banking change, payment follow-up, compliance document, job mailbox, portal fix, or team training item is a task, not a callout.',
      'A client request that is likely to become quoted work belongs in Sales until it becomes a confirmed operational job.',
      'Imported tasks retain their original call-log reference for audit traceability.',
      'Schedule changes, new descriptions, description edits, and file changes are written to the Audit Log. Description edits also preserve the prior revision.',
    ],
    faqs: [
      { q: 'Why did the callout count drop?', a: 'Internal work logged as callouts was moved into the correct Tracker streams. Open Callouts now measures operational jobs only.' },
      { q: 'Where is the old Call Log page?', a: 'Call Log is now the fourth tab inside Tracker. Existing links redirect to that tab.' },
      { q: 'Can I overwrite the existing description?', a: 'Edit that description record and save it. The visible record changes, while the earlier version is preserved as a revision and the action is audited.' },
      { q: 'Which stream should portal defects use?', a: 'Use General for internal portal defects and system improvements. Use Call Log only when the portal issue is itself part of a client operational job.' },
    ],
    linked: 'Dashboard, Quotes, Invoices, Clients.',
    access: ['admin','sysadmin','manager','admin_clerk','senior_tech','junior_tech','call_logger','viewer','safety_officer'],
  },
  'p-callouts': {
    title: 'Call Log',
    sub: 'Incident & service callout tracker',
    purpose: 'The Call Log tab inside Tracker is the complete, auditable record of every genuine security or service callout — incident type, location, assigned technician, PO number, status, and resolution.',
    steps: [
      'Click "+ Log Call" to create a new callout. Complete all required fields: client, site, service type, description, and priority.',
      'Use the search box to filter by client name, reference number, technician, or status. Combining filters narrows results quickly.',
      'Click any row to expand it and see the full callout detail — timestamps, description, attachments, and action history.',
      'From the expanded row: update the status, assign or reassign a technician, add a PO number, or attach documents.',
      'Status lifecycle: Open → Assigned → In Progress → Awaiting Parts (if blocked) → Closed. Move statuses forward as work progresses.',
      'Once work is fully complete, set status to Closed. A Manager or Admin must then confirm closure to lock the record.',
      'Confirmed-closed callouts can be converted to an invoice directly from the expanded row — this pre-fills the billing line items.',
    ],
    tips: [
      'Always assign a PO number before dispatching a subcontractor. Finance requires it for invoice matching and payment reconciliation.',
      'Update the status to In Progress when a technician is on-site — this gives the ops team real-time visibility.',
      'Close callouts within 24 hours of job completion. Every open callout inflates the ops dashboard counts and obscures true workload.',
      'Never delete a callout unless it was logged in error and has no related invoice or quote. Use Closed to archive completed work.',
      'Use the description field to capture key detail: exact location, nature of fault, steps taken, and materials used.',
    ],
    faqs: [
      { q: 'Can I edit a callout after saving?', a: 'Yes — expand the row and most fields remain editable until the callout is Confirmed Closed. After that, only Admins can make amendments.' },
      { q: 'How do I link a callout to an invoice?', a: 'Open the expanded row for a closed callout and click "Convert to Invoice" — it pre-fills the invoice with the service type and description.' },
      { q: 'Why can\'t I delete a callout?', a: 'Only Admins and Managers have delete permission, and only when no linked invoice or quote exists. Contact your manager if a record needs removing.' },
      { q: 'What\'s the difference between Assigned and In Progress?', a: 'Assigned means a technician has been scheduled but has not yet started. In Progress means they are actively working on-site.' },
      { q: 'Can I attach files to a callout?', a: 'Yes — expand the callout row and use the Attachments section to upload photos, reports, or supporting documents (PDF, Word, Excel, JPEG/PNG, max 10 MB each).' },
      { q: 'What is the Priority field used for?', a: 'Priority (Low / Medium / High / Critical) is for internal triage. Critical should be used for active security breaches or imminent danger — these should also be escalated by phone immediately.' },
    ],
    linked: 'Clients, Technicians, Quotes, Invoices.',
    access: ['admin','sysadmin','manager','call_logger','senior_tech','junior_tech','client_support','admin_clerk','viewer'],
  },
  'p-quotes': {
    title: 'Quote Log',
    sub: 'Quotation management',
    purpose: 'Create, track, and approve service quotations. Every approved quote can convert directly into an invoice, eliminating manual re-entry. Declined quotes remain on record for reference.',
    steps: [
      'Click "+ Submit Quote" to draft a new quotation. Select the client, set a valid-until date, and add an internal reference note if helpful.',
      'Add line items: each needs a description, quantity, and unit rate. Break labour and materials into separate lines — clients expect itemised quotes.',
      'The system calculates subtotal, VAT (if applicable), and total automatically. Verify these before submitting.',
      'Click Submit — the quote moves to Pending Approval and the approver is notified.',
      'A Manager or Admin reviews the quote: Approved quotes unlock the Convert to Invoice action; Declined quotes return to you with a reason.',
      'If a quote is declined, review the decline reason, make corrections, and resubmit. The original version is preserved in the audit trail.',
      'To convert an approved quote, expand the row and click "Convert to Invoice" — billing details are pre-filled.',
    ],
    tips: [
      'Double-check the VAT treatment (inclusive vs exclusive) before submitting — incorrect VAT creates billing corrections that are time-consuming to unwind.',
      'Set the valid-until date at least 2 weeks out. Quotes that expire before the client signs off require a full re-approval cycle.',
      'If you need approval urgently, notify the approver directly — the system notification may sit unread.',
      'Use the Notes field to add context for the approver: what prompted the quote, any client-specific terms, or urgency.',
    ],
    faqs: [
      { q: 'Can I edit a quote after submitting?', a: 'Not once it is Pending Approval — it is in the approver\'s queue. Only Admins can edit at this stage. Withdraw and resubmit if you made an error before approval.' },
      { q: 'What happens when a quote expires?', a: 'It is automatically marked Expired. The client must agree to a revised valid-until date before a new quote can be raised and submitted.' },
      { q: 'Can I send the quote directly to the client from the portal?', a: 'Not yet — download the quote details and send manually. A direct client send feature is planned.' },
      { q: 'Can I duplicate a quote for a similar job?', a: 'Not yet — recreate it manually. Submit a suggestion below to request this feature.' },
      { q: 'What does "Pending Approval" mean for my workflow?', a: 'You are waiting on a Manager or Admin to review. You cannot convert or send the quote until it is approved. If it is urgent, contact the approver directly.' },
      { q: 'How long should approval take?', a: 'The target is same business day. If a quote has been pending for more than 24 hours, follow up with the approver directly.' },
    ],
    linked: 'Clients, Invoices (conversion), Callouts.',
    access: ['admin','sysadmin','manager','senior_tech','client_support','admin_clerk','viewer'],
  },
  'p-finance-dashboard': {
    title: 'Finance Overview',
    sub: 'Financial health summary',
    purpose: 'A real-time financial snapshot — total amount invoiced this period, total collected, outstanding balance owed, and recent transaction activity. Use this page daily to stay on top of cash flow.',
    steps: [
      'Review the Total Outstanding figure — this is the sum of all unpaid invoice balances. Compare it to your expected monthly inflow.',
      'Check the Overdue Invoices count — invoices past their payment terms. Each one needs a follow-up action this week.',
      'Review the Recent Transactions panel to confirm payments are being logged promptly after clearing the bank.',
      'Check the Invoice Aging breakdown (if visible) — it shows how long outstanding invoices have been unpaid (0–30 days, 31–60, 60+).',
      'Use the quick-action links to drill into Invoices, Transactions, or the Income Statement for more detail.',
      'If outstanding balance is growing month-on-month without matching inflows, alert the billing team immediately.',
    ],
    tips: [
      'If outstanding is high but transactions look normal, check for invoices marked Sent that have not been followed up.',
      'Month-end: ensure all transactions for the period are captured and reconciled before generating the Income Statement.',
      'Aging invoices in the 60+ day bucket are collections risk — escalate these to management.',
      'The finance dashboard reflects posted data only. Verbal client commitments to pay are not reflected here.',
    ],
    faqs: [
      { q: 'Why does my outstanding total not match the bank statement?', a: 'The outstanding figure is based on invoices logged in the portal, not what has cleared the bank. Log payments via Log Payment to reduce outstanding balances.' },
      { q: 'Who can see financial data?', a: 'Finance data is restricted to Admin, Sysadmin, Manager, and Admin Clerk roles. Other roles see the ops and support dashboards instead.' },
      { q: 'What is the difference between the finance dashboard and the Income Statement?', a: 'The finance dashboard shows current snapshot figures. The Income Statement is a period report (income vs expense) for accounting and management reporting.' },
      { q: 'Why do totals on this page look different after I log a payment?', a: 'Payment logging updates the invoice status immediately. Navigate away and back to refresh the dashboard totals.' },
    ],
    linked: 'Invoices, Transactions, Statements, P&L Ledger.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-pl-ledger': {
    title: 'P&L Ledger',
    sub: 'Full financial record — AECI Chempark',
    purpose: 'The authoritative financial record for the AECI Chempark account. Five integrated views cover every remittance received, bank statement confirmation, sales invoice, supplier cost, and monthly P&L — all reconciled to the BF_AECI_Full_PL_Ledger source.',
    steps: [
      'Use the tab bar at the top to switch between the five views: Remittances, Bank Statement, Sales Invoices, Supplier Costs, and Monthly P&L.',
      'Remittances (All): full list of payments remitted by Chemhold Investments Pty Ltd. Supplier code AST6. Issued by Yolanda Herbst (Cash Book Controller).',
      'Bank Statement: only bank-confirmed receipts against FNB *8644. ⚠ items are remitted but not yet in the bank — investigate with AECI.',
      'Sales Invoices: every invoice raised against AECI, cross-referenced to the remittance control number that settled it.',
      'Supplier Costs: Siyasiza Group (labour/materials) and Megahertz Systems (hardware) costs against the job.',
      'Monthly P&L: cash basis — income = bank-confirmed receipts only. Costs = Siyasiza + Megahertz. Unreconciled remittances excluded.',
    ],
    tips: [
      'Remittance Only ⚠ entries = payment was sent by AECI but not received in FNB *8644. Follow up with Yolanda Herbst directly.',
      'The Monthly P&L uses bank-confirmed cash only — accrual figures will differ from the invoice totals.',
      'Supplier cost data is updated from Siyasiza and Megahertz invoices captured in the portal.',
    ],
    faqs: [
      { q: 'Why does the total remitted differ from total invoiced?', a: 'Remittances cover multiple invoices in a single payment. Some invoices may also still be outstanding or paid outside this ledger period.' },
      { q: 'What are the unreconciled remittances?', a: 'Three remittances (Jan–Feb 2026, totalling R32,735.97) were received by email from Yolanda Herbst but the corresponding amounts have not appeared in FNB *8644. These require investigation with AECI.' },
    ],
    linked: 'Invoices, Transactions, Income Statement, Reconciliation.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-invoices': {
    title: 'Invoices',
    sub: 'Invoice management',
    purpose: 'Create, send, and track all client invoices — from draft through to paid. This is the primary billing module. Accuracy here directly affects cash flow and financial reporting.',
    steps: [
      'Click "+ New Invoice" to create. Select the client and set the billing period (e.g. "May 2026 Retainer" or the relevant callout date range).',
      'Add line items: description, quantity, and unit rate for each chargeable item. VAT is calculated automatically based on the rate configured for the client.',
      'Review the subtotal, VAT, and total before saving. Once saved, the invoice appears in the Invoices list immediately.',
      'Use the Send button to email the invoice directly to the client\'s billing contact on record.',
      'When payment is received and confirmed in the bank, click Mark as Paid. The finance dashboard updates instantly.',
      'If a client pays partially, use Log Payment and enter the partial amount — the invoice will show remaining balance.',
      'Invoices can also be generated automatically from an approved quote — use "Convert to Invoice" on the Quote Log.',
      'To add supporting documentation (e.g. job completion report, delivery note), expand the invoice row and use the Attachments section.',
    ],
    tips: [
      'Send invoices within 24 hours of completing the work — delays in invoicing are the leading cause of delayed payment.',
      'Never mark an invoice as Paid until you have confirmed the bank deposit. Reversals require Admin intervention and create audit noise.',
      'If a client queries an invoice, use the Attachments section to add supporting documentation before responding.',
      'Use a consistent, descriptive format for invoice line items: "Armed Response Retainer — May 2026" is more useful than "Monthly service".',
      'Invoices marked Sent but unpaid after 30 days should trigger a follow-up call, not just a reminder email.',
    ],
    faqs: [
      { q: 'Can I edit an invoice after sending it?', a: 'No — sent invoices are locked. Contact an Admin who can unlock it for amendment. Any change is logged in the audit trail.' },
      { q: 'What if a client pays partially?', a: 'Log a partial payment via Log Payment. The invoice status changes to Partial — the remaining balance stays in outstanding.' },
      { q: 'How do I void or cancel an invoice?', a: 'Delete it (Admin/Manager only) if no payment has been logged against it. If a payment was already logged, contact a Sysadmin — a credit note process is required.' },
      { q: 'Can I add a discount to an invoice?', a: 'Yes — add a line item with a negative amount (e.g. description "Loyalty Discount", quantity 1, rate −500.00).' },
      { q: 'What invoice number format does the system use?', a: 'The system auto-generates sequential references (INV-001, INV-002, etc.). Do not attempt to set this manually.' },
      { q: 'What if the client\'s billing email is wrong?', a: 'Update the client\'s billing contact email in the Clients module first, then use the Send button — it will use the updated address.' },
    ],
    linked: 'Clients, Quotes (conversion), Transactions, Statements.',
    access: ['admin','sysadmin','manager','client_support','admin_clerk','viewer'],
  },
  'p-statement': {
    title: 'Statements',
    sub: 'Client account statements',
    purpose: 'Generate a statement of account for any client showing all invoices, payments received, and the running outstanding balance for a chosen period. Statements are used for monthly client billing reviews and dispute resolution.',
    steps: [
      'Select the client from the dropdown — only active clients with at least one invoice are listed.',
      'Set the statement period: choose a start date and end date that covers the billing period you want to report.',
      'The statement generates automatically — it shows every invoice raised in the period, each payment received, and the cumulative running balance.',
      'Review the closing balance carefully. It should match what the client owes as of the end date.',
      'Download as PDF for your records, or release it directly to the client contact via the portal.',
      'For disputed balances, use the Attachments section on individual invoices to add supporting documentation before releasing the statement.',
    ],
    tips: [
      'Send statements at the end of every month, even if the balance is zero — it builds client trust and reduces disputes.',
      'Confirm all payments for the period are logged in Log Payment before releasing. A statement with missing payments shows a higher balance than expected and triggers unnecessary disputes.',
      'If a client says their records don\'t match, ask them to share their payment confirmations and cross-reference against the transactions in the portal.',
    ],
    faqs: [
      { q: 'Can clients view their own statements directly in the portal?', a: 'Not in this version of the portal. Download the PDF and email it to the client, or use the release button to send via the portal\'s email integration.' },
      { q: 'What if the statement shows the wrong closing balance?', a: 'Check that all payments for the period have been logged in Log Payment. Missing payments are the most common cause of discrepancies.' },
      { q: 'Can I generate a statement for a period that straddles two months?', a: 'Yes — set any custom start and end date. The statement will include all invoices and payments within that range.' },
      { q: 'What if a client says they paid but it doesn\'t show on the statement?', a: 'Ask for their proof of payment (bank confirmation or EFT receipt). If the payment cleared, log it in Log Payment with the bank reference — the statement will update.' },
    ],
    linked: 'Invoices, Clients.',
    access: ['admin','sysadmin','manager','client_support','admin_clerk'],
  },
  'p-transactions': {
    title: 'Transactions',
    sub: 'Bank transaction log',
    purpose: 'Record every money-in and money-out bank transaction for reconciliation and income reporting. This ledger feeds directly into the Income Statement and Reconciliation tools — accurate entries produce accurate reports.',
    steps: [
      'Log each transaction as it appears on the bank statement: date, description, type (Income/Expense), and exact amount.',
      'Set the type correctly: Income for any money received (client payments, refunds credited); Expense for any money paid out (subcontractor payments, operational costs, bank fees).',
      'Use the description field to record the invoice reference or supplier name. Format: "INV-042 PAYMENT — AECI" or "TECH LABOUR — J SMITH".',
      'Add the bank reference number if available — this links the transaction to a specific bank statement line for reconciliation.',
      'Check that this transaction feeds correctly into the Income Statement by reviewing the net figures after saving.',
    ],
    tips: [
      'Log transactions daily as they appear on the bank statement — batching at month-end leads to errors, missed entries, and reconciliation headaches.',
      'Use a consistent description format across all entries. "PAYMENT" on its own is not useful — include the invoice number or client name every time.',
      'Bank fees and admin charges are Expenses — do not forget to log these or your reconciliation will show a gap.',
      'Do not log invoices here. Invoices are created in the Invoices module. Transactions are actual bank movements only.',
    ],
    faqs: [
      { q: 'What is the difference between logging a payment here and using Log Payment?', a: 'Log Payment marks a specific invoice as paid and creates a linked transaction. The Transactions page is for logging raw bank movements — use both for a complete picture.' },
      { q: 'I logged the wrong amount — how do I fix it?', a: 'Contact an Admin. Only Admins can edit or delete transaction records to maintain audit integrity.' },
      { q: 'Should I log VAT separately?', a: 'No — log the full amount including VAT as it appears on the bank statement. The Income Statement uses these gross amounts. VAT reconciliation is handled separately by your accountant.' },
      { q: 'What if I don\'t have a bank reference for a transaction?', a: 'Leave the reference field blank and note the reason in the description field (e.g. "CASH DEPOSIT — NO REF"). This makes the reconciliation gap explainable.' },
    ],
    linked: 'Invoices, Income Statement.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-income': {
    title: 'Income Statement',
    sub: 'Profit & loss summary',
    purpose: 'A period-based report comparing total income (revenue received) against total expenses (money paid out), producing a net profit or loss figure. This report is used for management reporting, accounting, and tax preparation.',
    steps: [
      'Select the reporting period using the start and end date pickers. Common periods: calendar month, quarter, or financial year.',
      'The system calculates Total Income (sum of all Income-type transactions), Total Expenses (sum of all Expense-type transactions), and Net Result (Income − Expenses).',
      'Review each line carefully — if any category looks unexpectedly high or low, drill into the Transactions page to investigate.',
      'Verify the figures match your bank statement totals for the same period before exporting.',
      'Export as PDF for management reporting, audit submission, or sharing with your accountant.',
    ],
    tips: [
      'Only generate this report after confirming all transactions for the period are captured and correct. Incomplete transaction data produces a misleading net figure.',
      'If income looks unexpectedly low, check the Invoices module for payments that have been received but not yet logged.',
      'If expenses look unexpectedly high, check for duplicate transaction entries — a common batching error.',
      'Run the Income Statement at the end of every month immediately after reconciliation. Do not leave it until year-end.',
    ],
    faqs: [
      { q: 'Does this report include unpaid invoices (accrual) or only received payments (cash)?', a: 'This report uses the cash basis — it reflects actual bank transactions logged in the Transactions module, not invoice totals.' },
      { q: 'Does this report include VAT?', a: 'It reflects transaction values as logged. If you log gross (VAT-inclusive) amounts, the report is gross. Discuss with your accountant whether you need net reporting and adjust your entry practice accordingly.' },
      { q: 'Can I export to Excel?', a: 'PDF download is currently available. Excel export is on the roadmap — submit a suggestion below to prioritise it.' },
      { q: 'What if the net result doesn\'t match what I expect?', a: 'Work backwards: first verify your Total Income matches known payments for the period, then verify Total Expenses against your bank statement expenses. The discrepancy will isolate to missing or duplicate entries in the Transactions ledger.' },
    ],
    linked: 'Transactions, Invoices.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-reconcile': {
    title: 'Reconciliation',
    sub: 'Portal vs external statement',
    purpose: 'Compare the portal\'s running transaction total against your actual bank or client statement to identify missing, duplicate, or incorrectly entered transactions. A zero difference means the portal perfectly matches your bank.',
    steps: [
      'Obtain your bank or client statement for the reconciliation period and note the closing balance.',
      'Enter the closing balance from the external statement in the input field at the top of this page.',
      'The portal calculates its own net balance: SUM(Income) − SUM(Expense) across all logged transactions.',
      'The Difference is shown prominently. A value of 0.00 means the portal matches the statement exactly.',
      'If the difference is not zero: scroll through the transaction list and look for duplicates, missing entries, or amounts that differ from the statement.',
      'Log any missing transactions via the Transactions page and return here to recheck. Delete duplicates via the Transactions page (Admin only).',
      'Repeat until the difference reaches zero. Document any unresolved items for your accountant.',
    ],
    tips: [
      'A positive difference (portal total > statement) usually means a duplicate credit entry in the portal.',
      'A negative difference (portal total < statement) usually means a payment or income entry is missing from the portal.',
      'Reconcile at least monthly — the longer you leave it, the harder it is to trace individual discrepancies.',
      'Always reconcile before generating the Income Statement. An unreconciled statement produces unreliable P&L figures.',
    ],
    faqs: [
      { q: 'Where does the portal balance figure come from?', a: 'It is SUM(amount) for Income rows minus SUM(amount) for Expense rows across all transactions in the Transactions ledger.' },
      { q: 'Can I delete a duplicate transaction myself?', a: 'Only Admins can delete transactions. Identify the duplicate in the Transactions page and ask your Admin to remove it.' },
      { q: 'What if I cannot get the difference to zero?', a: 'Document the remaining gap and the transactions you have checked. Share this with your accountant — some gaps are timing differences (e.g. payments in transit) that clear in the next period.' },
      { q: 'Does this tool reconcile invoices against payments, or only bank transactions?', a: 'This tool reconciles the Transactions ledger against an external statement. Invoice-level matching (invoice vs payment) is done in the Invoices and Log Payment modules.' },
    ],
    linked: 'Transactions, Income Statement.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-clients': {
    title: 'Clients',
    sub: 'Client master records',
    purpose: 'The master list of all clients — company name, contact person, billing email, physical address, and account status. Every callout, quote, invoice, and statement must be linked to a client record. Keeping these records accurate is fundamental to correct billing.',
    steps: [
      'Before creating a callout, quote, or invoice for a new client, create their record here first.',
      'Fill in all fields: Company Name (exactly as it should appear on invoices), Billing Contact Name, Billing Email, Physical Address, and an Account Reference code if you use one.',
      'Use the edit button to update details when a client changes contact person, billing email, or address.',
      'If a client has multiple sites, add each site address in the Sites field so technicians can select the correct location on callouts.',
      'When a client relationship ends, deactivate their record — this preserves all historical invoices and callouts without cluttering the active client dropdown.',
    ],
    tips: [
      'Always create the client record before logging their first callout or quote. You cannot link records retroactively to an unlisted client.',
      'Use the exact trading name as it should appear on tax invoices — not the informal name you call them.',
      'The billing email is used every time an invoice is sent. Verify it with the client before the first invoice run.',
      'If a client has multiple billing contacts (e.g. accounts department and a line manager), add both emails separated by a semicolon.',
    ],
    faqs: [
      { q: 'Can I delete a client record?', a: 'Not if they have linked invoices, callouts, or quotes. Deactivate the record instead — all historical data is preserved and remains accessible.' },
      { q: 'What is the Account Reference field?', a: 'Your internal client code for cross-referencing with accounting systems or physical filing. Can be the client\'s debtor number from your accounting software.' },
      { q: 'How do I handle a client with multiple sites?', a: 'Add all site addresses in the client record. When logging a callout, select the specific site from the dropdown.' },
      { q: 'A client has been acquired by another company — how do I update their record?', a: 'Update the Company Name and billing details. Do not create a new record — historical records should remain linked to avoid gaps in their invoice history.' },
    ],
    linked: 'Invoices, Statements, Callouts.',
    access: ['admin','sysadmin','manager','admin_clerk','client_support'],
  },
  'p-support-dashboard': {
    title: 'Support Overview',
    sub: 'Administration health check',
    purpose: 'A consolidated admin snapshot — user account status, safety file compliance percentage, expiring documents, and recent system activity. Use this page to catch compliance and access control issues before they escalate.',
    steps: [
      'Check the Users panel — it shows total active accounts and flags any with unusual status (e.g. locked accounts or role mismatches).',
      'Review the Safety Compliance percentage — anything below 90% needs investigation. Click through to Safety Files to identify the non-compliant items.',
      'Check the Expiring Documents count — these are safety files with review dates within the next 30 days. Act on them now, not when they expire.',
      'Scan the Recent Audit Feed for unexpected activity — unusual actions outside business hours, bulk deletes, or role changes not initiated by you.',
      'Use the quick links to jump directly to Users & Roles, Safety Files, or the full Audit Log.',
    ],
    tips: [
      'Review this dashboard at the start of each Monday morning — compliance issues found on Monday can be resolved by Friday. Compliance issues found on Friday become emergencies.',
      'Unexpected audit entries outside business hours (evenings, weekends) warrant immediate investigation. Contact the Sysadmin if you see unusual activity.',
      'A compliance percentage below 75% typically means one or more safety files are expired or have outstanding critical corrective actions.',
    ],
    faqs: [
      { q: 'Who has access to this dashboard?', a: 'Admin, Sysadmin, Manager, Admin Clerk, and Viewer roles. Sensitive sub-pages (Audit Log, Users) have additional permission gates.' },
      { q: 'What counts as a compliance issue on this dashboard?', a: 'Any safety file with a status of Expired, Overdue, or with open critical corrective actions counts against the compliance score.' },
      { q: 'What should I do if the compliance percentage has suddenly dropped?', a: 'Navigate to Safety Files and filter by status to find the non-compliant records. Expired review dates are the most common cause.' },
    ],
    linked: 'Users & Roles, Safety Files, Audit Log.',
    access: ['admin','sysadmin','manager','admin_clerk','viewer'],
  },
  'p-users': {
    title: 'Users & Roles',
    sub: 'User account management',
    purpose: 'Create and manage all portal user accounts. A user\'s role determines precisely which modules they can see and which actions they can take. Correct role assignment is the foundation of portal security.',
    steps: [
      'Click "+ New User" to create an account. Enter a unique username, full name, email address, and a temporary password.',
      'Assign the correct role from the list below. If unsure, start with the most restrictive role that meets their needs.',
      'Send the login credentials to the user securely — do not send via public chat or shared email.',
      'Ask the user to change their password on first login using the profile settings.',
      'To update a role or reset a password, click the edit button on the user\'s row.',
      'Deactivate accounts immediately when staff leave — do not delete. Deactivated users cannot log in, but all their historical records are preserved.',
      'All user changes — creation, role changes, password resets, deactivation — are automatically recorded in the Audit Log.',
    ],
    tips: [
      'Apply least privilege: assign the minimum role that lets a person do their job. You can always expand access later.',
      'Never share login credentials between people. Every individual must have their own account. Shared accounts destroy audit trail integrity.',
      'Deactivate ex-staff accounts on their last day, not the following week. A former employee with active credentials is a security incident waiting to happen.',
      'Review the full user list quarterly — look for accounts that have not logged in for 90+ days and deactivate if no longer needed.',
    ],
    faqs: [
      { q: 'What is the difference between Admin and Sysadmin?', a: 'Sysadmin has unrestricted access to every function in the portal. Admin has broad access but cannot perform certain system-level actions (like resetting all data or accessing system configuration).' },
      { q: 'Can a user have multiple roles?', a: 'Yes — multi-role accounts are supported. Only assign additional roles when genuinely needed; each additional role expands access.' },
      { q: 'Can a user change their own password?', a: 'Yes — via the Forgot Password link on the login screen, or via their profile settings once logged in. Admins can also force-reset from this page.' },
      { q: 'What happens to records when I deactivate a user?', a: 'All records they created remain intact. Their name still appears on historical callouts, invoices, and audit entries. They simply cannot log in.' },
      { q: 'What does each role provide access to?', a: 'Sysadmin: full access. Admin: full access minus system config. Manager: operations, finance overview, approvals. Admin Clerk: finance, invoices, clients. Senior Tech: callouts, quotes, safety. Call Logger: logging callouts only. Junior Tech: view callouts. Viewer: read-only. Client Support: client-facing modules.' },
    ],
    linked: 'Audit Log (all changes are recorded automatically).',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-safety': {
    title: 'Safety Files',
    sub: 'OHS compliance document store',
    purpose: 'Store, track, and manage all Occupational Health & Safety compliance documents for contractors and internal teams — policies, appointment letters, risk assessments, permits, and audit reports. Each file has a compliance score, review date, and action plan.',
    steps: [
      'Click "+ New File" to create a safety file for a contractor or site. Enter the contractor name, representative, and scope of work.',
      'Upload the required compliance documents using the "+ Upload Document" button. Tag each document with the correct type (e.g. Policy, Appointment Letter, Risk Assessment, Method Statement, Permit).',
      'Set a review date for each document — this is when it must be re-verified. Set it 2 weeks before the actual expiry date to allow processing time.',
      'Once a document is signed and verified, mark it as Approved. Unapproved documents do not count towards the compliance score.',
      'Monitor the Safety Files list — files with expired or expiring documents are highlighted in amber or red.',
      'To conduct a formal OHS Act audit, click through to the Safety Audit module from this page.',
    ],
    tips: [
      'Always upload the signed, final version of a document — not a draft. Unsigned documents have no legal standing.',
      'Section 16.2 appointment letters expire whenever the appointed person changes role or leaves. Review these every time there is a personnel change.',
      'Set review dates for all documents when creating the file, even if they are not due for months — future-you will thank present-you.',
      'If a file\'s compliance score is low, use the "Generate Docs" feature from the Safety File Detail page to create corrective action templates in bulk.',
    ],
    faqs: [
      { q: 'Who can approve a safety document?', a: 'Admins and Managers only. The approver must physically verify the document is signed, current, and complete before approving.' },
      { q: 'What file formats are accepted?', a: 'PDF, Word (DOC/DOCX), Excel (XLS/XLSX), and JPEG/PNG images. Maximum 10 MB per file.' },
      { q: 'What is the difference between Safety Files and Safety Audit?', a: 'Safety Files is the document store — it holds all compliance documents for a contractor. Safety Audit is the formal OHS Act audit form — it assesses the contractor against legislative requirements and produces a compliance score.' },
      { q: 'Can I attach multiple documents to one safety file?', a: 'Yes — use the Attachments section within the file record. There is no limit on the number of documents per file.' },
      { q: 'What document types should I include in a complete safety file?', a: 'At minimum: OHS Policy (signed by 16.1), Section 16.2 Appointment Letter, Method Statement, Risk Assessment, Hazard Identification and Risk Assessment (HIRA), Company Registration, Proof of Liability Insurance, and Toolbox Talk records.' },
    ],
    linked: 'Safety Audit, Clients, Audit Log.',
    access: ['admin','sysadmin','manager','senior_tech','junior_tech','call_logger','client_support','admin_clerk','viewer'],
  },
  'p-safety-audit': {
    title: 'Safety Audit',
    sub: 'OHS Act formal audit form',
    purpose: 'Conduct and record a formal safety audit of a contractor against OHS Act requirements. The audit produces a compliance score, a section-by-section findings report, and an action plan. The submitted record is tamper-proof and serves as the official compliance record.',
    steps: [
      'Click "+ New Audit" to begin. Enter the contractor name, site representative name, Section 16.2 appointee, and audit date.',
      'Set the region (for multi-region operations), the audit team members present, and the scope of work being audited.',
      'Work through each section of the audit checklist — each item is scored: Compliant, Non-Compliant, Partial, or Not Applicable.',
      'For every Non-Compliant or Partial item, record the specific finding in the finding field and note the required corrective action, owner, and deadline.',
      'Use Save Draft at any point during the audit to preserve your progress. You can return to a draft and continue later.',
      'Once all sections are completed and reviewed, click Submit. The audit is locked from this point — scores and findings cannot be changed.',
      'Attach the signed, physical audit report PDF to the submitted record in the Attachments section.',
    ],
    tips: [
      'Complete the audit in one sitting where possible — gaps between sections risk inconsistent findings and timeline confusion.',
      'Every Non-Compliant finding must have a named owner and a specific deadline. "Management will fix" is not acceptable — a person and a date are required.',
      'Before submitting, get the Section 16.2 appointee and site representative to physically sign off on the findings. Attach the signed form.',
      'Score generously but honestly — a 90% score that hides real issues is more dangerous than an 80% score with clear actions.',
    ],
    faqs: [
      { q: 'Can I edit a submitted audit?', a: 'No — submitted audits are locked. This is intentional: submitted audits are legal compliance records. Contact an Admin if a genuine factual error needs correcting; all amendments are logged.' },
      { q: 'What is a Section 16.2 appointee?', a: 'Under the OHS Act, the employer (Section 16.1, typically the CEO/MD) must appoint a competent person in writing to assist with OHS compliance. This person — the 16.2 appointee — is personally accountable for compliance on-site.' },
      { q: 'How often should audits be conducted?', a: 'At minimum annually. High-risk sites or contractors involved in electrical, at-height, or confined space work should be audited every 6 months. Audits are also required after significant incidents or major scope changes.' },
      { q: 'Who should conduct the audit?', a: 'A qualified Safety Officer or an Astute Insights-certified auditor. The auditor must be independent — they should not be an employee of the contractor being audited.' },
      { q: 'What happens to the compliance score after the audit?', a: 'The score is captured at submission and becomes the Baseline score on the Safety File Detail page. As corrective actions are closed, the Projected score updates — showing the expected score on re-submission.' },
    ],
    linked: 'Safety Files, Clients, Audit Log.',
    access: ['admin','sysadmin','manager','senior_tech'],
  },
  'p-audit': {
    title: 'Audit Log',
    sub: 'Immutable system activity record',
    purpose: 'A tamper-evident log of every significant action taken in the portal — who did it, what they did, when, and on which record. The audit log cannot be edited or deleted. It is your primary tool for investigating discrepancies, security incidents, and user activity.',
    steps: [
      'Use the search box to filter entries. You can search by username, action keyword (e.g. "DELETE", "LOGIN", "UPDATE"), or record reference (e.g. "INV-042", "CALL-0019").',
      'Each log entry shows: timestamp, username, action type, and detail (which record was affected and what changed).',
      'Look for PAGE_SUGGESTION entries — these are feedback comments left by users via the Guide panel on any page. Review them weekly.',
      'Cross-reference timestamps with user reports when investigating a discrepancy. "I didn\'t change that" can often be verified or disproven here.',
      'For security incidents: filter by username and time range to reconstruct exactly what a user did during a session.',
    ],
    tips: [
      'Before making bulk changes (e.g. mass status updates), note the current state in the audit log — you need a baseline to confirm the changes took effect correctly.',
      'PAGE_SUGGESTION entries are valuable user feedback — recurring suggestions about the same feature or pain point should be escalated to management.',
      'Activity outside business hours (evenings, weekends, public holidays) is unusual for this portal. Flag it immediately.',
      'The audit log is most useful when it is read regularly, not only during incidents. A weekly 5-minute scan is your early warning system.',
    ],
    faqs: [
      { q: 'Can audit entries be deleted or modified?', a: 'No — the audit log is immutable by design. This is a legal and compliance requirement for financial and security systems.' },
      { q: 'How far back do audit logs go?', a: 'All entries since the portal went live are retained indefinitely. No automatic expiry is applied.' },
      { q: 'Who can see the audit log?', a: 'Only Admin and Sysadmin roles have access to the full audit log. If a Manager needs to investigate a specific incident, a Sysadmin can provide a filtered export.' },
      { q: 'Can I export the audit log?', a: 'Not directly from this page — contact a Sysadmin to export a date-range extract for external reporting or handover to external auditors.' },
      { q: 'What types of actions are logged?', a: 'All significant actions: logins, failed logins, record creation, edits, status changes, deletions, role changes, user deactivations, invoice sends, payment logs, safety file approvals, and audit submissions.' },
    ],
    linked: 'All modules — every significant action across the portal is recorded here.',
    access: ['admin','sysadmin'],
  },
  'p-new-callout': {
    title: 'Log New Callout',
    sub: 'Create an incident or service record',
    purpose: 'Log a new security incident, service request, or maintenance callout as it comes in. Accurate, timely logging is essential for billing, reporting, and audit purposes.',
    steps: [
      'Select the Client from the dropdown. If the client is not listed, create their record in the Clients module first.',
      'Select the Site — this is the specific location for the callout. If multiple sites exist for this client, choose the correct one.',
      'Select the Service Type from the dropdown. Use the closest matching type — do not use "Other" unless nothing fits.',
      'Set the Priority: Low (scheduled maintenance), Medium (standard service request), High (time-sensitive fault), Critical (active security breach or imminent danger).',
      'Write a clear, specific Description. Include: what happened or was requested, exact location details, any equipment involved, and what action has been taken so far (if any).',
      'Assign a Technician if already confirmed — leave blank if not yet known and assign later from the Call Log.',
      'Click Save — the callout is created immediately with a unique reference number (CALL-XXXX). Confirm the reference to the client or caller.',
    ],
    tips: [
      'Log the callout as it happens, not hours later. Timestamps are used for SLA reporting and billing — late logging creates inaccurate records.',
      'Be specific: "CCTV Camera 3 offline at Gate B, Sector North — no image since 14h30" is useful. "CCTV issue" is not.',
      'Critical callouts must also be escalated by phone immediately — do not rely on the portal notification for urgent incidents.',
      'If the same client site has recurring issues, note the pattern in the description — "Third CCTV fault at this location in 30 days".',
    ],
    faqs: [
      { q: 'What if I don\'t know which technician to assign?', a: 'Leave the Technician field blank and save. You can assign from the Call Log once a technician is confirmed — the callout is created and timestamped regardless.' },
      { q: 'Is there a limit to how many callouts I can log?', a: 'No limit. Log every callout — the history builds your service record, supports billing, and is required for any future SLA or contract review.' },
      { q: 'What happens after I save?', a: 'The callout appears immediately in the Call Log with status Open. No automatic notification is sent — contact the assigned technician directly. You can return to the Call Log at any time to update status, assign a technician, or add a PO number.' },
      { q: 'Can I edit a callout I just saved?', a: 'Yes — go to the Call Log, find your callout, expand the row, and edit any field. Changes are logged in the audit trail.' },
    ],
    linked: 'Call Log, Clients.',
    access: ['admin','sysadmin','manager','call_logger','client_support'],
  },
  'p-new-task': {
    title: 'New Task',
    sub: 'Create an internal task',
    purpose: 'Log an internal task in the correct Tracker stream — Admin, Sales, or General. Use this form for any company work that is not a client callout: compliance actions, sales follow-ups, system improvements, training, and administrative items.',
    steps: [
      'Select the Category that matches the Tracker stream you are working in: Admin for finance, compliance, and office work; Sales for opportunities and proposals; General for systems, training, and cross-functional items.',
      'Enter a concise, specific Title — describe the deliverable, not the activity. "Update VAT certificate on file" is better than "admin task".',
      'Add a Description if the title alone does not give the assignee enough context — include key details, links, or reference numbers.',
      'Set the Priority: Low (no urgency), Normal (standard work), High (required this week), Critical (blocking something else or overdue).',
      'Assign To: enter the username of the person responsible. Leave blank if unassigned and update later from Tracker.',
      'Set Start Date & Time and End Date & Time to scope the work window. Set Due Date if there is a hard deadline different from the end date.',
      'Click Save — the task is created immediately and appears in the Tracker under the selected stream.',
    ],
    tips: [
      'Tasks belong in Tracker streams (Admin, Sales, General). If it involves a client incident, a site visit, or potential billing, use Log Call instead.',
      'A clear title is the most important field — the assignee reads it in the Tracker list without opening the record.',
      'Set a due date even if it is generous. Tasks with no due date tend to drift.',
      'Use the Description field to add context, links, or reference numbers — not to restate the title.',
    ],
    faqs: [
      { q: 'Which category should I use?', a: 'Admin: finance, compliance, HR, office admin. Sales: client opportunities, proposals, follow-ups. General: internal systems, training, cross-team work, portal defects. Call Log is for client incidents and field jobs only.' },
      { q: 'Can I reassign a task after saving?', a: 'Yes — open the task record in Tracker, expand it, and update the Assigned To field. The change is logged in the audit trail.' },
      { q: 'What is the difference between End Date and Due Date?', a: 'End Date is when the work is expected to finish. Due Date is the hard deadline — when it must be completed regardless. If both are the same, set only the Due Date.' },
      { q: 'Can I attach files to a task?', a: 'Yes — after saving, open the task in Tracker, expand the row, and use the Files section to attach PDFs, documents, or images.' },
      { q: 'What if I created the task in the wrong stream (category)?', a: 'Open the task in Tracker, expand the row, and edit the Category field to move it to the correct stream.' },
    ],
    linked: 'Tracker, Dashboard.',
    access: ['admin','sysadmin','manager','admin_clerk','senior_tech','call_logger','junior_tech'],
  },
  'p-new-quote': {
    title: 'New Quote',
    sub: 'Draft a service quotation',
    purpose: 'Create a quotation for services to be rendered. The quote is reviewed and approved before being shared with the client or converted to an invoice. Every submitted quote creates an auditable trail from proposal to billing.',
    steps: [
      'Select the Client. If the client is not listed, create their record in Clients first.',
      'Set the Valid Until date — this is the date after which the client can no longer accept the quote at these prices. Minimum 2 weeks out; 30 days is standard.',
      'Add an internal Reference note (optional) to help identify the quote in the list — e.g. "CCTV Upgrade Proposal Q2 2026".',
      'Add line items — click "+ Add Line". For each line: enter a description, quantity, and unit rate (ex-VAT). The system calculates the line total.',
      'Break labour and materials into separate lines — do not bundle them. "Labour: 8 hours × R450/hr" and "Materials: Cable (50m) × R35/m" are clearer than "Installation and supplies".',
      'Review the subtotal, VAT amount, and total. Confirm the VAT treatment is correct for this client.',
      'Add any notes or terms in the Notes field — e.g. payment terms, delivery lead time, validity conditions.',
      'Click Submit to send for approval. Click Save Draft to save without submitting if you need to return later.',
    ],
    tips: [
      'Itemised quotes with clear descriptions get approved faster than bundled ones — the approver can see exactly what is being billed.',
      'Include a brief scope-of-work explanation in the Notes field. It helps the approver understand the context and helps the client during sign-off.',
      'Set valid-until dates generously — a quote that expires during client review requires a full restart.',
    ],
    faqs: [
      { q: 'Can I save as a draft and come back later?', a: 'Yes — click Save Draft. The quote stays in Draft status and does not enter the approval queue until you click Submit.' },
      { q: 'Can I duplicate an existing quote?', a: 'Not yet — recreate it manually for now. Submit a suggestion below to prioritise this feature.' },
      { q: 'Can I submit a quote without line items?', a: 'No — at least one line item is required. A quote with no line items cannot be approved or converted to an invoice.' },
      { q: 'What if I submitted a quote with an error?', a: 'If it is still Pending Approval, contact the approver and ask them to decline it with a reason. Revise and resubmit. Admins can also edit pending quotes directly.' },
    ],
    linked: 'Quote Log, Invoices, Clients.',
    access: ['admin','sysadmin','manager','senior_tech'],
  },
  'p-new-invoice': {
    title: 'New Invoice',
    sub: 'Create a client invoice',
    purpose: 'Generate a tax invoice for services delivered. Invoices can be created from scratch or auto-generated from an approved quote. Every saved invoice is immediately visible in the Invoices module.',
    steps: [
      'Select the Client from the dropdown.',
      'Set the Billing Period — use a descriptive format: "May 2026 Armed Response Retainer" or "CALL-0042 — Fence Repair 15 May 2026".',
      'Set the Invoice Date — this is the official billing date that appears on the invoice.',
      'Add line items: description, quantity, and unit rate (ex-VAT). VAT is calculated and displayed automatically.',
      'For discounts: add a line item with a negative rate (e.g. quantity 1, rate −500.00, description "Discount — Early Settlement").',
      'Review the total carefully — check client name, billing period, all line descriptions, and the VAT total before saving.',
      'Click Save. The invoice is created with an auto-generated reference number (INV-XXX) and is immediately live.',
      'Navigate to the Invoices module and use the Send button to email the invoice to the client\'s billing contact.',
    ],
    tips: [
      'Always cross-reference the invoice against the callout or approved quote before saving — ensures you are billing for work that was actually done and agreed.',
      'Cross-check the client\'s billing email in the Clients record before sending. Invoices sent to the wrong contact cause payment delays.',
      'Use the same description format consistently across all invoices for the same service — it makes statements and aged debtor reports much easier to read.',
    ],
    faqs: [
      { q: 'What invoice number format is used?', a: 'The system auto-generates sequential references (INV-001, INV-002, etc.). Do not attempt to set or change the number manually.' },
      { q: 'Can I add a discount line item?', a: 'Yes — add a line with a negative unit rate. The system will subtract it from the total correctly.' },
      { q: 'What if I need to invoice the same client for multiple callouts?', a: 'You can add multiple line items to one invoice — one line per callout or service. This is the preferred approach for monthly billing consolidation.' },
      { q: 'Can I save an invoice as a draft before sending?', a: 'The invoice is saved immediately on creation but does not leave the portal until you click Send. You have time to review it first.' },
    ],
    linked: 'Invoices, Clients, Quotes.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-log-payment': {
    title: 'Log Payment',
    sub: 'Record a payment received',
    purpose: 'Record a payment against a specific outstanding invoice. Logging a payment marks the invoice as Paid (or Partial if not fully settled) and feeds the transaction into the financial records. This is a critical step — unlogged payments inflate the outstanding balance and distort financial reports.',
    steps: [
      'Select the Invoice from the dropdown — only invoices with an outstanding balance are listed.',
      'Enter the Payment Date — the date the payment actually cleared your bank account (not the date the client initiated it).',
      'Enter the Amount Received. If the client paid the full invoice amount, this will match the invoice total. If partial, enter only the amount received.',
      'Enter the Bank Reference — the EFT reference, cheque number, or transaction ID from your bank statement. This is required for reconciliation.',
      'Add any Notes if relevant — e.g. "Client confirmed payment by email on 1 Jun 2026 before bank clearance".',
      'Click Confirm. The invoice status updates immediately: Paid if fully settled, Partial if still outstanding.',
    ],
    tips: [
      'Only log a payment once it has cleared the bank. Do not log a payment on the day a client sends an EFT — EFTs can fail.',
      'Always include the bank reference number. Without it, you cannot match this entry to a specific bank statement line during reconciliation.',
      'If a client regularly pays short (e.g. rounds down), log the exact amount received. Discuss the shortfall separately — do not adjust the invoice.',
    ],
    faqs: [
      { q: 'What if a client pays two invoices in one EFT transfer?', a: 'Log a separate payment entry for each invoice. Use the same bank reference for both entries — this links them to the same transaction.' },
      { q: 'I logged the wrong amount — how do I fix it?', a: 'Contact an Admin immediately. Payment records cannot be self-corrected to maintain audit trail integrity. The Admin will reverse the entry and you can re-log correctly.' },
      { q: 'What if the client paid but the invoice is not in the dropdown?', a: 'The invoice may already be marked as Paid, or it may not exist yet. Check the Invoices module. If the invoice has not been created, create it first and then log the payment.' },
      { q: 'Does logging a payment automatically create a transaction entry?', a: 'Yes — a corresponding Income transaction is created in the Transactions ledger automatically. You do not need to log it separately.' },
    ],
    linked: 'Invoices, Transactions.',
    access: ['admin','sysadmin','manager','admin_clerk'],
  },
  'p-safety-detail': {
    title: 'Safety File Detail',
    sub: 'Compliance score & action plan',
    purpose: 'The full compliance record for a single safety file — overall audit score, section-by-section breakdown, corrective action plan, personnel records, attachments, and policy acknowledgements. This is where compliance gaps are worked through and resolved.',
    steps: [
      'Check the Compliance Score badge at the top: GREEN = 90%+ (compliant), YELLOW = 75–89% (monitor), ORANGE = 51–74% (action required within 30 days), RED = below 51% (critical — immediate action).',
      'Review the Summary of Compliance table — it shows each audit section with its score and number of non-compliant items. Identify the highest-impact sections.',
      'Open the Action Plan tab to see every item that is not to standard. Each item shows the finding, required action, and current status.',
      'Assign an owner and target date to each action item. Enter these in the Notes field — "Owner: J. Smith | Due: 15 Jun 2026".',
      'Use the Status dropdown on each item to track progress: Open → In Progress → Fixed. Update this as the contractor works through corrections.',
      'When a corrective action is closed, upload the supporting evidence in the Attachments section (e.g. photo of repaired equipment, updated appointment letter).',
      'Once all critical and high-priority items are resolved and supporting documents are attached, click Approve to lock the file as compliant.',
      'Use Generate Docs to produce template corrective action documents for all outstanding items in one step.',
      'Use the Tracker button to download a standalone Excel action tracker to share with the contractor.',
    ],
    tips: [
      'Focus on RED and ORANGE sections first — these carry legal liability under the OHS Act and COID Act.',
      'Never leave the owner and deadline fields blank on an action item. Unassigned actions never get fixed.',
      'The Projected Score (shown alongside the Baseline) updates in real time as you mark items Fixed — use it to show the contractor what their score will look like on re-submission.',
      'Print or download the full pack before every compliance review meeting — it includes all sections, findings, and the current action plan.',
      'If a contractor disputes a finding, note it in the finding\'s notes field with the date and their response. Do not remove or soften the finding unless you have verified it is incorrect.',
    ],
    faqs: [
      { q: 'What do the score colour bands mean exactly?', a: 'GREEN = 90%+ (fully compliant, no action required), YELLOW = 75–89% (minor non-conformances to monitor), ORANGE = 51–74% (significant gaps, corrective action plan required within 30 days), RED = below 51% (critical non-compliance — work may need to be stopped until resolved).' },
      { q: 'Can I edit the audit after it is submitted?', a: 'Use the Edit button while the file is in Draft or Active status. Once Approved, the record is locked to protect its legal integrity. Contact an Admin if a genuine factual amendment is needed — all changes are logged.' },
      { q: 'How do I track corrective actions?', a: 'Use the Status dropdown and Notes field on each Action Plan item. For a version to share with the contractor outside the portal, click the Tracker button to download an Excel-based action tracker.' },
      { q: 'What is the Baseline score vs the Projected score?', a: 'Baseline is the score the file received when first submitted to Astute Insights. Projected shows what the score will be on re-submission if all items currently marked Fixed are accepted. Use Projected to show progress to the client.' },
      { q: 'Who can approve a safety file?', a: 'Only Admin and Manager roles. The approver must verify that all critical and high-priority corrective actions are closed and that supporting documents are attached before approving.' },
      { q: 'What is the Generate Docs button?', a: 'It creates template corrective action documents for all non-compliant items in the file in a single operation — saving the auditor from creating documents one by one. Review and customise each document before sending to the contractor.' },
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
  'p-pl-ledger': [
    { perm: 'finance.income', label: 'View P&L ledger' },
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
  'p-tracker':      [
    { perm: 'task.view',    label: 'View company task streams' },
    { perm: 'callout.view', label: 'View the operational Call Log stream' },
  ],
  'p-new-task':     [{ perm: 'task.create', label: 'Create new tasks' }],
  'p-new-callout':  [{ perm: 'capture.new_callout',  label: 'Log new callouts' }],
  'p-new-quote':    [{ perm: 'capture.new_quote',    label: 'Submit new quotes' }],
  'p-new-invoice':  [{ perm: 'capture.new_invoice',  label: 'Create new invoices' }],
  'p-log-payment':  [{ perm: 'capture.log_payment',  label: 'Log payments' }],
};

/* Per-page quick navigation actions (filtered to user's permissions at render time) */
const PAGE_ACTIONS = {
  'p-dashboard':         [{ label:'Operations', page:'p-ops-dashboard' }, { label:'Finance', page:'p-finance-dashboard' }, { label:'Support', page:'p-support-dashboard' }],
  'p-ops-dashboard':     [{ label:'Tracker', page:'p-tracker', perm:'task.view' }, { label:'Quotes', page:'p-quotes', perm:'quote.view' }, { label:'Reports', page:'p-reports' }, { label:'Timeline', page:'p-timeline' }],
  'p-timeline':          [{ label:'Tracker', page:'p-tracker', perm:'task.view' }, { label:'Quotes', page:'p-quotes', perm:'quote.view' }],
  'p-callouts':          [{ label:'Tracker', page:'p-tracker', perm:'task.view' }, { label:'+ Log Call', page:'p-new-callout', perm:'capture.new_callout' }],
  'p-tracker':           [{ label:'+ New Task', page:'p-new-task', perm:'task.create' }],
  'p-new-task':          [{ label:'Tracker', page:'p-tracker', perm:'task.view' }],
  'p-quotes':            [{ label:'+ Submit Quote', page:'p-new-quote', perm:'capture.new_quote' }, { label:'Tracker', page:'p-tracker', perm:'task.view' }, { label:'Invoices', page:'p-invoices', perm:'invoice.view' }],
  'p-finance-dashboard': [{ label:'P&L Ledger', page:'p-pl-ledger', perm:'finance.income' }, { label:'Invoices', page:'p-invoices', perm:'invoice.view' }, { label:'Transactions', page:'p-transactions', perm:'finance.transactions' }],
  'p-pl-ledger':         [{ label:'Invoices', page:'p-invoices', perm:'invoice.view' }, { label:'Income Stmt', page:'p-income', perm:'finance.income' }, { label:'Reconciliation', page:'p-reconcile', perm:'finance.transactions' }],
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
  'p-new-callout':       [{ label:'Tracker', page:'p-tracker', perm:'task.view' }],
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
      <div class="ipanel-section-lbl">Your access — ${esc((SESSION.roles?.length>1?SESSION.roles.map(r=>ROLE_LABELS[r]||r).join(', '):(ROLE_LABELS[SESSION.role]||SESSION.role)))}</div>
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
const SVC_IMAGES={
  'Armed Response 24/7':           './images/services/armed-response-247.jpg',
  'Panic Button Monitoring':        './images/services/panic-button-monitoring.jpg',
  'Perimeter Patrol':               './images/services/perimeter-patrol.jpg',
  'Alarm Response':                 './images/services/alarm-response.jpg',
  'Rapid Reaction Unit':            './images/services/rapid-reaction-unit.jpg',
  'High-Risk Escort':               './images/services/high-risk-escort.jpg',
  'Armed Standby Guard':            './images/services/armed-standby-guard.jpg',
  'CCTV Installation':              './images/services/cctv-installation.jpg',
  'Camera System Maintenance':      './images/services/camera-system-maintenance.jpg',
  'Remote Video Monitoring':        './images/services/remote-video-monitoring.jpg',
  'Control Room Services':          './images/services/control-room-services.jpg',
  'Thermal Imaging':                './images/services/thermal-imaging.jpg',
  'License Plate Recognition':      './images/services/license-plate-recognition.jpg',
  'Drone Surveillance':             './images/services/drone-surveillance.jpg',
  'Analogue-to-IP Upgrades':        './images/services/analogue-to-ip-upgrades.jpg',
  'Biometric Access Control':       './images/services/biometric-access-control.jpg',
  'Turnstile Installation':         './images/services/turnstile-installation.jpg',
  'Electric Gates & Booms':         './images/services/electric-gates-booms.jpg',
  'Visitor Management System':      './images/services/visitor-management-system.jpg',
  'Card & FOB Systems':             './images/services/card-fob-systems.jpg',
  'Intercom & Video Entry':         './images/services/intercom-video-entry.jpg',
  'Industrial Guard Deployment':    './images/services/industrial-guard-deployment.jpg',
  'Retail Floor Security':          './images/services/retail-floor-security.jpg',
  'Concierge Security Officers':    './images/services/concierge-security-officers.jpg',
  'Cash-in-Transit Escort':         './images/services/cash-in-transit-escort.jpg',
  'Parking Marshal Services':       './images/services/parking-marshal-services.jpg',
  'Site Security Manager':          './images/services/site-security-manager.jpg',
  'Construction Site Security':     './images/services/construction-site-security.jpg',
  'Estate & Complex Guarding':      './images/services/estate-complex-guarding.jpg',
  'Alarm System Installation':      './images/services/alarm-system-installation.jpg',
  'Alarm Monitoring':               './images/services/alarm-monitoring.jpg',
  'Electric Fence Installation':    './images/services/electric-fence-installation.jpg',
  'Intruder Detection Systems':     './images/services/intruder-detection-systems.jpg',
  'Smoke & Gas Detection':          './images/services/smoke-gas-detection.jpg',
  'Fire Alarm Integration':         './images/services/fire-alarm-integration.jpg',
  'Corporate Investigations':       './images/services/corporate-investigations.jpg',
  'Insurance Fraud Investigation':  './images/services/insurance-fraud-investigation.jpg',
  'Background Screening':           './images/services/background-screening.jpg',
  'Asset Tracing':                  './images/services/asset-tracing.jpg',
  'Witness Protection':             './images/services/witness-protection.jpg',
  'Security Risk Assessment':       './images/services/security-risk-assessment.jpg',
  'Business Continuity Planning':   './images/services/business-continuity-planning.jpg',
  'Threat & Vulnerability Analysis':'./images/services/threat-vulnerability-analysis.jpg',
  'Security Audit':                 './images/services/security-audit.jpg',
  'Emergency Response Planning':    './images/services/emergency-response-planning.jpg',
  'Festival & Concert Security':    './images/services/festival-concert-security.jpg',
  'Corporate Event Security':       './images/services/corporate-event-security.jpg',
  'VIP & Executive Protection':     './images/services/vip-executive-protection.jpg',
  'Crowd Management':               './images/services/crowd-management.jpg',
  'Sports Event Security':          './images/services/sports-event-security.jpg',
};
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
  document.getElementById('home-cats').innerHTML=CATEGORIES.map(c=>`<button type="button" class="cat-card" data-action="pubNavCat" data-cat="${esc(c.name)}" aria-controls="svc-grid" aria-label="Show ${esc(c.name)} services"><span class="cat-icon" aria-hidden="true">${c.icon}</span><span class="cat-name">${esc(c.name)}</span><span class="cat-count">${c.count} SERVICES</span></button>`).join('');
}
function pubNavCat(el){
  const cat=el.dataset.cat;
  if(cat && window._svcF && window._svcF.pub){
    const chip=document.querySelector(`#svc-filters .filter-chip[data-cat="${cat}"]`);
    if(chip) filterSvc(chip,cat,'pub');
  }
  document.querySelectorAll('#home-cats .cat-card').forEach(card=>card.classList.toggle('active',card===el));
  history.replaceState(null,'','#services');
  document.getElementById('svc-filters')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
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
    document.getElementById(gridId).innerHTML=items.map(s=>`<div class="svc-card"><div class="svc-img-wrap"><img src="${SVC_IMAGES[s.name]||''}" alt="${esc(s.name)}" class="svc-img" loading="lazy"><div class="svc-img-scrim"></div></div><div class="svc-card-body"><div class="svc-cat-dot"></div><div><div class="svc-name">${esc(s.name)}</div><div class="svc-cat">${esc(s.cat)}</div></div></div></div>`).join('');
  };
  const chips=['All',...CATEGORIES.map(c=>c.name)];
  document.getElementById(filterId).innerHTML=chips.map(c=>`<button type="button" class="filter-chip ${c==='All'?'active':''}" data-action="filterSvc" data-cat="${esc(c)}" data-ctx="${ctx}" aria-pressed="${c==='All'?'true':'false'}">${esc(c)}</button>`).join('');
  render();
  window._svcF=window._svcF||{};
  window._svcF[ctx]={setActive:(v)=>{active=v==='All'?'all':v;render();}};
}
function filterSvc(el,cat,ctx){
  document.querySelectorAll(`#${ctx==='pub'?'svc-filters':'portal-svc-filters'} .filter-chip`).forEach(c=>{
    c.classList.remove('active');
    c.setAttribute('aria-pressed','false');
  });
  el.classList.add('active');
  el.setAttribute('aria-pressed','true');
  window._svcF[ctx].setActive(cat);
}
function submitContact(){
  const n=document.getElementById('cf-name').value.trim();
  if(!n){alert('Please fill in your name');return;}
  $show(document.getElementById('cf-success'), 'block');
  ['cf-name','cf-company','cf-phone','cf-email','cf-location','cf-message'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
}

async function submitEnquiry() {
  const name    = document.getElementById('pcf-name')?.value.trim() || '';
  const company = document.getElementById('pcf-co')?.value.trim()   || '';
  const phone   = document.getElementById('pcf-ph')?.value.trim()   || '';
  const email   = document.getElementById('pcf-em')?.value.trim()   || '';
  const service = document.getElementById('pcf-svc')?.value         || '';
  const message = document.getElementById('pcf-msg')?.value.trim()  || '';
  if (!name)  { toast('Name is required', 'err');  return; }
  if (!email) { toast('Email is required', 'err'); return; }
  const btn = document.querySelector('[data-action="submitEnquiry"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  const r = await api('POST', 'enquiries.php', { name, company, phone, email, service, message });
  if (btn) { btn.disabled = false; btn.textContent = 'Submit Enquiry'; }
  if (!r.success) { toast(r.error || 'Failed to submit enquiry', 'err'); return; }
  toast('Enquiry submitted — we\'ll be in touch.', 'ok');
  ['pcf-name','pcf-co','pcf-ph','pcf-em','pcf-msg'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const svc = document.getElementById('pcf-svc'); if (svc) svc.selectedIndex = 0;
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
    $hide(document.getElementById('login-panel'));
    $hide(document.getElementById('forgot-panel'));
    $show(document.getElementById('newpass-panel'), 'block');
  } else {
    showLoginPanel();
  }
}
function fillCreds(u,p){ document.getElementById('l-user').value=u; document.getElementById('l-pass').value=p; }

function showPortalPage(id, el){
  if(id === 'p-callouts') {
    _trackerCat = 'call_log';
    id = 'p-tracker';
  }
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
    'p-ops-dashboard':     async()=>{ renderOpsDashboard(); await Promise.all([refreshTasks(),refreshCallouts(),refreshQuotes()]); renderOpsDashboard(); updateBadges(); },
    'p-reports':          async()=>{},
    'p-finance-dashboard': async()=>{ await Promise.all([refreshInvoices(),refreshTransactions()]); await renderFinDashboard(); updateBadges(); },
    'p-support-dashboard': async()=>{ renderSupDashboard(); await Promise.all([refreshUsers(),refreshSafetyFiles()]); renderSupDashboard(); updateBadges(); },
    'p-transactions': async()=>{ renderTransactions(''); await refreshTransactions(); renderTransactions(''); },
    'p-invoices':     async()=>{ renderInvoices(''); await refreshInvoices(); renderInvoices(''); updateBadges(); },
    'p-quotes':       async()=>{ renderQuotes(''); await refreshQuotes(); renderQuotes(''); updateBadges(); },
    'p-callouts':     async()=>{ renderCallouts(''); await refreshCallouts(); renderCallouts(''); updateBadges(); },
    'p-tracker':      async()=>{ renderTracker(); await Promise.all([refreshTasks(), refreshCallouts()]); renderTracker(); updateBadges(); },
    'p-new-task':     async()=>{ initNewTask(); },
    'p-timeline':     async()=>{ renderTimeline(); },
    'p-statement':    async()=>{ renderStatement(); },
    'p-pl-ledger':    async()=>{ renderPLLedger(); },
    'p-income':       async()=>{ await Promise.all([refreshInvoices(), refreshTransactions()]); renderIncome(); },
    'p-reconcile':    async()=>{ await refreshTransactions(); renderReconcile(); },
    'p-log-payment':  async()=>{ await refreshInvoices(); renderPayList(); },
    'p-audit':        async()=>{ const r=await api('GET','audit.php?limit=200'); AUDIT_LOG=(r.data||[]).map(e=>({ts:e.created_at||'',user:e.username,role:'',action:e.action,detail:e.detail,level:'info'})); renderAudit(); },
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
   DASHBOARD  (widget-order-aware — iterates getDashWidgetOrder)
═══════════════════════════════════════════════════════ */
function renderDashboard(){
  const container = document.getElementById('dash-main-content');
  if(!container) return;

  const prefs = getDashPrefs();
  const order = getDashWidgetOrder(prefs);
  const now   = new Date();

  // Pre-compute shared data once
  const openTasks      = proxyDB.tasks.filter(t=>t.status==='Open'||t.status==='In Progress').length;
  const urgentTasks    = proxyDB.tasks.filter(t=>t.priority==='Urgent'&&(t.status==='Open'||t.status==='In Progress')).length;
  const tasksDueToday  = proxyDB.tasks.filter(t=>t.due_date===localDateStr()&&(t.status==='Open'||t.status==='In Progress')).length;
  const open           = proxyDB.callouts.filter(c=>c.status==='Open'||c.status==='In Progress').length;
  const pq             = proxyDB.quotes.filter(q=>q.status==='Draft'||q.status==='Sent'||q.status==='Pending Approval').length;
  const mtd            = proxyDB.invoices.filter(i=>{const d=new Date(i.date+'T00:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((a,i)=>a+i.amount,0);
  const net            = proxyDB.bank.reduce((a,b)=>a+(b.credit||0)-(b.debit||0),0);
  const completedMTD   = proxyDB.callouts.filter(c=>{const cd=new Date(c.date+'T00:00:00');return (c.status==='Completed'||c.status==='Invoiced')&&cd.getMonth()===now.getMonth()&&cd.getFullYear()===now.getFullYear();}).length;
  const outstandingVal = proxyDB.invoices.filter(i=>i.status==='Sent'||i.status==='Overdue').reduce((a,i)=>a+i.amount,0);
  const ytd            = invoicePaymentRevenue(now.getFullYear());
  const quotePipeVal   = proxyDB.quotes.filter(q=>q.status==='Sent'||q.status==='Pending Approval').reduce((a,q)=>a+((q.items||[]).reduce((s,it)=>s+((it.qty||0)*(it.unit||0)),0)),0);
  const overdue        = proxyDB.invoices.filter(i=>i.status==='Overdue').length;
  const urgent         = proxyDB.callouts.filter(c=>(c.priority==='Urgent'||c.priority==='Emergency')&&(c.status==='Open'||c.status==='In Progress')).length;
  const pendingQA      = proxyDB.quotes.filter(q=>q.approvalStatus==='pending').length;
  const months=[];
  for(let i=5;i>=0;i--){const dt=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({lbl:dt.toLocaleDateString('en-ZA',{month:'short'}),m:dt.getMonth(),y:dt.getFullYear()});}
  const revData = months.map(m=>invoicePaymentRevenue(m.y, m.m));

  const d = { now, openTasks, urgentTasks, tasksDueToday, open, pq, mtd, net, completedMTD, outstandingVal, ytd, quotePipeVal, overdue, urgent, pendingQA, months, revData };

  let html = _dashExecutiveSummary(d);
  let hasContent = false;
  for(const wid of order){
    if(!isWidgetOn(wid, prefs)) continue;
    const block = _buildDashBlock(wid, d);
    if(block){ html += block; hasContent = true; }
  }

  if(!hasContent)
    html+=`<div class="dash-empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><p>Your custom dashboard widgets are hidden.<br><button class="btn btn-g btn-s" data-action="showDashEditor">Edit Layout</button> to add widgets.</p></div>`;

  container.innerHTML = html;
  { let css=''; container.querySelectorAll('.cbar[data-h]').forEach((b,i)=>{ b.dataset.cbi=i; css+=`.cbar[data-cbi="${i}"]{height:${b.dataset.h}px;}`; }); if(css)_injectStyle('cbar-op-css',css); }
  applyProgFills(container);

  // Nav badges (always update regardless of widget visibility)
  const nbCo=document.getElementById('nb-co');if(nbCo)nbCo.textContent=openTasks+open;
  const nbInv=document.getElementById('nb-inv');if(nbInv)nbInv.textContent=proxyDB.invoices.filter(i=>i.status==='Sent'||i.status==='Overdue').length;
  const nbQte=document.getElementById('nb-qte');if(nbQte)nbQte.textContent=proxyDB.quotes.filter(q=>q.status==='Pending Approval').length;
}

/* ── Per-widget block builders ─────────────────────── */
function _dashExecutiveSummary(d){
  const activeWork = d.openTasks + d.open;
  const attention = d.urgentTasks + d.urgent + d.overdue + d.pendingQA;
  const maxRev = Math.max(...d.revData, 1);
  const revBars = d.revData.map((v,i)=>`<div class="exec-trend-bar-wrap"><div class="exec-trend-val">${v>0?'R'+Math.round(v/1000)+'K':''}</div><div class="exec-trend-bar" style="height:${Math.max(6,Math.round((v/maxRev)*100))}%"></div><div class="exec-trend-label">${d.months[i].lbl}</div></div>`).join('');
  const streamTotal = Math.max(activeWork, 1);
  const openTaskStreams = proxyDB.tasks.filter(t=>t.status==='Open'||t.status==='In Progress');
  const streams = [
    {label:'Admin', value:openTaskStreams.filter(t=>t.category==='admin').length},
    {label:'Sales', value:openTaskStreams.filter(t=>t.category==='sales').length},
    {label:'General', value:openTaskStreams.filter(t=>t.category==='general').length},
    {label:'Call Log', value:d.open},
  ].map(s=>`<div class="exec-status-row"><span>${s.label}</span><strong>${s.value}</strong><div class="exec-status-meter"><i style="width:${Math.round(s.value/streamTotal*100)}%"></i></div></div>`).join('');
  const alertCards = [
    {label:'Urgent Tasks', value:d.urgentTasks, sub:'Internal work', tone:d.urgentTasks>0?'warn':''},
    {label:'Urgent Callouts', value:d.urgent, sub:'Priority dispatch', tone:d.urgent>0?'warn':''},
    {label:'Overdue Invoices', value:d.overdue, sub:'Finance follow-up', tone:d.overdue>0?'danger':''},
    {label:'Quote Approvals', value:d.pendingQA, sub:'Manager review', tone:d.pendingQA>0?'info':''},
  ].map(a=>`<div class="exec-alert-card ${a.tone}"><div class="exec-alert-label">${a.label}</div><div class="exec-alert-value">${a.value}</div><div class="exec-alert-sub">${a.sub}</div></div>`).join('');

  return `<section class="exec-dash">
    <div class="exec-hero">
      <div>
        <div class="exec-eyebrow">Executive Dashboard</div>
        <h2>AECI Chempark health check</h2>
        <p>Leadership view of open work, finance pressure, urgent operations, and compliance attention points.</p>
      </div>
      <div class="exec-hero-actions">
        <button class="btn btn-p" data-action="navPage" data-page="p-ops-dashboard">Open Operations</button>
        <button class="btn btn-g" data-action="navPage" data-page="p-finance-dashboard">Review Finance</button>
      </div>
    </div>
    <div class="exec-kpi-grid">
      <div class="exec-kpi"><span>Active Work</span><strong>${activeWork}</strong><em>Tasks + callouts</em></div>
      <div class="exec-kpi"><span>Attention Items</span><strong>${attention}</strong><em>Urgent, overdue, approvals</em></div>
      <div class="exec-kpi"><span>MTD Revenue</span><strong>${fmt(d.mtd)}</strong><em>Invoiced this month</em></div>
      <div class="exec-kpi"><span>Active Clients</span><strong>${proxyDB.clients.filter(c=>c.active!==false).length}</strong><em>Client accounts</em></div>
    </div>
    <div class="exec-trend-row">
      <div class="panel exec-panel">
        <div class="ph"><div class="ph-title">Revenue Trend</div><span class="ph-badge">6 Months</span></div>
        <div class="exec-trend-chart">${revBars}</div>
      </div>
      <div class="panel exec-panel">
        <div class="ph"><div class="ph-title">Open Work Status</div><span class="ph-badge">${activeWork} active</span></div>
        <div class="pb">${streams}</div>
      </div>
    </div>
    <div class="exec-alert-grid">${alertCards}</div>
  </section>`;
}

function _buildDashBlock(wid, d){
  switch(wid){
    case 'w-ops':        return _dashBlockOps(d);
    case 'w-fin':        return _dashBlockFin(d);
    case 'w-alerts':     return _dashBlockAlerts(d);
    case 'w-compliance': return _dashBlockCompliance();
    case 'w-compare':    return _dashBlockCompare(d);
    default: return '';
  }
}

function _dashBlockOps(d){
  if(!can('task.view')&&!can('callout.view')) return '';
  const {openTasks, urgentTasks, tasksDueToday, open, pq} = d;
  const kv = v => String(v).length>8 ? ' kval--compact' : '';

  const kpiCards = [
    can('task.view') ? `<div class="kcard k1"><div class="klbl">Open Tasks</div><div class="kval${kv(openTasks)}">${openTasks}</div><div class="ksub">Admin, Sales & General</div></div>` : '',
    can('task.view') ? `<div class="kcard k2"><div class="klbl">Urgent Tasks</div><div class="kval${kv(urgentTasks)}">${urgentTasks}</div><div class="ksub">Immediate attention</div></div>` : '',
    can('callout.view') ? `<div class="kcard k4"><div class="klbl">Open Callouts</div><div class="kval${kv(open)}">${open}</div><div class="ksub">Operational jobs only</div></div>` : '',
    can('quote.view') ? `<div class="kcard k3"><div class="klbl">Pending Quotes</div><div class="kval${kv(pq)}">${pq}</div><div class="ksub">Awaiting approval</div></div>` : '',
  ].filter(Boolean).join('');

  const recentTasks = [...proxyDB.tasks].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')).slice(0,5);
  const taskRows = recentTasks.length
    ? recentTasks.map(t=>`<tr><td class="mono">${esc(t.ref_id)}</td><td class="tc-11">${esc(t.title.substring(0,38))}${t.title.length>38?'…':''}</td><td><span class="badge ${TASK_STATUS_BADGE[t.status]||''}">${esc(t.status)}</span></td></tr>`).join('')
    : '<tr><td colspan="3" class="tc-empty-sm">No tracker activity</td></tr>';

  const activeTasks = proxyDB.tasks.filter(t=>t.status==='Open'||t.status==='In Progress');
  const workTotal = Math.max(activeTasks.length + open, 1);
  const streamBars = [
    {key:'admin', label:'Admin', col:'var(--blue)'},
    {key:'sales', label:'Sales', col:'var(--amber)'},
    {key:'general', label:'General', col:'var(--green)'},
    {key:'call_log', label:'Call Log', col:'var(--ember)'},
  ].map(({key,label,col})=>{
    const cnt = key==='call_log' ? open : activeTasks.filter(t=>t.category===key).length;
    return `<div class="mb-14"><div class="flex-sb mb-5"><span class="mlbl-xs">${label}</span><span class="mlbl-sm">${cnt}</span></div><div class="prog-bar"><div class="prog-fill" data-w="${Math.round(cnt/workTotal*100)}" data-bg="${col}"></div></div></div>`;
  }).join('');

  const panelTracker = `<div class="panel">
    <div class="ph"><div class="ph-title">Recent Tracker Activity</div><button class="btn btn-g btn-s" data-action="navPage" data-page="p-tracker">View All</button></div>
    <div class="tw"><table><thead><tr><th>Ref</th><th>Task</th><th>Status</th></tr></thead><tbody>${taskRows}</tbody></table></div>
  </div>`;
  const panelActivity = `<div class="panel">
    <div class="ph"><div class="ph-title">Open Work by Stream</div></div>
    <div class="pb">${streamBars}</div>
  </div>`;

  return `<div class="kgrid kgrid--auto">${kpiCards}</div><div class="twocol">${panelTracker}${panelActivity}</div>`;
}

function _dashBlockFin(d){
  if(!can('invoice.view')&&!can('finance.income')) return '';
  const {mtd, net, ytd, outstandingVal, quotePipeVal, months, revData} = d;
  const kv = v => String(v).length>8 ? ' kval--compact' : '';
  const fmtMtd=fmt(mtd), fmtNet=fmt(net), fmtYtd=fmt(ytd), fmtOut=fmt(outstandingVal), fmtQpv=fmt(quotePipeVal);

  const kpiCards = [
    can('invoice.view')    ? `<div class="kcard k2"><div class="klbl">Invoiced MTD</div><div class="kval${kv(fmtMtd)}">${fmtMtd}</div><div class="ksub">Month to date</div></div>` : '',
    can('finance.income')  ? `<div class="kcard k4"><div class="klbl">Net Balance</div><div class="kval${kv(fmtNet)}">${fmtNet}</div><div class="ksub">Credits − Debits</div></div>` : '',
    can('finance.income')  ? `<div class="kcard k1"><div class="klbl">YTD Revenue</div><div class="kval${kv(fmtYtd)}">${fmtYtd}</div><div class="ksub">Paid invoices this year</div></div>` : '',
    can('finance.income')  ? `<div class="kcard k2"><div class="klbl">Outstanding</div><div class="kval${kv(fmtOut)}">${fmtOut}</div><div class="ksub">Unpaid invoices total</div></div>` : '',
    (can('quote.view')&&quotePipeVal>0) ? `<div class="kcard k3"><div class="klbl">Quote Pipeline</div><div class="kval${kv(fmtQpv)}">${fmtQpv}</div><div class="ksub">Active quotes value</div></div>` : '',
  ].filter(Boolean).join('');
  if(!kpiCards) return '';

  const maxRev = Math.max(...revData,1);
  const chartBars = revData.map((v,i)=>`<div class="cbar-w"><div class="cval">${v>0?'R'+Math.round(v/1000)+'K':''}</div><div class="cbar" data-h="${Math.max(4,Math.round((v/maxRev)*100))}" title="${fmt(v)}"></div><div class="clbl">${months[i].lbl}</div></div>`).join('');

  const invPaid=proxyDB.invoices.filter(i=>i.status==='Paid');
  const invSent=proxyDB.invoices.filter(i=>i.status==='Sent');
  const invOverdue=proxyDB.invoices.filter(i=>i.status==='Overdue');
  const invDraft=proxyDB.invoices.filter(i=>i.status==='Draft');
  const invTotal=Math.max(proxyDB.invoices.length,1);
  const agingBars=[
    {lbl:'Paid',   cnt:invPaid.length,   val:fmt(invPaid.reduce((a,i)=>a+i.amount,0)),   col:'var(--green)'},
    {lbl:'Sent',   cnt:invSent.length,   val:fmt(invSent.reduce((a,i)=>a+i.amount,0)),   col:'var(--amber)'},
    {lbl:'Overdue',cnt:invOverdue.length,val:fmt(invOverdue.reduce((a,i)=>a+i.amount,0)),col:'var(--ember)'},
    {lbl:'Draft',  cnt:invDraft.length,  val:fmt(invDraft.reduce((a,i)=>a+i.amount,0)),  col:'var(--muted)'},
  ].map(r=>`<div class="mb-14"><div class="flex-sb mb-5"><span class="mlbl-xs">${r.lbl} (${r.cnt})</span><span class="mlbl-sm">${r.val}</span></div><div class="prog-bar"><div class="prog-fill" data-w="${Math.round(r.cnt/invTotal*100)}" data-bg="${r.col}"></div></div></div>`).join('');

  const panelRev  = can('finance.income') ? `<div class="panel"><div class="ph"><div class="ph-title">Revenue — 6 Months</div></div><div class="rev-chart-wrap"><div class="chart-bars">${chartBars}</div></div></div>` : null;
  const panelAging= can('invoice.view')   ? `<div class="panel"><div class="ph"><div class="ph-title">Invoice Aging</div><button class="btn btn-g btn-s" data-action="navPage" data-page="p-invoices">View All</button></div><div class="pb">${agingBars}</div></div>` : null;

  const panels = [panelRev, panelAging].filter(Boolean);
  const panelsHtml = panels.length===2 ? `<div class="twocol">${panels.join('')}</div>` : (panels[0]||'');
  return `<div class="kgrid kgrid--auto">${kpiCards}</div>${panelsHtml}`;
}

function _dashBlockAlerts(d){
  const {overdue, urgentTasks, urgent, pendingQA} = d;
  let html='';
  if(overdue>0&&can('invoice.view'))  html+=`<div class="acard danger"><div class="albl">Overdue Invoices</div><div class="acount">${overdue}</div><div class="adesc">Immediate follow-up</div></div>`;
  if(urgentTasks>0&&can('task.view')) html+=`<div class="acard warn"><div class="albl">Urgent Tracker Tasks</div><div class="acount">${urgentTasks}</div><div class="adesc">Internal work requiring attention</div></div>`;
  if(urgent>0)                        html+=`<div class="acard warn"><div class="albl">Urgent Callouts</div><div class="acount">${urgent}</div><div class="adesc">Priority dispatch</div></div>`;
  if(pendingQA>0&&can('quote.approve')) html+=`<div class="acard info"><div class="albl">Quotes Pending Approval</div><div class="acount">${pendingQA}</div><div class="adesc">Tech-submitted, awaiting review</div></div>`;
  return html ? `<div class="alert-strip" id="dash-alerts">${html}</div>` : '';
}

function _dashBlockCompliance(){
  if(!can('safety.view')) return '';
  return `<div class="panel mt2 d-none" id="dash-comp-widget">
    <div class="ph"><div class="ph-title">Compliance Alerts</div><button class="btn btn-g btn-s" data-action="navPage" data-page="p-safety">View Safety Files</button></div>
    <div id="dash-comp-body"></div>
  </div>`;
}

function _dashBlockCompare(d){
  if(!can('invoice.view')&&!can('finance.income')) return '';
  return buildPeriodComparison(d.now, can('callout.view'));
}

function buildPeriodComparison(now, showOps) {
  const cy = now.getFullYear(), cm = now.getMonth();
  const py = cy - 1;
  const curQ = Math.floor(cm / 3);

  // Helpers
  const d = s => new Date(s + 'T00:00:00');

  const revenueIn = (year, test) => proxyDB.bank
    .filter(t => t.cat==='Invoice Payment' && t.credit>0 && t.date && (()=>{const dt=d(t.date);return dt.getFullYear()===year&&test(dt);})())
    .reduce((sum,t)=>sum+t.credit,0);
  const mtdRev   = revenueIn(cy, dt => dt.getMonth()===cm);
  const pyMtdRev = revenueIn(py, dt => dt.getMonth()===cm);
  const ytdRev   = revenueIn(cy, dt => dt.getMonth()<=cm);
  const pyYtdRev = revenueIn(py, dt => dt.getMonth()<=cm);
  const qtdRev   = revenueIn(cy, dt => Math.floor(dt.getMonth()/3)===curQ);
  const pyQtdRev = revenueIn(py, dt => Math.floor(dt.getMonth()/3)===curQ);

  const coMtd   = proxyDB.callouts.filter(c => { const dt=d(c.date); return dt.getFullYear()===cy && dt.getMonth()===cm; }).length;
  const pyCoMtd = proxyDB.callouts.filter(c => { const dt=d(c.date); return dt.getFullYear()===py && dt.getMonth()===cm; }).length;

  const monthName = now.toLocaleDateString('en-ZA', {month:'short'});
  const ytdLbl = `Jan–${monthName}`;

  function pctDelta(curr, prev) {
    if(prev===0 && curr===0) return {pct:0, dir:'flat', noBase:false};
    if(prev===0) return {pct:0, dir:'up', noBase:true};
    const p = Math.round(((curr-prev)/prev)*100);
    return {pct:Math.abs(p), dir: p>0?'up': p<0?'down':'flat', noBase:false};
  }

  function cmpCard(title, curr, prev, isCurrency, subPrev) {
    const {pct, dir, noBase} = pctDelta(curr, prev);
    const arrow = dir==='up'?'↑': dir==='down'?'↓':'→';
    const cls = `pcomp-delta pcomp-delta--${dir}`;
    const currStr = isCurrency ? fmt(curr) : String(curr);
    const prevStr = isCurrency ? fmt(prev) : String(prev);
    const deltaLabel = noBase ? `<span class="${cls}">New</span>` : `<span class="${cls}">${arrow} ${pct}%</span>`;
    return `<div class="pcomp-card">
      <div class="pcomp-title">${title}</div>
      <div class="pcomp-main">
        <span class="pcomp-val">${currStr}</span>
        ${deltaLabel}
      </div>
      <div class="pcomp-footer">vs ${subPrev}: <strong>${prevStr}</strong></div>
    </div>`;
  }

  let cards = '';
  cards += cmpCard('MTD Revenue',    mtdRev,   pyMtdRev,   true,  `${monthName} ${py}`);
  cards += cmpCard('YTD Revenue',    ytdRev,   pyYtdRev,   true,  `${ytdLbl} ${py}`);
  cards += cmpCard(`Q${curQ+1} Revenue`, qtdRev, pyQtdRev, true,  `Q${curQ+1} ${py}`);
  if(showOps && can('callout.view'))
    cards += cmpCard('Callouts MTD', coMtd, pyCoMtd, false, `${monthName} ${py}`);

  return `<div class="panel mt2">
    <div class="ph">
      <div class="ph-title">Period Comparisons</div>
      <span class="ph-badge">vs Prior Year</span>
    </div>
    <div class="pb pcomp-grid">${cards}</div>
  </div>`;
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
  const activeTasks = proxyDB.tasks.filter(isActiveTask);
  const openTasks  = activeTasks.length;
  const urgent     = activeTasks.filter(t => t.priority === 'Urgent').length;
  const overdueTasks = activeTasks.filter(t => taskDueState(t) === 'Overdue');
  const dueTodayTasks = activeTasks.filter(t => taskDueState(t) === 'Due today');
  const openCalls  = proxyDB.callouts.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
  const pendingQA  = proxyDB.quotes.filter(q => q.approvalStatus === 'pending').length;
  const qMTD       = proxyDB.quotes.filter(q => { const d=new Date(q.date+'T00:00:00'); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  const priorityTasks = [...activeTasks].sort((a,b)=>taskUrgencyRank(a)-taskUrgencyRank(b)).slice(0,6);
  const total      = activeTasks.length + openCalls || 1;

  const statBars = [
    {key:'admin', label:'Admin', col:'var(--blue)'},
    {key:'sales', label:'Sales', col:'var(--amber)'},
    {key:'general', label:'General', col:'var(--green)'},
    {key:'call_log', label:'Call Log', col:'var(--ember)'},
  ].map(({key,label,col})=>{
    const cnt = key==='call_log' ? openCalls : activeTasks.filter(t=>t.category===key).length;
    const pct = Math.round(cnt/total*100);
    return `<div class="mb-14">
      <div class="flex-sb mb-5">
        <span class="mlbl-xs">${label}</span>
        <span class="mlbl-sm">${cnt}</span>
      </div>
      <div class="prog-bar">
        <div class="prog-fill" data-w="${pct}" data-bg="${col}"></div>
      </div>
    </div>`;
  }).join('');

  const assigneeCounts = {};
  activeTasks.forEach(t => {
    const names = taskAssigneeName(t).split(',').map(s => s.trim()).filter(Boolean);
    (names.length ? names : ['Unassigned']).forEach(name => { assigneeCounts[name] = (assigneeCounts[name] || 0) + 1; });
  });
  const assigneeMax = Math.max(...Object.values(assigneeCounts), 1);
  const assigneeRows = Object.entries(assigneeCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,count])=>`
    <div class="ops-load-row">
      <div><strong>${esc(name)}</strong><span>${count} active task${count===1?'':'s'}</span></div>
      <div class="prog-bar"><div class="prog-fill" data-w="${Math.max(5,Math.round(count/assigneeMax*100))}" data-bg="var(--amber)"></div></div>
    </div>`).join('') || `<div class="empty-note">No assignee load yet.</div>`;

  const priorityCards = priorityTasks.length
    ? priorityTasks.map(t=>{
        const dueState = taskDueState(t);
        const dueCls = dueState === 'Overdue' ? 'badge-ovr' : dueState === 'Due today' ? 'badge-warn' : 'badge-muted';
        return `<div class="ops-task-card">
          <div class="ops-task-head">
            <span class="mono">${esc(t.ref_id)}</span>
            <span class="${dueCls}">${esc(dueState)}</span>
          </div>
          <div class="ops-task-title">${esc(t.title)}</div>
          <div class="ops-task-meta">${esc(taskAssigneeName(t))} - ${esc(TASK_CATEGORY_LABELS[t.category]||t.category)} - ${taskDueValue(t)?fmtDT(taskDueValue(t)):'No due date'}</div>
        </div>`;
      }).join('')
    : `<div class="empty-note">No active tasks need attention.</div>`;

  const qas = can('task.create') || can('capture.new_callout') || can('capture.new_quote');
  el.innerHTML = `
    <div class="kgrid">
      <div class="kcard k1"><div class="klbl">Open Tasks</div><div class="kval">${openTasks}</div><div class="ksub">Admin, Sales & General</div></div>
      <div class="kcard kcard-ember"><div class="klbl">Urgent Tasks</div><div class="kval kval-ember">${urgent}</div><div class="ksub">Immediate attention</div></div>
      <div class="kcard k2"><div class="klbl">Due / Overdue</div><div class="kval">${dueTodayTasks.length + overdueTasks.length}</div><div class="ksub">${overdueTasks.length} overdue - ${dueTodayTasks.length} due today</div></div>
      <div class="kcard k3"><div class="klbl">Open Callouts</div><div class="kval">${openCalls}</div><div class="ksub">${qMTD} quotes this month - ${pendingQA} pending</div></div>
    </div>
    <div class="twocol">
      <div class="panel">
        <div class="ph">
          <div class="ph-title">Due / Overdue Work</div>
          <button class="btn btn-g btn-s" data-action="navPage" data-page="p-tracker">View All →</button>
        </div>
        <div class="pb ops-task-list">${priorityCards}</div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Assignee Load</div></div>
        <div class="pb">${assigneeRows}</div>
      </div>
    </div>
    <div class="panel mt2">
      <div class="ph"><div class="ph-title">Open Work by Stream</div></div>
      <div class="pb">${statBars}</div>
    </div>
    ${qas ? `<div class="panel mt2">
      <div class="ph"><div class="ph-title">Quick Actions</div></div>
      <div class="pb dash-acts">
        ${can('task.create')?`<button class="btn btn-p" data-action="navPage" data-page="p-new-task">+ New Task</button>`:''}
        ${can('capture.new_callout')?`<button class="btn btn-p" data-action="navPage" data-page="p-new-callout">+ Log Call</button>`:''}
        ${can('capture.new_quote')?`<button class="btn btn-g" data-action="navPage" data-page="p-new-quote">+ Submit Quote</button>`:''}
        <button class="btn btn-g" data-action="navPage" data-page="p-timeline">View Timeline →</button>
      </div>
    </div>` : ''}`;
  applyProgFills(el);
}

async function renderFinDashboard() {
  const el = document.getElementById('fin-dash-content');
  if (!el) return;

  // Show loading skeleton while fetching
  el.innerHTML = `<div class="kgrid kgrid--4" id="fin-dash-kpis"><div class="kcard k4"><div class="klbl">Loading…</div></div></div><div id="fin-dash-body"></div>`;

  let plsData = null;
  try { plsData = await api('GET','pl_ledger.php?action=summary'); } catch(e) {}

  const now = new Date();
  const overdue = proxyDB.invoices.filter(i=>i.status==='Overdue');
  const sent    = proxyDB.invoices.filter(i=>i.status==='Sent');

  // P&L aligned KPIs (from remittances + supplier costs DB)
  const bankConf    = plsData?.bank_confirmed    ?? 0;
  const unrecon     = plsData?.unreconciled      ?? 0;
  const outstanding = plsData?.outstanding       ?? [...overdue,...sent].reduce((a,i)=>a+i.amount,0);
  const supCosts    = plsData?.supplier_costs    ?? 0;
  const grossMargin = plsData?.gross_margin      ?? 0;
  const totalInv    = plsData?.total_invoiced    ?? proxyDB.invoices.reduce((a,i)=>a+i.amount,0);

  // Monthly P&L chart (bank-confirmed receipts per month, last 6 months)
  const months=[];
  for(let i=5;i>=0;i--){const dt=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({lbl:dt.toLocaleDateString('en-ZA',{month:'short'}),ym:`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`});}

  let mplData = null;
  try { mplData = await api('GET','pl_ledger.php?action=monthly_pl'); } catch(e) {}
  const mplMap = {};
  (mplData?.rows||[]).forEach(r=>{ mplMap[r.ym]=r; });
  const revData  = months.map(m=>mplMap[m.ym]?.cash_received||0);
  const costData = months.map(m=>mplMap[m.ym]?.total_costs||0);
  const maxVal   = Math.max(...revData,...costData,1);

  const chartBars = months.map((m,i)=>{
    const rh = Math.max(2, Math.round((revData[i]/maxVal)*100));
    const ch = Math.max(2, Math.round((costData[i]/maxVal)*100));
    return `<div class="cbar-w">
      <div class="cval" style="font-size:10px">${revData[i]>0?'R'+Math.round(revData[i]/1000)+'K':''}</div>
      <div class="cbar cbar-stacked" data-h="${rh}" title="Income: ${fmt(revData[i])}"></div>
      <div class="cbar cbar-cost" data-h="${ch}" title="Costs: ${fmt(costData[i])}"></div>
      <div class="clbl">${m.lbl}</div>
    </div>`;
  }).join('');

  // Invoice status breakdown
  const invStatuses = ['Paid','Sent','Overdue','Draft'];
  const invTotal    = Math.max(proxyDB.invoices.length,1);
  const statBars    = invStatuses.map(s=>{
    const cnt = proxyDB.invoices.filter(i=>i.status===s).length;
    const col = s==='Paid'?'var(--green)':s==='Overdue'?'var(--ember)':s==='Sent'?'var(--amber)':'var(--muted)';
    return `<div class="mb-14">
      <div class="flex-sb mb-5"><span class="mlbl-xs">${s}</span><span class="mlbl-sm">${cnt}</span></div>
      <div class="prog-bar"><div class="prog-fill" data-w="${Math.round(cnt/invTotal*100)}" data-bg="${col}"></div></div>
    </div>`;
  }).join('');

  const clientMap = {};
  proxyDB.invoices.forEach(inv => {
    const key = inv.client || 'Unassigned';
    if (!clientMap[key]) clientMap[key] = { client:key, amount:0, outstanding:0, count:0 };
    clientMap[key].amount += Number(inv.amount)||0;
    clientMap[key].count += 1;
    if (['Draft','Sent','Overdue'].includes(inv.status)) clientMap[key].outstanding += Number(inv.amount)||0;
  });
  const clientRows = Object.values(clientMap).sort((a,b)=>b.amount-a.amount).slice(0,6);
  const clientMax = Math.max(...clientRows.map(r=>r.amount),1);
  const clientHtml = clientRows.length ? clientRows.map(r=>`
    <div class="fin-break-row">
      <div class="fin-break-main">
        <div class="fin-break-title">${esc(r.client)}</div>
        <div class="fin-break-meta">${r.count} invoices - ${fmt(r.outstanding)} outstanding</div>
      </div>
      <div class="fin-break-amt">${fmt(r.amount)}</div>
      <div class="prog-bar fin-break-bar"><div class="prog-fill" data-w="${Math.max(4,Math.round(r.amount/clientMax*100))}" data-bg="var(--amber)"></div></div>
    </div>`).join('') : `<div class="empty-note">No client finance data yet.</div>`;

  const outstandingInvoices = proxyDB.invoices
    .filter(inv=>['Draft','Sent','Overdue'].includes(inv.status))
    .sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||'')))
    .slice(0,8);
  const invoiceList = outstandingInvoices.length ? outstandingInvoices.map(inv=>`
    <div class="fin-invoice-card">
      <div>
        <div class="fin-break-title">${esc(inv.invoiceNo || inv.id)}</div>
        <div class="fin-break-meta">${esc(inv.client)} - Due ${fmtD(inv.dueDate)}</div>
      </div>
      <div class="fin-invoice-side">
        ${pillH(inv.status)}
        <strong>${fmt(inv.amount)}</strong>
      </div>
    </div>`).join('') : `<div class="empty-note">No outstanding invoices.</div>`;

  const qas = can('capture.new_invoice') || can('capture.log_payment');
  const margPct = bankConf>0 ? Math.round((grossMargin/bankConf)*100) : 0;

  document.getElementById('fin-dash-kpis').outerHTML = `<div class="kgrid kgrid--4">
    <div class="kcard k1"><div class="klbl">Bank Confirmed</div><div class="kval text-ok">${fmt(bankConf)}</div><div class="ksub">FNB *8644 — total received</div></div>
    <div class="kcard k3"><div class="klbl">Unreconciled</div><div class="kval${unrecon>0?' text-ovr':''}">${fmt(unrecon)}</div><div class="ksub">Remitted, not in bank ⚠</div></div>
    <div class="kcard${outstanding>0?' kcard-ember':''}"><div class="klbl">Outstanding Invoices</div><div class="kval${outstanding>0?' kval-ember':''}">${fmt(outstanding)}</div><div class="ksub">${overdue.length} overdue · ${sent.length} sent</div></div>
    <div class="kcard k1"><div class="klbl">Gross Margin</div><div class="kval${grossMargin>=0?' text-ok':' text-ovr'}">${fmt(grossMargin)}</div><div class="ksub">${margPct}% on cash received</div></div>
  </div>`;

  document.getElementById('fin-dash-body').innerHTML = `
    <div class="twocol">
      <div class="panel">
        <div class="ph"><div class="ph-title">Income vs Costs — 6 Months</div><div class="ph-sub"><span class="legend-dot legend-ok"></span>Income <span class="legend-dot legend-cost ml-2"></span>Costs</div></div>
        <div class="rev-chart-wrap"><div class="chart-bars">${chartBars}</div></div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Invoice Status Breakdown</div><button class="btn btn-g btn-s" data-action="navPage" data-page="p-invoices">View All</button></div>
        <div class="pb">${statBars}</div>
      </div>
    </div>
    <div class="twocol">
      <div class="panel">
        <div class="ph"><div class="ph-title">Client Breakdown</div></div>
        <div class="pb fin-break-list">${clientHtml}</div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Aging / Status List</div><button class="btn btn-g btn-s" data-action="navPage" data-page="p-invoices">Invoices</button></div>
        <div class="pb fin-invoice-list">${invoiceList}</div>
      </div>
    </div>
    ${unrecon>0?`<div class="panel mt2 panel-warn-top">
      <div class="ph"><div class="ph-title">⚠ Unreconciled Remittances — Action Required</div></div>
      <div class="pb"><p class="text-muted">R${unrecon.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})} has been remitted by AECI but has not been confirmed in FNB *8644. Investigate with AECI Cash Book Controller (Yolanda Herbst).</p>
      <button class="btn btn-g btn-s" data-action="navPage" data-page="p-pl-ledger">View Remittances →</button></div>
    </div>`:''}
    ${qas?`<div class="panel mt2">
      <div class="ph"><div class="ph-title">Quick Actions</div></div>
      <div class="pb dash-acts">
        ${can('capture.new_invoice')?`<button class="btn btn-p" data-action="navPage" data-page="p-new-invoice">+ New Invoice</button>`:''}
        ${can('capture.log_payment')?`<button class="btn btn-g" data-action="navPage" data-page="p-log-payment">Log Payment</button>`:''}
        <button class="btn btn-g" data-action="navPage" data-page="p-pl-ledger">P&L Ledger →</button>
        <button class="btn btn-g" data-action="navPage" data-page="p-transactions">Transactions →</button>
      </div>
    </div>`:''}`;

  { let css=''; el.querySelectorAll('.cbar[data-h]').forEach((b,i)=>{ b.dataset.cbi=i; css+=`.cbar[data-cbi="${i}"]{height:${b.dataset.h}%;}`; }); if(css)_injectStyle('cbar-fin-css',css); }
  applyProgFills(el);
}

function renderSupDashboard() {
  const el = document.getElementById('sup-dash-content');
  if (!el) return;
  const safFiles      = proxyDB.safetyFiles || [];
  const safApproved   = safFiles.filter(f=>(f.status||'').toLowerCase()==='approved').length;
  const safSubmitted  = safFiles.filter(f=>(f.status||'').toLowerCase()==='submitted').length;
  const users         = DB.users || [];

  // Users by role (a user with multiple roles is counted once per role)
  const roleGroups = {};
  users.forEach(u=>{ const rs=u.roles?.length?u.roles:[u.role]; rs.forEach(r=>{ roleGroups[r]=(roleGroups[r]||0)+1; }); });
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
   TRACKER — Company task tracker (Admin / Sales / General)
═══════════════════════════════════════════════════════ */
const TASK_CATEGORY_ROLES = {
  admin:   ['sysadmin','admin','admin_clerk','manager'],
  sales:   ['sysadmin','admin','manager'],
  general: ['sysadmin','admin','manager','admin_clerk','finance','safety_officer','call_logger','junior_tech','senior_tech','viewer'],
};
const TASK_CATEGORY_LABELS = { admin:'Admin', sales:'Sales', general:'General', call_log:'Call Log' };
const TASK_PRIORITY_DOT    = { Low:'bg-muted', Normal:'bg-info', High:'bg-warn', Urgent:'bg-danger' };
const TASK_STATUS_BADGE    = {
  'Open':        'badge-open',
  'In Progress': 'badge-inprog',
  'Done':        'badge-done',
  'Cancelled':   'badge-cancelled',
};

function isActiveTask(t) {
  return t.status === 'Open' || t.status === 'In Progress';
}

function taskAssigneeName(t) {
  return (t.assignees && t.assignees.length)
    ? t.assignees.map(a => a.name).join(', ')
    : (t.assignee_name || t.assigned_to || 'Unassigned');
}

function taskDueValue(t) {
  return t.due_at || t.due_date || '';
}

function taskDueState(t) {
  const due = taskDueValue(t);
  if (!due || !isActiveTask(t)) return 'No date';
  const day = String(due).slice(0, 10);
  const today = localDateStr();
  if (day < today) return 'Overdue';
  if (day === today) return 'Due today';
  return 'Upcoming';
}

function taskUrgencyRank(t) {
  const dueState = taskDueState(t);
  const pri = { Urgent: 0, High: 1, Normal: 2, Low: 3 }[t.priority] ?? 4;
  const dueRank = dueState === 'Overdue' ? 0 : dueState === 'Due today' ? 1 : dueState === 'Upcoming' ? 2 : 3;
  return dueRank * 10 + pri;
}

function visibleTaskCategories() {
  const roles = SESSION?.roles?.length ? SESSION.roles : [SESSION?.role || ''];
  return Object.keys(TASK_CATEGORY_ROLES).filter(cat => TASK_CATEGORY_ROLES[cat].some(role => roles.includes(role)));
}

function visibleTrackerStreams() {
  const streams = visibleTaskCategories();
  if (can('callout.view')) streams.push('call_log');
  return streams;
}

let _trackerCat = null; // active category tab

function renderTracker(cat) {
  const cats = visibleTrackerStreams();
  if (!cats.length) return;
  if (!cat) cat = _trackerCat || cats[0];
  if (!cats.includes(cat)) cat = cats[0];
  _trackerCat = cat;

  // Tab bar
  const tabsEl = document.getElementById('tracker-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = cats.map(c =>
      `<button class="pnitem${c===cat?' active':''}" data-action="switchTrackerCat" data-cat="${c}">${esc(TASK_CATEGORY_LABELS[c])}</button>`
    ).join('');
  }

  // New task button
  const btnNew = document.getElementById('btn-new-task');
  if (btnNew) { can('task.create') && cat !== 'call_log' ? $show(btnNew) : $hide(btnNew); }

  const taskView = document.getElementById('tracker-task-view');
  const callLogView = document.getElementById('tracker-calllog-view');
  if (taskView) taskView.hidden = cat === 'call_log';
  if (callLogView) callLogView.hidden = cat !== 'call_log';
  if (cat === 'call_log') {
    const search = document.getElementById('co-search')?.value || '';
    const filter = document.getElementById('co-filter')?.value || '';
    renderCallouts(search, filter);
    return;
  }

  // Category filter select
  const catSel = document.getElementById('ntk-category');
  if (catSel && !catSel.options.length) {
    visibleTaskCategories().forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = TASK_CATEGORY_LABELS[c];
      catSel.appendChild(o);
    });
  }
  if (catSel) catSel.value = cat;

  const items = proxyDB.tasks.filter(t => t.category === cat);
  const canUpdate = can('task.update');
  const canDelete = can('task.delete');

  if (!taskView) return;
  const activeItems = items.filter(isActiveTask);
  const summaryCards = [
    { label:'Open', value:items.filter(t=>t.status==='Open').length, sub:'Ready to start' },
    { label:'In Progress', value:items.filter(t=>t.status==='In Progress').length, sub:'Being worked' },
    { label:'Overdue', value:activeItems.filter(t=>taskDueState(t)==='Overdue').length, sub:'Needs attention' },
    { label:'Due Today', value:activeItems.filter(t=>taskDueState(t)==='Due today').length, sub:'Same-day action' },
  ].map(c=>`<div class="ops-mini-card"><span>${c.label}</span><strong>${c.value}</strong><em>${c.sub}</em></div>`).join('');

  const assigneeCounts = {};
  activeItems.forEach(t => {
    const names = taskAssigneeName(t).split(',').map(s => s.trim()).filter(Boolean);
    (names.length ? names : ['Unassigned']).forEach(name => { assigneeCounts[name] = (assigneeCounts[name] || 0) + 1; });
  });
  const assigneeMax = Math.max(...Object.values(assigneeCounts), 1);
  const assigneeRows = Object.entries(assigneeCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>`
    <div class="ops-load-row">
      <div><strong>${esc(name)}</strong><span>${count} active</span></div>
      <div class="prog-bar"><div class="prog-fill" data-w="${Math.max(5,Math.round(count/assigneeMax*100))}" data-bg="var(--blue)"></div></div>
    </div>`).join('') || `<div class="empty-note">No active assignee load.</div>`;

  const taskCards = items.length ? [...items].sort((a,b)=>taskUrgencyRank(a)-taskUrgencyRank(b)).map(t => {
    const dotCls  = TASK_PRIORITY_DOT[t.priority]  || 'bg-muted';
    const bdgCls  = TASK_STATUS_BADGE[t.status]    || '';
    const assignee = taskAssigneeName(t);
    const dueState = taskDueState(t);
    const dueCls = dueState === 'Overdue' ? 'badge-ovr' : dueState === 'Due today' ? 'badge-warn' : 'badge-muted';
    const actions = [];
    actions.push(`<button class="btn btn-g btn-s" data-action="openTrackerRecord" data-entity-type="task" data-id="${esc(t.ref_id)}">Record</button>`);
    actions.push(`<button class="btn btn-g btn-s" data-action="openAttachmentsModal" data-entity-type="task" data-entity-ref="${esc(t.ref_id)}">Files</button>`);
    if (canUpdate) actions.push(`<button class="btn btn-g btn-s" data-action="openTaskStatus" data-id="${esc(t.ref_id)}">Status</button>`);
    if (canDelete) actions.push(`<button class="btn btn-g btn-s btn-danger-soft" data-action="deleteTask" data-id="${esc(t.ref_id)}">Del</button>`);
    return `<div class="ops-task-card ops-task-card--action">
      <div class="ops-task-head">
        <span class="mono">${esc(t.ref_id)}</span>
        <span class="${dueCls}">${esc(dueState)}</span>
      </div>
      <div class="ops-task-title">${esc(t.title)}</div>
      <div class="ops-task-meta">${esc(assignee)} - <span class="prio-dot ${dotCls}"></span>${esc(t.priority)} - <span class="badge ${bdgCls}">${esc(t.status)}</span></div>
      <div class="ops-task-meta">Created ${fmtDT(t.created_at)} - Due ${taskDueValue(t)?fmtDT(taskDueValue(t)):'No due date'}</div>
      <div class="ops-task-actions">${actions.join('')}</div>
    </div>`;
  }).join('') : `<div class="empty-note">No tasks in ${esc(TASK_CATEGORY_LABELS[cat])}.</div>`;

  taskView.innerHTML = `
    <div class="ops-summary-grid">${summaryCards}</div>
    <div class="twocol">
      <div class="panel">
        <div class="ph"><div class="ph-title">${esc(TASK_CATEGORY_LABELS[cat])} Tasks</div></div>
        <div class="pb ops-task-list">${taskCards}</div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Assignee Load</div></div>
        <div class="pb">${assigneeRows}</div>
      </div>
    </div>`;
  applyProgFills(taskView);
  return;

  const tbody = document.getElementById('tracker-table');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map(t => {
    const dotCls  = TASK_PRIORITY_DOT[t.priority]  || 'bg-muted';
    const bdgCls  = TASK_STATUS_BADGE[t.status]    || '';
    const assignee = (t.assignees && t.assignees.length)
      ? t.assignees.map(a => esc(a.name)).join(', ')
      : (t.assignee_name || t.assigned_to || '—');
    const actions = [];
    actions.push(`<button class="btn btn-g btn-s" data-action="openTrackerRecord" data-entity-type="task" data-id="${esc(t.ref_id)}">Record</button>`);
    actions.push(`<button class="btn btn-g btn-s" data-action="openAttachmentsModal" data-entity-type="task" data-entity-ref="${esc(t.ref_id)}">Files</button>`);
    if (canUpdate) actions.push(`<button class="btn btn-g btn-s" data-action="openTaskStatus" data-id="${esc(t.ref_id)}">Status</button>`);
    if (canDelete) actions.push(`<button class="btn btn-g btn-s btn-danger-soft" data-action="deleteTask" data-id="${esc(t.ref_id)}">Del</button>`);
    return `<tr>
      <td><span class="mono fs-10">${esc(t.ref_id)}</span></td>
      <td class="td-main">${esc(t.title)}</td>
      <td class="fs-11 text-muted">${esc(assignee)}</td>
      <td><span class="prio-dot ${dotCls}"></span><span class="fs-11 text-muted">${esc(t.priority)}</span></td>
      <td><span class="badge ${bdgCls}">${esc(t.status)}</span></td>
      <td class="fs-11 text-muted nowrap">${fmtDT(t.created_at)}</td>
      <td class="fs-11 text-muted nowrap">${fmtDT(t.start_at)}</td>
      <td class="fs-11 text-muted nowrap">${fmtDT(t.end_at)}</td>
      <td class="fs-11 text-muted nowrap">${fmtDT(t.due_at)}</td>
      <td class="act-cell">${actions.join('')}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="10" class="empty-row">No tasks in ${esc(TASK_CATEGORY_LABELS[cat])}.</td></tr>`;
}

async function initNewTask() {
  ['ntk-title','ntk-desc','ntk-start','ntk-end','ntk-due'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const fileIn = document.getElementById('ntk-file'); if (fileIn) fileIn.value = '';
  const pri = document.getElementById('ntk-priority'); if (pri) pri.value = 'Normal';
  const catSel = document.getElementById('ntk-category');
  if (catSel) {
    const cats = visibleTaskCategories();
    catSel.innerHTML = cats.map(c => `<option value="${c}">${esc(TASK_CATEGORY_LABELS[c])}</option>`).join('');
    if (_trackerCat && cats.includes(_trackerCat)) catSel.value = _trackerCat;
  }
  const assignSel = document.getElementById('ntk-assigned');
  if (assignSel) {
    assignSel.innerHTML = '<option value="" disabled>Loading…</option>';
    const r = await api('GET', 'task_users.php');
    const users = r.data || [];
    assignSel.innerHTML = users.map(u =>
      `<option value="${esc(u.username)}">${esc(u.name)} (${esc(u.role.replace(/_/g,' '))})</option>`
    ).join('');
  }
}

async function saveNewTask() {
  const title = (document.getElementById('ntk-title')?.value || '').trim();
  const cat   = document.getElementById('ntk-category')?.value || '';
  if (!title || !cat) { showToast('Title and category are required.', 'error'); return; }

  const assignSel = document.getElementById('ntk-assigned');
  const assigned_to_usernames = assignSel
    ? Array.from(assignSel.selectedOptions).map(o => o.value).filter(Boolean)
    : [];

  const payload = {
    category:               cat,
    title,
    description:            document.getElementById('ntk-desc')?.value?.trim() || null,
    priority:               document.getElementById('ntk-priority')?.value || 'Normal',
    assigned_to_usernames,
    start_at:               document.getElementById('ntk-start')?.value || null,
    end_at:                 document.getElementById('ntk-end')?.value || null,
    due_at:                 document.getElementById('ntk-due')?.value || null,
  };
  const r = await api('POST', 'tasks.php', payload);
  if (!r.success) { showToast(r.message || 'Failed to create task.', 'error'); return; }

  const refId = r.data?.ref_id;
  const fileIn = document.getElementById('ntk-file');
  if (refId && fileIn && fileIn.files.length) {
    showToast('Task created. Uploading file…', 'success');
    const up = await apiUpload('task', refId, fileIn);
    if (!up.success) showToast(up.error || 'File upload failed.', 'error');
    else showToast('Task created with file attached.', 'success');
  } else {
    showToast('Task created.', 'success');
  }

  await refreshTasks();
  navPage('p-tracker');
}

async function openTaskStatus(refId) {
  const task = proxyDB.tasks.find(t => t.ref_id === refId);
  if (!task) return;
  const statuses = ['Open','In Progress','Done','Cancelled'];
  const btns = statuses.map(s =>
    `<button class="btn ${s===task.status?'btn-p':'btn-g'} btn-s" data-action="setTaskStatus" data-id="${esc(refId)}" data-status="${esc(s)}">${esc(s)}</button>`
  ).join('');
  openModal(`Update Status — ${esc(refId)}`, `
    <div class="pb">${esc(task.title)}</div>
    <div class="flex-row gap1 mt2">${btns}</div>`);
}

async function setTaskStatus(refId, status) {
  closeModalDirect();
  const r = await api('PUT', `tasks.php?id=${encodeURIComponent(refId)}`, { status });
  if (r.success) { await refreshTasks(); renderTracker(); showToast('Status updated.','success'); }
  else showToast(r.message || 'Update failed.','error');
}

async function deleteTask(refId) {
  if (!confirm(`Delete task ${refId}? This cannot be undone.`)) return;
  const r = await api('DELETE', `tasks.php?id=${encodeURIComponent(refId)}`);
  if (r.success) { await refreshTasks(); renderTracker(); showToast('Task deleted.','success'); }
  else showToast(r.message || 'Delete failed.','error');
}

function trackerDateInput(value) {
  return value ? String(value).replace(' ', 'T').slice(0, 16) : '';
}

function openTrackerRecord(entityType, refId) {
  if (!['task','callout'].includes(entityType)) return;
  const record = entityType === 'task'
    ? proxyDB.tasks.find(t => t.ref_id === refId)
    : proxyDB.callouts.find(c => c.id === refId);
  if (!record) return;
  const canEdit = entityType === 'task' ? can('task.update') : can('callout.update');
  const title = entityType === 'task' ? record.title : record.service;
  const createdAt = entityType === 'task' ? record.created_at : record.createdAt;
  const startAt = entityType === 'task' ? record.start_at : record.startAt;
  const endAt = entityType === 'task' ? record.end_at : record.endAt;
  const dueAt = entityType === 'task' ? record.due_at : record.dueAt;

  const assigneesHtml = (() => {
    if (entityType !== 'task') return '';
    const t = proxyDB.tasks.find(x => x.ref_id === refId);
    const names = (t?.assignees && t.assignees.length)
      ? t.assignees.map(a => esc(a.name)).join(', ')
      : (t?.assignee_name || t?.assigned_to || '—');
    return `<div class="fs-11 text-muted mb-12">Assigned to: <span class="fw-600">${names}</span></div>`;
  })();

  const fileIcon = m => m === 'application/pdf' ? '📄' : m && (m.includes('sheet') || m.includes('excel')) ? '📊' : m && m.includes('word') ? '📝' : m && m.startsWith('image/') ? '🖼' : '📎';
  const fmtBytes = b => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(1) + ' MB';

  openModal(`${refId} - Record`, `
    <div class="att-ctx"><span class="fw-600">${esc(title)}</span></div>
    ${assigneesHtml}
    <div class="form-title mt2">Schedule</div>
    <div class="fgrid">
      <div class="fgroup"><label class="flbl">Created</label><input class="finput" value="${esc(fmtDT(createdAt))}" disabled></div>
      <div class="fgroup"><label class="flbl">Start Date &amp; Time</label><input class="finput" id="tr-start" type="datetime-local" value="${esc(trackerDateInput(startAt))}" ${canEdit?'':'disabled'}></div>
      <div class="fgroup"><label class="flbl">End Date &amp; Time</label><input class="finput" id="tr-end" type="datetime-local" value="${esc(trackerDateInput(endAt))}" ${canEdit?'':'disabled'}></div>
      <div class="fgroup"><label class="flbl">Due Date &amp; Time</label><input class="finput" id="tr-due" type="datetime-local" value="${esc(trackerDateInput(dueAt))}" ${canEdit?'':'disabled'}></div>
    </div>
    ${canEdit?`<div class="flex-end mt2"><button class="btn btn-p btn-s" data-action="saveTrackerSchedule" data-entity-type="${entityType}" data-id="${esc(refId)}">Save Schedule</button></div>`:''}
    <div class="form-title mt3">Files</div>
    <div id="tr-files-area"><div class="tc-empty">Loading files…</div></div>
    ${canEdit?`<div class="att-upsec mt2">
      <div class="att-uprow">
        <input type="file" id="tr-file-input" accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png" class="att-finp">
        <button class="btn btn-p btn-s" data-action="uploadTrackerFile" data-entity-type="${entityType}" data-entity-ref="${esc(refId)}">Upload</button>
      </div>
      <div class="att-fhint">PDF, Excel, Word, JPEG, PNG · Max 10 MB</div>
    </div>`:''}
    <div class="form-title mt3">Description Records</div>
    <div id="tracker-updates-area"><div class="tc-empty">Loading records...</div></div>
    ${canEdit?`<div class="panel mt2"><div class="pb"><div class="fgroup"><label class="flbl">New Label</label><input class="finput" id="tr-new-label" maxlength="120" placeholder="e.g. Client feedback"></div><div class="fgroup mt2"><label class="flbl">New Description</label><textarea class="finput" id="tr-new-content" rows="4" maxlength="10000" placeholder="Enter new information"></textarea></div><div class="flex-end mt2"><button class="btn btn-p btn-s" data-action="addTrackerUpdate" data-entity-type="${entityType}" data-id="${esc(refId)}">Add Description</button></div></div></div>`:''}
    <div id="tracker-record-message" class="fs-11 text-muted mt2"></div>`);
  loadTrackerFiles(entityType, refId, canEdit);
  loadTrackerUpdates(entityType, refId, canEdit);
}

async function loadTrackerFiles(entityType, refId, canEdit) {
  const area = document.getElementById('tr-files-area');
  if (!area) return;
  const r = await api('GET', `files.php?action=list&entity_type=${encodeURIComponent(entityType)}&entity_ref=${encodeURIComponent(refId)}`);
  const canDel = SESSION && ['admin','manager','sysadmin'].includes(SESSION.role);
  const list = r.attachments || [];
  const fileIcon = m => m === 'application/pdf' ? '📄' : m && (m.includes('sheet')||m.includes('excel')) ? '📊' : m && m.includes('word') ? '📝' : m && m.startsWith('image/') ? '🖼' : '📎';
  const fmtBytes = b => b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';
  if (!list.length) { area.innerHTML = '<div class="att-empty">No files attached yet</div>'; return; }
  area.innerHTML = list.map(a => `
    <div class="att-row">
      <span class="att-icon">${fileIcon(a.mime_type)}</span>
      <div class="att-info">
        <div class="att-name">${esc(a.original_name)}</div>
        <div class="att-meta">${fmtBytes(a.file_size)} · ${esc(a.uploaded_by)} · ${(a.created_at||'').slice(0,10)}</div>
      </div>
      ${(a.mime_type==='application/pdf'||a.mime_type?.startsWith('image/'))?`<button class="btn btn-g btn-s" data-action="openDocViewer" data-id="${a.id}" data-name="${esc(a.original_name)}" data-mime="${esc(a.mime_type)}">&#128065; View</button>`:''}
      <a href="${API_BASE}/files.php?action=download&id=${a.id}" target="_blank" class="btn btn-g btn-s">&#8595; Download</a>
      ${canDel?`<button class="btn btn-g btn-s att-del" data-action="deleteTrackerFile" data-id="${a.id}" data-entity-type="${esc(entityType)}" data-entity-ref="${esc(refId)}">&#10005;</button>`:''}
    </div>`).join('');
}

async function uploadTrackerFile(entityType, entityRef) {
  const inp = document.getElementById('tr-file-input');
  if (!inp || !inp.files.length) { showToast('Select a file first.', 'error'); return; }
  const btn = document.querySelector('[data-action="uploadTrackerFile"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }
  const r = await apiUpload(entityType, entityRef, inp);
  if (btn) { btn.disabled = false; btn.textContent = 'Upload'; }
  if (!r.success) { showToast(r.error || 'Upload failed.', 'error'); return; }
  inp.value = '';
  showToast('File attached.', 'success');
  await loadTrackerFiles(entityType, entityRef, true);
}

async function deleteTrackerFile(id, entityType, entityRef) {
  if (!await confirmDialog('Remove this attachment?\n\nThis cannot be undone.', { title: 'Remove File', confirmLabel: 'Remove' })) return;
  const r = await api('DELETE', `files.php?id=${id}`);
  if (!r.success) { showToast(r.error || 'Delete failed.', 'error'); return; }
  showToast('File removed.', 'success');
  await loadTrackerFiles(entityType, entityRef, true);
}

async function loadTrackerUpdates(entityType, refId, canEdit) {
  const area = document.getElementById('tracker-updates-area');
  if (!area) return;
  const r = await api('GET', `tracker_updates.php?entity_type=${entityType}&entity_ref=${encodeURIComponent(refId)}`);
  const rows = r.data || [];
  area.innerHTML = rows.length ? rows.map((row, index) => `<div class="panel mb-12"><div class="pb"><div class="flex-between fs-10 text-muted mb-12"><span>Record ${index+1} · ${esc(row.created_by||'')}</span><span>${Number(row.revision_count||0)} revision(s)</span></div><div class="fgroup"><label class="flbl">Label</label><input class="finput" id="tr-label-${row.id}" value="${esc(row.label)}" maxlength="120" ${canEdit?'':'disabled'}></div><div class="fgroup mt2"><label class="flbl">Description</label><textarea class="finput" id="tr-content-${row.id}" rows="4" maxlength="10000" ${canEdit?'':'disabled'}>${esc(row.content)}</textarea></div>${canEdit?`<div class="flex-end mt2"><button class="btn btn-g btn-s" data-action="saveTrackerUpdate" data-update-id="${row.id}">Save Edit</button></div>`:''}</div></div>`).join('') : '<div class="tc-empty">No description records yet.</div>';
}

async function saveTrackerSchedule(entityType, refId) {
  const endpoint = entityType === 'task' ? 'tasks.php' : 'callouts.php';
  const payload = { start_at: document.getElementById('tr-start')?.value || null, end_at: document.getElementById('tr-end')?.value || null, due_at: document.getElementById('tr-due')?.value || null };
  const r = await api('PUT', `${endpoint}?id=${encodeURIComponent(refId)}`, payload);
  const msg = document.getElementById('tracker-record-message');
  if (msg) msg.textContent = r.success ? 'Schedule saved and recorded in the audit log.' : (r.error || 'Schedule could not be saved.');
  if (r.success) { await Promise.all([refreshTasks(), refreshCallouts()]); renderTracker(); }
}

async function addTrackerUpdate(entityType, refId) {
  const label = document.getElementById('tr-new-label')?.value.trim() || '';
  const content = document.getElementById('tr-new-content')?.value.trim() || '';
  if (!label || !content) { showToast('Label and description are required.', 'error'); return; }
  const r = await api('POST', 'tracker_updates.php', { entity_type: entityType, entity_ref: refId, label, content });
  if (!r.success) { showToast(r.error || 'Description could not be added.', 'error'); return; }
  document.getElementById('tr-new-label').value = '';
  document.getElementById('tr-new-content').value = '';
  await loadTrackerUpdates(entityType, refId, true);
  showToast('Description added and audited.', 'success');
}

async function saveTrackerUpdate(updateId) {
  const label = document.getElementById(`tr-label-${updateId}`)?.value.trim() || '';
  const content = document.getElementById(`tr-content-${updateId}`)?.value.trim() || '';
  if (!label || !content) { showToast('Label and description are required.', 'error'); return; }
  const r = await api('PUT', `tracker_updates.php?id=${updateId}`, { label, content });
  showToast(r.success ? 'Description edit saved with revision history.' : (r.error || 'Description could not be saved.'), r.success ? 'success' : 'error');
}

/* ═══════════════════════════════════════════════════════
   CALLOUTS - with PO, status-update, assign-tech, assign-PO
═══════════════════════════════════════════════════════ */
function renderCallouts(search='',filter=''){
  let items=[...proxyDB.callouts].sort((a,b)=>b.date.localeCompare(a.date));
  if(search){
    const s=search.toLowerCase();
    items=items.filter(c=>{
      if(c.id.toLowerCase().includes(s)) return true;
      if(c.jobNo.toLowerCase().includes(s)) return true;
      if(c.service.toLowerCase().includes(s)) return true;
      if((c.location||'').toLowerCase().includes(s)) return true;
      const inv=proxyDB.invoices.find(i=>i.calloutRef===c.id);
      if(inv&&(inv.id.toLowerCase().includes(s)||inv.invoiceNo.toLowerCase().includes(s))) return true;
      const q=proxyDB.quotes.find(q=>q.calloutRef===c.id);
      if(q&&(q.id.toLowerCase().includes(s)||q.quoteNo.toLowerCase().includes(s))) return true;
      return false;
    });
  }
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
  const btn=document.getElementById('btn-newco');if(btn){ canCreate?$show(btn):$hide(btn); }

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
    const linkedQuote=proxyDB.quotes.find(q=>q.calloutRef===c.id);
    const hasApprovedQuote=linkedQuote?.status==='Approved';
    if(!hasApprovedQuote&&(can('capture.new_quote')||can('quote.view'))){
      if(linkedQuote){
        const qLbl = linkedQuote.status==='Pending Approval' ? 'Quote (Pending)' : `Quote (${linkedQuote.status})`;
        actions.push(`<button class="btn btn-g btn-s" data-action="previewQuote" data-id="${esc(linkedQuote.id)}">${qLbl}</button>`);
      } else if(can('capture.new_quote')&&!c.invoiceGenerated){
        actions.push(`<button class="btn btn-g btn-s" data-action="prefillQuoteFromJob" data-id="${esc(c.id)}">Quote</button>`);
      }
    }
    actions.push(`<button class="btn btn-g btn-s" data-action="openRecordChain" data-id="${esc(c.id)}">View</button>`);
    actions.push(`<button class="btn btn-g btn-s" data-action="openTrackerRecord" data-entity-type="callout" data-id="${esc(c.id)}">Record</button>`);
    actions.push(`<button class="btn btn-g btn-s" data-action="openAttachmentsModal" data-entity-type="callout" data-entity-ref="${esc(c.id)}">Files</button>`);
    if(can('callout.confirm_closure')&&c.status==='Completed'&&!c.closureConfirmed&&!c.invoiceGenerated){
      actions.push(`<button class="btn btn-p btn-s" data-action="openConfirmClosureModal" data-id="${esc(c.id)}">Confirm Closure</button>`);
    }
    if(can('capture.new_invoice')&&c.status==='Completed'&&!c.invoiceGenerated){
      actions.push(`<button class="btn ${hasApprovedQuote?'btn-p':'btn-g'} btn-s" data-action="openInvoiceFromCallout" data-id="${esc(c.id)}">Invoice</button>`);
    }
    if(canDel) actions.push(`<button class="btn btn-g btn-s" data-action="deleteCallout" data-id="${esc(c.id)}">Del</button>`);

    return`<tr>
      <td class="mono">${esc(c.jobNo)}${c.jobNo!==c.id?`<div class="mlbl-9 mt-2 text-muted">${esc(c.id)}</div>`:''}</td>
      <td class="tc-12 max-180">${esc(c.service)}<div class="mlbl-9 mt-2">${esc(c.location||'')}</div></td>
      <td class="tc-11">${esc(assignedDisplay)}</td>
      <td>${poCell}</td>
      <td>${pillH(c.priority)}</td>
      <td>${pillH(c.status)}</td>
      <td class="fs-10 text-muted">${esc(loggedByUser?.name||c.loggedBy||'-')}</td>
      <td class="tc-11 nowrap">${fmtDT(c.createdAt)}</td>
      <td class="tc-11 nowrap">${fmtDT(c.startAt)}</td>
      <td class="tc-11 nowrap">${fmtDT(c.endAt)}</td>
      <td class="tc-11 nowrap">${fmtDT(c.dueAt)}</td>
      <td><div class="bgrp">${actions.join('')}</div></td>
    </tr>`;
  }).join(''):'<tr><td colspan="12" class="tc-empty">'+(SESSION?.role==='junior_tech'||SESSION?.role==='senior_tech'?'No callouts assigned to you':'No callouts found')+'</td></tr>';
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
  openModal(`Assign PO — ${c.id}`,`
    <div class="fs-12 text-muted mb-14">Assign a Purchase Order number to this job. The PO number and uploaded document will be referenced on the invoice.</div>
    <div class="fgroup mb-12"><label class="flbl">Purchase Order Number <span class="text-ember">*</span></label><input class="finput" id="po-input" value="${esc(c.po||'')}" placeholder="e.g. CP1590"></div>
    <div class="att-ctx mb-14">
      <div class="fs-11 fw-600 mb-6">PO Document <span class="text-muted fs-10">(optional)</span></div>
      <div class="fs-10 text-muted mb-8">Upload the official Purchase Order document. PDF, Word, or image accepted.</div>
      <input type="file" id="po-doc" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" class="fs-11">
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="assignPO" data-id="${esc(c.id)}">Save PO</button></div>
  `);
}

function openAssignTech(id){
  const techs=proxyDB.users.filter(u=>{ const rs=u.roles?.length?u.roles:[u.role]; return rs.some(r=>r==='junior_tech'||r==='senior_tech'); });
  openModal(`Assign Technician - ${id}`,`
    <div class="fgroup"><label class="flbl">Select Technician</label>
      <select class="finput" id="tech-sel">
        <option value="">- Select -</option>
        ${techs.map(t=>{ const rs=t.roles?.length?t.roles:[t.role]; const lbl=rs.map(r=>ROLE_LABELS[r]||r).join(', '); return `<option value="${esc(t.username)}">${esc(t.name)}  -  ${esc(lbl)}</option>`; }).join('')}
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
      <div class="fs-12">Both a proof-of-evidence document and a signed client sign-off are required before this callout can be closed and invoiced.</div>
    </div>
    <div class="att-ctx mb-12">
      <div class="fs-11 fw-600">${esc(c.id)}  —  ${esc(c.service)}</div>
      <div class="fs-10 text-muted">${esc(c.client)}  ·  ${esc(c.location||'')}  ·  ${fmtD(c.date)}</div>
    </div>
    <div class="fgroup mb-12">
      <label class="flbl">Closure Notes <span class="text-ember">*</span></label>
      <textarea class="finput" id="cc-notes" rows="3" autocomplete="off" placeholder="Describe the work completed, findings, and any outstanding items..."></textarea>
    </div>
    <div class="att-ctx mb-12">
      <div class="fs-11 fw-600 mb-4">Proof of Evidence <span class="text-ember">*</span></div>
      <div class="fs-10 text-muted mb-8">Photo, job completion report, or site inspection record. PDF, Word, or image.</div>
      <input type="file" id="cc-evidence" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" class="fs-11">
    </div>
    <div class="att-ctx mb-14">
      <div class="fs-11 fw-600 mb-4">Client Sign-off <span class="text-ember">*</span></div>
      <div class="fs-10 text-muted mb-8">Signed closure document from the client. PDF, Word, or image.</div>
      <input type="file" id="cc-signoff" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" class="fs-11">
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveConfirmClosure" data-id="${esc(c.id)}">Confirm Closure</button></div>
  `);
}

async function saveConfirmClosure(id){
  const btn=document.querySelector('[data-action="saveConfirmClosure"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}

  const notes=document.getElementById('cc-notes')?.value?.trim();
  const evidenceInput=document.getElementById('cc-evidence');
  const signoffInput=document.getElementById('cc-signoff');
  if(!notes){toast('Closure notes are required','err');if(btn)btn.disabled=false;return;}
  if(!evidenceInput?.files.length){toast('Proof of evidence document is required','err');if(btn)btn.disabled=false;return;}
  if(!signoffInput?.files.length){toast('Client sign-off document is required','err');if(btn)btn.disabled=false;return;}

  // Upload proof of evidence
  const upEv=await apiUpload('callout',id,evidenceInput);
  if(!upEv.success){toast(upEv.error||'Evidence upload failed','err');if(btn)btn.disabled=false;return;}

  // Upload client sign-off
  const upSo=await apiUpload('callout',id,signoffInput);
  if(!upSo.success){toast(upSo.error||'Sign-off upload failed — evidence saved, retry sign-off','err');if(btn)btn.disabled=false;return;}

  // Confirm closure
  const r=await api('PUT',`callouts.php?id=${id}`,{action:'confirm_closure',closure_notes:notes});
  if(!r.success){toast(r.error||'Error confirming closure','err');if(btn)btn.disabled=false;return;}

  await refreshCallouts();
  updateBadges();
  closeModalDirect();
  renderCallouts('');
  renderDashboard();
  toast(`${id} closed — evidence and sign-off saved`,'ok');
}

function prefillQuoteFromJob(id){
  const c=proxyDB.callouts.find(x=>x.id===id);if(!c)return;
  if(proxyDB.quotes.some(q=>q.calloutRef===id&&q.status==='Approved'))return;
  showPortalPage('p-new-quote',null);
  setTimeout(()=>{
    const el=document.getElementById('nq-callout-ref');if(el)el.value=id;
    const cl=document.getElementById('nq-client');if(cl&&c.clientId)cl.value=c.clientId;
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
  _trackerCat = 'call_log';
  showPortalPage('p-tracker',null);
}

async function delCo(id){
  if(!await confirmDialog(`Delete callout ${id}?\n\nThis action cannot be undone.`, { title: 'Delete Callout', confirmLabel: 'Delete' }))return;
  proxyDB.callouts=proxyDB.callouts.filter(c=>c.id!==id);
  save();renderCallouts();renderDashboard();toast('Callout deleted');audit('DELETE',`${id}`);
}

/* ═══════════════════════════════════════════════════════
   QUOTES - with approval workflow
═══════════════════════════════════════════════════════ */
function renderQuotes(search='',filter=''){
  let items=[...proxyDB.quotes].sort((a,b)=>b.date.localeCompare(a.date));
  if(search) items=items.filter(q=>q.id.toLowerCase().includes(search.toLowerCase())||q.quoteNo.toLowerCase().includes(search.toLowerCase())||q.client.toLowerCase().includes(search.toLowerCase()));
  if(filter) items=items.filter(q=>q.status===filter);

  // Senior tech only sees their own
  if(SESSION?.role==='senior_tech') items=items.filter(q=>q.submittedBy===SESSION.username||q.approvalStatus!=null);

  const canApprove=can('quote.approve');
  const canConvert=can('quote.convert');
  const canDel=can('quote.delete');

  const btn=document.getElementById('btn-newq');
  if(btn){ can('capture.new_quote')?$show(btn):$hide(btn); }

  document.getElementById('qte-table').innerHTML=items.length?items.map(q=>{
    const{total}=quoteTotals(q);
    const submitter=proxyDB.users.find(u=>u.username===q.submittedBy);
    const submitterCell=submitter?`${esc(submitter.name)}<div class="mlbl-9 mt-2">${esc(ROLE_LABELS[submitter.role]||submitter.role)}</div>`:'<span class="text-muted">-</span>';
    const actions=[];
    actions.push(`<button class="btn btn-g btn-s" data-action="previewQuote" data-id="${esc(q.id)}">View</button>`);
    actions.push(`<button class="btn btn-g btn-s" data-action="openAttachmentsModal" data-entity-type="quote" data-entity-ref="${esc(q.id)}">Files</button>`);
    if(canApprove&&q.approvalStatus==='pending'){
      actions.push(`<button class="btn btn-s bg-grn" data-action="approveQuote" data-id="${esc(q.id)}">Approve</button>`);
      actions.push(`<button class="btn btn-s bg-emb" data-action="rejectQuote" data-id="${esc(q.id)}">Decline</button>`);
    }
    if(canConvert&&q.status==='Approved') actions.push(`<button class="btn btn-g btn-s" data-action="convertToInvoice" data-id="${esc(q.id)}">Invoice</button>`);
    if(canDel) actions.push(`<button class="btn btn-g btn-s" data-action="deleteQuote" data-id="${esc(q.id)}">Del</button>`);
    return`<tr>
      <td class="mono">${esc(q.quoteNo)}${q.quoteNo!==q.id?`<div class="mlbl-9 mt-2 text-muted">${esc(q.id)}</div>`:''}</td>
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
  const{sub,vat,total}=quoteTotals(q);
  const hasItems=(q.items||[]).length>0;
  const co = (typeof COMPANY !== 'undefined') ? COMPANY : {};
  openModal(`Quote - ${q.quoteNo}`,`
    <div class="doc-preview">
      <div class="doc-logo-row">
        <img src="./blackfire_logo_transparent.png" class="doc-logo-img" alt="BlackFire Security Solutions">
        <div class="doc-contact">${esc(co.name||'')}<br>${esc(co.phone||'')}${co.mobile?` / ${esc(co.mobile)}`:''}<br>${esc(co.email||'')}<br>${esc(co.addr||'')}</div>
      </div>
      <div class="doc-type">QUOTATION</div>
      <div class="doc-meta">
        <div><div class="dml">Quote #</div><div class="dmv font-mono">${esc(q.quoteNo)}</div></div>
        <div><div class="dml">Client</div><div class="dmv">${esc(q.client)}</div></div>
        <div><div class="dml">Date</div><div class="dmv">${fmtD(q.date)}</div></div>
        <div><div class="dml">Valid Until</div><div class="dmv">${fmtD(q.validUntil)}</div></div>
      </div>
      ${q.approvalStatus==='pending'?'<div class="qte-pending-warn">⚠ Pending Manager Approval - not yet issued to client</div>':''}
      <table class="doc-t">
        <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>${hasItems?(q.items||[]).map(i=>`<tr><td>${esc(i.desc)}</td><td>${i.qty}</td><td>${fmt(i.unit)}</td><td>${fmt(i.qty*i.unit)}</td></tr>`).join(''):`<tr><td colspan="4" class="text-muted">No line items are attached to this reconstructed quote. Totals use the stored quote amount.</td></tr>`}</tbody>
      </table>
      <div class="doc-tots">
        <div class="doc-tot-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
        <div class="doc-tot-row"><span>VAT (15%)</span><span>${fmt(vat)}</span></div>
        <div class="doc-tot-row grand"><span>TOTAL</span><span>${fmt(total)}</span></div>
      </div>
      <div class="doc-note">${esc(co.name||'BlackFire Solutions')}${co.reg?` · Reg: ${esc(co.reg)}`:''}${co.vat?` · VAT: ${esc(co.vat)}`:''}</div>
    </div>
    <div id="attach-modal-area" class="inv-att-area"></div>`);
  loadAttachments('quote', id);
}

function convertQtoInv(id){
  const q=proxyDB.quotes.find(x=>x.id===id);if(!q)return;
  const{total}=quoteTotals(q);
  const invId=nextId('inv');
  const due=new Date();due.setDate(due.getDate()+30);
  proxyDB.invoices.unshift({id:invId,client:q.client,amount:total,dueDate:localDateStr(due),status:'Draft',ref:q.id,po:'',date:localDateStr()});
  save();showPortalPage('p-invoices',null);toast(`Invoice ${invId} created from ${id}`,'ok');audit('CREATE',`Invoice ${invId} from ${id}`);
}

async function delQuote(id){
  if(!await confirmDialog(`Delete quote ${id}?\n\nThis action cannot be undone.`, { title: 'Delete Quote', confirmLabel: 'Delete' }))return;
  proxyDB.quotes=proxyDB.quotes.filter(q=>q.id!==id);save();renderQuotes();toast('Quote deleted');audit('DELETE',id);
}

function initNewQuote(){
  const needsApproval = !can('quote.approve');
  document.getElementById('nq-page-title').textContent=needsApproval?'Submit Quote for Approval':'New Quote';
  document.getElementById('nq-page-sub').textContent=needsApproval?'PENDING MANAGER REVIEW  -  SUBMIT WHEN READY':'BUILD PROPOSAL';
  needsApproval?$show(document.getElementById('nq-pending-notice'),'block'):$hide(document.getElementById('nq-pending-notice'));
  needsApproval?$hide(document.getElementById('nq-status-group')):$show(document.getElementById('nq-status-group'));
  document.getElementById('nq-submit-btn').textContent=needsApproval?'Submit for Approval →':'Save Quote';
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
  if(search) items=items.filter(i=>i.id.toLowerCase().includes(search.toLowerCase())||i.invoiceNo.toLowerCase().includes(search.toLowerCase())||i.client.toLowerCase().includes(search.toLowerCase()));
  if(filter) items=items.filter(i=>i.status===filter);
  const canMod=can('invoice.create');const canPaid=can('invoice.mark_paid');const canDel=can('invoice.delete');const canSend=can('invoice.send');
  const btn=document.getElementById('btn-newinv');if(btn){ canMod?$show(btn):$hide(btn); }
  document.getElementById('inv-table').innerHTML=items.length?items.map(inv=>`
    <tr><td class="mono">${esc(inv.invoiceNo)}${inv.invoiceNo!==inv.id?`<div class="mlbl-9 mt-2 text-muted">${esc(inv.id)}</div>`:''}</td><td>${esc(inv.client)}</td><td class="amt">${fmt(inv.amount)}</td><td class="tc-11 nowrap">${fmtD(inv.dueDate)}</td><td>${pillH(inv.status)}</td>
    <td><div class="bgrp">
      <button class="btn btn-g btn-s" data-action="previewInvoice" data-id="${esc(inv.id)}">View</button>
      ${inv.calloutRef?`<button class="btn btn-g btn-s" data-action="openRecordChain" data-id="${esc(inv.calloutRef)}">Callout</button>`:'<span class="pill overdue">Missing Callout</span>'}
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
  const co2 = (typeof COMPANY !== 'undefined') ? COMPANY : {};
  openModal(`Invoice - ${inv.invoiceNo}`,`
    <div class="doc-preview">
      <div class="doc-logo-row">
        <img src="./blackfire_logo_transparent.png" class="doc-logo-img" alt="BlackFire Security Solutions">
        <div class="doc-contact">${esc(co2.name||'')}${co2.reg?`<br>Reg: ${esc(co2.reg)}`:''}<br>${esc(co2.phone||'')}${co2.mobile?` / ${esc(co2.mobile)}`:''}<br>${esc(co2.email||'')}</div>
      </div>
      <div class="doc-type">TAX INVOICE</div>
      <div class="doc-meta">
        <div><div class="dml">Invoice #</div><div class="dmv font-mono">${esc(inv.invoiceNo)}</div></div>
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
      <div class="doc-note">${esc(co2.name||'BlackFire Solutions')}${co2.reg?` · Reg: ${esc(co2.reg)}`:''}${co2.vat?` · VAT: ${esc(co2.vat)}`:''}</div>
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
async function delInvoice(id){
  if(!await confirmDialog(`Delete invoice ${id}?\n\nThis action cannot be undone.`, { title: 'Delete Invoice', confirmLabel: 'Delete' }))return;
  proxyDB.invoices=proxyDB.invoices.filter(i=>i.id!==id);
  save();renderInvoices();renderDashboard();toast('Invoice deleted');audit('DELETE',id);
}

let _invoiceContext = null;
let _invoiceListenerAC = null;

function initNewInvoice() {
  if (_invoiceListenerAC) _invoiceListenerAC.abort();
  _invoiceListenerAC = new AbortController();
  const sig = { signal: _invoiceListenerAC.signal };

  const due = new Date(); due.setDate(due.getDate() + 30);
  document.getElementById('ni-due').value = localDateStr(due);

  const ctx = _invoiceContext;
  _invoiceContext = null;
  if (ctx?.calloutId) _applyInvoiceCalloutCtx(ctx.calloutId);
  else if (ctx?.quoteId) _applyInvoiceQuoteCtx(ctx.quoteId);
  else populateLinkedDropdowns();

  document.getElementById('ni-client')?.addEventListener('change', () => {
    populateLinkedDropdowns();
  }, sig);

  document.getElementById('ni-callout-ref')?.addEventListener('change', function () {
    const coId = this.value;
    if (!coId) { populateLinkedDropdowns(); return; }
    const co = proxyDB.callouts.find(x => x.id === coId); if (!co) return;
    if (co.clientId && !parseInt(document.getElementById('ni-client')?.value)) {
      document.getElementById('ni-client').value = co.clientId;
    }
    populateLinkedDropdowns(); // always refresh so this callout's linked quote appears
    const linkedQ = proxyDB.quotes.find(q => q.calloutRef === coId);
    if (linkedQ) document.getElementById('ni-quote-ref').value = linkedQ.id;
  }, sig);

  document.getElementById('ni-quote-ref')?.addEventListener('change', function () {
    const qId = this.value; if (!qId) return;
    const q = proxyDB.quotes.find(x => x.id === qId); if (!q) return;
    if (q.clientId && !parseInt(document.getElementById('ni-client')?.value)) {
      document.getElementById('ni-client').value = q.clientId;
      populateLinkedDropdowns();
    }
    if (q.calloutRef) {
      const linkedCo = proxyDB.callouts.find(c => c.id === q.calloutRef && c.status === 'Completed');
      if (linkedCo) document.getElementById('ni-callout-ref').value = linkedCo.id;
    }
    const total = quoteTotals(q).total;
    if (total) document.getElementById('ni-amount').value = (Math.round(total * 100) / 100).toFixed(2);
  }, sig);
}

function _applyInvoiceCalloutCtx(calloutId) {
  const co = proxyDB.callouts.find(x => x.id === calloutId); if (!co) return;
  if (co.clientId) document.getElementById('ni-client').value = co.clientId;
  document.getElementById('ni-callout-ref').value = calloutId;
  if (co.po) { const poEl = document.getElementById('ni-po'); if (poEl) poEl.value = co.po; }
  populateLinkedDropdowns();
  const linkedQ = proxyDB.quotes.find(q => q.calloutRef === calloutId);
  if (linkedQ) {
    document.getElementById('ni-quote-ref').value = linkedQ.id;
    const total = quoteTotals(linkedQ).total;
    if (total) document.getElementById('ni-amount').value = (Math.round(total * 100) / 100).toFixed(2);
  }
}

function _applyInvoiceQuoteCtx(quoteId) {
  const q = proxyDB.quotes.find(x => x.id === quoteId); if (!q) return;
  if (q.clientId) document.getElementById('ni-client').value = q.clientId;
  if (q.calloutRef) {
    const linkedCo = proxyDB.callouts.find(c => c.id === q.calloutRef && c.status === 'Completed');
    if (linkedCo) document.getElementById('ni-callout-ref').value = linkedCo.id;
  }
  populateLinkedDropdowns(); // rebuild after client + callout are set
  document.getElementById('ni-quote-ref').value = quoteId;
  const total = quoteTotals(q).total;
  if (total) document.getElementById('ni-amount').value = (Math.round(total * 100) / 100).toFixed(2);
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
  if(search) items=items.filter(b=>b.desc.toLowerCase().includes(search.toLowerCase())||b.cat.toLowerCase().includes(search.toLowerCase())||String(b.ref||'').toLowerCase().includes(search.toLowerCase())||String(b.calloutRef||'').toLowerCase().includes(search.toLowerCase())||String(b.date||'').includes(search));
  const tc=proxyDB.bank.reduce((a,b)=>a+(b.credit||0),0);
  const td=proxyDB.bank.reduce((a,b)=>a+(b.debit||0),0);
  const tn=tc-td;
  document.getElementById('tx-credits').textContent=fmt(tc);
  document.getElementById('tx-debits').textContent=fmt(td);
  const nel=document.getElementById('tx-net');nel.textContent=fmt(tn);nel.classList.toggle('net--pos',tn>=0);nel.classList.toggle('net--neg',tn<0);
  document.getElementById('tx-table').innerHTML=items.length?items.map(b=>`
    <tr><td class="nowrap">${fmtD(b.date)}</td><td>${esc(b.desc)}</td><td><span class="mlbl-9">${esc(b.cat)}</span></td><td class="mono">${esc(b.ref||'-')}</td><td class="mono">${esc(b.calloutRef||'-')}</td>
    <td class="amt text-ok">${b.credit>0?fmt(b.credit):'-'}</td>
    <td class="amt text-ovr">${b.debit>0?fmt(b.debit):'-'}</td></tr>`).join(''):'<tr><td colspan="7" class="tc-empty">No transactions</td></tr>';
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
      <div class="fgroup"><label class="flbl">Reference</label><input class="finput" id="bk-ref" placeholder="e.g. INV-001 or PO-2026-045"></div>
      <div class="fgroup"><label class="flbl">Call Log Number <span class="text-ember">*</span></label><input class="finput" id="bk-callout-ref" placeholder="e.g. CO-BF-CP1723" required></div>
    </div>
    <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveTx">Save</button></div>`);
}
async function saveTx(){
  await addTransaction();
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
        <div class="stmt-pcrd-actions">
          <button class="btn btn-g btn-s" data-action="downloadStatement" data-id="${esc(s.ref_id)}">Download</button>
          ${canRelease?`<button class="btn btn-p btn-s" data-action="openReleaseStatementModal" data-id="${esc(s.ref_id)}">Release Statement</button>`:'<span class="fs-10 text-muted">Awaiting release by authorised user</span>'}
        </div>
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
      <td class="stmt-row-actions">
        <button class="btn btn-g btn-s" data-action="downloadStatement" data-id="${esc(s.ref_id)}">Download</button>
        ${canRelease?`<button class="btn btn-p btn-s" data-action="openResendStatementModal" data-id="${esc(s.ref_id)}">Send Again</button>`:''}
      </td>
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
  const btn=document.querySelector('[data-action="generateStatement"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}
  const r=await api('POST','statements.php?action=generate');
  if(!r.success){toast(r.error||'Error generating statement','err');if(btn)btn.disabled=false;return;}
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
<p>Released: ${esc(s.released_at?.slice(0,10)||'—')} by ${esc(s.released_by||'—')}</p>
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
  const btn=document.querySelector('[data-action="releaseStatement"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}
  const from=document.getElementById('rs-from')?.value;
  const to=document.getElementById('rs-to')?.value;
  const extra=document.getElementById('rs-extra')?.value?.trim();
  if(!from||!to){toast('From and To addresses are required','err');if(btn)btn.disabled=false;return;}

  const tos=[to];
  if(extra) extra.split(',').forEach(e=>{const t=e.trim();if(t)tos.push(t);});

  const r=await api('PUT',`statements.php?id=${ref_id}`,{from_email:from,to_emails:tos});
  if(!r.success){toast(r.error||'Error releasing statement','err');if(btn)btn.disabled=false;return;}
  closeModalDirect();
  toast(r.message||'Statement released','ok');
  renderStatement();
}
async function openResendStatementModal(ref_id){
  const re=await api('GET','statements.php?action=email_options');
  if(!re.success){toast(re.error||'Could not load email options','err');return;}
  const fromOpts=re.from_options||[];
  const toOpts=re.to_options||[];
  const fromSel=fromOpts.map(u=>`<option value="${esc(u.email)}">${esc(u.name)} &lt;${esc(u.email)}&gt; (${esc(u.role)})</option>`).join('');
  const toSel=toOpts.map(u=>`<option value="${esc(u.email)}">${esc(u.name)} &lt;${esc(u.email)}&gt;</option>`).join('');
  openModal(`Resend Statement — ${ref_id}`,`
    <div class="fs-12 mb-14">Review the FROM and TO addresses below. The statement will be re-emailed immediately when you click Send.</div>
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
      <button class="btn btn-p" data-action="releaseStatement" data-id="${esc(ref_id)}">Send Statement</button>
    </div>
  `);
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
        <div class="fgrid fgrid-narrow">
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
    <div class="panel mb2 panel-warn-top">
      <div class="ph"><div class="ph-title">⚠ Possible Duplicate Transactions</div></div>
      <div class="pb">
        <table class="dtable">
          <thead><tr><th>Date</th><th>Description</th><th>Credit</th><th>Debit</th><th>Count</th></tr></thead>
          <tbody>${[...dupeKeys].map(k=>{const [date,desc,cr,db]=k.split('|');return`<tr>
            <td>${esc(date)}</td><td>${esc(desc)}</td>
            <td class="amt text-ok">${parseFloat(cr)>0?fmt(parseFloat(cr)):'-'}</td>
            <td class="amt text-ovr">${parseFloat(db)>0?fmt(parseFloat(db)):'-'}</td>
            <td class="td-dupe-count">${seen[k]}×</td>
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
              return`<tr${isDupe?' class="tr-dupe"':''}>
                <td class="nowrap">${fmtD(t.date)}</td>
                <td>${esc(t.desc)}${isDupe?' <span class="span-dup">DUP</span>':''}</td>
                <td><span class="mlbl-9">${esc(t.cat||t.category||'')}</span></td>
                <td class="mono td-ref-sm">${esc(t.ref||'-')}</td>
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
    box.innerHTML=`<div class="sumbox sumbox-flush">
      <div class="sumrow"><span>External Statement</span><span class="mono">${fmt(ext)}</span></div>
      <div class="sumrow"><span>Portal Net Balance</span><span class="mono">${fmt(portalNet)}</span></div>
      <div class="sumrow tot ${cls}"><span>Difference (Portal − Statement)</span><span class="mono">${sign}${fmt(diff)}</span></div>
      <div class="recon-msg">${msg}</div>
    </div>`;
  }
  extInput.addEventListener('input', calcDiff);
  if(savedExternal) calcDiff();
}

/* ═══════════════════════════════════════════════════════
   P&L LEDGER — 5-tab full financial record
═══════════════════════════════════════════════════════ */
const PLL_TABS = [
  { id:'pll-remittances', label:'Remittances (All)' },
  { id:'pll-bank',        label:'Bank Statement' },
  { id:'pll-invoices',    label:'Sales Invoices' },
  { id:'pll-costs',       label:'Supplier Costs' },
  { id:'pll-monthly',     label:'Monthly P&L' },
];

let pllActiveTab = 'pll-remittances';
let pllData = {};

function switchPLLedgerTab(tab) {
  if (!PLL_TABS.some(t => t.id === tab)) return;
  pllActiveTab = tab;

  const tabEl = document.getElementById('pl-ledger-tabs');
  if (tabEl) {
    tabEl.querySelectorAll('[data-pll-tab]').forEach(btn => {
      const active = btn.dataset.pllTab === pllActiveTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  PLL_TABS.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) el.hidden = (t.id !== pllActiveTab);
  });

  _pllRenderTab(pllActiveTab);
}

function renderLedgerSummary() {
  const el = document.getElementById('pl-ledger-summary');
  if (!el) return;

  const tx = [...(proxyDB.bank || [])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const credits = tx.reduce((sum,row)=>sum + (Number(row.credit)||0), 0);
  const debits = tx.reduce((sum,row)=>sum + (Number(row.debit)||0), 0);
  const payments = tx.filter(row => row.cat === 'Invoice Payment' || Number(row.credit) > 0).reduce((sum,row)=>sum + (Number(row.credit)||0), 0);
  const net = credits - debits;

  const now = new Date();
  const months = [];
  for (let i=5;i>=0;i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({ lbl:d.toLocaleDateString('en-ZA',{month:'short'}), ym:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
  }
  const trend = months.map(m => {
    const rows = tx.filter(row => String(row.date||'').slice(0,7) === m.ym);
    return {
      ...m,
      credits: rows.reduce((sum,row)=>sum + (Number(row.credit)||0), 0),
      debits: rows.reduce((sum,row)=>sum + (Number(row.debit)||0), 0),
    };
  });
  const maxTrend = Math.max(...trend.flatMap(row => [row.credits,row.debits]), 1);
  const trendHtml = trend.map((row,i) => {
    const ch = Math.max(3, Math.round((row.credits/maxTrend)*100));
    const dh = Math.max(3, Math.round((row.debits/maxTrend)*100));
    return `<div class="ledger-trend-col">
      <div class="ledger-trend-bars">
        <div class="ledger-bar ledger-bar-credit" data-h="${ch}" data-lbi="c${i}" title="Credits: ${fmt(row.credits)}"></div>
        <div class="ledger-bar ledger-bar-debit" data-h="${dh}" data-lbi="d${i}" title="Debits: ${fmt(row.debits)}"></div>
      </div>
      <div class="ledger-trend-label">${esc(row.lbl)}</div>
    </div>`;
  }).join('');

  const catMap = {};
  tx.forEach(row => {
    const key = row.cat || 'Uncategorised';
    if (!catMap[key]) catMap[key] = { category:key, credits:0, debits:0, count:0 };
    catMap[key].credits += Number(row.credit)||0;
    catMap[key].debits += Number(row.debit)||0;
    catMap[key].count += 1;
  });
  const cats = Object.values(catMap).sort((a,b)=>Math.max(b.credits,b.debits)-Math.max(a.credits,a.debits)).slice(0,6);
  const catMax = Math.max(...cats.map(row=>Math.max(row.credits,row.debits)), 1);
  const catHtml = cats.length ? cats.map((row,i) => {
    const amount = Math.max(row.credits,row.debits);
    return `<div class="fin-break-row">
      <div class="fin-break-main">
        <div class="fin-break-title">${esc(row.category)}</div>
        <div class="fin-break-meta">${row.count} transactions - CR ${fmt(row.credits)} - DR ${fmt(row.debits)}</div>
      </div>
      <div class="fin-break-amt">${fmt(amount)}</div>
      <div class="prog-bar fin-break-bar"><div class="prog-fill" data-w="${Math.max(4,Math.round(amount/catMax*100))}" data-bg="var(--amber)"></div></div>
    </div>`;
  }).join('') : `<div class="empty-note">No ledger categories yet.</div>`;

  const feedHtml = tx.slice(0,10).map(row => `
    <div class="ledger-feed-card">
      <div class="ledger-feed-date">${fmtD(row.date)}</div>
      <div class="ledger-feed-main">
        <div class="fin-break-title">${esc(row.desc)}</div>
        <div class="fin-break-meta">${esc(row.cat || 'Uncategorised')} - ${esc(row.ref || 'No reference')}</div>
      </div>
      <div class="ledger-feed-amounts">
        <span class="text-ok">CR ${Number(row.credit)>0?fmt(row.credit):'-'}</span>
        <span class="text-ovr">DR ${Number(row.debit)>0?fmt(row.debit):'-'}</span>
      </div>
    </div>`).join('') || `<div class="empty-note">No posted transactions yet.</div>`;

  el.innerHTML = `
    <div class="kgrid kgrid--4">
      <div class="kcard k1"><div class="klbl">Net Balance</div><div class="kval${net>=0?' text-ok':' text-ovr'}">${fmt(net)}</div><div class="ksub">Credits less debits</div></div>
      <div class="kcard k1"><div class="klbl">Total Credits</div><div class="kval text-ok">${fmt(credits)}</div><div class="ksub">${tx.filter(row=>Number(row.credit)>0).length} credit entries</div></div>
      <div class="kcard k3"><div class="klbl">Total Debits</div><div class="kval text-ovr">${fmt(debits)}</div><div class="ksub">${tx.filter(row=>Number(row.debit)>0).length} debit entries</div></div>
      <div class="kcard k2"><div class="klbl">Payments Received</div><div class="kval">${fmt(payments)}</div><div class="ksub">${tx.length} posted transactions</div></div>
    </div>
    <div class="twocol ledger-summary-grid">
      <div class="panel">
        <div class="ph"><div class="ph-title">Credits vs Debits by Month</div><div class="ph-sub"><span class="legend-dot legend-ok"></span>Credits <span class="legend-dot legend-cost ml-2"></span>Debits</div></div>
        <div class="ledger-trend">${trendHtml}</div>
      </div>
      <div class="panel">
        <div class="ph"><div class="ph-title">Category Exposure</div></div>
        <div class="pb fin-break-list">${catHtml}</div>
      </div>
    </div>
    <div class="panel mt2">
      <div class="ph"><div class="ph-title">Transaction Ledger Feed</div><button class="btn btn-g btn-s" data-action="navPage" data-page="p-transactions">Transactions</button></div>
      <div class="pb ledger-feed">${feedHtml}</div>
    </div>`;

  let css = '';
  el.querySelectorAll('.ledger-bar[data-h]').forEach(bar => { css += `.ledger-bar[data-lbi="${bar.dataset.lbi}"]{height:${bar.dataset.h}%;}`; });
  if (css) _injectStyle('ledger-bars-css', css);
  applyProgFills(el);
}

async function renderPLLedger() {
  // Build tab nav
  const tabEl = document.getElementById('pl-ledger-tabs');
  if (tabEl) {
    tabEl.innerHTML = PLL_TABS.map(t =>
      `<button type="button" class="pnav-btn${t.id===pllActiveTab?' active':''}" data-action="switchPLLedgerTab" data-pll-tab="${t.id}" role="tab" aria-selected="${t.id===pllActiveTab?'true':'false'}">${t.lbl||t.label}</button>`
    ).join('');
  }

  // Show active tab, hide others
  PLL_TABS.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) el.hidden = (t.id !== pllActiveTab);
  });

  // Fetch all data in parallel
  try {
    const [rem, bank, inv, costs, mpl] = await Promise.all([
      api('GET','pl_ledger.php?action=remittances'),
      api('GET','pl_ledger.php?action=bank_statement'),
      api('GET','pl_ledger.php?action=invoices'),
      api('GET','pl_ledger.php?action=supplier_costs'),
      api('GET','pl_ledger.php?action=monthly_pl'),
    ]);
    pllData = { rem, bank, inv, costs, mpl };
    renderLedgerSummary();
    _pllRenderTab(pllActiveTab);
  } catch(e) {
    console.error('PLL fetch error', e);
  }
}

function _pllRenderTab(tab) {
  if (!pllData.rem) return;
  const { rem, bank, inv, costs, mpl } = pllData;

  if (tab === 'pll-remittances') {
    const rows = rem.rows || [];
    document.getElementById('pll-rem-kpis').innerHTML = `
      <div class="kcard k2"><div class="klbl">Total Remitted</div><div class="kval">${fmt(rem.total)}</div><div class="ksub">${rows.length} remittances</div></div>
      <div class="kcard k1"><div class="klbl">Bank Confirmed</div><div class="kval text-ok">${fmt(rem.bank_confirmed)}</div><div class="ksub">${rows.filter(r=>r.bank_confirmed=='1').length} payments matched</div></div>
      <div class="kcard k3"><div class="klbl">Unreconciled</div><div class="kval${rem.unreconciled>0?' text-ovr':''}">${fmt(rem.unreconciled)}</div><div class="ksub">Remittance only — not in FNB</div></div>`;
    document.getElementById('pll-rem-table').innerHTML = rows.map(r => {
      const flagged = r.bank_confirmed=='0';
      return `<tr${flagged?' class="tr-flag"':''}>
        <td class="nowrap">${fmtD(r.remittance_date)}</td>
        <td class="mono">${esc(r.control_no)||'—'}</td>
        <td class="mono">${esc(r.cheque_no)||'—'}</td>
        <td class="amt">${fmt(r.amount)}</td>
        <td>${r.bank_confirmed=='1'?'<span class="badge-ok">Yes ✓</span>':'<span class="badge-warn">No ⚠</span>'}</td>
        <td class="nowrap">${r.bank_date?fmtD(r.bank_date):'—'}</td>
        <td class="td-inv-covered">${esc(r.invoices_covered)}</td>
        <td class="td-notes">${esc(r.notes)||''}</td>
        <td><span class="mlbl-9${r.status==='Bank Confirmed'?' mlbl-ok':' mlbl-warn'}">${esc(r.status)}</span></td>
      </tr>`;
    }).join('');
    document.getElementById('pll-rem-tfoot').innerHTML = `
      <tr class="tfoot-total">
        <td colspan="3"><strong>TOTAL</strong></td>
        <td class="amt"><strong>${fmt(rem.total)}</strong></td>
        <td colspan="5" class="text-muted">Bank confirmed: ${fmt(rem.bank_confirmed)} | Remittance only: ${fmt(rem.unreconciled)}</td>
      </tr>`;
  }

  if (tab === 'pll-bank') {
    const rows = bank.rows || [];
    document.getElementById('pll-bank-kpis').innerHTML = `
      <div class="kcard k1"><div class="klbl">Total Received</div><div class="kval text-ok">${fmt(bank.total)}</div><div class="ksub">${bank.count} entries</div></div>
      <div class="kcard k3"><div class="klbl">Unreconciled</div><div class="kval text-ovr">${fmt(rem.unreconciled)}</div><div class="ksub">In remittances but not in bank</div></div>
      <div class="kcard k4"><div class="klbl">Match Rate</div><div class="kval">${Math.round((bank.total/rem.total)*100)}%</div><div class="ksub">Of total remitted</div></div>`;
    document.getElementById('pll-bank-table').innerHTML = rows.map(r => `<tr>
      <td class="nowrap">${fmtD(r.bank_date)}</td>
      <td class="mono">${esc(r.control_no)||'—'}</td>
      <td class="mono">${esc(r.cheque_no)||'—'}</td>
      <td class="amt text-ok">${fmt(r.amount)}</td>
      <td class="td-inv-covered">${esc(r.invoices_covered)}</td>
      <td><span class="badge-ok">Match ✓</span></td>
    </tr>`).join('');
    document.getElementById('pll-bank-tfoot').innerHTML = `
      <tr class="tfoot-total">
        <td colspan="3"><strong>TOTAL RECEIVED (BANK)</strong></td>
        <td class="amt text-ok"><strong>${fmt(bank.total)}</strong></td>
        <td colspan="2" class="text-muted">${rows.length} matched | ${rows.filter(r=>!r.control_no).length} missing PDF</td>
      </tr>`;
  }

  if (tab === 'pll-invoices') {
    const rows = inv.rows || [];
    document.getElementById('pll-inv-kpis').innerHTML = `
      <div class="kcard k1"><div class="klbl">Total Invoiced</div><div class="kval">${fmt(inv.total_invoiced)}</div><div class="ksub">${rows.length} invoices</div></div>
      <div class="kcard k2"><div class="klbl">Paid</div><div class="kval text-ok">${fmt(inv.total_paid)}</div><div class="ksub">${rows.filter(r=>r.status==='Paid').length} invoices</div></div>
      <div class="kcard k3"><div class="klbl">Outstanding</div><div class="kval${inv.total_outstanding>0?' text-ovr':''}">${fmt(inv.total_outstanding)}</div><div class="ksub">${rows.filter(r=>r.status!=='Paid'&&r.status!=='Cancelled').length} invoices</div></div>`;
    document.getElementById('pll-inv-table').innerHTML = rows.map(r => `<tr>
      <td class="nowrap">${fmtD(r.invoice_date)}</td>
      <td class="mono td-ref-sm">${esc(r.ref_id)}</td>
      <td class="mono">${esc(r.po)||'—'}</td>
      <td>${esc(r.client_name)}</td>
      <td class="amt">${fmt(r.amount)}</td>
      <td class="mono">${esc(r.remittance_ctrl)||'—'}</td>
      <td class="nowrap">${r.payment_date?fmtD(r.payment_date):'—'}</td>
      <td><span class="badge-${r.status==='Paid'?'ok':r.status==='Overdue'?'warn':'muted'}">${esc(r.status)}</span></td>
      <td class="text-right">${r.age_days!=null?r.age_days:'—'}</td>
    </tr>`).join('');
    document.getElementById('pll-inv-tfoot').innerHTML = `
      <tr class="tfoot-total">
        <td colspan="4"><strong>TOTAL INVOICED</strong></td>
        <td class="amt"><strong>${fmt(inv.total_invoiced)}</strong></td>
        <td colspan="4" class="text-muted">Paid: ${fmt(inv.total_paid)} | Outstanding: ${fmt(inv.total_outstanding)}</td>
      </tr>`;
  }

  if (tab === 'pll-costs') {
    const bySup = costs.by_supplier || {};
    const totals = costs.totals || {};
    document.getElementById('pll-cost-kpis').innerHTML = `
      <div class="kcard k3"><div class="klbl">Total Supplier Costs</div><div class="kval text-ovr">${fmt(costs.grand_total)}</div><div class="ksub">${(costs.rows||[]).length} invoices</div></div>
      <div class="kcard k3"><div class="klbl">Siyasiza Group</div><div class="kval text-ovr">${fmt(totals['Siyasiza Group']||0)}</div><div class="ksub">Field labour &amp; materials</div></div>
      <div class="kcard k3"><div class="klbl">Megahertz Systems</div><div class="kval text-ovr">${fmt(totals['Megahertz Systems']||0)}</div><div class="ksub">Hardware &amp; equipment</div></div>`;
    const makeTable = (sup, label) => {
      const items = (bySup[sup]||[]).sort((a,b)=>a.date.localeCompare(b.date));
      if (!items.length) return '';
      return `<div class="panel"><div class="ph"><div class="ph-title">${esc(label)}</div></div><div class="tw"><table>
        <thead><tr><th>Date</th><th>Ref</th><th>Description</th><th>Amount</th><th>Paid</th><th>Status</th></tr></thead>
        <tbody>${items.map(r=>`<tr>
          <td class="nowrap">${fmtD(r.date)}</td>
          <td class="mono">${esc(r.ref_id)}</td>
          <td>${esc(r.description)}</td>
          <td class="amt text-ovr">${fmt(r.amount)}</td>
          <td class="amt text-ok">${fmt(r.amount_paid)}</td>
          <td><span class="mlbl-9 mlbl-${r.status==='paid'?'ok':r.status==='partially_paid'?'warn':'muted'}">${esc(r.status)}</span></td>
        </tr>`).join('')}</tbody>
        <tfoot><tr class="tfoot-total"><td colspan="3"><strong>Total — ${esc(label)}</strong></td><td class="amt text-ovr"><strong>${fmt(totals[sup]||0)}</strong></td><td colspan="2"></td></tr></tfoot>
      </table></div></div>`;
    };
    document.getElementById('pll-cost-tables').innerHTML =
      makeTable('Siyasiza Group','Costs — Siyasiza Group (Pty) Ltd') +
      makeTable('Megahertz Systems','Costs — Megahertz Systems PVT Ltd');
  }

  if (tab === 'pll-monthly') {
    const rows = mpl.rows || [];
    const totals = mpl.totals || {};
    const maxMargin = Math.max(...rows.map(r=>Math.abs(r.cumulative_margin)),1);
    document.getElementById('pll-mpl-kpis').innerHTML = `
      <div class="kcard k1"><div class="klbl">Cash Received</div><div class="kval text-ok">${fmt(totals.cash_received)}</div><div class="ksub">Bank confirmed (FNB *8644)</div></div>
      <div class="kcard k3"><div class="klbl">Total Costs</div><div class="kval text-ovr">${fmt(totals.total_costs)}</div><div class="ksub">Siyasiza + Megahertz</div></div>
      <div class="kcard k1"><div class="klbl">Gross Margin</div><div class="kval${totals.gross_margin>=0?' text-ok':' text-ovr'}">${fmt(totals.gross_margin)}</div><div class="ksub">Cumulative (all months)</div></div>
      <div class="kcard k2"><div class="klbl">Margin %</div><div class="kval">${totals.cash_received>0?Math.round((totals.gross_margin/totals.cash_received)*100)+'%':'—'}</div><div class="ksub">On cash received</div></div>`;
    document.getElementById('pll-mpl-table').innerHTML = rows.map(r => {
      const neg = r.gross_margin < 0;
      return `<tr>
        <td class="nowrap"><strong>${esc(r.label)}</strong></td>
        <td class="amt text-ok">${r.cash_received>0?fmt(r.cash_received):'-'}</td>
        <td class="amt text-ovr">${r.siyasiza_cost>0?'('+fmt(r.siyasiza_cost)+')':'-'}</td>
        <td class="amt text-ovr">${r.megahertz_cost>0?'('+fmt(r.megahertz_cost)+')':'-'}</td>
        <td class="amt text-ovr">${r.total_costs>0?'('+fmt(r.total_costs)+')':'-'}</td>
        <td class="amt ${neg?'text-ovr':'text-ok'}">${fmt(r.gross_margin)}</td>
        <td class="amt ${r.cumulative_margin>=0?'text-ok':'text-ovr'}">${fmt(r.cumulative_margin)}</td>
      </tr>`;
    }).join('');
    document.getElementById('pll-mpl-tfoot').innerHTML = `
      <tr class="tfoot-total">
        <td><strong>TOTAL</strong></td>
        <td class="amt text-ok"><strong>${fmt(totals.cash_received)}</strong></td>
        <td class="amt text-ovr"><strong>(${fmt(totals.siyasiza_cost)})</strong></td>
        <td class="amt text-ovr"><strong>(${fmt(totals.megahertz_cost)})</strong></td>
        <td class="amt text-ovr"><strong>(${fmt(totals.total_costs)})</strong></td>
        <td class="amt text-ok"><strong>${fmt(totals.gross_margin)}</strong></td>
        <td class="amt text-ok"><strong>${fmt(totals.gross_margin)}</strong></td>
      </tr>`;
    // Cumulative margin bar chart
    document.getElementById('pll-margin-chart').innerHTML = rows.map(r => {
      const h = Math.max(4, Math.round((Math.abs(r.cumulative_margin)/maxMargin)*100));
      const neg = r.cumulative_margin < 0;
      return `<div class="cbar-w">
        <div class="cval">${r.cumulative_margin!==0?'R'+Math.round(Math.abs(r.cumulative_margin)/1000)+'K':''}</div>
        <div class="cbar${neg?' cbar-neg':''}" data-h="${h}" title="${fmt(r.cumulative_margin)}"></div>
        <div class="clbl">${esc(r.label.substring(0,3))}</div>
      </div>`;
    }).join('');
  }
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
      <div class="audit-ts">${fmtDT(e.ts).replace(', ', '<br>')}</div>
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
  if (bar) { can('user.create') ? $show(bar, 'block') : $hide(bar); }
  const canEdit = can('user.update');
  const thActions = document.getElementById('users-th-actions');
  if (thActions) { canEdit ? $show(thActions, 'table-cell') : $hide(thActions); }
  document.getElementById('users-table-body').innerHTML=proxyDB.users.map(u=>{
    const uRoles = u.roles?.length ? u.roles : [u.role];
    // Merge capability matrix across all assigned roles
    const m={create:'-',status:'-',po:'-',finance:'-',quote:'-',approve:'-',admin:'-'};
    for(const r of uRoles){ const rm=matrix[r]||{}; for(const k of Object.keys(m)){ if(rm[k]&&rm[k]!=='-'){ m[k]=(rm[k]==='✓'||m[k]==='✓')?'✓':rm[k]; } } }
    const actionCell = canEdit ? `<td>
      <button class="btn btn-g btn-xs" data-action="openEditUserModal" data-id="${u.id}">Edit</button>
      ${u.has_signature ? `<button class="btn btn-g btn-xs" data-action="openSignAsModal" data-id="${u.id}">Sign As</button>` : ''}
      ${u.active!=0 ? `<button class="btn btn-d btn-xs" data-action="toggleUserActive" data-id="${u.id}" data-active="0">Disable</button>` : `<button class="btn btn-xs btn-enable" data-action="toggleUserActive" data-id="${u.id}" data-active="1">Enable</button>`}
    </td>` : '';
    return`<tr${u.active==0?' class="row-inactive"':''}>
      <td class="mono">${esc(u.username)}${u.has_signature ? '<span class="sig-badge" title="Has signature"></span>' : ''}</td>
      <td>${esc(u.name)}</td>
      <td class="mono fs-12">${esc(u.email||'')}</td>
      <td>${uRoles.map(rolePill).join(' ')}</td>
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

function _roleCheckboxes(selectedRoles, idPrefix){
  const all = ['admin','manager','admin_clerk','call_logger','junior_tech','senior_tech','client_support','safety_officer','viewer'];
  if (SESSION?.roles?.includes('sysadmin') || SESSION?.role === 'sysadmin') all.unshift('sysadmin');
  return all.map(r=>{
    const checked = selectedRoles.includes(r) ? ' checked' : '';
    const lbl = ROLE_LABELS[r] || r.replace(/_/g,' ');
    return `<label class="role-cb-item"><input type="checkbox" class="role-cb" name="${idPrefix}-roles" value="${r}"${checked}> ${esc(lbl)}</label>`;
  }).join('');
}

function openCreateUserModal(){
  if (!can('user.create')) return;
  openModal('New User', `
    <div class="login-group"><label class="login-label">Username</label><input class="login-input" id="nu-user" placeholder="username"></div>
    <div class="login-group"><label class="login-label">Full Name</label><input class="login-input" id="nu-name" placeholder="First Last"></div>
    <div class="login-group"><label class="login-label">Email</label><input class="login-input" type="email" id="nu-email" placeholder="user@example.com"></div>
    <div class="login-group"><label class="login-label">Title / Position</label><input class="login-input" id="nu-title" placeholder="e.g. Field Technician"></div>
    <div class="login-group"><label class="login-label">Roles <span class="pass-hint">(select one or more)</span></label>
      <div class="roles-cb-grid">${_roleCheckboxes(['viewer'], 'nu')}</div></div>
    <div class="login-group"><label class="login-label">Password</label><input class="login-input" type="password" id="nu-pass" placeholder="min 8 characters"></div>
    <button class="btn-login-submit mt-8" data-action="saveNewUser">Create User</button>
  `);
}

async function saveNewUser(){
  const username = document.getElementById('nu-user')?.value?.trim().toLowerCase();
  const name     = document.getElementById('nu-name')?.value?.trim();
  const email    = document.getElementById('nu-email')?.value?.trim();
  const title    = document.getElementById('nu-title')?.value?.trim();
  const roles    = [...document.querySelectorAll('input.role-cb[name="nu-roles"]:checked')].map(c=>c.value);
  const password = document.getElementById('nu-pass')?.value;
  if (!username || !name || !password) { toast('Username, name and password are required', 'err'); return; }
  if (password.length < 8) { toast('Password must be at least 8 characters', 'err'); return; }
  if (!roles.length) { toast('Select at least one role', 'err'); return; }
  const r = await api('POST', 'users.php', { username, name, email, title, roles, password });
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
  const currentRoles = u.roles?.length ? u.roles : [u.role];
  const sigMeta = u.signature_updated_by
    ? `Updated by ${esc(u.signature_updated_by)} on ${esc((u.signature_updated_at||'').slice(0,10))}`
    : '';
  openModal(`Edit User — ${esc(u.username)}`, `
    <input type="hidden" id="eu-id" value="${u.id}">
    <div class="login-group"><label class="login-label">Username</label><input class="login-input" value="${esc(u.username)}" readonly class="login-input inp-readonly"></div>
    <div class="login-group"><label class="login-label">Full Name</label><input class="login-input" id="eu-name" value="${esc(u.name)}" placeholder="First Last"></div>
    <div class="login-group"><label class="login-label">Email</label><input class="login-input" type="email" id="eu-email" value="${esc(u.email||'')}" placeholder="user@example.com"></div>
    <div class="login-group"><label class="login-label">Title / Position</label><input class="login-input" id="eu-title" value="${esc(u.title||'')}" placeholder="e.g. Field Technician"></div>
    <div class="login-group"><label class="login-label">Roles <span class="pass-hint">(select one or more)</span></label>
      <div class="roles-cb-grid">${_roleCheckboxes(currentRoles, 'eu')}</div></div>
    <div class="login-group"><label class="login-label">New Password <span class="pass-hint">(leave blank to keep)</span></label><input class="login-input" type="password" id="eu-pass" placeholder="min 8 characters"></div>
    <button class="btn-login-submit mt-8" data-action="saveEditUser">Save Changes</button>
    <div class="sig-section">
      <div class="sig-section-title">Signature</div>
      <div id="eu-sig-current" class="sig-current-wrap${u.has_signature?'':' hidden'}">
        <div class="sig-preview-box"><img id="eu-sig-img" src="" alt="Signature" class="sig-img"></div>
        <div class="sig-meta" id="eu-sig-meta">${sigMeta}</div>
        <button class="btn btn-d btn-xs mt-4" data-action="removeUserSignature" data-id="${u.id}">Remove Signature</button>
      </div>
      <div class="sig-upload-row">
        <input type="file" id="eu-sig-file" accept="image/png" class="hidden">
        <label for="eu-sig-file" class="btn btn-g btn-s sig-upload-btn">${u.has_signature?'Replace Signature':'Upload Signature (PNG)'}</label>
        <span class="sig-hint">PNG only — background removed automatically</span>
      </div>
      <div id="eu-sig-new-wrap" class="sig-new-wrap hidden">
        <div class="sig-preview-box"><img id="eu-sig-new-img" src="" alt="Preview" class="sig-img"></div>
        <div class="sig-new-actions">
          <button class="btn btn-g btn-s" data-action="saveUserSignature">Save Signature</button>
          <button class="btn btn-d btn-xs" data-action="clearSigPreview">Cancel</button>
        </div>
      </div>
    </div>
  `);
  const sigFile = document.getElementById('eu-sig-file');
  if (sigFile) sigFile.addEventListener('change', onSigFileSelected);
  if (u.has_signature) loadUserSignature(u.id);
}

async function saveEditUser() {
  const id    = parseInt(document.getElementById('eu-id')?.value) || 0;
  const name  = document.getElementById('eu-name')?.value?.trim();
  const email = document.getElementById('eu-email')?.value?.trim();
  const title = document.getElementById('eu-title')?.value?.trim();
  const roles = [...document.querySelectorAll('input.role-cb[name="eu-roles"]:checked')].map(c=>c.value);
  const pass  = document.getElementById('eu-pass')?.value;
  if (!id || !name) { toast('Name is required', 'err'); return; }
  if (pass && pass.length < 8) { toast('Password must be at least 8 characters', 'err'); return; }
  if (!roles.length) { toast('Select at least one role', 'err'); return; }
  const payload = { name, email, title, roles };
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
  if (!await confirmDialog(`${active?'Enable':'Disable'} user ${u?.username || id}?`, { title: active?'Enable User':'Disable User', confirmLabel: active?'Enable':'Disable', danger: !active })) return;
  const r = await api('PUT', `users.php?id=${id}`, { active: active ? 1 : 0 });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshUsers();
  renderUsers();
  toast(`User ${label}d`, 'ok');
}

/* ═══════════════════════════════════════════════════════
   USER SIGNATURE
═══════════════════════════════════════════════════════ */

async function loadUserSignature(userId) {
  const r = await api('GET', `user_signature.php?user_id=${userId}`);
  if (!r.success || !r.has_signature) return;
  const img  = document.getElementById('eu-sig-img');
  const meta = document.getElementById('eu-sig-meta');
  if (img)  img.src = r.signature_image;
  if (meta && r.signature_updated_by) {
    meta.textContent = `Updated by ${r.signature_updated_by} on ${(r.signature_updated_at||'').slice(0,10)}`;
  }
}

function onSigFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.type !== 'image/png') {
    toast('Only PNG files are accepted', 'err');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    const wrap = document.getElementById('eu-sig-new-wrap');
    const img  = document.getElementById('eu-sig-new-img');
    if (img)  img.src = ev.target.result;
    if (wrap) wrap.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function saveUserSignature() {
  const idEl   = document.getElementById('eu-id');
  const newImg = document.getElementById('eu-sig-new-img');
  if (!idEl || !newImg || !newImg.src.startsWith('data:')) { toast('No signature selected', 'err'); return; }
  const id = parseInt(idEl.value);
  const r  = await api('POST', `user_signature.php?user_id=${id}`, { signature_image: newImg.src });
  if (!r.success) { toast(r.error || 'Upload failed', 'err'); return; }
  const currentWrap = document.getElementById('eu-sig-current');
  const currentImg  = document.getElementById('eu-sig-img');
  const newWrap     = document.getElementById('eu-sig-new-wrap');
  const fileInput   = document.getElementById('eu-sig-file');
  if (currentImg)  currentImg.src = r.signature_image;
  if (currentWrap) currentWrap.classList.remove('hidden');
  if (newWrap)     newWrap.classList.add('hidden');
  if (fileInput)   fileInput.value = '';
  const u = (DB.users || []).find(x => x.id === id);
  if (u) u.has_signature = true;
  toast('Signature saved', 'ok');
}

async function removeUserSignature(id) {
  if (!await confirmDialog('Remove this user\'s signature?\n\nThis action cannot be undone.', { title: 'Remove Signature', confirmLabel: 'Remove' })) return;
  const r = await api('DELETE', `user_signature.php?user_id=${id}`);
  if (!r.success) { toast(r.error || 'Error removing signature', 'err'); return; }
  const wrap = document.getElementById('eu-sig-current');
  if (wrap) wrap.classList.add('hidden');
  const u = (DB.users || []).find(x => x.id === id);
  if (u) u.has_signature = false;
  renderUsers();
  toast('Signature removed', 'ok');
}

function clearSigPreview() {
  const wrap  = document.getElementById('eu-sig-new-wrap');
  const input = document.getElementById('eu-sig-file');
  if (wrap)  wrap.classList.add('hidden');
  if (input) input.value = '';
}

function openSignAsModal(id) {
  if (!can('user.update')) return;
  const u = (DB.users || []).find(x => x.id === id);
  if (!u) return;
  const entityTypes = ['policy_ack','safety_file','quote','invoice','callout'];
  const opts = entityTypes.map(t => `<option value="${t}">${t.replace(/_/g,' ')}</option>`).join('');
  openModal(`Sign As — ${esc(u.username)}`, `
    <input type="hidden" id="sa-user-id" value="${u.id}">
    <div class="sig-as-notice">
      <strong>Admin action:</strong> You are signing a document using ${esc(u.username)}'s stored signature.
      This action is permanently recorded in the audit log.
    </div>
    <div class="login-group"><label class="login-label">Document Type</label><select class="login-input" id="sa-entity-type">${opts}</select></div>
    <div class="login-group"><label class="login-label">Document Reference</label><input class="login-input" id="sa-entity-ref" placeholder="e.g. SAF-2026-001"></div>
    <div class="login-group"><label class="login-label">Reason / Notes</label><input class="login-input" id="sa-reason" placeholder="e.g. User absent — manager authorised"></div>
    <button class="btn-login-submit mt-8 btn-warn" data-action="submitSignAs">Sign as ${esc(u.username)}</button>
  `);
}

async function submitSignAs() {
  const btn=document.querySelector('[data-action="submitSignAs"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}
  const id          = parseInt(document.getElementById('sa-user-id')?.value) || 0;
  const entity_type = document.getElementById('sa-entity-type')?.value;
  const entity_ref  = document.getElementById('sa-entity-ref')?.value?.trim();
  const reason      = document.getElementById('sa-reason')?.value?.trim();
  if (!id || !entity_ref) { toast('Document reference is required', 'err'); if(btn)btn.disabled=false; return; }
  const r = await api('POST', `user_signature.php?user_id=${id}&action=sign_as`, { entity_type, entity_ref, reason });
  if (!r.success) { toast(r.error || 'Error', 'err'); if(btn)btn.disabled=false; return; }
  closeModalDirect();
  toast(r.message || 'Signed and audited', 'ok');
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD EDITOR
═══════════════════════════════════════════════════════ */
function showDashEditor(){
  const prefs  = getDashPrefs();
  const order  = getDashWidgetOrder(prefs);
  const roles  = SESSION?.roles?.length ? SESSION.roles : (SESSION?.role ? [SESSION.role] : []);
  const isAdmin = roles.some(r => r==='admin'||r==='sysadmin');

  const rows = order
    .map(id => DASH_WIDGETS.find(w=>w.id===id))
    .filter(Boolean)
    .filter(w => !w.perm || can(w.perm))
    .map(w => {
      const on = isWidgetOn(w.id, prefs);
      return `<div class="dwt-row" data-wid="${esc(w.id)}" draggable="true">
        <div class="dwt-drag-handle" title="Drag to reorder"><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="3" r="1.2"/><circle cx="4.5" cy="7" r="1.2"/><circle cx="4.5" cy="11" r="1.2"/><circle cx="9.5" cy="3" r="1.2"/><circle cx="9.5" cy="7" r="1.2"/><circle cx="9.5" cy="11" r="1.2"/></svg></div>
        <div class="dwt-info"><div class="dwt-label">${esc(w.label)}</div><div class="dwt-desc">${esc(w.desc)}</div></div>
        <div class="dwt-switch"><input type="checkbox" id="dw-${w.id}"${on?' checked':''}><span class="dwt-track"></span></div>
      </div>`;
    }).join('');

  const adminSection = isAdmin ? `
    <div class="dash-editor-admin-section">
      <span class="dash-editor-admin-label">Admin</span>
      <div class="dash-editor-admin-btns">
        <button class="btn btn-g btn-s" data-action="setDashDefaultForAll">Set as Default for All</button>
        <button class="btn btn-g btn-s dash-editor-reset-btn" data-action="resetDashLayoutForAll">Reset All Users</button>
      </div>
    </div>` : '';

  openModal('Edit Dashboard Layout',`
    <p class="dash-editor-hint">Drag to reorder sections. Toggle to show or hide. Changes apply to your account only.</p>
    <div class="dash-editor-list" id="dash-editor-list">
      ${rows||'<p class="text-muted text-center p-20">No widgets available for your role.</p>'}
    </div>
    ${adminSection}
    <div class="flex-end gap-10 mt-18">
      <button class="btn btn-g btn-s" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p btn-s" data-action="saveDashEditorPrefs">Save Layout</button>
    </div>`);

  _initDashEditorDrag();
}

function _initDashEditorDrag(){
  const list = document.getElementById('dash-editor-list');
  if(!list) return;
  let dragSrc = null;

  list.querySelectorAll('.dwt-row').forEach(row => {
    row.addEventListener('dragstart', e => {
      dragSrc = row;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => row.classList.add('dw-dragging'), 0);
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dw-dragging');
      list.querySelectorAll('.dwt-row').forEach(r => r.classList.remove('dw-drag-over'));
      dragSrc = null;
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if(row !== dragSrc){
        list.querySelectorAll('.dwt-row').forEach(r => r.classList.remove('dw-drag-over'));
        row.classList.add('dw-drag-over');
      }
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      if(dragSrc && row !== dragSrc){
        const rows = [...list.querySelectorAll('.dwt-row')];
        const srcIdx = rows.indexOf(dragSrc);
        const tgtIdx = rows.indexOf(row);
        if(srcIdx < tgtIdx) row.after(dragSrc);
        else row.before(dragSrc);
      }
      list.querySelectorAll('.dwt-row').forEach(r => r.classList.remove('dw-drag-over'));
    });
  });
}

function saveDashEditorPrefs(){
  const {order, enabled} = _readDashEditorState();
  saveDashPrefs({ enabled, order, customized: true });
  closeModalDirect();
  renderDashboard();
  if(isWidgetOn('w-compliance')&&can('safety.view')) safLoadDashCompliance();
  toast('Dashboard layout saved','ok');
}

async function setDashDefaultForAll(){
  if(!await confirmDialog('Set this layout as the default for all users who haven\'t customised their own dashboard?', { title: 'Set Default Layout', confirmLabel: 'Set Default', danger: false })) return;
  const {order, enabled} = _readDashEditorState();
  const layout = {enabled, order};
  localStorage.setItem('bf_dash_default', JSON.stringify(layout));
  api('PUT', 'dashboard_prefs.php?action=set_default', layout).then(r => {
    if(!r.success) toast('Could not save default to server: ' + (r.error||''), 'err');
  });
  toast('Default layout saved — applies to users without a personal layout','ok');
}

async function resetDashLayoutForAll(){
  if(!await confirmDialog('Reset ALL users\' dashboard layouts?\n\nEveryone (except you) reverts to the default on their next load.', { title: 'Reset All Layouts', confirmLabel: 'Reset All' })) return;
  const r = await api('PUT', 'dashboard_prefs.php?action=reset_all', {});
  if(!r.success){ toast('Reset failed: ' + (r.error||'unknown error'), 'err'); return; }
  toast('All user layouts reset to default','ok');
}

function _readDashEditorState(){
  const list = document.getElementById('dash-editor-list');
  const order=[], enabled={};
  if(list){
    list.querySelectorAll('.dwt-row[data-wid]').forEach(row=>{
      const wid = row.dataset.wid;
      order.push(wid);
      const cb = row.querySelector('input[type=checkbox]');
      enabled[wid] = cb ? cb.checked : true;
    });
  } else {
    const prefs = getDashPrefs();
    getDashWidgetOrder(prefs).forEach(id=>{ order.push(id); enabled[id]=isWidgetOn(id,prefs); });
  }
  return {order, enabled};
}

/* ═══════════════════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════════════════ */
function confirmDialog(msg, opts = {}) {
  return new Promise(resolve => {
    const overlay  = document.getElementById('confirm-overlay');
    const ttlEl    = document.getElementById('confirm-ttl');
    const bdyEl    = document.getElementById('confirm-bdy');
    const okBtn    = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    if (ttlEl) ttlEl.textContent = opts.title || 'Confirm';
    if (bdyEl) bdyEl.textContent = msg;
    if (okBtn) {
      okBtn.textContent = opts.confirmLabel || 'Confirm';
      okBtn.className   = 'btn ' + (opts.danger === false ? 'btn-p' : 'btn-d');
    }
    const done = v => { overlay.classList.remove('show'); resolve(v); };
    okBtn.onclick     = () => done(true);
    cancelBtn.onclick = () => done(false);
    overlay.onclick   = e => { if (e.target === overlay) done(false); };
    overlay.classList.add('show');
  });
}

/* ═══════════════════════════════════════════════════════
   FULL RECORD CHAIN — Quote → Callout → Invoice → Payments
═══════════════════════════════════════════════════════ */
async function openRecordChain(calloutRef){
  openModal(`Record — ${calloutRef}`, `<div class="tc-empty fs-12">Loading…</div>`);
  const r = await api('GET', `callouts.php?action=chain&ref=${encodeURIComponent(calloutRef)}`);
  if (!r.success) { document.getElementById('modal-bdy').innerHTML=`<div class="tc-empty text-ember">Failed to load record: ${esc(r.error||'unknown error')}</div>`; return; }
  const {callout:co, quote:q, quote_items:qi, invoice:inv, payments:pays} = r;

  const section = (icon,title,body) =>
    `<div class="chain-section">
       <div class="chain-hdr"><span class="chain-icon">${icon}</span><span class="chain-ttl">${title}</span></div>
       <div class="chain-body">${body}</div>
     </div>`;

  const metaRow = (label,val) => val
    ? `<div class="chain-meta-row"><span class="chain-lbl">${label}</span><span class="chain-val">${val}</span></div>`
    : '';

  // Quote section
  let qHtml = '';
  if (q) {
    const itemRows = (qi||[]).map(i =>
      `<tr><td>${esc(i.description)}</td><td class="tar">${i.qty}</td><td class="tar amt">${fmt(+i.unit_price)}</td><td class="tar amt">${fmt(+i.line_total)}</td></tr>`
    ).join('');
    const total = (qi||[]).reduce((s,i)=>s+(+i.line_total),0);
    qHtml = section('Q','Quote',`
      ${metaRow('Ref',esc(q.ref_id))}
      ${metaRow('Quote No.',esc(q.quote_no||''))}
      ${metaRow('Date',fmtD(q.quote_date))}
      ${metaRow('Valid Until',fmtD(q.valid_until))}
      ${metaRow('Status',pillH(q.status))}
      ${metaRow('Submitted By',esc(q.submitted_by_name||q.submitted_by||''))}
      ${metaRow('Approved By',esc(q.approved_by||''))}
      ${q.notes?metaRow('Notes',esc(q.notes)):''}
      ${itemRows?`<table class="chain-items-t mt-10">
        <thead><tr><th>Description</th><th class="tar">Qty</th><th class="tar">Unit</th><th class="tar">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr><td colspan="3" class="tar fw-600">Total</td><td class="tar amt fw-600">${fmt(total)}</td></tr></tfoot>
      </table>`:''}
    `);
  } else {
    qHtml = section('Q','Quote','<div class="text-muted fs-11">No quote on record for this job.</div>');
  }

  // Callout section
  const coHtml = section('C','Callout',`
    ${metaRow('Ref',esc(co.ref_id))}
    ${metaRow('Date',fmtD(co.callout_date)+(co.callout_time?'  '+esc(co.callout_time):''))}
    ${metaRow('Service',esc(co.service))}
    ${metaRow('Location',esc(co.location||''))}
    ${metaRow('Technician',esc(co.tech||co.assigned_to||''))}
    ${metaRow('PO',esc(co.po||''))}
    ${metaRow('Priority',pillH(co.priority))}
    ${metaRow('Status',pillH(co.status))}
    ${metaRow('Logged By',esc(co.logged_by_name||co.logged_by||''))}
    ${co.notes?metaRow('Notes',esc(co.notes)):''}
  `);

  // Invoice section
  let invHtml = '';
  if (inv) {
    const payRows = (pays||[]).map(p =>
      `<tr><td>${fmtD(p.payment_date)}</td><td class="tar amt">${fmt(+p.amount)}</td><td>${esc(p.notes||'')}</td></tr>`
    ).join('');
    invHtml = section('I','Invoice',`
      ${metaRow('Ref',esc(inv.ref_id))}
      ${metaRow('Date',fmtD(inv.invoice_date))}
      ${metaRow('Due Date',fmtD(inv.due_date))}
      ${metaRow('Amount',`<span class="amt fw-600">${fmt(+inv.amount)}</span>`)}
      ${metaRow('Status',pillH(inv.status))}
      ${inv.paid_date?metaRow('Paid On',fmtD(inv.paid_date)):''}
      ${payRows?`<table class="chain-items-t mt-10">
        <thead><tr><th>Payment Date</th><th class="tar">Amount</th><th>Reference</th></tr></thead>
        <tbody>${payRows}</tbody>
      </table>`:''}
    `);
  } else {
    invHtml = section('I','Invoice','<div class="text-muted fs-11">No invoice raised yet.</div>');
  }

  document.getElementById('modal-bdy').innerHTML =
    `<div class="record-chain">${qHtml}${coHtml}${invHtml}</div>`;
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
function closeModalDirect(){
  document.getElementById('modal-overlay').classList.remove('show');
  if (_dvBlobUrl) { URL.revokeObjectURL(_dvBlobUrl); _dvBlobUrl = null; }
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
function syncPublicNavOffset(){
  const eb=document.querySelector('.emergency-bar');
  const pn=document.getElementById('pub-nav');
  if(eb&&pn) _injectStyle('nav-top-css',`#pub-nav{top:${eb.offsetHeight}px;}`);
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
    $hide(document.getElementById('login-panel'));
    $hide(document.getElementById('forgot-panel'));
    $show(document.getElementById('newpass-panel'), 'block');
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
    { const _rl = SESSION.roles?.length > 1 ? SESSION.roles.map(r=>ROLE_LABELS[r]||r).join(' + ') : (ROLE_LABELS[SESSION.role]||SESSION.role);
      document.getElementById('dash-sub').textContent = `AECI CHEMPARK  -  ${_rl.toUpperCase()} VIEW`; }
    await Promise.all([refreshAll(), loadDashPrefsFromAPI()]);
    const _roleMap = { call_logger:'p-new-callout', junior_tech:'p-tracker', senior_tech:'p-tracker', client_support:'p-dashboard', admin_clerk:'p-tracker', safety_officer:'p-safety' };
    const _allRoles = SESSION.roles?.length ? SESSION.roles : [SESSION.role];
    const firstPage = Object.entries(_roleMap).find(([r])=>_allRoles.includes(r))?.[1] || 'p-dashboard';
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
  if(nbCo) {
    const openTasks = proxyDB.tasks.filter(t=>t.status==='Open'||t.status==='In Progress').length;
    const openCalls = proxyDB.callouts.filter(c=>c.status==='Open'||c.status==='In Progress').length;
    nbCo.textContent=(openTasks+openCalls)||'';
  }
  const nbSaf=document.getElementById('nb-saf');
  if(nbSaf) nbSaf.textContent=typeof safBadgeCount==='function'?safBadgeCount()||'':'';
}

/* ── Override: saveCallout ───────────────────────────── */
async function saveCallout(){
  const btn=document.querySelector('[data-action="saveCallout"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}
  const clientId = parseInt(document.getElementById('nc-client')?.value) || 0;
  const service = document.getElementById('nc-service')?.value?.trim();
  const location = document.getElementById('nc-location')?.value?.trim() || '';
  const priority = document.getElementById('nc-priority')?.value || 'Normal';
  const tech = document.getElementById('nc-tech')?.value?.trim() || '';
  const assignedTo = document.getElementById('nc-assign')?.value?.trim() || '';
  const notes = document.getElementById('nc-notes')?.value?.trim() || '';
  const calloutTime = document.getElementById('nc-time')?.value || '08:00';
  const po    = document.getElementById('nc-po')?.value?.trim() || '';
  const jobNo = document.getElementById('nc-job-no')?.value?.trim() || '';

  if (!clientId) { toast('Please select a client', 'err'); if(btn)btn.disabled=false; return; }
  if (!service) { toast('Please fill in the service field', 'err'); if(btn)btn.disabled=false; return; }

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
    job_no: jobNo,
  });

  if (!r.success) { toast(r.error || 'Error saving callout', 'err'); if(btn)btn.disabled=false; return; }
  
  await refreshCallouts();
  updateBadges();
  _trackerCat = 'call_log';
  showPortalPage('p-tracker', null);
  toast(`Callout ${r.data?.ref_id || ''} logged — expand the row to assign a technician and PO`, 'ok');
  audit('CREATE', r.data?.ref_id || 'Callout created');
}

/* ── Override: deleteCallout ─────────────────────────── */
async function deleteCallout(id){
  if (!await confirmDialog(`Delete callout ${id}?\n\nThis action cannot be undone.`, { title: 'Delete Callout', confirmLabel: 'Delete' })) return;
  const r = await api('DELETE', `callouts.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshCallouts();
  updateBadges();
  renderCallouts('');
  toast(`${id} deleted`, 'info');
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
  toast(`Status updated to ${status}`, 'ok');
}

/* ── Override: assignPO ──────────────────────────────── */
async function assignPO(id){
  const po = document.getElementById('po-input')?.value?.trim();
  if (!po) { toast('PO number is required', 'err'); return; }
  const btn = document.querySelector('[data-action="assignPO"]');
  if (btn) { if (btn.disabled) return; btn.disabled = true; }
  const r = await api('PUT', `callouts.php?id=${id}`, { po });
  if (!r.success) { toast(r.error || 'Error assigning PO', 'err'); if (btn) btn.disabled = false; return; }
  const fileInput = document.getElementById('po-doc');
  if (fileInput?.files?.length) {
    const up = await apiUpload('callout', id, fileInput);
    if (!up.success) toast('PO saved but document upload failed — try Files to attach manually', 'err');
  }
  await refreshCallouts();
  renderCallouts('');
  closeModalDirect();
  toast(`PO ${po} assigned to ${id}`, 'ok');
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
  toast(`Quote ${id} declined — requester will see the updated status`, 'info');
}

/* ── Override: deleteQuote ───────────────────────────── */
async function deleteQuote(id){
  if (!await confirmDialog(`Delete quote ${id}?\n\nThis action cannot be undone.`, { title: 'Delete Quote', confirmLabel: 'Delete' })) return;
  const r = await api('DELETE', `quotes.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshQuotes();
  updateBadges();
  renderQuotes('');
  closeModalDirect();
  toast(`${id} deleted`, 'info');
}

/* ── Override: saveQuote ─────────────────────────────── */
async function saveQuote(){
  const btn=document.querySelector('[data-action="saveQuote"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}
  const clientId = parseInt(document.getElementById('nq-client')?.value) || 0;
  const validUntil = document.getElementById('nq-valid')?.value;
  const notes = document.getElementById('nq-notes')?.value?.trim() || '';

  if (!clientId) { toast('Please select a client', 'err'); if(btn)btn.disabled=false; return; }

  // Collect line items from the actual row HTML (inputs indexed by position)
  const rows = document.querySelectorAll('#li-body tr');
  const items = [];
  rows.forEach(row => {
    const ins  = row.querySelectorAll('input');
    const desc = ins[0]?.value?.trim();
    const qty  = parseFloat(ins[1]?.value) || 1;
    const unit = parseFloat(ins[2]?.value) || 0;
    if (desc) items.push({ desc, qty, unit });
  });

  if (!items.length) { toast('Add at least one line item', 'err'); if(btn)btn.disabled=false; return; }

  const calloutRef = document.getElementById('nq-callout-ref')?.value || '';
  const quoteNo    = document.getElementById('nq-quote-no')?.value?.trim() || '';
  const r = await api('POST', 'quotes.php', { client_id: clientId, items, valid_until: validUntil, notes, callout_ref: calloutRef, quote_no: quoteNo });
  if (!r.success) { toast(r.error || 'Error saving quote', 'err'); if(btn)btn.disabled=false; return; }
  
  await refreshQuotes();
  updateBadges();
  showPortalPage('p-quotes', null);
  const _qRef = r.data?.ref_id || '';
  const _qMsg = can('quote.approve')
    ? `Quote ${_qRef} saved — set status to Sent when ready to share with the client`
    : `Quote ${_qRef} submitted for approval — a manager will review before it is issued`;
  toast(_qMsg, 'ok');
}

/* ── Override: convertToInvoice ──────────────────────── */
function convertToInvoice(id) {
  _invoiceContext = { quoteId: id };
  closeModalDirect();
  showPortalPage('p-new-invoice', null);
}

function openInvoiceFromCallout(calloutId) {
  const co = proxyDB.callouts.find(x => x.id === calloutId);
  if (!co?.po) {
    toast(`PO number required before generating an invoice for ${calloutId}. Use the Assign PO button first.`, 'err');
    return;
  }
  _invoiceContext = { calloutId };
  showPortalPage('p-new-invoice', null);
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
  if (!await confirmDialog(`Delete invoice ${id}?\n\nThis action cannot be undone.`, { title: 'Delete Invoice', confirmLabel: 'Delete' })) return;
  const r = await api('DELETE', `invoices.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshInvoices();
  updateBadges();
  renderInvoices('');
  closeModalDirect();
  toast(`${id} deleted`, 'info');
}

/* ── Override: saveInvoice ───────────────────────────── */
async function saveInvoice(){
  const btn=document.querySelector('[data-action="saveInvoice"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}
  const clientId   = parseInt(document.getElementById('ni-client')?.value) || 0;
  const amount     = parseFloat(document.getElementById('ni-amount')?.value) || 0;
  const dueDate    = document.getElementById('ni-due')?.value;
  const status     = document.getElementById('ni-status')?.value || 'Draft';
  const po         = document.getElementById('ni-po')?.value?.trim() || '';
  const quoteRef   = document.getElementById('ni-quote-ref')?.value || '';
  const calloutRef = document.getElementById('ni-callout-ref')?.value || '';

  if (!clientId) { toast('Please select a client', 'err'); if(btn)btn.disabled=false; return; }
  if (!amount || !dueDate) { toast('Fill in amount and due date', 'err'); if(btn)btn.disabled=false; return; }
  if (!calloutRef) { toast('Select the completed callout this invoice belongs to', 'err'); if(btn)btn.disabled=false; return; }

  const linkedCo = proxyDB.callouts.find(x => x.id === calloutRef);
  if (!linkedCo?.po) { toast('A PO number must be assigned to the linked callout before generating an invoice', 'err'); if(btn)btn.disabled=false; return; }

  const invoiceNo  = document.getElementById('ni-invoice-no')?.value?.trim() || '';
  const r = await api('POST', 'invoices.php', { client_id: clientId, amount, due_date: dueDate, status, po, quote_ref: quoteRef, callout_ref: calloutRef, invoice_no: invoiceNo });
  if (!r.success) { toast(r.error || 'Error', 'err'); if(btn)btn.disabled=false; return; }

  await Promise.all([refreshInvoices(), refreshCallouts()]);
  updateBadges();
  showPortalPage('p-invoices', null);
  toast(`Invoice ${r.data?.ref_id || ''} created — callout marked Invoiced`, 'ok');
}

/* ── Override: logPayment ────────────────────────────── */
async function logPayment(){
  const btn=document.querySelector('[data-action="logPayment"]');
  if(btn){if(btn.disabled)return;btn.disabled=true;}
  const checked = [...document.querySelectorAll('input[name="pay-sel"]:checked')];
  if (!checked.length) { toast('Select at least one invoice', 'err'); if(btn)btn.disabled=false; return; }
  const invoice_refs = checked.map(b => b.value);
  const date   = document.getElementById('pay-date')?.value || localDateStr();
  const amount = parseFloat(document.getElementById('pay-amount')?.value) || 0;
  const notes  = document.getElementById('pay-notes')?.value?.trim() || '';

  const r = await api('POST', 'payments.php', { invoice_refs, payment_date: date, amount, notes });
  if (!r.success) { toast(r.error || 'Error', 'err'); if(btn)btn.disabled=false; return; }

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
  const n = invoice_refs.length;
  showPortalPage('p-invoices', null);
  toast(`Payment ${payRef} logged for ${n} invoice${n > 1 ? 's' : ''} — invoices updated below`, 'ok');
}

/* ── Override: addTransaction ────────────────────────── */
async function addTransaction(){
  const date = document.getElementById('bk-date')?.value;
  const desc = document.getElementById('bk-desc')?.value?.trim();
  const type = document.getElementById('bk-type')?.value;
  const cat  = document.getElementById('bk-cat')?.value;
  const ref  = document.getElementById('bk-ref')?.value?.trim() || '';
  const calloutRef = document.getElementById('bk-callout-ref')?.value?.trim() || '';
  const amount = parseFloat(document.getElementById('bk-amount')?.value) || 0;
  
  if (!desc || !amount) { toast('Fill in description and amount', 'err'); return; }
  if (!calloutRef) { toast('Call log number required', 'err'); return; }
  
  const r = await api('POST', 'transactions.php', {
    trans_date: date || localDateStr(),
    description: desc,
    category: cat || 'General',
    reference: ref,
    callout_ref: calloutRef,
    credit: type === 'Credit' ? amount : 0,
    debit:  type === 'Debit'  ? amount : 0,
  });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  
  await refreshTransactions();
  renderTransactions('');
  closeModalDirect();
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
    rows = rows.filter(c => {
      if ((c.name||'').toLowerCase().includes(q)) return true;
      if ((c.email||'').toLowerCase().includes(q)) return true;
      return (c.contacts||[]).some(ct =>
        (ct.contact_name||'').toLowerCase().includes(q) ||
        (ct.email||'').toLowerCase().includes(q)
      );
    });
  }
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty-cell">No clients found</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(c => {
    const contacts = c.contacts || [];
    const primary  = contacts.find(ct => +ct.is_primary) || contacts[0];
    const contactCell = primary
      ? `<div class="cc-name">${esc(primary.contact_name)}</div><div class="cc-email">${esc(primary.email)}</div>${contacts.length > 1 ? `<div class="cc-more">+${contacts.length - 1} more</div>` : ''}`
      : (c.email ? `<div class="cc-email">${esc(c.email)}</div>` : '<span class="td-muted">—</span>');
    return `
      <tr>
        <td><strong>${esc(c.name)}</strong></td>
        <td>${contactCell}</td>
        <td>${esc(c.phone)}</td>
        <td>${esc(c.vat_number)}</td>
        <td><span class="badge badge-${c.is_active ? 'ok' : 'grey'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn btn-g btn-xs" data-action="openClientModal" data-id="${c.id}">Edit</button>
          ${c.is_active ? `<button class="btn btn-d btn-xs" data-action="deactivateClient" data-id="${c.id}">Deactivate</button>` : ''}
        </td>
      </tr>`;
  }).join('');
}

function openClientModal(id) {
  const c = id ? (DB.clients || []).find(x => x.id === id) : null;
  openModal(id ? 'Edit Client' : 'Add Client', `
    <input type="hidden" id="cm-id" value="${id || ''}">
    <div class="fgrid">
      <div class="fgroup ffull"><label class="flbl">Client Name <span class="req">*</span></label><input class="finput" id="cm-name" placeholder="Company or client name" value="${esc(c?.name||'')}"></div>
      <div class="fgroup"><label class="flbl">Phone (Main)</label><input class="finput" id="cm-phone" placeholder="+27 11 000 0000" value="${esc(c?.phone||'')}"></div>
      <div class="fgroup"><label class="flbl">VAT Number</label><input class="finput" id="cm-vat" placeholder="4XXXXXXXXX" value="${esc(c?.vat_number||'')}"></div>
      <div class="fgroup ffull"><label class="flbl">Address</label><textarea class="finput" id="cm-address" rows="2" placeholder="Street, suburb, city, postal code">${esc(c?.address||'')}</textarea></div>
      <div class="fgroup ffull"><label class="flbl">Notes</label><textarea class="finput" id="cm-notes" rows="3" placeholder="Internal notes, contract details, billing terms...">${esc(c?.notes||'')}</textarea></div>
    </div>
    <div class="cm-contacts-section">
      <div class="cm-contacts-hdr">
        <span class="flbl">Contacts</span>
        <button type="button" class="btn btn-g btn-xs" data-action="addClientContact">+ Add Contact</button>
      </div>
      <div id="cm-contacts-list"></div>
    </div>
    <div class="mt2 flex-end" style="gap:8px">
      <button class="btn btn-g" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p" data-action="saveClient">Save Client</button>
    </div>
  `);
  modalContacts = c ? (c.contacts || []).map(ct => ({
    contact_name: ct.contact_name || '',
    email:        ct.email || '',
    phone:        ct.phone || '',
    title:        ct.title || '',
    is_primary:   +ct.is_primary || 0,
  })) : [];
  renderModalContacts();
}

function closeClientModal() { closeModalDirect(); }

async function saveClient() {
  const id   = parseInt(document.getElementById('cm-id')?.value) || 0;
  const name = document.getElementById('cm-name')?.value?.trim();
  if (!name) { toast('Client name is required', 'err'); return; }

  const contacts = collectModalContacts();

  const payload = {
    name,
    phone:      document.getElementById('cm-phone')?.value?.trim()   || '',
    vat_number: document.getElementById('cm-vat')?.value?.trim()     || '',
    address:    document.getElementById('cm-address')?.value?.trim() || '',
    notes:      document.getElementById('cm-notes')?.value?.trim()   || '',
    contacts,
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
  if (!await confirmDialog('Deactivate this client?\n\nThey will be removed from dropdowns. All historical records are preserved.', { title: 'Deactivate Client', confirmLabel: 'Deactivate' })) return;
  const r = await api('DELETE', `clients.php?id=${id}`);
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  await refreshClients();
  renderClients('');
  toast('Client deactivated');
}

/* ── Client Contact Management ─────────────────────── */
function addClientContact() {
  modalContacts.push({ contact_name: '', email: '', phone: '', title: '', is_primary: modalContacts.length === 0 ? 1 : 0 });
  renderModalContacts();
}

function removeClientContact(idx) {
  modalContacts.splice(idx, 1);
  if (modalContacts.length > 0 && !modalContacts.some(c => c.is_primary)) {
    modalContacts[0].is_primary = 1;
  }
  renderModalContacts();
}

function renderModalContacts() {
  const list = document.getElementById('cm-contacts-list');
  if (!list) return;
  if (!modalContacts.length) {
    list.innerHTML = '<p class="cm-no-contacts">No contacts yet — click <em>+ Add Contact</em> to add one.</p>';
    return;
  }
  list.innerHTML = modalContacts.map((ct, i) => `
    <div class="cm-contact-row">
      <input class="finput cm-ct-field" placeholder="Name" value="${esc(ct.contact_name)}" data-ci="${i}" data-field="contact_name">
      <input class="finput cm-ct-field" type="email" placeholder="Email" value="${esc(ct.email)}" data-ci="${i}" data-field="email">
      <input class="finput cm-ct-field" placeholder="Phone" value="${esc(ct.phone)}" data-ci="${i}" data-field="phone">
      <input class="finput cm-ct-field" placeholder="Title / Role" value="${esc(ct.title)}" data-ci="${i}" data-field="title">
      <label class="cm-primary-lbl" title="Set as primary contact">
        <input type="radio" name="cm-primary" ${ct.is_primary ? 'checked' : ''} data-ci="${i}"> Primary
      </label>
      <button class="btn btn-d btn-xs" data-action="removeClientContact" data-idx="${i}" title="Remove contact">&times;</button>
    </div>
  `).join('');

  // Sync radio changes back to modalContacts
  list.querySelectorAll('input[name="cm-primary"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const ci = +radio.dataset.ci;
      modalContacts.forEach((c, i) => { c.is_primary = i === ci ? 1 : 0; });
    });
  });
}

function collectModalContacts() {
  const rows = document.querySelectorAll('#cm-contacts-list .cm-contact-row');
  const checkedRadio = document.querySelector('#cm-contacts-list input[name="cm-primary"]:checked');
  const primaryIdx   = checkedRadio ? +checkedRadio.dataset.ci : -1;
  const result = [];
  rows.forEach((row, i) => {
    const name  = row.querySelector('[data-field="contact_name"]')?.value?.trim() || '';
    const email = row.querySelector('[data-field="email"]')?.value?.trim() || '';
    const phone = row.querySelector('[data-field="phone"]')?.value?.trim() || '';
    const title = row.querySelector('[data-field="title"]')?.value?.trim() || '';
    if (!name && !email) return;
    result.push({ contact_name: name, email, phone, title, is_primary: i === primaryIdx ? 1 : 0 });
  });
  return result;
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
      no: item.no, result: null, appointee_id: null, comments: '', uploads: [],
    }));
  });
  return {
    id, contractor:'', contractorRep:'', contractorRepId: null, appointee162:'', appointee162Id: null,
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
      const apoId = s.appointee_id ? parseInt(s.appointee_id) : null;
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
        ${sec.key==='H'?`<td><select class="finput finput-sm" data-action="safAppointeeChanged" data-section-key="${sec.key}" data-item-idx="${idx}">${_safUserOpts(apoId)}</select></td>`:''}
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
      mem.sections[sec.key] = sec.items.map(item=>({no:item.no, result:null, appointee_id:null, comments:'', uploads:[]}));
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
  file.sections[sec][idx].appointee_id = parseInt(inp.value)||null;
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
    no:           item.no,
    result:       item.result||null,
    appointee_id: item.appointee_id||null,
    comments:     item.comments||'',
    ap_status:    item.apStatus||item.ap_status||'Open',
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
  const warnClass= needsEvidence ? ' btn-evidence-warn' : '';
  const title    = needsEvidence ? 'To Standard — attach supporting evidence'
                 : upCount > 0   ? `${upCount} evidence file(s) — click to upload more`
                 :                 'Attach evidence document';
  const lbl      = upCount > 0   ? `<span class="saf-up-count">${upCount}</span>+`
                 : needsEvidence  ? '&#9888;+'
                 :                  '+';
  const viewBtn  = upCount > 0
    ? `<button class="btn btn-g btn-xs" data-action="safShowItemDocs" data-ev-sec="${sec}" data-ev-idx="${idx}" title="View evidence files">&#128065;</button>`
    : '';
  return `<input type="file" id="${inputId}" class="hidden" data-action="safHandleUpload" data-section-key="${sec}" data-item-idx="${idx}">${viewBtn}<button class="btn btn-g btn-xs${warnClass}" data-action="triggerFileInput" data-target-id="${inputId}" title="${title}">${lbl}</button>`;
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
    <div class="upload-item-row">
      <span>${fileIcon(u.mime_type)}</span>
      <span class="upload-item-name" title="${esc(u.original_name)}">${esc(u.original_name)}</span>
      <span class="upload-item-size">${fmtSz(u.file_size)}</span>
      ${(u.mime_type==='application/pdf'||(u.mime_type||'').startsWith('image/'))?`<button class="btn btn-g btn-xs" data-action="openDocViewer" data-id="${u.id}" data-name="${esc(u.original_name)}" data-mime="${esc(u.mime_type||'')}">&#128065; View</button>`:''}
      <a class="btn btn-g btn-xs" href="api/files.php?action=download&id=${u.id}" download="${esc(u.original_name)}">&#8595;</a>
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'saf-item-docs-popup';
  overlay.className = 'saf-rename-overlay';
  overlay.innerHTML = `
    <div class="saf-rename-box saf-rename-box--docs">
      <div class="saf-rename-title">Evidence — Section ${sec}, Item ${idx+1} (${uploads.length} file${uploads.length!==1?'s':''})</div>
      <div class="upload-list-body">${rows}</div>
      <div class="modal-actions-row">
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
  file.contractor=g('sah-contractor');
  const repId = parseInt(document.getElementById('sah-rep')?.value) || null;
  file.contractorRepId = repId;
  file.contractorRep = (proxyDB.users||[]).find(u=>u.id===repId)?.name || '';
  const apptId = parseInt(document.getElementById('sah-appointee')?.value) || null;
  file.appointee162Id = apptId;
  file.appointee162 = (proxyDB.users||[]).find(u=>u.id===apptId)?.name || '';
  file.auditDate=g('sah-date');
  file.region=g('sah-region'); file.auditTeam=g('sah-team');
  file.scopeOfWork=g('sah-scope'); file.manpower=n('sah-manpower');
  file.supervisors=n('sah-supervisors'); file.sheReps=n('sah-shereps');
  file.firstAiders=n('sah-firstaiders'); file.auditorName=g('sah-auditor-name');
  file.signOffDate=g('sah-signoff-date');
}

function _safUserOpts(selectedId) {
  const blank = '<option value="">— Select —</option>';
  const opts = (proxyDB.users||[]).filter(u=>u.active!=0)
    .sort((a,b)=>(a.name||'').localeCompare(b.name||''))
    .map(u=>`<option value="${u.id}"${u.id===selectedId?' selected':''}>${esc(u.name)} — ${esc(u.title||u.role||'')}</option>`)
    .join('');
  return blank + opts;
}

function safFillHeader(file){
  const s=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
  s('sah-contractor',file.contractor);
  const repEl=document.getElementById('sah-rep');
  if(repEl) repEl.innerHTML=_safUserOpts(file.contractorRepId);
  const apptEl=document.getElementById('sah-appointee');
  if(apptEl) apptEl.innerHTML=_safUserOpts(file.appointee162Id);
  s('sah-date',file.auditDate);
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
  const fields=['sah-contractor','sah-region','sah-team','sah-scope','sah-auditor-name'];
  fields.forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const repEl=document.getElementById('sah-rep');
  if(repEl) repEl.innerHTML=_safUserOpts(null);
  const apptEl=document.getElementById('sah-appointee');
  if(apptEl) apptEl.innerHTML=_safUserOpts(null);
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
    contractor:        file.contractor,
    contractor_rep_id: file.contractorRepId  || null,
    appointee162_id:   file.appointee162Id   || null,
    audit_date:        file.auditDate,
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
      no:           item.no,
      result:       item.result||null,
      appointee_id: item.appointee_id||null,
      comments:     item.comments||'',
      ap_status:    item.apStatus||item.ap_status||'Open',
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

function renderSafetyComplianceSummary(allFiles){
  const summaryEl=document.getElementById('safety-compliance-summary');
  const regionEl=document.getElementById('safety-region-blocks');
  if(!summaryEl&&!regionEl) return;

  const files=Array.isArray(allFiles)?allFiles:[];
  const scored=files.map(f=>({file:f, score:_safScore(f).score})).filter(x=>x.score!==null);
  const avg=scored.length ? Math.round(scored.reduce((sum,x)=>sum+x.score,0)/scored.length) : null;
  const approved=files.filter(f=>f.status==='Approved').length;
  const submitted=files.filter(f=>f.status==='Submitted').length;
  const atRisk=scored.filter(x=>x.score<75).length;
  const openActions=files.reduce((sum,f)=>sum+(_safScore(f).notStd||0),0);
  const avgBand=safBand(avg);

  if(summaryEl){
    summaryEl.innerHTML=`
      <div class="saf-summary-card saf-summary-card--score">
        <div class="klbl">Compliance Score</div>
        <div class="saf-summary-value ${avgBand.cls}">${avg!==null?avg+' pts':'--'}</div>
        <div class="ksub">${avgBand.label}</div>
      </div>
      <div class="saf-summary-card">
        <div class="klbl">Approved Files</div>
        <div class="saf-summary-value">${approved}</div>
        <div class="ksub">${files.length} active safety files</div>
      </div>
      <div class="saf-summary-card">
        <div class="klbl">Under Review</div>
        <div class="saf-summary-value">${submitted}</div>
        <div class="ksub">Submitted for approval</div>
      </div>
      <div class="saf-summary-card ${atRisk?'saf-summary-card--risk':''}">
        <div class="klbl">Risk Signals</div>
        <div class="saf-summary-value">${atRisk}</div>
        <div class="ksub">${openActions} open non-standard items</div>
      </div>
    `;
  }

  if(regionEl){
    const regions={};
    files.forEach(f=>{
      const key=(f.region||'Unassigned').trim()||'Unassigned';
      if(!regions[key]) regions[key]={total:0, approved:0, submitted:0, risk:0, scoreTotal:0, scoreCount:0};
      const r=regions[key];
      const score=_safScore(f).score;
      r.total += 1;
      if(f.status==='Approved') r.approved += 1;
      if(f.status==='Submitted') r.submitted += 1;
      if(score!==null){ r.scoreTotal += score; r.scoreCount += 1; if(score<75) r.risk += 1; }
    });
    const cards=Object.entries(regions).sort((a,b)=>b[1].total-a[1].total).slice(0,4).map(([region,r])=>{
      const score=r.scoreCount?Math.round(r.scoreTotal/r.scoreCount):null;
      const band=safBand(score);
      return `<div class="saf-region-card">
        <div class="saf-region-head"><span>${esc(region)}</span><strong class="${band.cls}">${score!==null?score+' pts':'--'}</strong></div>
        <div class="saf-region-meta">${r.total} files &middot; ${r.approved} approved &middot; ${r.submitted} review</div>
        <div class="saf-region-bar"><span style="width:${r.total?Math.round((r.approved/r.total)*100):0}%"></span></div>
        <div class="saf-region-risk">${r.risk ? r.risk+' low-score files need attention' : 'No low-score files flagged'}</div>
      </div>`;
    }).join('');
    regionEl.innerHTML=cards || '<div class="saf-region-card saf-region-card--empty">No regional safety files loaded.</div>';
  }
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

  renderSafetyComplianceSummary(proxyDB.safetyFiles);

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
        ${sec.key==='H'?`<td>${esc((proxyDB.users||[]).find(u=>u.id===(sv.appointee_id?parseInt(sv.appointee_id):null))?.name||'')}</td>`:''}
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
          <button class="btn btn-g btn-s" data-action="safLinkPortalUser" data-id="${id}">+ Add Person</button>
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
  const initialState = {};
  let origPass = 0, origApplicable = 0;

  const mapApStatus = v => v === 'Resolved' ? 'done' : v === 'In Progress' ? 'wip' : 'open';

  SAFETY_SECTIONS.filter(s => !s.bonus).forEach(sec => {
    const saved = file.sections[sec.key] || [];
    const failItems = [];
    sec.items.forEach((item, idx) => {
      const sv = saved[idx] || {};
      initialState[sec.key + item.no] = { status: mapApStatus(sv.ap_status || sv.apStatus) };
      if (sv.result === 'N/A') return;
      origApplicable++;
      if (sv.result === 'To Standard') { origPass++; return; }
      if (sv.result === 'Not to Standard') {
        failItems.push({
          id:       sec.key + item.no,
          ref:      item.ref || '—',
          criteria: item.criteria,
          comment:  sv.comments || 'Not to Standard — action required',
          status:   mapApStatus(sv.ap_status || sv.apStatus),
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
    initialState,
  });

  const genIssues = _validateTrackerHTML(html);
  if (genIssues.length) {
    console.error('Tracker generation failed validation:', genIssues);
    toast('Tracker could not be generated — ' + genIssues[0], 'err');
    return;
  }

  const fname   = id + '_Action_Tracker.html';
  _trackerHtml = html;
  _trackerFileName = fname;

  openModal('Action Plan Tracker — ' + id, `
    <div class="att-ctx mb-16 fs-11">
      <strong>${esc(file.contractor || id)}</strong> — ${sections.reduce((t,s)=>t+s.items.length,0)} non-conformance${sections.reduce((t,s)=>t+s.items.length,0)===1?'':'s'} across ${sections.length} section${sections.length===1?'':'s'}
    </div>
    <div class="flex-row gap-10 flex-wrap">
      <button class="btn btn-p" data-action="openBlobPreview">&#128065; Preview in Browser</button>
      <button class="btn btn-g" type="button" data-action="revokeBlobOnDownload">&#8595; Download</button>
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
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23C94A10' d='M8 0 5 6H0l4 4-2 6 6-3 6 3-2-6 4-4H11z'/%3E%3C/svg%3E">
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
.tbl-wrap{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--border);border-top:none;border-radius:0 0 6px 6px;margin-bottom:6px;box-shadow:0 1px 4px rgba(0,0,0,.05)}
table{border-collapse:collapse;width:max-content;min-width:100%;table-layout:auto}
thead th{background:var(--surface2);color:var(--text2);padding:8px 14px;text-align:left;border-right:1px solid var(--border);border-bottom:1px solid var(--border);white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;user-select:none;position:relative}
thead th::after{content:'⇅';display:inline-block;margin-left:5px;opacity:.2;font-size:9px;vertical-align:middle}
thead th[data-sort="asc"]::after{content:'↑';opacity:.85;color:var(--accent)}
thead th[data-sort="desc"]::after{content:'↓';opacity:.85;color:var(--accent)}
thead th[data-sort="asc"],thead th[data-sort="desc"]{color:var(--accent)}
thead th[data-nosort]{cursor:default}
thead th[data-nosort]::after{display:none}
tbody td{padding:8px 14px;border-right:1px solid var(--surface3);border-bottom:1px solid var(--surface3);vertical-align:top;color:var(--text2);font-size:12px;white-space:nowrap}
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
const INITIAL_STATE = ${JSON.stringify(o.initialState || {})};
const TOTAL_APPLICABLE = ${totalApplicable};
const ORIG_PASS = ${origPass};
const ORIG_APPLICABLE = ${origApplicable};
const BASELINE = ${baselineScore};
const KEY = '${storageKey}';

function loadState(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); } catch{ return {}; } }
function saveState(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
let state = { ...INITIAL_STATE, ...loadState() };
saveState(state);
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
  if(!confirm('Reset all statuses and notes?\\n\\nThis clears all progress on this action plan.')) return;
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
document.getElementById('filterSection').value = '';
document.getElementById('filterStatus').value = '';
applyFilters();
</script>
</body>
</html>`;
}

function _validateTrackerHTML(html) {
  const issues = [];
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) { issues.push('No <script> block found in generated output'); return issues; }
  const script = m[1];

  // Keep browser validation CSP-safe by rejecting eval-like constructs without executing generated code
  if (/\b(?:eval|Function)\s*\(/.test(script)) {
    issues.push('Standalone tracker script must not use eval/Function constructor');
  }

  // Portal-only functions must not leak into the standalone file
  ['confirmDialog'].forEach(fn => {
    const called  = new RegExp('\\b' + fn + '\\s*\\(').test(script);
    const defined = new RegExp('function\\s+' + fn + '\\s*\\(').test(script);
    if (called && !defined) issues.push("'" + fn + "' is called but not defined in the standalone file");
  });

  // Required functions
  ['render','resetAll','submitFile','updateScore','applyFilters','renderSubmission'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(script))
      issues.push('Missing function: ' + fn);
  });

  // Required constants
  ['SECTIONS','TOTAL_APPLICABLE','ORIG_PASS','ORIG_APPLICABLE','BASELINE','KEY'].forEach(c => {
    if (!script.includes('const ' + c + ' ')) issues.push('Missing constant: ' + c);
  });

  // SECTIONS must have at least one item
  try {
    const secMatch = script.match(/const SECTIONS = (\[[\s\S]*?\]);/);
    if (secMatch) {
      const secs = JSON.parse(secMatch[1]);
      const total = secs.reduce((n, s) => n + (s.items ? s.items.length : 0), 0);
      if (total === 0) issues.push('SECTIONS contains no items');
    }
  } catch { issues.push('SECTIONS is not valid JSON'); }

  return issues;
}

function openTrackerPreview() {
  if (!_trackerHtml) { toast('Tracker not ready', 'err'); return; }
  const blob = new Blob([_trackerHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener');
  if (!w) {
    URL.revokeObjectURL(url);
    toast('Popup blocked', 'err');
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function downloadTrackerFile() {
  if (!_trackerHtml || !_trackerFileName) { toast('Tracker not ready', 'err'); return; }
  const blob = new Blob([_trackerHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = _trackerFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
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
        <td class="${rc}">${e(sv.result||'—')}</td>${sec.key==='H'?`<td>${e((proxyDB.users||[]).find(u=>u.id===(sv.appointee_id?parseInt(sv.appointee_id):null))?.name||'')}</td>`:''}
        <td class="comment">${e(sv.comments||'')}</td></tr>`;
    });
    checkHtml+='</tbody></table></div>';
  });

  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23C94A10' d='M8 0 5 6H0l4 4-2 6 6-3 6 3-2-6 4-4H11z'/%3E%3C/svg%3E">
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
.saf-green{color:#22c55e}.saf-yellow{color:#eab308}.saf-orange{color:#f97316}.saf-red{color:#ef4444}.saf-unscored{color:#64748b}
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
  if(!await confirmDialog(`Approve safety file ${id} for ${file.contractor||'this contractor'}?\n\nThis will change the status to Approved.`, { title: 'Approve Safety File', confirmLabel: 'Approve', danger: false })) return;
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
  (st==='Submitted'||st==='In Progress')?$show(btn,'inline-flex'):$hide(btn);
}

function _safUpdateDeactivateBtn(fileId){
  const btn=document.getElementById('saf-deactivate-btn');
  if(!btn) return;
  const canDel=can('security.users')||can('safety.delete');
  canDel&&fileId?$show(btn,'inline-flex'):$hide(btn);
}

async function deactivateSafetyFile(){
  const id=document.getElementById('saf-detail-content')?.dataset?.fileId;
  const file=id?proxyDB.safetyFiles.find(f=>f.id===id):null;
  if(!file){toast('No file open','err');return;}
  if(!await confirmDialog('Deactivate safety file '+id+' for '+esc(file.contractor||'this contractor')+'?\n\nThe record will be hidden from the list but retained for audit purposes. Contact an administrator to restore it if needed.', { title: 'Deactivate Safety File', confirmLabel: 'Deactivate' })) return;
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
  if(!await confirmDialog('Remove this document from the safety file?\n\nThis action cannot be undone.', { title: 'Remove Document', confirmLabel: 'Remove' })) return;
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
    const displayName  = esc(p.user_name  || p.full_name);
    const displayEmail = p.user_email || p.email || '';
    const actionBtns = `<button class="btn btn-g btn-xs" data-action="safPersonnelSendPolicy" data-id="${p.id}" title="Send policy">&#9993;</button>
         <button class="btn btn-g btn-xs" data-action="safRemovePerson" data-id="${p.id}" data-file-id="${esc(fileId)}" data-name="${esc(p.user_name||p.full_name)}">Remove</button>`;
    return `<tr>
    <td>${displayName}</td>
    <td>—</td>
    <td>${esc(p.user_title||'—')}</td>
    <td>${esc(p.company||'—')}</td>
    <td>${displayEmail?`<a href="mailto:${esc(displayEmail)}" class="text-accent">${esc(displayEmail)}</a>`:'<span class="text-muted">—</span>'}</td>
    <td>${actionBtns}</td>
  </tr>`;
  }).join('');

  let formerHtml='';
  if(gone.length){
    const rows=gone.map(p=>`<tr class="saf-prs-inactive-row">
      <td>${esc(p.user_name||p.full_name)}</td>
      <td>${esc(p.id_number||'—')}</td>
      <td>${esc(p.role)}</td>
      <td>${esc(p.company||'—')}</td>
      <td>${p.removed_at?fmtD(p.removed_at):'—'}</td>
      <td>${esc(p.removed_reason||'—')}</td>
      <td class="text-muted fs-12">${esc(p.removed_by_name||p.removed_by||'—')}</td>
      <td><button class="btn btn-g btn-xs" data-action="safReinstatePerson" data-id="${p.id}" data-file-id="${esc(fileId)}">Reinstate</button></td>
    </tr>`).join('');
    formerHtml=`<details class="saf-former-toggle mt1">
      <summary>Former Personnel (${gone.length}) — retained for audit</summary>
      <div class="tw mt1"><table class="saf-prs-tbl">
        <thead><tr><th>Name</th><th>ID/Passport</th><th>Role</th><th>Company</th><th>Removed</th><th>Reason</th><th>Removed By</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </details>`;
  }

  panel.innerHTML=active.length?`
    <div class="tw"><table class="saf-prs-tbl">
      <thead><tr><th>Name</th><th>ID / Passport</th><th>Role</th><th>Company</th><th>Email</th><th></th></tr></thead>
      <tbody>${activeRows}</tbody>
    </table></div>${formerHtml}`
    :`<div class="saf-att-empty">No active people on file.${gone.length?' See former personnel below.':''}</div>${formerHtml}`;
  _safPersonnelCache = people;
  _safLinkedUsersCache = active.filter(p => p.user_id).map(p => ({ user_id: p.user_id, name: p.user_name || p.full_name, role: p.role, title: p.role }));
  safUpdateComplianceHealth();
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
  const linkedIds = new Set((_safPersonnelCache || []).filter(p => p.user_id && p.is_active == 1).map(p => p.user_id));
  const available = allUsers.filter(u => u.active != 0 && !linkedIds.has(u.id));
  if (!available.length) { toast('All portal users are already on this file', 'info'); return; }
  const opts = available.map(u => `<option value="${u.id}">${esc(u.name)} — ${esc(u.title||u.role||'—')}</option>`).join('');
  openModal('Add Person to Safety File', `
    <p class="mb-10 text-muted fs-sm">
      Only portal users can be added to a safety file. Their name and email are drawn from their portal profile.
    </p>
    <div class="fgroup ffull">
      <label class="flbl">Select User <span class="text-ember">*</span></label>
      <select class="finput" id="link-user-sel">
        <option value="">— Select —</option>
        ${opts}
      </select>
    </div>
    <div class="mt2 flex-end">
      <button class="btn btn-g btn-s mr-8" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p" data-action="safConfirmLinkUser" data-id="${fileId}">Add to File</button>
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
  if (!await confirmDialog(`Unlink ${name} from this safety file?\n\nTheir personnel record will be marked inactive.`, { title: 'Unlink Personnel', confirmLabel: 'Unlink' })) return;
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
  const prsOpts=active.map(p=>`<option value="${p.id}">${esc(p.user_name||'—')}</option>`).join('');
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
        <select class="finput" id="cmp-person-sel">
          <option value="">— Company-level / leave blank —</option>
          ${prsOpts}
        </select>
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
  const notes     =(document.getElementById('cmp-notes')?.value||'').trim();
  if(!issueDate){toast('Issue date is required','err');return;}
  const personId=parseInt(document.getElementById('cmp-person-sel')?.value||'0')||null;
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
  if(!await confirmDialog('Remove the existing document and attach a new one?\n\nThe current file will be permanently deleted.', { title: 'Replace Document', confirmLabel: 'Replace' })) return;
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
  if(!await confirmDialog('Delete this compliance record?\n\nThis action cannot be undone.', { title: 'Delete Record', confirmLabel: 'Delete' })) return;
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
  safAddPolicyAck(fileId,{userId: person.user_id});
}

function safPakEmailPreview(sel){
  const uid=parseInt(sel.value||'0');
  const u=(proxyDB.users||[]).find(x=>x.id===uid);
  const email=u?.email||'';
  const row=document.getElementById('pak-email-row');
  const show=document.getElementById('pak-email-show');
  if(row){ email?$show(row):$hide(row); }
  if(show) show.textContent=email||'—';
}

function safAddPolicyAck(fileId, prefill={}){
  const allUsers=(proxyDB.users||[]).filter(u=>u.active!=0);
  if(!allUsers.length){
    toast('No portal users available.','warn');
    return;
  }
  const opts=allUsers.map(u=>`<option value="${u.id}">${esc(u.name)} — ${esc(u.title||u.role||'—')}</option>`).join('');
  const COMMON_POLICIES=[
    'Health & Safety Policy','PPE Policy & Procedure','Emergency Evacuation Procedure',
    'Incident & Near-Miss Reporting Procedure','Contractor Site Rules & Induction',
    'Working at Heights Procedure','Hazardous Chemical Handling Procedure',
    'Toolbox Talk — General Site Safety',
  ];
  const polOpts=COMMON_POLICIES.map(p=>`<option value="${esc(p)}">`).join('');
  openModal('Send Policy for Acknowledgment',`
    <div class="fgrid">
      <div class="fgroup ffull"><label class="flbl">Policy / Procedure Title <span class="text-ember">*</span></label>
        <input class="finput" id="pak-title" list="pak-title-dl" placeholder="Select or type policy name" autocomplete="off" autofocus>
        <datalist id="pak-title-dl">${polOpts}</datalist></div>
      <div class="fgroup ffull"><label class="flbl">Policy Content / Summary (optional — shown to recipient)</label>
        <textarea class="finput" id="pak-body" rows="4" placeholder="Paste key points or summary of the policy..."></textarea></div>
      <div class="fgroup ffull"><label class="flbl">Select Recipient <span class="text-ember">*</span></label>
        <select class="finput" id="pak-user-sel">
          <option value="">— Select portal user —</option>
          ${opts}
        </select></div>
      <div class="fgroup ffull d-none" id="pak-email-row"><label class="flbl">Email</label>
        <div class="finput finput-readonly" id="pak-email-show">—</div></div>
    </div>
    <div class="mt2 flex-end">
      <button class="btn btn-g btn-s mr-8" data-action="closeModalDirect">Cancel</button>
      <button class="btn btn-p" data-action="safSavePolicyAck" data-id="${fileId}">Create &amp; Send</button>
    </div>
  `);
  const sel=document.getElementById('pak-user-sel');
  if(sel){
    sel.addEventListener('change',()=>safPakEmailPreview(sel));
    if(prefill.userId){ sel.value=prefill.userId; safPakEmailPreview(sel); }
  }
}

async function safSavePolicyAck(fileId){
  const title=(document.getElementById('pak-title')?.value||'').trim();
  const body =(document.getElementById('pak-body')?.value||'').trim();
  const uid  =parseInt(document.getElementById('pak-user-sel')?.value||'0');
  if(!title){toast('Policy title is required','err');return;}
  if(!uid)  {toast('Please select a recipient','err');return;}
  const r=await api('POST','safety_policy.php',{file_ref:fileId,policy_title:title,policy_body:body,recipient_id:uid});
  if(!r.success){toast(r.error||'Failed','err');return;}
  toast('Acknowledgment request created','ok');
  closeModalDirect();
  const acks=await safLoadPolicyAcks(fileId);
  safRenderPolicyAcks(fileId,acks);
}

async function safManualAck(id,fileId){
  if(!await confirmDialog('Mark this policy as acknowledged (in-person sign-off)?\n\nThis records the acknowledgment with the current date and time.', { title: 'Manual Acknowledgment', confirmLabel: 'Confirm Acknowledgment', danger: false })) return;
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
  if(!await confirmDialog('Remove this policy acknowledgment record?\n\nThis action cannot be undone.', { title: 'Remove Acknowledgment', confirmLabel: 'Remove' })) return;
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

/* ═══════════════════════════════════════════════════════
   V3 PUB-SITE — IZILO-W-001 · THERMAL GEOMETRY, CINEMATIC
   Runs once on DOMContentLoaded; guards against re-init.
═══════════════════════════════════════════════════════ */
(function v3PubSite(){
  'use strict';
  if(window.__v3PubInit) return;
  window.__v3PubInit = true;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;}

  /* ── Ignition preloader ── */
  var ign = document.getElementById('ignition');
  if(ign){
    if(reduce || sessionStorage.getItem('bf_ign')){
      ign.classList.add('done');
    } else {
      var pct=0, pctEl=document.getElementById('ignPct'), tri=document.getElementById('ignTri');
      var t=setInterval(function(){
        pct = Math.min(100, pct + Math.ceil(Math.random()*16));
        if(pctEl) pctEl.textContent = pct+'%';
        if(tri) _injectStyle('ignition-fill-css', '#ignTri{--fill:'+pct+'%}');
        if(pct>=100){
          clearInterval(t);
          sessionStorage.setItem('bf_ign','1');
          setTimeout(function(){ign.classList.add('done');}, 180);
        }
      }, 90);
    }
  }

  /* ── Sticky pub-nav ── */
  var pnav = document.getElementById('pub-nav');
  function onV3Scroll(){if(pnav) pnav.classList.toggle('v3-solid', window.scrollY > 64);}
  window.addEventListener('scroll', onV3Scroll, {passive:true});
  onV3Scroll();

  /* ── V3 mobile hamburger ── */
  var ham = document.getElementById('v3ham');
  var navLinks = document.getElementById('navLinks');
  if(ham && navLinks){
    ham.addEventListener('click', function(){
      var open = navLinks.classList.toggle('v3-open');
      ham.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function(e){
      if(e.target.tagName === 'A'){
        navLinks.classList.remove('v3-open');
        ham.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Scroll reveals ── */
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('in'); io.unobserve(e.target);}
      });
    }, {threshold:0.15});
    document.querySelectorAll('#pub-home .rv').forEach(function(el, i){
      el.classList.add('rv-delay-'+(reduce ? 0 : i%6));
      io.observe(el);
    });
  } else {
    document.querySelectorAll('#pub-home .rv').forEach(function(el){el.classList.add('in');});
  }

  /* ── Count-up stats ── */
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el=e.target, end=parseInt(el.getAttribute('data-count'),10);
        if(reduce){el.textContent=end;return;}
        var t0=null;
        requestAnimationFrame(function step(ts){
          if(!t0) t0=ts;
          var p = Math.min(1,(ts-t0)/1400);
          el.textContent = Math.round(end*(1-Math.pow(1-p,3)));
          if(p<1) requestAnimationFrame(step);
        });
      });
    }, {threshold:0.4});
    document.querySelectorAll('#pub-home [data-count]').forEach(function(el){cio.observe(el);});
  }

  /* ── Assessment wizard ── */
  var STEPS = ['CONTACT','SITE','REQUIREMENTS','REVIEW'];
  var cur=1;
  var wizForm = document.getElementById('wizard');
  if(wizForm){
    var nEl=document.getElementById('wizN'), lblEl=document.getElementById('wizLbl');
    var wizBack=document.getElementById('wizBack'), wizNext=document.getElementById('wizNext');
    var wizErr=document.getElementById('wizErr'), wizNavRow=document.getElementById('wizNav');
    var wizSegs = wizForm.querySelectorAll('.wiz-progress span');

    var chipsEl = document.getElementById('needChips');
    if(chipsEl){
      chipsEl.addEventListener('click', function(e){
        var b = e.target.closest('.chip');
        if(!b) return;
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed')==='true' ? 'false' : 'true');
      });
    }

    function wval(id){var el=document.getElementById(id);return el ? el.value.trim() : '';}
    function wneeds(){
      return Array.prototype.filter.call(
        document.querySelectorAll('#needChips .chip'),
        function(c){return c.getAttribute('aria-pressed')==='true';}
      ).map(function(c){return c.textContent;});
    }

    function wvalidate(step){
      if(step===1){
        if(!wval('w-name')) return 'Please enter your full name.';
        if(!wval('w-phone')) return 'Please enter a phone number.';
        var em=wval('w-email');
        if(!em||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return 'Please enter a valid email address.';
      }
      if(step===2){
        if(!wval('w-type')) return 'Please select a site type.';
        if(!wval('w-prov')) return 'Please select a province.';
        if(!wval('w-area')) return 'Please tell us the town or area.';
      }
      if(step===3 && wneeds().length===0) return 'Select at least one requirement.';
      if(step===4 && !document.getElementById('w-consent').checked) return 'Please confirm POPIA consent to submit.';
      return '';
    }

    function wreview(){
      var dl=document.getElementById('wizReview');
      if(!dl) return;
      var rows=[
        ['Contact', esc(wval('w-name'))+(wval('w-company')?' · '+esc(wval('w-company')):'')],
        ['Reach you on', esc(wval('w-phone'))+' · '+esc(wval('w-email'))],
        ['Site', esc(wval('w-type'))+' — '+esc(wval('w-area'))+', '+esc(wval('w-prov'))],
        ['Requirements', wneeds().map(esc).join(' · ')||'—'],
        ['Notes', esc(wval('w-msg'))||'—']
      ];
      dl.innerHTML = rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>';}).join('');
    }

    function wshow(step){
      wizForm.querySelectorAll('.wiz-step').forEach(function(s){
        s.classList.toggle('on', +s.getAttribute('data-step')===step);
      });
      wizSegs.forEach(function(s,i){s.classList.toggle('on', i<step);});
      if(step<=4){nEl.textContent='0'+step; lblEl.textContent=STEPS[step-1];}
      wizBack.disabled = step===1;
      wizNext.textContent = step===4 ? 'Submit Request' : 'Next';
      if(wizNavRow) step===5 ? $hide(wizNavRow) : $show(wizNavRow,'flex');
      var counter=wizForm.querySelector('.wiz-counter');
      var progress=wizForm.querySelector('.wiz-progress');
      if(counter) step===5 ? $hide(counter) : $show(counter,'block');
      if(progress) step===5 ? $hide(progress) : $show(progress,'flex');
      if(wizErr) wizErr.textContent = '';
    }

    if(wizNext){
      wizNext.addEventListener('click', function(){
        var msg = wvalidate(cur);
        if(msg){if(wizErr) wizErr.textContent=msg; return;}
        if(cur===3) wreview();
        if(cur===4){cur=5; wshow(5); return;}
        cur++; wshow(cur);
      });
    }
    if(wizBack){
      wizBack.addEventListener('click', function(){if(cur>1){cur--; wshow(cur);}});
    }
  }

  /* ── Testimonials ── */
  var T=[
    {q:'Two break-in attempts in the year before BlackFire. Zero since. The drone overwatch on our perimeter changed what “patrolled” means — and every incident is logged in the portal before I even ask.',w:'Facilities Manager',p:'Chemical Manufacturing · Kempton Park, Gauteng'},
    {q:'They took over from our previous provider with no coverage gap — equipment audited, codes changed, officers posted, all in one weekend. The handover plan they promised is the handover we got.',w:'Estate Manager',p:'Residential Estate · Midrand, Gauteng'},
    {q:'The monthly report used to be a phone call and a promise. Now it is callout logs, inspection records and safety files I can open myself. That visibility is why we renewed.',w:'Operations Director',p:'Logistics & Warehousing · Johannesburg South'}
  ];
  var ti=0;
  var tQ=document.getElementById('tstQ'), tW=document.getElementById('tstW'),
      tP=document.getElementById('tstP'), tDots=document.getElementById('tstDots');
  if(tQ && tDots){
    function setT(i){
      ti=i;
      tQ.textContent='“'+T[i].q+'”';
      if(tW) tW.textContent=T[i].w;
      if(tP) tP.textContent=T[i].p;
      tDots.querySelectorAll('button').forEach(function(b,bi){
        b.setAttribute('aria-selected', bi===i ? 'true' : 'false');
      });
    }
    T.forEach(function(_,i){
      var b=document.createElement('button');
      b.type='button';
      b.setAttribute('role','tab');
      b.setAttribute('aria-label','Testimonial '+(i+1));
      b.addEventListener('click',function(){setT(i);});
      tDots.appendChild(b);
    });
    setT(0);
    if(!reduce){ setInterval(function(){setT((ti+1)%T.length);}, 7000); }
  }

  /* ── Photo fallback ── */
  document.querySelectorAll('#pub-home .scene-frame img, #pub-home .svc-img img').forEach(function(img){
    function blocked(){
      var f = img.closest('.scene-frame') || img.closest('.svc-img');
      if(!f || f.classList.contains('img-blocked')) return;
      f.classList.add('img-blocked');
    }
    img.addEventListener('error', blocked);
    if(img.complete && img.naturalWidth===0) blocked();
  });

  /* ── Newsletter subscribe (stub — no backend endpoint yet) ── */
  var newsBtn = document.getElementById('newsBtn');
  var newsInput = document.getElementById('newsEmail');
  if(newsBtn && newsInput){
    newsBtn.addEventListener('click', function(){
      var v = newsInput.value.trim();
      if(!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){
        newsInput.focus(); return;
      }
      newsBtn.disabled = true;
      newsInput.value = '';
      newsInput.placeholder = 'You’re on the list — thank you.';
      setTimeout(function(){newsBtn.disabled=false;}, 4000);
    });
  }

  /* ── WhatsApp FAB: show in public state, hide in portal ── */
  var waFab = document.getElementById('wa-fab');
  if(waFab){
    function syncWaFab(){
      document.documentElement.dataset.state === 'public' ? $show(waFab,'flex') : $hide(waFab);
    }
    syncWaFab();
    var stateObs = new MutationObserver(syncWaFab);
    stateObs.observe(document.documentElement, {attributes:true, attributeFilter:['data-state']});
  }

})();
