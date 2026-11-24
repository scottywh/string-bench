/* String Bench — chord library built from the instrument definition (CB.INSTRUMENT). Plain script, exposes CB.chords */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};

  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var I = CB.INSTRUMENT;
  if (!I) throw new Error('instrument.js must load before chords.js');
  var OPEN = I.open, NS = OPEN.length;
  var ROOT_PC = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  var STAGE_NAMES = I.stageNames;

  var list = [];
  var byId = {};

  I.chords.forEach(function (r) {
    var frets = (Array.isArray(r[2]) ? r[2] : r[2].split('')).map(function (c) { return c === 'x' ? -1 : parseInt(c, 10); });
    var fing = (Array.isArray(r[3]) ? r[3] : r[3].split('')).map(function (c) { return parseInt(c, 10); });
    var notes = [];
    for (var s = 0; s < NS; s++) if (frets[s] >= 0) notes.push(OPEN[s] + frets[s]);
    var pcs = [];
    notes.forEach(function (m) { var p = m % 12; if (pcs.indexOf(p) < 0) pcs.push(p); });
    var bassMidi = Math.min.apply(null, notes); // the lowest sounding note (on a re-entrant ukulele that is not the first string)
    var c = {
      id: r[0], root: r[1], rootPc: ROOT_PC[r[1]], frets: frets, fing: fing, stage: r[4], kind: r[5],
      notes: notes, pcs: pcs, bassPc: bassMidi % 12, fretStr: r[2]
    };
    list.push(c);
    byId[c.id] = c;
  });

  // How alike two chord shapes are: shared fretted spots and shared open strings.
  // Used to order cards so neighbours share anchor fingers.
  function similarity(a, b) {
    var A = byId[a], B = byId[b], sc = 0;
    if (!A || !B) return 0;
    for (var s = 0; s < NS; s++) {
      if (A.frets[s] === B.frets[s]) sc += (A.frets[s] > 0 ? 2 : (A.frets[s] === 0 ? 0.6 : 0.2));
      if (A.frets[s] > 0 && A.frets[s] === B.frets[s] && A.fing[s] === B.fing[s]) sc += 1;
    }
    return sc;
  }

  // Circle-of-fifths index of the root, used for colour
  function fifthsIndex(id) {
    var c = byId[id];
    return c ? (c.rootPc * 7) % 12 : 0;
  }

  function isMinorish(id) {
    return /^[A-G]#?(m|m7)$/.test(id);
  }

  // Public-domain / traditional progressions (chord shapes only, no lyrics), per instrument.
  var SONGS = I.songs;

  CB.chords = {
    list: list, byId: byId, STAGE_NAMES: STAGE_NAMES, NOTE_NAMES: NOTE_NAMES, OPEN: OPEN, INSTR: I, STAGES: Object.keys(STAGE_NAMES).length,
    similarity: similarity, fifthsIndex: fifthsIndex, isMinorish: isMinorish, SONGS: SONGS,
    byStage: function (s) { return list.filter(function (c) { return c.stage === s; }); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = CB.chords;
})(typeof window !== 'undefined' ? window : globalThis);
