/* Mandolin instrument definition: tuning, chord shapes, songs, detector ranges. Loaded before chords.js. */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};
  var I = (CB.INSTRUMENTS = CB.INSTRUMENTS || {})['mandolin'] = {
    id: 'mandolin', name: 'Mandolin', app: 'Mandolin Bench', folder: 'Mandolin Bench', storeKey: 'mandolinbench.v1', accentName: 'blue', accent: { light: ['#2f55c4', '#ffffff', '#d6e0f7'], dark: ['#7aa7ff', '#07122b', '#1a2745'] },
    open: [55, 62, 69, 76], // G3 D4 A4 E5: four courses (pairs of strings tuned alike), low course first
    strings: [
      { name: 'G', oct: 3, f: 196.0, midi: 55 }, { name: 'D', oct: 4, f: 293.66, midi: 62 },
      { name: 'A', oct: 4, f: 440.0, midi: 69 }, { name: 'E', oct: 5, f: 659.26, midi: 76 }
    ],
    unit: 'course', paired: true, tuningName: 'standard GDAE',
    lo: 170, hi: 2600, bassLo: 170, bassHi: 330, lowMax: 950, extraMin: 0.2, tunerMin: 170, tunerMax: 760,
    android: { package: 'com.chordbench.mandolin', versionCode: 2, versionName: '1.1.0' },
    chords: [
        ['G',     'G', '0023', '0012', 1, 'major'],
        ['C',     'C', '0230', '0120', 1, 'major'],
        ['D',     'D', '2002', '1002', 1, 'major'],
        ['A',     'A', '2245', '1134', 1, 'major'],
        ['Em',    'E', '0220', '0120', 1, 'minor'],
    
        ['Am',    'A', '2230', '1130', 2, 'minor'],
        ['Dm',    'D', '2001', '2001', 2, 'minor'],
        ['E',     'E', '1220', '1230', 2, 'major'],
        ['G7',    'G', '0021', '0021', 2, 'dominant 7'],
        ['D7',    'D', '2032', '1032', 2, 'dominant 7'],
        ['A7',    'A', '2243', '1143', 2, 'dominant 7'],
    
        ['Gsus4', 'G', '0033', '0034', 3, 'suspended 4'],
        ['Dsus4', 'D', '2003', '1003', 3, 'suspended 4'],
        ['Asus2', 'A', '2220', '1110', 3, 'suspended 2'],
        ['Dsus2', 'D', '2000', '1000', 3, 'suspended 2'],
        ['Cadd9', 'C', '0030', '0020', 3, 'add 9'],
        ['Am7',   'A', '2233', '1134', 3, 'minor 7'],
        ['Em7',   'E', '0020', '0010', 3, 'minor 7'],
    
        ['Gmaj7', 'G', '0022', '0011', 4, 'major 7'],
        ['Dmaj7', 'D', '2042', '1042', 4, 'major 7'],
        ['Amaj7', 'A', '2244', '1133', 4, 'major 7'],
        ['C7',    'C', '3233', '2134', 4, 'dominant 7'],
        ['E7',    'E', '1020', '1020', 4, 'dominant 7'],
    
        ['F',     'F', '2331', '2341', 5, 'moveable'],
        ['Bb',    'A#', '3011', '3011', 5, 'moveable'],
        ['Gm',    'G', '0013', '0013', 5, 'minor'],
        ['Bm',    'B', '4452', '3341', 5, 'moveable']
      ],
    stageNames: {
        1: 'First five',
        2: 'Minors and open 7ths',
        3: 'Sus and add chords',
        4: 'Color chords',
        5: 'Moveable shapes'
      },
    songs: [
        {
          id: 'blues-g', title: '12-bar blues in G', note: 'A form, not a song. Uses G7, C7 and D7.',
          bars: [['G7'], ['G7'], ['G7'], ['G7'], ['C7'], ['C7'], ['G7'], ['G7'], ['D7'], ['C7'], ['G7'], ['D7']]
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
          id: 'circle', title: 'Will the Circle Be Unbroken', note: 'Traditional. Three chords: G, C, D.',
          bars: [['G'], ['G'], ['C'], ['G'], ['G'], ['G'], ['D'], ['D'], ['G'], ['G'], ['C'], ['G'], ['G'], ['D'], ['G'], ['G']]
        },
        {
          id: 'rising-sun', title: 'House of the Rising Sun', note: 'Traditional. Needs the F shape (stage 5).',
          bars: [['Am'], ['C'], ['D'], ['F'], ['Am'], ['C'], ['E'], ['E'], ['Am'], ['C'], ['D'], ['F'], ['Am'], ['E'], ['Am'], ['E']]
        },
        {
          id: 'oh-susanna', title: 'Oh! Susanna', note: 'Traditional, in G. Three chords: G, C, D7.',
          bars: [['G'], ['G'], ['C'], ['G'], ['G'], ['D7'], ['G'], ['G'], ['G'], ['G'], ['C'], ['G'], ['D7'], ['D7'], ['G'], ['G']]
        },
        {
          id: 'red-river', title: 'Red River Valley', note: 'Traditional, in D. Two chords, D and A7.',
          bars: [['D'], ['D'], ['D'], ['A7'], ['A7'], ['A7'], ['D'], ['D'], ['D'], ['D'], ['A7'], ['A7'], ['A7'], ['A7'], ['D'], ['D']]
        },
        {
          id: 'scarborough', title: 'Scarborough Fair', note: 'Traditional, in E minor.',
          bars: [['Em'], ['Em'], ['D'], ['Em'], ['G'], ['A'], ['Em'], ['D', 'Em']]
        }
      ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
