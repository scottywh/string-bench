/* 3-string cigar box guitar. Three selectable open tunings. Loaded before chords.js.
   In an open tuning one fret across all three strings is a chord (root + fifth), so a "chord" here is a fret number,
   played with a slide or a barre. With only a root and fifth there is no major or minor, so they are named G5, C5, D5. */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  var SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var STAGE_FRETS = { 1: [0, 5, 7], 2: [3, 10], 3: [2, 9, 4], 4: [1, 6, 8, 11] }; // I-IV-V first, then the blues extras
  var FN = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  var NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  function tuning(tid, tname, notes) {
    var chords = [], role = { 0: 'I (open strings)', 5: 'IV', 7: 'V', 10: 'bVII', 3: 'bIII' };
    Object.keys(STAGE_FRETS).forEach(function (st) {
      STAGE_FRETS[st].forEach(function (fr) {
        var pc = (notes[0] + fr) % 12, id = FLAT[pc] + '5';
        chords.push([id, SHARP[pc], [fr, fr, fr], fr ? [1, 1, 1] : [0, 0, 0], +st,
          (fr ? 'slide or barre, fret ' + fr : 'open strings') + (role[fr] ? ' · ' + role[fr] : '')]);
      });
    });
    function id(fr) { return FLAT[(notes[0] + fr) % 12] + '5'; }
    var I = id(0), IV = id(5), V = id(7), bVII = id(10);
    return {
      tid: tid, tname: tname, open: notes,
      strings: notes.map(function (m) { return { name: NAME[m % 12], oct: Math.floor(m / 12) - 1, f: +FN(m).toFixed(2), midi: m }; }),
      tuningName: tname + ' (' + notes.map(function (m) { return NAME[m % 12]; }).join(' ') + ')',
      chords: chords,
      stageNames: { 1: 'I, IV and V', 2: 'Blues extras', 3: 'Passing chords', 4: 'The rest of the neck' },
      songs: [
        { id: 'blues12', title: '12-bar blues in ' + FLAT[notes[0] % 12], note: 'A form, not a song. Slide or barre one fret: ' + I + ' open, ' + IV + ' at fret 5, ' + V + ' at fret 7.',
          bars: [[I], [I], [I], [I], [IV], [IV], [I], [I], [V], [IV], [I], [V]] },
        { id: 'blues8', title: '8-bar blues in ' + FLAT[notes[0] % 12], note: 'Shorter form, same three positions.',
          bars: [[I], [V], [IV], [IV], [I], [V], [I], [V]] },
        { id: 'hill', title: 'Hill-country vamp', note: 'Mostly the open strings with a drop to ' + bVII + ' (fret 10), the one-chord feel of north Mississippi.',
          bars: [[I], [I], [I], [bVII], [I], [I], [I], [bVII]] }
      ]
    };
  }

  (CB.INSTRUMENTS = CB.INSTRUMENTS || {}).cigarbox = {
    id: 'cigarbox', name: 'Cigar box', app: 'Cigar box guitar', folder: 'String Bench', storeKey: 'cigarbox.v1', accentName: 'red',
    accent: { light: ['#b42318', '#ffffff', '#f6d5d1'], dark: ['#ff7a6b', '#2a0a07', '#3d1a16'] },
    unit: 'string', paired: false,
    lo: 60, hi: 2400, bassLo: 60, bassHi: 330, lowMax: 900, extraMin: 0.35, tunerMin: 60, tunerMax: 520,
    android: {},
    tunings: [
      tuning('openG', 'Open G', [43, 50, 55]),   // G2 D3 G3
      tuning('openD', 'Open D', [50, 57, 62]),   // D3 A3 D4
      tuning('openA', 'Open A', [45, 52, 57])    // A2 E3 A3
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
