<?php
ob_start(); // Buffer output so headers can be sent from API calls
/**
 * BlackFire Solutions Portal - Main Portal PHP
 * This file outputs the full portal HTML, with the JS data layer
 * replaced by API calls to the PHP/MySQL backend.
 */
$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
$base = rtrim($cfg['base_url'] ?? '', '/');
?>
<!DOCTYPE html>
<html lang="en" data-theme="light" data-state="public">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none';">
<title>BlackFire Solutions - Fire, taught to behave.</title>
<link rel="icon" href="./favicon.ico?v=20260518-2" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png?v=20260518-2">
<link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png?v=20260518-2">
<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v=20260518-2">
<link rel="shortcut icon" href="./favicon.ico?v=20260518-2">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;900&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="portal.css">
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     ■ PUBLIC SITE
═══════════════════════════════════════════════════════ -->
<!-- Public Nav — always visible across all states -->
<nav id="pub-nav">
  <div class="pub-brand" onclick="pubNav('home')">
    <img src="./blackfire_logo_transparent.png" class="bf-logo-dark"><img src="./blackfire_logo_transparent.png" class="bf-logo-light">
  </div>
  <div class="pub-nav-links">
    <div class="pub-nav-link active" id="pnl-home" onclick="pubNav('home')">Home</div>
    <div class="pub-nav-link" id="pnl-services" onclick="pubNav('services')">Services</div>
    <div class="pub-nav-link" id="pnl-contact" onclick="pubNav('contact')">Contact</div>
  </div>
  <div class="pub-nav-right">
    <button class="theme-btn" data-action="toggleTheme">
      <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
    </button>
    <button class="btn-login" data-action="goLogin">Umlilo Portal</button>
  </div>
</nav>

