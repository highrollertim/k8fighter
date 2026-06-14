// js/art-kate.js — humanoid skeletal rig + pose table. Browser only.
(function (root) {
  'use strict';
  const SKIN='#F6DCC6', HAIR='#262129', TOP='#26222B', SKIRT='#6E4D66',
        LEG='#5C4458', BOOT='#2E2A33', EYE='#3E5C50', METAL='#C9CDD3', CHOKER='#7A2B33';

  // --- per-fighter landing-squash state, keyed by fighter id ---
  // We use fighter.x+fighter.y as a rough stable key, but fighter.id is better if available.
  // Use a WeakMap-compatible approach: store per fighter via a module-level Map keyed on fighter object.
  const _landState = new WeakMap(); // { wasAirborne: bool, squashFrame: int }

  function getLandState(f) {
    if (!_landState.has(f)) _landState.set(f, { wasAirborne: false, squashFrame: 0 });
    return _landState.get(f);
  }

  function rr(ctx,x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function limb(ctx,x1,y1,x2,y2,w,col){ ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }

  function poseFor(f){
    const t=f.stateFrame, m=f.move;
    // Enhanced walk: bigger stride, arm pump, forward lean, body bob
    const walkCycle = Math.sin(t * 0.28);
    const walkBob   = Math.abs(Math.sin(t * 0.28)) * 3;   // vertical bob
    const base={ crouch:0, lean:0, hipY:54, headY:96, armF:[24,70], armB:[-6,68], legF:[16,0], legB:[-16,0], punch:0, kick:0 };
    if(f.state==='crouch') return Object.assign(base,{crouch:18,hipY:36,headY:74});
    if(!f.onGround||f.state==='jump') return Object.assign(base,{hipY:60,legF:[10,18],legB:[-14,20],armF:[20,82],lean:6});
    if(f.state==='block'||f.state==='blockstun') return Object.assign(base,{lean:-8,armF:[14,72],armB:[8,66]});
    if(f.state==='hitstun') return Object.assign(base,{lean:-14,headY:92,armF:[10,80],armB:[-14,76]});
    if(f.state==='knockdown') return Object.assign(base,{crouch:40,hipY:18,headY:40,lean:-30});
    if(f.state==='attack'&&m){
      if(m.indexOf('LP')>=0||m.indexOf('HP')>=0||m==='kate.cLP') return Object.assign(base,{punch:1,armF:[46+(m.indexOf('H')>=0?12:0),74]});
      if(m.indexOf('LK')>=0||m.indexOf('HK')>=0||m==='kate.cLK') return Object.assign(base,{kick:1,legF:[52,30]});
      if(m==='kate.jK') return Object.assign(base,{hipY:60,lean:14,legF:[62,38],legB:[-8,30],armF:[18,82],armB:[-6,76]});
      if(m==='kate.jP') return Object.assign(base,{hipY:58,lean:10,armF:[52,58],legF:[14,20],legB:[-10,16]});
      if(m==='kate.fireball') return Object.assign(base,{armF:[40,66],lean:4});
      if(m==='kate.uppercut') return Object.assign(base,{punch:1,armF:[30,110],lean:8,hipY:64});
      if(m==='kate.super') return Object.assign(base,{punch:1,armF:[50,80],lean:6});
      if(m==='kate.throw') return Object.assign(base,{armF:[34,74],armB:[20,72]});
    }
    // Enhanced run: walkF gets bigger stride, arm pump, lean, bob
    if(f.state==='walkF') {
      const legSwing = walkCycle * 26;    // bigger stride (was ~16)
      const armSwing = walkCycle * 18;    // bigger arm pump
      return Object.assign(base,{
        lean: 10,                          // forward lean
        hipY: 54 - walkBob,               // body bob
        headY: 96 - walkBob,
        legF:  [14 + legSwing, legSwing > 0 ? legSwing * 0.3 : 0],
        legB:  [-14 - legSwing * 0.7, legSwing < 0 ? -legSwing * 0.3 : 0],
        armF:  [22 + armSwing, 72 - Math.abs(armSwing) * 0.4],
        armB:  [-8 - armSwing, 68 - Math.abs(armSwing) * 0.4],
      });
    }
    // Walk-back (block/walking away state): mirror with less lean
    if(f.state==='walkB') {
      const legSwing = walkCycle * 20;
      return Object.assign(base,{
        lean: -6,
        hipY: 54 - walkBob * 0.5,
        legF:  [14 + legSwing * 0.6, 0],
        legB:  [-14 - legSwing * 0.6, 0],
        armF:  [20 + legSwing * 0.5, 70],
        armB:  [-8  - legSwing * 0.5, 68],
      });
    }
    const bob=Math.sin(t*0.12)*2;
    return Object.assign(base,{hipY:54+bob});
  }

  // --- Jump somersault helpers ---
  // Airtime ~ 33 frames; apex ~ 125 px above floor.
  // vy starts at JUMP_VY=-15, increases by GRAVITY=0.9 each frame.
  // At apex vy≈0. We derive flip progress from vy:
  //   progress 0 at launch (vy=-15), 1 at landing (vy=+15 ish).
  // That maps cleanly to 0→2π for a forward somersault.
  const JUMP_VY = -15;
  const JUMP_VY_LAND = 15; // approximate vy when landing

  function flipAngle(f) {
    // Normalise vy into [0,1] over the jump arc.
    const vy = (typeof f.vy === 'number') ? f.vy : 0;
    // Clamp to the expected range
    const t = (vy - JUMP_VY) / (JUMP_VY_LAND - JUMP_VY); // 0 → 1 over the jump
    const tc = Math.min(1, Math.max(0, t));
    // Spin direction follows horizontal movement:
    //   vx > 0.5  → roll forward (positive rotation)
    //   vx < -0.5 → backflip (negative rotation)
    //   near-zero → gentle tuck, max ~0.4 turn (no full spin)
    const vx = (typeof f.vx === 'number') ? f.vx : 0;
    if (Math.abs(vx) < 0.5) {
      // Straight-up jump: gentle partial tuck, peak at apex, return upright
      const tuck = Math.sin(tc * Math.PI); // 0→1→0 over the jump
      return tuck * 0.4; // small lean, not a full spin
    }
    const spinDir = vx > 0 ? 1 : -1;
    return spinDir * tc * Math.PI * 2;
  }

  // Tuck factor: 0 = full tuck (mid-flip), 1 = full extension (launch/land)
  function tuckFactor(f) {
    const vy = (typeof f.vy === 'number') ? f.vy : 0;
    const t = (vy - JUMP_VY) / (JUMP_VY_LAND - JUMP_VY);
    const tc = Math.min(1, Math.max(0, t));
    // Most tucked at apex (t≈0.5): sine-shaped
    return Math.abs(Math.sin(tc * Math.PI)); // 0 at launch & land, 1 at apex
  }

  function isAirborne(f) {
    return !f.onGround || f.state === 'jump';
  }

  // Jump attacks should hold attack pose, not spin.
  function isJumpAttack(f) {
    return f.state === 'attack' && (f.move === 'kate.jP' || f.move === 'kate.jK');
  }

  // --- Motion streak helper ---
  // Draws a faint ghost echo of the front arm/leg at a small offset behind motion.
  function drawStreaks(ctx, f, p) {
    const fc = f.facing;
    const X  = (lx) => f.x + fc * lx;
    const Y  = (ly) => f.y - ly;

    const ALPHAS = [0.13, 0.09, 0.05];
    const OFFSETS = [fc * -8, fc * -16, fc * -24]; // trail behind in facing direction

    ctx.save();
    for (let i = 0; i < 3; i++) {
      const ox = OFFSETS[i];
      const alpha = ALPHAS[i];
      // Front arm streak
      const af = p.armF;
      const shoX = p.lean * 0.6, shoY = p.hipY + 34;
      const elbowX = (shoX + af[0]) / 2, elbowY = (shoY + af[1]) / 2 - (p.punch ? 6 : 0);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = TOP;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X(shoX + 8) + ox, Y(shoY));
      ctx.lineTo(X(elbowX) + ox, Y(elbowY));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(elbowX) + ox, Y(elbowY));
      ctx.lineTo(X(af[0]) + ox, Y(af[1]));
      ctx.stroke();
      // Front leg streak
      const lf = p.legF;
      ctx.strokeStyle = LEG;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(X(6) + ox, Y(p.hipY));
      ctx.lineTo(X(lf[0] * 0.6) + ox, Y(lf[1] + 8));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(lf[0] * 0.6) + ox, Y(lf[1] + 8));
      ctx.lineTo(X(lf[0]) + ox, Y(0));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function draw(ctx,f){
    const fc=f.facing, p=poseFor(f);
    const X=(lx)=>f.x+fc*lx, Y=(ly)=>f.y-ly;

    // --- Update landing-squash state ---
    const ls = getLandState(f);
    const airborne = isAirborne(f);
    if (!airborne && ls.wasAirborne) {
      // Just landed
      ls.squashFrame = 0;
    }
    if (!airborne) {
      ls.squashFrame++;
    }
    ls.wasAirborne = airborne;

    // Landing squash: first 6 frames after landing, apply brief squash-and-stretch.
    // squashFrame=0 means we just landed this frame; squashFrame>=6 = fully recovered.
    let squashScaleX = 1, squashScaleY = 1;
    if (!airborne && ls.squashFrame < 6) {
      const prog = ls.squashFrame / 6; // 0 → 1
      // Ease out: squash at 0, normal at 1
      squashScaleY = 0.85 + 0.15 * prog;
      squashScaleX = 1.10 - 0.10 * prog;
    }

    // --- Shadow: always at ground, never rotated ---
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(f.x,f.y+2,30,7,0,0,Math.PI*2); ctx.fill();

    // --- Motion streaks (drawn before figure, behind it) ---
    const doStreaks = airborne || (f.state === 'attack') ||
                      (f.state === 'attack' && f.move && f.move.indexOf('special') >= 0);
    if (doStreaks) {
      drawStreaks(ctx, f, p);
    }

    // --- Determine if we should apply flip rotation ---
    // Air attacks: draw upright in committed pose, no somersault rotation.
    const doFlip = airborne && !isJumpAttack(f);

    // --- Compute figure center Y for rotation pivot ---
    // Body center is approximately halfway between feet (f.y) and head (f.y - headY).
    // Roughly f.y - 48 per spec.
    const pivotX = f.x;
    const pivotY = f.y - 48;

    // --- Landing squash transform ---
    // Applied around the feet (f.y) so figure squashes downward from feet level.
    // We apply it as: translate to foot, scale, translate back.
    const applySquash = (!airborne && ls.squashFrame < 6 && (squashScaleX !== 1 || squashScaleY !== 1));

    if (applySquash) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(squashScaleX, squashScaleY);
      ctx.translate(-f.x, -f.y);
    }

    if (doFlip) {
      const angle = flipAngle(f);
      const tuck  = tuckFactor(f);
      // Draw with rotation around body center
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angle);
      ctx.translate(-pivotX, -pivotY);
      // Draw the tucked figure (offset toward center = reduce limb extension)
      drawFigure(ctx, f, p, fc, tuck);
      ctx.restore();
    } else {
      drawFigure(ctx, f, p, fc, 0);
    }

    if (applySquash) {
      ctx.restore();
    }
  }

  // Draws the full figure. tuck in [0,1]: 1=fully tucked (limbs pulled in), 0=normal.
  function drawFigure(ctx, f, p, fc, tuck) {
    const X=(lx)=>f.x+fc*lx, Y=(ly)=>f.y-ly;
    // Tuck: pull limbs toward body center (reduce extension outward)
    const tk = tuck * 0.45; // max 45% retraction
    function tuckedLeg(coord) { return [coord[0] * (1 - tk), coord[1] * (1 - tk * 0.5)]; }
    function tuckedArm(coord) { return [coord[0] * (1 - tk * 0.8), coord[1] * (1 - tk * 0.3)]; }
    const legF = tuck > 0 ? tuckedLeg(p.legF) : p.legF;
    const legB = tuck > 0 ? tuckedLeg(p.legB) : p.legB;
    const armF = tuck > 0 ? tuckedArm(p.armF) : p.armF;

    const hipX=0, hipY=p.hipY, shoX=p.lean*0.6, shoY=hipY+34;
    limb(ctx, X(hipX-6),Y(hipY), X(legB[0]),Y(legB[1]+8), 11, '#4a3647');
    limb(ctx, X(legB[0]),Y(legB[1]+8), X(legB[0]-2),Y(0), 11, '#4a3647');
    ctx.fillStyle='#241f28'; ctx.beginPath(); ctx.ellipse(X(legB[0]-2),Y(2),10,6,0,0,Math.PI*2); ctx.fill();
    limb(ctx, X(shoX-8),Y(shoY), X(p.armB[0]),Y(p.armB[1]), 8, '#3a3340');
    ctx.save(); ctx.translate(X(0),Y(hipY)); ctx.rotate(fc*p.lean*0.01);
    ctx.fillStyle=SKIRT; ctx.beginPath(); ctx.moveTo(-13,0); ctx.lineTo(13,0); ctx.lineTo(17,16); ctx.quadraticCurveTo(0,22,-17,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle=TOP; rr(ctx,-13,-34,26,36,7); ctx.fill();
    ctx.restore();
    const lf=legF;
    limb(ctx, X(hipX+6),Y(hipY), X(lf[0]*0.6),Y(lf[1]+8), 12, LEG);
    limb(ctx, X(lf[0]*0.6),Y(lf[1]+8), X(lf[0]),Y(0), 12, LEG);
    ctx.fillStyle=BOOT; ctx.beginPath(); ctx.ellipse(X(lf[0]+fc*2),Y(2),12,6,0,0,Math.PI*2); ctx.fill();
    const af=armF; const elbowX=(shoX+af[0])/2, elbowY=(shoY+af[1])/2 - (p.punch?6:0);
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
