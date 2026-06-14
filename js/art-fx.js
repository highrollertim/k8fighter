(function (root) {
  'use strict';
  const FC = root.FC;
  let sparks = [];
  let shake = 0;

  function hitSpark(ev) {
    if (!ev) return;
    const d = ev.defender; if (!d) return;
    const n = ev.type === 'block' ? 5 : 12;
    for (let i = 0; i < n; i++) {
      sparks.push({ x: d.x, y: d.y - 60, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.6)*6,
        life: 12 + Math.random()*8, color: ev.type === 'block' ? '#9bd4ff' : '#ffd95a' });
    }
    shake = Math.max(shake, ev.type === 'block' ? 3 : (ev.move && ev.move.knockdown ? 9 : 6));
  }

  function step() {
    for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.4; s.life--; }
    sparks = sparks.filter(s => s.life > 0);
    if (shake > 0) shake *= 0.8;
    if (shake < 0.3) shake = 0;
  }

  function shakeOffset() {
    return shake ? { x: (Math.random()-0.5)*shake*2, y: (Math.random()-0.5)*shake*2 } : { x:0, y:0 };
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

  function drawHUD(ctx, kate, bungus, match, vw) {
    bar(ctx, 24, 24, 360, 24, kate.health, FC.MAX_HEALTH, '#d4ff5a', false, vw);
    bar(ctx, 24, 24, 360, 24, bungus.health, FC.MAX_HEALTH, '#c0563f', true, vw);
    bar(ctx, 24, 54, 200, 10, kate.meter, FC.MAX_METER, '#5ad4ff', false, vw);
    bar(ctx, 24, 54, 200, 10, bungus.meter, FC.MAX_METER, '#d4a25a', true, vw);
    ctx.fillStyle = '#fff'; ctx.font = '700 16px "Trebuchet MS",sans-serif';
    ctx.textAlign = 'left'; ctx.fillText('KATE', 24, 84);
    ctx.textAlign = 'right'; ctx.fillText('BUNGUS', vw - 24, 84);
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

  root.ArtFX = { hitSpark, step, shakeOffset, drawSparks, drawHUD, banner };
})(window);
