<?php
/**
 * BlackFire Solutions Portal
 * HTML shell — public site + authenticated portal pages.
 * All data via fetch() → api/*.php endpoints.
 */
$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
$cspNonce = base64_encode(random_bytes(16));
// Absolute URL for the logo — used in OG/Twitter/JSON-LD meta tags
$companyLogoUrl = rtrim($cfg['base_url'] ?? '', '/') . '/' . ltrim($cfg['company_logo'] ?? 'blackfire_logo_transparent.png', './');
?>
<!DOCTYPE html>
<html lang="en" data-theme="light" data-state="public">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="csp-nonce" content="<?= htmlspecialchars($cspNonce, ENT_QUOTES) ?>">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' https://fonts.googleapis.com 'nonce-<?= $cspNonce ?>'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com; script-src 'self' 'nonce-<?= $cspNonce ?>'; connect-src 'self'; frame-src 'self' blob:; object-src 'none';">
<!-- Primary SEO -->
<meta name="description" content="BlackFire Solutions — PSIRA registered security company headquartered in Gauteng, operating nationwide. Specialists in next-generation security: drone surveillance, AI-powered CCTV, access control, armed response and integrated security systems across South Africa. 500+ clients. Call +27 68 912 6581.">
<meta name="keywords" content="security company South Africa, armed response Gauteng, drone security South Africa, drone surveillance Johannesburg, aerial security monitoring, CCTV installation South Africa, AI security systems, smart security Gauteng, access control nationwide, security guards South Africa, PSIRA registered security, integrated security solutions, remote monitoring South Africa, thermal imaging security, perimeter detection, electronic security Gauteng, event security South Africa, industrial security, commercial security Johannesburg, BlackFire Solutions">
<meta name="robots" content="index, follow">
<meta name="author" content="<?= htmlspecialchars($cfg['company_legal_name'] ?? $cfg['company_name'] ?? 'BlackFire Solutions') ?>">
<link rel="canonical" href="https://blackfiresolutions.co.za/">
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://blackfiresolutions.co.za/">
<meta property="og:title" content="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> — Security Engineered to Protect">
<meta property="og:description" content="PSIRA registered security company headquartered in Gauteng, operating nationwide. Specialists in drone surveillance, AI-powered CCTV, access control, armed response and integrated security technology across South Africa. 500+ clients. 50+ services.">
<meta property="og:image" content="<?= htmlspecialchars($companyLogoUrl) ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?>">
<meta property="og:locale" content="en_ZA">
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> — Security Engineered to Protect">
<meta name="twitter:description" content="PSIRA registered. Drone surveillance, AI CCTV, armed response nationwide. Based in Gauteng, operating across South Africa. Next-gen security technology. +27 68 912 6581">
<meta name="twitter:image" content="<?= htmlspecialchars($companyLogoUrl) ?>">
<!-- JSON-LD Structured Data -->
<script type="application/ld+json" nonce="<?= $cspNonce ?>">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://blackfiresolutions.co.za/",
  "name": <?= json_encode($cfg['company_legal_name'] ?? 'BlackFire Solutions (Pty) Ltd') ?>,
  "alternateName": <?= json_encode($cfg['company_name'] ?? 'BlackFire Solutions') ?>,
  "url": <?= json_encode($cfg['base_url'] ?? 'https://blackfiresolutions.co.za') ?>,
  "logo": "<?= htmlspecialchars($companyLogoUrl) ?>",
  "image": "<?= htmlspecialchars($companyLogoUrl) ?>",
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
<title><?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> - <?= htmlspecialchars($cfg['company_tagline'] ?? 'Fire, taught to behave.') ?></title>
<link rel="icon" href="./favicon.ico?v=20260521" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="./favicon-512x512.png?v=20260521">
<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png?v=20260521">
<link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png?v=20260521">
<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v=20260521">
<link rel="shortcut icon" href="./favicon.ico?v=20260521">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="portal.css?v=<?= filemtime(__DIR__.'/portal.css') ?>">
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     ■ PUBLIC SITE — v3 · IZILO-W-001
═══════════════════════════════════════════════════════ -->

<!-- V3 Nav — sticky, transparent→solid on scroll -->
<nav id="pub-nav">
  <a class="pub-brand" href="#top" aria-label="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> home">
    <img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-dark" alt="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?>" height="46">
  </a>
  <div class="pub-nav-links" id="navLinks">
    <a class="pub-nav-link active" href="#top">Home</a>
    <a class="pub-nav-link" href="#services">Services</a>
    <a class="pub-nav-link" href="#about">About</a>
    <a class="pub-nav-link" href="#faq">FAQ</a>
    <a class="pub-nav-link" href="#assess">Get Assessed</a>
  </div>
  <div class="v3-topbar-actions">
    <button class="theme-btn" type="button" data-action="toggleTheme" aria-label="Toggle light and dark mode" title="Toggle light and dark mode">
      <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
    </button>
    <button class="v3-btn v3-btn-ghost" type="button" data-action="goLogin">Umlilo Portal &rarr;</button>
    <button class="pub-ham-btn" id="v3ham" aria-label="Open menu" aria-expanded="false">&#8801;</button>
  </div>
