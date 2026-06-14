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
    // Decay flash
    if (flash > 0) { flash *= 0.72; if (flash < 0.01) flash = 0; }
    // Decay combo timer
    if (comboTimer > 0) comboTimer--;
  }

  function shakeOffset() {
    const rx = shake ? (Math.random()-0.5)*shake*2 : 0;
    const ry = shake ? (Math.random()-0.5)*shake*2 : 0;
    return { x: rx + punchX, y: ry + punchY };
  }

  function drawFlash(ctx, vw, vh) {
    if (flash <= 0) return;
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, vw, vh);
    ctx.restore();
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

  root.ArtFX = { hitSpark, step, shakeOffset, drawSparks, drawHUD, banner, drawFlash, cameraPunch, setCombo };
})(window);
