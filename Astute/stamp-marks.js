/* ============================================================
   ASTUTE INSIGHTS — STAMP / SEAL GENERATORS
   Produces SVG markup strings (consumed via dangerouslySetInnerHTML).
   The mark: the open chevron "A" peak with its single dot counter.
   ============================================================ */
(function () {
  const PALETTE = {
    midnight: '#0A1626', harbor: '#0F2138', slate: '#16304C', divider: '#244360',
    aurum: '#C2A04A', champagne: '#E2CD93', antique: '#927524',
    garnet: '#7E2E36', garnetLt: '#A24650', garnetDk: '#5C1F25',
    alabaster: '#F4F0E6', pearl: '#E9E2D2', parchment: '#DCD3BF',
    ink: '#0A1626', graphite: '#44505F',
  };

  // ---- the canonical chevron mark, scaled into a 0..S box centred at (cx,cy)
  // native art lives in viewBox "24 18 72 76" -> width 72, height 76
  function chevron(cx, cy, scale, color, sw) {
    // EXACT canonical symbol — the open, asymmetric peak (two strokes that do
    // NOT meet at the crown, anchored right) + the single dot counter.
    // native art lives in viewBox "24 18 72 76".
    const L = { ax: 52.8, ay: 38.88, bx: 38.4, by: 68.64,   // short left stroke
                cx: 67.2, cy: 38.88, dx2: 90, dy2: 86,       // long right stroke
                dotx: 60, doty: 62, r: 4.6 };
    // centre on the visual bounding box of the strokes (38.4..90 , 38.88..86)
    const ncx = 64.2, ncy = 62.44;
    const T = (x, y) => [cx + (x - ncx) * scale, cy + (y - ncy) * scale];
    const [l1ax, l1ay] = T(L.ax, L.ay);
    const [l1bx, l1by] = T(L.bx, L.by);
    const [l2ax, l2ay] = T(L.cx, L.cy);
    const [l2bx, l2by] = T(L.dx2, L.dy2);
    const [dx, dy] = T(L.dotx, L.doty);
    const w = (sw * scale).toFixed(2);
    return `
      <line x1="${l1ax.toFixed(2)}" y1="${l1ay.toFixed(2)}" x2="${l1bx.toFixed(2)}" y2="${l1by.toFixed(2)}"
            stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
      <line x1="${l2ax.toFixed(2)}" y1="${l2ay.toFixed(2)}" x2="${l2bx.toFixed(2)}" y2="${l2by.toFixed(2)}"
            stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
      <circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="${(L.r * scale).toFixed(2)}" fill="${color}"/>`;
  }

  function polar(cx, cy, r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  // small diamond marker
  function diamond(cx, cy, r, color) {
    return `<path d="M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z" fill="${color}"/>`;
  }

  // a ring of tiny dots/ticks around a radius
  function tickRing(cx, cy, r, count, len, color, w) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const deg = (360 / count) * i;
      const [x1, y1] = polar(cx, cy, r, deg);
      const [x2, y2] = polar(cx, cy, r + len, deg);
      s += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    }
    return s;
  }

  function dotRing(cx, cy, r, count, dr, color) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const [x, y] = polar(cx, cy, r, (360 / count) * i);
      s += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${dr}" fill="${color}"/>`;
    }
    return s;
  }

  /* =========================================================
     ROUND SEAL
     opts: { ring, text, mark, accent, bg, topText, botText,
             year, faceTop, idPrefix, dots(bool) }
     ========================================================= */
  function roundSeal(opts) {
    const o = Object.assign({
      ring: PALETTE.aurum, text: PALETTE.aurum, mark: PALETTE.aurum,
      accent: PALETTE.champagne, bg: 'none',
      topText: 'ASTUTE · INSIGHTS', botText: 'DATA INTELLIGENCE',
      year: 'MMXXVI', idPrefix: 's', dots: true, faceTop: 'Cormorant Garamond',
      subLabel: '',
    }, opts);
    const C = 130, cx = C, cy = C;
    const rOuter = 124, rBand = 108, rTick = 100, rInner = 90;
    const rTop = 116, rBot = 114;
    const idTop = o.idPrefix + '-top', idBot = o.idPrefix + '-bot';

    const topPath = `M ${cx - rTop},${cy} A ${rTop},${rTop} 0 0,1 ${cx + rTop},${cy}`;
    const botPath = `M ${cx - rBot},${cy} A ${rBot},${rBot} 0 0,0 ${cx + rBot},${cy}`;

    const bg = o.bg === 'none' ? '' :
      `<circle cx="${cx}" cy="${cy}" r="${rOuter + 4}" fill="${o.bg}"/>`;

    const sideDiamonds =
      diamond(...polar(cx, cy, (rOuter + rBand) / 2, 90), 3.4, o.accent) +
      diamond(...polar(cx, cy, (rOuter + rBand) / 2, 270), 3.4, o.accent);

    return `
<svg viewBox="0 0 260 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
  <defs>
    <path id="${idTop}" d="${topPath}"/>
    <path id="${idBot}" d="${botPath}"/>
  </defs>
  ${bg}
  <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="${o.ring}" stroke-width="1.4"/>
  <circle cx="${cx}" cy="${cy}" r="${rBand}" fill="none" stroke="${o.ring}" stroke-width="3.2"/>
  ${o.dots ? dotRing(cx, cy, rTick, 72, 0.9, o.ring) : tickRing(cx, cy, rInner, 48, 4, o.ring, 1)}
  <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="${o.ring}" stroke-width="1"/>

  <text fill="${o.text}" font-family="${o.faceTop}, serif" font-weight="600"
        font-size="18.5" letter-spacing="3.4" text-anchor="middle">
    <textPath href="#${idTop}" startOffset="50%">${o.topText}</textPath>
  </text>
  <text fill="${o.text}" font-family="IBM Plex Mono, monospace" font-weight="400"
        font-size="11.5" letter-spacing="5" text-anchor="middle">
    <textPath href="#${idBot}" startOffset="50%">${o.botText}</textPath>
  </text>
  ${sideDiamonds}

  ${o.subLabel ? `<text x="${cx}" y="${cy - 40}" fill="${o.text}" font-family="IBM Plex Mono, monospace"
        font-size="8" letter-spacing="3.5" text-anchor="middle" opacity="0.92">${o.subLabel}</text>` : ''}
  ${(() => {
    const hasAddr = o.addr && o.addr.length;
    const markY = hasAddr ? cy - 16 : cy - 4;
    const markScale = hasAddr ? 0.5 : 0.58;
    const ruleY = hasAddr ? cy + 22 : cy + 40;
    const yearY = hasAddr ? cy + 37 : cy + 56;
    let s = chevron(cx, markY, markScale, o.mark, 3.4);
    s += `<line x1="${cx - 22}" y1="${ruleY}" x2="${cx + 22}" y2="${ruleY}" stroke="${o.ring}" stroke-width="0.9"/>`;
    s += `<text x="${cx}" y="${yearY}" fill="${o.text}" font-family="IBM Plex Mono, monospace" font-size="9.5" letter-spacing="4" text-anchor="middle">${o.year}</text>`;
    if (hasAddr) s += o.addr.map((ln, i) =>
      `<text x="${cx}" y="${cy + 50 + i * 9.4}" fill="${o.text}" font-family="IBM Plex Mono, monospace" font-size="6.4" letter-spacing="1.1" text-anchor="middle">${ln}</text>`).join('');
    return s;
  })()}
</svg>`;
  }

  /* =========================================================
     DATE STAMP — round self-inking dater
     opts: { ring, text, mark, accent, bg, top, bottom, date, perLabel }
     ========================================================= */
  function dateStamp(opts) {
    const o = Object.assign({
      ring: PALETTE.garnet, text: PALETTE.garnet, mark: PALETTE.garnet, accent: PALETTE.garnet,
      bg: 'none', top: 'ASTUTE INSIGHTS', bottom: 'LONDON · EC2N 2DL',
      date: '09 JUN 2026', label: 'RECEIVED', idPrefix: 'date',
    }, opts);
    const C = 130, cx = C, cy = C;
    const rOuter = 124, rBand = 110, rInner = 92;
    const rTop = 117, rBot = 116;
    const idTop = o.idPrefix + '-t', idBot = o.idPrefix + '-b';
    const topPath = `M ${cx - rTop},${cy} A ${rTop},${rTop} 0 0,1 ${cx + rTop},${cy}`;
    const botPath = `M ${cx - rBot},${cy} A ${rBot},${rBot} 0 0,0 ${cx + rBot},${cy}`;
    const bg = o.bg === 'none' ? '' : `<circle cx="${cx}" cy="${cy}" r="${rOuter + 4}" fill="${o.bg}"/>`;
    const bandW = 74; // half-width of the central date band
    return `
<svg viewBox="0 0 260 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
  <defs>
    <path id="${idTop}" d="${topPath}"/>
    <path id="${idBot}" d="${botPath}"/>
  </defs>
  ${bg}
  <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="${o.ring}" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${rBand}" fill="none" stroke="${o.ring}" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="${o.ring}" stroke-width="1"/>

  <text fill="${o.text}" font-family="Cormorant Garamond, serif" font-weight="600"
        font-size="17" letter-spacing="3" text-anchor="middle">
    <textPath href="#${idTop}" startOffset="50%">${o.top}</textPath>
  </text>
  <text fill="${o.text}" font-family="IBM Plex Mono, monospace" font-size="10.5" letter-spacing="3.5" text-anchor="middle">
    <textPath href="#${idBot}" startOffset="50%">${o.bottom}</textPath>
  </text>
  ${diamond(...polar(cx, cy, (rOuter + rBand) / 2 + 1, 90), 3, o.accent)}
  ${diamond(...polar(cx, cy, (rOuter + rBand) / 2 + 1, 270), 3, o.accent)}

  ${chevron(cx, cy - 40, 0.34, o.mark, 3.6)}
  <text x="${cx}" y="${cy - 18}" fill="${o.text}" font-family="IBM Plex Mono, monospace"
        font-size="9" letter-spacing="5" text-anchor="middle">${o.label}</text>

  <line x1="${cx - bandW}" y1="${cy - 8}" x2="${cx + bandW}" y2="${cy - 8}" stroke="${o.ring}" stroke-width="1.4"/>
  <line x1="${cx - bandW}" y1="${cy + 22}" x2="${cx + bandW}" y2="${cy + 22}" stroke="${o.ring}" stroke-width="1.4"/>
  <text x="${cx}" y="${cy + 13}" fill="${o.text}" font-family="IBM Plex Mono, monospace" font-weight="500"
        font-size="17" letter-spacing="2" text-anchor="middle">${o.date}</text>

  <text x="${cx}" y="${cy + 42}" fill="${o.text}" font-family="IBM Plex Mono, monospace"
        font-size="8.5" letter-spacing="3" text-anchor="middle">PER ____________</text>
</svg>`;
  }

  /* =========================================================
     POSTAGE STAMP — perforated rectangle
     ========================================================= */
  function postage(opts) {
    const o = Object.assign({
      ground: PALETTE.midnight, frame: PALETTE.aurum, mark: PALETTE.aurum,
      ink: PALETTE.bone || '#DDE4EC', accent: PALETTE.champagne,
      denom: 'No. 01', country: 'ASTUTE INSIGHTS', sub: 'DATA INTELLIGENCE',
    }, opts);
    const W = 200, H = 248, pad = 12, perfR = 4.6, step = 16;
    // perforation circles (knock-outs) along the 4 edges
    let perfs = '';
    const along = (n, fn) => { for (let i = 0; i <= n; i++) perfs += fn(i); };
    const nx = Math.round(W / step), ny = Math.round(H / step);
    const perfFill = o.ground === 'none' ? o.frame : '#11202F';
    along(nx, i => `<circle cx="${(i * (W / nx)).toFixed(1)}" cy="0" r="${perfR}" fill="${perfFill}"/>`);
    along(nx, i => `<circle cx="${(i * (W / nx)).toFixed(1)}" cy="${H}" r="${perfR}" fill="${perfFill}"/>`);
    along(ny, i => `<circle cx="0" cy="${(i * (H / ny)).toFixed(1)}" r="${perfR}" fill="${perfFill}"/>`);
    along(ny, i => `<circle cx="${W}" cy="${(i * (H / ny)).toFixed(1)}" r="${perfR}" fill="${perfFill}"/>`);

    const cx = W / 2;
    const groundRect = o.ground === 'none' ? '' : `<rect x="0" y="0" width="${W}" height="${H}" fill="${o.ground}"/>`;
    return `
<svg viewBox="-8 -8 ${W + 16} ${H + 16}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block">
  ${groundRect}
  <rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="${H - pad * 2}" fill="none" stroke="${o.frame}" stroke-width="1.2"/>
  <rect x="${pad + 5}" y="${pad + 5}" width="${W - (pad + 5) * 2}" height="${H - (pad + 5) * 2}" fill="none" stroke="${o.frame}" stroke-width="0.6" opacity="0.6"/>

  <text x="${cx}" y="${pad + 26}" fill="${o.frame}" font-family="Cormorant Garamond, serif" font-weight="600"
        font-size="16" letter-spacing="2.6" text-anchor="middle">${o.country}</text>
  <line x1="${pad + 16}" y1="${pad + 36}" x2="${W - pad - 16}" y2="${pad + 36}" stroke="${o.frame}" stroke-width="0.7" opacity="0.6"/>

  ${chevron(cx, 128, 0.92, o.mark, 3.4)}

  <line x1="${pad + 16}" y1="${H - pad - 52}" x2="${W - pad - 16}" y2="${H - pad - 52}" stroke="${o.frame}" stroke-width="0.7" opacity="0.6"/>
  <text x="${cx}" y="${H - pad - 36}" fill="${o.ink}" font-family="IBM Plex Mono, monospace"
        font-size="9.5" letter-spacing="4" text-anchor="middle">${o.sub}</text>
  <text x="${cx}" y="${H - pad - 16}" fill="${o.frame}" font-family="Cormorant Garamond, serif" font-weight="600"
        font-style="italic" font-size="22" text-anchor="middle">${o.denom}</text>

  ${perfs}
</svg>`;
  }

  /* =========================================================
     RUBBER ADDRESS STAMP — bordered block, mark + details
     opts: { ink, name, tagline, line1, line2, line3 }
     ========================================================= */
  function rubberStamp(opts) {
    const o = Object.assign({
      ink: PALETTE.garnet, name: 'ASTUTE INSIGHTS', tagline: 'DATA INTELLIGENCE',
      line1: '102 Aloeridge 2, 18 Stoneridge Dr', line2: 'Greenstone Hill', line3: 'Lethabong, 1609',
    }, opts);
    const W = 478, H = 158, m = 4;
    const divX = 120, tx = 140;
    const mk = chevron(62, H / 2, 0.62, o.ink, 3.4);
    return `
<svg viewBox="-6 -6 ${W + 12} ${H + 12}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
  <rect x="${m}" y="${m}" width="${W - m * 2}" height="${H - m * 2}" rx="3" fill="none" stroke="${o.ink}" stroke-width="2.6"/>
  <rect x="${m + 4}" y="${m + 4}" width="${W - (m + 4) * 2}" height="${H - (m + 4) * 2}" rx="2" fill="none" stroke="${o.ink}" stroke-width="0.8" opacity="0.65"/>
  <line x1="${divX}" y1="${m + 16}" x2="${divX}" y2="${H - m - 16}" stroke="${o.ink}" stroke-width="1.4"/>
  ${mk}
  <text x="${tx}" y="56" fill="${o.ink}" font-family="Cormorant Garamond, serif" font-weight="600"
        font-size="33" letter-spacing="1.2">${o.name}</text>
  <text x="${tx}" y="74" fill="${o.ink}" font-family="IBM Plex Mono, monospace"
        font-size="10" letter-spacing="4.4">${o.tagline}</text>
  <text x="${tx}" y="103" fill="${o.ink}" font-family="IBM Plex Mono, monospace" font-size="13" letter-spacing="0.3">${o.line1}</text>
  <text x="${tx}" y="122" fill="${o.ink}" font-family="IBM Plex Mono, monospace" font-size="13" letter-spacing="0.3">${o.line2}</text>
  <text x="${tx}" y="141" fill="${o.ink}" font-family="IBM Plex Mono, monospace" font-size="13" letter-spacing="0.3">${o.line3}</text>
</svg>`;
  }

  window.AstuteStamp = { PALETTE, roundSeal, postage, dateStamp, rubberStamp, chevron, polar };
})();
