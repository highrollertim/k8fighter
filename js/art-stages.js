(function (root) {
  'use strict';
  function draw(ctx, stageIndex, vw, vh) {
    ctx.fillStyle = '#21202a'; ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = '#15141b'; ctx.fillRect(0, root.FC.FLOOR_Y, vw, vh - root.FC.FLOOR_Y);
  }
  root.ArtStages = { draw, COUNT: 1 };
})(window);
