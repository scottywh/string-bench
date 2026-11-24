require('./loadinst.js')(process.env.INST||'guitar', process.env.TUNING); const C = require('./chords.js'); const DSP = require('./dsp.js');
const SR = 44100, N = 8192;
function fft(re, im){const n=re.length;for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<len/2;k++){const ur=re[i+k],ui=im[i+k],vr=re[i+k+len/2]*cr-im[i+k+len/2]*ci,vi=re[i+k+len/2]*ci+im[i+k+len/2]*cr;re[i+k]=ur+vr;im[i+k]=ui+vi;re[i+k+len/2]=ur-vr;im[i+k+len/2]=ui-vi;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t;}}}}
function strum(chord, opt={}){const len=SR*1.2, buf=new Float32Array(len); const delay=opt.delay??0.012, B=opt.inh??0.00008;
 let s=0; chord.notes.forEach((m,idx)=>{for(let pr=0;pr<(CB.INSTRUMENT.paired?2:1);pr++){const f0=440*Math.pow(2,(m-69)/12)*(1+(Math.random()-0.5)*(opt.detune??0.004)+(pr?0.0016:-0.0016)); const t0=Math.floor(idx*delay*SR); const amp=0.6+Math.random()*0.4;
  for(let h=1;h<=14;h++){const fh=f0*h*Math.sqrt(1+B*h*h); if(fh>SR/2.2)break; const ha=amp/Math.pow(h,1.15)*(h%7===0?(+process.env.H7||0.3):1); const dec=(1.5+h*0.9)*(opt.dm||1); const ph=Math.random()*6.28;
   for(let i=t0;i<len;i++){const t=(i-t0)/SR; buf[i]+=ha*Math.exp(-t*dec)*Math.sin(2*Math.PI*fh*t+ph);}}}});
 const nz=opt.noise??0.002; for(let i=0;i<len;i++)buf[i]+=(Math.random()-0.5)*nz; let mx=0;for(const v of buf)mx=Math.max(mx,Math.abs(v)); for(let i=0;i<len;i++)buf[i]*=0.5/mx; return buf;}
function spectrum(buf, at){const re=new Float64Array(N),im=new Float64Array(N);for(let i=0;i<N;i++){const w=0.42-0.5*Math.cos(2*Math.PI*i/(N-1))+0.08*Math.cos(4*Math.PI*i/(N-1));re[i]=(buf[at+i]||0)*w;}fft(re,im);const db=new Float32Array(N/2);for(let k=0;k<N/2;k++){db[k]=20*Math.log10(Math.hypot(re[k],im[k])/N+1e-12);}return db;}
const pool = process.argv[2] ? C.list.filter(c=>c.stage<=+process.argv[2]) : C.list;
const cands = DSP.makeCandidates(pool);
let tot=0, ok=0, shown=0, wrong=0; const confu={};
for(const ch of pool){let good=0,conf=0,T=20;
 for(let t=0;t<T;t++){const b=strum(ch,{noise:t%4===0?0.02:0.002,dm:+process.env.DM||1});const db=spectrum(b,Math.floor(SR*(+process.env.AT||0.15)));const a=DSP.analyze(db,SR,N);const r=DSP.classify(a.chroma,a.bass,cands,{low:a.low,extraMin:process.env.EX!==undefined?+process.env.EX:undefined});
  tot++; if(r.ok){shown++; if(r.id===ch.id){ok++;good++;} else {wrong++;confu[ch.id+'->'+r.id]=(confu[ch.id+'->'+r.id]||0)+1;}}}
 console.log(ch.id.padEnd(6),'correct+shown',good+'/'+T);}
console.log({tot,shown,ok,wrong,confu});
