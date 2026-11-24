// Headless check for one instrument: node e2e.js <instrument>   (needs both.wav from mkwav.py and instrument.js copied in)
const { chromium } = require('playwright');
const inst = process.argv[2] || 'guitar', tun = process.argv[3] || '';
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+process.cwd()+'/both.wav','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport:{width:412,height:860}, permissions:['microphone'] });
  const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e=>errs.push('PAGEERR '+e.message)); p.on('console', m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  await p.addInitScript(([inst, tun]) => { if (tun) localStorage.setItem('stringbench.tuning.' + inst, tun); window.__osc=[]; const o=AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator=function(){ const x=o.call(this); const d=Object.getOwnPropertyDescriptor(OscillatorNode.prototype,'frequency'); window.__osc.push(x); return x; }; localStorage.setItem('stringbench.instrument', inst); window.ChordBenchApp={keepAwake(){},fullscreen(){},saveFile(){return 'ok'},inputs(){return '15:phone;'}}; }, [inst, tun]);
  await p.goto('file://'+process.cwd()+'/index.html'); await p.waitForTimeout(500);
  console.log(inst, '| title:', await p.title(), '| accent:', await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()));
  await p.click('.door.lead'); await p.waitForTimeout(800);
  console.log('strings:', await p.$$eval('.sbtn', s=>s.map(x=>x.textContent).join(' | ')));
  // tap the lowest string: a tone starts at that frequency and the tuner stays quiet meanwhile
  await p.click('.sbtn >> nth=0'); await p.waitForTimeout(400);
  const t = await p.evaluate(()=>({n:__osc.length, f:__osc.length?__osc[__osc.length-1].frequency.value:0, hear:document.querySelectorAll('.sbtn.hear').length, until:__cb.audio.toneUntil>Date.now(), msg:document.querySelector('.mono').textContent}));
  console.log('tone:', JSON.stringify(t), 'expected f', await p.evaluate(()=>__cb.audio.STRINGS[0].f));
  for (let i=0;i<50;i++){ await p.waitForTimeout(1500); const h=await p.evaluate(()=>location.hash); if(h==='#jam') break; }
  console.log('after tuner:', await p.evaluate(()=>location.hash));
  await p.waitForTimeout(+process.env.JW||13000);
  console.log('timeline:', (await p.$$eval('.timeline span', s=>s.map(x=>x.textContent))).join(' '));
  await p.click('text=Full'); await p.waitForTimeout(300);
  console.log('full mode:', await p.evaluate(()=>document.documentElement.classList.contains('fs')), 'exit button visible:', await p.isVisible('.fsexit'));
  console.log('errors', errs);
  await b.close();
})();