<div id="pub-site">

  <!-- Emergency bar -->
  <div class="emergency-bar">
    <div><span class="emg-pulse"></span> 24/7 ARMED RESPONSE &middot; EMERGENCY LINE</div>
    <div class="emg-num">+27 68 912 6581</div>
  </div>

  <!-- ── HOME ── -->
  <div id="pub-home" class="pub-page active">
    <div class="hero-section">
      <div class="hero-inner">
        <div class="hero-eyebrow">BlackFire Solutions &middot; South Africa</div>
        <h1 class="hero-title">Security<br><span class="accent">engineered</span><br>to <span class="ember">protect.</span></h1>
        <p class="hero-sub">Integrated security services across Gauteng. Armed response, CCTV, access control, guard deployment - purpose-built for industrial, commercial and residential environments.</p>
        <div class="hero-actions">
          <button class="btn-primary-lg" onclick="pubNav('contact')">Request a Quote</button>
          <button class="btn-outline-lg" onclick="pubNav('services')">Our Services</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-val">500+</div><div class="hero-stat-label">Active Clients</div></div>
          <div class="hero-stat"><div class="hero-stat-val">24/7</div><div class="hero-stat-label">Emergency Response</div></div>
          <div class="hero-stat"><div class="hero-stat-val">10+</div><div class="hero-stat-label">Years Protecting</div></div>
          <div class="hero-stat"><div class="hero-stat-val">55+</div><div class="hero-stat-label">Services Offered</div></div>
        </div>
      </div>
    </div>

    <!-- Live ticker -->
    <div class="live-bar">
      <div class="live-bar-inner" id="ticker"></div>
    </div>

    <!-- Categories -->
    <div class="pub-section">
      <div class="section-eyebrow">What We Do</div>
      <h2 class="section-title">Complete Security Solutions</h2>
      <p class="section-sub">Eight disciplines. One partner. From perimeter detection to executive protection - BlackFire has it covered.</p>
      <div class="cats-grid" id="home-cats"></div>
    </div>

    <!-- Why Us -->
    <div class="why-strip">
      <div class="content-inner">
        <div class="why-grid">
          <div class="why-card"><div class="why-num">01</div><div class="why-title">Certified & Compliant</div><div class="why-desc">PSIRA registered. Fully insured. All personnel vetted, trained and certified to national standards.</div></div>
          <div class="why-card"><div class="why-num">02</div><div class="why-title">Rapid Response</div><div class="why-desc">Average response time under 4 minutes. 24/7 armed units on standby across the greater Johannesburg area.</div></div>
          <div class="why-card"><div class="why-num">03</div><div class="why-title">Integrated Systems</div><div class="why-desc">CCTV, access control, and alarm monitoring linked into a unified control room - one point of command.</div></div>
          <div class="why-card"><div class="why-num">04</div><div class="why-title">Dedicated Support</div><div class="why-desc">Dedicated account manager per client. Monthly reporting. Site visits. Transparent communication, always.</div></div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="home-cta">
      <div class="section-eyebrow">Protect What Matters</div>
      <h2 class="h2-display">Ready to secure your site?</h2>
      <p class="text-intro">Get a tailored security assessment and quote within 24 hours.</p>
      <button class="btn-primary-lg" onclick="pubNav('contact')">Get a Free Assessment</button>
      <div class="site-tagline">Fire, taught to behave.</div>
    </div>

    <!-- Footer -->
    <div class="pub-footer">
      <div class="pub-footer-grid">
        <div class="footer-brand-block">
          <img src="./blackfire_logo_transparent.png" class="bf-logo-dark"><img src="./blackfire_logo_transparent.png" class="bf-logo-light">
          <div class="footer-tagline">Fire, taught to behave.</div>
          <p class="footer-desc">Professional security services across Gauteng. PSIRA registered. Fully insured. 24/7 armed response, CCTV, access control and integrated security solutions.</p>
        </div>
        <div>
          <div class="footer-col-title">Services</div>
          <div class="footer-link" onclick="pubNav('services')">Armed Response</div>
          <div class="footer-link" onclick="pubNav('services')">CCTV & Surveillance</div>
          <div class="footer-link" onclick="pubNav('services')">Access Control</div>
          <div class="footer-link" onclick="pubNav('services')">Guard Services</div>
          <div class="footer-link" onclick="pubNav('services')">Electronic Security</div>
        </div>
        <div>
          <div class="footer-col-title">Contact</div>
          <div class="footer-link">+27 68 912 6581</div>
          <div class="footer-link">info@blackfiresolutions.co.za</div>
          <div class="footer-link">Johannesburg &middot; Sandton &middot; Gauteng</div>
          <div class="footer-col-title mt2">Portal</div>
          <div class="footer-link" data-action="goLogin">Umlilo Portal →</div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copy">(C) 2026 BlackFire Solutions (Pty) Ltd &middot; PSIRA Registered &middot; All Rights Reserved</div>
        <div class="footer-copy">BLKFR &middot; Thermal Geometry System</div>
      </div>
    </div>
  </div><!-- /pub-home -->

  <!-- ── SERVICES ── -->
  <div id="pub-services" class="pub-page">
    <div class="services-header">
      <div class="content-inner">
        <div class="section-eyebrow">Complete Catalogue</div>
        <h1 class="h1-display">Our Services</h1>
        <p class="text-intro">55 services across 8 specialist disciplines</p>
        <div class="services-filter-row" id="svc-filters"></div>
      </div>
    </div>
    <div class="services-grid-wrap">
      <div class="services-grid" id="svc-grid"></div>
    </div>
    <div class="svc-cta">
      <p class="text-intro">Need a custom solution? Let's talk.</p>
      <button class="btn-primary-lg" onclick="pubNav('contact')">Request a Quote</button>
    </div>
  </div><!-- /pub-services -->

  <!-- ── CONTACT ── -->
  <div id="pub-contact" class="pub-page">
    <div>
      <div class="contact-wrap">
        <div>
          <div class="section-eyebrow">Get In Touch</div>
          <h1 class="h1-display">Talk to us.<br>We respond<br>fast.</h1>
          <p class="text-intro">For site assessments, service quotations, or emergency escalations - our team is available 24/7.</p>
          <div class="contact-info-block"><div class="ci-label">Emergency Line</div><div class="ci-val ci-val-emg">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Office</div><div class="ci-val">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Email</div><div class="ci-val">info@blackfiresolutions.co.za</div></div>
          <div class="contact-info-block"><div class="ci-label">Service Area</div><div class="ci-val">Johannesburg &middot; Sandton &middot; Midrand &middot; Ekurhuleni &middot; Greater Gauteng</div></div>
          <div class="contact-info-block"><div class="ci-label">Hours</div><div class="ci-val">Operations: 24/7 &nbsp;|&nbsp; Office: Mon-Fri 07:00-17:00</div></div>
        </div>
        <div class="contact-form-panel">
          <div class="form-title">Request a Quote</div>
          <div class="fgrid">
            <div class="fgroup"><label class="flbl">Full Name</label><input class="finput" id="cf-name" placeholder="Your name"></div>
            <div class="fgroup"><label class="flbl">Company</label><input class="finput" id="cf-company" placeholder="Company name"></div>
            <div class="fgroup"><label class="flbl">Phone</label><input class="finput" id="cf-phone" placeholder="+27"></div>
            <div class="fgroup"><label class="flbl">Email</label><input class="finput" id="cf-email" placeholder="email@company.co.za"></div>
            <div class="fgroup ffull"><label class="flbl">Service Required</label>
              <select class="finput" id="cf-service">
                <option value="">- Select a service -</option>
                <option>Armed Response</option><option>CCTV Installation</option><option>Access Control</option>
                <option>Guard Services</option><option>Alarm Systems</option><option>Risk Assessment</option>
                <option>Event Security</option><option>Multiple Services</option><option>Other</option>
              </select>
            </div>
            <div class="fgroup ffull"><label class="flbl">Site Address / Location</label><input class="finput" id="cf-location" placeholder="Site address or area"></div>
            <div class="fgroup ffull"><label class="flbl">Message</label><textarea class="finput" id="cf-message" rows="4" placeholder="Brief description of your security requirements..."></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn-primary-lg btn-full" data-action="submitContact">Send Request</button>
          </div>
          <div id="cf-success" style="display:none">
            ✓ Thank you - we'll be in touch within 24 hours.
          </div>
        </div>
      </div>
    </div>
  </div><!-- /pub-contact -->

