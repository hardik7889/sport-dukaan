/* ============================================================
   Sport Dukaan — inline SVG product art library
   Ek composition per product id. Sab kuch viewBox 0 0 220 150.
   Har gradient ka apna unique id (warna cards ek jese dikhenge).
   ============================================================ */
(function () {
  'use strict';
  let _id = 0;
  const uid = () => 'spa' + (++_id);
  const F = (n) => Math.round(n * 10) / 10;

  const defs = (s) => `<defs>${s}</defs>`;
  const lin = (id, c1, c2, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
  const rad = (id, c1, c2, cx = 0.35, cy = 0.28, r = 1) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;
  const shadow = (cx, cy, rx, ry, o = 0.35) =>
    `<ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F(rx)}" ry="${F(ry)}" fill="rgba(0,0,0,${o})"/>`;
  const spec = (cx, cy, rx, ry, o = 0.25) =>
    `<ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F(rx)}" ry="${F(ry)}" fill="rgba(255,255,255,${o})"/>`;

  const pentPts = (x, y, r, rot) => {
    const p = [];
    for (let i = 0; i < 5; i++) {
      const a = ((rot + i * 72 - 90) * Math.PI) / 180;
      p.push(F(x + r * Math.cos(a)) + ',' + F(y + r * Math.sin(a)));
    }
    return p.join(' ');
  };

  /* ---------- balls ---------- */
  function ball(x, y, r, c1, c2, paint) {
    const g = uid();
    return defs(rad(g, c1, c2)) + shadow(x, y + r * 0.9, r * 0.92, r * 0.22, 0.42)
      + `<circle cx="${F(x)}" cy="${F(y)}" r="${F(r)}" fill="url(#${g})"/>`
      + (paint ? paint(x, y, r) : '')
      + spec(x - r * 0.3, y - r * 0.34, r * 0.2, r * 0.13, 0.3);
  }

  const football = (x, y, r) => ball(x, y, r, '#ffffff', '#9aa3b5', (cx, cy, R) => {
    let s = `<polygon points="${pentPts(cx, cy, R * 0.4, 0)}" fill="#1b2030"/>`;
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      const px = cx + R * 0.76 * Math.cos(a), py = cy + R * 0.76 * Math.sin(a);
      s += `<polygon points="${pentPts(px, py, R * 0.19, 0)}" fill="#1b2030"/>`;
      s += `<line x1="${F(cx + R * 0.4 * Math.cos(a))}" y1="${F(cy + R * 0.4 * Math.sin(a))}" x2="${F(cx + R * 0.97 * Math.cos(a))}" y2="${F(cy + R * 0.97 * Math.sin(a))}" stroke="#1b2030" stroke-width="${F(R * 0.05)}"/>`;
    }
    return s;
  });

  const basketball = (x, y, r) => ball(x, y, r, '#f5862f', '#8a3c0c', (cx, cy, R) => {
    const w = Math.max(2, R * 0.055);
    return `<g stroke="#2a1408" stroke-width="${F(w)}" fill="none">
      <line x1="${F(cx)}" y1="${F(cy - R)}" x2="${F(cx)}" y2="${F(cy + R)}"/>
      <line x1="${F(cx - R)}" y1="${F(cy)}" x2="${F(cx + R)}" y2="${F(cy)}"/>
      <path d="M ${F(cx - R)} ${F(cy)} Q ${F(cx - R * 0.35)} ${F(cy - R * 0.85)} ${F(cx)} ${F(cy - R)}"/>
      <path d="M ${F(cx + R)} ${F(cy)} Q ${F(cx + R * 0.35)} ${F(cy - R * 0.85)} ${F(cx)} ${F(cy - R)}"/>
      <path d="M ${F(cx - R)} ${F(cy)} Q ${F(cx - R * 0.35)} ${F(cy + R * 0.85)} ${F(cx)} ${F(cy + R)}"/>
      <path d="M ${F(cx + R)} ${F(cy)} Q ${F(cx + R * 0.35)} ${F(cy + R * 0.85)} ${F(cx)} ${F(cy + R)}"/>
    </g>`;
  });

  const volleyball = (x, y, r) => ball(x, y, r, '#ffffff', '#98a2b8', (cx, cy, R) => {
    const cols = ['#2ec4b6', '#ffd166', '#ff5fa2'];
    let s = `<g fill="none" stroke-width="${F(R * 0.2)}">`;
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * R * 0.52;
      s += `<path d="M ${F(cx - R)} ${F(cy + o)} Q ${F(cx)} ${F(cy + o - R * 0.8)} ${F(cx + R)} ${F(cy + o)}" stroke="${cols[i]}"/>`;
    }
    return s + '</g>';
  });

  const cricketBall = (x, y, r) => ball(x, y, r, '#d33a2c', '#6d1408', (cx, cy, R) =>
    `<path d="M ${F(cx - R * 0.72)} ${F(cy - R * 0.7)} Q ${F(cx)} ${F(cy)} ${F(cx - R * 0.72)} ${F(cy + R * 0.7)}" fill="none" stroke="#fff" stroke-width="${F(R * 0.09)}" stroke-dasharray="${F(R * 0.16)} ${F(R * 0.1)}"/>
     <path d="M ${F(cx + R * 0.72)} ${F(cy - R * 0.7)} Q ${F(cx)} ${F(cy)} ${F(cx + R * 0.72)} ${F(cy + R * 0.7)}" fill="none" stroke="#fff" stroke-width="${F(R * 0.09)}" stroke-dasharray="${F(R * 0.16)} ${F(R * 0.1)}"/>`);

  /* ---------- cricket ---------- */
  function cricketBat(x, y, s, c1, c2, grip) {
    c1 = c1 || '#e8c07a'; c2 = c2 || '#a9782f'; grip = grip || '#1b2030';
    const g = uid();
    const w = 30 * s, h = 74 * s;
    let rings = '';
    for (let i = 0; i < 5; i++) {
      rings += `<line x1="${F(x - w * 0.22)}" y1="${F(y - h / 2 - 24 * s + i * 5 * s)}" x2="${F(x + w * 0.22)}" y2="${F(y - h / 2 - 24 * s + i * 5 * s)}" stroke="rgba(255,255,255,.28)" stroke-width="1.4"/>`;
    }
    return defs(lin(g, c1, c2)) + shadow(x + 6 * s, y + h * 0.62, w * 1.05, 7 * s, 0.4)
      + `<g transform="rotate(-16 ${F(x)} ${F(y)})">`
      + `<rect x="${F(x - w * 0.22)}" y="${F(y - h / 2 - 26 * s)}" width="${F(w * 0.44)}" height="${F(28 * s)}" rx="${F(w * 0.2)}" fill="${grip}"/>`
      + rings
      + `<rect x="${F(x - w / 2)}" y="${F(y - h / 2)}" width="${F(w)}" height="${F(h)}" rx="${F(w * 0.45)}" fill="url(#${g})"/>`
      + `<rect x="${F(x - w * 0.34)}" y="${F(y - h / 2)}" width="${F(w * 0.68)}" height="${F(h * 0.2)}" rx="${F(w * 0.3)}" fill="rgba(255,255,255,.18)"/>`
      + `<line x1="${F(x - w * 0.18)}" y1="${F(y - h * 0.34)}" x2="${F(x - w * 0.18)}" y2="${F(y + h * 0.42)}" stroke="rgba(120,72,20,.35)" stroke-width="1.6"/>`
      + `<line x1="${F(x + w * 0.18)}" y1="${F(y - h * 0.34)}" x2="${F(x + w * 0.18)}" y2="${F(y + h * 0.42)}" stroke="rgba(120,72,20,.35)" stroke-width="1.6"/>`
      + spec(x - w * 0.22, y - h * 0.3, w * 0.14, h * 0.2, 0.18)
      + `</g>`;
  }

  function stumps(x, y, s) {
    const g = uid();
    let o = defs(lin(g, '#f4e3c2', '#c9a26b')) + shadow(x, y + 44 * s, 40 * s, 6 * s, 0.4);
    for (let i = -1; i <= 1; i++) {
      o += `<rect x="${F(x + (i * 20 - 5) * s)}" y="${F(y - 20 * s)}" width="${F(10 * s)}" height="${F(62 * s)}" rx="${F(3 * s)}" fill="url(#${g})"/>`;
    }
    o += `<rect x="${F(x - 26 * s)}" y="${F(y - 24 * s)}" width="${F(14 * s)}" height="${F(5 * s)}" rx="${F(2 * s)}" fill="#e8d2a8"/>`;
    o += `<rect x="${F(x + 12 * s)}" y="${F(y - 24 * s)}" width="${F(14 * s)}" height="${F(5 * s)}" rx="${F(2 * s)}" fill="#e8d2a8"/>`;
    return o;
  }

  function kitBag(x, y, s, c1, c2, accent) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 26 * s, 48 * s, 7 * s, 0.4);
    o += `<rect x="${F(x - 48 * s)}" y="${F(y - 16 * s)}" width="${F(96 * s)}" height="${F(40 * s)}" rx="${F(14 * s)}" fill="url(#${g})"/>`;
    o += `<rect x="${F(x - 48 * s)}" y="${F(y + 6 * s)}" width="${F(96 * s)}" height="${F(18 * s)}" rx="${F(9 * s)}" fill="rgba(0,0,0,.22)"/>`;
    o += `<path d="M ${p(-14, -16)} Q ${p(0, -34)} ${p(14, -16)}" fill="none" stroke="${accent}" stroke-width="${F(4 * s)}"/>`;
    o += `<line x1="${F(x - 48 * s)}" y1="${F(y - 4 * s)}" x2="${F(x + 48 * s)}" y2="${F(y - 4 * s)}" stroke="${accent}" stroke-width="${F(2.4 * s)}" opacity="0.8"/>`;
    return o;
  }

  /* ---------- rackets ---------- */
  function racket(x, y, rx, ry, frame, strings, shaft, gripColor) {
    const c = uid();
    let s = defs(`<clipPath id="${c}"><ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(rx)}" ry="${F(ry)}"/></clipPath>`);
    s += shadow(x + rx * 0.55, y + ry * 1.95, rx * 0.85, ry * 0.16, 0.35);
    s += `<rect x="${F(x - 3)}" y="${F(y + ry - 3)}" width="6" height="${F(ry * 0.85)}" rx="3" fill="${shaft}"/>`;
    s += `<rect x="${F(x - 4.5)}" y="${F(y + ry + ry * 0.55)}" width="9" height="${F(ry * 0.38)}" rx="4.5" fill="${gripColor}"/>`;
    s += `<g clip-path="url(#${c})" stroke="${strings}" stroke-width="1.1" opacity="0.85">`;
    for (let i = -4; i <= 4; i++) {
      const px = x + (i * rx) / 4.4;
      s += `<line x1="${F(px)}" y1="${F(y - ry)}" x2="${F(px)}" y2="${F(y + ry)}"/>`;
    }
    for (let j = -4; j <= 4; j++) {
      const py = y + (j * ry) / 4.4;
      s += `<line x1="${F(x - rx)}" y1="${F(py)}" x2="${F(x + rx)}" y2="${F(py)}"/>`;
    }
    s += `</g>`;
    s += `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(rx)}" ry="${F(ry)}" fill="rgba(255,255,255,.05)" stroke="${frame}" stroke-width="${F(Math.max(3, rx * 0.13))}"/>`;
    return s;
  }

  function shuttle(x, y, s) {
    let o = shadow(x, y + 26 * s, 20 * s, 5 * s, 0.38);
    for (let i = -1.5; i <= 1.5; i++) {
      const a = i * 22;
      o += `<line x1="${F(x)}" y1="${F(y + 4 * s)}" x2="${F(x + (a * 16 * s) / 1.5)}" y2="${F(y - 26 * s)}" stroke="#ffffff" stroke-width="${F(3.4 * s)}" stroke-linecap="round"/>`;
    }
    o += `<path d="M ${F(x - 16 * s)} ${F(y - 22 * s)} Q ${F(x)} ${F(y - 34 * s)} ${F(x + 16 * s)} ${F(y - 22 * s)}" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1.2"/>`;
    o += `<path d="M ${F(x - 9 * s)} ${F(y + 2 * s)} A ${F(9 * s)} ${F(9 * s)} 0 0 0 ${F(x + 9 * s)} ${F(y + 2 * s)} L ${F(x + 6 * s)} ${F(y + 14 * s)} L ${F(x - 6 * s)} ${F(y + 14 * s)} Z" fill="#e8d2a8"/>`;
    o += `<rect x="${F(x - 7 * s)}" y="${F(y + 1 * s)}" width="${F(14 * s)}" height="${F(4 * s)}" fill="#d33a2c"/>`;
    return o;
  }

  function ttBat(x, y, s) {
    const g = uid();
    let o = defs(rad(g, '#d33a2c', '#7a1a10', 0.4, 0.3)) + shadow(x, y + 30 * s, 20 * s, 5 * s, 0.4);
    o += `<rect x="${F(x - 5 * s)}" y="${F(y + 8 * s)}" width="${F(10 * s)}" height="${F(24 * s)}" rx="${F(4 * s)}" fill="#c98b5e"/>`;
    o += `<circle cx="${F(x)}" cy="${F(y - 8 * s)}" r="${F(24 * s)}" fill="url(#${g})"/>`;
    o += `<circle cx="${F(x)}" cy="${F(y - 8 * s)}" r="${F(24 * s)}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`;
    return o;
  }

  /* ---------- apparel / shoes ---------- */
  function shirt(x, y, s, c1, c2, accent) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    const d = `M ${p(-14, -30)} L ${p(-32, -25)} L ${p(-45, -4)} L ${p(-29, 7)} L ${p(-25, -2)} L ${p(-25, 40)} L ${p(25, 40)} L ${p(25, -2)} L ${p(29, 7)} L ${p(45, -4)} L ${p(32, -25)} L ${p(14, -30)} Q ${p(0, -22)} ${p(-14, -30)} Z`;
    return defs(lin(g, c1, c2)) + shadow(x, y + 44 * s, 42 * s, 7 * s, 0.38)
      + `<path d="${d}" fill="url(#${g})"/>`
      + `<path d="M ${p(-14, -30)} Q ${p(0, -22)} ${p(14, -30)}" fill="none" stroke="${accent}" stroke-width="${F(3 * s)}"/>`
      + `<line x1="${F(x - 25 * s)}" y1="${F(y + 28 * s)}" x2="${F(x + 25 * s)}" y2="${F(y + 28 * s)}" stroke="${accent}" stroke-width="${F(3 * s)}" opacity="0.85"/>`
      + `<text x="${F(x)}" y="${F(y + 17 * s)}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${F(16 * s)}" fill="${accent}">7</text>`;
  }

  function shoe(x, y, s, c1, c2, sole, accent, studs) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    const d = `M ${p(-40, 0)} L ${p(-40, 14)} L ${p(30, 14)} Q ${p(44, 12)} ${p(40, -1)} L ${p(14, -9)} L ${p(-4, -11)} Q ${p(-12, -20)} ${p(-24, -17)} L ${p(-36, -7)} Q ${p(-44, -5)} ${p(-40, 0)} Z`;
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 19 * s, 40 * s, 6 * s, 0.4)
      + `<path d="${d}" fill="url(#${g})"/>`;
    o += `<path d="M ${p(-42, 12)} L ${p(38, 12)} Q ${p(46, 12)} ${p(42, 17)} L ${p(-40, 17)} Q ${p(-46, 16)} ${p(-42, 12)} Z" fill="${sole}"/>`;
    o += `<g stroke="${accent}" stroke-width="${F(2 * s)}" opacity="0.9">
      <line x1="${F(x - 2 * s)}" y1="${F(y - 9 * s)}" x2="${F(x + 10 * s)}" y2="${F(y - 6 * s)}"/>
      <line x1="${F(x - 4 * s)}" y1="${F(y - 5 * s)}" x2="${F(x + 8 * s)}" y2="${F(y - 2 * s)}"/>
      <line x1="${F(x - 6 * s)}" y1="${F(y - 1 * s)}" x2="${F(x + 6 * s)}" y2="${F(y + 2 * s)}"/>
    </g>`;
    if (studs) {
      o += `<g fill="${sole}">`;
      for (let i = 0; i < 4; i++) {
        o += `<rect x="${F(x + (-30 + i * 20) * s)}" y="${F(y + 17 * s)}" width="${F(6 * s)}" height="${F(5 * s)}" rx="${F(1.5 * s)}"/>`;
      }
      o += `</g>`;
    }
    return o;
  }

  function cap(x, y, s, c1, c2, brim) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    let o = defs(lin(g, c1, c2)) + shadow(x + 8 * s, y + 16 * s, 34 * s, 5 * s, 0.38);
    o += `<path d="M ${p(-30, 6)} A ${F(30 * s)} ${F(26 * s)} 0 0 1 ${p(30, 6)} Z" fill="url(#${g})"/>`;
    o += `<path d="M ${p(28, 5)} L ${p(54, 10)} Q ${p(58, 18)} ${p(46, 19)} L ${p(28, 14)} Z" fill="${brim}"/>`;
    o += `<line x1="${F(x)}" y1="${F(y - 20 * s)}" x2="${F(x)}" y2="${F(y + 6 * s)}" stroke="rgba(0,0,0,.18)" stroke-width="1.4"/>`;
    o += `<line x1="${F(x - 15 * s)}" y1="${F(y - 15 * s)}" x2="${F(x - 24 * s)}" y2="${F(y + 5 * s)}" stroke="rgba(0,0,0,.18)" stroke-width="1.4"/>`;
    o += `<line x1="${F(x + 15 * s)}" y1="${F(y - 15 * s)}" x2="${F(x + 24 * s)}" y2="${F(y + 5 * s)}" stroke="rgba(0,0,0,.18)" stroke-width="1.4"/>`;
    o += `<circle cx="${F(x)}" cy="${F(y - 21 * s)}" r="${F(3 * s)}" fill="${brim}"/>`;
    return o;
  }

  function trackPant(x, y, s, c1, c2, accent) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 44 * s, 26 * s, 5 * s, 0.4);
    o += `<path d="M ${p(-20, -32)} L ${p(20, -32)} L ${p(24, 40)} L ${p(4, 40)} L ${p(0, -6)} L ${p(-4, 40)} L ${p(-24, 40)} Z" fill="url(#${g})"/>`;
    o += `<rect x="${F(x - 20 * s)}" y="${F(y - 36 * s)}" width="${F(40 * s)}" height="${F(7 * s)}" rx="${F(3 * s)}" fill="${accent}"/>`;
    o += `<line x1="${F(x - 22 * s)}" y1="${F(y - 28 * s)}" x2="${F(x - 26 * s)}" y2="${F(y + 34 * s)}" stroke="${accent}" stroke-width="${F(2.4 * s)}"/>`;
    o += `<line x1="${F(x + 22 * s)}" y1="${F(y - 28 * s)}" x2="${F(x + 26 * s)}" y2="${F(y + 34 * s)}" stroke="${accent}" stroke-width="${F(2.4 * s)}"/>`;
    return o;
  }

  function vest(x, y, s, c1, c2, accent) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 42 * s, 22 * s, 5 * s, 0.4);
    o += `<path d="M ${p(-18, -30)} L ${p(-26, -26)} L ${p(-22, 34)} L ${p(22, 34)} L ${p(26, -26)} L ${p(18, -30)} Q ${p(10, -14)} ${p(0, -14)} Q ${p(-10, -14)} ${p(-18, -30)} Z" fill="url(#${g})"/>`;
    o += `<path d="M ${p(-18, -30)} Q ${p(-10, -14)} ${p(0, -14)} Q ${p(10, -14)} ${p(18, -30)}" fill="none" stroke="${accent}" stroke-width="${F(2.6 * s)}"/>`;
    o += `<line x1="${F(x - 24 * s)}" y1="${F(y - 20 * s)}" x2="${F(x - 21 * s)}" y2="${F(y + 30 * s)}" stroke="${accent}" stroke-width="${F(2.2 * s)}"/>`;
    o += `<line x1="${F(x + 24 * s)}" y1="${F(y - 20 * s)}" x2="${F(x + 21 * s)}" y2="${F(y + 30 * s)}" stroke="${accent}" stroke-width="${F(2.2 * s)}"/>`;
    return o;
  }

  /* ---------- protective / gloves ---------- */
  function helmet(x, y, s, c1, c2, grill) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 36 * s, 34 * s, 6 * s, 0.4);
    o += `<path d="M ${p(-32, 8)} A ${F(32 * s)} ${F(30 * s)} 0 0 1 ${p(32, 8)} L ${p(32, 14)} L ${p(-32, 14)} Z" fill="url(#${g})"/>`;
    o += `<path d="M ${p(30, 12)} L ${p(48, 15)} L ${p(46, 21)} L ${p(29, 18)} Z" fill="${c2}"/>`;
    o += `<g stroke="${grill}" stroke-width="${F(2.4 * s)}" fill="none">
      <path d="M ${p(26, 12)} L ${p(26, 34)}"/>
      <path d="M ${p(12, 10)} L ${p(12, 36)}"/>
      <path d="M ${p(-2, 10)} L ${p(-2, 37)}"/>
      <path d="M ${p(-16, 10)} L ${p(-16, 36)}"/>
      <path d="M ${p(30, 20)} L ${p(-20, 20)}"/>
      <path d="M ${p(30, 29)} L ${p(-20, 29)}"/>
    </g>`;
    return o;
  }

  function gloves(x, y, s, c1, c2, accent) {
    const g = uid();
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 26 * s, 26 * s, 5 * s, 0.38);
    for (let i = 0; i < 4; i++) {
      o += `<rect x="${F(x + (-18 + i * 9) * s)}" y="${F(y - 22 * s)}" width="${F(7.5 * s)}" height="${F(22 * s)}" rx="${F(3.5 * s)}" fill="url(#${g})" stroke="rgba(0,0,0,.18)" stroke-width="1"/>`;
    }
    o += `<rect x="${F(x - 28 * s)}" y="${F(y - 4 * s)}" width="${F(8 * s)}" height="${F(18 * s)}" rx="${F(4 * s)}" transform="rotate(-32 ${F(x - 26 * s)} ${F(y - 2 * s)})" fill="url(#${g})"/>`;
    o += `<rect x="${F(x - 22 * s)}" y="${F(y - 2 * s)}" width="${F(42 * s)}" height="${F(26 * s)}" rx="${F(6 * s)}" fill="url(#${g})" stroke="rgba(0,0,0,.18)" stroke-width="1"/>`;
    o += `<rect x="${F(x - 22 * s)}" y="${F(y + 22 * s)}" width="${F(42 * s)}" height="${F(8 * s)}" rx="${F(3 * s)}" fill="${accent}"/>`;
    o += `<g fill="rgba(255,255,255,.4)">
      <rect x="${F(x - 17 * s)}" y="${F(y - 19 * s)}" width="${F(6 * s)}" height="${F(16 * s)}" rx="${F(3 * s)}"/>
      <rect x="${F(x - 8 * s)}" y="${F(y - 19 * s)}" width="${F(6 * s)}" height="${F(16 * s)}" rx="${F(3 * s)}"/>
      <rect x="${F(x + 1 * s)}" y="${F(y - 19 * s)}" width="${F(6 * s)}" height="${F(16 * s)}" rx="${F(3 * s)}"/>
      <rect x="${F(x + 10 * s)}" y="${F(y - 19 * s)}" width="${F(6 * s)}" height="${F(16 * s)}" rx="${F(3 * s)}"/>
    </g>`;
    return o;
  }

  function shinGuard(x, y, s, c1, c2) {
    const g = uid();
    const p = (dx, dy) => `${F(x + dx * s)},${F(y + dy * s)}`;
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 30 * s, 16 * s, 4 * s, 0.4);
    o += `<path d="M ${p(-14, -28)} L ${p(14, -28)} Q ${p(20, 0)} ${p(12, 28)} L ${p(-12, 28)} Q ${p(-20, 0)} ${p(-14, -28)} Z" fill="url(#${g})"/>`;
    o += `<g stroke="rgba(255,255,255,.22)" stroke-width="${F(2 * s)}">
      <line x1="${F(x - 6 * s)}" y1="${F(y - 22 * s)}" x2="${F(x - 6 * s)}" y2="${F(y + 22 * s)}"/>
      <line x1="${F(x + 6 * s)}" y1="${F(y - 22 * s)}" x2="${F(x + 6 * s)}" y2="${F(y + 22 * s)}"/>
    </g>`;
    return o;
  }

  /* ---------- fitness ---------- */
  function hexPlate(cx, cy, rx, ry, c1, c2) {
    const g = uid();
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = ((i * 60 - 90) * Math.PI) / 180;
      pts.push(F(cx + rx * Math.cos(a)) + ',' + F(cy + ry * Math.sin(a)));
    }
    return defs(lin(g, c1, c2)) + `<polygon points="${pts.join(' ')}" fill="url(#${g})"/>`;
  }

  function dumbbell(x, y, s, c1, c2, bar) {
    c1 = c1 || '#2b3346'; c2 = c2 || '#4a5878'; bar = bar || '#c9d2e0';
    let o = shadow(x, y + 26 * s, 44 * s, 6 * s, 0.4);
    o += `<rect x="${F(x - 38 * s)}" y="${F(y - 3 * s)}" width="${F(76 * s)}" height="${F(6 * s)}" rx="${F(3 * s)}" fill="${bar}"/>`;
    for (const side of [-1, 1]) {
      o += hexPlate(x + side * 30 * s, y, 16 * s, 12 * s, c1, c2);
      o += hexPlate(x + side * 20 * s, y, 11 * s, 9 * s, c1, c2);
    }
    return o;
  }

  function kettlebell(x, y, s, c1, c2) {
    c1 = c1 || '#2b3346'; c2 = c2 || '#4a5878';
    const g = uid();
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 26 * s, 26 * s, 6 * s, 0.4);
    o += `<path d="M ${F(x - 14 * s)} ${F(y - 8 * s)} A ${F(15 * s)} ${F(15 * s)} 0 0 1 ${F(x + 14 * s)} ${F(y - 8 * s)}" fill="none" stroke="#1b2030" stroke-width="${F(6 * s)}"/>`;
    o += `<circle cx="${F(x)}" cy="${F(y + 8 * s)}" r="${F(20 * s)}" fill="url(#${g})"/>`;
    o += spec(x - 6 * s, y + 2 * s, 6 * s, 4 * s, 0.18);
    return o;
  }

  function rope(x, y, s, c) {
    c = c || '#ff5fa2';
    let o = shadow(x, y + 42 * s, 34 * s, 5 * s, 0.35);
    o += `<path d="M ${F(x - 24 * s)} ${F(y - 20 * s)} C ${F(x - 40 * s)} ${F(y + 24 * s)} ${F(x + 40 * s)} ${F(y + 24 * s)} ${F(x + 24 * s)} ${F(y - 20 * s)}" fill="none" stroke="${c}" stroke-width="${F(3.4 * s)}"/>`;
    for (const side of [-1, 1]) {
      o += `<rect x="${F(x + side * 24 * s - 4 * s)}" y="${F(y - 30 * s)}" width="${F(8 * s)}" height="${F(16 * s)}" rx="${F(4 * s)}" fill="#2b3346"/>`;
    }
    return o;
  }

  function mat(x, y, s, c1, c2) {
    c1 = c1 || '#7c5cff'; c2 = c2 || '#4a2fd0';
    const g = uid();
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 26 * s, 44 * s, 6 * s, 0.38);
    o += `<rect x="${F(x - 44 * s)}" y="${F(y + 2 * s)}" width="${F(74 * s)}" height="${F(20 * s)}" rx="${F(4 * s)}" fill="url(#${g})"/>`;
    o += `<ellipse cx="${F(x + 34 * s)}" cy="${F(y - 8 * s)}" rx="${F(16 * s)}" ry="${F(20 * s)}" fill="url(#${g})"/>`;
    o += `<ellipse cx="${F(x + 34 * s)}" cy="${F(y - 8 * s)}" rx="${F(8 * s)}" ry="${F(10 * s)}" fill="rgba(0,0,0,.3)"/>`;
    return o;
  }

  function bands(x, y, s) {
    const cols = ['#ff5fa2', '#ffd166', '#2ec4b6'];
    let o = shadow(x, y + 24 * s, 34 * s, 5 * s, 0.35);
    cols.forEach((c, i) => {
      o += `<ellipse cx="${F(x)}" cy="${F(y + 8 * s)}" rx="${F((30 - i * 7) * s)}" ry="${F((20 - i * 5) * s)}" fill="none" stroke="${c}" stroke-width="${F(4 * s)}"/>`;
    });
    return o;
  }

  function bottle(x, y, s, c1, c2) {
    c1 = c1 || '#2ec4b6'; c2 = c2 || '#12706a';
    const g = uid();
    let o = defs(lin(g, c1, c2)) + shadow(x, y + 34 * s, 16 * s, 4 * s, 0.4);
    o += `<rect x="${F(x - 11 * s)}" y="${F(y - 12 * s)}" width="${F(22 * s)}" height="${F(44 * s)}" rx="${F(9 * s)}" fill="url(#${g})"/>`;
    o += `<rect x="${F(x - 7 * s)}" y="${F(y - 22 * s)}" width="${F(14 * s)}" height="${F(10 * s)}" rx="${F(3 * s)}" fill="#1b2030"/>`;
    o += `<rect x="${F(x - 11 * s)}" y="${F(y + 2 * s)}" width="${F(22 * s)}" height="${F(12 * s)}" fill="rgba(255,255,255,.85)"/>`;
    o += `<rect x="${F(x - 2 * s)}" y="${F(y + 5 * s)}" width="${F(4 * s)}" height="${F(6 * s)}" fill="${c2}"/>`;
    return o;
  }

  function hockey(x, y, s, c1, c2) {
    c1 = c1 || '#e8c07a'; c2 = c2 || '#a9782f';
    const g = uid();
    let o = defs(lin(g, c1, c2)) + shadow(x + 4 * s, y + 44 * s, 30 * s, 5 * s, 0.38);
    o += `<rect x="${F(x - 6 * s)}" y="${F(y - 34 * s)}" width="${F(11 * s)}" height="${F(58 * s)}" rx="${F(5 * s)}" fill="url(#${g})"/>`;
    o += `<path d="M ${F(x - 1 * s)} ${F(y + 22 * s)} Q ${F(x + 26 * s)} ${F(y + 24 * s)} ${F(x + 28 * s)} ${F(y + 42 * s)} L ${F(x + 22 * s)} ${F(y + 44 * s)} Q ${F(x + 16 * s)} ${F(y + 30 * s)} ${F(x - 6 * s)} ${F(y + 28 * s)} Z" fill="url(#${g})"/>`;
    o += `<rect x="${F(x - 7 * s)}" y="${F(y - 40 * s)}" width="${F(13 * s)}" height="${F(10 * s)}" rx="${F(3 * s)}" fill="#1b2030"/>`;
    return o;
  }

  /* ---------- compositions: product id -> svg inner ---------- */
  const ART = {
    bat1: () => cricketBat(110, 84, 1.05),
    bat2: () => cricketBat(110, 84, 1.05, '#f2d29a', '#b58434'),
    ball1: () => cricketBall(110, 74, 34),
    gloves1: () => gloves(110, 82, 1.05, '#f2f5fb', '#9aa6bd', '#d33a2c'),
    helmet1: () => helmet(108, 82, 1.05, '#1f6feb', '#0b3d91', '#c9d2e0'),
    stumps1: () => stumps(110, 86, 1.0),
    kitbag1: () => kitBag(110, 84, 1.0, '#2b3346', '#4a5878', '#2ec4b6'),

    fb1: () => football(110, 74, 36),
    boots1: () => shoe(110, 84, 1.05, '#2b2f3a', '#4a5878', '#e8ecf5', '#ff5fa2', true),
    shin1: () => shinGuard(110, 84, 1.0),
    gk1: () => gloves(110, 82, 1.05, '#ffd166', '#c98a12', '#1b2030'),

    bd1: () => racket(110, 66, 30, 40, '#2ec4b6', 'rgba(230,240,255,.9)', '#1b2030', '#0f8f84'),
    shuttle1: () => shuttle(110, 80, 1.0),
    tn1: () => racket(110, 66, 34, 44, '#ff5fa2', 'rgba(230,240,255,.9)', '#1b2030', '#b02a6c'),
    tt1: () => ttBat(110, 84, 1.0),

    db1: () => dumbbell(110, 84, 1.0),
    rope1: () => rope(110, 84, 1.0),
    mat1: () => mat(110, 84, 1.0),
    kb1: () => kettlebell(110, 84, 1.0),
    band1: () => bands(110, 84, 1.0),

    jersey1: () => shirt(110, 84, 1.05, '#2ec4b6', '#0f8f84', '#ffd166'),
    pant1: () => trackPant(110, 84, 1.0, '#2b3346', '#4a5878', '#2ec4b6'),
    cap1: () => cap(108, 84, 1.05, '#d33a2c', '#8f1d12', '#1b2030'),
    shoes1: () => shoe(110, 84, 1.05, '#ff5fa2', '#b02a6c', '#f2f5fb', '#2ec4b6', false),
    vest1: () => vest(110, 84, 1.05, '#ffd166', '#d99a1f', '#1b2030'),

    bb1: () => basketball(110, 74, 36),
    vb1: () => volleyball(110, 74, 36),
    hk1: () => hockey(110, 84, 1.0),
    bottle1: () => bottle(110, 84, 1.0),
    gymg1: () => gloves(110, 82, 1.05, '#4a5878', '#2b3346', '#ffd166')
  };

  window.SPORT_ART = ART;
})();
