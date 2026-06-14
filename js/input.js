// js/input.js — keyboard state + numpad/motion detection. Dual export.
(function (root) {
  'use strict';

  function dirFromKeys(k) {
    let x = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    let y = (k.down ? 1 : 0) - (k.up ? 1 : 0);   // down is +1 (numpad bottom row)
    if (x === 0 && y === 0) return 5;
    if (x === 1 && y === 0) return 6;
    if (x === -1 && y === 0) return 4;
    if (x === 0 && y === 1) return 2;
    if (x === 0 && y === -1) return 8;
    if (x === 1 && y === 1) return 3;
    if (x === -1 && y === 1) return 1;
    if (x === 1 && y === -1) return 9;
    if (x === -1 && y === -1) return 7;
    return 5;
  }

  function mirrorDir(d) {
    const map = { 7: 9, 8: 8, 9: 7, 4: 6, 5: 5, 6: 4, 1: 3, 2: 2, 3: 1 };
    return map[d];
  }

  function createMotion() { return { hist: [] }; }

  function pushDir(ms, d, frame) {
    const last = ms.hist[ms.hist.length - 1];
    if (!last || last.d !== d) ms.hist.push({ d, f: frame });
    if (ms.hist.length > 18) ms.hist.shift();
  }

  // seq is defined facing-right; mirror it when facing === -1.
  function matchMotion(ms, seq, frame, bufferFrames, facing) {
    const want = facing === -1 ? seq.map(mirrorDir) : seq.slice();
    let si = want.length - 1;
    for (let i = ms.hist.length - 1; i >= 0 && si >= 0; i--) {
      if (frame - ms.hist[i].f > bufferFrames) break;
      if (ms.hist[i].d === want[si]) si--;
    }
    return si < 0;
  }

  // Browser key listener (no-op under node). Tracks held arrows + button edges.
  function attach(target) {
    const keys = {};
    const edges = {};            // one-shot pressed flags
    const MAP = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      KeyA: 'A', KeyS: 'S', Space: 'jump', Enter: 'enter', KeyH: 'help', Escape: 'esc',
      KeyD: 'spFire', KeyF: 'spUpper', KeyE: 'spSpin', KeyW: 'spSuper',
    };
    target.addEventListener('keydown', (e) => {
      const name = MAP[e.code]; if (!name) return;
      if (['left','right','up','down','jump','enter','help','esc','spFire','spUpper','spSpin','spSuper'].includes(name)) e.preventDefault();
      if (!keys[name]) edges[name] = true;     // rising edge
      keys[name] = true;
    });
    target.addEventListener('keyup', (e) => {
      const name = MAP[e.code]; if (!name) return;
      keys[name] = false;
    });
    return {
      keys, edges,
      consumeEdge(name) { const v = !!edges[name]; edges[name] = false; return v; },
      arrows() { return { left: keys.left, right: keys.right, up: keys.up, down: keys.down }; },
    };
  }

  const API = { dirFromKeys, mirrorDir, createMotion, pushDir, matchMotion, attach };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Input = API;
})(typeof window !== 'undefined' ? window : globalThis);
