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