</nav>

<!-- Legacy mobile nav stub (portal.js null-checks for it) -->
<div id="pub-mob-nav" aria-hidden="true"></div>

<div id="pub-site">

  <!-- V3 Emergency Topbar -->
  <div class="v3-topbar">
    <div><span class="pulse"></span>24/7 ARMED RESPONSE &middot; EMERGENCY LINE</div>
    <a href="tel:+27689126581">+27 68 912 6581</a>
  </div>

  <!-- Single-scroll public page — all sections inside pub-home -->
  <div id="pub-home" class="pub-page active">

    <!-- Ignition Preloader -->
    <div id="ignition" aria-hidden="true">
      <div class="ign-tri" id="ignTri"></div>
      <div class="ign-count">IGNITION <b id="ignPct">0%</b></div>
    </div>

    <!-- ── HERO ── -->
    <header class="hero" id="top">
      <div class="izilo-triangle-bg"></div>
      <div class="wrap">
        <div>
          <div class="eyebrow rv"><?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> &middot; PSIRA Registered &middot; Gauteng &rarr; Nationwide</div>
          <h1 class="rv">Security<br><span class="fire">engineered</span><br>to <span class="ember">protect.</span></h1>
          <p class="hero-sub rv">Drone surveillance, AI-monitored CCTV, access control, armed response and guard deployment &mdash; integrated under one command, purpose-built for industrial, commercial and residential sites across South Africa.</p>
          <div class="hero-actions rv">
            <a class="v3-btn v3-btn-fire" href="#assess">Request a Security Assessment</a>
            <a class="v3-btn v3-btn-ghost" href="#services">Our Services</a>
          </div>
          <div class="proof-chip rv">
            <span class="num" data-count="500" data-suffix="+">0</span>
            <span class="lbl">Active clients<br>nationwide</span>
          </div>
        </div>
        <div class="scene-frame hero-frame rv">
          <img src="https://images.unsplash.com/photo-1670689334799-cdc6777db8cc?auto=format&fit=crop&w=1100&h=1375&q=80" alt="Industrial plant fully lit at night" loading="lazy">
          <span class="brief-chip">IMG-BRIEF-01</span>
          <div class="img-fallback"><span class="ftri"></span><div class="fsub">Industrial site, night — as defended by BlackFire</div><div class="fnote">Photo loads in browser</div></div>
        </div>
      </div>
      <div class="scroll-cue"><span>SCROLL</span><span class="tri"></span></div>
    </header>

    <div class="izilo-band izilo-chevron drift" role="presentation"></div>

    <!-- ── ASSESSMENT WIZARD ── -->
    <section id="assess">
      <div class="wrap">
        <div class="sec-head rv">
          <div class="eyebrow">Get Assessed</div>
          <h2>Tell us about your site. We come back with a plan.</h2>
          <p class="sec-sub">Four short steps &mdash; under five minutes. A BlackFire assessor reviews every submission personally and responds within one business day. No templated quotes.</p>
        </div>
        <form class="wizard rv" id="wizard" novalidate>
          <div class="wiz-progress" aria-hidden="true">
            <span class="on"></span><span></span><span></span><span></span>
          </div>
          <div class="wiz-counter">STEP <b id="wizN">01</b> / 04 &middot; <span id="wizLbl">CONTACT</span></div>

          <div class="wiz-step on" data-step="1">
            <h3>Who should we contact?</h3>
            <div class="wiz-grid">
              <div class="field"><label for="w-name">Full name</label><input id="w-name" name="name" type="text" autocomplete="name" required></div>
              <div class="field"><label for="w-company">Company (optional)</label><input id="w-company" name="company" type="text" autocomplete="organization"></div>
              <div class="field"><label for="w-phone">Phone / WhatsApp</label><input id="w-phone" name="phone" type="tel" autocomplete="tel" required></div>
              <div class="field"><label for="w-email">Email</label><input id="w-email" name="email" type="email" autocomplete="email" required></div>
            </div>
          </div>

          <div class="wiz-step" data-step="2">
            <h3>Tell us about the site</h3>
            <div class="wiz-grid">
              <div class="field"><label for="w-type">Site type</label>
                <select id="w-type" name="site_type" required>
                  <option value="">Select&hellip;</option>
                  <option>Industrial / Plant</option><option>Commercial / Office</option>
                  <option>Residential Estate</option><option>Private Residence</option>
                  <option>Agricultural</option><option>Event / Temporary</option>
                </select>
              </div>
              <div class="field"><label for="w-prov">Province</label>
                <select id="w-prov" name="province" required>
                  <option value="">Select&hellip;</option>
                  <option>Gauteng</option><option>KwaZulu-Natal</option><option>Western Cape</option>
                  <option>Eastern Cape</option><option>Free State</option><option>Limpopo</option>
                  <option>Mpumalanga</option><option>North West</option><option>Northern Cape</option>
                </select>
              </div>
              <div class="field full"><label for="w-area">Town / area</label><input id="w-area" name="area" type="text" placeholder="e.g. Kempton Park" required></div>
            </div>
          </div>

          <div class="wiz-step" data-step="3">
            <h3>What does the site need?</h3>
            <div class="field full wiz-field-spaced">
              <label>Select all that apply</label>
              <div class="chiprow" id="needChips">
                <button type="button" class="chip" aria-pressed="false">Armed Response</button>
                <button type="button" class="chip" aria-pressed="false">Drone Surveillance</button>
                <button type="button" class="chip" aria-pressed="false">CCTV &amp; AI Monitoring</button>
                <button type="button" class="chip" aria-pressed="false">Access Control</button>
                <button type="button" class="chip" aria-pressed="false">Guard Deployment</button>
                <button type="button" class="chip" aria-pressed="false">Electronic Security</button>
                <button type="button" class="chip" aria-pressed="false">Perimeter Detection</button>
                <button type="button" class="chip" aria-pressed="false">Risk &amp; Compliance</button>
              </div>
            </div>
            <div class="field full"><label for="w-msg">Anything we should know? (optional)</label><textarea id="w-msg" name="message" maxlength="2000"></textarea></div>
          </div>

          <div class="wiz-step" data-step="4">
            <h3>Review &amp; submit</h3>
            <dl class="wiz-review" id="wizReview"></dl>
            <label class="consent">
              <input type="checkbox" id="w-consent" required>
              <span>I consent to <?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> processing these details to prepare a security assessment, in line with POPIA. Details are never shared with third parties.</span>
            </label>
          </div>

          <div class="wiz-step" data-step="5">
            <div class="wiz-done">
              <div class="tri"></div>
              <h3>Assessment request received.</h3>
              <p class="wiz-done-copy">A BlackFire assessor will contact you within one business day. Urgent? Call <strong>+27 68 912 6581</strong> &mdash; the line is live 24/7.</p>
            </div>
          </div>

          <div class="wiz-err" id="wizErr" role="alert"></div>
          <div class="wiz-nav" id="wizNav">
            <button type="button" class="btn-back" id="wizBack" disabled>Back</button>
            <button type="button" class="btn-fire-l" id="wizNext">Next</button>
          </div>
        </form>
      </div>
    </section>

    <div class="izilo-band izilo-diamond drift" role="presentation"></div>

    <!-- ── ABOUT ── -->
    <section class="sec-light" id="about">
      <div class="wrap about-grid">
        <div class="rv about-visual">
          <div class="scene-frame about-frame">
            <img src="https://images.unsplash.com/photo-1772743227731-e16af7c8d85a?auto=format&fit=crop&w=1100&h=825&q=80" alt="Officer on rooftop patrol" loading="lazy">
            <span class="brief-chip">IMG-BRIEF-02</span>
            <div class="img-fallback"><span class="ftri"></span><div class="fsub">BlackFire officer on site patrol</div><div class="fnote">Photo loads in browser</div></div>
          </div>
          <div class="float-badge float-badge-experience"><div class="v">10+</div><div class="k">Years protecting</div></div>
          <div class="float-badge float-badge-psira"><div class="v float-badge-code">PSIRA</div><div class="k">Registered</div></div>
        </div>
        <div>
          <div class="eyebrow rv">About <?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?></div>
          <h2 class="rv about-title">The security partner industrial South Africa runs on.</h2>
          <p class="rv about-copy">From chemical plants to residential estates, <?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> designs, deploys and operates integrated security &mdash; and gives every client live visibility through the Umlilo Portal: callouts, safety files, inspections and reporting in one place.</p>
          <ul class="about-points rv">
            <li><span class="dmark"></span>PSIRA registered, fully insured, personnel vetted and certified to national standards.</li>
            <li><span class="dmark"></span>One control room. Drones, CCTV, alarms and response units under a single command.</li>
            <li><span class="dmark"></span>Every callout, inspection and safety file logged and visible to you in the Umlilo Portal.</li>
            <li><span class="dmark"></span>Dedicated account manager, monthly reporting, scheduled site visits.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ── SERVICES ── -->
    <section id="services">
      <div class="izilo-triangle-bg"></div>
      <div class="wrap section-content">
        <div class="sec-head rv">
          <div class="eyebrow">What We Do</div>
          <h2>Eight disciplines. One command.</h2>
          <p class="sec-sub">Fifty services across eight specialist disciplines &mdash; designed to interlock, not to be sold piecemeal.</p>
        </div>
        <div id="home-cats" class="home-cats"></div>
        <div id="svc-filters" class="services-filter-row pub-svc-filters"></div>
        <div id="svc-grid" class="svc-grid"></div>
        <div class="svc-more rv"><a href="#assess">REQUEST A SERVICE ASSESSMENT &rarr;</a></div>
      </div>
    </section>

    <!-- ── STATS ── -->
    <section class="stats">
      <div class="izilo-triangle-bg"></div>
      <div class="wrap stats-grid">
        <div class="stat rv"><div class="v"><span data-count="500">0</span><small>+</small></div><div class="k">Active clients</div></div>
        <div class="stat rv"><div class="v"><small>&lt;</small><span data-count="4">0</span><small>min</small></div><div class="k">Avg. response</div></div>
        <div class="stat rv"><div class="v">24<small>/7</small></div><div class="k">Control room</div></div>
        <div class="stat rv"><div class="v"><span data-count="50">0</span><small>+</small></div><div class="k">Services offered</div></div>
      </div>
    </section>

    <div class="izilo-band izilo-diamond drift" role="presentation"></div>

    <!-- ── TESTIMONIALS ── -->
    <section>
      <div class="wrap">
        <div class="sec-head rv sec-head-centered">
          <div class="eyebrow eyebrow-centered">Client Feedback</div>
          <h2 class="heading-centered">Sites that stayed protected. Clients that stayed.</h2>
        </div>
        <div class="tst rv" id="tst" aria-live="polite">
          <blockquote id="tstQ"></blockquote>
          <div class="who" id="tstW"></div>
          <div class="where" id="tstP"></div>
        </div>
        <div class="tst-dots" id="tstDots" role="tablist" aria-label="Testimonials"></div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section class="sec-light" id="faq">
      <div class="wrap">
        <div class="sec-head rv">
          <div class="eyebrow">Questions, answered</div>
          <h2>Before you sign anything, know everything.</h2>
        </div>
        <div class="faq-grid">
          <div class="rv">
            <div class="scene-frame faq-frame">
              <img src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&h=1200&q=80" alt="Wall of surveillance cameras" loading="lazy">
              <span class="brief-chip">IMG-BRIEF-03</span>
              <div class="img-fallback"><span class="ftri"></span><div class="fsub">Surveillance camera wall</div><div class="fnote">Photo loads in browser</div></div>
            </div>
            <div class="faq-call">
              <div class="k">Prefer to talk it through?</div>
              <a class="v" href="tel:+27689126581">+27 68 912 6581</a>
            </div>
          </div>
          <div>
            <details class="acc rv" open><summary>What does a security assessment involve?<span class="mk"></span></summary><p>An assessor visits your site, walks the perimeter and entry points, reviews existing systems and incident history, and maps your actual risk profile. You receive a written assessment with recommendations &mdash; whether or not you proceed with us.</p></details>
            <details class="acc rv"><summary>How fast is armed response, really?<span class="mk"></span></summary><p>In covered zones our average is under four minutes. During your assessment we tell you honestly what response time your specific location can expect &mdash; before you sign, not after.</p></details>
            <details class="acc rv"><summary>What is the Umlilo Portal?<span class="mk"></span></summary><p>Our client portal. Every callout, inspection, safety file and invoice on your account is logged and visible to you in real time. It is how we stay accountable &mdash; you see what we see.</p></details>
            <details class="acc rv"><summary>Are your officers PSIRA registered?<span class="mk"></span></summary><p>Yes &mdash; <?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?> is a PSIRA registered company and every officer we deploy is individually registered, vetted and trained to national standards.</p></details>
            <details class="acc rv"><summary>Can you take over from our current provider?<span class="mk"></span></summary><p>Yes. We manage handovers regularly &mdash; including notice-period overlap, equipment audits and re-keying or re-coding of access systems so there is no coverage gap on day one.</p></details>
          </div>
        </div>
      </div>
    </section>

    <!-- ── HOW IT WORKS ── -->
    <section>
      <div class="wrap">
        <div class="sec-head rv">
          <div class="eyebrow">How it works</div>
          <h2>From first call to full deployment.</h2>
        </div>
        <div class="steps">
          <div class="step rv"><div class="n">01</div><h3>Assessment</h3><p>Submit the form or call. An assessor visits your site, maps the risk profile and documents what you actually need &mdash; in writing.</p></div>
          <div class="step rv"><div class="n">02</div><h3>Proposal</h3><p>You receive an itemised proposal: services, equipment, deployment plan and pricing. No vague line items, no hidden costs, no pressure.</p></div>
          <div class="step rv"><div class="n">03</div><h3>Deployment</h3><p>Systems installed, officers posted, control room live. Your Umlilo Portal access is activated on day one &mdash; visibility from the first shift.</p></div>
        </div>
      </div>
    </section>

    <div class="izilo-band izilo-chevron drift" role="presentation"></div>

    <!-- ── CTA BANNER ── -->
    <section class="cta-banner">
      <div class="scene-frame cta-frame">
        <img src="https://images.unsplash.com/photo-1642285709726-f9eb035b034b?auto=format&fit=crop&w=2100&h=800&q=80" alt="Wide industrial plant at night" loading="lazy">
        <span class="brief-chip">IMG-BRIEF-04</span>
        <div class="img-fallback"><span class="ftri"></span><div class="fsub">Industrial plant, secured by BlackFire</div><div class="fnote">Photo loads in browser</div></div>
      </div>
      <div class="cta-overlay">
        <div class="wrap">
          <h2 class="rv">Your site.<br><span class="ember">Secured properly.</span></h2>
          <p class="rv">A tailored assessment and itemised proposal within one business day.</p>
          <a class="v3-btn v3-btn-fire rv" href="#assess">Get Started Now</a>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer>
      <div class="wrap foot-grid">
        <div class="foot-brand">
          <img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-dark foot-logo" alt="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?>">
          <div class="foot-tag">Fire, taught to behave.</div>
          <p>PSIRA registered security, headquartered in Gauteng, operating nationwide. Drone surveillance, AI CCTV, armed response and integrated systems &mdash; with full client visibility through the Umlilo Portal.</p>
        </div>
        <div class="foot-col">
          <h4>Services</h4>
          <a href="#services">Armed Response</a>
          <a href="#services">Drone Surveillance</a>
          <a href="#services">CCTV &amp; AI Monitoring</a>
          <a href="#services">Access Control</a>
          <a href="#services">Guard Deployment</a>
        </div>
        <div class="foot-col">
          <h4>Company</h4>
          <a href="#about">About</a>
          <a href="#faq">FAQ</a>
          <a href="#assess">Request Assessment</a>
          <a href="tel:+27689126581">+27 68 912 6581</a>
          <a href="mailto:<?= htmlspecialchars($cfg['company_email'] ?? 'info@blackfiresolutions.co.za') ?>"><?= htmlspecialchars($cfg['company_email'] ?? 'info@blackfiresolutions.co.za') ?></a>
        </div>
        <div class="foot-col news">
          <h4>Stay informed</h4>
          <label for="newsEmail">Security advisories and service updates. No noise.</label>
          <div class="news-row">
            <input id="newsEmail" type="email" placeholder="you@company.co.za" autocomplete="email">
            <button type="button" aria-label="Subscribe" id="newsBtn"><span class="udia"></span></button>
          </div>
          <div class="news-note">POPIA-compliant. Unsubscribe any time.</div>
          <span class="foot-portal-link" data-action="goLogin">Umlilo Portal &rarr;</span>
        </div>
      </div>
      <div class="wrap foot-bottom">
        <div>&copy; <?= date('Y') ?> <?= htmlspecialchars(strtoupper($cfg['company_legal_name'] ?? 'BLACKFIRE SOLUTIONS (PTY) LTD')) ?> &middot; PSIRA REGISTERED &middot; ALL RIGHTS RESERVED</div>
        <div>BLKFR &middot; THERMAL GEOMETRY &middot; IZILO-W-001</div>
      </div>
      <div class="izilo-band izilo-diamond band-flush" role="presentation"></div>
    </footer>

  </div><!-- /pub-home -->

