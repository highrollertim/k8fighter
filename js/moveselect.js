// js/moveselect.js — map (fighter, attack intent) -> move key. Pure. Dual export.
(function (root) {
  'use strict';
  function crouching(dir) { return dir === 1 || dir === 2 || dir === 3; }

  function normalKey(f, intent) {
    const id = f.id;
    if (id === 'bungus') {
      if (!f.onGround) return intent.button === 'A' ? 'bungus.LP' : 'bungus.LK';
      if (intent.heavy && intent.button === 'A') return 'bungus.swipe';
      return intent.button === 'A' ? 'bungus.LP' : 'bungus.LK';
    }
    if (!f.onGround) return intent.button === 'A' ? 'kate.jP' : 'kate.jK';
    if (crouching(intent.dir)) return intent.button === 'A' ? 'kate.cLP' : 'kate.cLK';
    if (intent.heavy) return intent.button === 'A' ? 'kate.HP' : 'kate.HK';
    return intent.button === 'A' ? 'kate.LP' : 'kate.LK';
  }

  function throwKey(id) { return id + '.throw'; }

  const API = { normalKey, throwKey, crouching };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.MoveSelect = API;
})(typeof window !== 'undefined' ? window : globalThis);
