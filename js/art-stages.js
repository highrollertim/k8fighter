// js/art-stages.js — three procedural parallax stages. Browser only.
(function (root) {
  'use strict';
  const FC = root.FC;
  function sky(ctx,vw,vh,c0,c1){ const g=ctx.createLinearGradient(0,0,0,vh); g.addColorStop(0,c0); g.addColorStop(1,c1); ctx.fillStyle=g; ctx.fillRect(0,0,vw,vh); }
  function floor(ctx,vw,vh,c0,c1){ const g=ctx.createLinearGradient(0,FC.FLOOR_Y,0,vh); g.addColorStop(0,c0); g.addColorStop(1,c1); ctx.fillStyle=g; ctx.fillRect(0,FC.FLOOR_Y,vw,vh-FC.FLOOR_Y); }

  function forest(ctx,vw,vh,t){
    sky(ctx,vw,vh,'#2b3340','#46543a');
    ctx.fillStyle='rgba(180,200,120,0.12)'; ctx.beginPath(); ctx.arc(vw*0.7,120,80,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1d2a1c';
    for(let i=0;i<7;i++){ const x=(i*150+ (t*0.2)%150)-40; ctx.beginPath(); ctx.moveTo(x,FC.FLOOR_Y); ctx.lineTo(x+18,200+(i%3)*30); ctx.lineTo(x+40,FC.FLOOR_Y); ctx.fill(); }
    ctx.fillStyle='#14211a';
    for(let i=0;i<4;i++){ const x=i*260+60; ctx.fillRect(x,260,10,FC.FLOOR_Y-260); }
    floor(ctx,vw,vh,'#3a472f','#26331f');
    ctx.fillStyle='#d4ff5a'; ctx.globalAlpha=0.4;
    for(let i=0;i<14;i++){ const a=t*0.02+i; ctx.beginPath(); ctx.arc((i*70+ (t*0.5))%vw, 180+Math.sin(a)*120, 1.6,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
  }
  function street(ctx,vw,vh,t){
    sky(ctx,vw,vh,'#241a3a','#3a2a4a');
    for(let i=0;i<5;i++){ ctx.fillStyle=['#c0563f','#5ad4ff','#d4ff5a','#e7d9a8','#c05fb0'][i]; ctx.globalAlpha=0.5;
      ctx.fillRect(80+i*180, 120+(i%2)*40, 70, 16); ctx.globalAlpha=1; }
    ctx.fillStyle='#1a1530'; for(let i=0;i<6;i++){ ctx.fillRect(i*170, 180, 120, FC.FLOOR_Y-180); }
    ctx.fillStyle='rgba(255,255,255,0.08)'; for(let i=0;i<60;i++){ ctx.fillRect((i*53)%vw, 190+((i*37)%240), 6, 8); }
    floor(ctx,vw,vh,'#2a2740','#16131f');
  }
  function con(ctx,vw,vh,t){
    sky(ctx,vw,vh,'#34506a','#557a9a');
    ctx.fillStyle='#2a3f54'; ctx.fillRect(0,140,vw,80);
    for(let i=0;i<5;i++){ ctx.fillStyle=['#c0563f','#5ad4ff','#d4ff5a'][i%3]; ctx.fillRect(40+i*190,150,150,52);
      ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.font='700 18px sans-serif'; ctx.textAlign='center'; ctx.fillText('EXPO',40+i*190+75,182); }
    ctx.fillStyle='#3a2f4a'; for(let i=0;i<4;i++){ ctx.fillRect(i*250+40, 300, 180, FC.FLOOR_Y-300); }
    floor(ctx,vw,vh,'#6a5a4a','#473b30');
  }

  function draw(ctx, idx, vw, vh, t){
    t = t||0;
    if(idx===1) street(ctx,vw,vh,t);
    else if(idx===2) con(ctx,vw,vh,t);
    else forest(ctx,vw,vh,t);
  }
  root.ArtStages = { draw, COUNT: 3 };
})(window);
