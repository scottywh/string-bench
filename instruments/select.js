/* Picks the active instrument and tuning for this launch. Choices are remembered; changing either reloads the app so
   every module starts clean. Loaded after the instrument files, before chords.js.
   An instrument file may define `tunings` (each with tid, tname, open, strings, tuningName, chords, stageNames, songs);
   otherwise it is a single standard tuning described by the file itself. */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var R = CB.INSTRUMENTS, ids = ['guitar', 'mandolin', 'ukulele', 'banjo', 'cigarbox'].filter(function (i) { return R[i]; });
  function get(k) { try { return g.localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { g.localStorage.setItem(k, v); } catch (e) { } }

  function tuningsOf(base) {
    return base.tunings ? base.tunings.map(function (t) { return { id: t.tid, name: t.tname }; }) : [{ id: 'standard', name: base.tuningName }];
  }
  // Merge an instrument with one of its tunings into the flat object the rest of the app reads.
  CB.resolveInstrument = function (base, tid) {
    var o = {}, k;
    for (k in base) if (k !== 'tunings') o[k] = base[k];
    o.tuningList = tuningsOf(base);
    if (!base.tunings) { o.tuningId = 'standard'; return o; }
    var t = base.tunings.filter(function (x) { return x.tid === tid; })[0] || base.tunings[0];
    for (k in t) if (k !== 'tid' && k !== 'tname') o[k] = t[k];
    o.tuningId = t.tid; o.tuningLabel = t.tname;
    o.storeKey = base.storeKey + '.' + t.tid; // progress is kept per tuning, because the chord shapes differ
    return o;
  };

  var pick = get('stringbench.instrument');
  if (!R[pick]) pick = ids[0];
  CB.BRAND = 'String Bench';
  CB.instrumentIds = ids;
  CB.INSTRUMENT = CB.resolveInstrument(R[pick], get('stringbench.tuning.' + pick));

  CB.setInstrument = function (id) {
    if (!R[id] || id === CB.INSTRUMENT.id) return;
    set('stringbench.instrument', id);
    leave();
  };
  CB.setTuning = function (tid) {
    if (tid === CB.INSTRUMENT.tuningId) return;
    set('stringbench.tuning.' + CB.INSTRUMENT.id, tid);
    leave();
  };
  function leave() {
    try { if (CB.audio) CB.audio.stop(); } catch (e) { }
    g.location.hash = 'home';
    g.location.reload();
  }
})(typeof window !== 'undefined' ? window : globalThis);
