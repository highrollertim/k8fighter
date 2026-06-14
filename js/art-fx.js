(function (root) {
  'use strict';
  const FC = root.FC;
  let sparks = [];
  let shake = 0;
  // Directional camera punch (decaying offset)
  let punchX = 0, punchY = 0;
  // Full-screen flash (0..1, decays to 0)
  let flash = 0;
  // Combo popup
  let comboCount = 0, comboTimer = 0;
  const COMBO_DURATION = 90; // frames to show combo

  // --- Super Cinematic (darken vignette + white flash) ---
  // superFlash: 0..1, bright white overlay that decays quickly
  // superDarken: 0..1, dark vignette that lingers a bit longer
  let superFlash = 0;
  let superDarken = 0;

  function hitSpark(ev) {
    if (!ev) return;
    const d = ev.defender; if (!d) return;
    const isBig = ev.move && (ev.move.knockdown || ev.move.damage >= 9 || ev.projectile);
    // More sparks for heavier hits
    const n = ev.type === 'block' ? 5 : (isBig ? 22 : 12);
    for (let i = 0; i < n; i++) {
      const speed = isBig ? 9 : 6;
      sparks.push({ x: d.x, y: d.y - 60, vx: (Math.random()-0.5)*speed, vy: (Math.random()-0.75)*speed,
        life: (isBig ? 18 : 12) + Math.random()*8, color: ev.type === 'block' ? '#9bd4ff' : (isBig ? '#ff9d3a' : '#ffd95a') });
    }
    // Add extra trailing sparks for big hits
    if (ev.type !== 'block' && isBig) {
      for (let i = 0; i < 8; i++) {
        sparks.push({ x: d.x, y: d.y - 60, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3,
          life: 24 + Math.random()*12, color: '#ffffff' });
      }
    }
    shake = Math.max(shake, ev.type === 'block' ? 3 : (ev.move && ev.move.knockdown ? 9 : 6));
    // Screen flash on big hits
    if (ev.type !== 'block' && isBig) {
      flash = Math.max(flash, 0.45);
    }
  }

  function cameraPunch(dx, dy) {
    punchX = dx || 0;
    punchY = dy || 0;
  }

  function step() {
    for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.4; s.life--; }
    sparks = sparks.filter(s => s.life > 0);
    if (shake > 0) shake *= 0.8;
    if (shake < 0.3) shake = 0;
    // Decay directional punch
    punchX *= 0.75; punchY *= 0.75;
    if (Math.abs(punchX) < 0.2) punchX = 0;
    if (Math.abs(punchY) < 0.2) punchY = 0;
    // Decay combo timer
    if (comboTimer > 0) comboTimer--;
    // NOTE: flash, superFlash, superDarken are intentionally NOT decayed here.
    // They are decayed in stepCinematic() which runs every real rAF frame so
    // they recover at wall-clock speed regardless of slow-mo or paused sim.
  }

  // Decay screen-overlay values in REAL frame time (called once per rAF, not per sim step).
  // This ensures flash/vignette clear promptly even during slow-mo or when state==='end'.
  function stepCinematic() {
    if (flash > 0)      { flash      *= 0.72; if (flash      < 0.01)  flash      = 0; }
    if (superFlash > 0) { superFlash *= 0.78; if (superFlash < 0.01)  superFlash = 0; }
    if (superDarken > 0){ superDarken *= 0.94; if (superDarken < 0.005) superDarken = 0; }
  }

  // Reset all cinematic state — call at resetRound / newMatch so nothing bleeds across rounds.
  function resetCinematic() {
    flash = 0; superFlash = 0; superDarken = 0;
  }

  function shakeOffset() {
    const rx = shake ? (Math.random()-0.5)*shake*2 : 0;
    const ry = shake ? (Math.random()-0.5)*shake*2 : 0;
    return { x: rx + punchX, y: ry + punchY };
  }

  // cw/ch are the PHYSICAL canvas pixel dimensions (canvas.width/height).
  // We reset to identity so the fill covers the entire canvas regardless of the
  // zoomed/letterboxed transform that is active when this is called.
  function drawFlash(ctx, cw, ch) {
    if (flash <= 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }

  // Trigger the super-activation cinematic: vignette darken + white flash.
  function triggerSuperCinematic() {
    superFlash = 1.0;
    superDarken = 0.72;
  }

  // Draw the super cinematic overlay: dark vignette bars + bright white flash.
  // Called from main render during the cinematic window (while superDarken or superFlash > 0).
  // cw/ch are the PHYSICAL canvas pixel dimensions so the fill covers the entire canvas
  // regardless of the zoomed/letterboxed transform that may be active.
  function drawSuperCinematic(ctx, cw, ch) {
    if (superDarken <= 0 && superFlash <= 0) return;
    ctx.save();
    // Reset to identity so overlays cover the full physical canvas, not just the virtual rect.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Dark vignette overlay
    if (superDarken > 0) {
      ctx.globalAlpha = superDarken * 0.55;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cw, ch);
      // Letterbox bars (top/bottom) — extra dramatic darkening
      ctx.globalAlpha = superDarken * 0.6;
      const barH = Math.round(ch * 0.12);
      ctx.fillRect(0, 0, cw, barH);
      ctx.fillRect(0, ch - barH, cw, barH);
    }
    // White flash on top
    if (superFlash > 0) {
      ctx.globalAlpha = superFlash * 0.85;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.restore();
  }

  function superCinematicActive() {
    return superDarken > 0.005 || superFlash > 0.01;
  }

  function setCombo(n) {
    comboCount = n;
    comboTimer = COMBO_DURATION;
  }

  function drawCombo(ctx, vw) {
    if (comboTimer <= 0 || comboCount < 2) return;
    ctx.save();
    const alpha = Math.min(1, comboTimer / 20);  // fade in/out at edges
    const fadeOut = Math.min(1, comboTimer / 20);
    const scale = 1 + Math.min(0.35, (COMBO_DURATION - comboTimer) * 0.015); // pop-in scale
    ctx.globalAlpha = Math.min(alpha, fadeOut);
    ctx.textAlign = 'center';
    const cx = vw / 2;
    const cy = 130;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = '900 38px "Trebuchet MS",sans-serif';
    ctx.fillText(comboCount + ' HITS!', 3, 3);
    // Main text, color shifts with count
    const hue = Math.min(comboCount * 15, 60);
    ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
    ctx.fillText(comboCount + ' HITS!', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function drawSparks(ctx) {
    for (const s of sparks) {
      ctx.globalAlpha = Math.min(1, s.life / 12); ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(s.x, s.y, 3 + s.life*0.2, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function bar(ctx, x, y, w, h, val, max, color, flip, vw) {
    const bx = flip ? vw - x - w : x;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, y, w, h);
    const fw = w * Math.max(0, val) / max;
    ctx.fillStyle = color; ctx.fillRect(flip ? bx + w - fw : bx, y, fw, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx, y, w, h);
  }

  function drawHUD(ctx, kate, bungus, match, vw, vh) {
    drawCombo(ctx, vw);
    bar(ctx, 24, 24, 360, 24, kate.health, FC.MAX_HEALTH, '#d4ff5a', false, vw);
    bar(ctx, 24, 24, 360, 24, bungus.health, FC.MAX_HEALTH, '#c0563f', true, vw);
    bar(ctx, 24, 54, 200, 10, kate.meter, FC.MAX_METER, '#5ad4ff', false, vw);
    bar(ctx, 24, 54, 200, 10, bungus.meter, FC.MAX_METER, '#d4a25a', true, vw);
    // SUPER label under each meter bar
    ctx.font = '700 10px "Trebuchet MS",sans-serif';
    ctx.fillStyle = '#9fe'; ctx.textAlign = 'left'; ctx.fillText('SUPER', 24, 74);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'right'; ctx.fillText('SUPER', vw - 24, 74);
    ctx.fillStyle = '#fff'; ctx.font = '700 16px "Trebuchet MS",sans-serif';
    ctx.textAlign = 'left'; ctx.fillText('KATE', 24, 84);
    ctx.textAlign = 'right'; ctx.fillText('BUNGUS', vw - 24, 84);
    // Specials hint at bottom of play area
    if (vh) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.font = '600 12px "Trebuchet MS",sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText('D Fireball   F Uppercut   W Super', 24, vh - 16);
      ctx.restore();
    }
    for (let i = 0; i < FC.ROUNDS_TO_WIN; i++) {
      ctx.fillStyle = i < match.wins.kate ? '#d4ff5a' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(396 + i*18, 36, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = i < match.wins.bungus ? '#c0563f' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(vw - 396 - i*18, 36, 6, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = '700 40px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(Math.ceil(match.timer)), vw/2, 52);
  }

  function banner(ctx, match, vw, vh) {
    let text = null, color = '#e7d9a8';
    if (match.phase === 'roundStart') {
      text = match.phaseFrame < 50 ? ('ROUND ' + match.round) : 'FIGHT!';
      color = match.phaseFrame < 50 ? '#e7d9a8' : '#d4ff5a';
    } else if (match.phase === 'roundEnd') {
      text = match.lastWinner === 'draw' ? 'DRAW' : (match.timer <= 0 ? 'TIME!' : 'K.O.!');
      color = '#c0563f';
    }
    if (!text) return;
    ctx.fillStyle = color; ctx.font = '900 72px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(text, vw/2, vh/2 - 40);
  }

  root.ArtFX = { hitSpark, step, stepCinematic, resetCinematic, shakeOffset, drawSparks, drawHUD, banner, drawFlash, cameraPunch, setCombo,
    triggerSuperCinematic, drawSuperCinematic, superCinematicActive };
})(window);