</div><!-- /pub-site -->

<!-- ═══════════════════════════════════════════════════════
     ■ LOGIN SCREEN
═══════════════════════════════════════════════════════ -->
<div id="login-screen">
  <!-- ── Sign In Panel ── -->
  <div class="login-card" id="login-panel">
    <div class="login-header">
      <div class="login-mark" data-action="goPublic" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark"><img src="./blackfire_logo_transparent.png" class="bf-logo-light">
      </div>
      <div class="login-title">BLACKFIRE SOLUTIONS</div>
      <div class="login-sub">SECURE ACCESS</div>
    </div>
    <div class="login-body">
      <div id="login-error" class="login-error">Incorrect username or password.</div>
      <div class="login-group">
        <label class="login-label">Username</label>
        <input class="login-input" id="l-user" placeholder="username" onkeydown="if(event.key==='Enter') doLogin()">
      </div>
      <div class="login-group">
        <label class="login-label">Password</label>
        <input class="login-input" type="password" id="l-pass" placeholder="password" onkeydown="if(event.key==='Enter') doLogin()">
      </div>
      <div class="login-group">
        <label class="login-label" id="captcha-question">Security check: loading…</label>
        <input class="login-input" type="number" id="l-captcha" placeholder="answer" onkeydown="if(event.key==='Enter') doLogin()" autocomplete="off">
      </div>
      <button class="btn-login-submit" data-action="doLogin">Sign In</button>
      <div class="login-footer">
        <span class="login-back" data-action="showForgotPassword">Forgot password?</span>
        <span class="login-sep">·</span>
        <span class="login-back" data-action="goPublic">Back to site</span>
      </div>
    </div>
  </div>
  <!-- ── Forgot Password Panel ── -->
  <div class="login-card" id="forgot-panel" style="display:none">
    <div class="login-header">
      <div class="login-mark" data-action="goPublic" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark"><img src="./blackfire_logo_transparent.png" class="bf-logo-light">
      </div>
      <div class="login-title">RESET PASSWORD</div>
      <div class="login-sub">ENTER YOUR USERNAME</div>
    </div>
    <div class="login-body">
      <div id="forgot-msg" class="login-error" style="display:none;"></div>
      <div class="login-group">
        <label class="login-label">Username</label>
        <input class="login-input" id="fp-user" placeholder="your username" onkeydown="if(event.key==='Enter') doRequestReset()">
      </div>
      <button class="btn-login-submit" data-action="doRequestReset">Send Reset Email</button>
      <div class="login-footer">
        <span class="login-back" data-action="showLoginPanel">Back to sign in</span>
      </div>
    </div>
  </div>
  <!-- ── New Password Panel (token from URL) ── -->
  <div class="login-card" id="newpass-panel" style="display:none">
    <div class="login-header">
      <div class="login-mark" data-action="goPublic" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark"><img src="./blackfire_logo_transparent.png" class="bf-logo-light">
      </div>
      <div class="login-title">NEW PASSWORD</div>
      <div class="login-sub">CHOOSE A NEW PASSWORD</div>
    </div>
    <div class="login-body">
      <div id="newpass-msg" class="login-error" style="display:none"></div>
      <div class="login-group">
        <label class="login-label">New Password</label>
        <input class="login-input" type="password" id="np-pass1" placeholder="new password" onkeydown="if(event.key==='Enter') doResetPassword()">
      </div>
      <div class="login-group">
        <label class="login-label">Confirm Password</label>
        <input class="login-input" type="password" id="np-pass2" placeholder="confirm password" onkeydown="if(event.key==='Enter') doResetPassword()">
      </div>
      <button class="btn-login-submit" data-action="doResetPassword">Set New Password</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════

