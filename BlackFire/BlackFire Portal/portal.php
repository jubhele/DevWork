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
<style>
/* ═══════════════════════════════════════════════════════
   THERMAL GEOMETRY - BRAND TOKEN SYSTEM
   Dark + Light  -  Shared across all states
═══════════════════════════════════════════════════════ */
:root{
  --ember:#C0392B;--orange:#E05A1A;--amber:#F07820;--gold:#F5A623;
  --green:#1A7A40;--warn:#E67E22;--blue:#3B82F6;
}
[data-theme="dark"]{
  --bg:#0A0E19;--surface:#141B26;--surface2:#1E2530;--surface3:#2B3340;
  --border:#2B3340;--border2:#3D4A58;
  --text:#E0E4EA;--text2:#A8B2BE;--muted:#7A8699;
  --accent:#F07820;
  --grid:rgba(245,166,35,.025);
  --amb-glow:rgba(240,120,32,.08);--emb-glow:rgba(192,57,43,.12);
  --grn-glow:rgba(26,122,64,.12);--blu-glow:rgba(59,130,246,.1);
  --hero-grad:linear-gradient(135deg,#0A0E19 0%,#141B26 50%,#1E2530 100%);
  --scrolltrack:#141B26;--scrollthumb:#2B3340;
  --th-bg:#1E2530;--row-hover:rgba(43,51,64,.45);
  --pill-paid-bg:rgba(26,122,64,.15);--pill-paid-bdr:rgba(26,122,64,.3);--pill-paid-txt:#2ecc71;
  --pill-inv-bg:rgba(245,166,35,.12);--pill-inv-bdr:rgba(245,166,35,.25);--pill-inv-txt:#F5A623;
  --pill-ovr-bg:rgba(192,57,43,.15);--pill-ovr-bdr:rgba(192,57,43,.3);--pill-ovr-txt:#C0392B;
  --pill-dft-bg:rgba(122,134,153,.1);--pill-dft-bdr:rgba(122,134,153,.2);--pill-dft-txt:#7A8699;
  --pill-opn-bg:rgba(59,130,246,.1);--pill-opn-bdr:rgba(59,130,246,.2);--pill-opn-txt:#3B82F6;
  --pill-prg-bg:rgba(240,120,32,.1);--pill-prg-bdr:rgba(240,120,32,.25);--pill-prg-txt:#F07820;
}
[data-theme="light"]{
  --bg:#F5F1EA;--surface:#FFFFFF;--surface2:#EDE8DE;--surface3:#E4DED2;
  --border:#C8C1B3;--border2:#B8B1A3;
  --text:#1A1814;--text2:#4A4638;--muted:#7A7566;
  --accent:#C94A10;
  --grid:rgba(201,74,16,.035);
  --amb-glow:rgba(201,74,16,.06);--emb-glow:rgba(168,42,30,.08);
  --grn-glow:rgba(26,122,64,.08);--blu-glow:rgba(59,130,246,.06);
  --hero-grad:linear-gradient(135deg,#F5F1EA 0%,#EDE8DE 50%,#E4DED2 100%);
  --scrolltrack:#EDE8DE;--scrollthumb:#C8C1B3;
  --th-bg:#EDE8DE;--row-hover:rgba(200,193,179,.3);
  --pill-paid-bg:rgba(26,122,64,.1);--pill-paid-bdr:rgba(26,122,64,.25);--pill-paid-txt:#1A6633;
  --pill-inv-bg:rgba(212,138,21,.12);--pill-inv-bdr:rgba(212,138,21,.3);--pill-inv-txt:#9A6A0A;
  --pill-ovr-bg:rgba(168,42,30,.1);--pill-ovr-bdr:rgba(168,42,30,.25);--pill-ovr-txt:#A82A1E;
  --pill-dft-bg:rgba(122,117,102,.1);--pill-dft-bdr:rgba(122,117,102,.2);--pill-dft-txt:#5A5448;
  --pill-opn-bg:rgba(59,130,246,.08);--pill-opn-bdr:rgba(59,130,246,.2);--pill-opn-txt:#2563EB;
  --pill-prg-bg:rgba(201,74,16,.08);--pill-prg-bdr:rgba(201,74,16,.2);--pill-prg-txt:#C94A10;
}

/* ─── RESET ─── */
*{margin:0;padding:0;box-sizing:border-box}
html{font-size:14px;scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Instrument Sans',sans-serif;min-height:100vh;overflow-x:hidden;transition:background .25s,color .25s}
input,select,textarea,button{font-family:'Instrument Sans',sans-serif}
a{color:inherit;text-decoration:none}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:var(--scrolltrack)}
::-webkit-scrollbar-thumb{background:var(--scrollthumb)}
/* ── LOGO THEME SWAP ── */
.bf-logo-dark { display:block }
.bf-logo-light { display:none }
[data-theme="light"] .bf-logo-dark { display:none }
[data-theme="light"] .bf-logo-light { display:block }
.pub-brand-mark { display:none }  /* hide old SVG mark */

body::before{content:'';position:fixed;inset:0;background-image:url('./blackfire_logo_transparent.png'),linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:auto,48px 48px,48px 48px;background-position:center,0 0,0 0;background-attachment:fixed;background-repeat:no-repeat;opacity:0.08;pointer-events:none;z-index:0}

/* ═══════════════════════════════════════════════════════
   STATE VISIBILITY
═══════════════════════════════════════════════════════ */
#pub-site,#login-screen,#portal-shell{display:none}
[data-state="public"] #pub-site{display:block}
[data-state="login"]  #login-screen{display:flex}
[data-state="portal"] #portal-shell{display:flex}

/* ═══════════════════════════════════════════════════════
   ■ PUBLIC SITE
═══════════════════════════════════════════════════════ */
/* ── Public Nav ── */
#pub-nav{
  position:fixed;top:0;left:0;right:0;z-index:100;height:60px;
  background:var(--surface);border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 clamp(16px,4vw,48px);
  transition:background .25s,border-color .25s;
}
.pub-brand{display:flex;align-items:center;gap:10px;cursor:pointer}
.pub-brand-mark{width:26px;height:26px}
.pub-brand-name{font-family:'Big Shoulders Display',sans-serif;font-size:18px;font-weight:900;color:var(--text);letter-spacing:.3px}
.pub-brand-name em{color:var(--amber);font-style:normal}
.pub-nav-links{display:flex;align-items:center;gap:4px}
.pub-nav-link{
  padding:7px 14px;font-size:13px;color:var(--text2);
  cursor:pointer;border-radius:2px;transition:all .15s;
  font-weight:500;letter-spacing:.2px;
}
.pub-nav-link:hover,.pub-nav-link.active{color:var(--text);background:var(--surface2)}
.pub-nav-right{display:flex;align-items:center;gap:10px}
.btn-login{
  padding:7px 18px;background:var(--accent);color:#fff;border:none;
  cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;
  letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;
  transition:opacity .15s;
}
.btn-login:hover{opacity:.85}
.theme-btn{
  display:flex;align-items:center;gap:5px;padding:6px 10px;
  background:var(--surface2);border:1px solid var(--border);border-radius:20px;
  cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;
  color:var(--muted);letter-spacing:.5px;transition:all .2s;
}
.theme-btn:hover{border-color:var(--accent);color:var(--accent)}
.theme-btn svg{width:12px;height:12px}
.theme-btn .sun{display:none}.theme-btn .moon{display:block}
[data-theme="light"] .theme-btn .sun{display:block}
[data-theme="light"] .theme-btn .moon{display:none}
@media(max-width:768px){.pub-nav-links{display:none}}

/* ── Public Pages ── */
.pub-page{display:none;position:relative;z-index:1}
.pub-page.active{display:block}

/* ── HERO ── */
#pub-home{padding-top:60px}
.hero-section{
  min-height:92vh;display:flex;align-items:center;justify-content:center;
  background:var(--hero-grad);position:relative;overflow:hidden;
  padding:80px clamp(16px,6vw,80px);
}
.hero-section::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 60% 50% at 70% 50%,rgba(192,57,43,.06) 0%,transparent 70%);
  pointer-events:none;
}
.hero-inner{max-width:680px}
.hero-eyebrow{
  font-family:'IBM Plex Mono',monospace;font-size:10px;
  letter-spacing:4px;color:var(--amber);text-transform:uppercase;
  margin-bottom:24px;display:flex;align-items:center;gap:12px;
}
.hero-eyebrow::after{content:'';display:block;height:1px;width:40px;background:var(--amber)}
.hero-title{
  font-family:'Big Shoulders Display',sans-serif;
  font-size:clamp(52px,7vw,88px);font-weight:900;line-height:.95;
  letter-spacing:-2px;color:var(--text);margin-bottom:20px;
}
.hero-title .accent{color:var(--amber)}
.hero-title .ember{color:var(--ember)}
.hero-sub{font-size:16px;color:var(--text2);line-height:1.6;margin-bottom:36px;max-width:520px}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:56px}
.btn-primary-lg{
  padding:14px 32px;background:var(--accent);color:#fff;border:none;
  cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;
  letter-spacing:2px;text-transform:uppercase;border-radius:2px;
  transition:opacity .15s;
}
.btn-primary-lg:hover{opacity:.85}
.btn-outline-lg{
  padding:13px 28px;background:transparent;color:var(--text2);
  border:1px solid var(--border);cursor:pointer;
  font-family:'IBM Plex Mono',monospace;font-size:11px;
  letter-spacing:2px;text-transform:uppercase;border-radius:2px;
  transition:all .15s;
}
.btn-outline-lg:hover{border-color:var(--accent);color:var(--accent)}
.hero-stats{display:flex;gap:36px;flex-wrap:wrap}
.hero-stat{}
.hero-stat-val{font-family:'Big Shoulders Display',sans-serif;font-size:36px;font-weight:900;color:var(--text);letter-spacing:-.5px}
.hero-stat-label{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-top:2px}

