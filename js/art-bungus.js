// js/art-bungus.js — fungal brute rig + pustule/decay layer. Browser only.
(function (root) {
  'use strict';
  const BODY='#79896a', BODY_HI='#8a9a76', DARK='#69795a', MOUTH='#1a0f0f',
        BONE='#d8d0b0', GLOW='#d4ff5a', PUS_A='#e4ff8a', PUS_B='#9bbf4a', CAP='#7a2f22', STEM='#c8b088';

  // --- per-fighter landing-squash state, keyed by fighter object ---
  const _landState = new WeakMap(); // { wasAirborne: bool, squashFrame: int }

  function getLandState(f) {
    if (!_landState.has(f)) _landState.set(f, { wasAirborne: false, squashFrame: 0 });
    return _landState.get(f);
  }

  function poseFor(f){
    const m=f.move;
    if(f.state==='crouch') return {lean:0,bodyY:14,armF:0,mouth:0,sink:14};
    if(!f.onGround||f.state==='jump') return {lean:0,bodyY:-10,armF:0,mouth:0.4,sink:0};
    if(f.state==='hitstun') return {lean:-12,bodyY:0,armF:0,mouth:0.6,sink:0};
    if(f.state==='knockdown') return {lean:-28,bodyY:30,armF:0,mouth:0.8,sink:34};
    if(f.state==='block'||f.state==='blockstun') return {lean:-6,bodyY:0,armF:-10,mouth:0,sink:4};
    if(f.state==='attack'&&m){
      if(m==='bungus.swipe'||m==='bungus.bite') return {lean:8,bodyY:0,armF:40,mouth:1,sink:0};
      if(m==='bungus.slam') return {lean:0,bodyY:-6,armF:20,mouth:0.7,sink:0};
      if(m==='bungus.spore') return {lean:6,bodyY:0,armF:24,mouth:0.5,sink:0};
      return {lean:4,bodyY:0,armF:26,mouth:0.6,sink:0};
    }
    return {lean:0,bodyY:Math.sin(f.stateFrame*0.1)*2,armF:0,mouth:0.15,sink:0};
  }

  function pustule(ctx,x,y,r){
    const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r);
    g.addColorStop(0,PUS_A); g.addColorStop(1,PUS_B);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x-r*0.3,y-r*0.3,r*0.25,0,Math.PI*2); ctx.fill();
  }
  function mushroom(ctx,x,y,s,col){
    ctx.fillStyle=STEM; ctx.fillRect(x-1.5*s,y,3*s,9*s);
    ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x,y,8*s,5*s,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#e8d0a0'; ctx.beginPath(); ctx.arc(x-2*s,y-1*s,1*s,0,Math.PI*2); ctx.arc(x+3*s,y,0.8*s,0,Math.PI*2); ctx.fill();
  }

  // --- Tumble/clumsy spin helpers ---
  // Bungus is a heavy creature: it doesn't somersault cleanly.
  // We give it a partial, floppy tumble: ~0.65 of a full rotation at peak,
  // with a wobble overshoot that makes it read as flailing rather than gymnastic.
  // vy keying mirrors Kate's approach: vy=-15 at launch, ~+15 at landing.
  const JUMP_VY = -15;
  const JUMP_VY_LAND = 15;

  function tumbleAngle(f) {
    const vy = (typeof f.vy === 'number') ? f.vy : 0;
    // t: 0 at launch, 1 at landing
    const t = (vy - JUMP_VY) / (JUMP_VY_LAND - JUMP_VY);
    const tc = Math.min(1, Math.max(0, t));

    // Clumsy arc: peaks at ~0.65 turn (t=0.5), then partially snaps back.
    // We use a shape that overshoots a bit and settles: sin(tc*pi) gives a
    // hill shape (0 at start, 1 at apex, 0 at end). We scale it and add a
    // wobble. Max rotation = 0.65 * 2pi. At apex it's farthest, not cleanly
    // recovered at landing (Bungus "thuds" in still slightly leaned).
    const baseAngle = Math.sin(tc * Math.PI) * (Math.PI * 1.3); // ~0.65 turns at apex
    // Add a small high-freq wobble for the floppy flailing feel
    const wobble = Math.sin(tc * Math.PI * 3) * 0.18;
    return f.facing * (baseAngle + wobble);
  }

  // Ear/limb flop factor during tumble: how much extra exaggeration to add.
  // Ranges 0..1; peaks at mid-jump.
  function flopFactor(f) {
    const vy = (typeof f.vy === 'number') ? f.vy : 0;
    const t = (vy - JUMP_VY) / (JUMP_VY_LAND - JUMP_VY);
    const tc = Math.min(1, Math.max(0, t));
    return Math.sin(tc * Math.PI); // 0 at launch/land, 1 at apex
  }

  function isAirborne(f) {
    return !f.onGround || f.state === 'jump';
  }

  // --- Motion streaks ---
  // Draw 2-3 faint ghost echoes of the swiping arm behind Bungus during attacks/tumble.
  // Bungus arm is drawn at translated (50,4) local coordinates with rotation fc*armF*0.014.
  // We draw smeared copies at small offsets in the facing direction.
  function drawStreaks(ctx, f, p, cx, by) {
    const fc = f.facing;
    const ALPHAS  = [0.12, 0.08, 0.04];
    const OFFSETS = [fc * -7, fc * -14, fc * -21];

    // Arm parameters (matching main draw)
    const armRot = fc * p.armF * 0.014;

    ctx.save();
    for (let i = 0; i < 3; i++) {
      const ox = OFFSETS[i];
      ctx.globalAlpha = ALPHAS[i];
      // Translate to arm pivot, apply same rotation, draw arm ellipse
      ctx.save();
      ctx.translate(cx + ox, by);
      ctx.rotate(fc * p.lean * 0.01); // match body lean
      ctx.save();
      ctx.translate(50, 4);
      ctx.rotate(armRot);
      ctx.fillStyle = DARK;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function draw(ctx,f){
    const fc=f.facing, p=poseFor(f);
    const cx=f.x, by=f.y - 60 + p.bodyY + p.sink;

    // --- Update landing-squash state ---
    const ls = getLandState(f);
    const airborne = isAirborne(f);
    if (!airborne && ls.wasAirborne) {
      // Just landed — reset squash counter
      ls.squashFrame = 0;
    }
    if (!airborne) {
      ls.squashFrame++;
    }
    ls.wasAirborne = airborne;

    // Heavy landing squash: Bungus is bulky — more squash than Kate.
    // scaleY ~0.8, scaleX ~1.15, recovering over 7 frames.
    let squashScaleX = 1, squashScaleY = 1;
    if (!airborne && ls.squashFrame < 7) {
      const prog = ls.squashFrame / 7; // 0 → 1
      squashScaleY = 0.80 + 0.20 * prog; // 0.80 → 1.0
      squashScaleX = 1.15 - 0.15 * prog; // 1.15 → 1.0
    }

    // --- Shadow: always flat at ground, drawn BEFORE any rotation ---
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(f.x,f.y+2,38,8,0,0,Math.PI*2); ctx.fill();

    // --- Motion streaks for attacks and tumble (drawn before figure) ---
    const isAttacking = f.state === 'attack' && f.move &&
      (f.move === 'bungus.swipe' || f.move === 'bungus.bite' ||
       f.move === 'bungus.slam'  || f.move === 'bungus.spore');
    const doStreaks = (airborne || isAttacking) && p.armF !== 0;
    if (doStreaks) {
      drawStreaks(ctx, f, p, cx, by);
    }

    // --- Landing squash transform (applied around feet) ---
    const applySquash = !airborne && ls.squashFrame < 7 && (squashScaleX !== 1 || squashScaleY !== 1);
    if (applySquash) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(squashScaleX, squashScaleY);
      ctx.translate(-f.x, -f.y);
    }

    // --- Tumble rotation when airborne ---
    const doTumble = airborne;
    const pivotX = f.x;
    const pivotY = f.y - 60; // body center for Bungus

    if (doTumble) {
      const angle = tumbleAngle(f);
      const flop  = flopFactor(f);
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angle);
      ctx.translate(-pivotX, -pivotY);
      drawBungus(ctx, f, p, fc, flop);
      ctx.restore();
    } else {
      drawBungus(ctx, f, p, fc, 0);
    }

    if (applySquash) {
      ctx.restore();
    }

    // --- Floating spore particles (always, cosmetic) ---
    ctx.fillStyle=GLOW; ctx.globalAlpha=0.5;
    for(let i=0;i<3;i++){ const a=(f.stateFrame*0.03+i*2); ctx.beginPath(); ctx.arc(cx+Math.cos(a)*46, by-20+Math.sin(a*1.3)*30, 1.6,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
  }

  // Draws the full Bungus figure. flop in [0,1]: 1 = maximum ear/limb flail, 0 = normal.
  function drawBungus(ctx, f, p, fc, flop) {
    const cx=f.x, by=f.y - 60 + p.bodyY + p.sink;

    ctx.save(); ctx.translate(cx,by); ctx.rotate(fc*p.lean*0.01);

    // --- Ears (with flop exaggeration during tumble) ---
    // Left ear
    const earFlopL = flop * 12; // ears fling outward during flail
    const earFlopR = flop * -8;
    ctx.fillStyle=DARK;
    ctx.beginPath();
    ctx.moveTo(-14,-48);
    ctx.quadraticCurveTo(-22 - earFlopL, -92 + earFlopL * 0.5, -8 - earFlopL * 0.3, -92 + earFlopL * 0.3);
    ctx.quadraticCurveTo(-2,-78,-6,-46);
    ctx.closePath(); ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(12,-46);
    ctx.quadraticCurveTo(24 - earFlopR, -86 + earFlopR * 0.4, 34 - earFlopR * 0.5, -78 + earFlopR * 0.3);
    ctx.quadraticCurveTo(26,-66,18,-44);
    ctx.closePath(); ctx.fill();

    // Ear inner
    ctx.fillStyle='#3c4a32'; ctx.beginPath(); ctx.ellipse(-11,-72,4,7,0,0,Math.PI*2); ctx.fill();

    // --- Body ---
    const g=ctx.createRadialGradient(-10,-10,8,0,10,64); g.addColorStop(0,BODY_HI); g.addColorStop(1,DARK);
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,10-p.sink*0.5,58,52+(-p.sink*0.4),0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=BODY_HI; ctx.beginPath(); ctx.ellipse(0,18,34,32,0,0,Math.PI*2); ctx.fill();

    // --- Back arm/spine markings ---
    ctx.strokeStyle='#46543a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-34,-6); ctx.quadraticCurveTo(-38,16,-30,40); ctx.stroke();
    ctx.strokeStyle=BONE; ctx.lineWidth=2; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-37,2+i*10); ctx.lineTo(-29,4+i*10); ctx.stroke(); }
    ctx.fillStyle=DARK; ctx.beginPath(); ctx.ellipse(-52,4,14,22,0,0,Math.PI*2); ctx.fill();

    // --- Front arm (floppy during tumble: exaggerate swing) ---
    const armFlopExtra = flop * 0.25; // adds to rotation during flail
    ctx.save(); ctx.translate(50,4); ctx.rotate(fc*p.armF*0.014 + fc*armFlopExtra); ctx.beginPath(); ctx.ellipse(0,0,14,22,0,0,Math.PI*2); ctx.fill(); ctx.restore();

    // --- Pustule belly + drip ---
    pustule(ctx,-18,28,11); ctx.strokeStyle=PUS_B; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-18,39); ctx.quadraticCurveTo(-20,50,-17,58); ctx.stroke();
    pustule(ctx,20,6,8); pustule(ctx,32,30,6);

    // --- Head ---
    const hy=-40;
    ctx.fillStyle=BODY; ctx.beginPath(); ctx.ellipse(fc*4,hy,31,27,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=BODY_HI; ctx.beginPath(); ctx.ellipse(fc*4,hy+6,18,15,0,0,Math.PI*2); ctx.fill();

    // Eyes
    for(const ex of [-12,12]){ ctx.fillStyle='#0c1208'; ctx.beginPath(); ctx.ellipse(fc*4+ex,hy-2,7,8,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=GLOW; ctx.beginPath(); ctx.arc(fc*4+ex,hy-2,3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.25; ctx.beginPath(); ctx.arc(fc*4+ex,hy-2,6,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }

    // Mouth
    const mo=6+p.mouth*10;
    ctx.fillStyle=MOUTH; ctx.beginPath(); ctx.moveTo(fc*4-14,hy+14); ctx.quadraticCurveTo(fc*4,hy+14+mo,fc*4+14,hy+14); ctx.quadraticCurveTo(fc*4+8,hy+14+mo*0.6,fc*4,hy+14+mo*0.6); ctx.quadraticCurveTo(fc*4-8,hy+14+mo*0.6,fc*4-14,hy+14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=BONE; ctx.lineWidth=1.8; ctx.beginPath();
    for(let i=-12;i<=12;i+=5){ ctx.moveTo(fc*4+i,hy+14); ctx.lineTo(fc*4+i+2,hy+19); } ctx.stroke();
    ctx.strokeStyle=PUS_B; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(fc*4,hy+14+mo*0.6); ctx.quadraticCurveTo(fc*4+1,hy+26,fc*4,hy+30); ctx.stroke();

    // Mushroom cap decorations
    mushroom(ctx,-14,-58,1,CAP); mushroom(ctx,14,-54,0.8,'#5e2618'); mushroom(ctx,2,-62,0.7,CAP);

    ctx.restore();
  }

  root.ArtBungus = { draw };
})(window);
