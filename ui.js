/* String Bench — shell, router, shared UI helpers */
(function (g) {
  'use strict';
  var CB = g.CB, S = CB.store, A = CB.audio, V = CB.visuals, CH = CB.chords;
  var UI = CB.ui = { screens: {}, params: {}, cleanup: null, name: null, root: null, view: null, meterEl: null, nameEl: null, tagEl: null };

  UI.h = function (tag, props, kids) {
    var e = document.createElement(tag);
    if (props) for (var k in props) {
      var v = props[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'checked' || k === 'disabled' || k === 'value') e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    UI.add(e, kids);
    return e;
  };
  UI.add = function (e, kids) {
    if (kids === undefined || kids === null || kids === false) return e;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) UI.add(e, c);
      else e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return e;
  };
  var h = UI.h;

  UI.theme = function () {
    var t = S.settings().theme;
    if (t === 'light' || t === 'dark') return t;
    return g.matchMedia && g.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  UI.applyTheme = function () {
    var t = S.settings().theme, r = document.documentElement;
    if (t === 'light' || t === 'dark') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme');
    var ac = CB.INSTRUMENT.accent; // instruments other than the guitar get their own accent colour
    if (ac) { var c = ac[UI.theme()] || ac.dark; r.style.setProperty('--accent', c[0]); r.style.setProperty('--accent-fg', c[1]); r.style.setProperty('--accent-soft', c[2]); }
  };

  UI.horizontal = function () {
    var o = S.settings().orient;
    if (o === 'horizontal') return true;
    if (o === 'vertical') return false;
    return !!(g.matchMedia && g.matchMedia('(orientation: landscape) and (min-width: 700px)').matches);
  };
  UI.diaHTML = function (id, small) {
    return CB.diagram(id, { left: S.settings().left, horizontal: UI.horizontal(), small: small });
  };
  UI.dia = function (id, small) {
    var d = h('div', { class: 'diawrap' });
    d.dataset.id = id; d.dataset.small = small ? '1' : '';
    d.innerHTML = UI.diaHTML(id, small);
    return d;
  };
  UI.setDia = function (d, id) { d.dataset.id = id; d.innerHTML = UI.diaHTML(id, d.dataset.small === '1'); };
  UI.refreshDia = function () {
    var all = document.querySelectorAll('.diawrap[data-id]');
    for (var i = 0; i < all.length; i++) all[i].innerHTML = UI.diaHTML(all[i].dataset.id, all[i].dataset.small === '1');
  };

  UI.fmtTime = function (ms) {
    var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60);
    return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  };
  UI.toast = function (msg) {
    var t = h('div', { class: 'toast', role: 'status', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  };
  // The Android app exposes ChordBenchApp. A WebView cannot save blob downloads, so files go through it.
  UI.download = function (name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'text/plain' });
    var B = g.ChordBenchApp;
    if (B && B.saveFile) {
      var rd = new FileReader();
      rd.onload = function () {
        var b64 = String(rd.result).split(',')[1] || '', r;
        try { r = B.saveFile(name, blob.type || type || 'application/octet-stream', b64); } catch (e) { r = String(e); }
        UI.toast(r === 'ok' ? 'Saved to Downloads/' + CB.BRAND + ': ' + name : 'Could not save the file: ' + r);
      };
      rd.readAsDataURL(blob);
      return;
    }
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  };
  UI.copy = function (text, btn) {
    var done = function (ok) { if (btn) { var o = btn.textContent; btn.textContent = ok ? 'Copied' : 'Select and copy'; setTimeout(function () { btn.textContent = o; }, 1500); } };
    try { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
  };

  // ---- wake lock --------------------------------------------------------
  var wl = null;
  UI.wake = function (on) {
    try {
      if (g.ChordBenchApp && g.ChordBenchApp.keepAwake) { g.ChordBenchApp.keepAwake(!!on); return; }
      if (on && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { wl = l; }, function () { });
      else if (!on && wl) { wl.release(); wl = null; }
    } catch (e) { }
  };

  // Full mode: hides the top bar so a card fits one screen when casting. A small Exit button stays in the corner.
  UI.fs = false;
  UI.setFull = function (on) {
    UI.fs = !!on;
    document.documentElement.classList.toggle('fs', UI.fs);
    try {
      if (g.ChordBenchApp && g.ChordBenchApp.fullscreen) g.ChordBenchApp.fullscreen(UI.fs);
      else if (UI.fs && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      else if (!UI.fs && document.fullscreenElement) document.exitFullscreen();
    } catch (e) { }
    g.scrollTo(0, 0);
  };

  // ---- routing ------------------------------------------------------------
  UI.go = function (name, params) {
    UI.params = params || {};
    if (location.hash.replace('#', '') === name) UI.render(); else location.hash = name;
  };
  UI.render = function () {
    var name = location.hash.replace('#', '') || 'home';
    if (!UI.screens[name]) name = 'home';
    if (UI.cleanup) { try { UI.cleanup(); } catch (e) { console.error(e); } UI.cleanup = null; }
    UI.name = name;
    UI.view.innerHTML = '';
    UI.view.className = 'view v-' + name;
    document.title = (name === 'home' ? '' : name.charAt(0).toUpperCase() + name.slice(1) + ' · ') + CB.BRAND;
    var p = UI.params; UI.params = {};
    UI.screens[name](UI.view, p);
    g.scrollTo(0, 0);
  };

  // ---- listening ----------------------------------------------------------
  UI.errText = function (e) {
    var n = e && e.name;
    if (!g.isSecureContext && !g.ChordBenchApp) return 'The microphone needs a secure page: use https or localhost.';
    if ((n === 'NotAllowedError' || n === 'SecurityError') && g.ChordBenchApp) return 'Microphone access is off for ' + CB.BRAND + '. Turn it on in Android Settings > Apps > ' + CB.BRAND + ' > Permissions, then try again.';
    if (n === 'NotAllowedError' || n === 'SecurityError') return 'Microphone access is blocked. Allow it in the browser’s site settings, then try again.';
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No audio input found. Plug in your interface or mic and try again.';
    if (n === 'NotReadableError') return 'Another app is holding the input. Close it and try again.';
    return (e && e.message) || 'Could not start the input.';
  };
  UI.listen = function () {
    A.setCandidates(CH.list);
    if (A.running) return Promise.resolve(true);
    return A.start(S.settings().deviceId).then(function () { UI.updateChip(); return true; }, function (e) {
      UI.lastError = UI.errText(e); UI.updateChip(); return false;
    });
  };
  UI.needTuner = function () {
    if (/[?&]notuner/.test(location.search)) return false;
    try { var t = +sessionStorage.getItem('cb.tuned.' + CB.INSTRUMENT.id + '.' + CB.INSTRUMENT.tuningId); if (t && Date.now() - t < 30 * 60000) return false; } catch (e) { }
    return true;
  };
  UI.markTuned = function () { try { sessionStorage.setItem('cb.tuned.' + CB.INSTRUMENT.id + '.' + CB.INSTRUMENT.tuningId, String(Date.now())); } catch (e) { } };
  // Start a listening screen. Sends the player through the tuner first when needed.
  UI.gate = function (name, params, start) {
    if (UI.needTuner()) { UI.go('tuner', { next: name, nextParams: params || {} }); return; }
    UI.listen().then(function (ok) {
      if (UI.name !== name) return;
      if (!ok) { UI.failPanel(UI.view); return; }
      start();
    });
  };
  UI.failPanel = function (root) {
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'panel' }, [
      h('h2', { text: 'No input yet' }),
      h('p', { class: 'err', text: UI.lastError || 'The input did not start.' }),
      h('div', { class: 'row', style: 'margin-top:12px' }, [
        h('button', { class: 'btn primary', text: 'Try again', onclick: function () { UI.render(); } }),
        h('button', { class: 'btn', text: 'Choose input', onclick: function () { UI.go('input'); } })
      ])
    ]));
  };

  // ---- shell ---------------------------------------------------------------
  UI.updateChip = function () {
    if (!UI.nameEl) return;
    var lab = A.running ? (A.info.label || 'Input') : 'No input';
    UI.nameEl.textContent = lab.length > 26 ? lab.slice(0, 25) + '…' : lab;
    UI.tagEl.textContent = A.running ? A.info.kind : 'set up';
    UI.tagEl.className = 'tag' + (A.running && A.info.kind === 'bluetooth' ? ' warn' : '');
  };
  UI.boot = function () {
    UI.root = document.getElementById('app');
    document.documentElement.setAttribute('data-inst', CB.INSTRUMENT.id);
    UI.applyTheme();
    UI.nameEl = h('span', { text: 'No input' });
    UI.tagEl = h('span', { class: 'tag', text: 'set up' });
    UI.meterEl = h('b');
    var chip = h('button', { class: 'chip', title: 'Choose audio input', 'aria-label': 'Audio input', onclick: function () { UI.go('input'); } }, [
      UI.nameEl, UI.tagEl, h('span', { class: 'meter' }, UI.meterEl)
    ]);
    var bar = h('header', { class: 'bar' }, [
      h('button', { class: 'brand', onclick: function () { UI.go('home'); } }, [h('i'), CB.BRAND, h('span', { class: 'tag inst', text: CB.INSTRUMENT.name, title: CB.INSTRUMENT.tuningLabel || '' })]),
      h('div', { class: 'spacer' }),
      chip,
      h('button', { class: 'btn small ghost', text: 'Full', title: 'Full screen for casting', onclick: function () { UI.setFull(!UI.fs); } }),
      h('button', { class: 'btn small ghost', text: 'Settings', onclick: function () { UI.go('settings'); } })
    ]);
    UI.view = h('main', { id: 'view' });
    UI.root.appendChild(bar); UI.root.appendChild(UI.view);
    document.body.appendChild(h('button', { class: 'fsexit', text: 'Exit full', 'aria-label': 'Exit full screen', onclick: function () { UI.setFull(false); } }));
    document.addEventListener('fullscreenchange', function () { if (UI.fs && !document.fullscreenElement && !(g.ChordBenchApp && g.ChordBenchApp.fullscreen)) { UI.fs = false; document.documentElement.classList.remove('fs'); } });
    A.on('level', function (d) {
      var w = Math.max(0, Math.min(100, (d.maxDb + 90) / 60 * 100));
      UI.meterEl.style.width = w + '%';
      UI.meterEl.style.background = d.rms > 0.7 ? 'var(--bad)' : 'var(--good)';
    });
    A.on('route', function () { UI.updateChip(); UI.toast('Input: ' + (A.running ? (A.info.label || 'default') + ' (' + A.info.kind + ')' : 'none')); if (UI.name === 'input') UI.render(); });
    V.attach(document.getElementById('bg'), A.viz, UI.theme);
    var mq = g.matchMedia && g.matchMedia('(orientation: landscape) and (min-width: 700px)');
    if (mq && mq.addEventListener) mq.addEventListener('change', UI.refreshDia);
    if (g.matchMedia) { var mq2 = g.matchMedia('(prefers-color-scheme: dark)'); if (mq2.addEventListener) mq2.addEventListener('change', UI.applyTheme); }
    g.addEventListener('hashchange', UI.render);
    UI.render();
  };

  // ---- small shared widgets -------------------------------------------------
  UI.seg = function (opts, value, onpick) {
    var wrap = h('div', { class: 'seg', role: 'group' });
    opts.forEach(function (o) {
      var b = h('button', { text: o[1], class: String(o[0]) === String(value) ? 'on' : '', onclick: function () {
        Array.prototype.forEach.call(wrap.children, function (x) { x.classList.remove('on'); });
        b.classList.add('on'); onpick(o[0]);
      } });
      wrap.appendChild(b);
    });
    return wrap;
  };
  UI.toggle = function (checked, onchange, label) {
    return h('input', { type: 'checkbox', class: 'sw', checked: checked, 'aria-label': label, onchange: function (e) { onchange(e.target.checked); } });
  };
})(typeof window !== 'undefined' ? window : globalThis);
