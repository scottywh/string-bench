/* String Bench — home, input, tuner, settings, chord library, stats */
(function (g) {
  'use strict';
  var CB = g.CB, UI = CB.ui, S = CB.store, A = CB.audio, V = CB.visuals, CH = CB.chords, h = UI.h;
  var SC = UI.screens, slug = 'string-bench-' + CH.INSTR.id + (CH.INSTR.tuningId !== 'standard' ? '-' + CH.INSTR.tuningId : '');

  // ---------------------------------------------------------------- home
  SC.home = function (root) {
    V.stop();
    var d = S.get(), pool = S.pool(), known = S.knownIds();
    var lastJam = d.jams.length ? d.jams[d.jams.length - 1] : null;
    var topJam = lastJam ? Object.keys(lastJam.counts).sort(function (a, b) { return lastJam.counts[b] - lastJam.counts[a]; }).slice(0, 4).join(' · ') : '';
    var stageNow = 1; for (var s = 1; s <= CH.STAGES; s++) if (S.stageUnlocked(s)) stageNow = s;
    function door(name, desc, sub, to, lead) {
      return h('button', { class: 'door' + (lead ? ' lead' : ''), onclick: function () { UI.go(to); } }, [
        h('span', { class: 'nm', text: name }), h('span', { class: 'ds', text: desc }), sub ? h('span', { class: 'sub', text: sub }) : null
      ]);
    }
    var iopts = CB.instrumentIds.map(function (id) { return [id, CB.INSTRUMENTS[id].name]; });
    root.appendChild(h('div', { class: 'instpick' }, [
      h('span', { class: 'muted', text: 'Instrument' }), UI.seg(iopts, CH.INSTR.id, function (id) { CB.setInstrument(id); })
    ]));
    if (CH.INSTR.tuningList.length > 1) {
      root.appendChild(h('div', { class: 'instpick' }, [
        h('span', { class: 'muted', text: 'Tuning' }),
        UI.seg(CH.INSTR.tuningList.map(function (t) { return [t.id, t.name]; }), CH.INSTR.tuningId, function (id) { CB.setTuning(id); })
      ]));
    }
    root.appendChild(h('div', { class: 'hero' }, [
      h('h1', { text: 'Plug in. Play.' }),
      h('p', { class: 'muted', text: 'It listens, names the chords, and builds practice out of what you actually played.' })
    ]));
    root.appendChild(h('div', { class: 'grid doors' }, [
      door('Jam', 'Just play. It names what it hears and can record.', lastJam ? 'Last: ' + topJam : 'Starts with a quick tuning check', 'jam', true),
      door('Practice', 'Flash cards that listen. Pick 1, 5 or 15 minutes.', 'Stage ' + stageNow + ' · ' + known.length + ' known', 'practice'),
      door('Routine', 'A card set built from your jams and weak spots.', d.jams.length ? d.jams.length + ' jam' + (d.jams.length > 1 ? 's' : '') + ' to draw on' : 'Play a jam first', 'routine'),
      door('Test myself', 'Play a chord, mark it comfortable, unlock more.', pool.length + ' chords open', 'test'),
      door('Songs', 'Public domain tunes as a string of cards.', CH.SONGS.length + ' to start', 'songs'),
      door('Charts', 'Paste a chord chart, play it as a routine.', d.charts.length ? d.charts.length + ' saved' : 'Paste text, get a routine', 'charts'),
      door('Chords', 'Every shape, and which ones you already know.', CH.list.length + ' shapes', 'chords'),
      door('Stats', 'Changes per minute, accuracy, export and import.', d.sessions.length + ' session' + (d.sessions.length === 1 ? '' : 's'), 'stats')
    ]));
    root.appendChild(h('p', { class: 'muted', style: 'font-size:.85rem', text: 'Everything stays on this device. ' + (S.isMemOnly() ? 'Storage is blocked here, so progress will not survive closing the page. Use Export in Stats.' : 'Use Export in Stats to back it up.') }));
  };

  // --------------------------------------------------------------- input
  SC.input = function (root) {
    V.stop();
    var live = h('div'), unsub = null;
    root.appendChild(h('div', { class: 'panel' }, [
      h('h2', { text: 'Audio input' }),
      h('p', { class: 'muted', text: 'The phone mic, a USB interface or adapter, and a 3.5 mm mic all appear here. Echo cancel and noise suppression are switched off so chords stay intact.' }),
      h('div', { style: 'height:12px' }), live
    ]));
    function draw() {
      live.innerHTML = '';
      if (!A.supported()) { live.appendChild(h('p', { class: 'err', text: 'This browser cannot capture audio on this page. Use Chrome over https or localhost.' })); return; }
      if (!A.running) {
        if (UI.lastError) live.appendChild(h('p', { class: 'err', text: UI.lastError }));
        live.appendChild(h('button', { class: 'btn primary', text: 'Start listening', onclick: function () {
          UI.lastError = ''; A.start(S.settings().deviceId).then(function () { UI.updateChip(); draw(); }, function (e) { UI.lastError = UI.errText(e); draw(); });
        } }));
        return;
      }
      var info = A.info, lvl = h('b'), hint = h('span', { class: 'muted', text: 'Strum and watch the bar.' });
      live.appendChild(h('div', { class: 'row' }, [
        h('span', { class: 'tag', text: Math.round(info.sampleRate / 100) / 10 + ' kHz' }),
        h('span', { class: 'tag', text: info.kind }),
        info.echo === false ? h('span', { class: 'tag', text: 'raw audio' }) : h('span', { class: 'tag warn', text: 'browser may process audio' })
      ]));
      if (info.connected && info.connected.length) live.appendChild(h('p', { class: 'muted', style: 'margin-top:10px', text: 'Android sees: ' + info.connected.map(function (c) { return c.label; }).join(', ') + '. When a USB or wired input is connected, Android uses it instead of the phone mic. Plug or unplug and the app reopens the input by itself.' }));
      if (info.kind === 'bluetooth') live.appendChild(h('p', { class: 'note', style: 'margin-top:10px', text: 'Bluetooth microphones drop to phone-call quality, so chord detection will be less accurate. USB or the 3.5 mm jack works better.' }));
      live.appendChild(h('div', { style: 'height:10px' }));
      live.appendChild(h('div', { class: 'needle', style: 'height:22px' }, [h('div', { class: 'arm', style: 'left:0;width:0;margin:0;top:0;bottom:0;border-radius:0;display:none' }), lvl]));
      lvl.style.cssText = 'display:block;height:100%;width:0;background:var(--good);transition:width .06s linear';
      live.appendChild(h('p', { style: 'margin-top:6px' }, [hint]));
      if (unsub) unsub();
      unsub = A.on('level', function (d) {
        lvl.style.width = Math.max(0, Math.min(100, (d.maxDb + 90) / 60 * 100)) + '%';
        lvl.style.background = d.rms > 0.7 ? 'var(--bad)' : 'var(--good)';
        hint.textContent = d.rms > 0.7 ? 'Too loud: it is distorting. Lower the gain or move back.' : d.maxDb < A.floor() ? 'Quiet. Strum or raise the gain.' : 'Good level.';
      });
      live.appendChild(h('h3', { text: 'Inputs', style: 'margin:14px 0 8px' }));
      var list = h('div', { class: 'list' });
      A.devices.forEach(function (dv) {
        var sel = dv.id === (info.deviceId || S.settings().deviceId) || (dv.id === 'default' && !S.settings().deviceId);
        list.appendChild(h('button', { class: 'item' + (sel ? ' sel' : ''), onclick: function () {
          S.settings().deviceId = dv.id; S.save();
          A.start(dv.id).then(function () { UI.updateChip(); draw(); }, function (e) { UI.lastError = UI.errText(e); draw(); });
        } }, [h('span', { class: 'grow', text: dv.label }), h('span', { class: 'tag' + (dv.kind === 'bluetooth' ? ' warn' : ''), text: dv.kind })]));
      });
      if (!A.devices.length) list.appendChild(h('p', { class: 'muted', text: 'Only the default input is visible.' }));
      live.appendChild(list);
      live.appendChild(h('div', { class: 'setrow' }, [
        h('span', {}, [h('b', { text: 'Sensitivity' }), h('br'), h('span', { class: 'muted', text: 'Raise if it misses quiet strums, lower if it hears the room.' })]),
        h('input', { type: 'range', min: -12, max: 12, step: 1, value: S.settings().sens || 0, 'aria-label': 'Sensitivity', oninput: function (e) { S.settings().sens = +e.target.value; S.save(); } })
      ]));
      live.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [
        h('button', { class: 'btn', text: 'Tuner', onclick: function () { UI.go('tuner', { next: 'home' }); } }),
        h('button', { class: 'btn ghost', text: 'Back', onclick: function () { UI.go('home'); } })
      ]));
    }
    draw();
    UI.cleanup = function () { if (unsub) unsub(); };
  };

  // --------------------------------------------------------------- tuner
  SC.tuner = function (root, p) {
    V.stop();
    var next = p.next || 'home', nextParams = p.nextParams || {};
    var N = A.STRINGS.length, UN = CH.INSTR.unit || 'string', pills = [], needle, arm, readout, msg, cont, done = false, unsub = null, timer = null;
    UI.listen().then(function (ok) {
      if (UI.name !== 'tuner') return;
      if (!ok) { UI.failPanel(root); return; }
      A.mode('tuner'); A.tunerReset();
      unsub = A.on('tuner', onTune);
    });
    var strWrap = h('div', { class: 'strings', style: 'grid-template-columns:repeat(' + N + ',1fr)' });
    A.STRINGS.forEach(function (s, i) {
      var b = h('button', { class: 'sbtn', type: 'button', title: 'Tap to hear ' + s.name, 'aria-label': 'Hear ' + s.name + ', ' + s.f.toFixed(0) + ' hertz', onclick: function () { A.tone(i); } }, [s.name, h('small', { text: s.f.toFixed(1) + ' Hz' })]);
      pills.push(b);
      strWrap.appendChild(h('div', { style: 'display:flex;flex-direction:column;gap:4px' }, [b,
        h('button', { class: 'btn ghost', type: 'button', style: 'font-size:.75rem;padding:2px 6px', text: 'Skip', onclick: function () { A.tunerSkip(i); } })]));
    });
    arm = h('div', { class: 'arm' });
    needle = h('div', { class: 'needle' }, [h('div', { class: 'zone' }), h('div', { class: 'tick', style: 'left:25%' }), h('div', { class: 'tick', style: 'left:75%' }), arm]);
    readout = h('p', { class: 'mono', style: 'text-align:center;min-height:1.5em', text: 'Tap a ' + UN + ' to hear it, then pluck it. Start with the lowest (' + A.STRINGS[0].name + ').' });
    msg = h('p', { class: 'statusline' });
    cont = h('button', { class: 'btn primary', text: 'Continue', disabled: true, onclick: finish });
    root.appendChild(h('div', { class: 'panel', style: 'display:flex;flex-direction:column;gap:14px' }, [
      h('h2', { text: 'Tune up' }),
      h('p', { class: 'muted', text: 'Pluck each open ' + UN + ' ' + (CH.INSTR.paired ? '(both strings together) ' : '') + 'and hold it until it turns green. Detection assumes ' + CH.INSTR.tuningName + ' tuning. Tap Skip under a string to mark it done, or Skip tuning to move on.' }),
      strWrap, needle, readout, msg,
      h('div', { class: 'row' }, [cont, h('button', { class: 'btn', text: 'Skip tuning', onclick: finish }),
        h('button', { class: 'btn ghost', text: 'Start over', onclick: function () { A.tunerReset(); paint(A.tunerState().pass.slice(), -1, 0, 0); } }),
        h('button', { class: 'btn ghost', text: 'Input', onclick: function () { UI.go('input'); } })])
    ]));
    function paint(pass, idx, cents, f) {
      pills.forEach(function (b, i) { b.className = 'sbtn' + (pass[i] ? ' ok' : (i === idx ? ' on' : '')); });
      if (idx >= 0) {
        var c = Math.max(-50, Math.min(50, cents));
        arm.style.left = (50 + c) + '%';
        arm.className = 'arm' + (Math.abs(cents) <= 7 ? ' ok' : '');
        readout.textContent = A.STRINGS[idx].name + (A.STRINGS[idx].oct ? '' : '') + '  ' + f.toFixed(1) + ' Hz  ' + (cents > 0 ? '+' : '') + Math.round(cents) + ' cents ' + (Math.abs(cents) <= 7 ? '' : cents > 0 ? '(too sharp, loosen)' : '(too flat, tighten)');
      } else { arm.style.left = '50%'; arm.className = 'arm'; }
      var n = pass.filter(Boolean).length;
      if (n === N && !done) {
        done = true; cont.disabled = false; msg.className = 'statusline good'; msg.textContent = 'All four courses in tune.';
        readout.textContent = 'Nice.';
        timer = setTimeout(finish, 1400);
      } else if (!done) { msg.className = 'statusline'; msg.textContent = n + ' of ' + N + ' in tune'; }
    }
    var hearIdx = -1;
    var unTone = A.on('tone', function (d) { hearIdx = d.idx; pills.forEach(function (b, i) { b.classList.toggle('hear', i === hearIdx); }); if (hearIdx >= 0) { readout.textContent = 'Listen: ' + A.STRINGS[hearIdx].name + ' (' + A.STRINGS[hearIdx].f.toFixed(1) + ' Hz). Now pluck it.'; arm.style.left = '50%'; arm.className = 'arm'; } });
    function onTune(d) { if (d.tone) return; paint(d.pass, d.idx, d.cents, d.f); pills.forEach(function (b, i) { b.classList.toggle('hear', i === hearIdx); }); }
    function finish() { if (timer) clearTimeout(timer); UI.markTuned(); UI.go(next, nextParams); }
    UI.cleanup = function () { if (timer) clearTimeout(timer); if (unsub) unsub(); if (unTone) unTone(); A.stopTone(true); A.mode('chords'); };
  };

  // ------------------------------------------------------------ settings
  SC.settings = function (root) {
    V.stop();
    var st = S.settings();
    function row(title, desc, control) {
      return h('div', { class: 'setrow' }, [h('span', { style: 'flex:1;min-width:180px' }, [h('b', { text: title }), desc ? h('br') : null, desc ? h('span', { class: 'muted', text: desc }) : null]), control]);
    }
    function set(k, v, rerender) { st[k] = v; S.save(); if (k === 'theme') UI.applyTheme(); if (k === 'left' || k === 'orient') UI.refreshDia(); if (k === 'visual') V.setMode(v); }
    root.appendChild(h('div', { class: 'panel' }, [
      h('h2', { text: 'Settings', style: 'margin-bottom:6px' }),
      row('Theme', '', UI.seg([['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], st.theme, function (v) { set('theme', v); })),
      row('Left-handed diagrams', 'Mirrors every chord diagram.', UI.toggle(st.left, function (v) { set('left', v); }, 'Left-handed diagrams')),
      row('Fretboard direction', 'Auto turns it sideways in landscape, handy on a TV.', UI.seg([['auto', 'Auto'], ['vertical', 'Upright'], ['horizontal', 'Sideways']], st.orient, function (v) { set('orient', v); })),
      row('Chord names only', 'Hide the fingering on flash cards.', UI.toggle(st.namesOnly, function (v) { set('namesOnly', v); }, 'Chord names only')),
      row('Correct plays per card', 'How many right plays before the next card.', h('input', { type: 'number', min: 1, max: 10, value: st.needed, 'aria-label': 'Correct plays per card', onchange: function (e) { set('needed', Math.max(1, Math.min(10, +e.target.value || 3))); } })),
      row('Beginner card order', 'Neighbouring cards share anchor fingers. Off means fully random.', UI.toggle(st.beginner, function (v) { set('beginner', v); }, 'Beginner order')),
      row('Mix in known chords', 'Share of cards that are chords you already know.', h('div', { class: 'row' }, [h('input', { type: 'range', min: 0, max: 80, step: 10, value: st.knownMix, 'aria-label': 'Known chord mix', oninput: function (e) { set('knownMix', +e.target.value); e.target.nextSibling.textContent = e.target.value + '%'; } }), h('span', { class: 'mono', text: st.knownMix + '%' })])),
      row('Card timeout', 'Seconds before an unanswered card counts as a miss. 0 means never.', h('input', { type: 'number', min: 0, max: 120, value: st.cardTimeout, 'aria-label': 'Card timeout seconds', onchange: function (e) { set('cardTimeout', Math.max(0, Math.min(120, +e.target.value || 0))); } })),
      row('Background', 'Shown behind the playing screens.', h('select', { 'aria-label': 'Background', onchange: function (e) { set('visual', e.target.value); } },
        Object.keys(V.NAMES).map(function (k) { return h('option', { value: k, text: V.NAMES[k], selected: st.visual === k }); }))),
      row('Open every stage', 'Skip the unlock rule for chord stages.', UI.toggle(st.unlockAll, function (v) { set('unlockAll', v); }, 'Open every stage'))
    ]));
  };

  // ------------------------------------------------------------- chords
  SC.chords = function (root) {
    V.stop();
    var host = h('div');
    root.appendChild(h('div', { class: 'panel' }, [
      h('h2', { text: 'Chords' }),
      h('p', { class: 'muted', text: 'Mark what you already play. A stage opens when about 80% of the stage before it is marked known. Status also moves on its own from how you play in practice.' })
    ]));
    root.appendChild(host);
    function draw() {
      host.innerHTML = '';
      for (var st = 1; st <= CH.STAGES; st++) {
        var open = S.stageUnlocked(st), list = CH.byStage(st), kn = list.filter(function (c) { return S.status(c.id) === 'known'; }).length;
        host.appendChild(h('div', { class: 'stagehead' }, [
          h('h3', { text: 'Stage ' + st + ' · ' + CH.STAGE_NAMES[st] }),
          h('span', { class: 'mono muted', text: kn + '/' + list.length + ' known' + (open ? '' : ' · locked') })
        ]));
        var grid = h('div', { class: 'cgrid', style: 'margin-top:8px' });
        list.forEach(function (c) {
          var stt = S.status(c.id), r = S.hitRate(c.id);
          grid.appendChild(h('div', { class: 'ccard ' + stt + (open ? '' : ' locked') }, [
            h('span', { class: 'nm', text: c.id }),
            h('span', { class: 'muted', style: 'font-size:.78rem', text: c.kind }),
            UI.dia(c.id, true),
            h('span', { class: 'mono muted', style: 'font-size:.75rem', text: stt + (r === null ? '' : ' · ' + Math.round(r * 100) + '% recent') }),
            h('div', { class: 'row', style: 'justify-content:center' }, [
              h('button', { class: 'btn small' + (stt === 'known' ? ' primary' : ''), text: stt === 'known' ? 'Known' : 'I know it', onclick: function () { S.setStatus(c.id, stt === 'known' ? 'learning' : 'known'); draw(); } }),
              h('button', { class: 'btn small ghost', text: 'Test', onclick: function () { UI.go('test', { ids: [c.id] }); } })
            ])
          ]));
        });
        host.appendChild(grid);
      }
    }
    draw();
  };

  // --------------------------------------------------------------- stats
  SC.stats = function (root) {
    V.stop();
    var d = S.get(), ses = d.sessions.filter(function (s) { return s.mode !== 'test' || s.cards; });
    var totalMs = d.sessions.reduce(function (a, s) { return a + s.durMs; }, 0) + d.jams.reduce(function (a, j) { return a + j.durMs; }, 0);
    var last = ses.slice(-12);
    var card = h('div', { class: 'panel' }, [h('h2', { text: 'Stats', style: 'margin-bottom:10px' })]);
    var recent = ses.slice(-5), avg = recent.length ? recent.reduce(function (a, s) { return a + (s.cpm || 0); }, 0) / recent.length : 0;
    card.appendChild(h('div', { class: 'hud' }, [
      stat(String(d.sessions.length), 'practice sessions'), stat(String(d.jams.length), 'jams'),
      stat(UI.fmtTime(totalMs), 'time played'), stat(recent.length ? avg.toFixed(1) : '-', 'changes/min, last 5')
    ]));
    root.appendChild(card);
    function stat(v, l) { return h('div', { class: 'stat' }, [h('b', { text: v }), h('span', { text: l })]); }

    var ch = h('div', { class: 'panel' }, [h('h3', { text: 'Changes per minute', style: 'margin-bottom:8px' })]);
    if (last.length) {
      var W = 520, H = 160, pad = 28, mx = Math.max.apply(null, last.map(function (s) { return s.cpm || 0; }).concat([4]));
      var bw = (W - pad * 2) / last.length, svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Changes per minute by session">';
      svg += '<line class="ax" x1="' + pad + '" y1="' + (H - 24) + '" x2="' + (W - pad) + '" y2="' + (H - 24) + '"/>';
      svg += '<text x="4" y="14">' + Math.round(mx) + '</text><text x="4" y="' + (H - 26) + '">0</text>';
      last.forEach(function (s, i) {
        var bh = (s.cpm || 0) / mx * (H - 50), x = pad + i * bw + 4;
        svg += '<rect class="b" x="' + x + '" y="' + (H - 24 - bh) + '" width="' + Math.max(4, bw - 8) + '" height="' + bh + '" rx="2"/>';
        svg += '<text x="' + (x + (bw - 8) / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + (new Date(s.t).getMonth() + 1) + '/' + new Date(s.t).getDate() + '</text>';
      });
      ch.appendChild(h('div', { html: svg + '</svg>' }));
      var ses2 = ses[ses.length - 1];
      ch.appendChild(h('p', { class: 'muted', style: 'margin-top:6px', text: 'Last session: ' + ses2.hits + ' of ' + ses2.cards + ' cards, median change ' + (ses2.medMs / 1000).toFixed(1) + ' s, first-try accuracy ' + Math.round((ses2.firstTry || 0) * 100) + '%.' }));
    } else ch.appendChild(h('p', { class: 'muted', text: 'Run a practice session and your speed shows up here. Speed and first-try accuracy are tracked separately.' }));
    root.appendChild(ch);

    var tb = h('table', {}, [h('thead', {}, h('tr', {}, ['Chord', 'Status', 'Recent hits', 'Median change'].map(function (t) { return h('th', { text: t }); })))]);
    var body = h('tbody');
    CH.list.forEach(function (c) {
      var x = d.chords[c.id]; if (!x && S.status(c.id) === 'unknown') return;
      var r = S.hitRate(c.id);
      body.appendChild(h('tr', {}, [h('td', { text: c.id }), h('td', { text: S.status(c.id) }), h('td', { class: 'mono', text: r === null ? '-' : Math.round(r * 100) + '% of ' + x.recent.length }), h('td', { class: 'mono', text: x && x.ms.length ? (S.median(x.ms) / 1000).toFixed(1) + ' s' : '-' })]));
    });
    tb.appendChild(body);
    var cp = h('div', { class: 'panel' }, [h('h3', { text: 'Chords you have touched', style: 'margin-bottom:8px' })]);
    cp.appendChild(body.children.length ? h('div', { class: 'tablewrap' }, tb) : h('p', { class: 'muted', text: 'Nothing yet.' }));
    root.appendChild(cp);

    var msg = h('p', { class: 'muted', style: 'min-height:1.4em' });
    var armed = false, reset = h('button', { class: 'btn ghost', text: 'Reset everything', onclick: function () {
      if (!armed) { armed = true; reset.textContent = 'Tap again to erase all data'; setTimeout(function () { armed = false; reset.textContent = 'Reset everything'; }, 4000); return; }
      S.resetAll(); UI.applyTheme(); UI.render();
    } });
    var file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none', onchange: function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { var r = S.importJSON(String(rd.result)); msg.textContent = r.msg; msg.className = r.ok ? 'statusline good' : 'statusline bad'; if (r.ok) { UI.applyTheme(); setTimeout(UI.render, 900); } };
      rd.readAsText(f);
    } });
    root.appendChild(h('div', { class: 'panel' }, [
      h('h3', { text: 'Your data', style: 'margin-bottom:8px' }),
      h('p', { class: 'muted', text: 'Stored only in this browser. Export keeps a copy you can move to another device.' }),
      h('div', { class: 'row', style: 'margin-top:10px' }, [
        h('button', { class: 'btn', text: 'Export backup (JSON)', onclick: function () { UI.download(slug + '-backup.json', S.exportJSON(), 'application/json'); } }),
        h('button', { class: 'btn', text: 'Export stats (CSV)', onclick: function () { UI.download(slug + '-stats.csv', S.exportCSV(), 'text/csv'); } }),
        h('button', { class: 'btn', text: 'Import backup', onclick: function () { file.click(); } }), file, reset
      ]), msg
    ]));
  };
})(typeof window !== 'undefined' ? window : globalThis);
