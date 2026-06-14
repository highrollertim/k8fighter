// js/combat.js — hitbox/hurtbox resolution, blocking, throws. Pure. Dual export.
(function (root) {
  'use strict';
  const FC = (typeof module !== 'undefined') ? require('./constants.js') : root.FC;
  const Moves = (typeof module !== 'undefined') ? require('./moves.js') : root.Moves;
  const Fighter = (typeof module !== 'undefined') ? require('./fighter.js') : root.Fighter;

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function worldBox(f, box) {
    const x = f.facing === 1 ? f.x + box.x - box.w / 2 + 14 : f.x - box.x - box.w / 2 - 14;
    const y = f.y - box.y - box.h;
    return { x, y, w: box.w, h: box.h };
  }

  function hurtbox(f) {
    const h = 96;
    return { x: f.x - FC.PUSH_HALF_W, y: f.y - h, w: FC.PUSH_HALF_W * 2, h };
  }

  function activeHitbox(f) {
    if (f.state !== 'attack' || !f.move) return null;
    const mv = Moves.TABLE[f.move];
    if (!mv.box) return null;
    if (f.stateFrame < mv.startup || f.stateFrame >= mv.startup + mv.active) return null;
    return worldBox(f, mv.box);
  }

  function blocks(def, mv) {
    const standingBlock = def.state === 'block' || def.state === 'blockstun';
    const crouchBlock = (def.state === 'crouch' && def.blockingLow);
    if (!standingBlock && !crouchBlock) return false;
    if (mv.height === 'throw') return false;
    if (mv.height === 'low') return crouchBlock;
    if (mv.height === 'overhead') return standingBlock;
    return standingBlock || crouchBlock;
  }

  function resolve(att, def) {
    const hb = activeHitbox(att);
    if (!hb || att.hitThisMove) return null;
    if (!aabb(hb, hurtbox(def))) return null;
    const mv = Moves.TABLE[att.move];
    att.hitThisMove = true;
    att.meter = Math.min(FC.MAX_METER, att.meter + mv.meterGain);
    if (blocks(def, mv)) {
      Fighter.applyBlock(def, mv, att.x);
      return { type: 'block', move: mv, attacker: att, defender: def };
    }
    Fighter.applyHit(def, mv, att.x);
    att.hitstop = mv.knockdown ? FC.HITSTOP_HEAVY : FC.HITSTOP;
    def.hitstop = att.hitstop;
    return { type: 'hit', move: mv, attacker: att, defender: def };
  }

  function applyProjectileHit(p, def) {
    if (p.hit || p.dead) return null;
    const mv = Moves.TABLE[p.key];
    const box = require_box(p);
    if (!box || !aabb(box, hurtbox(def))) return null;
    p.hit = true; p.dead = true;
    if (blocks(def, mv)) { Fighter.applyBlock(def, mv, p.x); return { type:'block', move:mv, defender:def, projectile:true }; }
    Fighter.applyHit(def, mv, p.x); def.hitstop = FC.HITSTOP;
    return { type:'hit', move:mv, defender:def, projectile:true };
  }
  function require_box(p) {
    const S = (typeof root !== 'undefined' && root.Specials) ? root.Specials
            : (typeof require !== 'undefined' ? require('./specials.js') : null);
    return S ? S.projectileBox(p) : null;
  }

  function tryThrow(att, def, throwKey) {
    if (!att.onGround || !def.onGround) return null;
    if (def.state === 'hitstun' || def.state === 'knockdown' || def.state === 'attack') return null;
    if (Math.abs(att.x - def.x) > FC.PUSH_HALF_W * 2 + 16) return null;
    const mv = Moves.TABLE[throwKey];
    Fighter.applyHit(def, mv, att.x);
    def.state = 'knockdown'; def.stateFrame = 0;
    def.x = att.x + att.facing * (FC.PUSH_HALF_W * 2);
    return { type: 'throw', move: mv, attacker: att, defender: def };
  }

  const API = { aabb, worldBox, hurtbox, activeHitbox, blocks, resolve, applyProjectileHit, tryThrow };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Combat = API;
})(typeof window !== 'undefined' ? window : globalThis);
