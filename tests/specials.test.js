'use strict';
const Input = require('../js/input.js');
const Specials = require('../js/specials.js');
let fails = 0;
function ok(c, m) { if (c) console.log('ok - ' + m); else { fails++; console.error('FAIL - ' + m); } }
function feed(seq) { const ms = Input.createMotion(); seq.forEach((d, i) => Input.pushDir(ms, d, i)); return ms; }

let ms = feed([2, 3, 6]);
ok(Specials.detect(ms, 'A', false, 2, 1) === 'kate.fireball', 'QCF+A = fireball');
ms = feed([6, 2, 3]);
ok(Specials.detect(ms, 'A', false, 2, 1) === 'kate.uppercut', 'DP+A = uppercut');
ms = feed([2, 1, 4]);
ok(Specials.detect(ms, 'S', false, 2, 1) === null, 'spin kick removed: QCB+S maps to no special');
ms = feed([2, 3, 6, 2, 3, 6]);
ok(Specials.detect(ms, 'A', true, 5, 1) === 'kate.super', 'double-QCF+A (meter) = super');
ok(Specials.detect(ms, 'A', false, 5, 1) === 'kate.fireball', 'double-QCF+A without meter falls back to fireball');
ms = feed([2, 3, 6]);
ok(Specials.detect(ms, 'S', false, 2, 1) === null, 'QCF+S is not a Kate special');

const p = Specials.spawnProjectile('kate.proj', { x: 300, y: 470, facing: 1 });
ok(p.x === 300 && p.vx > 0 && p.life > 0 && p.owner === 'kate', 'projectile spawns moving forward');
Specials.stepProjectile(p);
ok(p.x > 300 && p.life === p.life0 - 1, 'projectile advances and ages');

if (fails) { console.error(fails + ' failed'); process.exit(1); }
console.log('All specials tests passed.');
