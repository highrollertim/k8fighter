(function (root) {
  'use strict';
  function draw(ctx, f) {
    ctx.fillStyle = f.state === 'attack' ? '#e7a' : '#d97757';
    const h = (f.state === 'crouch') ? 56 : 96;
    ctx.fillRect(f.x - 22, f.y - h, 44, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(f.x + (f.facing * 10) - 3, f.y - h + 12, 6, 6);   // facing pip
    const hb = window.Combat && window.Combat.activeHitbox(f);
    if (hb) { ctx.strokeStyle = '#ff5a5a'; ctx.strokeRect(hb.x, hb.y, hb.w, hb.h); }
  }
  root.ArtKate = { draw };
})(window);
