<?php
/**
 * BlackFire Solutions Portal
 * HTML shell — public site + authenticated portal pages.
 * All data via fetch() → api/*.php endpoints.
 */
$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
$cspNonce = base64_encode(random_bytes(16));
?>
<!DOCTYPE html>
<html lang="en" data-theme="light" data-state="public">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<!-- Primary SEO -->
<meta name="description" content="BlackFire Solutions — PSIRA registered security company headquartered in Gauteng, operating nationwide. Specialists in next-generation security: drone surveillance, AI-powered CCTV, access control, armed response and integrated security systems across South Africa. 500+ clients. Call +27 68 912 6581.">
<meta name="keywords" content="security company South Africa, armed response Gauteng, drone security South Africa, drone surveillance Johannesburg, aerial security monitoring, CCTV installation South Africa, AI security systems, smart security Gauteng, access control nationwide, security guards South Africa, PSIRA registered security, integrated security solutions, remote monitoring South Africa, thermal imaging security, perimeter detection, electronic security Gauteng, event security South Africa, industrial security, commercial security Johannesburg, BlackFire Solutions">
<meta name="robots" content="index, follow">
<meta name="author" content="BlackFire Solutions (Pty) Ltd">
<link rel="canonical" href="https://blackfiresolutions.co.za/">
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://blackfiresolutions.co.za/">
<meta property="og:title" content="BlackFire Solutions — Security Engineered to Protect">
<meta property="og:description" content="PSIRA registered security company headquartered in Gauteng, operating nationwide. Specialists in drone surveillance, AI-powered CCTV, access control, armed response and integrated security technology across South Africa. 500+ clients. 55+ services.">
<meta property="og:image" content="https://blackfiresolutions.co.za/blackfire_logo_transparent.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="BlackFire Solutions">
<meta property="og:locale" content="en_ZA">
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BlackFire Solutions — Security Engineered to Protect">
<meta name="twitter:description" content="PSIRA registered. Drone surveillance, AI CCTV, armed response nationwide. Based in Gauteng, operating across South Africa. Next-gen security technology. +27 68 912 6581">
<meta name="twitter:image" content="https://blackfiresolutions.co.za/blackfire_logo_transparent.png">
<!-- JSON-LD Structured Data -->
<script type="application/ld+json" nonce="<?= $cspNonce ?>">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://blackfiresolutions.co.za/",
  "name": "BlackFire Solutions (Pty) Ltd",
  "alternateName": "BlackFire Solutions",
  "url": "https://blackfiresolutions.co.za",
  "logo": "https://blackfiresolutions.co.za/blackfire_logo_transparent.png",
  "image": "https://blackfiresolutions.co.za/blackfire_logo_transparent.png",
  "description": "PSIRA registered security company headquartered in Gauteng, providing next-generation security solutions nationwide. Specialising in drone surveillance, AI-powered CCTV, access control, armed response, perimeter detection, thermal imaging and integrated security systems across South Africa.",
  "telephone": "+27689126581",
  "email": "info@blackfiresolutions.co.za",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Johannesburg",
    "addressRegion": "Gauteng",
    "addressCountry": "ZA"
  },
  "areaServed": {
    "@type": "Country",
    "name": "South Africa"
  },
  "locationCreated": {
    "@type": "City",
    "name": "Johannesburg",
    "containedInPlace": {
      "@type": "State",
      "name": "Gauteng"
    }
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Security Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Armed Response" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "CCTV Installation" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Access Control" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Guard Services" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Alarm Systems" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Risk Assessment" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Event Security" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Electronic Security" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Drone Surveillance" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Aerial Security Monitoring" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "AI-Powered CCTV" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Thermal Imaging" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Perimeter Detection" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Remote Monitoring" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Integrated Security Systems" } }
    ]
  }
}
</script>
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'nonce-<?= $cspNonce ?>'; connect-src 'self'; object-src 'none';">
<title>BlackFire Solutions - Fire, taught to behave.</title>
<link rel="icon" href="./favicon.ico?v=20260521" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="./favicon-512x512.png?v=20260521">
<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png?v=20260521">
<link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png?v=20260521">
<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v=20260521">
<link rel="shortcut icon" href="./favicon.ico?v=20260521">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;900&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="portal.css?v=<?= filemtime(__DIR__.'/portal.css') ?>">
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     ■ PUBLIC SITE
═══════════════════════════════════════════════════════ -->
<!-- Public Nav — always visible across all states -->
<nav id="pub-nav">
  <div class="pub-brand" onclick="pubNav('home')">
    <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" height="60"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" height="60">
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
    <button class="pub-ham-btn" data-action="toggleMobileMenu" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<!-- Mobile nav dropdown (public site only, hidden until hamburger tapped) -->
