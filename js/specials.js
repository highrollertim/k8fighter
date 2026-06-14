// js/specials.js — special-move motion mapping + projectile model. Dual export.
(function (root) {
  'use strict';
  const Input = (typeof module !== 'undefined') ? require('./input.js') : root.Input;
  const Moves = (typeof module !== 'undefined') ? require('./moves.js') : root.Moves;
  const FC = (typeof module !== 'undefined') ? require('./constants.js') : root.FC;

  // priority order: supers first, then fireball before uppercut so double-QCF
  // without meter falls back to fireball (DP [6,2,3] does not contain a QCF).
  const SPECIALS = [
    { key: 'kate.super', motion: [2,3,6,2,3,6], button: 'A', super: true },
    { key: 'kate.fireball', motion: [2,3,6], button: 'A' },
    { key: 'kate.uppercut', motion: [6,2,3], button: 'A' },
    { key: 'kate.spinkick', motion: [2,1,4], button: 'S' },
  ];

  function detect(ms, button, meterFull, frame, facing) {
    for (const s of SPECIALS) {
      if (s.button !== button) continue;
      if (s.super && !meterFull) continue;
      if (Input.matchMotion(ms, s.motion, frame, FC.BUFFER_FRAMES, facing)) return s.key;
    }
    return null;
  }

  function spawnProjectile(key, from) {
    const mv = Moves.TABLE[key];
    return {
      key, owner: key.split('.')[0], x: from.x, y: from.y,
      vx: from.facing * mv.projSpeed, facing: from.facing,
      life: mv.projLife, life0: mv.projLife, dead: false, hit: false,
    };
  }

  function stepProjectile(p) {
    p.x += p.vx; p.life--;
    if (p.life <= 0 || p.x < FC.STAGE_LEFT - 40 || p.x > FC.STAGE_RIGHT + 40) p.dead = true;
  }

  function projectileBox(p) {
    const mv = Moves.TABLE[p.key];
    return { x: p.x - mv.box.w / 2, y: p.y - mv.box.y - mv.box.h, w: mv.box.w, h: mv.box.h };
  }

  const API = { SPECIALS, detect, spawnProjectile, stepProjectile, projectileBox };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Specials = API;
})(typeof window !== 'undefined' ? window : globalThis);
