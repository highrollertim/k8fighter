// js/main.js — boot, fixed-timestep loop, wiring.
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const titleEl = document.getElementById('overlay-title');
  const movesEl = document.getElementById('overlay-moves');
  const endEl = document.getElementById('overlay-end');
  const endTitleEl = document.getElementById('endTitle');
  const endMsgEl = document.getElementById('endMsg');
  const muteBtn = document.getElementById('muteBtn');
  const input = Input.attach(window);

  let scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    scale = Math.min(canvas.width / FC.VW, canvas.height / FC.VH);
  }
  window.addEventListener('resize', resize); resize();

  let state = 'title';
  let kate, bungus;
  const kMotion = Input.createMotion();
  let frame = 0;
  let projectiles = [];
  let aiDecision = { dir: 5, jump: false, attack: null };
  let aiHold = 0;
  let match;
  let lastPhase = null;
  let muted = false;

  // ---- Move list overlay setup ----
  const MOVES_LIST = [
    ['Move', 'Arrows'], ['Jump', 'Up / Space'], ['Crouch', 'Down'],
    ['Punch (light/heavy)', 'A tap / hold'], ['Kick (light/heavy)', 'S tap / hold'],
    ['Block', 'hold Away (crouch for lows)'], ['Throw', 'A + S'],
    ['Fireball', 'Down, Down-Forward, Forward + A'],
    ['Uppercut', 'Forward, Down, Down-Forward + A'],
    ['Spin Kick', 'Down, Down-Back, Back + S'],
    ['Super (full meter)', 'QCF, QCF + A'],
  ];
  const moveListEl = document.getElementById('moveList');
  for (const [name, keys] of MOVES_LIST) {
    const li = document.createElement('li');
    li.innerHTML = '<b>' + name + '</b> — ' + keys;
    moveListEl.appendChild(li);
  }

  function showOverlay(el) {
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
  }
  function hideOverlay(el) {
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }

  function showEnd() {
    state = 'end';
    endTitleEl.textContent = match.matchWinner === 'kate' ? 'YOU WIN' : 'DEFEATED';
    endMsgEl.textContent = match.matchWinner === 'kate' ? 'Bungus has been composted.' : 'The fungus spreads...';
    showOverlay(endEl);
  }

  function resetRound() {
    kate = Fighter.create('kate', FC.VW / 2 - FC.START_GAP, 1);
    bungus = Fighter.create('bungus', FC.VW / 2 + FC.START_GAP, -1);
    projectiles = [];
    aiDecision = { dir: 5, jump: false, attack: null };
    aiHold = 0;
    // Reset button tracking
    btn.A.down = false; btn.A.frame = 0; btn.A.fired = false; btn.A.pending = null;
    btn.S.down = false; btn.S.frame = 0; btn.S.fired = false; btn.S.pending = null;
  }

  function newMatch() {
    match = Match.create();
    lastPhase = null;
    resetRound();
    hideOverlay(titleEl);
    hideOverlay(endEl);
    hideOverlay(movesEl);
    state = 'fight';
  }

  // Track press timing for A/S to distinguish tap (light) vs hold (heavy)
  const btn = { A: { down: false, frame: 0, fired: false, pending: null }, S: { down: false, frame: 0, fired: false, pending: null } };
  function buttonAttack() {
    for (const name of ['A', 'S']) {
      const b = btn[name];
      const held = input.keys[name];
      if (held && !b.down) { b.down = true; b.frame = frame; b.fired = false; }
      if (!held && b.down) {
        b.down = false;
        if (!b.fired) b.pending = { button: name, heavy: (frame - b.frame) >= FC.HEAVY_HOLD };
      }
      if (held && b.down && !b.fired && (frame - b.frame) >= FC.HEAVY_HOLD) {
        b.fired = true; b.pending = { button: name, heavy: true };
      }
    }
    if (input.keys.A && input.keys.S && (frame - btn.A.frame < 4 || frame - btn.S.frame < 4)) {
      btn.A.fired = btn.S.fired = true; btn.A.pending = btn.S.pending = null;
      return { throw: true };
    }
    const out = btn.A.pending || btn.S.pending || null;
    btn.A.pending = btn.S.pending = null;
    if (out && out.button) btn[out.button].fired = true;
    return out;
  }

  function playerIntent() {
    const dir = Input.dirFromKeys(input.arrows());
    Input.pushDir(kMotion, dir, frame);
    const a = buttonAttack();
    const jump = input.consumeEdge('jump');
    return { dir, jump, attack: a ? Object.assign({ button: 'A', heavy: false, special: null, throw: false }, a) : null };
  }

  function busy(f) { return f.state === 'attack' || f.state === 'hitstun' || f.state === 'knockdown' || f.state === 'blockstun'; }

  function startSpecial(f, key) {
    f.state = 'attack'; f.move = key; f.stateFrame = 0; f.hitThisMove = false; f.vx = 0;
  }

  function applyAttack(f, intent, opp) {
    if (!intent.attack) return;
    if (intent.attack.throw) {
      if (busy(f)) return;
      const ev = Combat.tryThrow(f, opp, MoveSelect.throwKey(f.id));
      if (ev) ArtFX.hitSpark(ev);
      Fighter.start(f, MoveSelect.throwKey(f.id));
      return;
    }

    // Special-cancel: allow interrupting a cancelable move that has connected
    const canCancel = f.state === 'attack' && Moves.TABLE[f.move] &&
      Moves.TABLE[f.move].cancelable && f.hitThisMove;

    // Detect special move for Kate via motion buffer; AI can pass intent.attack.special directly
    let sp = intent.attack.special || null;
    if (!sp && f.id === 'kate' && intent.attack.button) {
      sp = Specials.detect(kMotion, intent.attack.button, f.meter >= FC.MAX_METER, frame, f.facing);
    }

    if (sp) {
      if (!busy(f) || canCancel) {
        // Super requires full meter and spends it
        if (Moves.TABLE[sp] && Moves.TABLE[sp].meterGain === 0 && sp.endsWith('super')) {
          if (f.meter < FC.MAX_METER) return; // not enough meter
          f.meter = 0;
        }
        startSpecial(f, sp);
        return;
      }
    }

    // Normal attack path
    if (busy(f)) return;
    const key = MoveSelect.normalKey(f, { dir: intent.dir, heavy: intent.attack.heavy, button: intent.attack.button });
    if (!f.onGround) { f.move = key; f.state = 'attack'; f.stateFrame = 0; f.hitThisMove = false; f.vx = 0; }
    else Fighter.start(f, key);
  }

  function sim() {
    frame++;
    Match.step(match, kate.health, bungus.health);
    ArtFX.step();

    // Detect phase transition into a new roundStart and reset fighters exactly once
    if (match.phase === 'roundStart' && lastPhase !== 'roundStart') {
      resetRound();
    }
    lastPhase = match.phase;

    if (match.phase !== 'fight') {
      if (match.phase === 'matchEnd' && state !== 'end') showEnd();
      return;
    }

    // ---- fight logic: player intent, applyAttack, steps, combat, projectiles ----
    const pi = playerIntent();
    applyAttack(kate, pi, bungus);
    Fighter.step(kate, pi, bungus);
    kate.blockingLow = kate.onGround && kate.state === 'crouch' && ((kate.facing === 1 && pi.dir === 1) || (kate.facing === -1 && pi.dir === 3));

    // Bungus AI (perception delay; attack consumed once)
    if (aiHold <= 0) { aiDecision = BungusAI.decide(bungus, kate, Math.random, BungusAI.DIFFICULTY, frame); aiHold = BungusAI.DIFFICULTY.reactFrames - 1; }
    else { aiHold--; }
    const bi = { dir: aiDecision.dir, jump: aiDecision.jump, attack: aiDecision.attack };
    aiDecision.attack = null;        // consume the attack so it isn't re-applied each held frame
    aiDecision.jump = false;
    applyAttack(bungus, bi, kate);
    Fighter.step(bungus, bi, kate);
    bungus.blockingLow = bungus.onGround && bungus.state === 'crouch' && ((bungus.facing === 1 && bi.dir === 1) || (bungus.facing === -1 && bi.dir === 3));

    const ev1 = Combat.resolve(kate, bungus);
    if (ev1) ArtFX.hitSpark(ev1);
    const ev2 = Combat.resolve(bungus, kate);
    if (ev2) ArtFX.hitSpark(ev2);

    // Projectile spawning — trigger on the first active frame of a projectile move
    for (const f of [kate, bungus]) {
      if (f.state === 'attack' && f.move && Moves.TABLE[f.move] && Moves.TABLE[f.move].projectile) {
        const mv = Moves.TABLE[f.move];
        if (f.stateFrame === mv.startup) {
          const proj = Specials.spawnProjectile(mv.projectile, { x: f.x + f.facing * 40, y: f.y, facing: f.facing });
          projectiles.push(proj);
        }
      }
    }

    // Step projectiles, check hits against opponent
    for (const p of projectiles) {
      Specials.stepProjectile(p);
      const target = p.owner === 'kate' ? bungus : kate;
      const ev = Combat.applyProjectileHit(p, target);
      if (ev) ArtFX.hitSpark(ev);
    }
    projectiles = projectiles.filter(p => !p.dead);
  }

  let acc = 0, last = 0;
  function frameLoop(t) {
    const dt = Math.min((t - last) / 1000 || 0, 0.1); last = t;
    if (state === 'fight') { acc += dt; let steps = 0; while (acc >= FC.DT && steps < 5) { sim(); acc -= FC.DT; steps++; } }
    render();
    requestAnimationFrame(frameLoop);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sh = match ? ArtFX.shakeOffset() : { x: 0, y: 0 };
    const ox = (canvas.width - FC.VW * scale) / 2 + sh.x * scale;
    const oy = (canvas.height - FC.VH * scale) / 2 + sh.y * scale;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    ArtStages.draw(ctx, 0, FC.VW, FC.VH);
    if (kate && bungus) {
      // Draw projectiles behind fighters
      for (const p of projectiles) {
        ctx.fillStyle = p.owner === 'kate' ? '#5ad4ff' : '#9bbf4a';
        ctx.beginPath(); ctx.arc(p.x, p.y - 60, 16, 0, Math.PI * 2); ctx.fill();
      }
      ArtBungus.draw(ctx, bungus);
      ArtKate.draw(ctx, kate);
      ArtFX.drawSparks(ctx);
      if (match && (state === 'fight' || state === 'end')) {
        ArtFX.drawHUD(ctx, kate, bungus, match, FC.VW);
        ArtFX.banner(ctx, match, FC.VW, FC.VH);
      }
    }
  }

  // ---- Mute button ----
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    if (window.Audio && typeof Audio.setMuted === 'function') Audio.setMuted(muted);
    if (window.Voice && typeof Voice.setMuted === 'function') Voice.setMuted(muted);
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', String(muted));
  });

  // ---- Keyboard global handlers ----
  let movesVisible = false;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
      if (state === 'title' || state === 'end') newMatch();
      return;
    }
    if (e.code === 'KeyH') {
      movesVisible = !movesVisible;
      if (movesVisible) showOverlay(movesEl);
      else hideOverlay(movesEl);
      return;
    }
    if (e.code === 'Escape' && movesVisible) {
      movesVisible = false;
      hideOverlay(movesEl);
      return;
    }
  });

  requestAnimationFrame(frameLoop);
})();
