/* String Bench — Jam, Practice / Routine / Test, Songs */
(function (g) {
  'use strict';
  var CB = g.CB, UI = CB.ui, S = CB.store, A = CB.audio, V = CB.visuals, CH = CB.chords, h = UI.h;
  var SC = UI.screens;

  function startBackground() { V.setMode(S.settings().visual); V.start(); }

  // ================================================================ JAM
  function jamText(j) {
    var d = new Date(j.t);
    var cnt = Object.keys(j.counts).sort(function (a, b) { return j.counts[b] - j.counts[a]; });
    var lines = ['Jam · ' + d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' · ' + UI.fmtTime(j.durMs)];
    lines.push('Chords heard: ' + cnt.map(function (k) { return k + ' ×' + j.counts[k]; }).join(' · '));
    var tr = Object.keys(j.trans).sort(function (a, b) { return j.trans[b] - j.trans[a]; }).slice(0, 6);
    if (tr.length) lines.push('Common changes: ' + tr.map(function (k) { return k.replace('>', '→') + ' ×' + j.trans[k]; }).join(', '));
    var out = [], prev = null, run = 0;
    function flush() { if (prev) out.push(run > 1 ? prev + '×' + run : prev); }
    j.seq.forEach(function (s) { if (s[1] === prev) run++; else { flush(); prev = s[1]; run = 1; } });
    flush();
    lines.push('Sequence: ' + out.slice(0, 160).join(' ') + (out.length > 160 ? ' …' : ''));
    return lines.join('\n');
  }

  SC.jam = function (root) {
    UI.gate('jam', {}, function () {
      startBackground(); UI.wake(true);
      var t0 = performance.now(), start = Date.now(), seq = [], counts = {}, trans = {}, prev = null, prevT = 0;
      var big = h('div', { class: 'bigchord dim', text: '…' }), kind = h('div', { class: 'kind', text: 'Listening. Strum something.' });
      var dia = h('div', { class: 'diawrap' }), tl = h('div', { class: 'timeline' });
      var clock = h('b', { class: 'mono', text: '0:00' }), plays = h('b', { class: 'mono', text: '0' });
      var rec = false, recBtn, recNote = h('span', { class: 'muted', style: 'font-size:.85rem' });
      var shown = null;
      function show(id) {
        shown = id; var c = CH.byId[id];
        big.textContent = id; big.classList.remove('dim');
        kind.textContent = c.kind + ' · stage ' + c.stage;
        dia.dataset.id = id; dia.dataset.small = ''; dia.innerHTML = UI.diaHTML(id, false);
      }
      var offPlay = A.on('play', function (p) {
        var ms = Math.round(performance.now() - t0);
        seq.push([ms, p.id]); counts[p.id] = (counts[p.id] || 0) + 1;
        if (prev && prev !== p.id && ms - prevT < 6000) { var k = prev + '>' + p.id; trans[k] = (trans[k] || 0) + 1; }
        prev = p.id; prevT = ms; plays.textContent = String(seq.length);
        show(p.id); V.chordChanged(p.id);
        tl.appendChild(h('span', { text: p.id }));
        while (tl.children.length > 14) tl.removeChild(tl.firstChild);
      });
      var offQuiet = A.on('quiet', function () { big.classList.add('dim'); });
      var offRec = A.on('recorded', function (r) { recordedBlob = r; });
      var recordedBlob = null;
      var clk = setInterval(function () { clock.textContent = UI.fmtTime(performance.now() - t0); }, 500);
      recBtn = h('button', { class: 'btn', text: '● Record', onclick: function () {
        if (!rec) { if (A.startRecording()) { rec = true; recBtn.textContent = '■ Recording'; recBtn.classList.add('primary'); recNote.textContent = 'Saved when you stop the jam.'; } else recNote.textContent = 'Recording is not available here.'; }
        else { rec = false; A.stopRecording(); recBtn.textContent = '● Record'; recBtn.classList.remove('primary'); recNote.textContent = 'Recording kept for this screen.'; }
      } });
      var vis = h('select', { 'aria-label': 'Background', onchange: function (e) { S.settings().visual = e.target.value; S.save(); V.setMode(e.target.value); } },
        Object.keys(V.NAMES).map(function (k) { return h('option', { value: k, text: V.NAMES[k], selected: S.settings().visual === k }); }));
      root.appendChild(h('div', { class: 'hud' }, [h('div', { class: 'stat' }, [clock, h('span', { text: 'time' })]), h('div', { class: 'stat' }, [plays, h('span', { text: 'chords heard' })])]));
      root.appendChild(h('div', { class: 'stage two' }, [h('div', {}, [big, kind]), dia]));
      root.appendChild(tl);
      root.appendChild(h('div', { class: 'row', style: 'justify-content:center' }, [recBtn, vis, h('button', { class: 'btn primary', text: 'Stop and save', onclick: finish })]));
      root.appendChild(h('div', { style: 'text-align:center' }, recNote));
      var finished = false;
      function finish() {
        if (finished) return; finished = true;
        offPlay(); offQuiet(); clearInterval(clk); UI.wake(false);
        var wasRec = rec;
        if (rec) { rec = false; A.stopRecording(); }
        var dur = performance.now() - t0;
        setTimeout(function () { summary(dur, wasRec, 0); }, wasRec ? 350 : 0);
      }
      function summary(dur, wasRec, tries) {
        // The recorder's onstop (which delivers the blob) fires async after stop(),
        // so wait a beat for it before rendering; otherwise the recording section
        // is missing from the summary even though the take recorded fine.
        if (wasRec && !recordedBlob && (tries || 0) < 3) { setTimeout(function () { summary(dur, wasRec, (tries || 0) + 1); }, 250); return; }
        offRec();
        var j = { t: start, durMs: Math.round(dur), counts: counts, trans: trans, seq: seq.slice(0, 600) };
        if (seq.length) S.addJam(j);
        V.stop(); root.innerHTML = '';
        var text = jamText(j), box = h('div', { class: 'panel' }, [h('h2', { text: 'Jam saved', style: 'margin-bottom:8px' })]);
        if (!seq.length) box.appendChild(h('p', { class: 'muted', text: 'No chords were heard, so nothing was saved. Check the input level.' }));
        else {
          box.appendChild(h('div', { class: 'sheet', text: text }));
          box.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [
            h('button', { class: 'btn', text: 'Copy chord log', onclick: function (e) { UI.copy(text, e.target); } }),
            h('button', { class: 'btn', text: 'Download .txt', onclick: function () { UI.download('jam-' + new Date(start).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.txt', text); } })
          ]));
        }
        var rb = recordedBlob;
        if (rb) {
          var url = URL.createObjectURL(rb.blob);
          box.appendChild(h('h3', { text: 'Recording', style: 'margin:16px 0 8px' }));
          box.appendChild(h('audio', { controls: true, src: url, style: 'width:100%' }));
          box.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [h('button', { class: 'btn', text: 'Download recording', onclick: function () { UI.download('jam-' + new Date(start).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.' + rb.ext, rb.blob); } }),
            h('span', { class: 'muted', text: 'Not stored in the app. Download it to keep it.' })]));
        }
        box.appendChild(h('div', { class: 'row', style: 'margin-top:16px' }, [
          h('button', { class: 'btn primary', text: 'Build a routine from this', onclick: function () { UI.go('routine'); } }),
          h('button', { class: 'btn', text: 'Jam again', onclick: function () { UI.render(); } }),
          h('button', { class: 'btn ghost', text: 'Home', onclick: function () { UI.go('home'); } })
        ]));
        root.appendChild(box);
      }
      UI.cleanup = function () { if (!finished) { finished = true; offPlay(); offQuiet(); clearInterval(clk); UI.wake(false); if (rec) A.stopRecording(); if (seq.length) S.addJam({ t: start, durMs: Math.round(performance.now() - t0), counts: counts, trans: trans, seq: seq.slice(0, 600) }); } offRec(); V.stop(); };
    });
  };

  // ============================================================ DECKS
  function pickNext(prevId, group, beginner) {
    var cand = group.filter(function (c) { return c.id !== prevId; });
    if (!cand.length) cand = group;
    if (!cand.length) return null;
    if (beginner && prevId) {
      cand = cand.slice().sort(function (a, b) { return CH.similarity(prevId, b.id) - CH.similarity(prevId, a.id); }).slice(0, 3);
    } else if (beginner) {
      cand = cand.slice().sort(function (a, b) { return a.stage - b.stage; }).slice(0, 3);
    }
    return cand[Math.floor(Math.random() * cand.length)].id;
  }
  function practiceDeck() {
    var st = S.settings(), pool = S.pool();
    var known = pool.filter(function (c) { return S.status(c.id) === 'known'; }), learn = pool.filter(function (c) { return S.status(c.id) !== 'known'; });
    var prev = null;
    return function () {
      var grp;
      if (!learn.length) grp = known; else if (!known.length) grp = learn; else grp = Math.random() * 100 < st.knownMix ? known : learn;
      var id = pickNext(prev, grp, st.beginner); prev = id;
      return { type: 'chord', id: id };
    };
  }
  function routinePlan() {
    var d = S.get(), counts = {}, trans = {};
    d.jams.slice(-8).forEach(function (j) {
      for (var k in j.counts) counts[k] = (counts[k] || 0) + j.counts[k];
      for (var t in j.trans) trans[t] = (trans[t] || 0) + j.trans[t];
    });
    var weak = Object.keys(counts).map(function (id) {
      var r = S.hitRate(id), score = (r === null ? 0.5 : 1 - r) * 3 + (S.status(id) === 'known' ? 0 : 1.5) + Math.log(1 + counts[id]) * 0.3;
      return { id: id, score: score };
    }).sort(function (a, b) { return b.score - a.score; }).slice(0, 5);
    // chords with trouble in practice even if not in jams
    CH.list.forEach(function (c) {
      var r = S.hitRate(c.id), x = d.chords[c.id];
      if (x && x.recent.length >= 3 && r !== null && r < 0.6 && !weak.some(function (w) { return w.id === c.id; })) weak.push({ id: c.id, score: 2 });
    });
    var pairs = Object.keys(trans).map(function (k) {
      var a = k.split('>'), p = d.pairs[k], slow = p && p.ms.length ? S.median(p.ms) / 1000 : 2.5;
      return { a: a[0], b: a[1], score: Math.log(1 + trans[k]) + slow * 0.3 };
    }).filter(function (p) { return p.a !== p.b; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4);
    var cards = [];
    weak.forEach(function (w) { cards.push({ type: 'chord', id: w.id }); });
    pairs.forEach(function (p) { cards.push({ type: 'pair', a: p.a, b: p.b }); });
    // interleave single chords and pairs
    var singles = cards.filter(function (c) { return c.type === 'chord'; }), pp = cards.filter(function (c) { return c.type === 'pair'; }), out = [];
    while (singles.length || pp.length) { if (singles.length) out.push(singles.shift()); if (pp.length) out.push(pp.shift()); if (singles.length) out.push(singles.shift()); }
    return out;
  }

  // ===================================================== card sessions
  function cardMode(kind) {
    return function (root, params) {
      V.stop();
      var st = S.settings();
      var title = kind === 'practice' ? 'Practice' : kind === 'routine' ? 'Routine' : 'Test myself';
      var plan = null, testIds = null;
      var panel = h('div', { class: 'panel', style: 'display:flex;flex-direction:column;gap:12px' }, [h('h2', { text: title })]);
      root.appendChild(panel);
      function row(label, ctl) { return h('div', { class: 'setrow' }, [h('b', { text: label }), ctl]); }

      if (kind === 'routine') {
        plan = routinePlan();
        if (!plan.length) {
          panel.appendChild(h('p', { class: 'muted', text: 'The routine is built from what the app hears in your jams: the chords you reach for, the ones you miss, and the changes you make most. There is nothing to draw on yet.' }));
          panel.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', text: 'Go jam', onclick: function () { UI.go('jam'); } }), h('button', { class: 'btn ghost', text: 'Home', onclick: function () { UI.go('home'); } })]));
          return;
        }
        panel.appendChild(h('p', { class: 'muted', text: 'Built from your recent jams. ' + plan.length + ' cards: ' + plan.map(function (c) { return c.type === 'chord' ? c.id : c.a + '→' + c.b; }).join(', ') + '.' }));
      } else if (kind === 'test') {
        if (params.ids && params.ids.length) testIds = params.ids.slice();
        else {
          testIds = CH.list.filter(function (c) { return S.status(c.id) !== 'known'; }).map(function (c) { return c.id; });
          if (!testIds.length) testIds = CH.list.map(function (c) { return c.id; });
        }
        panel.appendChild(h('p', { class: 'muted', text: 'Play each chord cleanly. Then say whether it feels comfortable. Comfortable marks it known and can open the next stage. Later practice moves the status up or down.' }));
        panel.appendChild(h('p', { class: 'mono', text: testIds.length + ' to test: ' + testIds.slice(0, 12).join(', ') + (testIds.length > 12 ? '…' : '') }));
      } else {
        panel.appendChild(h('p', { class: 'muted', text: 'Cards come from the stages you have open, with known chords mixed in so it is not always hard.' }));
      }
      if (kind !== 'test') panel.appendChild(row('Session length', UI.seg([[1, '1 min'], [5, '5 min'], [15, '15 min'], [0, 'Until stopped']], st.preset, function (v) { st.preset = +v; S.save(); })));
      panel.appendChild(row('Correct plays per card', h('input', { type: 'number', min: 1, max: 10, value: st.needed, 'aria-label': 'Correct plays per card', onchange: function (e) { st.needed = Math.max(1, Math.min(10, +e.target.value || 3)); S.save(); } })));
      if (kind === 'practice') {
        panel.appendChild(row('Beginner order', UI.toggle(st.beginner, function (v) { st.beginner = v; S.save(); }, 'Beginner order')));
        panel.appendChild(row('Names only', UI.toggle(st.namesOnly, function (v) { st.namesOnly = v; S.save(); }, 'Names only')));
      }
      panel.appendChild(h('div', { class: 'row' }, [
        h('button', { class: 'btn primary', text: 'Start', onclick: function () { UI.gate(UI.name, { ids: testIds }, function () { session(kind, root, plan, testIds); }); } }),
        h('button', { class: 'btn ghost', text: 'Home', onclick: function () { UI.go('home'); } })
      ]));
      if (params.autostart) UI.gate(UI.name, { ids: testIds }, function () { session(kind, root, plan, testIds); });
    };
  }
  SC.practice = cardMode('practice'); SC.routine = cardMode('routine'); SC.test = cardMode('test');

  function session(kind, root, plan, testIds) {
    root.innerHTML = '';
    startBackground(); UI.wake(true);
    var st = S.settings(), need = st.needed, limitMs = kind === 'test' ? 0 : (st.preset || 0) * 60000;
    var next;
    if (kind === 'practice') next = practiceDeck();
    else if (kind === 'routine') { var pi = -1; next = function () { pi = (pi + 1) % plan.length; return plan[pi]; }; }
    else { var ti = -1; next = function () { if (ti + 1 >= testIds.length) return null; ti++; return { type: 'chord', id: testIds[ti] }; }; }
    var s = { t0: performance.now(), start: Date.now(), cards: 0, hits: 0, misses: 0, firstTry: 0, streak: 0, best: 0, ms: [], times: [], card: null, paused: false, confirming: false, over: false, series: [] };
    var big = h('div', { class: 'bigchord' }), kindEl = h('div', { class: 'kind' }), diaA = h('div', { class: 'diawrap', 'data-small': '' }), diaB = h('div', { class: 'diawrap', 'data-small': '1' });
    var dots = h('div', { class: 'progress' }), status = h('div', { class: 'statusline' });
    var hClock = h('b', { class: 'mono' }), hCards = h('b', { class: 'mono', text: '0' }), hCpm = h('b', { class: 'mono', text: '-' }), hStreak = h('b', { class: 'mono', text: '0' });
    var actions = h('div', { class: 'row', style: 'justify-content:center' });
    var stageBox = h('div', { class: 'stage two' }, [h('div', {}, [big, kindEl]), h('div', { style: 'display:flex;flex-direction:column;gap:8px;align-items:center' }, [diaA, diaB])]);
    root.appendChild(h('div', { class: 'hud' }, [
      h('div', { class: 'stat' }, [hClock, h('span', { text: limitMs ? 'left' : 'time' })]),
      h('div', { class: 'stat' }, [hCards, h('span', { text: 'cards' })]),
      h('div', { class: 'stat' }, [hCpm, h('span', { text: 'changes/min' })]),
      h('div', { class: 'stat' }, [hStreak, h('span', { text: 'streak' })])
    ]));
    root.appendChild(stageBox); root.appendChild(dots); root.appendChild(status); root.appendChild(actions);

    function say(msg, cls) { status.textContent = msg; status.className = 'statusline ' + (cls || ''); }
    function drawDots() {
      dots.innerHTML = '';
      for (var i = 0; i < need; i++) dots.appendChild(h('i', { class: i < s.corrects ? 'on' : '' }));
    }
    function setCard(c) {
      s.card = c; s.corrects = 0; s.wrong = 0; s.firstHit = 0; s.shownAt = performance.now(); s.confirming = false; s.step = 0; s.expect = c.type === 'pair' ? c.a : c.id;
      s.lastAt = 0; s.pairMs = [];
      actions.innerHTML = '';
      if (c.type === 'chord') {
        big.textContent = c.id; kindEl.textContent = CH.byId[c.id].kind;
        diaA.style.display = st.namesOnly && kind === 'practice' ? 'none' : '';
        diaA.dataset.id = c.id; diaA.innerHTML = UI.diaHTML(c.id, false); diaB.style.display = 'none';
        say('Play ' + c.id);
      } else {
        big.textContent = c.a + ' → ' + c.b; kindEl.textContent = 'switch back and forth';
        diaA.style.display = ''; diaB.style.display = '';
        diaA.dataset.id = c.a; diaA.innerHTML = UI.diaHTML(c.a, true); diaA.dataset.small = '1';
        diaB.dataset.id = c.b; diaB.innerHTML = UI.diaHTML(c.b, true);
        say('Start on ' + c.a);
      }
      drawDots();
      actions.appendChild(h('button', { class: 'btn ghost', text: 'Skip', onclick: function () { advance(); } }));
      actions.appendChild(h('button', { class: 'btn ghost', text: 'Mark done', onclick: function () { success(true); } }));
      actions.appendChild(h('button', { class: 'btn', text: 'End', onclick: finish }));
    }
    function advance() {
      var c = next();
      if (!c) { finish(); return; }
      setCard(c);
    }
    function cpmNow() {
      var m = (performance.now() - s.t0) / 60000; return m > 0.15 ? s.hits / m : 0;
    }
    function updateHud() {
      hCards.textContent = String(s.cards); hStreak.textContent = String(s.streak);
      var r = performance.now() - s.t0;
      hClock.textContent = limitMs ? UI.fmtTime(limitMs - r) : UI.fmtTime(r);
      var c = cpmNow(); hCpm.textContent = c ? c.toFixed(1) : '-';
    }
    function success(manual) {
      if (s.over || !s.card || s.confirming) return;
      var c = s.card, now = performance.now(), ms;
      if (c.type === 'chord') {
        ms = manual ? now - s.shownAt : (s.firstHit || now - s.shownAt);
        S.recordResult(c.id, true, ms);
      } else {
        ms = s.pairMs.length ? S.median(s.pairMs) : now - s.shownAt;
        S.recordResult(c.a, true, 0); S.recordResult(c.b, true, 0);
      }
      s.hits++; s.cards++; s.streak++; s.best = Math.max(s.best, s.streak); s.ms.push(ms); s.times.push(now - s.t0);
      if (!s.wrong && !manual) s.firstTry++;
      s.corrects = need; drawDots(); updateHud();
      if (kind === 'test') { confirmKnown(c); return; }
      say('Nice' + (c.type === 'chord' ? ': ' + (ms / 1000).toFixed(1) + ' s' : ''), 'good');
      s.confirming = true;
      setTimeout(function () { if (!s.over) advance(); }, 650);
    }
    function confirmKnown(c) {
      s.confirming = true; actions.innerHTML = '';
      say(c.id + ' sounded right. How does it feel?', 'good');
      actions.appendChild(h('button', { class: 'btn primary', text: 'Comfortable: mark known', onclick: function () { S.setStatus(c.id, 'known'); advance(); } }));
      actions.appendChild(h('button', { class: 'btn', text: 'Still learning', onclick: function () { if (S.status(c.id) === 'unknown') S.setStatus(c.id, 'learning'); advance(); } }));
    }
    function miss() {
      var c = s.card; if (!c || s.confirming) return;
      s.cards++; s.misses++; s.streak = 0;
      if (c.type === 'chord') S.recordResult(c.id, false); else { S.recordResult(c.a, false); S.recordResult(c.b, false); }
      say('Missed. Next card.', 'bad'); updateHud(); s.confirming = true;
      setTimeout(function () { if (!s.over) advance(); }, 700);
    }
    var offPlay = A.on('play', function (p) {
      if (s.over || !s.card || s.confirming) return;
      V.chordChanged(p.id);
      var c = s.card;
      if (c.type === 'chord') {
        if (p.id === c.id) {
          s.corrects++; if (s.corrects === 1) s.firstHit = performance.now() - s.shownAt;
          drawDots();
          if (s.corrects >= need) success(false); else say('Good. ' + (need - s.corrects) + ' more.', 'good');
        } else { s.wrong++; say('Heard ' + p.id + '. Looking for ' + c.id + '.', 'warn'); }
      } else {
        if (p.id === s.expect) {
          var now = performance.now();
          if (s.step > 0) {
            var ms = now - s.lastAt; s.pairMs.push(ms); S.recordPair(s.expect === c.a ? c.b : c.a, s.expect, ms); s.corrects++; drawDots();
          }
          s.step++; s.lastAt = now; s.expect = s.expect === c.a ? c.b : c.a;
          if (s.corrects >= need) success(false); else say('Now ' + s.expect, 'good');
        } else { s.wrong++; say('Heard ' + p.id + '. Looking for ' + s.expect + '.', 'warn'); }
      }
    });
    var tm = setInterval(function () {
      if (s.over) return;
      updateHud();
      var r = performance.now() - s.t0;
      if (limitMs && r >= limitMs) { finish(); return; }
      if (st.cardTimeout && s.card && !s.confirming && performance.now() - s.shownAt > st.cardTimeout * 1000) miss();
    }, 250);
    var finished = false;
    function finish() {
      if (finished) return; finished = true; s.over = true; offPlay(); clearInterval(tm); UI.wake(false); V.stop();
      var dur = performance.now() - s.t0, mins = Math.max(dur / 60000, 1 / 60);
      var series = []; for (var m = 0; m < Math.ceil(dur / 60000); m++) series.push(s.times.filter(function (t) { return t >= m * 60000 && t < (m + 1) * 60000; }).length);
      var rec = { t: s.start, mode: kind, planned: limitMs / 60000, durMs: Math.round(dur), cards: s.cards, hits: s.hits, cpm: s.hits / mins, medMs: S.median(s.ms), firstTry: s.cards ? s.firstTry / s.cards : 0, streak: s.best, series: series };
      if (s.cards || kind !== 'test') S.addSession(rec);
      root.innerHTML = '';
      var box = h('div', { class: 'panel' }, [h('h2', { text: s.cards ? 'Session done' : 'Session ended', style: 'margin-bottom:10px' })]);
      if (s.cards) {
        box.appendChild(h('div', { class: 'hud' }, [
          sstat(s.hits + '/' + s.cards, 'cards hit'), sstat(rec.cpm.toFixed(1), 'changes/min'), sstat((rec.medMs / 1000).toFixed(1) + ' s', 'median change'),
          sstat(Math.round(rec.firstTry * 100) + '%', 'first try'), sstat(String(s.best), 'best streak'), sstat(UI.fmtTime(dur), 'time')
        ]));
        box.appendChild(h('p', { class: 'muted', style: 'margin-top:10px', text: 'Speed is how fast you landed each chord. First try is how often the very first thing you played was right.' }));
      } else box.appendChild(h('p', { class: 'muted', text: 'No cards finished.' }));
      box.appendChild(h('div', { class: 'row', style: 'margin-top:14px' }, [
        h('button', { class: 'btn primary', text: 'Again', onclick: function () { UI.go(UI.name, {}); } }),
        h('button', { class: 'btn', text: 'Stats', onclick: function () { UI.go('stats'); } }),
        h('button', { class: 'btn ghost', text: 'Home', onclick: function () { UI.go('home'); } })
      ]));
      root.appendChild(box);
    }
    function sstat(v, l) { return h('div', { class: 'stat' }, [h('b', { text: v }), h('span', { text: l })]); }
    UI.cleanup = function () { if (!finished) { finished = true; s.over = true; offPlay(); clearInterval(tm); UI.wake(false); if (s.cards) S.addSession({ t: s.start, mode: kind, planned: limitMs / 60000, durMs: Math.round(performance.now() - s.t0), cards: s.cards, hits: s.hits, cpm: s.hits / Math.max((performance.now() - s.t0) / 60000, 1 / 60), medMs: S.median(s.ms), firstTry: s.firstTry / s.cards, streak: s.best, series: [] }); } V.stop(); };
    // test hook for automated runs
    CB._session = s; CB._setCard = setCard;
    advance(); updateHud();
  }

  // ================================================================ SONGS
  SC.songs = function (root, params) {
    V.stop();
    if (params.song) { play(root, params.song); return; }
    var list = h('div', { class: 'list' });
    CH.SONGS.forEach(function (sg) {
      var ids = []; sg.bars.forEach(function (b) { b.forEach(function (c) { if (ids.indexOf(c) < 0) ids.push(c); }); });
      var missing = ids.filter(function (c) { return S.status(c) !== 'known'; });
      list.appendChild(h('button', { class: 'item', onclick: function () { UI.go('songs', { song: sg.id }); } }, [
        h('span', { class: 'grow' }, [h('b', { text: sg.title }), h('br'), h('span', { class: 'muted', text: sg.note }), h('br'), h('span', { class: 'mono', style: 'font-size:.8rem', text: ids.join('  ') })]),
        h('span', { class: 'tag' + (missing.length ? ' warn' : ''), text: missing.length ? missing.length + ' new' : 'all known' })
      ]));
    });
    root.appendChild(h('div', { class: 'panel' }, [h('h2', { text: 'Songs', style: 'margin-bottom:6px' }),
      h('p', { class: 'muted', style: 'margin-bottom:12px', text: 'Public domain tunes and a blues form, written as a string of chord cards. Pick one and play each card in turn. These are simplified chord progressions, not full arrangements.' }), list]));
  };
  function play(root, id) {
    var sg = CH.SONGS.filter(function (x) { return x.id === id; })[0];
    if (!sg) { UI.go('songs'); return; }
    UI.gate('songs', { song: id }, function () {
      startBackground(); UI.wake(true);
      var steps = [], barOf = [];
      sg.bars.forEach(function (b, bi) { b.forEach(function (c) { steps.push(c); barOf.push(bi); }); });
      var i = 0, rounds = 0;
      var big = h('div', { class: 'bigchord' }), diaA = h('div', { class: 'diawrap' }), diaN = h('div', { class: 'diawrap', 'data-small': '1' }), nextLab = h('div', { class: 'kind' }), grid = h('div', { class: 'bars' }), status = h('div', { class: 'statusline' }), cells = [];
      sg.bars.forEach(function (b, bi) { var c = h('div', { class: 'bar4', text: b.join(' ') }); cells.push(c); grid.appendChild(c); });
      function paint() {
        var c = steps[i], nx = steps[(i + 1) % steps.length];
        big.textContent = c; diaA.dataset.id = c; diaA.innerHTML = UI.diaHTML(c, false);
        diaN.dataset.id = nx; diaN.innerHTML = UI.diaHTML(nx, true); nextLab.textContent = 'next: ' + nx;
        cells.forEach(function (el, bi) { el.className = 'bar4' + (bi === barOf[i] ? ' cur' : bi < barOf[i] ? ' done' : ''); });
      }
      function go(d) { i += d; if (i >= steps.length) { i = 0; rounds++; status.textContent = 'Round ' + rounds + ' complete. Again from the top.'; status.className = 'statusline good'; } if (i < 0) i = 0; paint(); }
      var off = A.on('play', function (p) {
        V.chordChanged(p.id);
        if (p.id === steps[i]) { status.textContent = 'Good.'; status.className = 'statusline good'; go(1); }
        else { status.textContent = 'Heard ' + p.id + '. Looking for ' + steps[i] + '.'; status.className = 'statusline warn'; }
      });
      root.appendChild(h('div', { class: 'panel tight' }, [h('h3', { text: sg.title }), h('p', { class: 'muted', text: sg.note })]));
      root.appendChild(h('div', { class: 'stage two' }, [h('div', {}, [big, nextLab]), h('div', { style: 'display:flex;flex-direction:column;gap:8px;align-items:center' }, [diaA, diaN])]));
      root.appendChild(grid); root.appendChild(status);
      root.appendChild(h('div', { class: 'row', style: 'justify-content:center' }, [
        h('button', { class: 'btn', text: 'Back', onclick: function () { go(-1); } }),
        h('button', { class: 'btn primary', text: 'Next card', onclick: function () { go(1); } }),
        h('button', { class: 'btn ghost', text: 'Restart', onclick: function () { i = 0; rounds = 0; status.textContent = ''; paint(); } }),
        h('button', { class: 'btn ghost', text: 'All songs', onclick: function () { UI.go('songs'); } })
      ]));
      paint();
      UI.cleanup = function () { off(); UI.wake(false); V.stop(); };
    });
  }

  // ================================================================ CHARTS
  // Paste a chord chart (chords over lyrics, VERSE / BRIDGE / TAG headers,
  // directions in brackets) and play it as a routine, one chord at a time.
  SC.charts = function (root, params) {
    V.stop();
    if (params.chartId) { playChart(root, params.chartId); return; }
    if (params['new']) { chartNew(root); return; }
    var d = S.get();
    var list = h('div', { class: 'list' });
    d.charts.slice().reverse().forEach(function (c) {
      var del = h('button', { class: 'btn small ghost', text: 'Delete', onclick: function () { S.deleteChart(c.id); UI.render(); } });
      list.appendChild(h('div', { class: 'item' }, [
        h('span', { class: 'grow', style: 'cursor:pointer', onclick: function () { UI.go('charts', { chartId: c.id }); } }, [
          h('b', { text: c.name }), h('br'),
          h('span', { class: 'muted', text: c.stats.sections + ' sections · ' + c.stats.steps + ' chords' }), h('br'),
          h('span', { class: 'mono', style: 'font-size:.8rem', text: c.stats.chords.join('  ') })
        ]), del
      ]));
    });
    root.appendChild(h('div', { class: 'panel' }, [
      h('h2', { text: 'Charts', style: 'margin-bottom:6px' }),
      h('p', { class: 'muted', style: 'margin-bottom:12px', text: 'Paste a chord chart — chords over lyrics, sections like VERSE 1 or BRIDGE, directions in (brackets) — and play it as a routine, one chord at a time. It listens like the Songs screen does, or steps through on its own.' }),
      h('div', { class: 'row', style: 'margin-bottom:12px' }, [
        h('button', { class: 'btn primary', text: 'Paste a chart', onclick: function () { UI.go('charts', { 'new': 1 }); } })
      ]),
      d.charts.length ? list : h('p', { class: 'muted', text: 'No charts saved yet.' })
    ]));
  };

  function chartNew(root) {
    var ta = h('textarea', { class: 'chartbox', rows: 12, placeholder: 'Paste a chord chart here...\n\nVERSE 1\nD                C\nDime store, candy shop\nDm               G         D\nBroken axis, don\'t let it stop' });
    var nameIn = h('input', { type: 'text', class: 'chartname', placeholder: 'Routine name', 'aria-label': 'Routine name' });
    var preview = h('div'), msg = h('p', { class: 'statusline' }), parsed = null;
    function detect() {
      var text = ta.value;
      preview.innerHTML = ''; parsed = null;
      if (!text.trim()) { msg.textContent = 'Paste a chart first.'; msg.className = 'statusline warn'; return; }
      parsed = CB.chart.parse(text);
      msg.textContent = ''; msg.className = 'statusline';
      if (!parsed.steps.length) {
        preview.appendChild(h('p', { class: 'muted', text: 'No chords detected. A chord line is a line made only of chord symbols (D, C, Dm, G, Em, A7...), sitting over a lyric line.' }));
        return;
      }
      var firstLyric = '';
      parsed.sections.forEach(function (s) { if (!firstLyric) s.groups.forEach(function (gr) { if (!firstLyric && gr.lyric) firstLyric = gr.lyric; }); });
      if (!nameIn.value) nameIn.value = firstLyric || 'Untitled chart';
      parsed.sections.forEach(function (s) {
        var lines = s.groups.map(function (gr) { return gr.chords.join(' ') + (gr.lyric ? '  —  ' + gr.lyric : '') + (gr.note ? '  (' + gr.note + ')' : ''); });
        preview.appendChild(h('div', { class: 'chartsec' }, [
          h('b', { text: s.name + (s.note ? ' (' + s.note + ')' : '') }),
          h('div', { class: 'muted', style: 'white-space:pre-wrap;overflow-wrap:anywhere', text: lines.join('\n') })
        ]));
      });
      parsed.warnings.forEach(function (w) { preview.appendChild(h('p', { class: 'note', text: w })); });
      preview.appendChild(h('p', { class: 'mono muted', text: parsed.stats.sections + ' sections · ' + parsed.stats.groups + ' chord lines · ' + parsed.stats.steps + ' chords: ' + parsed.stats.chords.join(', ') + (parsed.meta && (parsed.meta.key || parsed.meta.bpm) ? ' · ' + [parsed.meta.key ? 'Key ' + parsed.meta.key : '', parsed.meta.bpm ? '~' + parsed.meta.bpm + ' BPM' : ''].filter(Boolean).join(' · ') : '') }));
    }
    root.appendChild(h('div', { class: 'panel', style: 'display:flex;flex-direction:column;gap:10px' }, [
      h('h2', { text: 'Paste a chart' }),
      h('p', { class: 'muted', text: 'Chord lines over lyric lines. Section headers like VERSE 1, BRIDGE or TAG — with or without [brackets]. A [Key: Em | ~70 bpm] line sets the key and tempo. Directions in (brackets) ride along with the next chord, and (same as above) repeats an earlier section. Tap Detect to see what it found before you build.' }),
      ta,
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', text: 'Detect chords', onclick: detect }),
        h('button', { class: 'btn ghost', text: 'Load the example', onclick: function () { ta.value = CB.chart.EXAMPLE; detect(); } }),
        h('button', { class: 'btn ghost', text: "Load 'Done Pissed Off'", onclick: function () { ta.value = CB.chart.EXAMPLE2; detect(); } })
      ]),
      preview,
      h('div', { class: 'setrow' }, [h('b', { text: 'Name' }), nameIn]),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn primary', text: 'Build routine', onclick: function () {
          if (!parsed || !parsed.steps.length) { detect(); if (!parsed || !parsed.steps.length) return; }
          var c = S.addChart({ name: (nameIn.value || '').trim() || 'Untitled chart', text: ta.value, sections: parsed.sections, steps: parsed.steps, warnings: parsed.warnings, stats: parsed.stats, meta: parsed.meta });
          UI.go('charts', { chartId: c.id });
        } }),
        h('button', { class: 'btn ghost', text: 'Back', onclick: function () { UI.go('charts'); } })
      ]),
      msg
    ]));
  }

  function playChart(root, chartId) {
    var c = S.chartById(chartId);
    if (!c) { UI.go('charts'); return; }
    UI.gate('charts', { chartId: chartId }, function () {
      startBackground(); UI.wake(true);
      var steps = c.steps, i = 0, auto = false, bpm = 90, timer = null;
      var t0 = performance.now(), start = Date.now(), seq = [], counts = {}, trans = {}, prev = null, prevT = 0;
      var hits = 0, hitIdx = {}, heardFor = {}, skipIdx = {};
      var rec = false, recordedBlob = null;
      var big = h('div', { class: 'bigchord' }), kind = h('div', { class: 'kind' }),
        diaA = h('div', { class: 'diawrap' }), diaNote = h('p', { class: 'muted', style: 'text-align:center;min-height:1.2em' }),
        diaN = h('div', { class: 'diawrap', 'data-small': '1' }), nextLab = h('div', { class: 'kind' }),
        lyricEl = h('div', { class: 'chartlyric' }), noteEl = h('div', { class: 'chartnote' }),
        status = h('div', { class: 'statusline' }),
        prog = h('div', { class: 'muted', style: 'text-align:center' }),
        chips = h('div', { class: 'stepchips' }), chipEls = [],
        tl = h('div', { class: 'timeline', style: 'overflow-y:auto' }),
        recNote = h('span', { class: 'muted', style: 'font-size:.85rem' });
      function updateProgress() {
        prog.textContent = 'Step ' + (i + 1) + ' of ' + steps.length + ' · Played right ' + hits + ' · Heard ' + seq.length + ' chords';
      }
      // Leaving steps behind by hand (Next / tapping a later chip) marks them
      // skipped unless the mic already played them right.
      function leave(from, to) {
        for (var k = from; k < to; k++) if (!hitIdx[k]) skipIdx[k] = true;
      }
      steps.forEach(function (st, idx) {
        var b = h('button', { class: 'stepchip', text: st.chord, title: st.section + (st.lyric ? ' — ' + st.lyric : ''), onclick: function () { goTo(idx); } });
        chipEls.push(b); chips.appendChild(b);
      });
      function barMs() { return 60000 / bpm * 4; }
      function armTimer() {
        if (timer) clearTimeout(timer);
        if (auto && i < steps.length - 1) timer = setTimeout(function () { go(1); }, barMs());
      }
      function paint() {
        var st = steps[i], nx = steps[i + 1];
        big.textContent = st.chord;
        kind.textContent = st.section + (st.sectionNote ? ' · ' + st.sectionNote : '') + ' · ' + (i + 1) + ' of ' + steps.length;
        if (st.known) { diaA.dataset.id = st.chord; diaA.innerHTML = UI.diaHTML(st.chord, false); diaNote.textContent = ''; }
        else { diaA.dataset.id = ''; diaA.innerHTML = ''; diaNote.textContent = 'No diagram for ' + st.chord + ' on this instrument.'; }
        if (nx) {
          if (nx.known) { diaN.dataset.id = nx.chord; diaN.innerHTML = UI.diaHTML(nx.chord, true); }
          else { diaN.dataset.id = ''; diaN.innerHTML = ''; }
          nextLab.textContent = 'next: ' + nx.chord;
        } else { diaN.dataset.id = ''; diaN.innerHTML = ''; nextLab.textContent = 'last chord'; }
        lyricEl.textContent = st.lyric || '—';
        noteEl.textContent = st.note ? '(' + st.note + ')' : '';
        chipEls.forEach(function (el, idx) { el.className = 'stepchip' + (idx === i ? ' cur' : idx < i ? ' done' : '') + (hitIdx[idx] ? ' hit' : '') + (skipIdx[idx] ? ' skip' : ''); });
        var cur = chipEls[i];
        if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        updateProgress();
      }
      function goTo(idx) {
        var ni = Math.max(0, Math.min(steps.length - 1, idx));
        if (ni > i) leave(i, ni);
        i = ni;
        status.textContent = ''; status.className = 'statusline';
        paint(); armTimer();
      }
      function go(d) {
        if (d > 0 && i >= steps.length - 1) { finish(); return; }
        if (d > 0) leave(i, i + 1);
        i = Math.max(0, Math.min(steps.length - 1, i + d));
        if (d < 0) { status.textContent = ''; status.className = 'statusline'; }
        paint(); armTimer();
      }
      var off = A.on('play', function (p) {
        V.chordChanged(p.id);
        var ms = Math.round(performance.now() - t0);
        seq.push([ms, p.id]); counts[p.id] = (counts[p.id] || 0) + 1;
        if (prev && prev !== p.id && ms - prevT < 6000) { var k = prev + '>' + p.id; trans[k] = (trans[k] || 0) + 1; }
        prev = p.id; prevT = ms;
        if (heardFor[i] === undefined) heardFor[i] = p.id;
        tl.appendChild(h('span', { text: p.id }));
        updateProgress();
        var st = steps[i];
        if (st.known && p.id === st.chord) {
          if (!hitIdx[i]) { hitIdx[i] = true; hits++; }
          status.textContent = 'Good.'; status.className = 'statusline good'; go(1);
        }
        else if (st.known) { status.textContent = 'Heard ' + p.id + '. Looking for ' + st.chord + '.'; status.className = 'statusline warn'; }
      });
      var offRec = A.on('recorded', function (r) { recordedBlob = r; });
      var recBtn = h('button', { class: 'btn', text: '● Record', onclick: function () {
        if (!rec) { if (A.startRecording()) { rec = true; recBtn.textContent = '■ Recording'; recBtn.classList.add('primary'); recNote.textContent = 'Saved when you finish the chart.'; } else recNote.textContent = 'Recording is not available here.'; }
        else { rec = false; A.stopRecording(); recBtn.textContent = '● Record'; recBtn.classList.remove('primary'); recNote.textContent = 'Recording kept for this screen.'; }
      } });
      var autoBtn = h('button', { class: 'btn', text: '▶ Play through', onclick: function () {
        auto = !auto;
        autoBtn.textContent = auto ? '❚❚ Stop auto' : '▶ Play through';
        autoBtn.classList.toggle('primary', auto);
        if (auto) { armTimer(); status.textContent = 'Auto-advance on: one bar per chord at ' + bpm + ' BPM.'; status.className = 'statusline'; }
        else { if (timer) clearTimeout(timer); status.textContent = ''; status.className = 'statusline'; }
      } });
      var bpmLab = h('span', { class: 'mono', text: bpm + ' BPM' });
      var bpmDown = h('button', { class: 'btn small', text: '−', 'aria-label': 'Slower', onclick: function () { bpm = Math.max(40, bpm - 5); bpmLab.textContent = bpm + ' BPM'; if (auto) armTimer(); } });
      var bpmUp = h('button', { class: 'btn small', text: '+', 'aria-label': 'Faster', onclick: function () { bpm = Math.min(180, bpm + 5); bpmLab.textContent = bpm + ' BPM'; if (auto) armTimer(); } });
      var metaBits = [];
      if (c.meta) { if (c.meta.key) metaBits.push('Key ' + c.meta.key); if (c.meta.bpm) metaBits.push('~' + c.meta.bpm + ' BPM'); }
      root.appendChild(h('div', { class: 'panel tight' }, [
        h('h3', { text: c.name }),
        h('p', { class: 'muted', text: c.stats.sections + ' sections · ' + c.stats.steps + ' chords · ' + c.stats.chords.join(', ') + (metaBits.length ? ' · ' + metaBits.join(' · ') : '') })
      ]));
      root.appendChild(h('div', { class: 'stage two' }, [
        h('div', {}, [big, kind, lyricEl, noteEl]),
        h('div', { style: 'display:flex;flex-direction:column;gap:8px;align-items:center' }, [diaA, diaNote, diaN, nextLab])
      ]));
      root.appendChild(chips); root.appendChild(prog); root.appendChild(tl); root.appendChild(status);
      root.appendChild(h('div', { class: 'row', style: 'justify-content:center' }, [
        h('button', { class: 'btn', text: 'Back', onclick: function () { go(-1); } }),
        h('button', { class: 'btn', text: 'Hear it', onclick: function () { var st = steps[i]; if (!A.strum(st.chord)) { status.textContent = 'No sound for ' + st.chord + ' on this instrument.'; status.className = 'statusline warn'; } } }),
        h('button', { class: 'btn primary', text: 'Next chord', onclick: function () { go(1); } }),
        h('button', { class: 'btn ghost', text: 'Restart', onclick: function () { goTo(0); } }),
        h('button', { class: 'btn ghost', text: 'Finish', onclick: function () { finish(); } })
      ]));
      root.appendChild(h('div', { style: 'text-align:center' }, recNote));
      root.appendChild(h('div', { class: 'row', style: 'justify-content:center' }, [
        autoBtn, bpmDown, bpmLab, bpmUp, recBtn,
        h('button', { class: 'btn ghost', text: 'Download .txt', onclick: function () { UI.download(c.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + '-chart.txt', c.text); } }),
        h('button', { class: 'btn ghost', text: 'All charts', onclick: function () { UI.go('charts'); } })
      ]));
      paint();
      var finished = false;
      function finish() {
        if (finished) return; finished = true;
        off(); if (timer) clearTimeout(timer); UI.wake(false);
        var wasRec = rec;
        if (rec) { rec = false; A.stopRecording(); }
        var dur = performance.now() - t0;
        setTimeout(function () { summary(dur, wasRec, 0); }, wasRec ? 350 : 0);
      }
      function summary(dur, wasRec, tries) {
        // The recorder's onstop (which delivers the blob) fires async after stop(),
        // so wait a beat for it before rendering; otherwise the recording section
        // is missing from the summary even though the take recorded fine.
        if (wasRec && !recordedBlob && (tries || 0) < 3) { setTimeout(function () { summary(dur, wasRec, (tries || 0) + 1); }, 250); return; }
        offRec();
        var mins = Math.max(dur / 60000, 1 / 60);
        if (seq.length || hits > 0) S.addSession({ t: start, mode: 'chart', planned: 0, durMs: Math.round(dur), cards: steps.length, hits: hits, cpm: hits / mins, medMs: 0, firstTry: steps.length ? hits / steps.length : 0, streak: 0, series: [] });
        V.stop(); root.innerHTML = '';
        var box = h('div', { class: 'panel' }, [h('h2', { text: 'Chart done', style: 'margin-bottom:10px' })]);
        var skips = Object.keys(skipIdx).length;
        box.appendChild(h('div', { class: 'hud' }, [
          sstat(hits + '/' + steps.length, 'played right'), sstat((hits + skips) + '/' + steps.length, 'completed'), sstat(UI.fmtTime(dur), 'time'),
          sstat(String(Object.keys(counts).length), 'chords heard')
        ]));
        // Step by step: what the chart asked for, what was actually heard for it.
        var stepLines = steps.map(function (st, idx) {
          var mark;
          if (hitIdx[idx]) mark = '✓ played';
          else if (skipIdx[idx]) mark = heardFor[idx] ? '✗ heard ' + heardFor[idx] : '→ skipped';
          else mark = '· not reached';
          return (idx + 1) + '. ' + st.section + ' · ' + st.chord + ' — ' + mark;
        });
        var stepText = 'Step by step — ' + c.name + '\nPlayed right ' + hits + ' of ' + steps.length + ' · completed ' + (hits + skips) + ' of ' + steps.length + ' in ' + UI.fmtTime(dur) + '\n' + stepLines.join('\n');
        box.appendChild(h('h3', { text: 'Step by step', style: 'margin:16px 0 8px' }));
        box.appendChild(h('div', { class: 'sheet', text: stepText }));
        var logText = stepText;
        if (seq.length) {
          var j = { t: start, durMs: Math.round(dur), counts: counts, trans: trans, seq: seq.slice(0, 600) };
          logText = stepText + '\n\n' + jamText(j);
          box.appendChild(h('h3', { text: 'What was heard', style: 'margin:16px 0 8px' }));
          box.appendChild(h('div', { class: 'sheet', text: jamText(j) }));
          box.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [
            h('button', { class: 'btn', text: 'Copy chord log', onclick: function (e) { UI.copy(logText, e.target); } }),
            h('button', { class: 'btn', text: 'Download log (.txt)', onclick: function () { UI.download('chart-' + new Date(start).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '-log.txt', logText); } })
          ]));
        } else {
          box.appendChild(h('p', { class: 'muted', text: 'No chords were heard, so there is no heard-chord log. The step-by-step above is the record.' }));
          box.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [
            h('button', { class: 'btn', text: 'Copy step record', onclick: function (e) { UI.copy(stepText, e.target); } }),
            h('button', { class: 'btn', text: 'Download record (.txt)', onclick: function () { UI.download('chart-' + new Date(start).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '-log.txt', stepText); } })
          ]));
        }
        var rb = recordedBlob;
        if (rb) {
          var url = URL.createObjectURL(rb.blob);
          box.appendChild(h('h3', { text: 'Recording', style: 'margin:16px 0 8px' }));
          box.appendChild(h('audio', { controls: true, src: url, style: 'width:100%' }));
          box.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [h('button', { class: 'btn', text: 'Download recording', onclick: function () { UI.download('chart-' + new Date(start).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.' + rb.ext, rb.blob); } }),
            h('span', { class: 'muted', text: 'Not stored in the app. Download it to keep it.' })]));
        }
        box.appendChild(h('div', { class: 'row', style: 'margin-top:16px' }, [
          h('button', { class: 'btn primary', text: 'Play again', onclick: function () { UI.go('charts', { chartId: c.id }); } }),
          h('button', { class: 'btn', text: 'Download chart (.txt)', onclick: function () { UI.download(c.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + '-chart.txt', c.text); } }),
          h('button', { class: 'btn ghost', text: 'All charts', onclick: function () { UI.go('charts'); } }),
          h('button', { class: 'btn ghost', text: 'Home', onclick: function () { UI.go('home'); } })
        ]));
        root.appendChild(box);
      }
      function sstat(v, l) { return h('div', { class: 'stat' }, [h('b', { text: v }), h('span', { text: l })]); }
      UI.cleanup = function () {
        if (!finished) {
          finished = true; off(); if (timer) clearTimeout(timer); UI.wake(false); if (rec) A.stopRecording();
          if (seq.length || hits > 0) S.addSession({ t: start, mode: 'chart', planned: 0, durMs: Math.round(performance.now() - t0), cards: steps.length, hits: hits, cpm: hits / Math.max((performance.now() - t0) / 60000, 1 / 60), medMs: 0, firstTry: steps.length ? hits / steps.length : 0, streak: 0, series: [] });
        }
        offRec(); V.stop();
      };
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