/* ── Live Bar ── */
.live-bar{
  background:var(--surface2);border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);padding:10px 0;overflow:hidden;
}
.live-bar-inner{
  display:flex;gap:48px;animation:ticker 30s linear infinite;
  white-space:nowrap;width:max-content;
}
.live-item{
  display:flex;align-items:center;gap:8px;
  font-family:'IBM Plex Mono',monospace;font-size:10px;
  color:var(--muted);letter-spacing:1px;text-transform:uppercase;
}
.live-dot{width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 5px rgba(26,122,64,.6);animation:pulse 2s ease infinite}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

/* ── Categories Section ── */
.pub-section{padding:72px clamp(16px,6vw,80px);max-width:1280px;margin:0 auto}
.section-eyebrow{
  font-family:'IBM Plex Mono',monospace;font-size:9px;
  letter-spacing:3px;color:var(--amber);text-transform:uppercase;
  margin-bottom:12px;
}
.section-title{
  font-family:'Big Shoulders Display',sans-serif;font-size:clamp(28px,4vw,44px);
  font-weight:700;color:var(--text);letter-spacing:-.5px;margin-bottom:8px;
}
.section-sub{font-size:14px;color:var(--muted);max-width:500px;margin-bottom:40px;line-height:1.6}
.cats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.cat-card{
  background:var(--surface);border:1px solid var(--border);
  padding:24px;border-radius:2px;cursor:pointer;
  border-top:2px solid var(--border);
  transition:all .15s;position:relative;overflow:hidden;
}
.cat-card:hover{border-color:var(--accent);border-top-color:var(--accent);transform:translateY(-2px)}
.cat-icon{font-size:28px;margin-bottom:12px;display:block}
.cat-name{font-family:'Big Shoulders Display',sans-serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px}
.cat-count{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1.5px}

/* ── Why Us ── */
.why-strip{background:var(--surface2);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.why-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:0}
.why-card{
  padding:36px 28px;border-right:1px solid var(--border);
}
.why-card:last-child{border-right:none}
@media(max-width:640px){.why-card{border-right:none;border-bottom:1px solid var(--border)}}
.why-num{
  font-family:'Big Shoulders Display',sans-serif;font-size:48px;
  font-weight:900;color:var(--amber);opacity:.3;margin-bottom:8px;
}
.why-title{font-family:'Big Shoulders Display',sans-serif;font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px}
.why-desc{font-size:13px;color:var(--muted);line-height:1.6}

/* ─── SERVICES PAGE ─── */
#pub-services{padding-top:60px}
.services-header{padding:48px clamp(16px,6vw,80px) 32px;border-bottom:1px solid var(--border)}
.services-filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}
.filter-chip{
  padding:6px 14px;border:1px solid var(--border);border-radius:20px;
  cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;
  letter-spacing:1px;text-transform:uppercase;color:var(--muted);
  transition:all .15s;background:var(--surface);
}
.filter-chip:hover,.filter-chip.active{background:var(--accent);border-color:var(--accent);color:#fff}
.services-grid-wrap{padding:32px clamp(16px,6vw,80px);max-width:1280px;margin:0 auto}
.services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.svc-card{
  background:var(--surface);border:1px solid var(--border);
  padding:18px 20px;border-radius:2px;
  transition:border-color .15s;display:flex;align-items:flex-start;gap:14px;
}
.svc-card:hover{border-color:var(--accent)}
.svc-cat-dot{width:4px;height:4px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:6px}
.svc-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px}
.svc-cat{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}

/* ─── CONTACT PAGE ─── */
#pub-contact{padding-top:60px}
.contact-wrap{max-width:1280px;margin:0 auto;padding:64px clamp(16px,6vw,80px);display:grid;grid-template-columns:1fr 1.3fr;gap:60px;align-items:start}
@media(max-width:768px){.contact-wrap{grid-template-columns:1fr}}
.contact-info-block{margin-bottom:28px}
.ci-label{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:6px}
.ci-val{font-size:15px;color:var(--text);font-weight:500}
.contact-form-panel{background:var(--surface);border:1px solid var(--border);padding:32px;border-radius:2px}

/* ── Emergency Bar ── */
.emergency-bar{
  background:var(--ember);color:#fff;
  padding:10px clamp(16px,4vw,48px);
  min-height:40px;
  display:flex;align-items:center;justify-content:space-between;
  font-family:'IBM Plex Mono',monospace;font-size:10px;
  letter-spacing:1.5px;text-transform:uppercase;line-height:1.2;
  flex-wrap:wrap;gap:8px;
}
.emergency-bar > div{display:flex;align-items:center}
.emg-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#fff;margin-right:8px;animation:pulse 1.2s ease infinite}

/* ── Public Footer ── */
.pub-footer{
  background:var(--surface);border-top:1px solid var(--border);
  padding:48px clamp(16px,6vw,80px) 24px;
}
.pub-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px;margin-bottom:32px}
@media(max-width:768px){.pub-footer-grid{grid-template-columns:1fr}}
.footer-brand-block .pub-brand-name{font-size:22px}
.footer-tagline{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--ember);letter-spacing:2px;margin-top:4px}
.footer-desc{font-size:12px;color:var(--muted);line-height:1.6;margin-top:12px;max-width:320px}
.footer-col-title{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:12px}
.footer-link{display:block;font-size:12px;color:var(--text2);padding:4px 0;cursor:pointer;transition:color .15s}
.footer-link:hover{color:var(--accent)}
.footer-bottom{border-top:1px solid var(--border);padding-top:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.footer-copy{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px}

/* ═══════════════════════════════════════════════════════
   ■ LOGIN SCREEN
═══════════════════════════════════════════════════════ */
#login-screen{
  position:fixed;inset:0;z-index:500;
  background:var(--bg);align-items:center;justify-content:center;
  flex-direction:column;padding:20px;
}
.login-card{
  background:var(--surface);border:1px solid var(--border);
  width:100%;max-width:400px;border-radius:2px;overflow:hidden;
}
.login-header{
  padding:28px 28px 20px;border-bottom:1px solid var(--border);
  background:var(--surface2);text-align:center;
}
.login-mark{display:flex;justify-content:center;margin-bottom:16px}
.login-title{font-family:'Big Shoulders Display',sans-serif;font-size:22px;font-weight:900;color:var(--text);letter-spacing:.3px}
.login-sub{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;margin-top:4px}
.login-body{padding:28px}
.login-group{margin-bottom:16px}
.login-label{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;display:block}
.login-input{
  width:100%;background:var(--surface2);border:1px solid var(--border);
  color:var(--text);padding:10px 12px;font-size:14px;border-radius:2px;
  outline:none;transition:border-color .15s;
}
.login-input:focus{border-color:var(--accent)}
.login-error{
  background:var(--emb-glow);border:1px solid rgba(192,57,43,.3);
  color:var(--pill-ovr-txt);padding:10px 14px;font-size:12px;
  border-radius:2px;margin-bottom:16px;display:none;
}
.login-error.show{display:block}
.btn-login-submit{
  width:100%;padding:12px;background:var(--accent);color:#fff;
  border:none;cursor:pointer;font-family:'IBM Plex Mono',monospace;
  font-size:11px;letter-spacing:2px;text-transform:uppercase;
  border-radius:2px;transition:opacity .15s;
}
.btn-login-submit:hover{opacity:.85}
.login-back{
  text-align:center;margin-top:16px;font-size:12px;color:var(--muted);
  cursor:pointer;transition:color .15s;
}
.login-back:hover{color:var(--accent)}

/* ═══════════════════════════════════════════════════════
   ■ PORTAL SHELL
═══════════════════════════════════════════════════════ */
#portal-shell{min-height:100vh;position:relative;z-index:1}

