// js/moves.js — move frame data. Dual export. (Expanded in later tasks.)
(function (root) {
  'use strict';
  // box: {x: forward dist from center, y: height above feet, w, h}
  const TABLE = {
    'kate.LP': { key: 'kate.LP', startup: 3, active: 3, recovery: 7,
      damage: 4, hitstun: 14, blockstun: 9, hitKB: 3, blockPush: 2,
      height: 'mid', knockdown: false, meterGain: 4, chip: 0, cancelable: true,
      box: { x: 34, y: 78, w: 36, h: 18 }, hits: 1 },
  };
  const API = { TABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Moves = API;
})(typeof window !== 'undefined' ? window : globalThis);