<div id="pub-mob-nav" role="navigation" aria-label="Mobile navigation">
  <div class="pub-mob-nav-link" id="pmnl-home"     onclick="pubNav('home');closeMobileMenu()">Home</div>
  <div class="pub-mob-nav-link" id="pmnl-services"  onclick="pubNav('services');closeMobileMenu()">Services</div>
  <div class="pub-mob-nav-link" id="pmnl-contact"   onclick="pubNav('contact');closeMobileMenu()">Contact</div>
  <div class="pub-mob-nav-divider"></div>
  <button class="pub-mob-login-btn" data-action="goLogin" onclick="closeMobileMenu()">Umlilo Portal →</button>
</div>

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
          <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" height="62"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" height="62">
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
    <!-- Footer -->
    <div class="pub-footer">
      <div class="pub-footer-grid">
        <div class="footer-brand-block">
          <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" height="62"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" height="62">
          <div class="footer-tagline">Fire, taught to behave.</div>
          <p class="footer-desc">Professional security services across Gauteng. PSIRA registered. Fully insured. 24/7 armed response, CCTV, access control and integrated security solutions.</p>
        </div>
        <div>
          <div class="footer-col-title">Services</div>
          <div class="footer-link" onclick="pubNav('services')">Armed Response</div>
          <div class="footer-link" onclick="pubNav('services')">CCTV &amp; Surveillance</div>
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
          <div class="footer-link" data-action="goLogin">Umlilo Portal &rarr;</div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copy">(C) 2026 BlackFire Solutions (Pty) Ltd &middot; PSIRA Registered &middot; All Rights Reserved</div>
        <div class="footer-copy">BLKFR &middot; Thermal Geometry System</div>
      </div>
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
          <div id="cf-success">
            ✓ Thank you - we'll be in touch within 24 hours.
          </div>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <div class="pub-footer">
      <div class="pub-footer-grid">
        <div class="footer-brand-block">
          <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" height="62"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" height="62">
          <div class="footer-tagline">Fire, taught to behave.</div>
          <p class="footer-desc">Professional security services across Gauteng. PSIRA registered. Fully insured. 24/7 armed response, CCTV, access control and integrated security solutions.</p>
        </div>
        <div>
          <div class="footer-col-title">Services</div>
          <div class="footer-link" onclick="pubNav('services')">Armed Response</div>
          <div class="footer-link" onclick="pubNav('services')">CCTV &amp; Surveillance</div>
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
          <div class="footer-link" data-action="goLogin">Umlilo Portal &rarr;</div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copy">(C) 2026 BlackFire Solutions (Pty) Ltd &middot; PSIRA Registered &middot; All Rights Reserved</div>
        <div class="footer-copy">BLKFR &middot; Thermal Geometry System</div>
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
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" height="74"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" height="74">
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
  <div class="login-card" id="forgot-panel">
    <div class="login-header">
      <div class="login-mark" data-action="goPublic" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" height="74"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" height="74">
      </div>
      <div class="login-title">RESET PASSWORD</div>
      <div class="login-sub">ENTER YOUR USERNAME</div>
    </div>
    <div class="login-body">
      <div id="forgot-msg" class="login-error"></div>
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
  <div class="login-card" id="newpass-panel">
    <div class="login-header">
      <div class="login-mark" data-action="goPublic" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" height="74"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" height="74">
      </div>
      <div class="login-title">NEW PASSWORD</div>
      <div class="login-sub">CHOOSE A NEW PASSWORD</div>
    </div>
    <div class="login-body">
      <div id="newpass-msg" class="login-error"></div>
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
     ■ PORTAL SHELL - v9  -  Dynamic RBAC Nav