/* ── Topbar (mobile) ── */
#ptopbar{
  display:none;position:fixed;top:0;left:0;right:0;height:52px;
  background:var(--surface);border-bottom:1px solid var(--border);
  align-items:center;justify-content:space-between;padding:0 16px;z-index:200;
}
#hamburger{background:none;border:none;cursor:pointer;padding:6px;color:var(--text);display:flex;flex-direction:column;gap:4px}
#hamburger span{display:block;width:20px;height:2px;background:currentColor;border-radius:1px}
#poverlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:150;opacity:0;transition:opacity .25s}
#poverlay.show{opacity:1}

/* ── Sidebar ── */
#psidebar{
  position:fixed;top:0;left:0;width:228px;height:100vh;
  background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;z-index:160;
  transition:transform .25s ease,background .25s,border-color .25s;
}
.sb-brand{padding:18px 16px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.sb-brand-inner{display:flex;align-items:center;gap:10px}
.sb-bname{font-family:'Big Shoulders Display',sans-serif;font-size:18px;font-weight:900;color:var(--text);letter-spacing:.3px}
.sb-bname em{color:var(--amber);font-style:normal}
.sb-btag{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--ember);letter-spacing:2px;display:block}
.sb-close-btn{background:none;border:none;cursor:pointer;color:var(--muted);font-size:16px;display:none}
#psidebar nav{flex:1;overflow-y:auto;padding:8px 0}
.nsection{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:2.5px;padding:14px 16px 5px;text-transform:uppercase}
.nitem{
  display:flex;align-items:center;gap:10px;padding:10px 16px;
  cursor:pointer;color:var(--text2);font-size:12px;
  border-left:2px solid transparent;transition:all .15s;
  min-height:40px;-webkit-tap-highlight-color:transparent;
}
.nitem:hover{color:var(--text);background:var(--surface2);border-left-color:var(--amber)}
.nitem.active{color:var(--accent);background:var(--amb-glow);border-left-color:var(--accent)}
.nitem svg{width:14px;height:14px;flex-shrink:0;opacity:.65}
.nitem.active svg,.nitem:hover svg{opacity:1}
.nbadge{margin-left:auto;background:var(--accent);color:var(--bg);font-family:'IBM Plex Mono',monospace;font-size:8px;padding:1px 6px;border-radius:2px;font-weight:700;min-width:18px;text-align:center}
.nitem.locked{opacity:.3;pointer-events:none}
.nitem.locked::after{content:'🔒';margin-left:auto;font-size:8px}
.sb-foot{padding:10px 16px;border-top:1px solid var(--border)}
.sb-user{display:flex;align-items:center;gap:10px}
.sb-av{width:30px;height:30px;background:var(--amb-glow);border:1px solid var(--amber);display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0;border-radius:1px}
.sb-uname{font-weight:600;font-size:12px;color:var(--text)}
.sb-urole{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px}
.sb-actions{padding:10px 16px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:6px}
.sb-btn{
  display:flex;align-items:center;gap:6px;padding:7px 10px;
  border:1px solid var(--border);background:var(--surface2);
  cursor:pointer;color:var(--muted);font-family:'IBM Plex Mono',monospace;
  font-size:9px;letter-spacing:.5px;border-radius:2px;transition:all .2s;width:100%;
}
.sb-btn:hover{border-color:var(--accent);color:var(--accent)}
.sb-btn svg{width:12px;height:12px}
.sb-btn .sun{display:none}.sb-btn .moon{display:block}
[data-theme="light"] .sb-btn .sun{display:block}
[data-theme="light"] .sb-btn .moon{display:none}

/* ── Portal Main ── */
#pmain{margin-left:228px;padding:28px 32px;min-height:100vh;transition:margin .25s}
.ppage{display:none}.ppage.active{display:block}
.ptitle{font-family:'Big Shoulders Display',sans-serif;font-size:26px;font-weight:700;color:var(--text);margin-bottom:3px;letter-spacing:.3px}
.psub{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:22px;letter-spacing:1.5px;text-transform:uppercase}

