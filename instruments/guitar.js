/* Guitar instrument definition: tuning, chord shapes, songs, detector ranges. Loaded before chords.js. */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var I = (CB.INSTRUMENTS = CB.INSTRUMENTS || {})['guitar'] = {
    id: 'guitar', name: 'Guitar', app: 'Chord Bench', folder: 'Chord Bench', storeKey: 'chordbench.v1', accentName: 'amber',
    open: [40, 45, 50, 55, 59, 64], // E2 A2 D3 G3 B3 E4, low string first
    strings: [
      { name: 'E', oct: 2, f: 82.41, midi: 40 }, { name: 'A', oct: 2, f: 110.0, midi: 45 },
      { name: 'D', oct: 3, f: 146.83, midi: 50 }, { name: 'G', oct: 3, f: 196.0, midi: 55 },
      { name: 'B', oct: 3, f: 246.94, midi: 59 }, { name: 'E', oct: 4, f: 329.63, midi: 64 }
    ],
    unit: 'string', paired: false, tuningName: 'standard EADGBE',
    lo: 70, hi: 1800, bassLo: 70, bassHi: 300, lowMax: 450, extraMin: 0.35, tunerMin: 60, tunerMax: 460,
    android: { package: 'com.chordbench.app', versionCode: 4, versionName: '1.1.0' },
    // id, root, frets (low string first, x = muted), fingers (0 = none), stage, plain-English kind
    chords: [
        ['A',     'A', 'x02220', '001230', 1, 'major'],
        ['D',     'D', 'xx0232', '000132', 1, 'major'],
        ['E',     'E', '022100', '023100', 1, 'major'],
        ['Am',    'A', 'x02210', '002310', 1, 'minor'],
        ['Em',    'E', '022000', '023000', 1, 'minor'],
    
        ['A7',    'A', 'x02020', '001020', 2, 'dominant 7'],
        ['E7',    'E', '020100', '020100', 2, 'dominant 7'],
        ['D7',    'D', 'xx0212', '000213', 2, 'dominant 7'],
        ['Dm',    'D', 'xx0231', '000231', 2, 'minor'],
        ['C',     'C', 'x32010', '032010', 2, 'major'],
        ['G',     'G', '320003', '210003', 2, 'major'],
    
        ['Asus2', 'A', 'x02200', '001200', 3, 'suspended 2'],
        ['Asus4', 'A', 'x02230', '001230', 3, 'suspended 4'],
        ['Dsus2', 'D', 'xx0230', '000120', 3, 'suspended 2'],
        ['Dsus4', 'D', 'xx0233', '000123', 3, 'suspended 4'],
        ['Esus4', 'E', '022200', '012300', 3, 'suspended 4'],
        ['Cadd9', 'C', 'x32030', '021030', 3, 'add 9'],
        ['Am7',   'A', 'x02010', '002010', 3, 'minor 7'],
        ['Em7',   'E', '022030', '012030', 3, 'minor 7'],
    
        ['Dmaj7', 'D', 'xx0222', '000123', 4, 'major 7'],
        ['Amaj7', 'A', 'x02120', '002130', 4, 'major 7'],
        ['D/F#',  'D', '200232', '100243', 4, 'D over F#'],
        ['G7',    'G', '320001', '320001', 4, 'dominant 7'],
        ['C7',    'C', 'x32310', '032410', 4, 'dominant 7'],
        ['B7',    'B', 'x21202', '021304', 4, 'dominant 7'],
        ['Fmaj7', 'F', 'xx3210', '003210', 4, 'major 7'],
    
        ['F',     'F', '133211', '134211', 5, 'barre'],
        ['Bm',    'B', 'x24432', '013421', 5, 'barre']
      ],
    stageNames: {
        1: 'First five',
        2: 'Open 7ths and friends',
        3: 'Sus and add chords',
        4: 'Color chords',
        5: 'Barre chords'
      },
    songs: [
        {
          id: 'blues-a', title: '12-bar blues in A', note: 'A form, not a song. Uses A7, D7 and E7.',
          bars: [['A7'], ['A7'], ['A7'], ['A7'], ['D7'], ['D7'], ['A7'], ['A7'], ['E7'], ['D7'], ['A7'], ['E7']]
        },
        {
          id: 'chair-loop', title: 'Chair repair loop', note: 'Your own loop from the song fragment: A, Asus2, D, E7, with a G turnaround.',
          bars: [['A'], ['Asus2'], ['D'], ['E7'], ['A'], ['Asus2'], ['D'], ['E7'], ['A'], ['D'], ['G'], ['A']]
        },
        {
          id: 'amazing-grace', title: 'Amazing Grace', note: 'Traditional hymn, simple G, C, D version.',
          bars: [['G'], ['G'], ['C'], ['G'], ['G'], ['Em'], ['D'], ['D'], ['G'], ['G'], ['C'], ['G'], ['Em'], ['D'], ['G'], ['G']]
        },
        {
          id: 'rising-sun', title: 'House of the Rising Sun', note: 'Traditional. Needs the F barre chord (stage 5).',
          bars: [['Am'], ['C'], ['D'], ['F'], ['Am'], ['C'], ['E'], ['E'], ['Am'], ['C'], ['D'], ['F'], ['Am'], ['E'], ['Am'], ['E']]
        },
        {
          id: 'oh-susanna', title: 'Oh! Susanna', note: 'Traditional, in D. Three chords: D, G, A7.',
          bars: [['D'], ['D'], ['G'], ['D'], ['D'], ['A7'], ['D'], ['D'], ['D'], ['D'], ['G'], ['D'], ['A7'], ['A7'], ['D'], ['D']]
        },
        {
          id: 'down-valley', title: 'Down in the Valley', note: 'Traditional, in G. Just G and D7.',
          bars: [['G'], ['G'], ['D7'], ['D7'], ['D7'], ['D7'], ['G'], ['G']]
        },
        {
          id: 'scarborough', title: 'Scarborough Fair', note: 'Traditional, in A minor.',
          bars: [['Am'], ['Am'], ['G'], ['Am'], ['C'], ['D'], ['Am'], ['G', 'Am']]
        }
      ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
