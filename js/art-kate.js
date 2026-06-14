// js/art-kate.js — humanoid skeletal rig + pose table. Browser only.
(function (root) {
  'use strict';
  const SKIN='#F6DCC6', HAIR='#262129', TOP='#26222B', SKIRT='#6E4D66',
        LEG='#5C4458', BOOT='#2E2A33', EYE='#3E5C50', METAL='#C9CDD3', CHOKER='#7A2B33';

  function rr(ctx,x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function limb(ctx,x1,y1,x2,y2,w,col){ ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }

  function poseFor(f){
    const t=f.stateFrame, m=f.move;
    const base={ crouch:0, lean:0, hipY:54, headY:96, armF:[24,70], armB:[-6,68], legF:[16,0], legB:[-16,0], punch:0, kick:0 };
    if(f.state==='crouch') return Object.assign(base,{crouch:18,hipY:36,headY:74});
    if(!f.onGround||f.state==='jump') return Object.assign(base,{hipY:60,legF:[10,18],legB:[-14,20],armF:[20,82],lean:6});
    if(f.state==='block'||f.state==='blockstun') return Object.assign(base,{lean:-8,armF:[14,72],armB:[8,66]});
    if(f.state==='hitstun') return Object.assign(base,{lean:-14,headY:92,armF:[10,80],armB:[-14,76]});
    if(f.state==='knockdown') return Object.assign(base,{crouch:40,hipY:18,headY:40,lean:-30});
    if(f.state==='attack'&&m){
      if(m.indexOf('LP')>=0||m.indexOf('HP')>=0||m==='kate.cLP') return Object.assign(base,{punch:1,armF:[46+(m.indexOf('H')>=0?12:0),74]});
      if(m.indexOf('LK')>=0||m.indexOf('HK')>=0||m==='kate.cLK') return Object.assign(base,{kick:1,legF:[52,30]});
      if(m==='kate.jP'||m==='kate.jK') return Object.assign(base,{hipY:60,armF:[34,86],legF:[40,26]});
      if(m==='kate.fireball') return Object.assign(base,{armF:[40,66],lean:4});
      if(m==='kate.uppercut') return Object.assign(base,{punch:1,armF:[30,110],lean:8,hipY:64});
      if(m==='kate.spinkick') return Object.assign(base,{kick:1,legF:[54,46],lean:6});
      if(m==='kate.super') return Object.assign(base,{punch:1,armF:[50,80],lean:6});
      if(m==='kate.throw') return Object.assign(base,{armF:[34,74],armB:[20,72]});
    }
    const bob=Math.sin(t*0.12)*2;
    return Object.assign(base,{hipY:54+bob});
  }

  function draw(ctx,f){
    const fc=f.facing, p=poseFor(f);
    const X=(lx)=>f.x+fc*lx, Y=(ly)=>f.y-ly;
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(f.x,f.y+2,30,7,0,0,Math.PI*2); ctx.fill();
    const hipX=0, hipY=p.hipY, shoX=p.lean*0.6, shoY=hipY+34;
    limb(ctx, X(hipX-6),Y(hipY), X(p.legB[0]),Y(p.legB[1]+8), 11, '#4a3647');
    limb(ctx, X(p.legB[0]),Y(p.legB[1]+8), X(p.legB[0]-2),Y(0), 11, '#4a3647');
    ctx.fillStyle='#241f28'; ctx.beginPath(); ctx.ellipse(X(p.legB[0]-2),Y(2),10,6,0,0,Math.PI*2); ctx.fill();
    limb(ctx, X(shoX-8),Y(shoY), X(p.armB[0]),Y(p.armB[1]), 8, '#3a3340');
    ctx.save(); ctx.translate(X(0),Y(hipY)); ctx.rotate(fc*p.lean*0.01);
    ctx.fillStyle=SKIRT; ctx.beginPath(); ctx.moveTo(-13,0); ctx.lineTo(13,0); ctx.lineTo(17,16); ctx.quadraticCurveTo(0,22,-17,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle=TOP; rr(ctx,-13,-34,26,36,7); ctx.fill();
    ctx.restore();
    const lf=p.legF;
    limb(ctx, X(hipX+6),Y(hipY), X(lf[0]*0.6),Y(lf[1]+8), 12, LEG);
    limb(ctx, X(lf[0]*0.6),Y(lf[1]+8), X(lf[0]),Y(0), 12, LEG);
    ctx.fillStyle=BOOT; ctx.beginPath(); ctx.ellipse(X(lf[0]+fc*2),Y(2),12,6,0,0,Math.PI*2); ctx.fill();
    const af=p.armF; const elbowX=(shoX+af[0])/2, elbowY=(shoY+af[1])/2 - (p.punch?6:0);
    limb(ctx, X(shoX+8),Y(shoY), X(elbowX),Y(elbowY), 9, TOP);
    limb(ctx, X(elbowX),Y(elbowY), X(af[0]),Y(af[1]), 9, TOP);
    ctx.fillStyle=SKIN; ctx.beginPath(); ctx.arc(X(af[0]),Y(af[1]),5,0,Math.PI*2); ctx.fill();
    const hx=X(shoX+fc*2), hy=Y(p.headY);
    ctx.fillStyle=CHOKER; rr(ctx,hx-6,Y(shoY+2)-6,12,5,2); ctx.fill();
    ctx.fillStyle=SKIN; ctx.beginPath(); ctx.ellipse(hx,hy,13,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=HAIR; ctx.beginPath();
    ctx.moveTo(hx-13,hy+2); ctx.quadraticCurveTo(hx-15,hy-15,hx,hy-15);
    ctx.quadraticCurveTo(hx+15,hy-15,hx+13,hy+1); ctx.quadraticCurveTo(hx+14,hy+8,hx+10,hy+10);
    ctx.quadraticCurveTo(hx+12,hy-6,hx,hy-8); ctx.quadraticCurveTo(hx-10,hy-8,hx-10,hy+5);
    ctx.quadraticCurveTo(hx-10,hy+9,hx-8,hy+11); ctx.quadraticCurveTo(hx-13,hy+7,hx-13,hy+2); ctx.closePath(); ctx.fill();
    if(f.state==='hitstun'){ ctx.strokeStyle=EYE; ctx.lineWidth=1.6;
      for(const ex of [hx-4,hx+5]){ ctx.beginPath(); ctx.moveTo(ex-2,hy-2); ctx.lineTo(ex+2,hy+2); ctx.moveTo(ex+2,hy-2); ctx.lineTo(ex-2,hy+2); ctx.stroke(); } }
    else { ctx.fillStyle=EYE; ctx.beginPath(); ctx.ellipse(hx+fc*3,hy,1.8,2.6,0,0,Math.PI*2); ctx.ellipse(hx+fc*9,hy,1.8,2.6,0,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle=METAL; ctx.beginPath();
    ctx.arc(hx+fc*11,hy-4,1,0,Math.PI*2); ctx.arc(hx+fc*6,hy+4,0.9,0,Math.PI*2); ctx.arc(hx+fc*3,hy+8,0.9,0,Math.PI*2); ctx.fill();
  }
  root.ArtKate = { draw };
})(window);
