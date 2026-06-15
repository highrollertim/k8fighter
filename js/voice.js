// js/voice.js — Kate taunt lines via speechSynthesis. Browser only.
(function (root) {
  'use strict';
  const LINES = {
    intro: ["Let's make this quick.", "Hope you brought a mop.", "I cosplay scarier things than you for fun.", "This is about to be so unserious.", "Ew, is that mold, or is that your whole personality?"],
    roundStart: ["Okay fungus girl, let's go.", "You're about to get deleted, and not by AI.", "Ugh, you smell like a wet basement.", "Spore me the drama, then lose.", "You're literally a science experiment that said no thanks."],
    bigHit: ["Stand on business!", "That's for the spores!", "No cap, you're done.", "Skill issue!", "Get mulched!", "Cope, fungus."],
    win: ["G G. Touch grass, actually don't, you'll infect it.", "And THAT is how Kate does it.", "Composted. Anime is still life.", "G G no re, you absolute biohazard."],
    takeHit: ["Gross, gross, GROSS.", "Ew, ew, ew!", "It's STICKY, why is it sticky!", "Not the spores, not the spores!", "I am not catching a fungal infection over this."],
  };
  const synth = root.speechSynthesis || null;
  let muted=false; const bags={};
  function pick(cat){ if(!bags[cat]||!bags[cat].length){ bags[cat]=LINES[cat].slice();
      for(let i=bags[cat].length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=bags[cat][i]; bags[cat][i]=bags[cat][j]; bags[cat][j]=t; } }
    return bags[cat].pop(); }
  function voice(){ if(!synth) return null; const vs=synth.getVoices().filter(v=>/^en/i.test(v.lang));
    return vs.find(v=>/female|samantha|victoria|karen|ava|zira|tessa|fiona|serena/i.test(v.name))||vs[0]||null; }
  function say(cat){ if(!synth||muted) return; const line=pick(cat); if(!line) return;
    if(synth.speaking && cat!=='win') return;
    const u=new SpeechSynthesisUtterance(line); const v=voice(); if(v) u.voice=v; u.rate=1.05; u.pitch=1.1; synth.speak(u); }
  const API={ say, setMuted(m){ muted=m; if(m&&synth) synth.cancel(); }, LINES };
  root.Voice = API;
})(window);
