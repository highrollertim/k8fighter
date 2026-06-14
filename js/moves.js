// js/moves.js — move frame data. Dual export. (Expanded in later tasks.)
(function (root) {
  'use strict';
  // box: {x: forward dist from center, y: height above feet, w, h}
  const TABLE = {
    // --- Kate normals (light = tap, heavy = hold) ---
    'kate.LP': { key:'kate.LP', startup:3, active:3, recovery:7, damage:4, hitstun:14, blockstun:9, hitKB:3, blockPush:2, height:'mid', knockdown:false, meterGain:4, chip:0, cancelable:true, box:{x:34,y:78,w:36,h:18}, hits:1 },
    'kate.HP': { key:'kate.HP', startup:7, active:4, recovery:16, damage:9, hitstun:20, blockstun:14, hitKB:6, blockPush:4, height:'mid', knockdown:false, meterGain:7, chip:0, cancelable:true, box:{x:40,y:84,w:46,h:22}, hits:1 },
    'kate.LK': { key:'kate.LK', startup:4, active:3, recovery:9, damage:5, hitstun:14, blockstun:9, hitKB:3, blockPush:2, height:'mid', knockdown:false, meterGain:4, chip:0, cancelable:true, box:{x:38,y:46,w:42,h:18}, hits:1 },
    'kate.HK': { key:'kate.HK', startup:9, active:4, recovery:18, damage:11, hitstun:22, blockstun:15, hitKB:7, blockPush:5, height:'mid', knockdown:true, meterGain:8, chip:0, cancelable:false, box:{x:46,y:60,w:52,h:24}, hits:1 },
    'kate.cLP': { key:'kate.cLP', startup:3, active:3, recovery:8, damage:4, hitstun:13, blockstun:9, hitKB:2, blockPush:2, height:'mid', knockdown:false, meterGain:4, chip:0, cancelable:true, box:{x:32,y:40,w:34,h:16}, hits:1 },
    'kate.cLK': { key:'kate.cLK', startup:4, active:3, recovery:10, damage:5, hitstun:13, blockstun:9, hitKB:2, blockPush:2, height:'low', knockdown:false, meterGain:4, chip:0, cancelable:true, box:{x:38,y:14,w:46,h:14}, hits:1 },
    'kate.jP': { key:'kate.jP', startup:3, active:8, recovery:4, damage:7, hitstun:16, blockstun:11, hitKB:3, blockPush:2, height:'overhead', knockdown:false, meterGain:5, chip:0, cancelable:false, box:{x:20,y:8,w:60,h:56}, hits:1 },
    'kate.jK': { key:'kate.jK', startup:3, active:10, recovery:5, damage:8, hitstun:16, blockstun:11, hitKB:4, blockPush:3, height:'overhead', knockdown:false, meterGain:5, chip:0, cancelable:false, box:{x:18,y:6,w:72,h:68}, hits:1 },
    'kate.throw': { key:'kate.throw', startup:2, active:2, recovery:20, damage:12, hitstun:0, blockstun:0, hitKB:9, blockPush:0, height:'throw', knockdown:true, meterGain:6, chip:0, cancelable:false, box:null, hits:1 },

    // --- Bungus normals ---
    'bungus.swipe': { key:'bungus.swipe', startup:10, active:5, recovery:20, damage:10, hitstun:20, blockstun:14, hitKB:6, blockPush:4, height:'mid', knockdown:false, meterGain:6, chip:0, cancelable:false, box:{x:48,y:70,w:58,h:26}, hits:1 },
    'bungus.LP':    { key:'bungus.LP', startup:5, active:3, recovery:10, damage:5, hitstun:14, blockstun:9, hitKB:3, blockPush:2, height:'mid', knockdown:false, meterGain:4, chip:0, cancelable:false, box:{x:40,y:74,w:40,h:20}, hits:1 },
    'bungus.LK':    { key:'bungus.LK', startup:6, active:3, recovery:12, damage:6, hitstun:14, blockstun:9, hitKB:3, blockPush:2, height:'low', knockdown:false, meterGain:4, chip:0, cancelable:false, box:{x:44,y:16,w:50,h:16}, hits:1 },
    'bungus.throw': { key:'bungus.throw', startup:3, active:2, recovery:22, damage:13, hitstun:0, blockstun:0, hitKB:9, blockPush:0, height:'throw', knockdown:true, meterGain:6, chip:0, cancelable:false, box:null, hits:1 },
    // --- Kate specials ---
    'kate.fireball': { key:'kate.fireball', startup:11, active:2, recovery:26, damage:0, hitstun:0, blockstun:0, hitKB:0, blockPush:3, height:'mid', knockdown:false, meterGain:6, chip:0, cancelable:false, box:null, hits:1, projectile:'kate.proj' },
    'kate.proj': { key:'kate.proj', startup:0, active:1, recovery:0, damage:8, hitstun:18, blockstun:12, hitKB:5, blockPush:3, height:'mid', knockdown:false, meterGain:0, chip:2, cancelable:false, box:{x:0,y:60,w:40,h:34}, hits:1, projSpeed:7, projLife:90 },
    'kate.uppercut': { key:'kate.uppercut', startup:5, active:8, recovery:24, damage:12, hitstun:24, blockstun:14, hitKB:5, blockPush:4, height:'mid', knockdown:true, meterGain:8, chip:2, cancelable:false, box:{x:30,y:60,w:40,h:80}, hits:1 },
    'kate.spinkick': { key:'kate.spinkick', startup:8, active:14, recovery:20, damage:12, hitstun:18, blockstun:12, hitKB:4, blockPush:3, height:'mid', knockdown:false, meterGain:8, chip:2, cancelable:false, box:{x:42,y:50,w:54,h:40}, hits:3 },
    'kate.super': { key:'kate.super', startup:6, active:24, recovery:30, damage:30, hitstun:24, blockstun:18, hitKB:8, blockPush:5, height:'mid', knockdown:true, meterGain:0, chip:5, cancelable:false, box:{x:40,y:50,w:64,h:80}, hits:6 },
    // --- Bungus specials ---
    'bungus.spore': { key:'bungus.spore', startup:14, active:2, recovery:28, damage:0, hitstun:0, blockstun:0, hitKB:0, blockPush:3, height:'mid', knockdown:false, meterGain:5, chip:0, cancelable:false, box:null, hits:1, projectile:'bungus.sporeproj' },
    'bungus.sporeproj': { key:'bungus.sporeproj', startup:0, active:1, recovery:0, damage:7, hitstun:16, blockstun:11, hitKB:3, blockPush:2, height:'mid', knockdown:false, meterGain:0, chip:2, cancelable:false, box:{x:0,y:56,w:44,h:40}, hits:1, projSpeed:4, projLife:110 },
    'bungus.bite': { key:'bungus.bite', startup:12, active:6, recovery:22, damage:11, hitstun:20, blockstun:13, hitKB:5, blockPush:4, height:'mid', knockdown:false, meterGain:6, chip:2, cancelable:false, box:{x:46,y:64,w:56,h:30}, hits:1, lunge:9 },
    'bungus.slam': { key:'bungus.slam', startup:16, active:8, recovery:24, damage:13, hitstun:0, blockstun:14, hitKB:5, blockPush:4, height:'overhead', knockdown:true, meterGain:7, chip:3, cancelable:false, box:{x:20,y:0,w:70,h:50}, hits:1 },
  };
  const API = { TABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Moves = API;
})(typeof window !== 'undefined' ? window : globalThis);
