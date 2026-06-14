// js/fighter.js — movement, gravity, facing, state timing. Dual export.
(function (root) {
  'use strict';
  const FC = (typeof module !== 'undefined') ? require('./constants.js') : root.FC;
  const Moves = (typeof module !== 'undefined') ? require('./moves.js') : root.Moves;

  function create(id, x, facing) {
    return {
      id, x, y: FC.FLOOR_Y, vx: 0, vy: 0, facing, onGround: true,
      state: 'idle', stateFrame: 0, move: null, hitThisMove: false,
      health: FC.MAX_HEALTH, meter: 0, comboCount: 0, hitstop: 0,
    };
  }

  function start(f, moveKey) {
    f.state = 'attack'; f.move = moveKey; f.stateFrame = 0; f.hitThisMove = false;
    f.vx = 0;
  }

  function applyHit(f, mv, fromX) {
    f.health = Math.max(0, f.health - mv.damage);
    f.state = mv.knockdown ? 'knockdown' : 'hitstun';
    f.stateFrame = 0; f.move = null;
    f._stunBudget = mv.hitstun;
    const dir = f.x < fromX ? -1 : 1;            // pushed away from attacker
    f.vx = dir * mv.hitKB;
    f.meter = Math.min(FC.MAX_METER, f.meter + Math.round(mv.meterGain / 2));
    if (mv.knockdown) { f.vy = -8; f.onGround = false; }
  }

  function applyBlock(f, mv, fromX) {
    if (mv.chip) f.health = Math.max(0, f.health - mv.chip);
    f.state = 'blockstun'; f.stateFrame = 0; f.move = null;
    f._stunBudget = mv.blockstun;
    const dir = f.x < fromX ? -1 : 1;
    f.vx = dir * mv.blockPush;
    f.meter = Math.min(FC.MAX_METER, f.meter + 1);
  }

  function maybeFaceOpponent(f, opp) {
    f.facing = (opp.x >= f.x) ? 1 : -1;
  }

  function step(f, intent, opp) {
    if (f.hitstop > 0) { f.hitstop--; return; }

    if (f.state === 'attack') {
      const mv = Moves.TABLE[f.move];
      f.stateFrame++;
      f.vx *= 0.8;
      f.x += f.vx;
      if (f.stateFrame >= mv.startup + mv.active + mv.recovery) {
        f.state = 'idle'; f.move = null;
      }
      clampWall(f);
      return;
    }
    if (f.state === 'hitstun' || f.state === 'blockstun') {
      f.stateFrame++;
      f.vx *= 0.85; f.x += f.vx;
      const budget = f.state === 'hitstun' ? (f._stunBudget || 14) : (f._stunBudget || 9);
      if (f.stateFrame >= budget) { f.state = 'idle'; f.vx = 0; }
      clampWall(f);
      return;
    }
    if (f.state === 'knockdown') {
      f.stateFrame++;
      if (!f.onGround) { f.vy += FC.GRAVITY; f.y += f.vy; if (f.y >= FC.FLOOR_Y) { f.y = FC.FLOOR_Y; f.vy = 0; f.onGround = true; f.stateFrame = 0; } }
      f.x += f.vx; f.vx *= 0.9;
      if (f.onGround && f.stateFrame >= 28) { f.state = 'idle'; f.vx = 0; }
      clampWall(f);
      return;
    }

    if (!f.onGround) {
      f.vy += FC.GRAVITY; f.y += f.vy; f.x += f.vx;
      if (f.y >= FC.FLOOR_Y) { f.y = FC.FLOOR_Y; f.vy = 0; f.vx = 0; f.onGround = true; f.state = 'idle'; }
      clampWall(f);
      return;
    }

    maybeFaceOpponent(f, opp);
    const fwd = f.facing;
    const toward = (intent.dir === 6 || intent.dir === 9 || intent.dir === 3) ? 1
                 : (intent.dir === 4 || intent.dir === 7 || intent.dir === 1) ? -1 : 0;
    const towardOpp = toward === fwd;
    const awayOpp = toward === -fwd;
    const down = (intent.dir === 1 || intent.dir === 2 || intent.dir === 3);
    const up = (intent.dir === 7 || intent.dir === 8 || intent.dir === 9);

    if (intent.jump || up) {
      f.onGround = false; f.vy = FC.JUMP_VY;
      f.vx = towardOpp ? fwd * 4 : awayOpp ? -fwd * 4 : 0;
      f.state = 'jump'; f.stateFrame = 0;
      return;
    }
    if (down) { f.stateFrame = (f.state === 'crouch') ? f.stateFrame + 1 : 0; f.state = 'crouch'; f.vx = 0; return; }
    if (towardOpp) {
      f.state = 'walkF'; f.x += fwd * FC.WALK_SPEED;
    } else if (awayOpp) {
      f.state = 'block'; f.x += -fwd * FC.BACK_SPEED;
    } else {
      f.state = 'idle';
    }
    f.stateFrame = (f.state === 'idle') ? f.stateFrame + 1 : 0;
    separate(f, opp);
    clampWall(f);
  }

  function clampWall(f) {
    if (f.x < FC.STAGE_LEFT) f.x = FC.STAGE_LEFT;
    if (f.x > FC.STAGE_RIGHT) f.x = FC.STAGE_RIGHT;
  }

  function separate(f, opp) {
    const dx = f.x - opp.x;
    const min = FC.PUSH_HALF_W * 2;
    if (Math.abs(dx) < min && opp.onGround && f.onGround) {
      const push = (min - Math.abs(dx)) / 2;
      const s = dx >= 0 ? 1 : -1;
      f.x += s * push;
      opp.x -= s * push;
    }
  }

  const API = { create, start, step, applyHit, applyBlock, maybeFaceOpponent };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Fighter = API;
})(typeof window !== 'undefined' ? window : globalThis);
