/* String Bench — boot */
(function (g) {
  'use strict';
  var CB = g.CB;
  CB.store.load();
  function go() {
    CB.ui.boot();
    CB.audio.setCandidates(CB.chords.list);
    g.__cb = CB; // handle for automated checks
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})(window);
