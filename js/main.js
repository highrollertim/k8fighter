// js/main.js — boot, fixed-timestep loop, wiring.
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const titleEl = document.getElementById('overlay-title');
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

  function newMatch() {
    kate = Fighter.create('kate', FC.VW / 2 - FC.START_GAP, 1);
    bungus = Fighter.create('bungus', FC.VW / 2 + FC.START_GAP, -1);
    state = 'fight';
    titleEl.classList.add('hidden'); titleEl.setAttribute('aria-hidden', 'true');
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

  function applyAttack(f, intent, opp) {
    if (!intent.attack || busy(f)) return;
    if (intent.attack.throw) {
      const ev = Combat.tryThrow(f, opp, MoveSelect.throwKey(f.id));
      if (ev && window.ArtFX) ArtFX.hitSpark(ev);
      Fighter.start(f, MoveSelect.throwKey(f.id));
      return;
    }
    const key = MoveSelect.normalKey(f, { dir: intent.dir, heavy: intent.attack.heavy, button: intent.attack.button });
    if (!f.onGround) { f.move = key; f.state = 'attack'; f.stateFrame = 0; f.hitThisMove = false; f.vx = 0; }
    else Fighter.start(f, key);
  }

  function sim() {
    frame++;
    const pi = playerIntent();
    applyAttack(kate, pi, bungus);
    Fighter.step(kate, pi, bungus);
    kate.blockingLow = kate.onGround && kate.state === 'crouch' && ((kate.facing === 1 && pi.dir === 1) || (kate.facing === -1 && pi.dir === 3));
    Fighter.step(bungus, { dir: 5, jump: false, attack: null }, kate); // dummy
    const ev1 = Combat.resolve(kate, bungus);
    if (ev1 && window.ArtFX) ArtFX.hitSpark(ev1);
    const ev2 = Combat.resolve(bungus, kate);
    if (ev2 && window.ArtFX) ArtFX.hitSpark(ev2);
    if (bungus.health <= 0 || kate.health <= 0) state = 'ko';
  }

  let acc = 0, last = 0;
  function frameLoop(t) {
    const dt = Math.min((t - last) / 1000 || 0, 0.1); last = t;
    if (state === 'fight') { acc += dt; let steps = 0; while (acc >= FC.DT && steps < 5) { sim(); acc -= FC.DT; steps++; } }
    render(t);
    requestAnimationFrame(frameLoop);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ox = (canvas.width - FC.VW * scale) / 2, oy = (canvas.height - FC.VH * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    ArtStages.draw(ctx, 0, FC.VW, FC.VH);
    if (kate && bungus) {
      ArtBungus.draw(ctx, bungus); ArtKate.draw(ctx, kate);
      ArtFX.drawHealth(ctx, kate, bungus, FC.VW);
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && (state === 'title' || state === 'ko')) newMatch();
  });
  requestAnimationFrame(frameLoop);
})();
