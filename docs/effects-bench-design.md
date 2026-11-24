# String Bench — Effects Bench design note (next revision)

Date: 2026-11-10. Source of ideas: ChatGPT suggestions he brought in Nov 10, plus his own framing.

## The distinction (worth keeping straight)

- **String Bench is about developing an instrument player.** Plus Twelve is about developing a musician's ear. Overlap, but different philosophies — effects and toys belong to String Bench, not Plus Twelve.

## The idea: an optional Effects Bench

Not a full DAW. Just enough toys to make practicing more entertaining. Every toy optional.

### 1. Effects playground
- Clean / overdrive / fuzz
- Chorus / flanger / phaser
- Delay / reverb
- Tremolo

### 2. Amp personalities (presets on top of the playground)
- Vintage tube, British crunch, Modern metal, Warm acoustic simulation

### 3. Jam toys
- Loop recording
- Adjustable backing tracks
- Metronome with configurable grooves
- Random chord progression generator

### 4. Visual nonsense (the good kind)
- Reactive waveform displays, frequency spectrum
- Psychedelic visualization mode
- Customizable session themes

## Architecture rule (the important one)

Keep effects processing separate from the core recording and recognition pipeline:

**Input → Analysis → Effects → Output**, with a bypass switch.

Chord recognition analyzes the CLEAN input while the player hears the processed output. Otherwise the recognizer ends up trying to interpret a fuzz-saturated, heavily delayed signal. This is the one rule the whole feature hangs on.

## Governing principle

String Bench should never punish someone for screwing around. Screwing around is an officially supported feature. "It's fun as fuck, too" — less a slogan, more a development requirement.

## Feasibility (all WebAudio, no native code needed)

- Overdrive/fuzz: WaveShaper node
- Delay: DelayNode; reverb: ConvolverNode with a synthesized impulse
- Chorus/flanger/phaser: BiquadFilter + LFO
- Tremolo: LFO on a GainNode
- Amp personalities: preset combinations of the above
- Waveform/spectrum visuals: AnalyserNode — the app already does DSP, so this is cheap

## Proposed build order

1. **2.1.1 install verified first** (mp4-first recorder). The revision builds on a working install.
2. **Signal chain skeleton**: Effects Bench screen with bypass + clean-analysis tap. Everything else hangs on this.
3. **First toys**: one drive + delay + tremolo — cheapest to build, most fun per line.
4. **Amp personalities** as presets on top of those.
5. **Visuals** (waveform/spectrum) — cheap via AnalyserNode.
6. **Jam toys later**: metronome grooves + random progression generator first (easiest); loop recording + backing tracks after (bigger).

## Open questions for him

- Effects Bench as its own home-screen door, or a panel inside jam mode?
- Which toys first — drive/delay/tremolo, or does one of the jam toys jump the queue?
