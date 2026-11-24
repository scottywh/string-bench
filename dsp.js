/* String Bench — signal analysis: spectrum to chroma, chord matching, single-note pitch (YIN) */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var DSP = {};

  DSP.rms = function (buf, from, to) {
    var s = 0, n = 0;
    from = Math.max(0, from | 0); to = Math.min(buf.length, to | 0);
    for (var i = from; i < to; i++) { s += buf[i] * buf[i]; n++; }
    return n ? Math.sqrt(s / n) : 0;
  };

  // db: Float32Array of dB magnitudes from an AnalyserNode (length fftSize/2).
  // Returns a 12-bin chroma (not normalised) and the pitch class of the lowest strong partial.
  DSP.analyze = function (db, sr, fftSize, o) {
    o = o || {};
    var I = (CB.chords && CB.chords.INSTR) || {};   // per-instrument ranges, see chords.js
    var binHz = sr / fftSize, n = db.length;
    var lo = Math.max(2, Math.floor((o.lo || I.lo || 70) / binHz));
    var hi = Math.min(n - 2, Math.ceil((o.hi || I.hi || 1800) / binHz));
    var bassLo = I.bassLo || 70, bassHi = I.bassHi || 300, lowMax = I.lowMax || 450;
    var maxDb = -200, i;
    for (i = lo; i <= hi; i++) if (db[i] > maxDb) maxDb = db[i];
    var chroma = new Float32Array(12), low = new Float32Array(12);
    var res = { maxDb: maxDb, chroma: chroma, low: low, bass: -1, bassHz: 0, peaks: 0 };
    if (!(maxDb > (o.floorDb !== undefined ? o.floorDb : -100))) return res;
    var thr = maxDb - (o.relDb || 32);
    var bassHz = 0, bassW = 0;
    for (i = lo; i <= hi; i++) {
      var c = db[i];
      if (c < thr) continue;
      var l = db[i - 1], r = db[i + 1];
      if (!(c > l && c >= r)) continue;
      var d = l - 2 * c + r;
      var p = d !== 0 ? 0.5 * (l - r) / d : 0;
      if (p > 0.5) p = 0.5; else if (p < -0.5) p = -0.5;
      var f = (i + p) * binHz;
      var pk = c - 0.25 * (l - r) * p;
      var rel = Math.pow(10, (pk - maxDb) / 20); // linear amplitude relative to the loudest partial
      var midi = 69 + 12 * Math.log2(f / 440);
      var nn = Math.round(midi);
      var dev = Math.abs(midi - nn);
      var w = Math.pow(rel, 0.6);
      if (dev > 0.28) w *= 0.35;
      if (f > 1000) w *= 0.6;
      chroma[((nn % 12) + 12) % 12] += w;
      if (f <= lowMax) low[((nn % 12) + 12) % 12] += w; // played fundamentals live here; overtones of low strings do not
      res.peaks++;
      if (f >= bassLo && f <= bassHi && rel >= 0.12 && (bassHz === 0 || f < bassHz)) { bassHz = f; bassW = rel; }
    }
    if (bassHz) {
      res.bassHz = bassHz;
      res.bass = (((Math.round(69 + 12 * Math.log2(bassHz / 440))) % 12) + 12) % 12;
    }
    return res;
  };

  // Expected chroma of a chord voicing, including the first few harmonics of each string
  DSP.makeCandidates = function (chords) {
    return chords.map(function (ch) {
      var t = new Float32Array(12), k;
      ch.notes.forEach(function (m) {
        t[m % 12] += 1.0;
        t[m % 12] += 0.45;         // 2nd harmonic, same pitch class
        t[(m + 19) % 12] += 0.30;  // 3rd harmonic: a fifth above the octave
        t[m % 12] += 0.20;         // 4th harmonic
        t[(m + 28) % 12] += 0.15;  // 5th harmonic: a major third
      });
      var s = 0;
      for (k = 0; k < 12; k++) s += t[k] * t[k];
      s = Math.sqrt(s);
      for (k = 0; k < 12; k++) t[k] /= s;
      var key = ch.pcs.slice().sort(function (a, b) { return a - b; }).join(',');
      return { id: ch.id, tpl: t, pcs: ch.pcs, bassPc: ch.bassPc, key: key };
    }).map(function (cd, i, all) {
      // If a simpler chord is this one minus a single note (E is E7 minus D), remember which note is the extra.
      all.forEach(function (b) {
        if (cd.extra !== undefined || b === cd || b.bassPc !== cd.bassPc || b.pcs.length !== cd.pcs.length - 1) return;
        var miss = cd.pcs.filter(function (p) { return b.pcs.indexOf(p) < 0; });
        if (miss.length === 1 && b.pcs.every(function (p) { return cd.pcs.indexOf(p) >= 0; })) { cd.extra = miss[0]; cd.baseId = b.id; }
      });
      return cd;
    });
  };

  // Compare an observed chroma against the candidate chords.
  // Returns {ok, id, score, margin, second}. 'ok' means confident enough to show.
  DSP.classify = function (chroma, bassPc, cands, o) {
    o = o || {};
    var minScore = o.minScore !== undefined ? o.minScore : 0.80;
    var minMargin = o.minMargin !== undefined ? o.minMargin : 0.025;
    var k, e = 0;
    for (k = 0; k < 12; k++) e += chroma[k] * chroma[k];
    e = Math.sqrt(e);
    if (e < 1e-6) return { ok: false, id: null, score: 0, margin: 0 };
    var scored = [];
    for (var ci = 0; ci < cands.length; ci++) {
      var cd = cands[ci], dot = 0;
      for (k = 0; k < 12; k++) dot += chroma[k] * cd.tpl[k];
      var sc = dot / e;
      if (cd.extra !== undefined && o.low) {
        // An added note (7th, add9...) must be heard as a real low/mid note, or the plain chord is the better call.
        var ref = 0;
        for (k = 0; k < cd.pcs.length; k++) if (cd.pcs[k] !== cd.extra) ref += o.low[cd.pcs[k]];
        ref /= (cd.pcs.length - 1);
        if (!(o.low[cd.extra] >= (o.extraMin !== undefined ? o.extraMin : ((CB.chords && CB.chords.INSTR && CB.chords.INSTR.extraMin) || 0.35)) * ref)) sc -= 0.15;
      }
      if (bassPc >= 0) {
        if (bassPc === cd.bassPc) sc += 0.06;
        else if (cd.pcs.indexOf(bassPc) < 0) sc -= 0.07;
      }
      scored.push({ id: cd.id, key: cd.key, score: sc });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    var best = scored[0], second = null;
    for (var j = 1; j < scored.length; j++) { if (scored[j].key !== best.key) { second = scored[j]; break; } }
    var margin = second ? best.score - second.score : 1;
    return {
      ok: best.score >= minScore && margin >= minMargin,
      id: best.id, score: best.score, margin: margin, second: second ? second.id : null
    };
  };

  // YIN pitch estimate for a single plucked string. buf = time-domain samples.
  DSP.yin = function (buf, sr, minF, maxF, thr) {
    minF = minF || 60; maxF = maxF || 460; thr = thr || 0.15;
    var maxTau = Math.floor(sr / minF), minTau = Math.max(2, Math.floor(sr / maxF));
    var W = Math.min(2048, buf.length - maxTau - 1);
    if (W < 512) return null;
    var start = buf.length - W - maxTau - 1;
    var d = new Float32Array(maxTau + 1), tau, j;
    for (tau = 1; tau <= maxTau; tau++) {
      var s = 0;
      for (j = 0; j < W; j++) { var x = buf[start + j] - buf[start + j + tau]; s += x * x; }
      d[tau] = s;
    }
    var cm = new Float32Array(maxTau + 1), run = 0;
    cm[0] = 1;
    for (tau = 1; tau <= maxTau; tau++) { run += d[tau]; cm[tau] = run > 0 ? d[tau] * tau / run : 1; }
    var best = -1;
    for (tau = minTau; tau < maxTau; tau++) {
      if (cm[tau] < thr) {
        while (tau + 1 < maxTau && cm[tau + 1] < cm[tau]) tau++;
        best = tau; break;
      }
    }
    if (best < 0) {
      var mv = 1;
      for (tau = minTau; tau < maxTau; tau++) if (cm[tau] < mv) { mv = cm[tau]; best = tau; }
      if (mv > 0.3) return null;
    }
    var a = cm[best - 1], b = cm[best], c = cm[best + 1], den = a - 2 * b + c;
    var off = den !== 0 ? 0.5 * (a - c) / den : 0;
    var T = best + (off > 1 ? 1 : off < -1 ? -1 : off);
    return { f: sr / T, clarity: 1 - cm[best] };
  };

  DSP.freqToNote = function (f) {
    var m = 69 + 12 * Math.log2(f / 440), n = Math.round(m);
    return { midi: n, cents: (m - n) * 100 };
  };

  CB.dsp = DSP;
  if (typeof module !== 'undefined' && module.exports) module.exports = DSP;
})(typeof window !== 'undefined' ? window : globalThis);
