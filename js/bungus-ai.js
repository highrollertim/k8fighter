// js/bungus-ai.js — reactive opponent AI. Pure decision fn. Dual export.
(function (root) {
  'use strict';

  const DIFFICULTY = {
    reactFrames: 12, blockProb: 0.35, antiAirProb: 0.30, aggression: 0.42,
    specialProb: 0.18, throwProb: 0.12, slamProb: 0.15, idleJitter: 0.08,
  };

  function towardDir(b, k, down) {
    const fwd = k.x >= b.x ? 6 : 4;
    return down ? (fwd === 6 ? 3 : 1) : fwd;
  }
  function awayDir(b, k) { return k.x >= b.x ? 4 : 6; }
  function kateAttacking(k) { return k.state === 'attack' || k.state === 'jump'; }

  function decide(b, k, rng, diff, frame) {
    const out = { dir: 5, jump: false, attack: null };
    if (b.state === 'attack' || b.state === 'hitstun' || b.state === 'blockstun' || b.state === 'knockdown') {
      return out;
    }
    const dist = Math.abs(k.x - b.x);
    const inRange = dist < 86;
    const close = dist < 60;

    if (!k.onGround && dist < 120) {
      if (rng() < diff.antiAirProb) { out.attack = { button: 'A', heavy: true }; return out; }
      out.dir = awayDir(b, k); return out;
    }

    if (kateAttacking(k) && dist < 110 && rng() < diff.blockProb) {
      out.dir = (k.x >= b.x) ? 1 : 3;   // down-away = crouch-block, covers lows + mids
      return out;
    }

    if (inRange) {
      if (close && (k.state === 'block' || k.state === 'blockstun' || k.state === 'crouch')) {
        const r = rng();
        if (r < diff.throwProb) { out.attack = { throw: true }; return out; }
        if (r < diff.throwProb + diff.slamProb) { out.attack = { button: 'A', special: 'bungus.slam' }; return out; }
      }
      if (rng() < diff.aggression) {
        if (rng() < diff.specialProb) out.attack = { button: 'A', special: 'bungus.bite' };
        else out.attack = { button: rng() < 0.5 ? 'A' : 'S', heavy: rng() < 0.3 };
        return out;
      }
      out.dir = rng() < 0.5 ? awayDir(b, k) : towardDir(b, k, false);
      return out;
    }

    if (dist > 260 && rng() < diff.specialProb) { out.attack = { button: 'A', special: 'bungus.spore' }; return out; }
    if (rng() < diff.idleJitter) { out.dir = 5; return out; }
    out.dir = towardDir(b, k, false);
    return out;
  }

  const API = { DIFFICULTY, decide };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.BungusAI = API;
})(typeof window !== 'undefined' ? window : globalThis);
