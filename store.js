/* String Bench — local storage, chord status rules, export/import */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var CH = CB.chords;
  var II = CB.INSTRUMENT, KEY = II.storeKey;

  function defaults() {
    return {
      v: 1, instrument: II.id, tuning: II.tuningId,
      settings: {
        theme: 'auto', left: false, orient: 'auto', namesOnly: false,
        needed: 3, beginner: true, knownMix: 40, preset: 5, visual: 'random',
        deviceId: '', sens: 0, unlockAll: false, cardTimeout: 20
      },
      chords: {},   // id -> {status, recent[], plays, hits, ms[], last}
      pairs: {},    // 'A>D' -> {n, ms[]}
      sessions: [], // practice / routine / test summaries
      jams: [],     // jam summaries
      charts: []    // chord charts built from pasted text: {id, name, created, text, sections, steps, warnings, stats, meta}
    };
  }

  var data = defaults();
  var memOnly = false;
  var timer = null;

  function load() {
    try {
      var raw = g.localStorage.getItem(KEY);
      if (raw) merge(JSON.parse(raw));
    } catch (e) { memOnly = true; }
  }
  function merge(d) {
    if (!d || typeof d !== 'object') return false;
    var base = defaults();
    if (d.settings) for (var k in base.settings) if (d.settings[k] !== undefined) base.settings[k] = d.settings[k];
    if (d.chords && typeof d.chords === 'object') base.chords = d.chords;
    if (d.pairs && typeof d.pairs === 'object') base.pairs = d.pairs;
    if (Array.isArray(d.sessions)) base.sessions = d.sessions.slice(-300);
    if (Array.isArray(d.jams)) base.jams = d.jams.slice(-60);
    if (Array.isArray(d.charts)) base.charts = d.charts.slice(-20);
    data = base;
    return true;
  }
  function save() {
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      try { g.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { memOnly = true; }
    }, 250);
  }
  function saveNow() {
    if (timer) { clearTimeout(timer); timer = null; }
    try { g.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { memOnly = true; }
  }

  function median(a) {
    if (!a || !a.length) return 0;
    var b = a.slice().sort(function (x, y) { return x - y; });
    var m = b.length >> 1;
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  }

  var S = {
    get: function () { return data; },
    settings: function () { return data.settings; },
    isMemOnly: function () { return memOnly; },
    save: save, saveNow: saveNow, load: load, median: median,

    chord: function (id) {
      var c = data.chords[id];
      if (!c) c = data.chords[id] = { status: 'unknown', recent: [], plays: 0, hits: 0, ms: [], last: 0 };
      return c;
    },
    status: function (id) { var c = data.chords[id]; return c ? c.status : 'unknown'; },
    setStatus: function (id, st) { S.chord(id).status = st; save(); },

    // hit = true / false, ms = time to the first correct play for a hit
    recordResult: function (id, hit, ms) {
      var c = S.chord(id);
      c.plays++; if (hit) c.hits++;
      c.recent.push(hit ? 1 : 0); if (c.recent.length > 10) c.recent.shift();
      if (hit && ms > 0) { c.ms.push(Math.round(ms)); if (c.ms.length > 20) c.ms.shift(); }
      c.last = Date.now();
      var r = c.recent, last8 = r.slice(-8), rate = last8.length ? last8.reduce(function (a, b) { return a + b; }, 0) / last8.length : 0;
      if (c.status === 'known' && last8.length >= 6 && rate < 0.5) c.status = 'learning';
      else if (c.status !== 'known' && last8.length >= 8 && rate >= 0.85 && median(c.ms) < 6000) c.status = 'known';
      else if (c.status === 'unknown' && c.plays >= 1) c.status = 'learning';
      save();
    },
    recordPair: function (a, b, ms) {
      var k = a + '>' + b, p = data.pairs[k] || (data.pairs[k] = { n: 0, ms: [] });
      p.n++; if (ms > 0) { p.ms.push(Math.round(ms)); if (p.ms.length > 10) p.ms.shift(); }
      save();
    },

    stageUnlocked: function (n) {
      if (n <= 1 || data.settings.unlockAll) return true;
      var prev = CH.byStage(n - 1), known = prev.filter(function (c) { return S.status(c.id) === 'known'; }).length;
      return S.stageUnlocked(n - 1) && known >= Math.ceil(prev.length * 0.8);
    },
    pool: function () {
      return CH.list.filter(function (c) { return S.stageUnlocked(c.stage); });
    },
    knownIds: function () {
      return CH.list.filter(function (c) { return S.status(c.id) === 'known'; }).map(function (c) { return c.id; });
    },
    hitRate: function (id) {
      var c = data.chords[id];
      if (!c || !c.recent.length) return null;
      return c.recent.reduce(function (a, b) { return a + b; }, 0) / c.recent.length;
    },

    addSession: function (s) { data.sessions.push(s); if (data.sessions.length > 300) data.sessions.shift(); saveNow(); },
    addJam: function (j) { data.jams.push(j); if (data.jams.length > 60) data.jams.shift(); saveNow(); },
    addChart: function (c) {
      c.id = 'ch' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
      c.created = Date.now();
      data.charts.push(c); if (data.charts.length > 20) data.charts.shift(); saveNow();
      return c;
    },
    chartById: function (id) { return data.charts.filter(function (c) { return c.id === id; })[0] || null; },
    deleteChart: function (id) { data.charts = data.charts.filter(function (c) { return c.id !== id; }); saveNow(); },

    exportJSON: function () { return JSON.stringify(data, null, 1); },
    importJSON: function (text) {
      var d;
      try { d = JSON.parse(text); } catch (e) { return { ok: false, msg: 'That file is not valid JSON.' }; }
      if (!d || d.v !== 1 || !d.settings || (d.instrument || 'guitar') !== II.id || (d.tuning && d.tuning !== II.tuningId)) return { ok: false, msg: (d && d.instrument && d.settings && d.v === 1) ? 'That backup is for the ' + d.instrument + (d.tuning && d.tuning !== "standard" ? ' (' + d.tuning + ')' : '') + '. Switch to it on the Home screen first.' : 'That file is not a String Bench backup.' };
      merge(d); saveNow();
      return { ok: true, msg: 'Imported ' + data.sessions.length + ' sessions and ' + Object.keys(data.chords).length + ' chords.' };
    },
    exportCSV: function () {
      var q = function (v) { v = String(v === undefined || v === null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var out = ['# Practice sessions'];
      out.push(['date', 'mode', 'planned_min', 'actual_sec', 'cards', 'hits', 'changes_per_min', 'median_change_ms', 'first_try_pct', 'best_streak'].join(','));
      data.sessions.forEach(function (s) {
        out.push([new Date(s.t).toISOString(), s.mode, s.planned, Math.round(s.durMs / 1000), s.cards, s.hits,
          s.cpm !== undefined ? s.cpm.toFixed(1) : '', Math.round(s.medMs || 0), Math.round((s.firstTry || 0) * 100), s.streak || 0].map(q).join(','));
      });
      out.push(''); out.push('# Chord status');
      out.push(['chord', 'stage', 'status', 'plays', 'hits', 'recent_hit_rate_pct', 'median_ms'].join(','));
      CH.list.forEach(function (c) {
        var d = data.chords[c.id], r = S.hitRate(c.id);
        out.push([c.id, c.stage, d ? d.status : 'unknown', d ? d.plays : 0, d ? d.hits : 0, r === null ? '' : Math.round(r * 100), d ? Math.round(median(d.ms)) : ''].map(q).join(','));
      });
      out.push(''); out.push('# Jams');
      out.push(['date', 'minutes', 'top_chords'].join(','));
      data.jams.forEach(function (j) {
        var top = Object.keys(j.counts || {}).sort(function (a, b) { return j.counts[b] - j.counts[a]; }).slice(0, 6).join(' ');
        out.push([new Date(j.t).toISOString(), (j.durMs / 60000).toFixed(1), top].map(q).join(','));
      });
      return out.join('\n');
    },
    resetAll: function () { data = defaults(); saveNow(); }
  };

  CB.store = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
