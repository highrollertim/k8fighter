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
  let stageIndex = 0;
  let kate, bungus;
  const kMotion = Input.createMotion();
  let frame = 0;
  let projectiles = [];
  let aiDecision = { dir: 5, jump: false, attack: null };
  let aiHold = 0;
  let match;
  let lastPhase = null;
  let muted = false;
  let lastVoiceFrame = -999;

  // --- Slow-motion / timeScale ---
  let timeScale = 1;
  let slowmoFrames = 0;
  let slowmoTargetScale = 0.25;

  function triggerSlowmo(frames, scale) {
    slowmoFrames = frames;
    slowmoTargetScale = scale;
    timeScale = scale;
  }

  // --- KO zoom state ---
  // zoomFactor: current zoom multiplier (1.0 = no zoom)
  // zoomFrames: remaining frames in the KO zoom window
  // zoomFocusX: virtual-space x position to center on during zoom
  let zoomFactor = 1.0;
  let zoomFrames = 0;
  let zoomFocusX = FC.VW / 2;

  // --- Match-end delay (real rAF frames) ---
  // After the match-winning KO cinematic fires we hold the ragdoll for this many
  // real frames before calling showEnd(). 0 means no pending delay.
  let endDelay = 0;

  // ---- Move list overlay setup ----
  const MOVES_LIST = [
    ['Move', 'Arrows'], ['Jump', 'Up / Space'], ['Crouch', 'Down'],
    ['Punch (light/heavy)', 'A tap / hold'], ['Kick (light/heavy)', 'S tap / hold'],
    ['Block', 'hold Away (crouch for lows)'], ['Throw', 'A + S'],
    ['Fireball', 'D  (or ↓↘→ + A)'],
    ['Uppercut', 'F  (or →↓↘ + A)'],
    ['Super (full meter)', 'W  (or QCF×2 + A)'],
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
    if (window.Voice && match.matchWinner === 'kate') Voice.say('win');
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
    // Reset cinematic state so no zoom/slowmo carries over between rounds
    timeScale = 1; slowmoFrames = 0;
    zoomFactor = 1.0; zoomFrames = 0; zoomFocusX = FC.VW / 2;
    endDelay = 0;
    if (window.ArtFX) ArtFX.resetCinematic();
  }

  function newMatch() {
    match = Match.create();
    stageIndex = Math.floor(Math.random() * ArtStages.COUNT);
    lastPhase = null;
    resetRound();
    hideOverlay(titleEl);
    hideOverlay(endEl);
    hideOverlay(movesEl);
    state = 'fight';
    // Resume audio on the Enter gesture; the bell rings at the FIGHT! transition (sim).
    if (window.Sound) Sound.startMusic();
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
    // Easy special shortcut keys (motions still work via applyAttack's detect path)
    let special = null;
    if (input.consumeEdge('spFire')) special = 'kate.fireball';
    else if (input.consumeEdge('spUpper')) special = 'kate.uppercut';
    else if (input.consumeEdge('spSuper')) special = 'kate.super';
    if (special) return { dir, jump, attack: { button: 'A', heavy: false, special, throw: false } };
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
          if (window.Sound) Sound.super();
          // Cinematic super activation: slow-mo + flash/vignette
          triggerSlowmo(36, 0.22);
          if (window.ArtFX) ArtFX.triggerSuperCinematic();
          // Clear motion buffer so a buffered QCF doesn't re-fire after slow-mo (Fix 6)
          kMotion.hist.length = 0;
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

    // Ring bell and restart music when fight phase begins (each round)
    if (match.phase === 'fight' && lastPhase === 'roundStart') {
      if (window.Sound) { Sound.startMusic(); Sound.bell(); }
      if (window.Voice) Voice.say('roundStart');
    }

    // KO sound fires once on transition into roundEnd (when there is a winner, not timeout draw)
    if (match.phase === 'roundEnd' && lastPhase === 'fight') {
      if (window.Sound && match.lastWinner && match.lastWinner !== 'draw') Sound.ko();
      // KO drama: slow-mo + zoom toward the loser
      if (match.lastWinner && match.lastWinner !== 'draw') {
        triggerSlowmo(60, 0.25);
        // Identify the loser by health (the fighter that isn't the winner)
        const loser = match.lastWinner === 'kate' ? bungus : kate;
        zoomFocusX = loser ? loser.x : FC.VW / 2;
        zoomFactor = 1.25;
        zoomFrames = 60; // real render frames of zoom (will ease out after)
        if (window.ArtFX) { ArtFX.triggerSuperCinematic(); } // flash
      }
    }
    // Fix 1: Match-winning KO gets the full cinematic + delayed end screen.
    // match.js jumps directly from 'fight' to 'matchEnd' (skipping 'roundEnd') so we
    // must detect the transition here and fire everything that the round-KO block fires.
    if (match.phase === 'matchEnd' && lastPhase !== 'matchEnd') {
      if (window.Sound && match.lastWinner && match.lastWinner !== 'draw') Sound.ko();
      if (match.lastWinner && match.lastWinner !== 'draw') {
        triggerSlowmo(60, 0.25);
        const loser = match.lastWinner === 'kate' ? bungus : kate;
        zoomFocusX = loser ? loser.x : FC.VW / 2;
        zoomFactor = 1.25;
        zoomFrames = 60;
        if (window.ArtFX) ArtFX.triggerSuperCinematic();
        // Delay the end overlay so the cinematic plays out (~1.25 s at 60 fps)
        endDelay = 75;
      }
    }

    lastPhase = match.phase;

    if (match.phase !== 'fight') {
      // showEnd() is now called by the real-frame countdown in frameLoop, NOT here.
      // (endDelay ticks down in frameLoop; when it reaches 0, showEnd() is called.)
      return;
    }

    // ---- fight logic: player intent, applyAttack, steps, combat, projectiles ----
    const pi = playerIntent();
    applyAttack(kate, pi, bungus);
    const katePreState = kate.state; const katePreHit = kate.hitThisMove;
    Fighter.step(kate, pi, bungus);
    kate.blockingLow = kate.onGround && kate.state === 'crouch' && ((kate.facing === 1 && pi.dir === 1) || (kate.facing === -1 && pi.dir === 3));
    // Whiff: kate attack ended without landing a hit
    if (window.Sound && katePreState === 'attack' && kate.state !== 'attack' && !katePreHit) Sound.whiff();

    // Bungus AI (perception delay; attack consumed once)
    if (aiHold <= 0) { aiDecision = BungusAI.decide(bungus, kate, Math.random, BungusAI.DIFFICULTY, frame); aiHold = BungusAI.DIFFICULTY.reactFrames - 1; }
    else { aiHold--; }
    const bi = { dir: aiDecision.dir, jump: aiDecision.jump, attack: aiDecision.attack };
    aiDecision.attack = null;        // consume the attack so it isn't re-applied each held frame
    aiDecision.jump = false;
    applyAttack(bungus, bi, kate);
    const bungusPreState = bungus.state; const bungusPreHit = bungus.hitThisMove;
    Fighter.step(bungus, bi, kate);
    bungus.blockingLow = bungus.onGround && bungus.state === 'crouch' && ((bungus.facing === 1 && bi.dir === 1) || (bungus.facing === -1 && bi.dir === 3));
    // Whiff: bungus attack ended without landing a hit
    if (window.Sound && bungusPreState === 'attack' && bungus.state !== 'attack' && !bungusPreHit) Sound.whiff();

    const ev1 = Combat.resolve(kate, bungus);
    if (ev1) {
      ArtFX.hitSpark(ev1);
      if (ev1.type === 'hit') {
        if (ev1.combo >= 2) ArtFX.setCombo(ev1.combo);
        if (ev1.move && (ev1.move.knockdown || ev1.move.damage >= 9)) {
          // Shove camera away from attacker (kate faces +1, punch rightward pushes bungus right)
          ArtFX.cameraPunch(kate.facing * 10, -4);
        }
      }
      if (window.Sound) {
        if (ev1.type === 'hit') {
          const isKick = ev1.move && /[ks]/i.test(ev1.move.key || '');
          if (isKick) Sound.kick(ev1.move && ev1.move.knockdown);
          else Sound.hit(ev1.move && ev1.move.knockdown);
        } else if (ev1.type === 'block') {
          Sound.block();
        }
      }
      if (window.Voice && ev1.type === 'hit' && ev1.move && ev1.move.knockdown && frame - lastVoiceFrame > 120) {
        Voice.say('bigHit'); lastVoiceFrame = frame;
      }
    }
    const ev2 = Combat.resolve(bungus, kate);
    if (ev2) {
      ArtFX.hitSpark(ev2);
      if (ev2.type === 'hit') {
        if (ev2.combo >= 2) ArtFX.setCombo(ev2.combo);
        if (ev2.move && (ev2.move.knockdown || ev2.move.damage >= 9)) {
          ArtFX.cameraPunch(bungus.facing * 10, -4);
        }
      }
      if (window.Sound) {
        if (ev2.type === 'hit') {
          const isKick = ev2.move && /[ks]/i.test(ev2.move.key || '');
          if (isKick) Sound.kick(ev2.move && ev2.move.knockdown);
          else Sound.hit(ev2.move && ev2.move.knockdown);
        } else if (ev2.type === 'block') {
          Sound.block();
        }
      }
      if (window.Voice && ev2.type === 'hit' && ev2.move && ev2.move.knockdown && frame - lastVoiceFrame > 120 && Math.random() < 0.5) {
        Voice.say('takeHit'); lastVoiceFrame = frame;
      }
    }

    // Projectile spawning — trigger on the first active frame of a projectile move
    for (const f of [kate, bungus]) {
      if (f.state === 'attack' && f.move && Moves.TABLE[f.move] && Moves.TABLE[f.move].projectile) {
        const mv = Moves.TABLE[f.move];
        if (f.stateFrame === mv.startup) {
          const proj = Specials.spawnProjectile(mv.projectile, { x: f.x + f.facing * 40, y: f.y, facing: f.facing });
          projectiles.push(proj);
          // Sound for projectile launch
          if (window.Sound) {
            if (mv.projectile === 'kate.proj') Sound.fireball();
            else if (mv.projectile === 'bungus.sporeproj') Sound.spore();
          }
        }
      }
    }

    // Step projectiles, check hits against opponent
    for (const p of projectiles) {
      Specials.stepProjectile(p);
      const target = p.owner === 'kate' ? bungus : kate;
      const ev = Combat.applyProjectileHit(p, target);
      if (ev) {
        ArtFX.hitSpark(ev);
        if (ev.type === 'hit') {
          if (ev.combo >= 2) ArtFX.setCombo(ev.combo);
          // Projectile hits always count as big — flash already set by hitSpark; add a punch
          const projOwner = p.owner === 'kate' ? kate : bungus;
          ArtFX.cameraPunch(projOwner.facing * 8, -3);
        }
        if (window.Sound) {
          if (ev.type === 'hit') Sound.hit(false);
          else if (ev.type === 'block') Sound.block();
        }
      }
    }
    projectiles = projectiles.filter(p => !p.dead);
  }

  let acc = 0, last = 0;
  function frameLoop(t) {
    const dt = Math.min((t - last) / 1000 || 0, 0.1); last = t;

    // --- Slow-motion: update timeScale each real frame ---
    if (slowmoFrames > 0) {
      slowmoFrames--;
      timeScale = slowmoTargetScale;
      // (no dead no-op block here — lerp recovery runs in the else branch below)
    } else {
      // Lerp timeScale back toward 1 when slowmo has expired
      if (timeScale < 1) {
        timeScale += (1 - timeScale) * 0.18;
        if (timeScale > 0.99) timeScale = 1;
      }
    }

    // Fix 2: Decay screen-overlay values every real frame so they clear at wall-clock
    // speed regardless of slow-mo factor or whether sim is paused (state==='end').
    if (window.ArtFX) ArtFX.stepCinematic();

    // Fix 1: Tick the match-end delay countdown in real frames. When it expires,
    // show the end screen. The fighters are already frozen (sim early-returns on
    // non-fight phases) giving us the dramatic ragdoll beat before the overlay.
    if (endDelay > 0 && match && match.phase === 'matchEnd' && state !== 'end') {
      endDelay--;
      if (endDelay === 0) showEnd();
    }

    if (state === 'fight') { acc += dt * timeScale; let steps = 0; while (acc >= FC.DT && steps < 5) { sim(); acc -= FC.DT; steps++; } }
    render();
    requestAnimationFrame(frameLoop);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sh = match ? ArtFX.shakeOffset() : { x: 0, y: 0 };

    // --- KO zoom: update zoomFactor / zoomFrames each render frame ---
    if (zoomFrames > 0) {
      zoomFrames--;
      // Hold zoom at target while frames remain
    } else if (zoomFactor > 1.0) {
      // Ease zoom back toward 1.0 when window is over
      zoomFactor += (1.0 - zoomFactor) * 0.12;
      if (zoomFactor < 1.005) zoomFactor = 1.0;
    }

    // --- Compute letterbox transform (base) ---
    const baseScale = scale; // set by resize()
    // Zoomed scale: multiply by zoomFactor
    const renderScale = baseScale * zoomFactor;

    // Compute ox/oy:
    // Without zoom: centers the 960×540 virtual field on canvas.
    // With zoom: we want zoomFocusX (virtual x) to map to canvas center.
    // canvas center = canvas.width/2, canvas.height/2
    // Under zoom: virtual point (focusX, FC.VH/2) → screen (renderScale*focusX + ox, renderScale*VH/2 + oy)
    // We want that to equal (canvas.width/2, canvas.height/2).
    // So: ox = canvas.width/2  - renderScale * zoomFocusX
    //     oy = canvas.height/2 - renderScale * (FC.VH / 2)
    // But apply shake on top.
    // Fix 5: Apply shake offset in screen px using the BASE scale (not zoomed renderScale)
    // so the shake amplitude stays constant and doesn't jump 25% during KO zoom.
    let ox, oy;
    if (zoomFactor > 1.001) {
      ox = canvas.width  / 2 - renderScale * zoomFocusX + sh.x * baseScale;
      oy = canvas.height / 2 - renderScale * (FC.VH / 2) + sh.y * baseScale;
    } else {
      ox = (canvas.width  - FC.VW * renderScale) / 2 + sh.x * baseScale;
      oy = (canvas.height - FC.VH * renderScale) / 2 + sh.y * baseScale;
    }

    ctx.setTransform(renderScale, 0, 0, renderScale, ox, oy);
    ArtStages.draw(ctx, stageIndex, FC.VW, FC.VH, performance.now() * 0.06);
    if (kate && bungus) {
      // Draw projectiles behind fighters
      for (const p of projectiles) {
        ctx.fillStyle = p.owner === 'kate' ? '#5ad4ff' : '#9bbf4a';
        ctx.beginPath(); ctx.arc(p.x, p.y - 60, 16, 0, Math.PI * 2); ctx.fill();
      }
      ArtBungus.draw(ctx, bungus);
      ArtKate.draw(ctx, kate);
      ArtFX.drawSparks(ctx);
      // Fix 3: Pass physical canvas dimensions so overlays cover the full canvas
      // (identity transform is set inside these functions before filling).
      ArtFX.drawFlash(ctx, canvas.width, canvas.height);
      // Super cinematic overlay (vignette + flash)
      if (ArtFX.superCinematicActive()) ArtFX.drawSuperCinematic(ctx, canvas.width, canvas.height);
      if (match && (state === 'fight' || state === 'end')) {
        ArtFX.drawHUD(ctx, kate, bungus, match, FC.VW, FC.VH);
        ArtFX.banner(ctx, match, FC.VW, FC.VH);
      }
    }
  }

  // ---- Mute button ----
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    if (window.Sound) Sound.setMuted(muted);
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
