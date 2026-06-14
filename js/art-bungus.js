(function (root) {
  'use strict';
  function draw(ctx, f) {
    ctx.fillStyle = f.state === 'attack' ? '#9bbf4a' : '#79896a';
    const h = (f.state === 'crouch') ? 56 : 96;
    ctx.fillRect(f.x - 26, f.y - h, 52, h);
    const hb = window.Combat && window.Combat.activeHitbox(f);
    if (hb) { ctx.strokeStyle = '#ff5a5a'; ctx.strokeRect(hb.x, hb.y, hb.w, hb.h); }
  }
  root.ArtBungus = { draw };
})(window);
