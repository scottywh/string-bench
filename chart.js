/* String Bench — chord-chart parser.
   Reads the two-line chart format: chord symbols spaced over a lyric line,
   section headers (VERSE 1, BRIDGE, TAG ...), and directions in (brackets).
   A (bracketed) line on its own attaches to the next chord group; a bracketed
   bit on a chord line attaches to that group. Plain script, exposes CB.chart. */
(function (g) {
  'use strict';
  var CB = g.CB = g.CB || {};

  // One chord symbol: root, optional sharp/flat, optional quality, optional bass note.
  var CHORD_TOKEN = /^[A-G](#|b)?(maj7|maj9|maj|min|m7b5|m7|m9|m6|m|dim7|dim|aug|sus4|sus2|sus|add9|add2|7sus4|7|6|9|11|13|5)?(\/[A-G](#|b)?)?$/;
  var SECTION_RE = /^(VERSE|CHORUS|BRIDGE|TAG|INTRO|OUTRO|PRE[-\s]?CHORUS|HOOK|REFRAIN|INTERLUDE|CODA|SOLO|INSTRUMENTAL|ENDING)(?:\s+(\d+))?(?:\s*\(([^)]*)\))?\s*$/i;
  var PAREN_ONLY = /^\s*\(([^)]*)\)\s*$/;
  var BRACKET_HDR = /^\[\s*([^\]]+?)\s*\]\s*(?:\(([^)]*)\))?\s*$/;
  var BRACKET_ONLY = /^\[\s*([^\]]+?)\s*\]$/;
  var SAME_AS_ABOVE = /^\s*same as above\.?\s*$/i;
  var SECTION_WORDS = ['VERSE', 'CHORUS', 'BRIDGE', 'TAG', 'INTRO', 'OUTRO', 'PRE-CHORUS', 'PRECHORUS', 'HOOK', 'REFRAIN', 'INTERLUDE', 'CODA', 'SOLO', 'INSTRUMENTAL', 'ENDING'];

  function sectionOf(line) {
    var m = SECTION_RE.exec(line);
    if (!m) return null;
    var name = m[1].toUpperCase().replace(/\s+/g, ' ');
    if (name === 'PRECHORUS') name = 'PRE-CHORUS';
    if (m[2]) name += ' ' + m[2];
    return { name: name, note: (m[3] || '').trim() };
  }

  // Returns {chords, note} when every token on the line is a chord symbol, else null.
  function chordLineOf(line) {
    var notes = [];
    var stripped = line.replace(/\([^)]*\)/g, function (m) { notes.push(m.slice(1, -1).trim()); return ' '; });
    var tokens = stripped.trim().split(/\s+/).filter(function (t) { return t && t !== '|'; });
    if (!tokens.length) return null;
    for (var i = 0; i < tokens.length; i++) if (!CHORD_TOKEN.test(tokens[i])) return null;
    return { chords: tokens, note: notes.join('; ') };
  }

  function knownIds() {
    var byId = (CB.chords && CB.chords.byId) || {};
    return byId;
  }

  // A bracketed section header: [VERSE 1], [CHORUS], [BRIDGE] (strip it back).
  // Returns {name, note} like sectionOf, or null.
  function bracketHeader(line) {
    var m = BRACKET_HDR.exec(line);
    if (!m) return null;
    var sec = sectionOf(m[1]);
    if (!sec) return null;
    if (m[2]) sec.note = (sec.note ? sec.note + '; ' : '') + m[2].trim();
    return sec;
  }

  // Pull Key / BPM / Strum out of a [Key: Em | ~70 bpm | Strum: ...] header line.
  function metaOf(text) {
    var key = /key\s*:\s*([A-G][#b]?(?:m|maj|min|dim|sus|add)?\d?)/i.exec(text);
    var bpm = /(\d+)\s*bpm/i.exec(text);
    var strum = /strum\s*:\s*([^|\]]+)/i.exec(text);
    if (!key && !bpm && !strum) return null;
    return { key: key ? key[1] : '', bpm: bpm ? parseInt(bpm[1], 10) : 0, strum: strum ? strum[1].trim() : '', raw: text };
  }

  function parse(text) {
    var lines = String(text || '').split(/\r?\n/);
    var byId = knownIds();
    var sections = [], warnings = [], pendingNote = '', meta = null;
    var cur = null, lastGroup = null;
    function section(name, note) {
      cur = { name: name, note: note || '', groups: [], repeat: false };
      sections.push(cur);
      lastGroup = null;
    }
    section('Chart', '');
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      var trim = line.trim();
      if (!trim) return;
      var sec = sectionOf(trim) || bracketHeader(trim);
      if (sec) { section(sec.name, sec.note); return; }
      // A bracketed line that is not a header: [END] is an end marker;
      // [Key: ...] carries chart meta; anything else is a direction for the next group.
      if (/^\[\s*END/i.test(trim)) return;
      var br = BRACKET_ONLY.exec(trim);
      if (br) {
        var mt = metaOf(br[1]);
        if (mt) { if (!meta) meta = mt; return; }
        pendingNote = pendingNote ? pendingNote + '; ' + br[1].trim() : br[1].trim();
        return;
      }
      var paren = PAREN_ONLY.exec(trim);
      if (paren) {
        if (SAME_AS_ABOVE.test(paren[1])) { cur.repeat = true; return; }
        pendingNote = pendingNote ? pendingNote + '; ' + paren[1].trim() : paren[1].trim();
        return;
      }
      var cl = chordLineOf(trim);
      if (cl) {
        var note = [pendingNote, cl.note].filter(Boolean).join('; ');
        pendingNote = '';
        var grp = { chords: cl.chords.slice(), lyric: '', note: note };
        cur.groups.push(grp);
        lastGroup = grp;
        return;
      }
      // Anything else is a lyric line: it belongs to the chord line above it.
      // A trailing (direction) on the lyric becomes the group's note instead.
      if (lastGroup && !lastGroup.lyric) {
        var lm = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(trim);
        if (lm && lm[1].trim()) {
          lastGroup.lyric = lm[1].trim();
          lastGroup.note = [lastGroup.note, lm[2].trim()].filter(Boolean).join('; ');
        } else lastGroup.lyric = trim;
        return;
      }
      warnings.push('Skipped a line with no chords above it: "' + trim.slice(0, 60) + (trim.length > 60 ? '…' : '') + '"');
    });
    if (pendingNote) warnings.push('A direction at the end had no chords after it: "(' + pendingNote.slice(0, 60) + ')"');
    // A section with no chords of its own that asks to repeat (or shares a name
    // with an earlier section) plays that earlier section's groups again.
    sections.forEach(function (s) {
      if (s.groups.length) return;
      if (!s.repeat) return;
      for (var k = sections.indexOf(s) - 1; k >= 0; k--) {
        if (sections[k].name === s.name && sections[k].groups.length) {
          s.groups = JSON.parse(JSON.stringify(sections[k].groups));
          return;
        }
      }
      warnings.push(s.name + ' says "same as above" but there is no earlier ' + s.name + ' to repeat.');
    });
    // Drop the placeholder section when a real header was found.
    if (sections.length > 1 && sections[0].groups.length === 0) sections.shift();
    var steps = [], unknown = {};
    sections.forEach(function (s, si) {
      s.groups.forEach(function (grp, gi) {
        grp.chords.forEach(function (ch) {
          var known = !!byId[ch];
          if (!known && !unknown[ch]) { unknown[ch] = true; warnings.push('No diagram for ' + ch + ' on this instrument — it will show as a name only, and listening cannot advance past it.'); }
          steps.push({ chord: ch, known: known, section: s.name, sectionNote: s.note, lyric: grp.lyric, note: grp.note, si: si, gi: gi });
        });
      });
    });
    var seen = {}, uniq = [];
    steps.forEach(function (st) { if (!seen[st.chord]) { seen[st.chord] = true; uniq.push(st.chord); } });
    return {
      sections: sections, steps: steps, warnings: warnings, meta: meta,
      stats: {
        sections: sections.length,
        groups: sections.reduce(function (a, s) { return a + s.groups.length; }, 0),
        steps: steps.length, chords: uniq
      }
    };
  }

  // The chart from the request, verbatim, as the one-tap example.
  var EXAMPLE = [
    'VERSE 1',
    'D                C',
    'Dime store, candy shop',
    'D                C',
    '(let the drone breathe)',
    'Dm               G         D',
    "Broken axis, don't let it stop",
    '',
    'TAG (drone only, strip it bare)',
    'D',
    'Bagpipes... Accordions...',
    'C         D',
    'Nonsense, my friends',
    '',
    'VERSE 2',
    'D                C',
    'Hit by a dump truck yesterday',
    'D                C',
    'Now I gotta fight to get insurance to pay',
    'Dm               G         D',
    'It hit me hard and fast...',
    'Dm               G         D',
    "Lucky I'm not wearing a cast",
    '',
    'VERSE 3',
    'D                C',
    'Walking around the block',
    'D                C',
    'To clear my head',
    'Dm               G         D',
    'Mofo just threw a rock',
    'Dm               G         D',
    "He's lucky he ain't dead...",
    '',
    'BRIDGE',
    'Em               G',
    'Earthquakes... coast to coast',
    'Em               G',
    'But my feet stay on solid ground',
    'A (hang it, let it ring)',
    'D',
    'Could be I just found the sound',
    '',
    'VERSE 4 (half-spoken, Mia-flat)',
    'D                C',
    "But, you know... I also got pistol popped",
    'D                C',
    'I need anger management?',
    'Dm               G         D',
    "That guy didn't get dropped...",
    'Dm               G',
    "I'm cool as a cucumber...",
    "A (don't resolve)",
    'Are you cool???'
  ].join('\n');

  // A second chart, verbatim from the file he sent 2026-11-14: bracketed
  // headers, a [Key: ...] line, and a "(same as above)" chorus.
  var EXAMPLE2 = [
    '[Key: Em | ~70 bpm | Strum: D - D U - U D U]',
    '',
    '[VERSE 1]',
    'Em',
    'Done pissed off everyone I know',
    'G              D',
    'Time and again...',
    '',
    'Em',
    'Only by superpower',
    'G              D',
    'Do hold it together...',
    '',
    'Em             G',
    'Did I arrive?...',
    'D                Em',
    'Damaged...',
    '',
    '[CHORUS]',
    'G         D         Em        D',
    'Squandered? Sure... Probably...',
    'G         D         G',
    "But it's kept me alive...      (hold the G)",
    '',
    '[VERSE 2]',
    'Am',
    'My gruffness...',
    'Em',
    'Inappropriate unapproachable...',
    'D                    Em',
    'Untouchedness...',
    '',
    'Am                         Em',
    'Hard masquerading as soft...',
    'D                 Em',
    'And vice versa...',
    '',
    '[CHORUS]',
    '(same as above)',
    '',
    '[BRIDGE] (strip it back, barely strum)',
    'Am                    Em',
    'Let em all'
  ].join('\n');

  CB.chart = {
    parse: parse, EXAMPLE: EXAMPLE, EXAMPLE2: EXAMPLE2, SECTION_WORDS: SECTION_WORDS,
    isChordToken: function (t) { return CHORD_TOKEN.test(t); },
    isSectionHeader: function (line) { return !!sectionOf(String(line || '').trim()); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = CB.chart;
})(typeof window !== 'undefined' ? window : globalThis);