<!-- ═══════════════════════════════════════════════════════
     ■ PORTAL SHELL - v9  -  Dynamic RBAC Nav
═══════════════════════════════════════════════════════ -->
<div id="portal-shell">

  <!-- Portal Nav Bar — horizontal, below public nav, no logo -->
  <nav id="pnav-bar">
    <div id="pnav-links"></div><!-- filled by buildNav() -->
    <div id="pnav-right">
      <span id="pnav-user"></span>
      <button class="theme-btn" data-action="toggleTheme">
        <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
      </button>
      <button id="pnav-signout" data-action="doLogout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="signout-icon"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>
  </nav>

  <!-- ═══ PORTAL PAGES ═══ -->
  <div id="pmain">

    <!-- PUBLIC EMBEDS -->
    <div id="p-home" class="ppage">
      <div class="embed-hdr embed-hdr--row">
        <div><div class="ptitle">Public Site</div><div class="psub">HOME  -  LIVE VIEW</div></div>
        <button class="btn btn-g btn-s" data-action="goPublicFullscreen">Open Full ↗</button>
      </div>
      <div id="portal-home-embed" class="embed-body"></div>
    </div>

    <div id="p-services" class="ppage">
      <div class="embed-hdr">
        <div class="ptitle">Services</div><div class="psub">55 SERVICES  -  8 CATEGORIES</div>
      </div>
      <div class="portal-svc-section">
        <div class="services-filter-row portal-svc-filters" id="portal-svc-filters"></div>
        <div class="services-grid" id="portal-svc-grid"></div>
      </div>
    </div>

    <div id="p-contact" class="ppage">
      <div class="embed-hdr">
        <div class="ptitle">Contact</div><div class="psub">ENQUIRIES  -  QUOTE REQUESTS</div>
      </div>
      <div class="contact-wrap">
        <div>
          <div class="contact-info-block"><div class="ci-label">Emergency Line</div><div class="ci-val ci-val-portal-emg">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Office</div><div class="ci-val">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Email</div><div class="ci-val">info@blackfiresolutions.co.za</div></div>
          <div class="contact-info-block"><div class="ci-label">Hours</div><div class="ci-val">Ops: 24/7 &middot; Office: Mon-Fri 07:00-17:00</div></div>
        </div>
        <div class="contact-form-panel">
          <div class="portal-form-title">Client Enquiry Form</div>
          <div class="fgrid">
            <div class="fgroup"><label class="flbl">Name</label><input class="finput" id="pcf-name" placeholder="Full name"></div>
            <div class="fgroup"><label class="flbl">Company</label><input class="finput" id="pcf-co" placeholder="Company"></div>
            <div class="fgroup"><label class="flbl">Phone</label><input class="finput" id="pcf-ph" placeholder="+27"></div>
            <div class="fgroup"><label class="flbl">Email</label><input class="finput" id="pcf-em" placeholder="email@company.co.za"></div>
            <div class="fgroup ffull"><label class="flbl">Service</label><select class="finput" id="pcf-svc"><option>Armed Response</option><option>CCTV</option><option>Access Control</option><option>Guard Services</option><option>Risk Assessment</option><option>Other</option></select></div>
            <div class="fgroup ffull"><label class="flbl">Message</label><textarea class="finput" rows="3" placeholder="Requirements..."></textarea></div>
          </div>
          <div class="mt2"><button class="btn btn-p btn-full" onclick="toast('Enquiry submitted - we\'ll be in touch.','ok')">Submit Enquiry</button></div>
        </div>
      </div>
    </div>

    <!-- DASHBOARD -->
    <div id="p-dashboard" class="ppage active">
      <div class="ptitle">Dashboard</div>
      <div class="psub" id="dash-sub">AECI CHEMPARK  -  OVERVIEW</div>
      <div class="kgrid">
        <div class="kcard k1"><div class="klbl">Open Callouts</div><div class="kval" id="kv-co">0</div><div class="ksub">Active on site</div></div>
        <div class="kcard k2"><div class="klbl">Invoiced MTD</div><div class="kval" id="kv-rev">R0</div><div class="ksub">Month to date</div></div>
        <div class="kcard k3"><div class="klbl">Pending Quotes</div><div class="kval" id="kv-q">0</div><div class="ksub">Awaiting approval</div></div>
        <div class="kcard k4"><div class="klbl">Net Balance</div><div class="kval" id="kv-bal">R0</div><div class="ksub">Credits − Debits</div></div>
      </div>
      <div class="alert-strip" id="dash-alerts"></div>
      <div class="twocol">
        <div class="panel">
          <div class="ph"><div class="ph-title">Recent Callouts</div><button class="btn btn-g btn-s" onclick="showPortalPage('p-callouts',null)">View All</button></div>
          <div class="tw"><table><thead><tr><th>Job ID</th><th>Service</th><th>Status</th></tr></thead><tbody id="dash-co-tbl"></tbody></table></div>
        </div>
        <div class="panel" id="dash-rev-panel">
          <div class="ph"><div class="ph-title">Revenue - 6 Months</div></div>
          <div class="rev-chart-wrap"><div class="chart-bars" id="rev-chart"></div></div>
        </div>
      </div>
    </div>

    <!-- TRANSACTIONS -->
    <div id="p-transactions" class="ppage">
      <div class="ptitle">Transactions</div><div class="psub">BANK LEDGER</div>
      <div class="tx-stats">
        <div class="kcard kcard--flex kcard--credits"><div class="klbl">Credits</div><div class="kval kval--lg kval--paid" id="tx-credits">R0</div></div>
        <div class="kcard kcard--flex kcard--debits"><div class="klbl">Debits</div><div class="kval kval--lg kval--ovr" id="tx-debits">R0</div></div>
        <div class="kcard kcard--flex kcard--net"><div class="klbl">Net</div><div class="kval kval--lg" id="tx-net">R0</div></div>
      </div>
      <div class="srow"><input type="text" class="sinput" placeholder="Search..." oninput="renderTransactions(this.value)"><button class="btn btn-p btn-s" data-action="openTxModal">+ Log Transaction</button></div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Ref</th><th>Credit</th><th>Debit</th></tr></thead><tbody id="tx-table"></tbody></table></div></div>
    </div>

    <!-- INVOICES -->
    <div id="p-invoices" class="ppage">
      <div class="ptitle">Invoices</div><div class="psub">BILLING  -  PAYMENT TRACKING</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search invoices..." oninput="renderInvoices(this.value)">
        <select class="sinput sinput-narrow" onchange="renderInvoices('',this.value)"><option value="">All</option><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select>
        <button class="btn btn-p btn-s" id="btn-newinv" onclick="showPortalPage('p-new-invoice',null)">+ New Invoice</button>
      </div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Invoice #</th><th>Client</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody id="inv-table"></tbody></table></div></div>
    </div>

    <!-- QUOTES -->
    <div id="p-quotes" class="ppage">
      <div class="ptitle">Quotes</div><div class="psub">PROPOSALS  -  APPROVALS</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search quotes..." oninput="renderQuotes(this.value)">
        <select class="sinput sinput-narrow" onchange="renderQuotes('',this.value)"><option value="">All</option><option>Draft</option><option>Sent</option><option>Pending Approval</option><option>Approved</option><option>Declined</option></select>
        <button class="btn btn-p btn-s" id="btn-newq" onclick="showPortalPage('p-new-quote',null)">+ New Quote</button>
      </div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Quote #</th><th>Client</th><th>Total</th><th>Submitted By</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead><tbody id="qte-table"></tbody></table></div></div>
    </div>

    <!-- CALLOUTS - PO + assignment columns -->
    <div id="p-callouts" class="ppage">
      <div class="ptitle">Callouts</div><div class="psub">JOB TICKETS  -  FIELD OPERATIONS</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search callouts..." oninput="renderCallouts(this.value)">
        <select class="sinput sinput-narrow" onchange="renderCallouts('',this.value)"><option value="">All</option><option>Open</option><option>In Progress</option><option>Completed</option><option>Invoiced</option></select>
        <button class="btn btn-p btn-s" id="btn-newco" onclick="showPortalPage('p-new-callout',null)">+ Log Call</button>
      </div>
      <div class="panel"><div class="tw">
        <table>
          <thead><tr><th>Job ID</th><th>Service</th><th>Assigned To</th><th>PO #</th><th>Priority</th><th>Status</th><th>Logged By</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody id="co-table"></tbody>
        </table>
      </div></div>
    </div>

    <!-- TIMELINE -->
    <div id="p-timeline" class="ppage">
      <div class="ptitle">Site Timeline</div><div class="psub">ACTIVITY LOG</div>
      <div class="panel"><div class="pb" id="timeline-content"></div></div>
    </div>

    <!-- STATEMENT -->
    <div id="p-statement" class="ppage">
      <div class="ptitle">Account Statement</div><div class="psub">AECI CHEMPARK  -  LEDGER</div>
      <div id="stmt-content"></div>
    </div>

    <!-- INCOME STATEMENT -->
    <div id="p-income" class="ppage">
      <div class="ptitle">Income Statement</div><div class="psub">FINANCIAL REPORTING  -  28% TAX</div>
      <div class="twocol">
        <div class="panel"><div class="ph"><div class="ph-title">Profit & Loss</div></div><div id="pl-rows"></div></div>
        <div class="panel"><div class="ph"><div class="ph-title">Summary</div></div><div class="pb"><div class="sumbox" id="pl-summary"></div></div></div>
      </div>
    </div>

    <!-- LOG CALL (new callout) -->
    <div id="p-new-callout" class="ppage">
      <div class="ptitle">Log Call</div><div class="psub">CREATE JOB TICKET</div>
      <div class="panel"><div class="pb">
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Client</label><input class="finput" id="nc-client" value="AECI Chempark" placeholder="Client name"></div>
          <div class="fgroup"><label class="flbl">Service / Fault Type</label><input class="finput" id="nc-service" placeholder="e.g. Armed Response, Alarm Fault"></div>
          <div class="fgroup"><label class="flbl">Site / Location</label><input class="finput" id="nc-location" placeholder="e.g. Gate 2, Sector C"></div>
          <div class="fgroup"><label class="flbl">Priority</label><select class="finput" id="nc-priority"><option>Normal</option><option>Urgent</option><option>Emergency</option></select></div>
          <div class="fgroup"><label class="flbl">Assign Technician</label>
            <select class="finput" id="nc-tech">
              <option value="">- Unassigned -</option>
              <option value="jtech">Junior Tech (J. Mthembu)</option>
              <option value="stech">Senior Tech (R. Khumalo)</option>
            </select>
          </div>
          <div class="fgroup"><label class="flbl">Initial Status</label><select class="finput" id="nc-status"><option>Open</option><option>In Progress</option></select></div>
          <div class="fgroup"><label class="flbl">Date</label><input type="date" class="finput" id="nc-date"></div>
          <div class="fgroup"><label class="flbl">Time</label><input type="time" class="finput" id="nc-time"></div>
          <div class="fgroup ffull"><label class="flbl">Call Notes</label><textarea class="finput" id="nc-notes" rows="3" placeholder="Caller details, description of incident, any initial info..."></textarea></div>
        </div>
        <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveCallout">Log Call →</button></div>
      </div></div>
    </div>

    <!-- SUBMIT QUOTE (senior tech / manager) -->
    <div id="p-new-quote" class="ppage">
      <div class="ptitle" id="nq-page-title">New Quote</div>
      <div class="psub" id="nq-page-sub">BUILD PROPOSAL</div>
      <div id="nq-pending-notice" style="display:none">
        <strong>Senior Technician:</strong> Quotes you submit will be sent for manager approval before being issued to the client.
      </div>
      <div class="panel"><div class="pb">
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Client</label><input class="finput" id="nq-client" value="AECI Chempark"></div>
          <div class="fgroup"><label class="flbl">Valid Until</label><input type="date" class="finput" id="nq-valid"></div>
          <div class="fgroup"><label class="flbl">Linked Job ID</label><input class="finput" id="nq-jobref" placeholder="e.g. JOB-003 (optional)"></div>
          <div class="fgroup" id="nq-status-group"><label class="flbl">Status</label><select class="finput" id="nq-status"><option>Draft</option><option>Sent</option></select></div>
        </div>
        <div class="divider"></div>
        <div class="flbl flbl-mb">Line Items</div>
        <table class="liitems"><thead><tr><th class="li-desc-col">Description</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr></thead><tbody id="li-body"></tbody></table>
        <button class="btn btn-g btn-s" data-action="addLine">+ Add Line</button>
        <div class="mt2" id="quote-sum"></div>
        <div class="mt3 flex-end"><button class="btn btn-p" id="nq-submit-btn" data-action="saveQuote">Save Quote</button></div>
      </div></div>
    </div>

    <!-- NEW INVOICE -->
    <div id="p-new-invoice" class="ppage">
      <div class="ptitle">New Invoice</div><div class="psub">CREATE TAX INVOICE</div>
      <div class="panel"><div class="pb">
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Client</label><input class="finput" id="ni-client" value="AECI Chempark"></div>
          <div class="fgroup"><label class="flbl">Amount (incl. VAT)</label><input type="number" class="finput" id="ni-amount" placeholder="0.00"></div>
          <div class="fgroup"><label class="flbl">Due Date</label><input type="date" class="finput" id="ni-due"></div>
          <div class="fgroup"><label class="flbl">Status</label><select class="finput" id="ni-status"><option>Draft</option><option>Sent</option></select></div>
          <div class="fgroup"><label class="flbl">PO Reference</label><input class="finput" id="ni-po" placeholder="PO number if applicable"></div>
          <div class="fgroup"><label class="flbl">Linked Quote / Job ID</label><input class="finput" id="ni-ref" placeholder="e.g. QTE-001 or JOB-003"></div>
        </div>
        <div class="mt3 flex-end"><button class="btn btn-p" data-action="saveInvoice">Create Invoice</button></div>
      </div></div>
    </div>

    <!-- LOG PAYMENT -->
    <div id="p-log-payment" class="ppage">
      <div class="ptitle">Log Payment</div><div class="psub">RECORD RECEIVED PAYMENT</div>
      <div class="panel"><div class="pb">
        <div class="flbl flbl-mb">Select Invoices to Mark as Paid <span id="pay-sel-count" class="pay-count"></span></div>
        <div id="pay-inv-list" class="pay-inv-wrap"></div>
        <div class="divider"></div>
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Payment Date</label><input type="date" class="finput" id="pay-date"></div>
          <div class="fgroup"><label class="flbl">Amount Received (R)</label><input type="number" class="finput" id="pay-amount" placeholder="0.00" step="0.01"></div>
          <div class="fgroup ffull"><label class="flbl">Payment Reference / Notes</label><input class="finput" id="pay-notes" placeholder="EFT ref, cheque number, method..."></div>
          <div class="fgroup ffull"><label class="flbl">Remittance / Proof of Payment <span class="label-opt">(optional — PDF, image, Excel, Word · max 10 MB)</span></label><input type="file" class="finput finput-file" id="pay-remittance" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"></div>
        </div>
        <div class="mt3 flex-end"><button class="btn btn-p" data-action="logPayment">Log Payment</button></div>
      </div></div>
    </div>

    <!-- AUDIT LOG -->
    <div id="p-audit" class="ppage">
      <div class="ptitle">Audit Log</div><div class="psub">SECURITY  -  ACCESS RECORDS</div>
      <div class="srow"><input type="text" class="sinput" placeholder="Filter log..." oninput="filterAudit(this.value)"></div>
      <div class="panel"><div id="audit-list"></div></div>
    </div>

    <!-- USERS & ROLES -->
    <div id="p-users" class="ppage">
      <div class="ptitle">Users & Roles</div><div class="psub">RBAC  -  ACCESS CONTROL MATRIX</div>
      <div id="users-create-bar" style="display:none">
        <button class="btn-create-user" data-action="openCreateUserModal">+ New User</button>
      </div>
      <div class="panel"><div class="tw"><table><thead>
        <tr><th>Username</th><th>Name</th><th>Role</th><th>Can Create Callout</th><th>Update Status</th><th>Assign PO</th><th>Finance</th><th>Submit Quote</th><th>Approve Quote</th></tr>
      </thead><tbody id="users-table-body"></tbody></table></div></div>
    </div>

  </div><!-- /pmain -->
</div><!-- /portal-shell -->

<!-- MODAL -->
<div id="modal-overlay" onclick="closeModal(event)">
  <div class="modal"><div class="mhdr"><div class="mttl" id="modal-ttl"></div><button class="mclose" data-action="closeModalDirect">✕</button></div><div class="mbdy" id="modal-bdy"></div></div>
</div>

<!-- TOAST -->
<div id="toaster"></div>


<script src="portal.js"></script>

<!-- Back to top button -->
<button id="back-to-top" data-action="scrollToTop" title="Back to top"></button>






