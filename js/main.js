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

  function playerIntent() {
    const dir = Input.dirFromKeys(input.arrows());
    Input.pushDir(kMotion, dir, frame);
    let attack = null;
    if (input.consumeEdge('A')) attack = { button: 'A', heavy: false, special: null, throw: input.keys.S };
    else if (input.consumeEdge('S')) attack = { button: 'S', heavy: false, special: null, throw: input.keys.A };
    const jump = input.consumeEdge('jump');
    return { dir, jump, attack };
  }

  function busy(f) { return f.state === 'attack' || f.state === 'hitstun' || f.state === 'knockdown' || f.state === 'blockstun'; }

  function applyAttack(f, intent, opp) {
    if (!intent.attack || busy(f)) return;
    const crouch = (intent.dir === 1 || intent.dir === 2 || intent.dir === 3);
    const air = !f.onGround;
    let key;
    if (air) key = intent.attack.button === 'A' ? 'kate.jP' : 'kate.jK';
    else if (crouch) key = intent.attack.button === 'A' ? 'kate.cLP' : 'kate.cLK';
    else key = intent.attack.button === 'A' ? 'kate.LP' : 'kate.LK';
    if (air) { f.move = key; f.state = 'attack'; f.stateFrame = 0; f.hitThisMove = false; }
    else Fighter.start(f, key);
  }

  function sim() {
    frame++;
    const pi = playerIntent();
    kate.blockingLow = kate.onGround && (pi.dir === 1 || pi.dir === 3) && (kate.state === 'crouch');
    applyAttack(kate, pi, bungus);
    Fighter.step(kate, pi, bungus);
    Fighter.step(bungus, { dir: 5, jump: false, attack: null }, kate); // dummy
    const ev = Combat.resolve(kate, bungus);
    if (ev) ArtFX.hitSpark(ev);
    Combat.resolve(bungus, kate);
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
