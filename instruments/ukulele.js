/* Ukulele instrument definition: tuning, chord shapes, songs, detector ranges. Loaded before chords.js. */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var I = (CB.INSTRUMENTS = CB.INSTRUMENTS || {})['ukulele'] = {
    id: 'ukulele', name: 'Ukulele', app: 'Ukulele Bench', folder: 'Ukulele Bench', storeKey: 'ukulelebench.v1', accentName: 'violet', accent: { light: ['#7c3aed', '#ffffff', '#e6dcfb'], dark: ['#b79cff', '#140a2e', '#2a1f4d'] },
    // Standard soprano/concert/tenor tuning GCEA, high G (re-entrant): the G string is NOT the lowest note.
    open: [67, 60, 64, 69], // G4 C4 E4 A4, in the order the strings sit on the neck
    strings: [
      { name: 'G', oct: 4, f: 392.0, midi: 67 }, { name: 'C', oct: 4, f: 261.63, midi: 60 },
      { name: 'E', oct: 4, f: 329.63, midi: 64 }, { name: 'A', oct: 4, f: 440.0, midi: 69 }
    ],
    unit: 'string', paired: false, tuningName: 'standard GCEA (high G)',
    lo: 200, hi: 2400, bassLo: 240, bassHi: 480, lowMax: 1000, extraMin: 0.2, tunerMin: 200, tunerMax: 560,
    android: { package: 'com.chordbench.ukulele', versionCode: 1, versionName: '1.0.0' },
    // id, root, frets (G C E A, x = muted), fingers (0 = none), stage, plain-English kind
    chords: [
      ['C',     'C', '0003', '0003', 1, 'major'],
      ['Am',    'A', '2000', '2000', 1, 'minor'],
      ['F',     'F', '2010', '2010', 1, 'major'],
      ['G',     'G', '0232', '0132', 1, 'major'],
      ['G7',    'G', '0212', '0213', 1, 'dominant 7'],

      ['Dm',    'D', '2210', '2310', 2, 'minor'],
      ['Em',    'E', '0432', '0321', 2, 'minor'],
      ['A',     'A', '2100', '2100', 2, 'major'],
      ['D',     'D', '2220', '1110', 2, 'major'],
      ['C7',    'C', '0001', '0001', 2, 'dominant 7'],

      ['A7',    'A', '0100', '0100', 3, 'dominant 7'],
      ['D7',    'D', '2223', '1113', 3, 'dominant 7'],
      ['E7',    'E', '1202', '1203', 3, 'dominant 7'],
      ['Dm7',   'D', '2213', '2314', 3, 'minor 7'],
      ['Cmaj7', 'C', '0002', '0001', 3, 'major 7'],
      ['Asus4', 'A', '2200', '1200', 3, 'suspended 4'],
      ['Dsus4', 'D', '0230', '0130', 3, 'suspended 4'],

      ['E',     'E', '4442', '3331', 4, 'major'],
      ['Bm',    'B', '4222', '3111', 4, 'minor'],
      ['Bb',    'A#', '3211', '3211', 4, 'major'],
      ['Gm',    'G', '0231', '0231', 4, 'minor'],
      ['Cm',    'C', '0333', '0111', 4, 'minor'],
      ['Fm',    'F', '1013', '1023', 4, 'minor']
    ],
    stageNames: {
      1: 'First five',
      2: 'More open chords',
      3: 'Sevenths and sus',
      4: 'Barre and minor shapes'
    },
    songs: [
      {
        id: 'loop-c', title: 'Four-chord loop in C', note: 'The classic C, Am, F, G7 turnaround behind a thousand songs.',
        bars: [['C'], ['Am'], ['F'], ['G7'], ['C'], ['Am'], ['F'], ['G7']]
      },
      {
        id: 'blues-c', title: '12-bar blues in C', note: 'A form, not a song. Uses C7, F and G7.',
        bars: [['C7'], ['C7'], ['C7'], ['C7'], ['F'], ['F'], ['C7'], ['C7'], ['G7'], ['F'], ['C7'], ['G7']]
      },
      {
        id: 'amazing-grace', title: 'Amazing Grace', note: 'Traditional hymn, simple C, F, G7 version.',
        bars: [['C'], ['C'], ['F'], ['C'], ['C'], ['Am'], ['G7'], ['G7'], ['C'], ['C'], ['F'], ['C'], ['Am'], ['G7'], ['C'], ['C']]
      },
      {
        id: 'oh-susanna', title: 'Oh! Susanna', note: 'Traditional, in C. Three chords: C, F, G7.',
        bars: [['C'], ['C'], ['F'], ['C'], ['C'], ['G7'], ['C'], ['C'], ['C'], ['C'], ['F'], ['C'], ['G7'], ['G7'], ['C'], ['C']]
      },
      {
        id: 'down-valley', title: 'Down in the Valley', note: 'Traditional, in C. Just C and G7.',
        bars: [['C'], ['C'], ['G7'], ['G7'], ['G7'], ['G7'], ['C'], ['C']]
      },
      {
        id: 'scarborough', title: 'Scarborough Fair', note: 'Traditional, in A minor. Needs D (stage 2).',
        bars: [['Am'], ['Am'], ['G'], ['Am'], ['C'], ['D'], ['Am'], ['G', 'Am']]
      }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