/* ── Portal Components ── */
.panel{background:var(--surface);border:1px solid var(--border);border-radius:2px;transition:background .25s,border-color .25s;margin-bottom:20px}
.ph{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface2)}
.ph-title{font-family:'Big Shoulders Display',sans-serif;font-size:14px;font-weight:700;color:var(--text);letter-spacing:.3px}
.pb{padding:18px}
.kgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.kcard{background:var(--surface);border:1px solid var(--border);padding:16px 18px;border-top:2px solid;border-radius:2px;transition:border-color .2s}
.kcard.k1{border-top-color:var(--blue)}
.kcard.k2{border-top-color:var(--amber)}
.kcard.k3{border-top-color:var(--gold)}
.kcard.k4{border-top-color:var(--green)}
.klbl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
.kval{font-family:'Big Shoulders Display',sans-serif;font-size:28px;font-weight:900;color:var(--text);letter-spacing:-.3px}
.ksub{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);margin-top:3px}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.pill{display:inline-flex;align-items:center;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1px;padding:3px 8px;border-radius:2px;border:1px solid;text-transform:uppercase;white-space:nowrap}
.pill.paid{background:var(--pill-paid-bg);border-color:var(--pill-paid-bdr);color:var(--pill-paid-txt)}
.pill.sent,.pill.invoiced{background:var(--pill-inv-bg);border-color:var(--pill-inv-bdr);color:var(--pill-inv-txt)}
.pill.overdue{background:var(--pill-ovr-bg);border-color:var(--pill-ovr-bdr);color:var(--pill-ovr-txt)}
.pill.draft{background:var(--pill-dft-bg);border-color:var(--pill-dft-bdr);color:var(--pill-dft-txt)}
.pill.open{background:var(--pill-opn-bg);border-color:var(--pill-opn-bdr);color:var(--pill-opn-txt)}
.pill.progress,.pill.approved{background:var(--pill-prg-bg);border-color:var(--pill-prg-bdr);color:var(--pill-prg-txt)}
.pill.emergency{background:var(--emb-glow);border-color:rgba(192,57,43,.3);color:var(--pill-ovr-txt)}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:var(--th-bg);color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:2px;text-transform:uppercase;padding:9px 14px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text2);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--row-hover)}
.mono{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text)}
.amt{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:500;color:var(--text)}
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border:1px solid;border-radius:2px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;transition:all .15s;white-space:nowrap}
.btn-p{background:var(--accent);border-color:var(--accent);color:#fff}.btn-p:hover{opacity:.85}
.btn-g{background:transparent;border-color:var(--border);color:var(--text2)}.btn-g:hover{border-color:var(--accent);color:var(--accent)}
.btn-s{padding:4px 9px;font-size:8px}
.bgrp{display:flex;gap:6px;flex-wrap:wrap}
.srow{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.sinput{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;font-size:12px;border-radius:2px;outline:none;flex:1;min-width:160px}
.sinput:focus{border-color:var(--accent)}
.fgroup{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.flbl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase}
.finput{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:9px 12px;font-size:13px;border-radius:2px;outline:none;transition:border-color .15s;width:100%}
.finput:focus{border-color:var(--accent)}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fgrid.three{grid-template-columns:1fr 1fr 1fr}
.ffull{grid-column:1/-1}
.sumbox{background:var(--surface2);border:1px solid var(--border);padding:14px;border-radius:2px}
.sumrow{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:var(--text2)}
.sumrow.tot{border-top:1px solid var(--border);margin-top:6px;padding-top:8px;font-weight:600;color:var(--text)}
.sumrow.sm{font-size:11px;color:var(--muted)}
.alert-strip{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.acard{flex:1;min-width:180px;padding:14px 16px;border-radius:2px;border-left:3px solid}
.acard.danger{background:var(--emb-glow);border-left-color:var(--ember);color:var(--pill-ovr-txt)}
.acard.warn{background:rgba(230,126,34,.08);border-left-color:var(--warn);color:var(--warn)}
.acard.info{background:var(--blu-glow);border-left-color:var(--blue);color:var(--pill-opn-txt)}
.albl{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:2px;text-transform:uppercase;opacity:.8;margin-bottom:3px}
.acount{font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:700}
.adesc{font-size:11px;opacity:.8;margin-top:2px}
.chart-bars{display:flex;align-items:flex-end;gap:8px;height:110px;padding:0 4px}
.cbar-w{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.cbar{width:100%;background:var(--amber);border-radius:2px 2px 0 0;opacity:.7;transition:opacity .2s;min-height:4px;cursor:pointer}
.cbar:hover{opacity:1}
.clbl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px}
.cval{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--text2)}
.liitems{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px}
.liitems th{background:var(--th-bg);color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;padding:8px 10px;text-align:left;border-bottom:1px solid var(--border)}
.liitems td{padding:7px 10px;border-bottom:1px solid var(--border);vertical-align:middle}
.liinput{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:5px 8px;font-size:12px;border-radius:2px;outline:none;width:100%}
.liinput:focus{border-color:var(--accent)}
.doc-preview{background:#fff;color:#1a1814;padding:36px;font-family:'Instrument Sans',sans-serif;font-size:13px;border-radius:2px;min-height:560px}
.doc-logo-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:18px;border-bottom:3px solid #C0392B}
.doc-bname{font-family:'Big Shoulders Display',sans-serif;font-size:22px;font-weight:900;color:#0A0E19}
.doc-bname em{color:#F07820;font-style:normal}
.doc-btag{font-size:8px;letter-spacing:3px;color:#C0392B;text-transform:uppercase;margin-top:2px}
.doc-type{font-family:'Big Shoulders Display',sans-serif;font-size:26px;font-weight:700;color:#0A0E19;margin-bottom:18px}
.doc-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.dml{font-size:8px;letter-spacing:2px;color:#7A7566;text-transform:uppercase;margin-bottom:3px}
.dmv{font-size:13px;color:#1A1814;font-weight:500}
.doc-t{width:100%;border-collapse:collapse;margin-bottom:20px}
.doc-t th{background:#F5F1EA;color:#7A7566;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;padding:9px 11px;text-align:left;border-bottom:2px solid #C8C1B3}
.doc-t td{padding:9px 11px;border-bottom:1px solid #E4DED2}
.doc-tots{margin-left:auto;width:240px}
.doc-tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#4A4638;border-bottom:1px solid #E4DED2}
.doc-tot-row.grand{border-top:2px solid #1A1814;border-bottom:none;font-weight:700;font-size:14px;color:#1A1814;padding-top:8px}
.doc-note{font-size:10px;color:#7A7566;margin-top:28px;padding-top:14px;border-top:1px solid #E4DED2;text-align:center;font-style:italic}
.timeline-item{display:flex;gap:16px;padding:14px 0;border-bottom:1px solid var(--border)}
.timeline-item:last-child{border-bottom:none}
.tl-dot{width:10px;height:10px;border-radius:50%;background:var(--amber);flex-shrink:0;margin-top:4px;border:2px solid var(--surface)}
.tl-date{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);white-space:nowrap;width:80px;flex-shrink:0}
.tl-content{}
.tl-title{font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px}
.tl-sub{font-size:11px;color:var(--muted)}
.audit-row{display:flex;gap:12px;padding:10px 14px;border-bottom:1px solid var(--border);align-items:flex-start;font-size:12px}
.audit-row:last-child{border-bottom:none}
.audit-row:hover{background:var(--surface2)}
.audit-ts{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);white-space:nowrap;width:100px;flex-shrink:0}
.audit-user{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--accent);width:80px;flex-shrink:0}
.audit-action{flex:1;color:var(--text2)}
.audit-lvl{font-family:'IBM Plex Mono',monospace;font-size:8px;padding:2px 6px;border-radius:2px}
.audit-lvl.info{background:var(--blu-glow);color:var(--pill-opn-txt)}
.audit-lvl.warn{background:rgba(230,126,34,.08);color:var(--warn)}
.audit-lvl.error{background:var(--emb-glow);color:var(--pill-ovr-txt)}

/* ── Modal ── */
#modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;align-items:center;justify-content:center;padding:20px}
#modal-overlay.show{display:flex}
.modal{background:var(--surface);border:1px solid var(--border);width:100%;max-width:660px;max-height:88vh;border-radius:2px;display:flex;flex-direction:column;overflow:hidden}
.mhdr{padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface2)}
.mttl{font-family:'Big Shoulders Display',sans-serif;font-size:17px;font-weight:700;color:var(--text)}
.mclose{background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;line-height:1;padding:0 4px}
.mclose:hover{color:var(--text)}
.mbdy{padding:22px;overflow-y:auto;flex:1}
.flex-end{display:flex;justify-content:flex-end}.mt2{margin-top:16px}.mt3{margin-top:22px}
.divider{height:1px;background:var(--border);margin:18px 0}

/* ── Toast ── */
#toaster{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--surface);border:1px solid var(--border);padding:11px 16px;border-radius:2px;font-size:12px;color:var(--text2);animation:tIn .25s ease;border-left:3px solid var(--accent);max-width:300px;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.toast.ok{border-left-color:var(--green)}
.toast.err{border-left-color:var(--ember)}
@keyframes tIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}

/* ── Back to Top Button ── */
#back-to-top{
  position:fixed;bottom:30px;right:30px;width:48px;height:48px;
  background:var(--accent);color:#fff;border:none;border-radius:2px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:20px;z-index:999;opacity:0;visibility:hidden;
  transition:opacity .3s,visibility .3s,transform .2s;transform:translateY(10px);
  box-shadow:0 4px 12px rgba(0,0,0,.2);
}
#back-to-top.show{opacity:1;visibility:visible;transform:translateY(0)}
#back-to-top:hover{background:var(--amber);transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.3)}
@media(max-width:640px){
  #back-to-top{width:44px;height:44px;bottom:20px;right:20px;font-size:18px}
}

/* Responsive portal */
@media(max-width:1024px){
  #ptopbar{display:flex}
  #psidebar{transform:translateX(-100%)}
  #psidebar.open{transform:translateX(0)}
  #poverlay{display:block}
  #pmain{margin-left:0;padding:72px 16px 24px}
  .sb-close-btn{display:block}
  .kgrid{grid-template-columns:1fr 1fr}
  .twocol{grid-template-columns:1fr}
}
@media(max-width:640px){.kgrid{grid-template-columns:1fr 1fr}.fgrid{grid-template-columns:1fr}.fgrid.three{grid-template-columns:1fr}}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     ■ PUBLIC SITE
═══════════════════════════════════════════════════════ -->
<div id="pub-site">

  <!-- Emergency bar -->
  <div class="emergency-bar">
    <div><span class="emg-pulse"></span> 24/7 ARMED RESPONSE &middot; EMERGENCY LINE</div>
    <div style="font-size:13px;font-weight:700;letter-spacing:1px">+27 68 912 6581</div>
  </div>

  <!-- Nav -->
  <nav id="pub-nav">
    <div class="pub-brand" onclick="pubNav('home')">
      <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" style="height:60px;width:auto;display:block;object-fit:contain;object-position:left center;"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" style="height:60px;width:auto;display:none;object-fit:contain;object-position:left center;">
    </div>
    <div class="pub-nav-links">
      <div class="pub-nav-link active" id="pnl-home" onclick="pubNav('home')">Home</div>
      <div class="pub-nav-link" id="pnl-services" onclick="pubNav('services')">Services</div>
      <div class="pub-nav-link" id="pnl-contact" onclick="pubNav('contact')">Contact</div>
    </div>
    <div class="pub-nav-right">
      <button class="theme-btn" onclick="toggleTheme()">
        <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
      </button>
      <button class="btn-login" onclick="goLogin()">Umlilo Portal</button>
    </div>
  </nav>

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
      <div style="max-width:1280px;margin:0 auto">
        <div class="why-grid">
          <div class="why-card"><div class="why-num">01</div><div class="why-title">Certified & Compliant</div><div class="why-desc">PSIRA registered. Fully insured. All personnel vetted, trained and certified to national standards.</div></div>
          <div class="why-card"><div class="why-num">02</div><div class="why-title">Rapid Response</div><div class="why-desc">Average response time under 4 minutes. 24/7 armed units on standby across the greater Johannesburg area.</div></div>
          <div class="why-card"><div class="why-num">03</div><div class="why-title">Integrated Systems</div><div class="why-desc">CCTV, access control, and alarm monitoring linked into a unified control room - one point of command.</div></div>
          <div class="why-card"><div class="why-num">04</div><div class="why-title">Dedicated Support</div><div class="why-desc">Dedicated account manager per client. Monthly reporting. Site visits. Transparent communication, always.</div></div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:72px clamp(16px,6vw,80px)">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--amber);letter-spacing:3px;text-transform:uppercase;margin-bottom:12px">Protect What Matters</div>
      <h2 style="font-family:'Big Shoulders Display',sans-serif;font-size:clamp(32px,5vw,56px);font-weight:900;color:var(--text);margin-bottom:16px">Ready to secure your site?</h2>
      <p style="color:var(--muted);margin-bottom:28px;font-size:14px">Get a tailored security assessment and quote within 24 hours.</p>
      <button class="btn-primary-lg" onclick="pubNav('contact')">Get a Free Assessment</button>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--ember);letter-spacing:2px;margin-top:32px">Fire, taught to behave.</div>
    </div>

    <!-- Footer -->
    <div class="pub-footer">
      <div class="pub-footer-grid">
        <div class="footer-brand-block">
          <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" style="height:62px;width:auto;display:block;object-fit:contain;object-position:left center;"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" style="height:62px;width:auto;display:none;object-fit:contain;object-position:left center;">
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
          <div class="footer-col-title" style="margin-top:16px">Portal</div>
          <div class="footer-link" onclick="goLogin()">Umlilo Portal →</div>
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
    <div class="services-header" style="padding-top:80px">
      <div style="max-width:1280px;margin:0 auto">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--amber);letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">Complete Catalogue</div>
        <h1 style="font-family:'Big Shoulders Display',sans-serif;font-size:clamp(32px,5vw,52px);font-weight:900;color:var(--text);margin-bottom:6px">Our Services</h1>
        <p style="color:var(--muted);font-size:14px;margin-bottom:20px">55 services across 8 specialist disciplines</p>
        <div class="services-filter-row" id="svc-filters"></div>
      </div>
    </div>
    <div class="services-grid-wrap">
      <div class="services-grid" id="svc-grid"></div>
    </div>
    <div style="text-align:center;padding:48px 20px;border-top:1px solid var(--border)">
      <p style="color:var(--muted);margin-bottom:16px;font-size:13px">Need a custom solution? Let's talk.</p>
      <button class="btn-primary-lg" onclick="pubNav('contact')">Request a Quote</button>
    </div>
  </div><!-- /pub-services -->

  <!-- ── CONTACT ── -->
  <div id="pub-contact" class="pub-page">
    <div style="padding-top:96px">
      <div class="contact-wrap">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--amber);letter-spacing:3px;text-transform:uppercase;margin-bottom:12px">Get In Touch</div>
          <h1 style="font-family:'Big Shoulders Display',sans-serif;font-size:clamp(32px,5vw,52px);font-weight:900;color:var(--text);line-height:1;margin-bottom:24px">Talk to us.<br>We respond<br>fast.</h1>
          <p style="color:var(--muted);font-size:14px;line-height:1.6;margin-bottom:36px">For site assessments, service quotations, or emergency escalations - our team is available 24/7.</p>
          <div class="contact-info-block"><div class="ci-label">Emergency Line</div><div class="ci-val" style="color:var(--ember);font-size:20px;font-weight:700">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Office</div><div class="ci-val">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Email</div><div class="ci-val">info@blackfiresolutions.co.za</div></div>
          <div class="contact-info-block"><div class="ci-label">Service Area</div><div class="ci-val">Johannesburg &middot; Sandton &middot; Midrand &middot; Ekurhuleni &middot; Greater Gauteng</div></div>
          <div class="contact-info-block"><div class="ci-label">Hours</div><div class="ci-val">Operations: 24/7 &nbsp;|&nbsp; Office: Mon-Fri 07:00-17:00</div></div>
        </div>
        <div class="contact-form-panel">
          <div style="font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:20px">Request a Quote</div>
          <div class="fgrid" style="gap:14px">
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
          <div style="margin-top:18px">
            <button class="btn-primary-lg" style="width:100%" onclick="submitContact()">Send Request</button>
          </div>
          <div id="cf-success" style="display:none;margin-top:14px;padding:12px 16px;background:var(--grn-glow);border:1px solid rgba(26,122,64,.3);border-radius:2px;color:var(--pill-paid-txt);font-size:13px;text-align:center">
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
      <div class="login-mark" onclick="goPublic()" style="cursor:pointer" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" style="height:74px;width:auto;display:block;object-fit:contain;object-position:left center;"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" style="height:74px;width:auto;display:none;object-fit:contain;object-position:left center;">
      </div>
      <div class="login-title" style="font-size:14px;margin-top:8px;letter-spacing:2px">BLACKFIRE SOLUTIONS</div>
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
      <button class="btn-login-submit" onclick="doLogin()">Sign In</button>
      <div style="text-align:center;margin-top:12px">
        <span class="login-back" onclick="showForgotPassword()" style="font-size:11px">Forgot password?</span>
        <span style="color:var(--muted);font-size:11px;margin:0 8px">·</span>
        <span class="login-back" onclick="goPublic()" style="font-size:11px">Back to site</span>
      </div>
    </div>
  </div>
  <!-- ── Forgot Password Panel ── -->
  <div class="login-card" id="forgot-panel" style="display:none">
    <div class="login-header">
      <div class="login-mark" onclick="goPublic()" style="cursor:pointer" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" style="height:74px;width:auto;display:block;object-fit:contain;object-position:left center;"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" style="height:74px;width:auto;display:none;object-fit:contain;object-position:left center;">
      </div>
      <div class="login-title" style="font-size:14px;margin-top:8px;letter-spacing:2px">RESET PASSWORD</div>
      <div class="login-sub">ENTER YOUR USERNAME</div>
    </div>
    <div class="login-body">
      <div id="forgot-msg" class="login-error" style="display:none"></div>
      <div class="login-group">
        <label class="login-label">Username</label>
        <input class="login-input" id="fp-user" placeholder="your username" onkeydown="if(event.key==='Enter') doRequestReset()">
      </div>
      <button class="btn-login-submit" onclick="doRequestReset()">Send Reset Email</button>
      <div style="text-align:center;margin-top:12px">
        <span class="login-back" onclick="showLoginPanel()" style="font-size:11px">Back to sign in</span>
      </div>
    </div>
  </div>
  <!-- ── New Password Panel (token from URL) ── -->
  <div class="login-card" id="newpass-panel" style="display:none">
    <div class="login-header">
      <div class="login-mark" onclick="goPublic()" style="cursor:pointer" title="Back to home">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" style="height:74px;width:auto;display:block;object-fit:contain;object-position:left center;"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" style="height:74px;width:auto;display:none;object-fit:contain;object-position:left center;">
      </div>
      <div class="login-title" style="font-size:14px;margin-top:8px;letter-spacing:2px">NEW PASSWORD</div>
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
      <button class="btn-login-submit" onclick="doResetPassword()">Set New Password</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════

<!-- ═══════════════════════════════════════════════════════
     ■ PORTAL SHELL - v9  -  Dynamic RBAC Nav
═══════════════════════════════════════════════════════ -->
<div id="portal-shell">

  <!-- Mobile topbar -->
  <div id="ptopbar">
    <div style="display:flex;align-items:center;gap:8px">
      <button id="hamburger" onclick="toggleSb()"><span></span><span></span><span></span></button>
      <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" style="height:54px;width:auto;display:block;object-fit:contain;object-position:left center;"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" style="height:54px;width:auto;display:none;object-fit:contain;object-position:left center;">
    </div>
    <button class="theme-btn" onclick="toggleTheme()">
      <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
    </button>
  </div>
  <div id="poverlay" onclick="closeSb()"></div>

  <!-- SIDEBAR - nav built dynamically -->
  <div id="psidebar">
    <div class="sb-brand">
      <div class="sb-brand-inner">
        <img src="./blackfire_logo_transparent.png" class="bf-logo-dark" style="height:56px;width:auto;display:block;object-fit:contain;object-position:left center;"><img src="./blackfire_logo_transparent.png" class="bf-logo-light" style="height:56px;width:auto;display:none;object-fit:contain;object-position:left center;">
        <div><span class="sb-btag" id="sb-portaltag" style="display:block;margin-top:2px">PORTAL  -  v9</span></div>
      </div>
      <button class="sb-close-btn" onclick="closeSb()">✕</button>
    </div>
    <nav id="pnav"></nav><!-- filled by buildNav() -->
    <div class="sb-actions">
      <button class="sb-btn" onclick="toggleTheme()">
        <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
        <span class="moon">Dark Mode</span><span class="sun">Light Mode</span>
      </button>
      <button class="sb-btn" onclick="doLogout()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>
    <div class="sb-foot">
      <div class="sb-user">
        <div class="sb-av" id="sb-av">🔥</div>
        <div><div class="sb-uname" id="sb-uname">-</div><div class="sb-urole" id="sb-urole">-</div></div>
      </div>
    </div>
  </div>

  <!-- ═══ PORTAL PAGES ═══ -->
  <div id="pmain">

    <!-- PUBLIC EMBEDS -->
    <div id="p-home" class="ppage" style="padding:0;margin:-28px -32px">
      <div style="padding:28px 32px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div><div class="ptitle">Public Site</div><div class="psub">HOME  -  LIVE VIEW</div></div>
        <button class="btn btn-g btn-s" onclick="goPublicFullscreen()">Open Full ↗</button>
      </div>
      <div id="portal-home-embed" style="padding:28px"></div>
    </div>

    <div id="p-services" class="ppage" style="padding:0;margin:-28px -32px">
      <div style="padding:28px 32px 14px;border-bottom:1px solid var(--border)">
        <div class="ptitle">Services</div><div class="psub">55 SERVICES  -  8 CATEGORIES</div>
      </div>
      <div style="padding:20px 32px">
        <div class="services-filter-row" id="portal-svc-filters" style="margin-bottom:18px"></div>
        <div class="services-grid" id="portal-svc-grid"></div>
      </div>
    </div>

    <div id="p-contact" class="ppage" style="padding:0;margin:-28px -32px">
      <div style="padding:28px 32px 14px;border-bottom:1px solid var(--border)">
        <div class="ptitle">Contact</div><div class="psub">ENQUIRIES  -  QUOTE REQUESTS</div>
      </div>
      <div class="contact-wrap" style="max-width:none;padding:28px 32px">
        <div>
          <div class="contact-info-block"><div class="ci-label">Emergency Line</div><div class="ci-val" style="color:var(--ember);font-size:18px;font-weight:700">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Office</div><div class="ci-val">+27 68 912 6581</div></div>
          <div class="contact-info-block"><div class="ci-label">Email</div><div class="ci-val">info@blackfiresolutions.co.za</div></div>
          <div class="contact-info-block"><div class="ci-label">Hours</div><div class="ci-val">Ops: 24/7 &middot; Office: Mon-Fri 07:00-17:00</div></div>
        </div>
        <div class="contact-form-panel">
          <div style="font-family:'Big Shoulders Display',sans-serif;font-size:18px;font-weight:700;margin-bottom:16px">Client Enquiry Form</div>
          <div class="fgrid">
            <div class="fgroup"><label class="flbl">Name</label><input class="finput" id="pcf-name" placeholder="Full name"></div>
            <div class="fgroup"><label class="flbl">Company</label><input class="finput" id="pcf-co" placeholder="Company"></div>
            <div class="fgroup"><label class="flbl">Phone</label><input class="finput" id="pcf-ph" placeholder="+27"></div>
            <div class="fgroup"><label class="flbl">Email</label><input class="finput" id="pcf-em" placeholder="email@company.co.za"></div>
            <div class="fgroup ffull"><label class="flbl">Service</label><select class="finput" id="pcf-svc"><option>Armed Response</option><option>CCTV</option><option>Access Control</option><option>Guard Services</option><option>Risk Assessment</option><option>Other</option></select></div>
            <div class="fgroup ffull"><label class="flbl">Message</label><textarea class="finput" rows="3" placeholder="Requirements..."></textarea></div>
          </div>
          <div class="mt2"><button class="btn btn-p" style="width:100%" onclick="toast('Enquiry submitted - we\'ll be in touch.','ok')">Submit Enquiry</button></div>
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
          <div style="padding:14px 16px 8px"><div class="chart-bars" id="rev-chart"></div></div>
        </div>
      </div>
    </div>

    <!-- TRANSACTIONS -->
    <div id="p-transactions" class="ppage">
      <div class="ptitle">Transactions</div><div class="psub">BANK LEDGER</div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div class="kcard" style="flex:1;min-width:130px;border-top:2px solid var(--green)"><div class="klbl">Credits</div><div class="kval" style="font-size:22px;color:var(--pill-paid-txt)" id="tx-credits">R0</div></div>
        <div class="kcard" style="flex:1;min-width:130px;border-top:2px solid var(--ember)"><div class="klbl">Debits</div><div class="kval" style="font-size:22px;color:var(--pill-ovr-txt)" id="tx-debits">R0</div></div>
        <div class="kcard" style="flex:1;min-width:130px;border-top:2px solid var(--amber)"><div class="klbl">Net</div><div class="kval" style="font-size:22px" id="tx-net">R0</div></div>
      </div>
      <div class="srow"><input type="text" class="sinput" placeholder="Search..." oninput="renderTransactions(this.value)"><button class="btn btn-p btn-s" onclick="openTxModal()">+ Log Transaction</button></div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Ref</th><th>Credit</th><th>Debit</th></tr></thead><tbody id="tx-table"></tbody></table></div></div>
    </div>

    <!-- INVOICES -->
    <div id="p-invoices" class="ppage">
      <div class="ptitle">Invoices</div><div class="psub">BILLING  -  PAYMENT TRACKING</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search invoices..." oninput="renderInvoices(this.value)">
        <select class="sinput" style="max-width:130px" onchange="renderInvoices('',this.value)"><option value="">All</option><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select>
        <button class="btn btn-p btn-s" id="btn-newinv" onclick="showPortalPage('p-new-invoice',null)">+ New Invoice</button>
      </div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Invoice #</th><th>Client</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody id="inv-table"></tbody></table></div></div>
    </div>

    <!-- QUOTES -->
    <div id="p-quotes" class="ppage">
      <div class="ptitle">Quotes</div><div class="psub">PROPOSALS  -  APPROVALS</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search quotes..." oninput="renderQuotes(this.value)">
        <select class="sinput" style="max-width:130px" onchange="renderQuotes('',this.value)"><option value="">All</option><option>Draft</option><option>Sent</option><option>Pending Approval</option><option>Approved</option><option>Declined</option></select>
        <button class="btn btn-p btn-s" id="btn-newq" onclick="showPortalPage('p-new-quote',null)">+ New Quote</button>
      </div>
      <div class="panel"><div class="tw"><table><thead><tr><th>Quote #</th><th>Client</th><th>Total</th><th>Submitted By</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead><tbody id="qte-table"></tbody></table></div></div>
    </div>

    <!-- CALLOUTS - PO + assignment columns -->
    <div id="p-callouts" class="ppage">
      <div class="ptitle">Callouts</div><div class="psub">JOB TICKETS  -  FIELD OPERATIONS</div>
      <div class="srow">
        <input type="text" class="sinput" placeholder="Search callouts..." oninput="renderCallouts(this.value)">
        <select class="sinput" style="max-width:130px" onchange="renderCallouts('',this.value)"><option value="">All</option><option>Open</option><option>In Progress</option><option>Completed</option><option>Invoiced</option></select>
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
        <div class="mt3 flex-end"><button class="btn btn-p" onclick="saveCallout()">Log Call →</button></div>
      </div></div>
    </div>

    <!-- SUBMIT QUOTE (senior tech / manager) -->
    <div id="p-new-quote" class="ppage">
      <div class="ptitle" id="nq-page-title">New Quote</div>
      <div class="psub" id="nq-page-sub">BUILD PROPOSAL</div>
      <div id="nq-pending-notice" style="display:none;margin-bottom:16px;padding:12px 16px;background:rgba(230,126,34,.08);border:1px solid rgba(230,126,34,.25);border-radius:2px;font-size:12px;color:var(--warn)">
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
        <div class="flbl" style="margin-bottom:8px">Line Items</div>
        <table class="liitems"><thead><tr><th style="width:45%">Description</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr></thead><tbody id="li-body"></tbody></table>
        <button class="btn btn-g btn-s" onclick="addLine()">+ Add Line</button>
        <div class="mt2" id="quote-sum"></div>
        <div class="mt3 flex-end"><button class="btn btn-p" id="nq-submit-btn" onclick="saveQuote()">Save Quote</button></div>
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
        <div class="mt3 flex-end"><button class="btn btn-p" onclick="saveInvoice()">Create Invoice</button></div>
      </div></div>
    </div>

    <!-- LOG PAYMENT -->
    <div id="p-log-payment" class="ppage">
      <div class="ptitle">Log Payment</div><div class="psub">RECORD RECEIVED PAYMENT</div>
      <div class="panel"><div class="pb">
        <div class="flbl" style="margin-bottom:8px">Select Invoice to Mark as Paid</div>
        <div id="pay-inv-list" style="margin-bottom:16px"></div>
        <div class="divider"></div>
        <div class="fgrid">
          <div class="fgroup"><label class="flbl">Payment Date</label><input type="date" class="finput" id="pay-date"></div>
          <div class="fgroup"><label class="flbl">Amount Received (R)</label><input type="number" class="finput" id="pay-amount" placeholder="0.00"></div>
          <div class="fgroup ffull"><label class="flbl">Payment Reference / Notes</label><input class="finput" id="pay-notes" placeholder="EFT ref, cheque number, method..."></div>
        </div>
        <div class="mt3 flex-end"><button class="btn btn-p" onclick="logPayment()">Log Payment</button></div>
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
      <div id="users-create-bar" style="display:none;margin-bottom:12px">
        <button class="btn btn-g btn-s" onclick="openCreateUserModal()" style="background:var(--accent);color:#fff;border:none;padding:8px 18px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px">+ New User</button>
      </div>
      <div class="panel"><div class="tw"><table><thead>
        <tr><th>Username</th><th>Name</th><th>Role</th><th>Can Create Callout</th><th>Update Status</th><th>Assign PO</th><th>Finance</th><th>Submit Quote</th><th>Approve Quote</th></tr>
      </thead><tbody id="users-table-body"></tbody></table></div></div>
    </div>

  </div><!-- /pmain -->
</div><!-- /portal-shell -->

<!-- MODAL -->
<div id="modal-overlay" onclick="closeModal(event)">
  <div class="modal"><div class="mhdr"><div class="mttl" id="modal-ttl"></div><button class="mclose" onclick="closeModalDirect()">✕</button></div><div class="mbdy" id="modal-bdy"></div></div>
</div>

<!-- TOAST -->
<div id="toaster"></div>


<script>
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
      // Session expired
      SESSION = null;
      document.documentElement.dataset.state = 'login';
      showLoginPanel();
      toast('Session expired. Please log in again.', 'err');
      return { success: false, error: 'Session expired' };
    }
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return { success: false, error: String(e) };
  }
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
    id:         c.ref_id || c.id,
    client:     c.client_name,
    service:    c.service,
    location:   c.location,
    tech:       c.tech,
    assignedTo: c.assigned_to,
    priority:   c.priority,
    status:     c.status,
    date:       c.callout_date,
    time:       c.callout_time?.slice(0,5) || '',
    notes:      c.notes || '',
    loggedBy:   c.logged_by,
    po:         c.po || '',
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
    id:       i.ref_id || i.id,
    client:   i.client_name,
    amount:   Number(i.amount),
    dueDate:  i.due_date,
    status:   i.status,
    ref:      i.quote_ref || i.callout_ref || '',
    po:       i.po || '',
    date:     i.invoice_date,
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

  // Build dynamic nav
  buildNav();
  // Set sidebar identity
  document.getElementById('sb-uname').textContent = SESSION.name;
  document.getElementById('sb-urole').textContent = SESSION.title + '  -  AECI';
  document.getElementById('sb-portaltag').textContent = ROLE_LABELS[SESSION.role] || SESSION.role;
  document.getElementById('sb-av').textContent = SESSION.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();

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
}

async function doLogout(){
  await api('POST', 'auth.php?action=logout');
  SESSION = null;
  DB = { callouts:[], quotes:[], invoices:[], bank:[], users:[] };
  document.getElementById('l-user').value = '';
  document.getElementById('l-pass').value = '';
  document.getElementById('login-error').classList.remove('show');
  document.documentElement.dataset.state = 'login';
  showLoginPanel();
}

/* ═══════════════════════════════════════════════════════
   AUDIT (client-side, server logs via session)
═══════════════════════════════════════════════════════ */
function audit(action, detail) {
  if (!SESSION) return;
  AUDIT_LOG.unshift({ username: SESSION.username, action, detail, created_at: new Date().toISOString() });
}

const NAV_CONFIG = [
  { sec:'Public Site', items:[
    { id:'p-home',     label:'Home',     perm:null, icon:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>' },
    { id:'p-services', label:'Services', perm:null, icon:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>' },
    { id:'p-contact',  label:'Contact',  perm:null, icon:'<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.07 19.79 19.79 0 01.33 3.37 2 2 0 012.5 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.43a16 16 0 006.29 6.29l.9-.9a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>' },
  ]},
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
  const nav = document.getElementById('pnav');
  let html = '';
  NAV_CONFIG.forEach(group => {
    const visible = group.items.filter(item => !item.perm || can(item.perm));
    if(!visible.length) return;
    html += `<div class="nsection">${group.sec}</div>`;
    visible.forEach(item => {
      const badge = item.badge ? `<span class="nbadge" id="${item.badge}">0</span>` : '';
      html += `<div class="nitem" data-page="${item.id}" onclick="showPortalPage('${item.id}',this)">
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
  const d=(o=0)=>{const dt=new Date();dt.setDate(dt.getDate()+o);return dt.toISOString().split('T')[0];};
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
  document.querySelectorAll('.nitem').forEach(n=>n.classList.remove('active'));
  const page=document.getElementById(id);
  if(page) page.classList.add('active');
  // Find matching nav item
  if(el) el.classList.add('active');
  else { const found=document.querySelector(`.nitem[data-page="${id}"]`); if(found) found.classList.add('active'); }
  closeSb();
  audit('VIEW',id);
  // Render function dispatch
  const renders={
    'p-dashboard':renderDashboard,
    'p-transactions':()=>renderTransactions(''),
    'p-invoices':()=>renderInvoices(''),
    'p-quotes':()=>renderQuotes(''),
    'p-callouts':()=>renderCallouts(''),
    'p-timeline':renderTimeline,
    'p-statement':renderStatement,
    'p-income':renderIncome,
    'p-log-payment':renderPayList,
    'p-audit':renderAudit,
    'p-home':renderPortalHome,
    'p-services':()=>buildSvcGrid('portal'),
    'p-new-quote':initNewQuote,
    'p-new-callout':initNewCallout,
    'p-new-invoice':initNewInvoice,
    'p-users':renderUsers,
  };
  if(renders[id]) renders[id]();
}

function toggleSb(){ document.getElementById('psidebar').classList.toggle('open'); document.getElementById('poverlay').classList.toggle('show'); }
function closeSb(){ document.getElementById('psidebar').classList.remove('open'); document.getElementById('poverlay').classList.remove('show'); }

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

function prefillQuoteFromJob(id){
  const c=proxyDB.callouts.find(x=>x.id===id);if(!c)return;
  showPortalPage('p-new-quote',null);
  setTimeout(()=>{
    const el=document.getElementById('nq-jobref');if(el)el.value=id;
    const cl=document.getElementById('nq-client');if(cl)cl.value=c.client;
  },50);
}

function initNewCallout(){
  document.getElementById('nc-date').value=new Date().toISOString().split('T')[0];
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
    </div>`);
}

function convertQtoInv(id){
  const q=proxyDB.quotes.find(x=>x.id===id);if(!q)return;
  const{total}=qtot(q.items);
  const invId=nextId('inv');
  const due=new Date();due.setDate(due.getDate()+30);
  proxyDB.invoices.unshift({id:invId,client:q.client,amount:total,dueDate:due.toISOString().split('T')[0],status:'Draft',ref:q.id,po:'',date:new Date().toISOString().split('T')[0]});
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
  document.getElementById('nq-valid').value=due.toISOString().split('T')[0];
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
  rows.forEach(r=>{const ins=r.querySelectorAll('input');const desc=ins[0]?.value.trim();const qty=parseFloat(ins[1]?.value)||0;const unit=parseFloat(ins[2]?.value)||0;if(desc)items.push({desc,qty,unit});});
  const isSeniorTech=SESSION?.role==='senior_tech';
  const id=nextId('q');
  proxyDB.quotes.unshift({
    id,client,items,
    status:isSeniorTech?'Pending Approval':(document.getElementById('nq-status')?.value||'Draft'),
    validUntil:document.getElementById('nq-valid').value,
    date:new Date().toISOString().split('T')[0],
    submittedBy:SESSION?.username||'',
    source:isSeniorTech?'senior_tech':'staff',
    approvalStatus:isSeniorTech?'pending':null,
    jobRef:document.getElementById('nq-jobref')?.value.trim()||'',
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
  const canMod=can('invoice.create');const canPaid=can('invoice.mark_paid');const canDel=can('invoice.delete');
  const btn=document.getElementById('btn-newinv');if(btn)btn.style.display=canMod?'':'none';
  document.getElementById('inv-table').innerHTML=items.length?items.map(inv=>`
    <tr><td class="mono">${esc(inv.id)}</td><td>${esc(inv.client)}</td><td class="amt">${fmt(inv.amount)}</td><td style="font-size:11px;white-space:nowrap">${fmtD(inv.dueDate)}</td><td>${pillH(inv.status)}</td>
    <td><div class="bgrp">
      <button class="btn btn-g btn-s" onclick="previewInvoice('${esc(inv.id)}')">View</button>
      ${canPaid&&inv.status!=='Paid'?`<button class="btn btn-g btn-s" onclick="markPaid('${esc(inv.id)}')">Paid</button>`:''}
      ${canDel?`<button class="btn btn-g btn-s" onclick="deleteInvoice('${esc(inv.id)}')">Del</button>`:''}
    </div></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--muted);font-style:italic">No invoices</td></tr>';
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
    </div>`);
}

function markPaid(id){
  const inv=proxyDB.invoices.find(i=>i.id===id);if(!inv)return;
  inv.status='Paid';
  proxyDB.bank.unshift({date:new Date().toISOString().split('T')[0],desc:`Payment received - ${inv.client}`,cat:'Invoice Payment',ref:inv.id,credit:inv.amount,debit:0});
  save();renderInvoices();renderDashboard();toast(`${id} marked paid`,'ok');audit('MARK_PAID',`${id}`);
}
function delInvoice(id){
  if(!confirm(`Delete ${id}?`))return;
  proxyDB.invoices=proxyDB.invoices.filter(i=>i.id!==id);
  save();renderInvoices();renderDashboard();toast('Invoice deleted');audit('DELETE',id);
}

function initNewInvoice(){
  const due=new Date();due.setDate(due.getDate()+30);
  document.getElementById('ni-due').value=due.toISOString().split('T')[0];
}
function saveInvoice(){
  const client=document.getElementById('ni-client').value.trim();
  const amount=parseFloat(document.getElementById('ni-amount').value)||0;
  if(!client){toast('Client required','err');return;}
  const id=nextId('inv');
  proxyDB.invoices.unshift({id,client,amount,dueDate:document.getElementById('ni-due').value,status:document.getElementById('ni-status').value,po:document.getElementById('ni-po')?.value.trim()||'',ref:document.getElementById('ni-ref').value.trim(),date:new Date().toISOString().split('T')[0]});
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
      <div class="fgroup"><label class="flbl">Date</label><input type="date" class="finput" id="bk-date" value="${new Date().toISOString().split('T')[0]}"></div>
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
function renderStatement(){
  const invs=[...proxyDB.invoices].sort((a,b)=>a.date.localeCompare(b.date));
  const total=invs.reduce((a,i)=>a+i.amount,0);
  const paid=invs.filter(i=>i.status==='Paid').reduce((a,i)=>a+i.amount,0);
  const out=total-paid;let bal=0;
  const rows=invs.map(inv=>{bal+=inv.amount;return`<tr><td>${fmtD(inv.date)}</td><td class="mono">${esc(inv.id)}</td><td>Invoice</td><td class="amt">${fmt(inv.amount)}</td><td>-</td><td class="amt">${fmt(bal)}</td></tr>`;});
  proxyDB.bank.filter(b=>b.credit>0).forEach(b=>{bal-=b.credit;rows.push(`<tr><td>${fmtD(b.date)}</td><td class="mono">${esc(b.ref||'-')}</td><td>Payment</td><td>-</td><td class="amt" style="color:var(--pill-paid-txt)">${fmt(b.credit)}</td><td class="amt">${fmt(bal)}</td></tr>`);});
  document.getElementById('stmt-content').innerHTML=`
    <div style="background:var(--surface2);border:1px solid var(--border);padding:18px;margin-bottom:14px;border-radius:2px">
      <div style="font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:700;margin-bottom:2px">AECI Chempark</div>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:2px">ACCOUNT STATEMENT  -  BLACKFIRE SOLUTIONS</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px">
        <div style="background:var(--surface);border:1px solid var(--border);padding:12px;border-radius:2px"><div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Total Invoiced</div><div style="font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:700">${fmt(total)}</div></div>
        <div style="background:var(--surface);border:1px solid var(--border);padding:12px;border-radius:2px"><div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Total Paid</div><div style="font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:700;color:var(--pill-paid-txt)">${fmt(paid)}</div></div>
        <div style="background:var(--surface);border:1px solid var(--border);padding:12px;border-radius:2px"><div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Outstanding</div><div style="font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:700;color:${out>0?'var(--pill-ovr-txt)':'var(--pill-paid-txt)'}">${fmt(out)}</div></div>
      </div>
    </div>
    <div class="panel"><div class="tw"><table><thead><tr><th>Date</th><th>Reference</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--muted)">No transactions</td></tr>'}</tbody></table></div></div>`;
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
  document.getElementById('pay-date').value=new Date().toISOString().split('T')[0];
  const unpaid=proxyDB.invoices.filter(i=>i.status!=='Paid');
  document.getElementById('pay-inv-list').innerHTML=unpaid.length?unpaid.map(inv=>`
    <label style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:2px;cursor:pointer;margin-bottom:6px;background:var(--surface2)">
      <input type="radio" name="pay-sel" value="${esc(inv.id)}" style="accent-color:var(--accent)">
      <span style="flex:1;font-size:12px"><span class="mono">${esc(inv.id)}</span>${inv.po?'  -  PO: '+esc(inv.po):''}</span>
      <span class="amt">${fmt(inv.amount)}</span>
      <span>${pillH(inv.status)}</span>
    </label>`).join(''):'<div style="color:var(--muted);font-style:italic;font-size:12px;padding:10px">No outstanding invoices</div>';
  if(unpaid.length>0){
    document.querySelectorAll('input[name="pay-sel"]')[0].checked=true;
    document.getElementById('pay-amount').value=unpaid[0].amount;
    document.querySelectorAll('input[name="pay-sel"]').forEach(r=>r.addEventListener('change',function(){const inv=proxyDB.invoices.find(i=>i.id===this.value);if(inv)document.getElementById('pay-amount').value=inv.amount;}));
  }
}
function logPayment(){
  const sel=document.querySelector('input[name="pay-sel"]:checked');
  if(!sel){toast('Select an invoice','err');return;}
  markPaid(sel.value);
  audit('LOG_PAYMENT',`Payment for ${sel.value} logged by ${SESSION?.username}`);
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
  const username = document.getElementById('nu-user')?.value.trim().toLowerCase();
  const name     = document.getElementById('nu-name')?.value.trim();
  const email    = document.getElementById('nu-email')?.value.trim();
  const title    = document.getElementById('nu-title')?.value.trim();
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

document.addEventListener('DOMContentLoaded',()=>{
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
  const service = document.getElementById('nc-service')?.value.trim();
  const location = document.getElementById('nc-location')?.value.trim() || '';
  const priority = document.getElementById('nc-priority')?.value || 'Normal';
  const tech = document.getElementById('nc-tech')?.value.trim() || '';
  const assignedTo = document.getElementById('nc-assign')?.value.trim() || '';
  const notes = document.getElementById('nc-notes')?.value.trim() || '';
  const calloutTime = document.getElementById('nc-time')?.value || '08:00';
  const po = document.getElementById('nc-po')?.value.trim() || '';
  
  if (!service) { toast('Please fill in the service field', 'err'); return; }
  
  const r = await api('POST', 'callouts.php', {
    client_name: client,
    service,
    location,
    priority,
    tech,
    assigned_to: assignedTo,
    status: 'Open',
    callout_date: new Date().toISOString().split('T')[0],
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
  const po = document.getElementById('po-input')?.value.trim();
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
  const notes = document.getElementById('nq-notes')?.value.trim() || '';
  
  // Collect line items
  const rows = document.querySelectorAll('.qi-row');
  const items = [];
  rows.forEach(row => {
    const desc = row.querySelector('.qi-desc')?.value.trim();
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
    due_date: due.toISOString().split('T')[0],
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
  const r = await api('PUT', `invoices.php?id=${id}`, { action: 'mark_paid', pay_date: new Date().toISOString().split('T')[0] });
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
  const client = document.getElementById('ni-client')?.value.trim() || 'AECI Chempark';
  const amount = parseFloat(document.getElementById('ni-amount')?.value) || 0;
  const dueDate = document.getElementById('ni-due')?.value;
  const status = document.getElementById('ni-status')?.value || 'Draft';
  const po = document.getElementById('ni-po')?.value.trim() || '';
  const ref = document.getElementById('ni-ref')?.value.trim() || '';
  
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
  const sel = document.querySelector('input[name="pay-sel"]:checked');
  if (!sel) { toast('Select an invoice', 'err'); return; }
  const invId = sel.value;
  const date = document.getElementById('pay-date')?.value || new Date().toISOString().split('T')[0];
  const amount = parseFloat(document.getElementById('pay-amount')?.value) || 0;
  const notes = document.getElementById('pay-notes')?.value.trim() || '';
  
  const r = await api('PUT', `invoices.php?id=${invId}`, { action: 'mark_paid', pay_date: date, amount, notes });
  if (!r.success) { toast(r.error || 'Error', 'err'); return; }
  
  await Promise.all([refreshInvoices(), refreshTransactions()]);
  updateBadges();
  renderPayList();
  toast(`Payment logged for ${invId}`, 'ok');
}

/* ── Override: addTransaction ────────────────────────── */
async function addTransaction(){
  const date = document.getElementById('bk-date')?.value;
  const desc = document.getElementById('bk-desc')?.value.trim();
  const type = document.getElementById('bk-type')?.value;
  const cat  = document.getElementById('bk-cat')?.value;
  const ref  = document.getElementById('bk-ref')?.value.trim() || '';
  const amount = parseFloat(document.getElementById('bk-amount')?.value) || 0;
  
  if (!desc || !amount) { toast('Fill in description and amount', 'err'); return; }
  
  const r = await api('POST', 'transactions.php', {
    trans_date: date || new Date().toISOString().split('T')[0],
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

/* ── Page refresh on navigation ──────────────────────── */
// Wrap showPortalPage to refresh data on page visits
const _origShowPortalPage = showPortalPage;
function showPortalPage(id, el) {
  _origShowPortalPage(id, el);
  // Refresh data for relevant modules
  const refreshMap = {
    'p-callouts':     async()=>{ await refreshCallouts(); renderCallouts(''); updateBadges(); },
    'p-quotes':       async()=>{ await refreshQuotes();   renderQuotes('');   updateBadges(); },
    'p-invoices':     async()=>{ await refreshInvoices(); renderInvoices(''); updateBadges(); },
    'p-transactions': async()=>{ await refreshTransactions(); renderTransactions(''); },
    'p-dashboard':    async()=>{ await refreshAll(); renderDashboard(); updateBadges(); },
    'p-log-payment':  async()=>{ await refreshInvoices(); renderPayList(); },
    'p-audit':        async()=>{ const r=await api('GET','audit.php?limit=200'); AUDIT_LOG=(r.data||[]).map(e=>({ts:e.created_at?.slice(11,19)||'',user:e.username,role:'',action:e.action,detail:e.detail,level:'info'})); renderAudit(); },
    'p-users':        async()=>{ await refreshUsers(); renderUsers(); },
  };
  if (refreshMap[id]) refreshMap[id]();
}

</script>

<!-- Back to top button -->
<button id="back-to-top" onclick="scrollToTop()" title="Back to top"></button>

<script>
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
</script>




