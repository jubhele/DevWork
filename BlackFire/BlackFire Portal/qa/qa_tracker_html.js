#!/usr/bin/env node
// qa_tracker_html.js — validates all portal-generated HTML artifacts
// Covers: Action Tracker, Safety File Report, Statement
// Run: node qa_tracker_html.js <file.html> [<file.html> ...]
// Exit 0 = all pass, Exit 1 = one or more failures

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os   = require('os');

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node qa_tracker_html.js <file.html> [<file.html> ...]');
  process.exit(1);
}

function detectType(name) {
  if (/_Action_Tracker\.html$/i.test(name))     return 'tracker';
  if (/_Safety_File_Report\.html$/i.test(name)) return 'report';
  if (/^Statement_.*\.html$/i.test(name))       return 'statement';
  return 'unknown';
}

// ── shared ─────────────────────────────────────────────────────────────────────

function checkStructure(html, issues) {
  if (!html.includes('<!DOCTYPE'))          issues.push('Missing DOCTYPE');
  if (!/<html[\s>]/i.test(html))            issues.push('Missing <html> tag');
  if (!/<\/html>/i.test(html))              issues.push('Missing closing </html>');
  if (!/<\/body>/i.test(html))              issues.push('Missing closing </body>');
  if (!/<meta\s+charset/i.test(html))       issues.push('Missing charset meta tag');
  if (/\$\{[^}]{0,80}\}/.test(html))       issues.push('Stray template placeholder — generator left un-interpolated ${...}');
}

// ── Action Tracker ─────────────────────────────────────────────────────────────

function checkTracker(html, issues) {
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) { issues.push('No <script> block found'); return; }
  const script = m[1];

  const tmp = path.join(os.tmpdir(), `_qa_tracker_${Date.now()}.js`);
  fs.writeFileSync(tmp, script, 'utf8');
  try {
    execSync(`node --check "${tmp}"`, { stdio: 'pipe' });
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().split('\n')[0].trim() : e.message;
    issues.push('SYNTAX: ' + msg);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }

  ['confirmDialog'].forEach(fn => {
    const called  = new RegExp('\\b' + fn + '\\s*\\(').test(script);
    const defined = new RegExp('function\\s+' + fn + '\\s*\\(').test(script);
    if (called && !defined) issues.push(`'${fn}' called but not defined in standalone file`);
  });

  ['render','resetAll','submitFile','updateScore','applyFilters','renderSubmission'].forEach(fn => {
    if (!new RegExp('function\\s+' + fn + '\\s*\\(').test(script))
      issues.push('Missing function: ' + fn);
  });

  ['SECTIONS','TOTAL_APPLICABLE','ORIG_PASS','ORIG_APPLICABLE','BASELINE','KEY'].forEach(c => {
    if (!script.includes('const ' + c + ' ')) issues.push('Missing constant: ' + c);
  });

  try {
    const sm = script.match(/const SECTIONS = (\[[\s\S]*?\]);/);
    if (sm) {
      const secs  = JSON.parse(sm[1]);
      const total = secs.reduce((n, s) => n + (s.items ? s.items.length : 0), 0);
      if (total === 0) issues.push('SECTIONS contains no items');
    }
  } catch { issues.push('SECTIONS is not valid JSON'); }

  ['TOTAL_APPLICABLE','ORIG_PASS','ORIG_APPLICABLE','BASELINE'].forEach(c => {
    const cm = script.match(new RegExp('const ' + c + ' = ([^;]+);'));
    if (cm && isNaN(Number(cm[1].trim()))) issues.push(c + ' is not a number (got: ' + cm[1].trim() + ')');
  });

  const km = script.match(/const KEY = '([^']+)'/);
  if (km && !km[1].startsWith('bf_tracker_'))
    issues.push("KEY '" + km[1] + "' does not follow 'bf_tracker_<id>' pattern");
}

// ── Safety File Report ─────────────────────────────────────────────────────────

const SCORE_CLASSES = ['saf-green','saf-yellow','saf-orange','saf-red','saf-unscored'];

function checkReport(html, issues) {
  if (/<script>/i.test(html)) issues.push('Unexpected <script> block in Safety File Report');

  const pillMatch = /<div class="score-pill\s+(saf-[a-z]+)"/.exec(html);
  if (!pillMatch) {
    issues.push('score-pill element not found');
  } else {
    const cls = pillMatch[1];
    if (!SCORE_CLASSES.includes(cls))
      issues.push("score-pill uses unknown class '" + cls + "' — expected: " + SCORE_CLASSES.join(', '));
    if (!html.includes('.' + cls + '{'))
      issues.push("score-pill class '" + cls + "' is not defined in the embedded CSS");
  }

  if (!html.includes('class="cover"'))     issues.push('Cover section missing');
  if (!html.includes('class="panel"'))     issues.push('Compliance panel missing');
  if (!html.includes('class="sec-block"')) issues.push('Checklist section blocks missing');

  const cm = html.match(/cover-lbl">Contractor<\/span><span class="cover-val">([^<]*)<\/span>/);
  if (cm && cm[1].trim() === '') issues.push('Contractor name is empty in cover block');
}

// ── Statement ──────────────────────────────────────────────────────────────────

function checkStatement(html, issues) {
  if (/<script>([\s\S]*?)<\/script>/.test(html))
    issues.push('Unexpected <script> block in Statement');

  if (!html.includes('<table>'))          issues.push('Invoice table missing');
  if (!html.includes('class="total"'))    issues.push('Total outstanding line missing');

  const titleId = (html.match(/<title>Statement ([^<]+)<\/title>/) || [])[1]?.trim();
  const h1Id    = (html.match(/<h1>Account Statement — ([^<]+)<\/h1>/) || [])[1]?.trim();
  if (titleId && h1Id && titleId !== h1Id)
    issues.push('Title ID (' + titleId + ') does not match h1 ID (' + h1Id + ')');

  if (/\bby\s+<\/p>/.test(html))
    issues.push("'Released by' field is empty — shows as trailing 'by '");
}

// ── Runner ─────────────────────────────────────────────────────────────────────

let anyFail = false;

files.forEach(file => {
  const name = path.basename(file);
  const type = detectType(name);
  const issues = [];

  let html;
  try { html = fs.readFileSync(file, 'utf8'); }
  catch (e) {
    console.log('FAIL  [unknown  ]  ' + name + '\n      • Cannot read file: ' + e.message);
    anyFail = true;
    return;
  }

  checkStructure(html, issues);

  if      (type === 'tracker')   checkTracker(html, issues);
  else if (type === 'report')    checkReport(html, issues);
  else if (type === 'statement') checkStatement(html, issues);
  else issues.push('Unrecognised filename pattern — cannot determine artifact type');

  const label = '[' + type.padEnd(9) + ']';
  if (issues.length === 0) {
    console.log('PASS  ' + label + '  ' + name);
  } else {
    console.log('FAIL  ' + label + '  ' + name);
    issues.forEach(i => console.log('      • ' + i));
    anyFail = true;
  }
});

process.exit(anyFail ? 1 : 0);
