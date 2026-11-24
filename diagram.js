/* String Bench — chord box diagrams (SVG strings) and background visuals (canvas) */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var CH = CB.chords;

  // opts: {left, horizontal, small}
  function diagram(id, o) {
    o = o || {};
    var c = CH.byId[id];
    if (!c) return '';
    var NS = c.frets.length, FR = 4, SP = NS <= 4 ? 32 : 22, PAD = 26, hor = !!o.horizontal, left = !!o.left, FS = hor ? 36 : 28;
    var pos = c.frets.filter(function (x) { return x > 0; }), shift = pos.length && Math.max.apply(null, pos) > FR ? Math.min.apply(null, pos) - 1 : 0;
    if (shift && !hor) PAD += 16;
    var long = FR * FS, wide = (NS - 1) * SP;
    var W, H;
    if (hor) { W = PAD + long + 18; H = PAD + wide + PAD - 6; }
    else { W = PAD + wide + PAD; H = PAD + long + 14; }
    // map string index (0 low E .. 5 high e) and fret position (0 = nut line, n = middle of fret n) to x,y
    function P(s, f) {
      if (!hor) {
        var xi = left ? NS - 1 - s : s;
        return [PAD + xi * SP, PAD + f * FS];
      }
      var x = left ? (W - 18) - f * FS : PAD + f * FS;
      var y = (PAD - 6) + (NS - 1 - s) * SP + 6;
      return [x, y];
    }
    var out = [];
    out.push('<svg class="dia' + (o.small ? ' sm' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(id) + ' fingering">');
    // frets
    var i, a, b;
    for (i = 0; i <= FR; i++) {
      a = P(0, i); b = P(NS - 1, i);
      out.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="' + (i === 0 && !shift ? 'nut' : 'fret') + '"/>');
    }
    // strings
    for (i = 0; i < NS; i++) {
      a = P(i, 0); b = P(i, FR);
      var sw = 1.1 + (i < 3 ? (3 - i) * 0.35 : 0) * (NS > 4 ? 1 : 0.5);
      if (CB.INSTRUMENT.paired) { // paired courses (mandolin): draw both strings
        var dx = hor ? 0 : 1.9, dy = hor ? 1.9 : 0;
        [-1, 1].forEach(function (k) { out.push('<line x1="' + (a[0] + k * dx) + '" y1="' + (a[1] + k * dy) + '" x2="' + (b[0] + k * dx) + '" y2="' + (b[1] + k * dy) + '" class="str" style="stroke-width:' + (sw * 0.8) + '"/>'); });
      } else out.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="str" style="stroke-width:' + sw + '"/>');
    }
    if (shift) {
      var lp = hor ? P(0, 0.5) : P(left ? 0 : NS - 1, 0.5), lx = hor ? lp[0] : 18, ly = hor ? 10 : lp[1] + 4;
      out.push('<text x="' + lx + '" y="' + ly + '" class="mute" text-anchor="middle">' + (shift + 1) + 'fr</text>');
    }
    // barre
    var bars = {};
    c.frets.forEach(function (fr, s) { if (fr > 0 && c.fing[s] > 0) (bars[fr + ':' + c.fing[s]] = bars[fr + ':' + c.fing[s]] || []).push(s); });
    Object.keys(bars).forEach(function (k) {
      var ss = bars[k];
      if (ss.length >= 3) {
        var fr = +k.split(':')[0], p1 = P(Math.min.apply(null, ss), fr - shift - 0.5), p2 = P(Math.max.apply(null, ss), fr - shift - 0.5);
        var rr = 9;
        if (hor) out.push('<rect x="' + (p1[0] - rr) + '" y="' + Math.min(p1[1], p2[1]) + '" width="' + (rr * 2) + '" height="' + Math.abs(p2[1] - p1[1]) + '" rx="' + rr + '" class="dot"/>');
        else out.push('<rect x="' + Math.min(p1[0], p2[0]) + '" y="' + (p1[1] - rr) + '" width="' + Math.abs(p2[0] - p1[0]) + '" height="' + (rr * 2) + '" rx="' + rr + '" class="dot"/>');
      }
    });
    // dots, open and muted markers
    c.frets.forEach(function (fr, s) {
      var p;
      if (fr > 0) {
        p = P(s, fr - shift - 0.5);
        out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" class="dot"/>');
        if (c.fing[s] > 0) out.push('<text x="' + p[0] + '" y="' + (p[1] + 3.8) + '" class="fn" text-anchor="middle">' + c.fing[s] + '</text>');
      } else {
        var q = hor ? (left ? [W - 18 + 12, P(s, 0)[1]] : [PAD - 12, P(s, 0)[1]]) : [P(s, 0)[0], PAD - 11];
        if (fr === 0) out.push('<circle cx="' + q[0] + '" cy="' + q[1] + '" r="4.5" class="open"/>');
        else out.push('<text x="' + q[0] + '" y="' + (q[1] + 4) + '" class="mute" text-anchor="middle">×</text>');
      }
    });
    out.push('</svg>');
    return out.join('');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ----- backgrounds -------------------------------------------------------
  var V = { canvas: null, ctx: null, mode: 'random', raf: 0, w: 0, h: 0, dpr: 1, trail: [], lastId: null, hue: 30, modeAt: 0, cur: 'ring', running: false, reduce: false };
  var ORDER = ['ring', 'trail', 'color', 'wash'];
  V.NAMES = { ring: 'Note ring', trail: 'Chord trail', color: 'Color field', wash: 'Spectrum wash', random: 'Random mix' };

  V.attach = function (canvas, viz, getTheme) {
    V.canvas = canvas; V.ctx = canvas.getContext('2d'); V.viz = viz; V.getTheme = getTheme;
    V.reduce = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches);
    V.resize();
    g.addEventListener('resize', V.resize);
  };
  V.resize = function () {
    if (!V.canvas) return;
    V.dpr = Math.min(2, g.devicePixelRatio || 1);
    V.w = V.canvas.clientWidth; V.h = V.canvas.clientHeight;
    V.canvas.width = Math.round(V.w * V.dpr); V.canvas.height = Math.round(V.h * V.dpr);
    V.ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  };
  V.setMode = function (m) { V.mode = m; V.modeAt = 0; };
  V.start = function () { if (V.running) return; V.running = true; V.frame(performance.now()); };
  V.stop = function () { V.running = false; if (V.raf) cancelAnimationFrame(V.raf); if (V.ctx) V.ctx.clearRect(0, 0, V.w, V.h); };
  V.chordChanged = function (id) {
    if (!id || id === V.lastId) return;
    V.lastId = id;
    var idx = CH.fifthsIndex(id);
    V.hue = idx * 30;
    if (V.cur === 'trail' || V.mode === 'random') {
      V.trail.push({ id: id, x: 0.12 + Math.random() * 0.76, y: 1.02, born: performance.now(), size: 34 + Math.random() * 40, hue: idx * 30 });
      if (V.trail.length > 24) V.trail.shift();
    }
  };

  function hsl(h, s, l, a) { return 'hsla(' + Math.round(h) + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')'; }

  V.frame = function (now) {
    if (!V.running) return;
    V.raf = requestAnimationFrame(V.frame);
    var ctx = V.ctx, w = V.w, h = V.h, v = V.viz, dark = V.getTheme() === 'dark';
    if (!w || !h) { V.resize(); return; }
    if (V.mode === 'random') {
      if (!V.modeAt || now - V.modeAt > 22000) { V.cur = ORDER[(ORDER.indexOf(V.cur) + 1) % ORDER.length]; V.modeAt = now; }
    } else V.cur = V.mode;
    ctx.clearRect(0, 0, w, h);
    var cur = V.reduce ? 'color' : V.cur;
    var base = dark ? 62 : 38, lvl = v.level;
    if (cur === 'color') {
      var hue = V.hue, tgt = V.hue;
      V._h = V._h === undefined ? tgt : V._h;
      var dh = ((tgt - V._h + 540) % 360) - 180; V._h += dh * 0.06;
      var grd = ctx.createRadialGradient(w * 0.5, h * 0.55, 10, w * 0.5, h * 0.55, Math.max(w, h) * 0.75);
      grd.addColorStop(0, hsl(V._h, 70, dark ? 34 + lvl * 20 : 70 - lvl * 8, 0.55));
      grd.addColorStop(1, hsl(V._h + 40, 60, dark ? 10 : 88, 0));
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    } else if (cur === 'ring') {
      var cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.36;
      ctx.lineWidth = 1; ctx.strokeStyle = hsl(V.hue, 20, base, 0.18);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      var pts = [];
      for (var pc = 0; pc < 12; pc++) {
        var pos = (pc * 7) % 12, ang = pos / 12 * 6.2832 - 1.5708;
        var amp = v.chroma[pc], x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
        pts.push({ pc: pc, x: x, y: y, a: amp });
        ctx.fillStyle = hsl(pos * 30, 70, base, 0.18 + amp * 0.6);
        ctx.beginPath(); ctx.arc(x, y, 5 + amp * 22, 0, 6.2832); ctx.fill();
        ctx.fillStyle = hsl(pos * 30, 30, dark ? 85 : 25, 0.35 + amp * 0.5);
        ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var tx = cx + Math.cos(ang) * (R + 30), ty = cy + Math.sin(ang) * (R + 30);
        ctx.fillText(CH.NOTE_NAMES[pc], tx, ty);
      }
      var cd = v.id && CH.byId[v.id];
      if (cd) {
        var lit = pts.filter(function (p) { return cd.pcs.indexOf(p.pc) >= 0; });
        lit.sort(function (a, b) { return ((a.pc * 7) % 12) - ((b.pc * 7) % 12); });
        ctx.strokeStyle = hsl(V.hue, 75, base + 6, 0.55); ctx.lineWidth = 2;
        ctx.beginPath();
        lit.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
        ctx.closePath(); ctx.stroke();
      }
    } else if (cur === 'trail') {
      V.trail = V.trail.filter(function (t) { return now - t.born < 7000; });
      V.trail.forEach(function (t) {
        var age = (now - t.born) / 7000, y = (t.y - age * 1.15) * h, a = Math.sin(Math.min(1, age * 1.2) * Math.PI) * 0.17;
        ctx.font = '800 ' + t.size + 'px "Big Shoulders Display", "Arial Narrow", sans-serif';
        ctx.textAlign = 'center'; ctx.fillStyle = hsl(t.hue, 70, dark ? 62 : 36, Math.max(0, a));
        ctx.fillText(t.id, t.x * w, y);
      });
    } else {
      var bars = v.spec, n = bars.length, bw = w / (n - 1);
      var g2 = ctx.createLinearGradient(0, h * 0.4, 0, h);
      g2.addColorStop(0, hsl(V.hue, 70, base, 0)); g2.addColorStop(1, hsl(V.hue + 30, 70, base, 0.5));
      ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(0, h);
      for (var i = 0; i < n; i++) ctx.lineTo(i * bw, h - bars[i] * h * 0.55);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    }
  };

  CB.diagram = diagram;
  CB.visuals = V;
  CB.esc = esc;
})(typeof window !== 'undefined' ? window : globalThis);
