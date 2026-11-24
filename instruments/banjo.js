/* Banjo instrument definition (5-string, open G). Loaded before chords.js. */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  (CB.INSTRUMENTS = CB.INSTRUMENTS || {}).banjo = {
    id: 'banjo', name: 'Banjo', app: 'Banjo', folder: 'String Bench', storeKey: 'banjobench.v1', accentName: 'teal',
    accent: { light: ['#0b6f7e', '#ffffff', '#cfe9ee'], dark: ['#35c4d6', '#021a1e', '#0f3138'] },
    // Standard 5-string bluegrass tuning gDGBD. Strings are listed 4th, 3rd, 2nd, 1st, then the short high drone (5th),
    // which sits above the 1st string in pitch, so the lowest note is not the last string.
    open: [50, 55, 59, 62, 67], // D3 G3 B3 D4 g4
    strings: [
      { name: 'D', oct: 3, f: 146.83, midi: 50 }, { name: 'G', oct: 3, f: 196.0, midi: 55 },
      { name: 'B', oct: 3, f: 246.94, midi: 59 }, { name: 'D', oct: 4, f: 293.66, midi: 62 },
      { name: 'g', oct: 4, f: 392.0, midi: 67 }
    ],
    unit: 'string', paired: false, tuningName: 'open G (gDGBD)',
    lo: 120, hi: 2600, bassLo: 120, bassHi: 280, lowMax: 1000, extraMin: 0.2, tunerMin: 120, tunerMax: 520,
    android: {},
    // id, root, frets (4th 3rd 2nd 1st 5th; x = not played), fingers, stage, kind. The 5th string is left out (x) when it would clash.
    chords: [
      ['G',     'G', '00000', '00000', 1, 'major'],
      ['C',     'C', '20120', '20120', 1, 'major'],
      ['D',     'D', '0234x', '0123x', 1, 'major'],
      ['D7',    'D', '0214x', '0213x', 1, 'dominant 7'],
      ['Em',    'E', '20020', '10020', 1, 'minor'],

      ['Am',    'A', '2212x', '2314x', 2, 'minor'],
      ['F',     'F', '3213x', '4213x', 2, 'major'],
      ['A',     'A', '2222x', '1111x', 2, 'major'],
      ['E',     'E', '2102x', '3102x', 2, 'major'],
      ['G7',    'G', '00030', '00030', 2, 'dominant 7'],
      ['C7',    'C', '23120', '24130', 2, 'dominant 7'],

      ['Gsus4', 'G', '00100', '00100', 3, 'suspended 4'],
      ['Dsus4', 'D', '0235x', '0124x', 3, 'suspended 4'],
      ['Bm',    'B', '4434x', '3121x', 3, 'minor']
    ],
    stageNames: { 1: 'First five', 2: 'More open chords', 3: 'Sus and barre' },
    songs: [
      { id: 'circle', title: 'Will the Circle Be Unbroken', note: 'Traditional. Three chords: G, C, D.',
        bars: [['G'], ['G'], ['C'], ['G'], ['G'], ['G'], ['D'], ['D'], ['G'], ['G'], ['C'], ['G'], ['G'], ['D'], ['G'], ['G']] },
      { id: 'oh-susanna', title: 'Oh! Susanna', note: 'Traditional, in G. Three chords: G, C, D7.',
        bars: [['G'], ['G'], ['C'], ['G'], ['G'], ['D7'], ['G'], ['G'], ['G'], ['G'], ['C'], ['G'], ['D7'], ['D7'], ['G'], ['G']] },
      { id: 'amazing-grace', title: 'Amazing Grace', note: 'Traditional hymn, simple G, C, D version.',
        bars: [['G'], ['G'], ['C'], ['G'], ['G'], ['Em'], ['D'], ['D'], ['G'], ['G'], ['C'], ['G'], ['Em'], ['D'], ['G'], ['G']] },
      { id: 'red-river', title: 'Red River Valley', note: 'Traditional, in G. G, C and D7.',
        bars: [['G'], ['G'], ['C'], ['G'], ['G'], ['D7'], ['D7'], ['G'], ['G'], ['G'], ['C'], ['G'], ['G'], ['D7'], ['G'], ['G']] },
      { id: 'blues-g', title: '12-bar blues in G', note: 'A form, not a song. Uses G7, C7 and D7.',
        bars: [['G7'], ['G7'], ['G7'], ['G7'], ['C7'], ['C7'], ['G7'], ['G7'], ['D7'], ['C7'], ['G7'], ['D7']] }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
