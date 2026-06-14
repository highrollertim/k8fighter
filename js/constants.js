// js/constants.js — shared constants & tuning. Dual export (node + browser).
(function (root) {
  'use strict';
  const C = {
    VW: 960, VH: 540, FLOOR_Y: 470,
    FPS: 60, DT: 1 / 60,
    GRAVITY: 0.9,            // +vy per frame while airborne
    JUMP_VY: -15,            // initial jump velocity
    WALK_SPEED: 3.2,         // px/frame
    BACK_SPEED: 2.6,
    STAGE_LEFT: 70, STAGE_RIGHT: 890,   // clamp for fighter center x
    PUSH_HALF_W: 28,         // pushbox half-width
    START_GAP: 150,          // half the initial distance between fighters
    MAX_HEALTH: 100, MAX_METER: 100,
    ROUND_TIME: 60,          // seconds
    ROUNDS_TO_WIN: 2,
    HEAVY_HOLD: 7,           // frames a button must be held to be "heavy"
    BUFFER_FRAMES: 12,       // motion-input buffer window
    HITSTOP: 6,              // freeze frames on a normal connect
    HITSTOP_HEAVY: 10,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
  else root.FC = C;
})(typeof window !== 'undefined' ? window : globalThis);
