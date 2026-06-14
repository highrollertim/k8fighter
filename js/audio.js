// js/audio.js — procedural fight music + SFX (Web Audio, no files). Browser only.
(function (root) {
  'use strict';
  const TEMPO=140, STEP=60/TEMPO/4, BAR=16, MUSIC=0.55;
  const ROOTS=[110.00, 87.31, 98.00, 110.00];
  const STAB=[[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66],[220,261.63,329.63]];
  let ctx=null,master,musicBus,sfxBus,noise,muted=false,on=false,timer=null,step=0,nextT=0;

  function ensure(){ if(ctx) return; const AC=root.AudioContext||root.webkitAudioContext; if(!AC) return;
    ctx=new AC(); master=ctx.createGain(); master.gain.value=muted?0:1; master.connect(ctx.destination);
    musicBus=ctx.createGain(); musicBus.gain.value=MUSIC; musicBus.connect(master);
    sfxBus=ctx.createGain(); sfxBus.gain.value=0.9; sfxBus.connect(master);
    noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate); const d=noise.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }

  function tone(o){ const osc=ctx.createOscillator(); osc.type=o.type||'sine'; osc.frequency.setValueAtTime(o.freq,o.t);
    if(o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo,o.t+o.dur);
    const g=ctx.createGain(); g.gain.setValueAtTime(0,o.t); g.gain.linearRampToValueAtTime(o.gain,o.t+0.006);
    g.gain.exponentialRampToValueAtTime(0.0008,o.t+o.dur); let head=osc;
    if(o.cut){ const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=o.cut; osc.connect(f); head=f; }
    head.connect(g); g.connect(o.dest||sfxBus); osc.start(o.t); osc.stop(o.t+o.dur+0.05); }
  function nz(o){ const s=ctx.createBufferSource(); s.buffer=noise; const f=ctx.createBiquadFilter();
    f.type=o.filt; f.frequency.value=o.freq; const g=ctx.createGain(); g.gain.setValueAtTime(o.gain,o.t);
    g.gain.exponentialRampToValueAtTime(0.0008,o.t+o.dur); s.connect(f); f.connect(g); g.connect(o.dest||sfxBus);
    s.start(o.t); s.stop(o.t+o.dur+0.02); }

  function sched(s,t){ const bar=Math.floor(s/BAR)%4, ib=s%BAR; const root0=ROOTS[bar];
    if(ib%4===0) tone({freq:140,slideTo:46,type:'sine',t,dur:0.18,gain:0.6,dest:musicBus});
    if(ib===4||ib===12) nz({t,dur:0.14,gain:0.25,dest:musicBus,filt:'bandpass',freq:1700});
    nz({t,dur:0.03,gain:ib%2?0.05:0.08,dest:musicBus,filt:'highpass',freq:7000});
    if(ib%2===0){ const oct=(ib%8===4)?2:1; tone({freq:root0*oct,type:'sawtooth',t,dur:STEP*1.6,gain:0.16,dest:musicBus,cut:600}); }
    if(ib===0||ib===6||ib===10){ STAB[bar].forEach(fq=>tone({freq:fq,type:'square',t,dur:STEP*2,gain:0.045,dest:musicBus,cut:1800})); }
  }
  function tick(){ if(nextT<ctx.currentTime){ const b=Math.ceil((ctx.currentTime-nextT)/STEP); step+=b; nextT+=b*STEP; }
    while(nextT<ctx.currentTime+0.18){ sched(step,nextT); step++; nextT+=STEP; } }

  const API={
    startMusic(){ ensure(); if(!ctx) return; if(ctx.state==='suspended') ctx.resume();
      musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(MUSIC,ctx.currentTime);
      if(!on){ on=true; step=0; nextT=ctx.currentTime+0.06; timer=setInterval(tick,30); } },
    stopMusic(){ if(!on) return; on=false; clearInterval(timer); timer=null; },
    setMuted(m){ muted=m; if(ctx) master.gain.setTargetAtTime(m?0:1,ctx.currentTime,0.02); },
    isMuted(){ return muted; },
    punch(heavy){ if(!ctx) return; const t=ctx.currentTime; nz({t,dur:heavy?0.12:0.07,gain:heavy?0.35:0.22,filt:'lowpass',freq:heavy?900:1400}); tone({freq:heavy?120:180,slideTo:60,type:'square',t,dur:0.08,gain:0.12,cut:1200}); },
    kick(heavy){ if(!ctx) return; const t=ctx.currentTime; nz({t,dur:heavy?0.14:0.08,gain:heavy?0.34:0.2,filt:'lowpass',freq:heavy?700:1100}); tone({freq:90,slideTo:50,type:'sine',t,dur:0.1,gain:0.16}); },
    whiff(){ if(!ctx) return; nz({t:ctx.currentTime,dur:0.09,gain:0.12,filt:'bandpass',freq:2600}); },
    block(){ if(!ctx) return; const t=ctx.currentTime; nz({t,dur:0.06,gain:0.2,filt:'highpass',freq:3500}); tone({freq:400,type:'square',t,dur:0.05,gain:0.08,cut:2000}); },
    hit(heavy){ this.punch(heavy); },
    fireball(){ if(!ctx) return; const t=ctx.currentTime; tone({freq:300,slideTo:700,type:'sawtooth',t,dur:0.25,gain:0.18,cut:1600}); },
    spore(){ if(!ctx) return; nz({t:ctx.currentTime,dur:0.3,gain:0.16,filt:'bandpass',freq:900}); },
    ko(){ if(!ctx) return; this.stopMusic(); const t=ctx.currentTime; nz({t,dur:0.4,gain:0.4,filt:'lowpass',freq:500});
      [330,262,196,131].forEach((f,i)=>tone({freq:f,type:'sawtooth',t:t+0.12*i,dur:0.3,gain:0.2,cut:1400})); },
    bell(){ if(!ctx) return; const t=ctx.currentTime; [880,1320].forEach((f,i)=>tone({freq:f,type:'square',t:t+i*0.06,dur:0.3,gain:0.12,cut:3000})); },
    super(){ if(!ctx) return; const t=ctx.currentTime; for(let i=0;i<6;i++) tone({freq:300+i*120,type:'square',t:t+i*0.05,dur:0.12,gain:0.1,cut:2600}); },
  };
  root.Sound = API;
})(window);
