#!/usr/bin/env node
// Simple test agent for the umlilo-portal app (dev-only).
// Usage: `node scripts/test-agent.js` or `npm run test:agent` from apps/web

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const tests = [
  {
    name: 'GET /api/auth.php?action=captcha',
    method: 'GET',
    path: '/api/auth.php?action=captcha',
    validate: (json) => json && (typeof json.success === 'boolean' || typeof json.question === 'string')
  },
  {
    name: 'POST /api/auth.php (login JSON)',
    method: 'POST',
    path: '/api/auth.php',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test', password: 'test' }),
    validate: (json) => json && (json.user || json.session || json.success)
  },
  {
    name: 'GET /api/files.php?action=list',
    method: 'GET',
    path: '/api/files.php?action=list',
    validate: (json) => json && (Array.isArray(json.attachments) || Array.isArray(json.items) || Array.isArray(json.data))
  }
];

async function ensureFetch() {
  if (typeof fetch === 'undefined') {
    try {
      const mod = await import('node-fetch');
      global.fetch = mod.default || mod;
    } catch (err) {
      console.error('fetch is not available. Please use Node 18+ or install node-fetch.');
      process.exit(2);
    }
  }
}

function fullUrl(path) {
  return new URL(path, BASE).toString();
}

async function run() {
  await ensureFetch();
  let failures = 0;

  for (const t of tests) {
    const url = fullUrl(t.path);
    const opts = { method: t.method, headers: t.headers || {} };
    if (t.body) opts.body = t.body;

    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      console.error(`[FAIL] ${t.name} — network error: ${err.message}`);
      failures++;
      continue;
    }

    const statusOk = res.status >= 200 && res.status < 300;
    let parsed = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try {
        parsed = await res.json();
      } catch (e) {
        console.error(`[FAIL] ${t.name} — invalid JSON (status ${res.status})`);
        failures++;
        continue;
      }
    } else {
      try { parsed = await res.text(); } catch(e) { parsed = null; }
    }

    const ok = t.validate ? t.validate(parsed) : statusOk;
    if (ok && statusOk) {
      console.log(`[PASS] ${t.name} — status ${res.status}`);
    } else {
      console.error(`[FAIL] ${t.name} — status ${res.status} validation failed`, parsed);
      failures++;
    }
  }

  if (failures === 0) {
    console.log('All tests passed.');
    process.exit(0);
  }
  console.error(`${failures} test(s) failed.`);
  process.exit(1);
}

run().catch(err => { console.error('Error running test agent:', err); process.exit(2); });
