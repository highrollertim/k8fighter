(function (root) {
  'use strict';
  function drawHealth(ctx, kate, bungus, vw) {
    const bar = (x, val, flip) => {
      const w = 360, h = 22, y = 24;
      const bx = flip ? vw - x - w : x;
      ctx.fillStyle = '#000'; ctx.fillRect(bx, y, w, h);
      ctx.fillStyle = '#d4ff5a';
      const fw = w * Math.max(0, val) / root.FC.MAX_HEALTH;
      ctx.fillRect(flip ? bx + w - fw : bx, y, fw, h);
      ctx.strokeStyle = '#fff'; ctx.strokeRect(bx, y, w, h);
    };
    bar(24, kate.health, false);
    bar(24, bungus.health, true);
  }
  root.ArtFX = { drawHealth, hitSpark() {}, drawMeter() {}, banner() {}, step() {} };
})(window);
