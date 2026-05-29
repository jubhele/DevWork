<?php
/**
 * BlackFire Solutions Portal
 * HTML shell — public site + authenticated portal pages.
 * All data via fetch() → api/*.php endpoints.
 */
// Find portal root regardless of depth (deployed: portal_root/includes/ · local: dev-only/refactored_portal/includes/)
$_bhk_root = __DIR__;
while (!is_file($_bhk_root . '/config/config.php') && dirname($_bhk_root) !== $_bhk_root) {
    $_bhk_root = dirname($_bhk_root);
}
$cfg = require $_bhk_root . '/config/config.php';
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
<link rel="stylesheet" href="css/portal_main.css?v=<?= filemtime($_bhk_root.'/css/portal_main.css') ?>">
</head>
<body>
