/* String Bench — input devices, live listener (chord plays), tuner */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var DSP = CB.dsp, CH = CB.chords, S = CB.store;
  var FFT = 8192;
  var STRINGS = CH.INSTR.strings, NSTR = STRINGS.length, TMIN = CH.INSTR.tunerMin || 60, TMAX = CH.INSTR.tunerMax || 460;

  var L = {
    ctx: null, stream: null, src: null, anF: null, anT: null, devices: [], track: null,
    running: false, timer: null, handlers: {}, cands: null, candKey: '',
    fdb: null, tdb: null, floorBase: -78,
    viz: { chroma: new Float32Array(12), spec: new Float32Array(64), level: 0, id: null, maxDb: -120 },
    lastPlayAt: 0, info: { sampleRate: 0, label: '', kind: '', echo: null }, recorder: null
  };

  L.on = function (ev, fn) { (L.handlers[ev] = L.handlers[ev] || []).push(fn); return function () { L.off(ev, fn); }; };
  L.off = function (ev, fn) { var a = L.handlers[ev]; if (!a) return; var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
  function emit(ev, d) { var a = L.handlers[ev]; if (a) a.slice().forEach(function (f) { try { f(d); } catch (e) { console.error(e); } }); }

  L.kindOf = function (label) {
    label = (label || '').toLowerCase();
    if (/bluetooth|airpod|bt |hands-?free|buds|headset/.test(label)) return 'bluetooth';
    if (/usb|interface|scarlett|focusrite|behringer|ik multimedia|irig|audio codec|cable|line/.test(label)) return 'usb';
    if (/built|internal|default|microphone array|mic array|phone|front|bottom|back/.test(label)) return 'builtin';
    return 'other';
  };

  // Android's WebView gives the mic track no name, so ask the app which inputs are connected.
  // Ids are AudioDeviceInfo types: 15 built-in mic, 3 wired headset, 5/6 line, 11/12/22 USB, 7/26 Bluetooth.
  L.route = function () {
    var B = g.ChordBenchApp, out = { all: [], kind: '', label: '' };
    if (!B || !B.inputs) return out;
    var raw = ''; try { raw = String(B.inputs() || ''); } catch (e) { }
    var names = { 15: ['builtin', 'Phone mic'], 3: ['wired', '3.5 mm headset mic'], 5: ['wired', 'Line input'], 6: ['wired', 'Digital line input'],
      11: ['usb', 'USB audio'], 12: ['usb', 'USB audio'], 22: ['usb', 'USB headset'], 7: ['bluetooth', 'Bluetooth mic'], 26: ['bluetooth', 'Bluetooth LE mic'], 18: ['', ''], 0: ['', ''] };
    raw.split(';').forEach(function (it) {
      var t = +it.split(':')[0], n = names[t]; if (!it || !n || !n[0]) return;
      if (!out.all.some(function (x) { return x.kind === n[0]; })) out.all.push({ kind: n[0], label: n[1] });
    });
    var pri = ['usb', 'wired', 'bluetooth', 'builtin'];
    for (var i = 0; i < pri.length; i++) {
      var m = out.all.filter(function (x) { return x.kind === pri[i]; })[0];
      if (m) { out.kind = m.kind; out.label = m.label; break; }
    }
    return out;
  };

  L.supported = function () {
    return !!(g.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (g.AudioContext || g.webkitAudioContext));
  };

  L.listDevices = function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return Promise.resolve([]);
    return navigator.mediaDevices.enumerateDevices().then(function (ds) {
      L.devices = ds.filter(function (d) { return d.kind === 'audioinput'; }).map(function (d, i) {
        var label = d.label || ('Input ' + (i + 1));
        return { id: d.deviceId, label: label, kind: L.kindOf(label) };
      });
      return L.devices;
    });
  };

  L.start = function (deviceId) {
    if (!L.supported()) return Promise.reject(new Error('This browser cannot capture audio here. Use https or localhost in Chrome.'));
    L.stop();
    var a = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 };
    if (deviceId) a.deviceId = { exact: deviceId };
    var p = navigator.mediaDevices.getUserMedia({ audio: a });
    return p.catch(function (err) {
      if (deviceId && err && (err.name === 'OverconstrainedError' || err.name === 'NotFoundError')) {
        delete a.deviceId; return navigator.mediaDevices.getUserMedia({ audio: a });
      }
      throw err;
    }).then(function (stream) {
      var AC = g.AudioContext || g.webkitAudioContext;
      L.ctx = L.ctx && L.ctx.state !== 'closed' ? L.ctx : new AC({ latencyHint: 'interactive' });
      if (L.ctx.resume) L.ctx.resume();
      L.stream = stream;
      L.track = stream.getAudioTracks()[0];
      var st = L.track && L.track.getSettings ? L.track.getSettings() : {};
      L.src = L.ctx.createMediaStreamSource(stream);
      L.anF = L.ctx.createAnalyser(); L.anF.fftSize = FFT; L.anF.smoothingTimeConstant = 0.25;
      L.anT = L.ctx.createAnalyser(); L.anT.fftSize = 4096; L.anT.smoothingTimeConstant = 0;
      L.src.connect(L.anF); L.src.connect(L.anT);
      L.fdb = new Float32Array(L.anF.frequencyBinCount);
      L.tdb = new Float32Array(L.anT.fftSize);
      L.info = {
        sampleRate: L.ctx.sampleRate, label: L.track ? L.track.label : '', kind: L.kindOf(L.track ? L.track.label : ''),
        echo: st.echoCancellation, deviceId: st.deviceId || deviceId || ''
      };
      var rt = L.route();
      if (rt.kind && (!L.info.label || L.info.kind === 'other' || /default/i.test(L.info.label))) { L.info.label = rt.label; L.info.kind = rt.kind; }
      L.info.connected = rt.all;
      L.wantId = deviceId || '';
      L.running = true;
      L.resetState();
      L.timer = setInterval(tick, 60);
      return L.listDevices().then(function () { return L.info; });
    });
  };

  L.stop = function () {
    if (L.timer) { clearInterval(L.timer); L.timer = null; }
    if (L.recorder && L.recorder.state !== 'inactive') { try { L.recorder.stop(); } catch (e) { } }
    if (L.stream) L.stream.getTracks().forEach(function (t) { t.stop(); });
    if (L.src) { try { L.src.disconnect(); } catch (e) { } }
    L.stream = null; L.src = null; L.running = false;
  };

  // candidate chords the listener may name
  L.setCandidates = function (list) {
    var key = list.map(function (c) { return c.id; }).join('|');
    if (key === L.candKey) return;
    L.candKey = key; L.cands = DSP.makeCandidates(list);
  };

  var st = null;
  L.resetState = function () {
    st = { votes: [], stable: null, armed: false, lastPlayId: null, lastPlayAt: 0, hist: [], quietSince: 0, lastLoud: 0, current: null, mode: 'chords' };
    L.viz.id = null;
  };
  L.mode = function (m) { if (st) st.mode = m; };
  L.floor = function () { return L.floorBase - (S.settings().sens || 0); };

  function tick() {
    if (!L.running || !L.anF) return;
    var now = performance.now();
    L.anF.getFloatFrequencyData(L.fdb);
    L.anT.getFloatTimeDomainData(L.tdb);
    var rms = DSP.rms(L.tdb, 0, L.tdb.length);
    var res = DSP.analyze(L.fdb, L.ctx.sampleRate, FFT, { floorDb: L.floor() });
    var loud = res.maxDb > L.floor() + 8;
    var v = L.viz;
    v.level = Math.min(1, rms * 6);
    v.maxDb = res.maxDb;
    // chroma smoothing for visuals
    var sum = 0, k;
    for (k = 0; k < 12; k++) sum += res.chroma[k];
    for (k = 0; k < 12; k++) {
      var tgt = sum > 0 ? res.chroma[k] / (sum / 2.2) : 0;
      v.chroma[k] += (Math.min(1, tgt) - v.chroma[k]) * 0.35;
    }
    // coarse log-spaced spectrum for visuals
    var nyq = L.ctx.sampleRate / 2, bins = L.fdb.length;
    for (var b = 0; b < 64; b++) {
      var f0 = 70 * Math.pow(2, b * 5 / 64 * 1.0), f1 = 70 * Math.pow(2, (b + 1) * 5 / 64);
      var i0 = Math.max(1, Math.floor(f0 / nyq * bins)), i1 = Math.max(i0 + 1, Math.floor(f1 / nyq * bins)), m = -140;
      for (var i = i0; i < i1 && i < bins; i++) if (L.fdb[i] > m) m = L.fdb[i];
      var val = Math.max(0, Math.min(1, (m + 100) / 60));
      v.spec[b] += (val - v.spec[b]) * 0.4;
    }

    emit('level', { rms: rms, maxDb: res.maxDb, loud: loud });
    if (st.mode === 'tuner') { tunerTick(rms); return; }
    if (!L.cands) return;

    // onset detection from the loudness history
    st.hist.push(res.maxDb); if (st.hist.length > 7) st.hist.shift();
    var minH = Math.min.apply(null, st.hist);
    if (loud && st.hist.length >= 4 && res.maxDb - minH >= 8 && now - st.lastPlayAt > 220 && !st.rising) {
      st.armed = true; st.votes = []; st.rising = true;
    }
    if (res.maxDb - minH < 3) st.rising = false;

    if (!loud) {
      if (!st.quietSince) st.quietSince = now;
      if (now - st.quietSince > 900) { st.lastPlayId = null; st.votes = []; st.stable = null; }
      if (now - st.quietSince > 1600 && v.id) { v.id = null; emit('quiet', {}); }
      return;
    }
    st.quietSince = 0;
    var cl = DSP.classify(res.chroma, res.bass, L.cands, { low: res.low });
    st.votes.push(cl.ok ? cl.id : null); if (st.votes.length > 4) st.votes.shift();
    var n = st.votes.length, last3 = st.votes.slice(-3);
    if (n >= 3 && last3[0] && last3[0] === last3[1] && last3[1] === last3[2]) {
      var id = last3[0];
      v.id = id; v.score = cl.score;
      var isNew = id !== st.lastPlayId;
      if (st.armed || isNew) {
        if (now - st.lastPlayAt > 260 || isNew) {
          st.armed = false; st.lastPlayId = id; st.lastPlayAt = now;
          L.lastPlayAt = now;
          emit('play', { id: id, score: cl.score, t: Date.now(), now: now });
        }
      }
    } else if (!cl.ok && n >= 3 && st.armed && now - st.lastPlayAt > 700 && st.votes.slice(-3).every(function (x) { return x === null; })) {
      st.armed = false;
      emit('unclear', {});
    }
  }

  // ---- tuner -------------------------------------------------------------
  function freshPass() { var p = []; for (var i = 0; i < NSTR; i++) p.push(false); return p; }
  var tun = { pass: freshPass(), hold: 0, idx: -1 };
  L.tunerReset = function () { tun = { pass: freshPass(), hold: 0, idx: -1 }; };
  // Mark one string as done without playing it (per-string skip from the tuner screen).
  L.tunerSkip = function (i) { if (i < 0 || i >= NSTR) return; tun.pass[i] = true; emit('tuner', { idx: -1, cents: 0, f: 0, pass: tun.pass.slice() }); };
  L.tunerState = function () { return tun; };
  L.STRINGS = STRINGS;
  // ---- reference tone: tap a string in the tuner to hear it at the right pitch ----
  // A sine at 82 Hz is inaudible on a phone speaker, so the tone is built from harmonics: the ear still hears the
  // low pitch from the upper partials. The tuner ignores the mic while the tone plays so it never tunes to itself.
  var toneNodes = null;
  L.toneUntil = 0;
  L.tone = function (i) {
    var s = STRINGS[i], AC = g.AudioContext || g.webkitAudioContext;
    if (!s || !AC) return false;
    if (!L.ctx || L.ctx.state === 'closed') L.ctx = new AC({ latencyHint: 'interactive' });
    var ctx = L.ctx; if (ctx.resume) ctx.resume();
    L.stopTone(true);
    var t0 = ctx.currentTime + 0.02, dur = 2.8;
    var amps = s.f < 130 ? [0, 0.5, 1, 1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.12] : s.f < 200 ? [0, 0.8, 1, 0.8, 0.6, 0.4, 0.25, 0.15, 0.1, 0.06] : [0, 1, 0.6, 0.4, 0.28, 0.18, 0.1, 0.06, 0.04, 0.02];
    var wave = ctx.createPeriodicWave(new Float32Array(amps.length), Float32Array.from(amps));
    var osc = ctx.createOscillator(); osc.setPeriodicWave(wave); osc.frequency.value = s.f;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0); gain.gain.linearRampToValueAtTime(0.34, t0 + 0.015); gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(t0); osc.stop(t0 + dur + 0.05);
    toneNodes = { osc: osc, gain: gain };
    L.toneUntil = Date.now() + dur * 1000 + 500;
    osc.onended = function () { if (toneNodes && toneNodes.osc === osc) { toneNodes = null; L.toneUntil = Date.now() + 300; emit('tone', { idx: -1 }); } };
    emit('tone', { idx: i });
    return true;
  };
  L.stopTone = function (quiet) {
    if (toneNodes) { try { toneNodes.gain.gain.cancelScheduledValues(0); toneNodes.gain.gain.setValueAtTime(0, 0); toneNodes.osc.stop(); } catch (e) { } toneNodes = null; }
    L.toneUntil = Date.now() + 300;
    if (!quiet) emit('tone', { idx: -1 });
  };
  // ---- strum a chord from the library: its notes, low to high, ~28 ms apart ----
  L.strum = function (id) {
    var c = CH.byId[id];
    if (!c || !c.notes || !c.notes.length) return false;
    var AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return false;
    if (!L.ctx || L.ctx.state === 'closed') L.ctx = new AC({ latencyHint: 'interactive' });
    var ctx = L.ctx; if (ctx.resume) ctx.resume();
    L.stopTone(true);
    var t0 = ctx.currentTime + 0.02;
    var notes = c.notes.slice().sort(function (a, b) { return a - b; }).slice(0, 6);
    notes.forEach(function (m, i) {
      var f = 440 * Math.pow(2, (m - 69) / 12), t = t0 + i * 0.028, dur = 1.6;
      var amps = f < 200 ? [0, 0.8, 1, 0.8, 0.6, 0.4, 0.25, 0.15, 0.1, 0.06] : [0, 1, 0.6, 0.4, 0.28, 0.18, 0.1, 0.06, 0.04, 0.02];
      var wave = ctx.createPeriodicWave(new Float32Array(amps.length), Float32Array.from(amps));
      var osc = ctx.createOscillator(); osc.setPeriodicWave(wave); osc.frequency.value = f;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.22, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t + dur + 0.05);
    });
    return true;
  };
  function tunerTick(rms) {
    if (Date.now() < L.toneUntil) { tun.hold = 0; emit('tuner', { idx: -1, cents: 0, f: 0, pass: tun.pass.slice(), tone: true }); return; }
    if (rms < 0.004) { tun.hold = 0; emit('tuner', { idx: -1, cents: 0, f: 0, pass: tun.pass.slice() }); return; }
    var r = DSP.yin(L.tdb, L.ctx.sampleRate, TMIN, TMAX, 0.15);
    if (!r || r.clarity < 0.82) { tun.hold = 0; emit('tuner', { idx: -1, cents: 0, f: 0, pass: tun.pass.slice() }); return; }
    var best = -1, bc = 1e9;
    for (var i = 0; i < NSTR; i++) {
      var c = 1200 * Math.log2(r.f / STRINGS[i].f);
      if (Math.abs(c) < Math.abs(bc)) { bc = c; best = i; }
    }
    if (Math.abs(bc) > 80) { tun.hold = 0; emit('tuner', { idx: -1, cents: bc, f: r.f, pass: tun.pass.slice() }); return; }
    if (best === tun.idx && Math.abs(bc) <= 7) tun.hold++; else tun.hold = 0;
    tun.idx = best;
    if (tun.hold >= 8 && !tun.pass[best]) { tun.pass[best] = true; }
    emit('tuner', { idx: best, cents: bc, f: r.f, pass: tun.pass.slice(), hold: tun.hold });
  }

  // ---- recording ---------------------------------------------------------
  L.canRecord = function () { return !!(g.MediaRecorder && L.stream); };
  L.startRecording = function () {
    if (!L.canRecord()) return false;
    var types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'], mt = '';
    for (var i = 0; i < types.length; i++) if (g.MediaRecorder.isTypeSupported && g.MediaRecorder.isTypeSupported(types[i])) { mt = types[i]; break; }
    var chunks = [];
    var rec;
    try {
      rec = mt ? new g.MediaRecorder(L.stream, { mimeType: mt }) : new g.MediaRecorder(L.stream);
    } catch (e) { return false; }
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      var blob = new Blob(chunks, { type: rec.mimeType || mt || 'audio/webm' });
      emit('recorded', { blob: blob, ext: /mp4/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm' });
    };
    try { rec.start(1000); } catch (e) { return false; }
    L.recorder = rec;
    return true;
  };
  L.stopRecording = function () { if (L.recorder && L.recorder.state !== 'inactive') L.recorder.stop(); L.recorder = null; };

  // Plugging something in or out: reopen the input so the new device is really the one being heard.
  var dcTimer = null;
  if (g.navigator && navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', function () {
      clearTimeout(dcTimer);
      dcTimer = setTimeout(function () {
        if (!L.running || (L.recorder && L.recorder.state !== 'inactive')) { emit('route', L.info); return; }
        L.start(L.wantId).then(function (i) { emit('route', i); }, function () { emit('route', L.info); });
      }, 900);
    });
  }

  CB.audio = L;
})(typeof window !== 'undefined' ? window : globalThis);