═══════════════════════════════════════════════════════ -->
<div id="portal-shell">

  <!-- Portal Top Bar — logo + identity -->
  <div id="portal-topbar">
    <img src="./blackfire_logo_transparent.png" alt="BlackFire Solutions" height="50" class="bf-logo-dark">
    <img src="./blackfire_logo_transparent.png" alt="BlackFire Solutions" height="50" class="bf-logo-light">
    <div class="ptb-right">
      <span id="ptb-user"></span>
      <button class="theme-btn" data-action="toggleTheme">
        <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
      </button>
      <button class="refresh-btn" data-action="refreshPage" title="Refresh this section">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
      </button>
      <button class="info-btn" id="info-mode-btn" data-action="toggleInfoMode" title="Page Guide — how-to help for each screen">?</button>
      <button id="pnav-signout" data-action="doLogout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="signout-icon"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>
  </div>

  <!-- Primary Nav Bar — floating bar with group tabs -->
  <div id="pnav-primary-bar">
    <nav id="pnav-primary"></nav><!-- filled by buildNav() -->
  </div>

  <!-- Sub-Nav Strip — child pages for active group -->
  <div id="pnav-bar">
    <div id="pnav-links"></div><!-- filled by activateNavGroup() -->
  </div>

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
      <div class="dash-ptitle-row">
        <div>
          <div class="ptitle">Dashboard</div>
          <div class="psub" id="dash-sub">AECI CHEMPARK  -  OVERVIEW</div>
        </div>
        <button class="btn btn-g btn-s dash-edit-btn" onclick="showDashEditor()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="svg-icon-inline"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit Layout
        </button>
      </div>
      <div id="dash-main-content"></div>
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
          <div class="fgroup"><label class="flbl">Client</label><select class="finput" id="nc-client"><option value="">— Select Client —</option></select></div>
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
      <div id="nq-pending-notice">
        <strong>Senior Technician:</strong> Quotes you submit will be sent for manager approval before being issued to the client.
      </div>
      <div class="panel"><div class="pb">
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Client</label><select class="finput" id="nq-client"><option value="">— Select Client —</option></select></div>
          <div class="fgroup"><label class="flbl">Valid Until</label><input type="date" class="finput" id="nq-valid"></div>
          <div class="fgroup"><label class="flbl">Linked Callout</label><select class="finput" id="nq-callout-ref"><option value="">— None (standalone quote) —</option></select></div>
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
          <div class="fgroup"><label class="flbl">Client</label><select class="finput" id="ni-client"><option value="">— Select Client —</option></select></div>
          <div class="fgroup"><label class="flbl">Amount (incl. VAT)</label><input type="number" class="finput" id="ni-amount" placeholder="0.00"></div>
          <div class="fgroup"><label class="flbl">Due Date</label><input type="date" class="finput" id="ni-due"></div>
          <div class="fgroup"><label class="flbl">Status</label><select class="finput" id="ni-status"><option>Draft</option><option>Sent</option></select></div>
          <div class="fgroup"><label class="flbl">PO Reference</label><input class="finput" id="ni-po" placeholder="PO number if applicable"></div>
          <div class="fgroup"><label class="flbl">Linked Quote</label><select class="finput" id="ni-quote-ref"><option value="">— None —</option></select></div>
          <div class="fgroup"><label class="flbl">Linked Callout</label><select class="finput" id="ni-callout-ref"><option value="">— None —</option></select></div>
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

    <!-- ═══════════════════════════════════════════════════════
         ■ CLIENTS
    ═══════════════════════════════════════════════════════ -->

    <!-- CLIENTS LIST -->
    <div id="p-clients" class="ppage">
      <div class="ptitle">Clients</div>
      <div class="psub">CLIENT ACCOUNTS  -  CONTACT RECORDS</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search clients..." oninput="renderClients(this.value)">
        <button class="btn btn-p btn-s" onclick="openClientModal(null)">+ Add Client</button>
      </div>
      <div class="panel">
        <div class="tw">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Contact Person</th><th>VAT No.</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="clients-table"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- CLIENT ADD/EDIT MODAL -->
    <div id="client-modal" class="modal">
      <div class="modal-box modal-box--lg">
        <div class="modal-hdr">
          <div class="modal-title" id="client-modal-title">Add Client</div>
          <button class="modal-close" onclick="closeClientModal()">&#x2715;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="cm-id">
          <div class="fgrid">
            <div class="fgroup ffull"><label class="flbl">Client Name <span class="req">*</span></label><input class="finput" id="cm-name" placeholder="Company or client name"></div>
            <div class="fgroup"><label class="flbl">Email</label><input type="email" class="finput" id="cm-email" placeholder="billing@company.co.za"></div>
            <div class="fgroup"><label class="flbl">Phone</label><input class="finput" id="cm-phone" placeholder="+27 11 000 0000"></div>
            <div class="fgroup"><label class="flbl">VAT Number</label><input class="finput" id="cm-vat" placeholder="4XXXXXXXXX"></div>
            <div class="fgroup ffull"><label class="flbl">Address</label><textarea class="finput" id="cm-address" rows="2" placeholder="Street, suburb, city, postal code"></textarea></div>
            <div class="fgroup"><label class="flbl">Contact Person</label><input class="finput" id="cm-contact" placeholder="Primary contact name"></div>
            <div class="fgroup ffull"><label class="flbl">Contact Details</label><textarea class="finput" id="cm-contact-details" rows="2" placeholder="Direct phone, mobile, alternate email..."></textarea></div>
            <div class="fgroup ffull"><label class="flbl">Notes</label><textarea class="finput" id="cm-notes" rows="3" placeholder="Internal notes, contract details, billing terms..."></textarea></div>
          </div>
        </div>
        <div class="modal-footer flex-end">
          <button class="btn btn-g" onclick="closeClientModal()">Cancel</button>
          <button class="btn btn-p" onclick="saveClient()">Save Client</button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         ■ SAFETY FILES MODULE  (BF-SHE-FRM-010)
    ═══════════════════════════════════════════════════════ -->

    <!-- SAFETY DASHBOARD -->
    <div id="p-safety" class="ppage">
      <div class="ptitle">Safety Files</div>
      <div class="psub">CONTRACTOR SHE &mdash; BF-SHE-FRM-010</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search contractors..." oninput="renderSafetyFiles(this.value)">
        <select class="sinput sinput-narrow" id="sf-filter-status" onchange="renderSafetyFiles()">
          <option value="">All Files</option>
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
        </select>
        <button class="btn btn-p btn-s" data-action="newSafetyAudit">+ New Audit</button>
        <a class="btn btn-g btn-s" href="reports.php" style="text-decoration:none">Reports</a>
      </div>
      <div id="safety-reminders" class="safety-reminders"></div>
      <div id="safety-files-grid" class="safety-grid"></div>
    </div>

    <!-- SAFETY AUDIT FORM (create / edit) -->
    <div id="p-safety-audit" class="ppage">
      <div class="ptitle" id="saf-page-title">New Safety Audit</div>
      <div class="psub">BF-SHE-FRM-010 &mdash; CONTRACTOR FILE REVIEW</div>
      <div class="safety-audit-layout">

        <!-- Main form column -->
        <div class="safety-audit-main">

          <!-- Header panel -->
          <div class="panel">
            <div class="ph"><div class="ph-title">Audit Header</div></div>
            <div class="pb">
              <div class="fgrid">
                <div class="fgroup"><label class="flbl">Contractor <span class="req">*</span></label><input class="finput" id="sah-contractor" list="sah-contractor-dl" placeholder="Type or select contractor" autocomplete="off"><datalist id="sah-contractor-dl"></datalist></div>
                <div class="fgroup"><label class="flbl">Contractor Rep</label><input class="finput" id="sah-rep" placeholder="Name"></div>
                <div class="fgroup"><label class="flbl">16.2 Appointee</label><input class="finput" id="sah-appointee" placeholder="Name"></div>
                <div class="fgroup"><label class="flbl">Audit Date <span class="req">*</span></label><input type="date" class="finput" id="sah-date"></div>
                <div class="fgroup"><label class="flbl">Region / Site</label><input class="finput" id="sah-region" placeholder="e.g. AECI Chempark"></div>
                <div class="fgroup"><label class="flbl">Audit Team</label><input class="finput" id="sah-team" placeholder="Auditor name(s)"></div>
                <div class="fgroup ffull"><label class="flbl">Scope of Work</label><input class="finput" id="sah-scope" placeholder="Describe contractor's scope of work..."></div>
                <div class="fgroup"><label class="flbl">Manpower Total</label><input type="number" class="finput" id="sah-manpower" min="0" value="0"></div>
                <div class="fgroup"><label class="flbl">Supervisors</label><input type="number" class="finput" id="sah-supervisors" min="0" value="0"></div>
                <div class="fgroup"><label class="flbl">SHE Reps</label><input type="number" class="finput" id="sah-shereps" min="0" value="0"></div>
                <div class="fgroup"><label class="flbl">First Aiders</label><input type="number" class="finput" id="sah-firstaiders" min="0" value="0"></div>
              </div>
            </div>
          </div>

          <!-- Checklist sections (rendered by JS) -->
          <div id="safety-sections" class="safety-sections-wrap"></div>

          <!-- Sign-off -->
          <div class="panel mt2">
            <div class="ph"><div class="ph-title">Audit Sign-Off</div></div>
            <div class="pb">
              <div class="fgrid">
                <div class="fgroup"><label class="flbl">Auditor Name &amp; Surname</label><input class="finput" id="sah-auditor-name"></div>
                <div class="fgroup"><label class="flbl">Sign-Off Date</label><input type="date" class="finput" id="sah-signoff-date"></div>
              </div>
            </div>
          </div>

          <div class="mt3 saf-action-row">
            <button class="btn btn-g" onclick="showPortalPage('p-safety',null); renderSafetyFiles()">Cancel</button>
            <button class="btn btn-g" data-action="saveSafetyDraft">Save Draft</button>
            <button class="btn btn-p" data-action="submitSafetyAudit">Submit Audit</button>
          </div>
        </div><!-- /safety-audit-main -->

        <!-- Score sidebar -->
        <div class="safety-score-sidebar">
          <div class="panel safety-score-panel">
            <div class="ph"><div class="ph-title">Live Score</div></div>
            <div class="pb">
              <div class="saf-score-label-top">Audit Score</div>
              <div class="safety-score-big" id="saf-score-val">—</div>
              <div class="safety-score-label" id="saf-score-band"></div>
              <div class="safety-score-rule" id="saf-score-rule"></div>
              <div id="saf-bonus-score" class="saf-bonus-score-row"></div>
              <div class="saf-completion-bar" id="saf-completion-pct"></div>
              <div class="divider"></div>
              <div id="saf-section-scores" class="saf-section-scores"></div>
            </div>
          </div>
          <div class="panel mt2">
            <div class="ph"><div class="ph-title">Legend</div></div>
            <div class="pb saf-legend">
              <div class="saf-leg-item"><span class="saf-dot saf-green"></span>90–100 Complying</div>
              <div class="saf-leg-item"><span class="saf-dot saf-yellow"></span>75–89 Minor concerns</div>
              <div class="saf-leg-item"><span class="saf-dot saf-orange"></span>51–74 Not complying</div>
              <div class="saf-leg-item"><span class="saf-dot saf-red"></span>0–50 Critical</div>
            </div>
          </div>
        </div><!-- /safety-score-sidebar -->

      </div><!-- /safety-audit-layout -->
    </div><!-- /p-safety-audit -->

    <!-- SAFETY FILE DETAIL / REPORT VIEW -->
    <div id="p-safety-detail" class="ppage">
      <div id="saf-detail-header" class="saf-detail-header">
        <div>
          <div class="ptitle" id="saf-detail-title">Safety File</div>
          <div class="psub" id="saf-detail-sub"></div>
        </div>
        <div class="saf-detail-actions">
          <button class="btn btn-g btn-s" onclick="showPortalPage('p-safety',null); renderSafetyFiles()">&#8592; Back</button>
          <button class="btn btn-g btn-s" data-action="editSafetyFile">Edit</button>
          <button class="btn btn-g btn-s" onclick="safGenerateTracker(document.getElementById('saf-detail-content').dataset.fileId)" title="Generate contractor action-plan tracker as a downloadable HTML file">&#8659; Tracker</button>
          <button class="btn btn-s saf-approve-btn" id="saf-approve-btn" class="btn-approve-action" onclick="approveSafetyFile()">&#10003; Approve</button>
          <button class="btn btn-s" id="saf-deactivate-btn" class="btn-deactivate-action" onclick="deactivateSafetyFile()" title="Deactivate this safety file — record is retained for audit">&#128465; Deactivate</button>
          <button class="btn btn-p btn-s" onclick="safDownloadPack(document.getElementById('saf-detail-content').dataset.fileId)" title="Download full safety file report as standalone HTML">&#8595; Download Pack</button>
        </div>
      </div>
      <div id="saf-detail-content"></div>
    </div><!-- /p-safety-detail -->

    <!-- AUDIT LOG -->
    <div id="p-audit" class="ppage">
      <div class="ptitle">Audit Log</div><div class="psub">SECURITY  -  ACCESS RECORDS</div>
      <div class="srow"><input type="text" class="sinput" placeholder="Filter log..." oninput="filterAudit(this.value)"></div>
      <div class="panel"><div id="audit-list"></div></div>
    </div>

    <!-- USERS & ROLES -->
    <div id="p-users" class="ppage">
      <div class="ptitle">Users & Roles</div><div class="psub">RBAC  -  ACCESS CONTROL MATRIX</div>
      <div id="users-create-bar">
        <button class="btn-create-user" data-action="openCreateUserModal">+ New User</button>
      </div>
      <div class="panel">
        <div class="perm-toggle-bar">
          <button class="btn btn-g btn-s" id="perm-cols-btn" onclick="togglePermCols()">&#9664; Collapse Permissions</button>
        </div>
        <div class="tw"><table id="users-rbac-table"><thead>
          <tr>
            <th>Username</th><th>Name</th><th>Role</th>
            <th class="perm-col">Can Create Callout</th>
            <th class="perm-col">Update Status</th>
            <th class="perm-col">Assign PO</th>
            <th class="perm-col">Finance</th>
            <th class="perm-col">Submit Quote</th>
            <th class="perm-col">Approve Quote</th>
            <th class="perm-col">Sys Admin</th>
            <th id="users-th-actions">Actions</th>
          </tr>
        </thead><tbody id="users-table-body"></tbody></table></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         ■ SECTION LANDING DASHBOARDS
    ═══════════════════════════════════════════════════════ -->

    <!-- OPERATIONS LANDING DASHBOARD -->
    <div id="p-ops-dashboard" class="ppage">
      <div class="ptitle">Operations</div>
      <div class="psub">FIELD OPERATIONS  ·  OVERVIEW</div>
      <div id="ops-dash-content"></div>
    </div>

    <!-- FINANCE LANDING DASHBOARD -->
    <div id="p-finance-dashboard" class="ppage">
      <div class="ptitle">Finance</div>
      <div class="psub">FINANCIAL MANAGEMENT  ·  OVERVIEW</div>
      <div id="fin-dash-content"></div>
    </div>

    <!-- SUPPORT LANDING DASHBOARD -->
    <div id="p-support-dashboard" class="ppage">
      <div class="ptitle">Support</div>
      <div class="psub">ADMINISTRATION  ·  OVERVIEW</div>
      <div id="sup-dash-content"></div>
    </div>

  </div><!-- /pmain -->
</div><!-- /portal-shell -->

<!-- INFO / GUIDE PANEL -->
<div id="info-overlay" onclick="toggleInfoMode()"></div>
<div id="info-panel" role="complementary" aria-label="Page Guide">
  <div id="info-panel-hdr">
    <div>
      <div id="info-panel-hdr-title">Page Guide</div>
      <div id="info-panel-hdr-sub"></div>
    </div>
    <button id="info-panel-close" data-action="toggleInfoMode" aria-label="Close guide">&times;</button>
  </div>
  <div id="info-panel-inner"></div>
</div>

<!-- MODAL -->
<div id="modal-overlay" onclick="closeModal(event)">
  <div class="modal"><div class="mhdr"><div class="mttl" id="modal-ttl"></div><button class="mclose" data-action="closeModalDirect">✕</button></div><div class="mbdy" id="modal-bdy"></div></div>
</div>

<!-- TOAST -->
<div id="toaster"></div>


<!-- Back to top button -->
<button id="back-to-top" data-action="scrollToTop" title="Back to top"></button>

<script src="portal.js?v=<?= filemtime(__DIR__.'/portal.js') ?>"></script>