</div><!-- /pub-site -->

<!-- WhatsApp FAB (visible in public state only via portal.js) -->
<a class="wa-fab d-none" id="wa-fab" aria-label="Chat on WhatsApp" href="https://api.whatsapp.com/send/?phone=27689126581&amp;text=Hi+BlackFire+Solutions+%E2%80%94+I%27d+like+to+request+a+security+assessment.&amp;type=phone_number&amp;app_absent=0" target="_blank" rel="noopener">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2.2-.2 3.6a11.6 11.6 0 0 0 4.6 4.3c1.7.8 2.4.9 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>
</a>

<!-- ═══════════════════════════════════════════════════════
     ■ LOGIN SCREEN
═══════════════════════════════════════════════════════ -->
<div id="login-screen">
  <!-- ── Sign In Panel ── -->
  <div class="login-card" id="login-panel">
    <div class="login-header">
      <div class="login-mark" data-action="goPublic" title="Back to home">
        <img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-dark" height="74"><img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-light" height="74">
      </div>
      <div class="login-title">BLACKFIRE SOLUTIONS</div>
      <div class="login-sub">SECURE ACCESS</div>
    </div>
    <div class="login-body">
      <div id="login-error" class="login-error">Incorrect username or password.</div>
      <div class="login-group">
        <label class="login-label">Username</label>
        <input class="login-input" id="l-user" placeholder="username">
      </div>
      <div class="login-group">
        <label class="login-label">Password</label>
        <input class="login-input" type="password" id="l-pass" placeholder="password">
      </div>
      <div class="login-group">
        <label class="login-label" id="captcha-question">Security check: loading…</label>
        <input class="login-input" type="number" id="l-captcha" placeholder="answer" autocomplete="off">
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
        <img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-dark" height="74"><img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-light" height="74">
      </div>
      <div class="login-title">RESET PASSWORD</div>
      <div class="login-sub">ENTER YOUR USERNAME</div>
    </div>
    <div class="login-body">
      <div id="forgot-msg" class="login-error"></div>
      <div class="login-group">
        <label class="login-label">Username</label>
        <input class="login-input" id="fp-user" placeholder="your username">
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
        <img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-dark" height="74"><img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" class="bf-logo-light" height="74">
      </div>
      <div class="login-title">NEW PASSWORD</div>
      <div class="login-sub">CHOOSE A NEW PASSWORD</div>
    </div>
    <div class="login-body">
      <div id="newpass-msg" class="login-error"></div>
      <div class="login-group">
        <label class="login-label">New Password</label>
        <input class="login-input" type="password" id="np-pass1" placeholder="new password">
      </div>
      <div class="login-group">
        <label class="login-label">Confirm Password</label>
        <input class="login-input" type="password" id="np-pass2" placeholder="confirm password">
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
    <img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" alt="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?>" height="50" class="bf-logo-dark">
    <img src="<?= htmlspecialchars($cfg['company_logo'] ?? './blackfire_logo_transparent.png') ?>" alt="<?= htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') ?>" height="50" class="bf-logo-light">
    <div class="ptb-right">
      <span id="ptb-user"></span>
      <button class="theme-btn" type="button" data-action="toggleTheme" aria-label="Toggle light and dark mode" title="Toggle light and dark mode">
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
        <div class="ptitle">Services</div><div class="psub">50 SERVICES  -  8 CATEGORIES</div>
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
            <div class="fgroup ffull"><label class="flbl">Message</label><textarea class="finput" id="pcf-msg" rows="3" placeholder="Requirements..."></textarea></div>
          </div>
          <div class="mt2"><button class="btn btn-p btn-full" data-action="submitEnquiry">Submit Enquiry</button></div>
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
        <button class="btn btn-g btn-s dash-edit-btn" data-action="showDashEditor">
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
      <div class="srow"><input type="text" class="sinput" id="tx-search" placeholder="Search..."><button class="btn btn-p btn-s" data-action="openTxModal">+ Log Transaction</button></div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Ref</th><th>Credit</th><th>Debit</th></tr></thead><tbody id="tx-table"></tbody></table></div></div>
    </div>

    <!-- INVOICES -->
    <div id="p-invoices" class="ppage">
      <div class="ptitle">Invoices</div><div class="psub">BILLING  -  PAYMENT TRACKING</div>
      <div class="srow">
        <input type="text" class="sinput" id="inv-search" placeholder="Search invoices...">
        <select class="sinput sinput-narrow" id="inv-filter"><option value="">All</option><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select>
        <button class="btn btn-p btn-s" id="btn-newinv" data-action="navPage" data-page="p-new-invoice">+ New Invoice</button>
      </div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Invoice #</th><th>Client</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody id="inv-table"></tbody></table></div></div>
    </div>

    <!-- QUOTES -->
    <div id="p-quotes" class="ppage">
      <div class="ptitle">Quotes</div><div class="psub">PROPOSALS  -  APPROVALS</div>
      <div class="srow">
        <input type="text" class="sinput" id="qte-search" placeholder="Search quotes...">
        <select class="sinput sinput-narrow" id="qte-filter"><option value="">All</option><option>Draft</option><option>Sent</option><option>Pending Approval</option><option>Approved</option><option>Declined</option></select>
        <button class="btn btn-p btn-s" id="btn-newq" data-action="navPage" data-page="p-new-quote">+ New Quote</button>
      </div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Quote #</th><th>Client</th><th>Total</th><th>Submitted By</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead><tbody id="qte-table"></tbody></table></div></div>
    </div>

    <!-- Legacy route target; portal.js redirects this page to Tracker > Call Log. -->
    <div id="p-callouts" class="ppage"></div>

    <!-- TIMELINE -->
    <div id="p-timeline" class="ppage">
      <div class="ptitle">Site Timeline</div><div class="psub">ACTIVITY LOG</div>
      <div class="panel"><div class="pb" id="timeline-content"></div></div>
    </div>

    <!-- TRACKER — Company workstreams + operational call log -->
    <div id="p-tracker" class="ppage">
      <div class="ptitle">Tracker</div><div class="psub">ADMIN · SALES · GENERAL · CALL LOG</div>
      <div class="srow">
        <div id="tracker-tabs" class="pnav-inline"></div>
        <button class="btn btn-p btn-s" id="btn-new-task" data-action="navPage" data-page="p-new-task">+ New Task</button>
      </div>
      <div id="tracker-task-view" class="panel"><div class="tw">
        <table>
          <thead><tr><th>Ref</th><th>Title</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Created</th><th>Start</th><th>End</th><th>Due</th><th>Actions</th></tr></thead>
          <tbody id="tracker-table"></tbody>
        </table>
      </div></div>
      <div id="tracker-calllog-view" hidden>
        <div class="srow">
          <input type="text" class="sinput" id="co-search" placeholder="Search job, service, invoice no., quote no...">
          <select class="sinput sinput-narrow" id="co-filter"><option value="">All</option><option>Open</option><option>In Progress</option><option>Completed</option><option>Invoiced</option></select>
          <button class="btn btn-p btn-s" id="btn-newco" data-action="navPage" data-page="p-new-callout">+ Log Call</button>
        </div>
        <div class="panel"><div class="tw">
          <table>
            <thead><tr><th>Job ID</th><th>Service</th><th>Assigned To</th><th>PO #</th><th>Priority</th><th>Status</th><th>Logged By</th><th>Created</th><th>Start</th><th>End</th><th>Due</th><th>Actions</th></tr></thead>
            <tbody id="co-table"></tbody>
          </table>
        </div></div>
      </div>
    </div>

    <!-- NEW TASK -->
    <div id="p-new-task" class="ppage">
      <div class="ptitle">New Task</div><div class="psub">CREATE INTERNAL TASK</div>
      <div class="panel"><div class="pb">
        <div class="req-legend"><span class="req">*</span> Required field</div>
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Category <span class="req">*</span></label>
            <select class="finput" id="ntk-category"></select>
          </div>
          <div class="fgroup"><label class="flbl">Title <span class="req">*</span></label>
            <input class="finput" id="ntk-title" placeholder="Short task title">
          </div>
          <div class="fgroup fgroup-full"><label class="flbl">Description</label>
            <textarea class="finput" id="ntk-desc" rows="3" placeholder="Optional detail…"></textarea>
          </div>
          <div class="fgroup"><label class="flbl">Priority</label>
            <select class="finput" id="ntk-priority">
              <option>Low</option><option selected>Normal</option><option>High</option><option>Urgent</option>
            </select>
          </div>
          <div class="fgroup"><label class="flbl">Assign To (username)</label>
            <input class="finput" id="ntk-assigned" placeholder="e.g. j.shange">
          </div>
          <div class="fgroup"><label class="flbl">Start Date &amp; Time</label><input class="finput" type="datetime-local" id="ntk-start"></div>
          <div class="fgroup"><label class="flbl">End Date &amp; Time</label><input class="finput" type="datetime-local" id="ntk-end"></div>
          <div class="fgroup"><label class="flbl">Due Date &amp; Time</label><input class="finput" type="datetime-local" id="ntk-due"></div>
        </div>
        <div class="mt3 flex-end">
          <button class="btn btn-g btn-s mr1" data-action="navPage" data-page="p-tracker">Cancel</button>
          <button class="btn btn-p" data-action="saveNewTask">Create Task →</button>
        </div>
      </div></div>
    </div>

    <!-- STATEMENT -->
    <div id="p-statement" class="ppage">
      <div class="ptitle">Account Statement</div><div class="psub">AECI CHEMPARK  -  LEDGER</div>
      <div id="stmt-content"></div>
    </div>

    <!-- RECONCILIATION -->
    <div id="p-reconcile" class="ppage">
      <div class="ptitle">Reconciliation</div><div class="psub">PORTAL vs STATEMENT</div>
      <div id="recon-content"></div>
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
        <div class="req-legend"><span class="req">*</span> Required field</div>
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Client <span class="req">*</span></label><select class="finput" id="nc-client"><option value="">— Select Client —</option></select></div>
          <div class="fgroup"><label class="flbl">Service / Fault Type <span class="req">*</span></label><input class="finput" id="nc-service" placeholder="e.g. Armed Response, Alarm Fault"></div>
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
          <div class="fgroup"><label class="flbl">Job No. <span class="flbl-hint">— your job sheet reference; leave blank to auto-generate</span></label><input class="finput" id="nc-job-no" placeholder="Auto-generated if blank"></div>
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
          <div class="fgroup"><label class="flbl">Client <span class="req">*</span></label><select class="finput" id="nq-client"><option value="">— Select Client —</option></select></div>
          <div class="fgroup"><label class="flbl">Valid Until <span class="req">*</span></label><input type="date" class="finput" id="nq-valid"></div>
          <div class="fgroup"><label class="flbl">Linked Callout</label><select class="finput" id="nq-callout-ref"><option value="">— None (standalone quote) —</option></select></div>
          <div class="fgroup" id="nq-status-group"><label class="flbl">Status</label><select class="finput" id="nq-status"><option>Draft</option><option>Sent</option></select></div>
          <div class="fgroup ffull"><label class="flbl">Quote No. <span class="flbl-hint">— number shown on your document (e.g. AI20042026); leave blank to auto-generate</span></label><input class="finput" id="nq-quote-no" placeholder="Auto-generated if blank"></div>
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
        <div class="req-legend"><span class="req">*</span> Required field</div>
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Client <span class="req">*</span></label><select class="finput" id="ni-client"><option value="">— Select Client —</option></select></div>
          <div class="fgroup"><label class="flbl">Amount (incl. VAT) <span class="req">*</span></label><input type="number" class="finput" id="ni-amount" placeholder="0.00"></div>
          <div class="fgroup"><label class="flbl">Due Date <span class="req">*</span></label><input type="date" class="finput" id="ni-due"></div>
          <div class="fgroup"><label class="flbl">Status</label><select class="finput" id="ni-status"><option>Draft</option><option>Sent</option></select></div>
          <div class="fgroup"><label class="flbl">PO Reference</label><input class="finput" id="ni-po" placeholder="PO number if applicable"></div>
          <div class="fgroup"><label class="flbl">Linked Quote</label><select class="finput" id="ni-quote-ref"><option value="">— None —</option></select></div>
          <div class="fgroup"><label class="flbl">Linked Callout</label><select class="finput" id="ni-callout-ref"><option value="">— None —</option></select></div>
          <div class="fgroup ffull"><label class="flbl">Invoice No. <span class="flbl-hint">— number shown on your document; leave blank to auto-generate</span></label><input class="finput" id="ni-invoice-no" placeholder="Auto-generated if blank"></div>
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
        <input type="text" class="sinput" id="cli-search" placeholder="Search clients...">
        <button class="btn btn-p btn-s" data-action="openClientModal">+ Add Client</button>
      </div>
      <div class="panel">
        <div class="tw">
          <table>
            <thead><tr><th>Name</th><th>Primary Contact</th><th>Phone</th><th>VAT No.</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="clients-table"></tbody>
          </table>
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
        <input type="text" class="sinput" id="sf-search" placeholder="Search contractors...">
        <select class="sinput sinput-narrow" id="sf-filter-status">
          <option value="">All Files</option>
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
        </select>
        <button class="btn btn-p btn-s" data-action="newSafetyAudit">+ New Audit</button>
        <a class="btn btn-g btn-s" href="reports.php">Reports</a>
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
                <div class="fgroup"><label class="flbl">Contractor Rep</label><select class="finput" id="sah-rep"><option value="">— Select —</option></select></div>
                <div class="fgroup"><label class="flbl">16.2 Appointee</label><select class="finput" id="sah-appointee"><option value="">— Select —</option></select></div>
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
            <button class="btn btn-g" data-action="navSafety">Cancel</button>
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
          <button class="btn btn-g btn-s" data-action="navSafety">&#8592; Back</button>
          <button class="btn btn-g btn-s" data-action="editSafetyFile">Edit</button>
          <button class="btn btn-g btn-s" data-action="safGenerateTracker" title="Generate contractor action-plan tracker as a downloadable HTML file">&#8659; Tracker</button>
          <button class="btn btn-s saf-approve-btn btn-approve-action" id="saf-approve-btn" data-action="approveSafetyFile">&#10003; Approve</button>
          <button class="btn btn-s btn-deactivate-action" id="saf-deactivate-btn" data-action="deactivateSafetyFile" title="Deactivate this safety file — record is retained for audit"><svg class="btn-icon-leading" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>Deactivate</button>
          <button class="btn btn-p btn-s" data-action="safDownloadPack" title="Download full safety file report as standalone HTML">&#8595; Download Pack</button>
        </div>
      </div>
      <div id="saf-detail-content"></div>
    </div><!-- /p-safety-detail -->

    <!-- AUDIT LOG -->
    <div id="p-audit" class="ppage">
      <div class="ptitle">Audit Log</div><div class="psub">SECURITY  -  ACCESS RECORDS</div>
      <div class="srow"><input type="text" class="sinput" id="audit-search" placeholder="Filter log..."></div>
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
          <button class="btn btn-g btn-s" id="perm-cols-btn" data-action="togglePermCols">&#9664; Collapse Permissions</button>
        </div>
        <div class="tw"><table id="users-rbac-table"><thead>
          <tr>
            <th>Username</th><th>Name</th><th>Email</th><th>Role</th>
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
<div id="info-overlay" data-action="toggleInfoMode"></div>
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
<div id="modal-overlay" data-action="closeModalBackdrop">
  <div class="modal"><div class="mhdr"><div class="mttl" id="modal-ttl"></div><button class="mclose" data-action="closeModalDirect">✕</button></div><div class="mbdy" id="modal-bdy"></div></div>
