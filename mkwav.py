# Synthetic audio for the headless checks: python3 mkwav.py <instrument>  -> tune.wav chords.wav both.wav
import numpy as np, wave, json, subprocess, sys
inst = sys.argv[1] if len(sys.argv) > 1 else 'guitar'
tun = sys.argv[2] if len(sys.argv) > 2 else ''
SR = 48000
info = json.loads(subprocess.check_output(['node', '-e',
  "const CB=require('./loadinst.js')('%s','%s');const C=require('./chords.js');const I=CB.INSTRUMENT;"
  "console.log(JSON.stringify({paired:I.paired,strings:I.strings.map(s=>s.midi),chords:C.list.map(c=>({id:c.id,notes:c.notes,stage:c.stage}))}))" % (inst, tun)]))
byid = {c['id']: c for c in info['chords']}
loop = [c['id'] for c in info['chords'] if c['stage'] == 1][:4]
rng = np.random.default_rng(3)
def note1(m, dur, amp=0.8, B=8e-5):
    n = int(SR*dur); t = np.arange(n)/SR; f0 = 440*2**((m-69)/12); y = np.zeros(n)
    for h in range(1, 13):
        fh = f0*h*np.sqrt(1+B*h*h)
        if fh > SR/2.2: break
        y += amp/h**1.15*np.exp(-t*(1.1+0.5*h))*np.sin(2*np.pi*fh*t+rng.uniform(0, 6.28))
    return y
def note(m, dur, amp=0.8):
    if info['paired']: return 0.5*(note1(m+0.03, dur, amp)+note1(m-0.03, dur, amp))
    return note1(m, dur, amp)
def strum(cid, dur=1.8):
    n = int(SR*dur); y = np.zeros(n)
    for i, m in enumerate(sorted(byid[cid]['notes'])):
        d = int(i*0.012*SR); seg = note(m, dur-i*0.012, rng.uniform(.6, 1)); y[d:d+len(seg)] += seg[:n-d]
    return y
def save(name, y):
    y = y/np.max(np.abs(y))*0.5; y += rng.normal(0, 0.0008, len(y))
    w = wave.open(name, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y*32767).astype('<i2').tobytes()); w.close()
tune = []
for m in sorted(info['strings']):  # the tuner accepts strings in any order
    s = note(m, 2.2, 1); s = s*np.minimum(1, np.arange(len(s))/(0.02*SR)); tune.append(s); tune.append(np.zeros(int(SR*0.4)))
save('both.wav', np.concatenate(tune+[np.zeros(SR)]+[strum(c) for c in loop]*3))
print(inst, 'loop:', ' '.join(loop))
