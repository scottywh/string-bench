# String Bench

A multi-instrument jam and practice web app: guitar, mandolin, ukulele,
banjo, and 3-string cigar box.

- **Jam** — mic chord listening and naming, with flash cards and a tuner
- **Songs** — play along with chord charts
- **Charts** — paste a chord chart and get a playable routine: step through
  chord by chord with diagrams, lyric lines, and direction notes; the mic
  listens and advances on the right chord, with a hear-it strum and
  auto-advance at a chosen BPM

Current version: 2.2.2. Guitar chords verified 560/560.

## Run it

Open `index.html` in a browser (serve over HTTP for the mic features), or
build the Android app:

```sh
export KS_PASS=<your keystore password>
python3 android/build_apk.py
```

The build needs Python 3 and JDK 17+. It fetches its tools (aapt2, apktool,
apksigner) from npm on first run — no Android Studio or SDK needed. The
keystore is never in this repo; set `KS_PASS` before building.

## Notes

- Font files are not in this repo, so the web app falls back to system fonts.
- `docs/effects-bench-design.md` is the design doc for Effects Bench
  (drive/delay/tremolo, amp presets, visuals) — deferred, not built yet.