</div>

<!-- CONFIRM DIALOG -->
<div id="confirm-overlay">
  <div class="confirm-dialog">
    <div class="confirm-hdr"><div class="confirm-ttl" id="confirm-ttl">Confirm</div></div>
    <div class="confirm-bdy" id="confirm-bdy"></div>
    <div class="confirm-actions">
      <button class="btn btn-g" id="confirm-cancel">Cancel</button>
      <button class="btn btn-d" id="confirm-ok">Confirm</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="toaster"></div>


<!-- Back to top button -->
<button id="back-to-top" data-action="scrollToTop" title="Back to top"></button>

<script nonce="<?= $cspNonce ?>">
const COMPANY = <?= json_encode([
  'name'    => $cfg['company_legal_name'] ?? $cfg['company_name'],
  'reg'     => $cfg['company_reg']    ?? '',
  'vat'     => $cfg['company_vat']    ?? '',
  'phone'   => $cfg['company_phone']  ?? '',
  'mobile'  => $cfg['company_mobile'] ?? '',
  'email'   => $cfg['company_email']  ?? '',
  'addr'    => $cfg['company_addr']   ?? '',
], JSON_UNESCAPED_SLASHES) ?>;
</script>
<script src="portal.js?v=<?= filemtime(__DIR__.'/portal.js') ?>"></script>
